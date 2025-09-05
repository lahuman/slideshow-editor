import React from 'react';
import { useDraggable } from '@dnd-kit/core';
import { CSS } from '@dnd-kit/utilities';
import { FaTrash } from 'react-icons/fa';
import { Slide } from '../types';

interface DraggableTimelineItemProps {
  slide: Slide;
  pixelsPerSecond: number; 
  trackHeight: number;
  selectedSlide: Slide | null;
  onSlideSelect: (slide: Slide) => void;
  onSlideRemove: (slideId: number) => void;
  onSlideDurationChange: (slideId: number, newDuration: string) => void;
}

export const DraggableTimelineItem: React.FC<DraggableTimelineItemProps> = ({
  slide,
  pixelsPerSecond,
  trackHeight,
  selectedSlide,
  onSlideSelect,
  onSlideRemove,
  onSlideDurationChange,
}) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    isDragging,
  } = useDraggable({ id: slide.id });

  const style: React.CSSProperties = {
    position: 'absolute',
    top: `${slide.track * trackHeight + trackHeight * 0.1}px`,
    left: `${slide.startTime * pixelsPerSecond}px`,
    width: `${slide.duration * pixelsPerSecond}px`,
    height: `${trackHeight * 0.8}px`,
    transform: CSS.Translate.toString(transform),
    transition: isDragging ? 'none' : 'top 0.25s ease, left 0.25s ease',
    zIndex: isDragging ? 100 : 10 + slide.track,
    display: 'flex',
    alignItems: 'center',
    padding: '0.5rem',
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`timeline-slide ${selectedSlide?.id === slide.id ? 'selected' : ''}`}
      onClick={(e) => {
        e.stopPropagation();
        onSlideSelect(slide);
      }}
    >
      <div 
        {...attributes} 
        {...listeners} 
        className="slide-thumbnail"
        style={{ cursor: 'grab', height: '100%' }}
        onClick={(e) => e.stopPropagation()}
      >
        <img src={slide.image.url} alt="" />
      </div>
      <div className="slide-info">
        <span className="slide-name">{slide.image.name}</span>
        <input
          type="number"
          value={slide.duration}
          min="0.5"
          step="0.1"
          onChange={(e) => onSlideDurationChange(slide.id, e.target.value)}
          onClick={(e) => e.stopPropagation()}
        />
      </div>
      <button
        className="remove-slide-btn"
        onClick={(e) => {
          e.stopPropagation();
          onSlideRemove(slide.id);
        }}
      >
        <FaTrash />
      </button>
    </div>
  );
};
