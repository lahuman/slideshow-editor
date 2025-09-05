import React from 'react';
import {
  DndContext,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import { Slide } from '../types';
import { DraggableTimelineItem } from './DraggableTimelineItem';

interface TimelineProps {
  timeline: Slide[];
  currentTime: number;
  onTimeChange: (time: number) => void;
  onSlideUpdate: (slideId: number, updates: Partial<Slide>) => void;
  onSlideRemove: (slideId: number) => void;
  onSlideSelect: (slide: Slide) => void;
  selectedSlide: Slide | null;
  onTimelineDragEnd: (event: DragEndEvent) => void;
}

const TRACK_HEIGHT = 60; // pixels
const PIXELS_PER_SECOND = 60; // pixels
const RULER_HEIGHT = 20; // pixels

const Timeline: React.FC<TimelineProps> = ({
  timeline,
  currentTime,
  onTimeChange,
  onSlideUpdate,
  onSlideRemove,
  onSlideSelect,
  selectedSlide,
  onTimelineDragEnd,
}) => {
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 5 },
    })
  );

  const totalDuration = Math.max(30, timeline.reduce((max, slide) => 
    Math.max(max, slide.startTime + slide.duration), 0
  ));
  
  const totalTracks = Math.max(3, timeline.reduce((max, slide) => 
    Math.max(max, slide.track), 0
  ) + 1);

  const handleSlideDurationChange = (slideId: number, newDuration: string): void => {
    const duration = parseFloat(newDuration);
    if (!isNaN(duration)) {
      onSlideUpdate(slideId, { duration: Math.max(0.5, duration) });
    }
  };

  const handleTimelineClick = (e: React.MouseEvent<HTMLDivElement>): void => {
    if (!e.currentTarget.classList.contains('timeline')) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const newTime = x / PIXELS_PER_SECOND;
    onTimeChange(Math.max(0, Math.min(newTime, totalDuration)));
  };

  const renderGrid = () => {
    const lines = [];
    // Vertical lines
    for (let i = 1; i < totalDuration; i++) {
      lines.push(<div key={`v-${i}`} className="grid-line vertical" style={{ left: `${i * PIXELS_PER_SECOND}px`, height: `${totalTracks * TRACK_HEIGHT}px` }} />);
    }
    // Horizontal lines
    for (let i = 1; i < totalTracks; i++) {
      lines.push(<div key={`h-${i}`} className="grid-line horizontal" style={{ top: `${i * TRACK_HEIGHT}px`, width: `${totalDuration * PIXELS_PER_SECOND}px` }} />);
    }
    return lines;
  };

  const renderTimeRuler = () => {
    const markers = [];
    for (let i = 0; i < totalDuration; i++) {
      markers.push(
        <div key={i} className="time-marker" style={{ left: `${i * PIXELS_PER_SECOND}px` }}>
          {i}s
        </div>
      );
    }
    return <div className="time-ruler" style={{height: `${RULER_HEIGHT}px`, width: `${totalDuration * PIXELS_PER_SECOND}px`}}>{markers}</div>;
  };

  return (
    <div className="timeline-container gantt-chart">
      {renderTimeRuler()}
      <DndContext sensors={sensors} onDragEnd={onTimelineDragEnd}>
        <div 
          className="timeline"
          style={{ 
            position: 'relative',
            width: `${totalDuration * PIXELS_PER_SECOND}px`,
            height: `${totalTracks * TRACK_HEIGHT}px`,
          }}
          onClick={handleTimelineClick}
        >
          {renderGrid()}
          <div 
            className="playhead"
            style={{ left: `${currentTime * PIXELS_PER_SECOND}px`, height: `${totalTracks * TRACK_HEIGHT}px` }}
          />
          {timeline.map(slide => (
            <DraggableTimelineItem
              key={slide.id}
              slide={slide}
              pixelsPerSecond={PIXELS_PER_SECOND}
              trackHeight={TRACK_HEIGHT}
              selectedSlide={selectedSlide}
              onSlideSelect={onSlideSelect}
              onSlideRemove={onSlideRemove}
              onSlideDurationChange={handleSlideDurationChange}
            />
          ))}
        </div>
      </DndContext>
    </div>
  );
};

export default Timeline;