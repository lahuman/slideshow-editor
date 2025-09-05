import React, { useState, useRef } from 'react';
import ImageLibrary from './components/ImageLibrary';
import Timeline from './components/Timeline';
import ImageCanvas from './components/ImageCanvas';
import ControlPanel from './components/ControlPanel';
import PreviewModal from './components/PreviewModal';
import { FaPlay, FaPause, FaDownload, FaEye, FaAngleDoubleLeft, FaAngleDoubleRight } from 'react-icons/fa';
import { ImageFile, Slide, SlideshowData } from './types';
import { DragEndEvent } from '@dnd-kit/core';
import './App.css';

const App: React.FC = () => {
  const [images, setImages] = useState<ImageFile[]>([]);
  const [timeline, setTimeline] = useState<Slide[]>([]);
  const [selectedSlide, setSelectedSlide] = useState<Slide | null>(null);
  const [currentTime, setCurrentTime] = useState<number>(0);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [showPreview, setShowPreview] = useState<boolean>(false);
  const [isLeftPanelOpen, setIsLeftPanelOpen] = useState<boolean>(true);
  const [isRightPanelOpen, setIsRightPanelOpen] = useState<boolean>(true);
  const canvasRef = useRef<HTMLDivElement>(null);

  const totalDuration = timeline.reduce((max, slide) => 
    Math.max(max, slide.startTime + slide.duration), 0
  );

  React.useEffect(() => {
    let interval: number;
    if (isPlaying) {
      interval = window.setInterval(() => {
        setCurrentTime(prevTime => {
          if (prevTime >= totalDuration) {
            return 0; // Loop back to the start
          }
          return prevTime + 0.1;
        });
      }, 100);
    }
    return () => window.clearInterval(interval);
  }, [isPlaying, totalDuration]);

  const handleImageUpload = (files: FileList): void => {
    const newImages: ImageFile[] = Array.from(files).map((file, index) => ({
      id: Date.now() + index,
      name: file.name,
      url: URL.createObjectURL(file),
      file
    }));
    setImages(prevImages => [...prevImages, ...newImages]);
  };

  const addToTimeline = (image: ImageFile): void => {
    setTimeline(prevTimeline => {
      const trackEndTimes: { [key: number]: number } = {};
      prevTimeline.forEach(slide => {
        trackEndTimes[slide.track] = Math.max(trackEndTimes[slide.track] || 0, slide.startTime + slide.duration);
      });

      let targetTrack = 0;
      let earliestEndTime = trackEndTimes[0] || 0;

      // Find the track that finishes earliest
      for (const track in trackEndTimes) {
        if (trackEndTimes[track] < earliestEndTime) {
          earliestEndTime = trackEndTimes[track];
          targetTrack = parseInt(track, 10);
        }
      }

      // If all existing tracks are occupied at time 0, find a new track
      if (prevTimeline.length > 0 && earliestEndTime > 0) {
        let foundEmptyTrack = false;
        for (let i = 0; i < Object.keys(trackEndTimes).length + 1; i++) {
          if (!trackEndTimes[i]) {
            targetTrack = i;
            earliestEndTime = 0;
            foundEmptyTrack = true;
            break;
          }
        }
        if (!foundEmptyTrack) {
            const nextTrack = Math.max(...Object.keys(trackEndTimes).map(Number)) + 1;
            targetTrack = nextTrack;
            earliestEndTime = 0;
        }
      }


      const newSlide: Slide = {
        id: Date.now(),
        image,
        startTime: earliestEndTime,
        duration: 3,
        position: { x: 0, y: 0 },
        scale: 1,
        rotation: 0,
        transition: 'fade',
        transitionDuration: 0.5,
        zIndex: prevTimeline.length,
        track: targetTrack,
      };

      return [...prevTimeline, newSlide];
    });
  };

  const updateSlide = (slideId: number, updates: Partial<Slide>): void => {
    setTimeline(prevTimeline =>
      prevTimeline.map(slide =>
        slide.id === slideId ? { ...slide, ...updates } : slide
      )
    );
    
    // 선택된 슬라이드도 업데이트
    if (selectedSlide?.id === slideId) {
      setSelectedSlide(prevSelected =>
        prevSelected ? { ...prevSelected, ...updates } : null
      );
    }
  };

  const removeSlide = (slideId: number): void => {
    setTimeline(prevTimeline => {
      const newTimeline = prevTimeline.filter(slide => slide.id !== slideId);
      
      let accumulatedTime = 0;
      const updatedTimeline = newTimeline.map(slide => {
        const newSlide = { ...slide, startTime: accumulatedTime };
        accumulatedTime += slide.duration;
        return newSlide;
      });

      return updatedTimeline;
    });

    if (selectedSlide?.id === slideId) {
      setSelectedSlide(null);
    }
  };

  const handleTimelineDragEnd = (event: DragEndEvent) => {
    const { active, delta } = event;
    const slideId = active.id;

    const trackHeight = 60; // from Timeline.tsx
    const pixelsPerSecond = 60; // from Timeline.tsx
    const snapThreshold = 10 / pixelsPerSecond; // 10 pixels tolerance

    setTimeline(prevTimeline => {
      const originalSlide = prevTimeline.find(s => s.id === slideId);
      if (!originalSlide) return prevTimeline;

      // Calculate new raw position
      let newStartTime = Math.max(0, originalSlide.startTime + delta.x / pixelsPerSecond);
      const newTrack = Math.round(originalSlide.track + delta.y / trackHeight);
      const clampedTrack = Math.max(0, Math.min(newTrack, 4)); // Limit to 5 tracks (0-4)

      // --- Snapping Logic ---
      const otherSlidesOnTrack = prevTimeline.filter(s => s.id !== slideId && s.track === clampedTrack);
      for (const slide of otherSlidesOnTrack) {
        const slideEndTime = slide.startTime + slide.duration;
        const slideStartTime = slide.startTime;
        const draggedSlideEndTime = newStartTime + originalSlide.duration;

        // Snap to the end of a preceding slide
        if (Math.abs(newStartTime - slideEndTime) < snapThreshold) {
          newStartTime = slideEndTime;
          break;
        }
        // Snap to the start of a succeeding slide
        if (Math.abs(draggedSlideEndTime - slideStartTime) < snapThreshold) {
          newStartTime = slideStartTime - originalSlide.duration;
          break;
        }
      }
      newStartTime = Math.max(0, newStartTime); // Ensure it doesn't snap to < 0

      // --- Collision Detection ---
      const collision = prevTimeline.some(slide => 
        slide.id !== slideId &&
        slide.track === clampedTrack &&
        (newStartTime < slide.startTime + slide.duration && newStartTime + originalSlide.duration > slide.startTime)
      );

      if (collision) {
        console.log("Collision detected! Reverting drag.");
        return prevTimeline; 
      }

      // No collision, update the slide
      return prevTimeline.map(slide => 
        slide.id === slideId 
          ? { ...slide, startTime: newStartTime, track: clampedTrack } 
          : slide
      );
    });
  };

  const togglePlayback = (): void => {
    setIsPlaying(prevPlaying => !prevPlaying);
  };

  const toggleLeftPanel = (): void => {
    setIsLeftPanelOpen(prev => !prev);
  };

  const toggleRightPanel = (): void => {
    setIsRightPanelOpen(prev => !prev);
  };

  const exportSlideshow = async (): Promise<void> => {
    if (!canvasRef.current) return;
    
    const slideshowData: SlideshowData = {
      timeline,
      settings: {
        width: 1920,
        height: 1080,
        fps: 30
      }
    };
    
    const blob = new Blob([JSON.stringify(slideshowData, null, 2)], {
      type: 'application/json'
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'slideshow.json';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="app">
      <header className="app-header">
        <button onClick={toggleLeftPanel} className="panel-toggle-btn">
          <FaAngleDoubleLeft style={{ transform: isLeftPanelOpen ? 'none' : 'rotate(180deg)' }} />
        </button>
        <h1>슬라이드쇼 에디터</h1>
        <div className="toolbar">
          <button onClick={togglePlayback} className="play-btn">
            {isPlaying ? <FaPause /> : <FaPlay />}
            {isPlaying ? '일시정지' : '재생'}
          </button>
          <button onClick={() => setShowPreview(true)} className="preview-btn">
            <FaEye /> 미리보기
          </button>
          <button onClick={exportSlideshow} className="export-btn">
            <FaDownload /> 내보내기
          </button>
        </div>
        <button onClick={toggleRightPanel} className="panel-toggle-btn">
          <FaAngleDoubleRight style={{ transform: isRightPanelOpen ? 'none' : 'rotate(180deg)' }} />
        </button>
      </header>

      <div className="app-body">
        <div className={`left-panel ${isLeftPanelOpen ? '' : 'closed'}`}>
          <ImageLibrary
            images={images}
            onImageUpload={handleImageUpload}
            onAddToTimeline={addToTimeline}
          />
        </div>

        <div className="center-panel">
          <ImageCanvas
            ref={canvasRef}
            timeline={timeline}
            currentTime={currentTime}
            selectedSlide={selectedSlide}
            onSlideSelect={setSelectedSlide}
            onSlideUpdate={updateSlide}
            isPlaying={isPlaying}
          />
          
          <Timeline
            timeline={timeline}
            currentTime={currentTime}
            onTimeChange={setCurrentTime}
            onSlideUpdate={updateSlide}
            onSlideRemove={removeSlide}
            onSlideSelect={setSelectedSlide}
            selectedSlide={selectedSlide}
            onTimelineDragEnd={handleTimelineDragEnd}
          />
        </div>

        <div className={`right-panel ${isRightPanelOpen ? '' : 'closed'}`}>
          <ControlPanel
            selectedSlide={selectedSlide}
            onSlideUpdate={updateSlide}
          />
        </div>
      </div>

      {showPreview && (
        <PreviewModal
          timeline={timeline}
          onClose={() => setShowPreview(false)}
        />
      )}
    </div>
  );
};

export default App;
