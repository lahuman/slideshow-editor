import React from 'react';
import {
  DndContext,
  PointerSensor,
  TouchSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import { Slide, TextSlide } from '../types';
import { DraggableTimelineItem } from './DraggableTimelineItem';
import { DraggableTextTimelineItem } from './DraggableTextTimelineItem';

interface TimelineProps {
  timeline: Slide[];
  textSlides: TextSlide[];
  currentTime: number;
  
  onSlidesUpdate: (slideIds: number[], updates: Partial<Slide>) => void;
  onSlidesRemove: (slideIds: number[]) => void;
  onTextSlidesUpdate: (slideIds: number[], updates: Partial<TextSlide>) => void;
  onTextSlidesRemove: (slideIds: number[]) => void;
  onSlideSelect: (slideId: number, meta: { shift: boolean, ctrl: boolean }) => void;
  onTextSlideSelect: (slideId: number) => void;
  selectedSlideIds: number[];
  selectedTextSlideId: number | null;
  onTimelineDragEnd: (event: DragEndEvent) => void;
}

const TRACK_HEIGHT = 60; // pixels
const PIXELS_PER_SECOND = 60; // pixels
const RULER_HEIGHT = 20; // pixels

const Timeline: React.FC<TimelineProps> = ({
  timeline,
  textSlides,
  currentTime,
  
  onSlidesUpdate,
  onSlidesRemove,
  onTextSlidesUpdate,
  onTextSlidesRemove,
  onSlideSelect,
  onTextSlideSelect,
  selectedSlideIds,
  selectedTextSlideId,
  onTimelineDragEnd,
}) => {
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 5 },
    }),
    useSensor(TouchSensor, {
      activationConstraint: {
        delay: 250,
        tolerance: 5,
      },
    })
  );

  const totalDuration = Math.max(
    30,
    timeline.reduce((max, slide) => Math.max(max, slide.startTime + slide.duration), 0),
    textSlides.reduce((max, slide) => Math.max(max, slide.startTime + slide.duration), 0)
  );
  
  const totalTracks = Math.max(
    3,
    timeline.reduce((max, slide) => Math.max(max, slide.track), 0) + 1,
    textSlides.reduce((max, slide) => Math.max(max, slide.track), 0) + 1
  );

  const handleSlideDurationChange = (slideId: number, newDuration: string): void => {
    const duration = parseFloat(newDuration);
    if (!isNaN(duration)) {
      const clampedDuration = Math.max(1, Math.min(duration, 100));
      // If this slide is part of a multi-selection, update all selected slides
      const idsToUpdate = selectedSlideIds.includes(slideId) ? selectedSlideIds : [slideId];
      onSlidesUpdate(idsToUpdate, { duration: clampedDuration });
    }
  };

  const handleTimelineClick = (e: React.MouseEvent<HTMLDivElement>): void => {
    // Deselect all if clicking on the timeline background
    if (e.target === e.currentTarget) {
        onSlideSelect(0, { shift: false, ctrl: true }); // A bit of a hack to deselect all
    }
  };

  const handleTextSlideDurationChange = (slideId: number, newDuration: string): void => {
    const duration = parseFloat(newDuration);
    if (!isNaN(duration)) {
      const clampedDuration = Math.max(1, Math.min(duration, 100));
      onTextSlidesUpdate([slideId], { duration: clampedDuration });
    }
  };

  const handleTextSlideTextChange = (slideId: number, text: string): void => {
    onTextSlidesUpdate([slideId], { text });
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
              isSelected={selectedSlideIds.includes(slide.id)}
              onSelect={onSlideSelect}
              onRemove={() => onSlidesRemove([slide.id])}
              onDurationChange={handleSlideDurationChange}
            />
          ))}
          {textSlides.map(slide => (
            <DraggableTextTimelineItem
              key={`text-${slide.id}`}
              slide={slide}
              pixelsPerSecond={PIXELS_PER_SECOND}
              trackHeight={TRACK_HEIGHT}
              isSelected={selectedTextSlideId === slide.id}
              onSelect={onTextSlideSelect}
              onRemove={() => onTextSlidesRemove([slide.id])}
              onDurationChange={handleTextSlideDurationChange}
              onTextChange={handleTextSlideTextChange}
            />
          ))}
        </div>
      </DndContext>
    </div>
  );
};

export default Timeline;
