import React, { useState, useEffect, useRef } from 'react';
import { FaTimes, FaPlay, FaPause, FaExpand, FaCompress } from 'react-icons/fa';
import { Slide } from '../types';

interface PreviewModalProps {
  timeline: Slide[];
  onClose: () => void;
}

// This helper function calculates the style for a slide at a specific time
const getSlideStyle = (slide: Slide, currentTime: number): React.CSSProperties => {
  const { startTime, duration, transition, transitionDuration, position, scale, rotation, zIndex } = slide;
  const endTime = startTime + duration;
  const fadeInEndTime = startTime + transitionDuration;
  const fadeOutStartTime = endTime - transitionDuration;

  // Base style
  let opacity = 0;
  let transform = `scale(${scale}) rotate(${rotation}deg)`; // Start with scale and rotation
  
  // Apply position directly to left/top
  let left = position.x;
  let top = position.y;

  // Default size for the preview-slide div
  const slideWidth = 200; // Example default width
  const slideHeight = 150; // Example default height

  // Check if the slide should be visible at all
  if (currentTime >= startTime && currentTime < endTime) {
    let transitionProgress = 1; // Default to fully visible

    // Determine if we are in a transition period
    if (currentTime < fadeInEndTime) { // Transitioning In
      transitionProgress = (currentTime - startTime) / transitionDuration;
      opacity = 1; // Keep it visible during transition in (except for fade)
      
      switch (transition) {
        case 'fade':
          opacity = transitionProgress;
          break;
        case 'slide':
          // Slide in from left
          transform += ` translateX(${(1 - transitionProgress) * -100}%)`;
          break;
        case 'zoom':
          // Zoom in
          transform = `scale(${scale * transitionProgress}) rotate(${rotation}deg)`;
          break;
        case 'flip':
          // Flip in
          transform += ` perspective(1000px) rotateY(${(1 - transitionProgress) * -90}deg)`;
          break;
        default:
          opacity = 1;
          break;
      }
    } else if (currentTime >= fadeOutStartTime) { // Transitioning Out
      transitionProgress = (endTime - currentTime) / transitionDuration;
      opacity = 1; // Keep it visible during transition out (except for fade)

      switch (transition) {
        case 'fade':
          opacity = transitionProgress;
          break;
        case 'slide':
          // Slide out to right
          transform += ` translateX(${(1 - transitionProgress) * 100}%)`;
          break;
        case 'zoom':
          // Zoom out
          transform = `scale(${scale * transitionProgress}) rotate(${rotation}deg)`;
          break;
        case 'flip':
          // Flip out
          transform += ` perspective(1000px) rotateY(${(1 - transitionProgress) * 90}deg)`;
          break;
        default:
          opacity = 1;
          break;
      }
    } else {
      // Fully visible, no transition
      opacity = 1;
    }
  }

  return {
    position: 'absolute',
    left: left,
    top: top,
    width: slideWidth,
    height: slideHeight,
    opacity: Math.max(0, Math.min(1, opacity)),
    transform,
    zIndex,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  };
};


const PreviewModal: React.FC<PreviewModalProps> = ({ timeline, onClose }) => {
  const [isPlaying, setIsPlaying] = useState<boolean>(true);
  const [currentTime, setCurrentTime] = useState<number>(0);
  const [isFullscreen, setIsFullscreen] = useState<boolean>(!!document.fullscreenElement);
  const canvasRef = useRef<HTMLDivElement>(null);

  const totalDuration = timeline.reduce((acc, slide) => 
    Math.max(acc, slide.startTime + slide.duration), 0
  );

  useEffect(() => {
    if (isPlaying && totalDuration > 0) {
      const interval = setInterval(() => {
        setCurrentTime((prev: number) => {
          const newTime = prev + 1 / 60; // Update based on 60fps
          if (newTime >= totalDuration) {
            setIsPlaying(false);
            return 0;
          }
          return newTime;
        });
      }, 1000 / 60);
      return () => clearInterval(interval);
    }
  }, [isPlaying, totalDuration]);

  useEffect(() => {
    const onFullscreenChange = () => setIsFullscreen(!!document.fullscreenElement);
    document.addEventListener('fullscreenchange', onFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', onFullscreenChange);
  }, []);

  const getVisibleSlides = (): Slide[] => {
    return timeline.filter(slide => {
      const endTime = slide.startTime + slide.duration;
      // Render slides during their transition periods as well
      return currentTime >= slide.startTime && currentTime < endTime;
    }).sort((a, b) => a.zIndex - b.zIndex);
  };

  const handleTimeSliderChange = (e: React.ChangeEvent<HTMLInputElement>): void => {
    const newTime = parseFloat(e.target.value);
    setCurrentTime(newTime);
  };

  const togglePlayback = (): void => {
    if (currentTime >= totalDuration) {
      setCurrentTime(0);
    }
    setIsPlaying(prev => !prev);
  };

  const toggleFullscreen = () => {
    const element = canvasRef.current;
    if (!element) return;

    if (!document.fullscreenElement) {
      element.requestFullscreen().catch(err => {
        console.error(`Error attempting to enable full-screen mode: ${err.message} (${err.name})`);
      });
    } else {
      document.exitFullscreen();
    }
  };

  const visibleSlides = getVisibleSlides();

  return (
    <div className="preview-modal-overlay">
      <div className="preview-modal">
        <div className="preview-header">
          <h3>미리보기</h3>
          <button onClick={onClose} className="close-btn">
            <FaTimes />
          </button>
        </div>
        
        <div className="preview-canvas" ref={canvasRef}>
          {visibleSlides.map(slide => (
            <div
              key={slide.id}
              className="preview-slide"
              style={getSlideStyle(slide, currentTime)}
            >
              <img
                src={slide.image.url}
                alt={slide.image.name}
                style={{
                  width: '100%',
                  height: '100%',
                  objectFit: 'contain',
                }}
              />
            </div>
          ))}
        </div>

        <div className="preview-controls">
          <button onClick={togglePlayback}>
            {isPlaying ? <FaPause /> : <FaPlay />}
          </button>
          <div className="time-display">
            {currentTime.toFixed(1)}s / {totalDuration.toFixed(1)}s
          </div>
          <input
            type="range"
            min="0"
            max={totalDuration}
            step="0.01"
            value={currentTime}
            onChange={handleTimeSliderChange}
            className="time-slider"
          />
          <button onClick={toggleFullscreen}>
            {isFullscreen ? <FaCompress /> : <FaExpand />}
          </button>
        </div>
      </div>
    </div>
  );
};

export default PreviewModal;