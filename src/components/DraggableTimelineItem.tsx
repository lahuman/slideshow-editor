import React, { useState, useEffect } from 'react';
import { useDraggable } from '@dnd-kit/core';
import { CSS } from '@dnd-kit/utilities';
import { FaTrash } from 'react-icons/fa';
import { Slide } from '../types';

interface DraggableTimelineItemProps {
  slide: Slide;
  pixelsPerSecond: number; 
  trackHeight: number;
  isSelected: boolean;
  onSelect: (slideId: number, meta: { shift: boolean, ctrl: boolean }) => void;
  onRemove: (slideId: number) => void;
  onDurationChange: (slideId: number, newDuration: string) => void;
}

export const DraggableTimelineItem: React.FC<DraggableTimelineItemProps> = ({
  slide,
  pixelsPerSecond,
  trackHeight,
  isSelected,
  onSelect,
  onRemove,
  onDurationChange,
}) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    isDragging,
  } = useDraggable({ id: slide.id });

  const [inputValue, setInputValue] = useState(slide.duration.toString());

  useEffect(() => {
    if (parseFloat(inputValue) !== slide.duration) {
      setInputValue(slide.duration.toString());
    }
  }, [slide.duration]);

  const handleBlur = () => {
    const value = parseFloat(inputValue);
    if (isNaN(value) || inputValue.trim() === '') {
      setInputValue(slide.duration.toString());
    } else {
      const clampedValue = Math.max(1, Math.min(value, 100));
      onDurationChange(slide.id, clampedValue.toString());
      setInputValue(clampedValue.toString());
    }
  };

  const style: React.CSSProperties = {
    position: 'absolute',
    top: `${slide.track * trackHeight + trackHeight * 0.1}px`,
    left: `${slide.startTime * pixelsPerSecond}px`,
    width: `${slide.duration * pixelsPerSecond}px`,
    height: `${trackHeight * 0.8}px`,
    transform: CSS.Translate.toString(transform),
    transition: isDragging ? 'none' : 'top 0.25s ease, left 0.25s ease',
    zIndex: isDragging ? 100 : (isSelected ? 50 : 10 + slide.track),
    display: 'flex',
    alignItems: 'center',
    padding: '0.5rem',
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`timeline-slide ${isSelected ? 'selected' : ''}`}
      onClick={(e) => {
        e.stopPropagation();
        onSelect(slide.id, { shift: e.shiftKey, ctrl: e.metaKey || e.ctrlKey });
      }}
    >
      <div 
        {...attributes} 
        {...listeners} 
        className="slide-thumbnail"
        style={{ cursor: 'grab', height: '100%', touchAction: 'none' }}
      >
        <img src={slide.image.url} alt="" style={{ pointerEvents: 'none' }} />
      </div>
      <div className="slide-info">
        <span className="slide-name">{slide.image.name}</span>
        <input
          type="number"
          value={inputValue}
          min="1"
          step="0.1"
          max="100"
          style={{ maxWidth: '100px' }}
          onChange={(e) => setInputValue(e.target.value)}
          onBlur={handleBlur}
          onClick={(e) => e.stopPropagation()} // Prevent selection change on input click
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              (e.target as HTMLInputElement).blur();
            }
          }}
        />
      </div>
      <button
        className="remove-slide-btn"
        onClick={(e) => {
          e.stopPropagation();
          onRemove(slide.id);
        }}
      >
        <FaTrash />
      </button>
    </div>
  );
};
