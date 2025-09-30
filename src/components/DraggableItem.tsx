import React, { useState, useRef, useEffect } from 'react';
import Draggable, { DraggableData, DraggableEvent } from 'react-draggable';
import { Slide, CanvasSettings } from '../types';

interface DraggableItemProps {
  slide: Slide;
  currentTime: number;
  isSelected: boolean;
  isPlaying: boolean;
  onSlideClick: (slide: Slide) => void;
  onDragStop: (slide: Slide, e: DraggableEvent, data: DraggableData) => void;
  onRotateEnd: (slide: Slide, rotation: number) => void;
  canvasSettings: CanvasSettings;
  canvasDimensions: { width: number; height: number; };
}

const DraggableItem: React.FC<DraggableItemProps> = ({
  slide,
  currentTime,
  isSelected,
  isPlaying,
  onSlideClick,
  onDragStop,
  onRotateEnd,
  canvasDimensions,
}) => {
  const nodeRef = useRef<HTMLDivElement>(null);
  const [isRotating, setIsRotating] = useState(false);

  const handleRotateStart = (e: React.MouseEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsRotating(true);
  };

  useEffect(() => {
    if (!isRotating) return;

    const handleMouseMove = (e: MouseEvent) => {
      if (nodeRef.current) {
        const rect = nodeRef.current.getBoundingClientRect();
        const centerX = rect.left + rect.width / 2;
        const centerY = rect.top + rect.height / 2;
        const angle = Math.atan2(e.clientY - centerY, e.clientX - centerX) * (180 / Math.PI);
        const newRotation = angle + 90; // Adjust to make top of the item follow the mouse
        onRotateEnd(slide, newRotation);
      }
    };

    const handleMouseUp = () => {
      setIsRotating(false);
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isRotating, onRotateEnd, slide]);

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

      // ... other cases
    }
    return styles;
  };

  const userTransform = `scale(${slide.scale}) rotate(${slide.rotation}deg)`;
  const transitionStyle = getTransitionStyle();
  const combinedTransform = `${transitionStyle.transform || ''} ${userTransform}`.trim();

  const scaledWidth = slide.image.width * slide.scale;
  const scaledHeight = slide.image.height * slide.scale;

  const bounds = {
    left: 0,
    top: 0,
    right: canvasDimensions.width - scaledWidth,
    bottom: canvasDimensions.height - scaledHeight,
  };

  return (
    <Draggable
      key={slide.id}
      nodeRef={nodeRef}
      position={slide.position}
      onStop={(e, data) => onDragStop(slide, e, data)}
      disabled={isPlaying || isRotating}
      bounds={bounds}
    >
      <div
        ref={nodeRef}
        className="slide-item"
        onClick={() => onSlideClick(slide)}
        style={{ 
          zIndex: slide.zIndex,
          width: slide.image.width,
          height: slide.image.height,
        }}
      >
        <div 
          className={`slide-item-transformer ${isSelected ? 'selected' : ''}`}
          style={{
            transform: combinedTransform,
            transition: isPlaying ? 'opacity 0.2s, transform 0.2s' : 'transform 0.2s',
            width: '100%',
            height: '100%',
            opacity: transitionStyle.opacity,
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
              <div className="rotate-handle" onMouseDown={handleRotateStart}></div>
            </div>
          )}
        </div>
      </div>
    </Draggable>
  );
};

export default DraggableItem;