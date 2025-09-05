import React, { useState, useEffect } from 'react';
import { FaTimes, FaPlay, FaPause } from 'react-icons/fa';
import { Slide } from '../types';

interface PreviewModalProps {
  timeline: Slide[];
  onClose: () => void;
}

const PreviewModal: React.FC<PreviewModalProps> = ({ timeline, onClose }) => {
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [currentTime, setCurrentTime] = useState<number>(0);

  const totalDuration = timeline.reduce((acc, slide) => 
    Math.max(acc, slide.startTime + slide.duration), 0
  );

  useEffect(() => {
    if (isPlaying && totalDuration > 0) {
      const interval = setInterval(() => {
        setCurrentTime((prev: number) => {
          const newTime = prev + 0.1;
          if (newTime >= totalDuration) {
            setIsPlaying(false);
            return 0;
          }
          return newTime;
        });
      }, 100);
      return () => clearInterval(interval);
    }
  }, [isPlaying, totalDuration]);

  const getVisibleSlides = (): Slide[] => {
    return timeline.filter(slide => {
      const endTime = slide.startTime + slide.duration;
      return currentTime >= slide.startTime && currentTime <= endTime;
    }).sort((a, b) => a.zIndex - b.zIndex);
  };

  const handleTimeSliderChange = (e: React.ChangeEvent<HTMLInputElement>): void => {
    const newTime = parseFloat(e.target.value);
    setCurrentTime(newTime);
  };

  const togglePlayback = (): void => {
    setIsPlaying(prev => !prev);
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
        
        <div className="preview-canvas">
          {visibleSlides.map(slide => (
            <div
              key={slide.id}
              className="preview-slide"
              style={{
                position: 'absolute',
                left: slide.position.x,
                top: slide.position.y,
                transform: `scale(${slide.scale}) rotate(${slide.rotation}deg)`,
                zIndex: slide.zIndex,
                transition: `opacity ${slide.transitionDuration}s ease-in-out`
              }}
            >
              <img
                src={slide.image.url}
                alt={slide.image.name}
                style={{
                  maxWidth: '200px',
                  maxHeight: '150px',
                  objectFit: 'contain'
                }}
              />
            </div>
          ))}
        </div>

        <div className="preview-controls">
          <button 
            onClick={togglePlayback}
            className="play-btn"
          >
            {isPlaying ? <FaPause /> : <FaPlay />}
          </button>
          <div className="time-display">
            {currentTime.toFixed(1)}s / {totalDuration.toFixed(1)}s
          </div>
          <input
            type="range"
            min="0"
            max={totalDuration}
            step="0.1"
            value={currentTime}
            onChange={handleTimeSliderChange}
            className="time-slider"
          />
        </div>
      </div>
    </div>
  );
};

export default PreviewModal;
