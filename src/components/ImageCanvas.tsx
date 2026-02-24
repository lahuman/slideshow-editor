import { forwardRef } from 'react';
import { DraggableData, DraggableEvent } from 'react-draggable';
import { Slide, CanvasSettings, TextSlide } from '../types';
import DraggableItem from './DraggableItem';
import DraggableTextItem from './DraggableTextItem';

interface ImageCanvasProps {
  timeline: Slide[];
  textSlides: TextSlide[];
  currentTime: number;
  selectedSlideIds: number[];
  selectedTextSlideId: number | null;
  onSlideSelect: (slideId: number, meta: { shift: boolean, ctrl: boolean }) => void;
  onTextSlideSelect: (slideId: number) => void;
  onSlidesUpdate: (slideIds: number[], updates: Partial<Slide>) => void;
  onTextSlidesUpdate: (slideIds: number[], updates: Partial<TextSlide>) => void;
  isPlaying: boolean;
  canvasSettings: CanvasSettings;
  canvasDimensions: { width: number; height: number; };
  canvasContainerRef: React.RefObject<HTMLDivElement | null>;
}

const ImageCanvas = forwardRef<HTMLDivElement, ImageCanvasProps>(({
  timeline,
  textSlides,
  currentTime,
  selectedSlideIds,
  selectedTextSlideId,
  onSlideSelect,
  onTextSlideSelect,
  onSlidesUpdate,
  onTextSlidesUpdate,
  isPlaying,
  canvasSettings,
  canvasDimensions,
  canvasContainerRef
}, ref) => {
  const TIME_EPSILON = 0.0001;
  const isActiveAtCurrentTime = (startTime: number, duration: number): boolean => {
    const endTime = startTime + duration;
    return currentTime + TIME_EPSILON >= startTime && currentTime < endTime - TIME_EPSILON;
  };

  const slidesToRender = (
    !isPlaying && selectedSlideIds.length > 0
      ? timeline.filter(s => selectedSlideIds.includes(s.id))
      : timeline.filter(slide => isActiveAtCurrentTime(slide.startTime, slide.duration))
  ).sort((a, b) => a.zIndex - b.zIndex);

  const textSlidesToRender = (
    !isPlaying && selectedTextSlideId !== null
      ? textSlides.filter(slide => slide.id === selectedTextSlideId)
      : textSlides.filter(slide => isActiveAtCurrentTime(slide.startTime, slide.duration))
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

  const handleRotateEnd = (slide: Slide, rotation: number): void => {
    onSlidesUpdate([slide.id], { rotation });
  };

  const handleTextDragStop = (slide: TextSlide, _e: DraggableEvent, data: DraggableData): void => {
    onTextSlidesUpdate([slide.id], {
      position: { x: data.x, y: data.y }
    });
  };

  const handleTextResize = (slide: TextSlide, maxWidth: number): void => {
    onTextSlidesUpdate([slide.id], { maxWidth });
  };

  const handleTextRotate = (slide: TextSlide, rotation: number): void => {
    onTextSlidesUpdate([slide.id], { rotation });
  };

  return (
    <div className="image-canvas-container" ref={canvasContainerRef}>
      <div 
        ref={ref}
        className="image-canvas"
        style={{ 
          width: canvasDimensions.width,
          height: canvasDimensions.height,
          background: canvasSettings.backgroundColor,
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
            onRotateEnd={handleRotateEnd}
            canvasSettings={canvasSettings}
            canvasDimensions={canvasDimensions}
          />
        ))}

        {/* 텍스트 슬라이드들을 중앙 캔버스에 단순 표시 */}
        {textSlidesToRender.map(text => (
          <DraggableTextItem
            key={text.id}
            slide={text}
            isSelected={selectedTextSlideId === text.id}
            isPlaying={isPlaying}
            onSelect={onTextSlideSelect}
            onDragStop={handleTextDragStop}
            onResize={handleTextResize}
            onRotate={handleTextRotate}
            canvasDimensions={canvasDimensions}
          />
        ))}
      </div>
    </div>
  );
});

ImageCanvas.displayName = 'ImageCanvas';

export default ImageCanvas;
