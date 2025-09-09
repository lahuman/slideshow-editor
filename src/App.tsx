import React, { useState, useRef, useMemo, useEffect } from 'react';
import ImageLibrary from './components/ImageLibrary';
import Timeline from './components/Timeline';
import ImageCanvas from './components/ImageCanvas';
import ControlPanel from './components/ControlPanel';
import PreviewModal from './components/PreviewModal';
import { FaPause, FaDownload, FaEye, FaAngleDoubleLeft, FaAngleDoubleRight, FaUpload } from 'react-icons/fa';
import { ImageFile, Slide, CanvasSettings } from './types';
import { DragEndEvent } from '@dnd-kit/core';
import './App.css';

const App: React.FC = () => {
  const [images, setImages] = useState<ImageFile[]>([]);
  const [timeline, setTimeline] = useState<Slide[]>([]);
  const [selectedSlideIds, setSelectedSlideIds] = useState<number[]>([]);
  const [lastSelectedId, setLastSelectedId] = useState<number | null>(null);
  const [currentTime, setCurrentTime] = useState<number>(0);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [showPreview, setShowPreview] = useState<boolean>(false);
  const [isLeftPanelOpen, setIsLeftPanelOpen] = useState<boolean>(true);
  const [isRightPanelOpen, setIsRightPanelOpen] = useState<boolean>(true);
  const [canvasSettings, setCanvasSettings] = useState<CanvasSettings>({
    aspectRatio: '16:9',
    backgroundColor: '#000000',
    width: 1920,
    height: 1080,
    fps: 30,
  });
  const [canvasDimensions, setCanvasDimensions] = useState({ width: 0, height: 0 });
  const canvasContainerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const resizeObserver = new ResizeObserver(entries => {
      if (!entries || entries.length === 0) {
        return;
      }
      const { width, height } = entries[0].contentRect;
      const [ratioWidth, ratioHeight] = canvasSettings.aspectRatio.split(':').map(Number);
      
      let newWidth = width;
      let newHeight = (width / ratioWidth) * ratioHeight;

      if (newHeight > height) {
        newHeight = height;
        newWidth = (height / ratioHeight) * ratioWidth;
      }

      setCanvasDimensions({ width: newWidth, height: newHeight });
    });

    if (canvasContainerRef.current) {
      resizeObserver.observe(canvasContainerRef.current);
    }

    return () => {
      resizeObserver.disconnect();
    };
  }, [canvasSettings.aspectRatio]);

  const selectedSlides = useMemo(() => 
    timeline.filter(slide => selectedSlideIds.includes(slide.id)),
    [timeline, selectedSlideIds]
  );

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
    const newImagesPromises = Array.from(files).map((file, index) => {
      return new Promise<ImageFile>((resolve) => {
        const img = new Image();
        const url = URL.createObjectURL(file);
        img.onload = () => {
          const imageFile: ImageFile = {
            id: Date.now() + index,
            name: file.name,
            url,
            file,
            width: img.width,
            height: img.height,
          };
          resolve(imageFile);
        };
        img.src = url;
      });
    });

    Promise.all(newImagesPromises).then((newImages) => {
      setImages((prevImages) => [...prevImages, ...newImages]);
    });
  };

  const addToTimeline = (image: ImageFile): void => {
    if (canvasDimensions.width === 0 || canvasDimensions.height === 0) return;

    const scaleX = canvasDimensions.width / image.width;
    const scaleY = canvasDimensions.height / image.height;
    const scale = Math.min(scaleX, scaleY, 1);

    // Calculate initial position to center the image
    const initialX = (canvasDimensions.width - (image.width * scale)) / 2;
    const initialY = (canvasDimensions.height - (image.height * scale)) / 2;

    setTimeline(prevTimeline => {
      const trackEndTimes: { [key: number]: number } = {};
      prevTimeline.forEach(slide => {
        trackEndTimes[slide.track] = Math.max(trackEndTimes[slide.track] || 0, slide.startTime + slide.duration);
      });

      let targetTrack = 0;
      let earliestEndTime = trackEndTimes[0] || 0;

      for (const track in trackEndTimes) {
        if (trackEndTimes[track] < earliestEndTime) {
          earliestEndTime = trackEndTimes[track];
          targetTrack = parseInt(track, 10);
        }
      }

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
        position: { x: initialX, y: initialY }, // Use calculated initial position
        scale,
        rotation: 0,
        transition: 'fade',
        transitionDuration: 0.5,
        zIndex: prevTimeline.length,
        track: targetTrack,
      };

      return [...prevTimeline, newSlide];
    });
  };

  const updateSlides = (slideIds: number[], updates: Partial<Slide>): void => {
    setTimeline(prevTimeline =>
      prevTimeline.map(slide =>
        slideIds.includes(slide.id) ? { ...slide, ...updates } : slide
      )
    );
  };

  const updateCanvasSettings = (updates: Partial<CanvasSettings>): void => {
    setCanvasSettings(prevSettings => ({ ...prevSettings, ...updates }));
  };

  const removeSlides = (slideIds: number[]): void => {
    setTimeline(prevTimeline => prevTimeline.filter(slide => !slideIds.includes(slide.id)));
    setSelectedSlideIds(prevIds => prevIds.filter(id => !slideIds.includes(id)));
  };

  const handleSlideSelect = (clickedId: number, { shift, ctrl }: { shift: boolean, ctrl: boolean }): void => {
    const sortedTimeline = [...timeline].sort((a, b) => a.startTime - b.startTime);

    if (shift && lastSelectedId) {
      const lastIndex = sortedTimeline.findIndex(s => s.id === lastSelectedId);
      const currentIndex = sortedTimeline.findIndex(s => s.id === clickedId);
      const start = Math.min(lastIndex, currentIndex);
      const end = Math.max(lastIndex, currentIndex);
      const inRangeIds = sortedTimeline.slice(start, end + 1).map(s => s.id);
      setSelectedSlideIds(inRangeIds);
    } else if (ctrl) {
      setSelectedSlideIds(prev => 
        prev.includes(clickedId) ? prev.filter(id => id !== clickedId) : [...prev, clickedId]
      );
      setLastSelectedId(clickedId);
    } else {
      setSelectedSlideIds([clickedId]);
      setLastSelectedId(clickedId);
    }
  };

  const handleTimelineDragEnd = (event: DragEndEvent) => {
    const { active, delta } = event;
    const draggedId = active.id as number;

    // Determine which slides to move.
    const wasSelected = selectedSlideIds.includes(draggedId);
    const idsToMove = wasSelected ? selectedSlideIds : [draggedId];

    // If the dragged slide was not part of the selection, update the selection state for the UI.
    if (!wasSelected) {
      setSelectedSlideIds([draggedId]);
      setLastSelectedId(draggedId);
    }

    const trackHeight = 60;
    const pixelsPerSecond = 60;

    setTimeline(prevTimeline => {
      const updatedTimeline = [...prevTimeline];
      
      // Check for collisions before committing any changes
      // Use the immediate idsToMove, not the stale selectedSlideIds from state
      const slidesToMove = updatedTimeline.filter(s => idsToMove.includes(s.id));
      
      for (const slideToMove of slidesToMove) {
        const newStartTime = Math.max(0, slideToMove.startTime + delta.x / pixelsPerSecond);
        const newTrack = Math.round(slideToMove.track + delta.y / trackHeight);
        const clampedTrack = Math.max(0, Math.min(newTrack, 4));

        const collision = updatedTimeline.some(slide => 
          !idsToMove.includes(slide.id) && // Don't check against other selected slides
          slide.track === clampedTrack &&
          (newStartTime < slide.startTime + slide.duration && newStartTime + slideToMove.duration > slide.startTime)
        );

        if (collision) {
          console.log("Collision detected! Reverting drag.");
          return prevTimeline; // Abort update
        }
      }

      // If no collisions, apply changes
      return updatedTimeline.map(slide => {
        if (idsToMove.includes(slide.id)) {
          const newStartTime = Math.max(0, slide.startTime + delta.x / pixelsPerSecond);
          const newTrack = Math.round(slide.track + delta.y / trackHeight);
          return { 
            ...slide, 
            startTime: newStartTime,
            track: Math.max(0, Math.min(newTrack, 4))
          };
        }
        return slide;
      });
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

  // Helper to convert File object to Base64 Data URL
const fileToDataURL = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = (error) => reject(error);
    reader.readAsDataURL(file);
  });
};

