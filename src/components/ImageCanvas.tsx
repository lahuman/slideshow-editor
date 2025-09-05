import { forwardRef, useState } from 'react';
import { DraggableData, DraggableEvent } from 'react-draggable';
import { Slide, CanvasSize } from '../types';
import DraggableItem from './DraggableItem';

interface ImageCanvasProps {
  timeline: Slide[];
  currentTime: number;
  selectedSlide: Slide | null;
  onSlideSelect: (slide: Slide) => void;
  onSlideUpdate: (slideId: number, updates: Partial<Slide>) => void;
  isPlaying: boolean;
}

const ImageCanvas = forwardRef<HTMLDivElement, ImageCanvasProps>(({
  timeline,
  currentTime,
  selectedSlide,
  onSlideSelect,
  onSlideUpdate,
  isPlaying
}, ref) => {
  const [canvasSize] = useState<CanvasSize>({ width: 800, height: 450 });

  const slidesToRender = !isPlaying && selectedSlide
    ? [selectedSlide]
    : timeline
      .filter(slide => {
        const endTime = slide.startTime + slide.duration;
        return currentTime >= slide.startTime && currentTime <= endTime;
      })
      .sort((a, b) => a.zIndex - b.zIndex);

  const handleSlideClick = (slide: Slide): void => {
    if (!isPlaying) {
      onSlideSelect(slide);
    }
  };

  const handleDragStop = (slide: Slide, _e: DraggableEvent, data: DraggableData): void => {
    onSlideUpdate(slide.id, {
      position: { x: data.x, y: data.y }
    });
  };

  return (
    <div className="image-canvas-container">
      <div 
        ref={ref}
        className="image-canvas"
        style={{ 
          width: canvasSize.width, 
          height: canvasSize.height,
          background: '#000'
        }}
      >
        {slidesToRender.map(slide => (
          <DraggableItem
            key={slide.id}
            slide={slide}
            currentTime={currentTime}
            isSelected={selectedSlide?.id === slide.id}
            isPlaying={isPlaying}
            onSlideClick={handleSlideClick}
            onDragStop={handleDragStop}
          />
        ))}
      </div>
    </div>
  );
});

ImageCanvas.displayName = 'ImageCanvas';

export default ImageCanvas;