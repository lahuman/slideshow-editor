import { forwardRef } from 'react';
import { DraggableData, DraggableEvent } from 'react-draggable';
import { Slide, CanvasSettings } from '../types';
import DraggableItem from './DraggableItem';

interface ImageCanvasProps {
  timeline: Slide[];
  currentTime: number;
  selectedSlideIds: number[];
  onSlideSelect: (slideId: number, meta: { shift: boolean, ctrl: boolean }) => void;
  onSlidesUpdate: (slideIds: number[], updates: Partial<Slide>) => void;
  isPlaying: boolean;
  canvasSettings: CanvasSettings;
}

const ImageCanvas = forwardRef<HTMLDivElement, ImageCanvasProps>(({
  timeline,
  currentTime,
  selectedSlideIds,
  onSlideSelect,
  onSlidesUpdate,
  isPlaying,
  canvasSettings
}, ref) => {

  const [ratioWidth, ratioHeight] = canvasSettings.aspectRatio.split(':').map(Number);
  const canvasWidth = 1024;
  const canvasHeight = (canvasWidth / ratioWidth) * ratioHeight;

  const slidesToRender = (
    !isPlaying && selectedSlideIds.length > 0
      ? timeline.filter(s => selectedSlideIds.includes(s.id))
      : timeline.filter(slide => {
          const endTime = slide.startTime + slide.duration;
          return currentTime >= slide.startTime && currentTime <= endTime;
        })
  ).sort((a, b) => a.zIndex - b.zIndex);

  const handleSlideClick = (slide: Slide): void => {
    if (!isPlaying) {
      onSlideSelect(slide.id, { shift: false, ctrl: false });
    }
  };

  const handleDragStop = (slide: Slide, _e: DraggableEvent, data: DraggableData): void => {
    onSlidesUpdate([slide.id], {
      position: { x: data.x, y: data.y }
    });
  };

  return (
    <div className="image-canvas-container">
      <div 
        ref={ref}
        className="image-canvas"
        style={{ 
          width: canvasWidth,
          height: canvasHeight,
          background: canvasSettings.backgroundColor,
          maxWidth: '100%',
          maxHeight: '100%'
        }}
        onClick={() => onSlideSelect(0, { shift: false, ctrl: true })} // Deselect all
      >
        {slidesToRender.map(slide => (
          <DraggableItem
            key={slide.id}
            slide={slide}
            currentTime={currentTime}
            isSelected={selectedSlideIds.includes(slide.id)}
            isPlaying={isPlaying}
            onSlideClick={handleSlideClick}
            onDragStop={handleDragStop}
            canvasSettings={canvasSettings}
          />
        ))}
      </div>
    </div>
  );
});

ImageCanvas.displayName = 'ImageCanvas';

export default ImageCanvas;