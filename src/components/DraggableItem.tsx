import React from 'react';
import Draggable, { DraggableData, DraggableEvent } from 'react-draggable';
import { Slide } from '../types';

interface DraggableItemProps {
  slide: Slide;
  currentTime: number;
  isSelected: boolean;
  isPlaying: boolean;
  onSlideClick: (slide: Slide) => void;
  onDragStop: (slide: Slide, e: DraggableEvent, data: DraggableData) => void;
}

const DraggableItem: React.FC<DraggableItemProps> = ({
  slide,
  currentTime,
  isSelected,
  isPlaying,
  onSlideClick,
  onDragStop,
}) => {
  const nodeRef = React.useRef(null);

  const getTransitionStyle = (): React.CSSProperties => {
    if (!isPlaying) return {};

    const { startTime, duration, transition, transitionDuration } = slide;
    const timeIntoSlide = currentTime - startTime;
    const transitionProgressIn = Math.min(1, Math.max(0, timeIntoSlide / transitionDuration));
    const transitionProgressOut = Math.min(1, Math.max(0, (duration - timeIntoSlide) / transitionDuration));

    let styles: React.CSSProperties = { transition: `all ${transitionDuration / 2}s ease-in-out` };

    switch (transition) {
      case 'fade':
        if (timeIntoSlide < transitionDuration) styles.opacity = transitionProgressIn;
        else if (timeIntoSlide > duration - transitionDuration) styles.opacity = transitionProgressOut;
        else styles.opacity = 1;
        break;

      case 'slide':
        if (timeIntoSlide < transitionDuration) styles.transform = `translateX(${(1 - transitionProgressIn) * 100}%)`;
        else if (timeIntoSlide > duration - transitionDuration) styles.transform = `translateX(${(1 - transitionProgressOut) * -100}%)`;
        else styles.transform = 'translateX(0%)';
        break;

      case 'zoom':
        if (timeIntoSlide < transitionDuration) styles.transform = `scale(${transitionProgressIn})`;
        else if (timeIntoSlide > duration - transitionDuration) styles.transform = `scale(${transitionProgressOut})`;
        else styles.transform = 'scale(1)';
        break;

      case 'flip':
        if (timeIntoSlide < transitionDuration) styles.transform = `rotateY(${(1 - transitionProgressIn) * 90}deg)`;
        else if (timeIntoSlide > duration - transitionDuration) styles.transform = `rotateY(${(1 - transitionProgressOut) * -90}deg)`;
        else styles.transform = 'rotateY(0deg)';
        break;

      default:
        break;
    }
    return styles;
  };

  const userTransform = `scale(${slide.scale}) rotate(${slide.rotation}deg)`;
  const transitionStyle = getTransitionStyle();
  const combinedTransform = `${transitionStyle.transform || ''} ${userTransform}`.trim();

  return (
    <Draggable
      key={slide.id}
      nodeRef={nodeRef}
      position={slide.position}
      onStop={(e, data) => onDragStop(slide, e, data)}
      disabled={isPlaying}
    >
      <div
        ref={nodeRef}
        className={`slide-item ${isSelected ? 'selected' : ''}`}
        onClick={() => onSlideClick(slide)}
        style={{ 
          zIndex: slide.zIndex,
          opacity: transitionStyle.opacity, // Apply opacity from transition
          width: slide.image.width,
          height: slide.image.height,
        }}
      >
        <div 
          style={{
            transform: combinedTransform, // Apply combined transform
            transition: isPlaying ? 'opacity 0.2s, transform 0.2s' : 'transform 0.2s',
            width: '100%',
            height: '100%',
          }}
        >
          <img
            src={slide.image.url}
            alt={slide.image.name}
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'contain',
            }}
            draggable={false}
          />
          {isSelected && !isPlaying && (
            <div className="slide-controls">
              <div className="resize-handle"></div>
              <div className="rotate-handle"></div>
            </div>
          )}
        </div>
      </div>
    </Draggable>
  );
};

export default DraggableItem;