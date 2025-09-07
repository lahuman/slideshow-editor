import React, { useState, useEffect, useRef } from 'react';
import { FaTimes, FaPlay, FaPause, FaExpand, FaCompress, FaRedo, FaStepBackward, FaStepForward } from 'react-icons/fa';
import { Slide, CanvasSettings } from '../types';

interface PreviewModalProps {
  timeline: Slide[];
  onClose: () => void;
  canvasSettings: CanvasSettings;
}

const getSlideStyle = (slide: Slide, currentTime: number, canvasSettings: CanvasSettings): React.CSSProperties => {
  const { startTime, duration, transition, transitionDuration, position, scale, rotation, zIndex } = slide;
  const endTime = startTime + duration;
  const fadeInEndTime = startTime + transitionDuration;
  const fadeOutStartTime = endTime - transitionDuration;

  const [ratioWidth, ratioHeight] = canvasSettings.aspectRatio.split(':').map(Number);
  const canvasWidth = 1024;
  const canvasHeight = (canvasWidth / ratioWidth) * ratioHeight;

  let opacity = 0;
  let transform = `rotate(${rotation}deg)`;

  const left = position.x;
  const top = position.y;
  const width = canvasWidth * scale;
  const height = canvasHeight * scale;

  if (currentTime >= startTime && currentTime < endTime) {
    let transitionProgress = 1;

    if (currentTime < fadeInEndTime) { // Transitioning In
      transitionProgress = (currentTime - startTime) / transitionDuration;
      opacity = 1;
      
      switch (transition) {
        case 'fade':
          opacity = transitionProgress;
          break;
        case 'slide':
          transform += ` translateX(${(1 - transitionProgress) * 100}%)`;
          break;
        case 'zoom':
          transform = `scale(${transitionProgress})`;
          break;
        case 'flip':
          transform += ` perspective(1000px) rotateY(${(1 - transitionProgress) * 90}deg)`;
          break;
        default:
          opacity = 1;
          break;
      }
    } else if (currentTime >= fadeOutStartTime) { // Transitioning Out
      transitionProgress = (endTime - currentTime) / transitionDuration;
      opacity = 1;

      switch (transition) {
        case 'fade':
          opacity = transitionProgress;
          break;
        case 'slide':
          transform += ` translateX(${(1 - transitionProgress) * -100}%)`;
          break;
        case 'zoom':
          transform = `scale(${transitionProgress})`;
          break;
        case 'flip':
          transform += ` perspective(1000px) rotateY(${(1 - transitionProgress) * -90}deg)`;
          break;
        default:
          opacity = 1;
          break;
      }
    } else {
      opacity = 1;
    }
  }

  return {
    position: 'absolute',
    left,
    top,
    width,
    height,
    opacity: Math.max(0, Math.min(1, opacity)),
    transform,
    zIndex,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  };
};


const PreviewModal: React.FC<PreviewModalProps> = ({ timeline, onClose, canvasSettings }) => {
  const [isPlaying, setIsPlaying] = useState<boolean>(true);
  const [isLooping, setIsLooping] = useState<boolean>(false);
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
          let newTime = prev + 1 / 60; // Update based on 60fps
          if (newTime >= totalDuration) {
            if (isLooping) {
              newTime = 0;
            } else {
              setIsPlaying(false);
              return 0;
            }
          }
          return newTime;
        });
      }, 1000 / 60);
      return () => clearInterval(interval);
    }
  }, [isPlaying, totalDuration, isLooping]);

  useEffect(() => {
    const onFullscreenChange = () => setIsFullscreen(!!document.fullscreenElement);
    document.addEventListener('fullscreenchange', onFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', onFullscreenChange);
  }, []);

  const getVisibleSlides = (): Slide[] => {
    return timeline.filter(slide => {
      const endTime = slide.startTime + slide.duration;
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

  const handlePrevious = () => {
    const previousSlides = timeline.filter(slide => slide.startTime < currentTime);
    if (previousSlides.length > 0) {
      const latestPreviousSlide = previousSlides.reduce((latest, current) => {
        return current.startTime > latest.startTime ? current : latest;
      });
      setCurrentTime(latestPreviousSlide.startTime);
    } else {
      setCurrentTime(0);
    }
  };

  const handleNext = () => {
    const nextSlides = timeline.filter(slide => slide.startTime > currentTime);
    if (nextSlides.length > 0) {
      const earliestNextSlide = nextSlides.reduce((earliest, current) => {
        return current.startTime < earliest.startTime ? current : earliest;
      });
      setCurrentTime(earliestNextSlide.startTime);
    }
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
        
        <div 
          className="preview-canvas"
          ref={canvasRef}
          style={{
            aspectRatio: canvasSettings.aspectRatio.replace(':', ' / '),
            background: canvasSettings.backgroundColor
          }}
        >
          {visibleSlides.map(slide => (
            <div
              key={slide.id}
              className="preview-slide"
              style={getSlideStyle(slide, currentTime, canvasSettings)}
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
          <button onClick={handlePrevious}>
            <FaStepBackward />
          </button>
          <button onClick={togglePlayback}>
            {isPlaying ? <FaPause /> : <FaPlay />}
          </button>
          <button onClick={handleNext}>
            <FaStepForward />
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
          <button onClick={() => setIsLooping(prev => !prev)} style={{ color: isLooping ? 'red' : 'inherit' }}>
            <FaRedo />
          </button>
          <button onClick={toggleFullscreen}>
            {isFullscreen ? <FaCompress /> : <FaExpand />}
          </button>
        </div>
      </div>
    </div>
  );
};
export default PreviewModal;