import React, { useEffect, useRef, useState } from 'react';
import Draggable, { DraggableData, DraggableEvent } from 'react-draggable';
import { TextSlide } from '../types';

interface DraggableTextItemProps {
  slide: TextSlide;
  isSelected: boolean;
  isPlaying: boolean;
  onSelect: (slideId: number) => void;
  onDragStop: (slide: TextSlide, e: DraggableEvent, data: DraggableData) => void;
  onResize: (slide: TextSlide, nextMaxWidth: number) => void;
  onRotate: (slide: TextSlide, nextRotation: number) => void;
  canvasDimensions: { width: number; height: number };
}

const DraggableTextItem: React.FC<DraggableTextItemProps> = ({
  slide,
  isSelected,
  isPlaying,
  onSelect,
  onDragStop,
  onResize,
  onRotate,
  canvasDimensions,
}) => {
  const nodeRef = useRef<HTMLDivElement>(null);
  const [isResizing, setIsResizing] = useState(false);
  const [isRotating, setIsRotating] = useState(false);
  const resizeStartXRef = useRef(0);
  const resizeStartWidthRef = useRef(0);

  const handleResizeStart = (e: React.MouseEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    resizeStartXRef.current = e.clientX;
    resizeStartWidthRef.current = slide.maxWidth;
    setIsResizing(true);
  };

  const handleRotateStart = (e: React.MouseEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsRotating(true);
  };

  useEffect(() => {
    if (!isResizing) return;

    const onMouseMove = (e: MouseEvent) => {
      const deltaX = e.clientX - resizeStartXRef.current;
      const nextWidth = Math.max(80, resizeStartWidthRef.current + deltaX);
      onResize(slide, nextWidth);
    };

    const onMouseUp = () => {
      setIsResizing(false);
    };

    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
    return () => {
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
    };
  }, [isResizing, onResize, slide]);

  useEffect(() => {
    if (!isRotating) return;

    const onMouseMove = (e: MouseEvent) => {
      if (!nodeRef.current) return;
      const rect = nodeRef.current.getBoundingClientRect();
      const centerX = rect.left + rect.width / 2;
      const centerY = rect.top + rect.height / 2;
      const angle = Math.atan2(e.clientY - centerY, e.clientX - centerX) * (180 / Math.PI);
      onRotate(slide, angle + 90);
    };

    const onMouseUp = () => {
      setIsRotating(false);
    };

    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
    return () => {
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
    };
  }, [isRotating, onRotate, slide]);

  const bounds = {
    left: 0,
    top: 0,
    right: Math.max(0, canvasDimensions.width - slide.maxWidth),
    bottom: Math.max(0, canvasDimensions.height - 40),
  };

  return (
    <Draggable
      nodeRef={nodeRef}
      position={slide.position}
      onStop={(e, data) => onDragStop(slide, e, data)}
      disabled={isPlaying || isResizing || isRotating}
      bounds={bounds}
    >
      <div
        ref={nodeRef}
        className="text-slide-box text-slide-draggable"
        onClick={(e) => {
          e.stopPropagation();
          onSelect(slide.id);
        }}
        style={{
          position: 'absolute',
          maxWidth: slide.maxWidth,
          zIndex: 999,
          cursor: isPlaying ? 'default' : 'move',
        }}
      >
        <div
          className="text-slide-transformer"
          style={{
            transform: `rotate(${slide.rotation}deg)`,
            transformOrigin: 'center',
            fontSize: slide.fontSize,
            color: slide.color,
            backgroundColor: slide.backgroundColor,
            padding: '8px 12px',
            borderRadius: 6,
            textAlign: slide.align,
            whiteSpace: 'pre-wrap',
            wordBreak: 'break-word',
            outline: isSelected ? '2px solid var(--color-accent)' : 'none',
          }}
        >
          {slide.text}
          {!isPlaying && isSelected && (
            <div className="text-slide-controls">
              <div className="text-resize-handle" onMouseDown={handleResizeStart} />
              <div className="text-rotate-handle" onMouseDown={handleRotateStart} />
            </div>
          )}
        </div>
      </div>
    </Draggable>
  );
};

export default DraggableTextItem;
