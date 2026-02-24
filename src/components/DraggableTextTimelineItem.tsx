import React, { useEffect, useState } from 'react';
import { useDraggable } from '@dnd-kit/core';
import { CSS } from '@dnd-kit/utilities';
import { FaTrash } from 'react-icons/fa';
import { TextSlide } from '../types';

interface DraggableTextTimelineItemProps {
  slide: TextSlide;
  pixelsPerSecond: number;
  trackHeight: number;
  isSelected: boolean;
  onSelect: (slideId: number) => void;
  onRemove: (slideId: number) => void;
  onDurationChange: (slideId: number, newDuration: string) => void;
  onTextChange: (slideId: number, text: string) => void;
}

const shortenText = (text: string): string => {
  const trimmed = text.trim().replace(/\s+/g, ' ');
  if (trimmed.length <= 24) return trimmed;
  return `${trimmed.slice(0, 24)}...`;
};

export const DraggableTextTimelineItem: React.FC<DraggableTextTimelineItemProps> = ({
  slide,
  pixelsPerSecond,
  trackHeight,
  isSelected,
  onSelect,
  onRemove,
  onDurationChange,
  onTextChange,
}) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    isDragging,
  } = useDraggable({ id: `text-${slide.id}` });

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
      return;
    }

    const clampedValue = Math.max(1, Math.min(value, 100));
    onDurationChange(slide.id, clampedValue.toString());
    setInputValue(clampedValue.toString());
  };

  const handleChange = (value: string) => {
    setInputValue(value);
    const parsed = parseFloat(value);
    if (!isNaN(parsed)) {
      const clampedValue = Math.max(1, Math.min(parsed, 100));
      onDurationChange(slide.id, clampedValue.toString());
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
    zIndex: isDragging ? 100 : 10 + slide.track,
    display: 'flex',
    alignItems: 'center',
    padding: '0.5rem',
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`timeline-slide text-timeline-slide ${isSelected ? 'selected' : ''}`}
      onClick={(e) => {
        e.stopPropagation();
        onSelect(slide.id);
      }}
    >
      <div
        {...attributes}
        {...listeners}
        className="slide-thumbnail text-thumbnail"
        style={{ cursor: 'grab', height: '100%', touchAction: 'none' }}
      >
        T
      </div>
      <div className="slide-info">
        {isSelected ? (
          <input
            type="text"
            value={slide.text}
            className="slide-text-input"
            onChange={(e) => onTextChange(slide.id, e.target.value)}
            onClick={(e) => e.stopPropagation()}
          />
        ) : (
          <span className="slide-name">{shortenText(slide.text)}</span>
        )}
        <input
          type="number"
          value={inputValue}
          min="1"
          step="0.1"
          max="100"
          style={{ maxWidth: '100px' }}
          onChange={(e) => handleChange(e.target.value)}
          onBlur={handleBlur}
          onClick={(e) => e.stopPropagation()}
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
