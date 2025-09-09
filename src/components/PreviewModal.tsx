import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  FiX, FiPlay, FiPause, FiMaximize, FiMinimize, 
  FiRepeat, FiSkipBack, FiSkipForward 
} from 'react-icons/fi';
import { Slide, CanvasSettings } from '../types';

interface PreviewModalProps {
  timeline: Slide[];
  onClose: () => void;
  canvasSettings: CanvasSettings;
  mainCanvasDimensions: { width: number; height: number; };
}

const PreviewModal: React.FC<PreviewModalProps> = ({ timeline, onClose, canvasSettings, mainCanvasDimensions }) => {
  const [isPlaying, setIsPlaying] = useState<boolean>(true);
  const [isLooping, setIsLooping] = useState<boolean>(true);
  const [currentTime, setCurrentTime] = useState<number>(0);
  const [isFullscreen, setIsFullscreen] = useState<boolean>(!!document.fullscreenElement);
  
  // 1. Initial state with fallback values
  const [previewDimensions, setPreviewDimensions] = useState({
    width: mainCanvasDimensions.width || 800,
    height: mainCanvasDimensions.height || 600
  });

  const modalRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLDivElement>(null);

  // 2. Effect to update dimensions if ResizeObserver fails or is slow
  useEffect(() => {
    if (previewDimensions.width === 0 && mainCanvasDimensions.width > 0) {
      setPreviewDimensions({
        width: mainCanvasDimensions.width,
        height: mainCanvasDimensions.height,
      });
    }
  }, [mainCanvasDimensions, previewDimensions.width]);

  useEffect(() => {
    const resizeObserver = new ResizeObserver(entries => {
      if (!entries || entries.length === 0) return;
      const { width, height } = entries[0].contentRect;
      if (width > 0 && height > 0) {
        setPreviewDimensions({ width, height });
      }
    });

    if (canvasRef.current) {
      resizeObserver.observe(canvasRef.current);
    }

    return () => resizeObserver.disconnect();
  }, []);

  useEffect(() => {
    function handleResize() {
      // 3. Ensure fullscreen updates dimensions correctly
      if (document.fullscreenElement && modalRef.current) {
        setPreviewDimensions({
          width: window.innerWidth,
          height: window.innerHeight
        });
      }
    }
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const scaleFactor = useMemo(() => {
    if (mainCanvasDimensions.width === 0 || previewDimensions.width === 0) {
      return 0;
    }
    return previewDimensions.width / mainCanvasDimensions.width;
  }, [mainCanvasDimensions, previewDimensions]);

  const getSlideStyle = (slide: Slide): React.CSSProperties => {
    const { startTime, duration, transition, transitionDuration, position, scale, rotation, zIndex, image } = slide;
    const endTime = startTime + duration;
    const fadeInEndTime = startTime + transitionDuration;
    const fadeOutStartTime = endTime - transitionDuration;

    let opacity = 0;
    let finalTransform = `rotate(${rotation}deg)`;
    let transitionTransform = '';

    if (currentTime >= startTime && currentTime < endTime) {
      opacity = 1;
      let transitionProgress = 1;

      if (currentTime < fadeInEndTime) { // Transitioning In
        transitionProgress = (currentTime - startTime) / transitionDuration;
        switch (transition) {
          case 'fade': opacity = transitionProgress; break;
          case 'slide': transitionTransform = `translateX(${(1 - transitionProgress) * 100}%)`; break;
          case 'zoom': transitionTransform = `scale(${transitionProgress})`; break;
          case 'flip': transitionTransform = `perspective(1000px) rotateY(${(1 - transitionProgress) * 90}deg)`; break;
        }
      } else if (currentTime >= fadeOutStartTime) { // Transitioning Out
        transitionProgress = (endTime - currentTime) / transitionDuration;
        switch (transition) {
          case 'fade': opacity = transitionProgress; break;
          case 'slide': transitionTransform = `translateX(${(1 - transitionProgress) * -100}%)`; break;
          case 'zoom': transitionTransform = `scale(${transitionProgress})`; break;
          case 'flip': transitionTransform = `perspective(1000px) rotateY(${(1 - transitionProgress) * -90}deg)`; break;
        }
      }
    }

    return {
      position: 'absolute',
      left: position.x * scaleFactor,
      top: position.y * scaleFactor,
      // 4. Ensure width/height is at least 1px
      width: Math.max(1, image.width * scale * scaleFactor),
      height: Math.max(1, image.height * scale * scaleFactor),
      opacity: Math.max(0, Math.min(1, opacity)),
      transform: `${finalTransform} ${transitionTransform}`.trim(),
      transformOrigin: 'center',
      zIndex,
    };
  };

  const totalDuration = timeline.reduce((acc, slide) => 
    Math.max(acc, slide.startTime + slide.duration), 0
  );

  useEffect(() => {
    if (isPlaying && totalDuration > 0) {
      const interval = setInterval(() => {
        setCurrentTime((prev: number) => {
          let newTime = prev + 1 / 60;
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
    const onFullscreenChange = () => {
        setIsFullscreen(!!document.fullscreenElement);
        if (document.fullscreenElement) {
            setPreviewDimensions({ width: window.innerWidth, height: window.innerHeight });
        }
    }
    document.addEventListener('fullscreenchange', onFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', onFullscreenChange);
  }, []);

  const visibleSlides = useMemo(() => 
    timeline.filter(slide => {
      const endTime = slide.startTime + slide.duration;
      return currentTime >= slide.startTime && currentTime < endTime;
    }).sort((a, b) => a.zIndex - b.zIndex)
  , [timeline, currentTime]);

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
    } else {
      setCurrentTime(totalDuration);
    }
  };

  const toggleFullscreen = () => {
    const element = canvasRef.current; // Target the canvas for fullscreen
    if (!element) return;

    if (!document.fullscreenElement) {
      element.requestFullscreen().catch(err => {
        console.error(`Error attempting to enable full-screen mode: ${err.message} (${err.name})`);
      });
    } else {
      document.exitFullscreen();
    }
  };

  return (
    <div className="preview-modal-overlay" ref={modalRef} onClick={onClose}>
      <div className="preview-modal" onClick={(e) => e.stopPropagation()}>
        <div className="preview-header">
          <h3>Preview</h3>
          <button onClick={onClose} className="close-btn">
            <FiX />
          </button>
        </div>
        
        <div className="preview-canvas">
          <div
            className="preview-canvas-inner"
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
                style={getSlideStyle(slide)}
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
        </div>

        <div className="preview-controls">
          <button onClick={handlePrevious} title="Previous Slide">
            <FiSkipBack />
          </button>
          <button onClick={togglePlayback} title={isPlaying ? "Pause" : "Play"}>
            {isPlaying ? <FiPause /> : <FiPlay />}
          </button>
          <button onClick={handleNext} title="Next Slide">
            <FiSkipForward />
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
          <button onClick={() => setIsLooping(prev => !prev)} title="Toggle Loop" style={{ color: isLooping ? 'var(--color-accent)' : 'inherit' }}>
            <FiRepeat />
          </button>
          <button onClick={toggleFullscreen} title={isFullscreen ? "Exit Fullscreen" : "Enter Fullscreen"}>
            {isFullscreen ? <FiMinimize /> : <FiMaximize />}
          </button>
        </div>
      </div>
    </div>
  );
};
export default PreviewModal;