// Helper to convert Base64 Data URL back to a File object
const dataURLtoFile = async (dataUrl: string, filename: string): Promise<File> => {
    const res = await fetch(dataUrl);
    const blob = await res.blob();
    return new File([blob], filename, { type: blob.type });
};

  const exportSlideshow = async (): Promise<void> => {
    if (!canvasRef.current) return;

    try {
      const serializableTimeline = await Promise.all(
        timeline.map(async (slide) => {
          if (!slide.image.file) {
            console.warn(`Slide ${slide.id} is missing image file source and will be skipped.`);
            return null;
          }
          const dataURL = await fileToDataURL(slide.image.file);
          const serializableImage = {
            id: slide.image.id,
            name: slide.image.name,
            width: slide.image.width,
            height: slide.image.height,
            dataURL: dataURL,
          };
          return {
            ...slide,
            image: serializableImage,
          };
        })
      );

      const finalTimeline = serializableTimeline.filter(Boolean);

      if (finalTimeline.length !== timeline.length) {
        alert('Some slides could not be exported because their image source was missing.');
      }

      const slideshowData = {
        timeline: finalTimeline,
        settings: canvasSettings
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
    } catch (error) {
      console.error("Failed to export slideshow:", error);
      alert(`Failed to export slideshow: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  const importSlideshow = async (file: File) => {
    const reader = new FileReader();
    const fileContent = await new Promise<string>((resolve, reject) => {
      reader.onload = (e) => {
        const text = e.target?.result;
        if (typeof text === 'string') {
          resolve(text);
        } else {
          reject(new Error('File could not be read as text.'));
        }
      };
      reader.onerror = () => reject(new Error('Error reading file.'));
      reader.readAsText(file);
    });

    try {
      const data = JSON.parse(fileContent);

      if (!data.timeline || !data.settings) {
        throw new Error('Invalid slideshow file format.');
      }

      const newImages: ImageFile[] = [];
      const newTimeline: Slide[] = [];
      const imageCache = new Map<number, ImageFile>();

      for (const slideData of data.timeline) {
        let imageFile = imageCache.get(slideData.image.id);

        if (!imageFile) {
          const imageFileObject = await dataURLtoFile(slideData.image.dataURL, slideData.image.name);
          const imageUrl = URL.createObjectURL(imageFileObject);

          imageFile = {
            id: slideData.image.id,
            name: slideData.image.name,
            url: imageUrl,
            file: imageFileObject,
            width: slideData.image.width,
            height: slideData.image.height,
          };
          newImages.push(imageFile);
          imageCache.set(imageFile.id, imageFile);
        }
        
        const newSlide: Slide = {
          ...slideData,
          image: imageFile,
        };
        newTimeline.push(newSlide);
      }

      setImages(prevImages => {
        const existingImageIds = new Set(prevImages.map(img => img.id));
        const imagesToAdd = newImages.filter(img => !existingImageIds.has(img.id));
        return [...prevImages, ...imagesToAdd];
      });

      setTimeline(newTimeline);
      setCanvasSettings(data.settings);
      setSelectedSlideIds([]);
      setCurrentTime(0);
      setIsPlaying(false);
      alert('Slideshow imported successfully!');
    } catch (error) {
      console.error("Failed to import slideshow:", error);
      alert(`Failed to import slideshow: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      await importSlideshow(file);
    }
    // Reset file input to allow re-selection of the same file
    if (event.target) {
      event.target.value = '';
    }
  };

  const triggerFileSelect = () => fileInputRef.current?.click();

  return (
    <div className="app">
      <header className="app-header">
        <div className="header-section header-left">
          <button onClick={toggleLeftPanel} className="panel-toggle-btn">
            <FaAngleDoubleLeft style={{ transform: isLeftPanelOpen ? 'none' : 'rotate(180deg)' }} />
          </button>
          <h1>슬라이드쇼 에디터</h1>
        </div>
        <div className="header-section toolbar">
          <button onClick={togglePlayback} className="play-btn">
            {isPlaying ? <FaPause /> : '재생'}
          </button>
          <button onClick={() => setShowPreview(true)} className="preview-btn">
            <FaEye /> 미리보기
          </button>
          <input
            type="file"
            ref={fileInputRef}
            style={{ display: 'none' }}
            accept=".json"
            onChange={handleFileChange}
          />
          <button onClick={triggerFileSelect} className="import-btn">
            <FaUpload /> 불러오기
          </button>
          <button onClick={exportSlideshow} className="export-btn">
            <FaDownload /> 내보내기
          </button>
        </div>
        <div className="header-section header-right">
          <button onClick={toggleRightPanel} className="panel-toggle-btn">
            <FaAngleDoubleRight style={{ transform: isRightPanelOpen ? 'none' : 'rotate(180deg)' }} />
          </button>
        </div>
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
            canvasContainerRef={canvasContainerRef}
            timeline={timeline}
            currentTime={currentTime}
            selectedSlideIds={selectedSlideIds}
            onSlideSelect={handleSlideSelect}
            onSlidesUpdate={updateSlides}
            isPlaying={isPlaying}
            canvasSettings={canvasSettings}
            canvasDimensions={canvasDimensions}
          />
          
          <Timeline
            timeline={timeline}
            currentTime={currentTime}
            
            onSlidesUpdate={updateSlides}
            onSlidesRemove={removeSlides}
            onSlideSelect={handleSlideSelect}
            selectedSlideIds={selectedSlideIds}
            onTimelineDragEnd={handleTimelineDragEnd}
          />
        </div>

        <div className={`right-panel ${isRightPanelOpen ? '' : 'closed'}`}>
          <ControlPanel
            selectedSlides={selectedSlides}
            onSlidesUpdate={updateSlides}
            canvasSettings={canvasSettings}
            onCanvasSettingsChange={updateCanvasSettings}
          />
        </div>
      </div>

      {showPreview && (
        <PreviewModal
          timeline={timeline}
          onClose={() => setShowPreview(false)}
          canvasSettings={canvasSettings}
          mainCanvasDimensions={canvasDimensions}
        />
      )}
    </div>
  );
};

export default App;
