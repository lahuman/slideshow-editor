import React, { useState, useRef, useMemo, useEffect } from 'react';
import ImageLibrary from './components/ImageLibrary';
import Timeline from './components/Timeline';
import ImageCanvas from './components/ImageCanvas';
import ControlPanel from './components/ControlPanel';
import PreviewModal from './components/PreviewModal';
import MobileWarning from './components/MobileWarning'; // 1. Import component
import { 
  FiPlay, FiPause, FiDownload, FiEye, FiUpload, 
  FiChevronsLeft, FiChevronsRight 
} from 'react-icons/fi';
import { ImageFile, Slide, CanvasSettings, TextSlide, SlideshowData } from './types';
import { DragEndEvent } from '@dnd-kit/core';
import './App.css';

const App: React.FC = () => {
  const [images, setImages] = useState<ImageFile[]>([]);
  const [timeline, setTimeline] = useState<Slide[]>([]);
  const [textSlides, setTextSlides] = useState<TextSlide[]>([]);
  const [selectedTextSlideId, setSelectedTextSlideId] = useState<number | null>(null);
  const [selectedSlideIds, setSelectedSlideIds] = useState<number[]>([]);
  const [lastSelectedId, setLastSelectedId] = useState<number | null>(null);
  const [currentTime, setCurrentTime] = useState<number>(0);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [showPreview, setShowPreview] = useState<boolean>(false);
  const [isLeftPanelOpen, setIsLeftPanelOpen] = useState<boolean>(true);
  const [isRightPanelOpen, setIsRightPanelOpen] = useState<boolean>(true);
  
  // 2. State to track mobile view
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

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
  const playbackRafRef = useRef<number | null>(null);
  const lastPlaybackTsRef = useRef<number | null>(null);
  const prevCanvasDimensionsRef = useRef<{ width: number; height: number } | null>(null);

  // 3. Effect to update mobile state on resize
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

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

  useEffect(() => {
    const prev = prevCanvasDimensionsRef.current;
    const next = canvasDimensions;

    if (!prev) {
      prevCanvasDimensionsRef.current = next;
      return;
    }

    if (
      prev.width <= 0 ||
      prev.height <= 0 ||
      next.width <= 0 ||
      next.height <= 0
    ) {
      prevCanvasDimensionsRef.current = next;
      return;
    }

    if (prev.width === next.width && prev.height === next.height) {
      return;
    }

    const scaleX = next.width / prev.width;
    const scaleY = next.height / prev.height;
    const uniformScale = Math.min(scaleX, scaleY);

    setTimeline(prevTimeline =>
      prevTimeline.map(slide => ({
        ...slide,
        position: {
          x: slide.position.x * scaleX,
          y: slide.position.y * scaleY,
        },
        scale: slide.scale * uniformScale,
      }))
    );

    setTextSlides(prevTextSlides =>
      prevTextSlides.map(slide => ({
        ...slide,
        position: {
          x: slide.position.x * scaleX,
          y: slide.position.y * scaleY,
        },
        maxWidth: slide.maxWidth * scaleX,
        fontSize: Math.max(8, slide.fontSize * uniformScale),
      }))
    );

    prevCanvasDimensionsRef.current = next;
  }, [canvasDimensions]);

  const selectedSlides = useMemo(() => 
    timeline.filter(slide => selectedSlideIds.includes(slide.id)),
    [timeline, selectedSlideIds]
  );
  const selectedTextSlide = useMemo(
    () => textSlides.find(slide => slide.id === selectedTextSlideId) ?? null,
    [textSlides, selectedTextSlideId]
  );

  const totalDuration = Math.max(
    timeline.reduce((max, slide) => Math.max(max, slide.startTime + slide.duration), 0),
    textSlides.reduce((max, slide) => Math.max(max, slide.startTime + slide.duration), 0)
  );

  const getNextPlacement = (duration: number) => {
    const allSlides = [
      ...timeline.map(slide => ({ startTime: slide.startTime, duration: slide.duration, track: slide.track })),
      ...textSlides.map(slide => ({ startTime: slide.startTime, duration: slide.duration, track: slide.track })),
    ];
    const trackEndTimes: { [key: number]: number } = {};

    allSlides.forEach(slide => {
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

    if (allSlides.length > 0 && earliestEndTime > 0) {
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
        targetTrack = Math.max(...Object.keys(trackEndTimes).map(Number)) + 1;
        earliestEndTime = 0;
      }
    }

    return { startTime: earliestEndTime, track: targetTrack, duration };
  };

  // 텍스트 슬라이드 추가 (중앙 하단에 기본 자막 박스)
  const addTextSlide = (text = '새 자막'): void => {
    if (canvasDimensions.width === 0 || canvasDimensions.height === 0) return;

    const width = Math.min(400, canvasDimensions.width * 0.8);
    const x = (canvasDimensions.width - width) / 2;
    const y = canvasDimensions.height - 120;
    const placement = getNextPlacement(3);

    const newText: TextSlide = {
      id: Date.now(),
      text,
      startTime: placement.startTime,
      duration: placement.duration,
      position: { x, y },
      rotation: 0,
      fontSize: 24,
      color: '#ffffff',
      backgroundColor: 'rgba(0, 0, 0, 0.7)',
      maxWidth: width,
      align: 'center',
      zIndex: 999,
      track: placement.track,
    };

    setTextSlides((prev) => [...prev, newText]);
  };

  React.useEffect(() => {
    const stopLoop = () => {
      if (playbackRafRef.current !== null) {
        cancelAnimationFrame(playbackRafRef.current);
        playbackRafRef.current = null;
      }
      lastPlaybackTsRef.current = null;
    };

    if (!isPlaying || totalDuration <= 0) {
      stopLoop();
      return stopLoop;
    }

    const tick = (ts: number) => {
      if (lastPlaybackTsRef.current === null) {
        lastPlaybackTsRef.current = ts;
      }

      const deltaSec = Math.max(0, (ts - lastPlaybackTsRef.current) / 1000);
      lastPlaybackTsRef.current = ts;

      setCurrentTime(prevTime => {
        const nextTime = prevTime + deltaSec;
        if (nextTime >= totalDuration) {
          return 0;
        }
        return nextTime;
      });

      playbackRafRef.current = requestAnimationFrame(tick);
    };

    playbackRafRef.current = requestAnimationFrame(tick);

    return stopLoop;
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

    const initialX = (canvasDimensions.width - (image.width * scale)) / 2;
    const initialY = (canvasDimensions.height - (image.height * scale)) / 2;

    const placement = getNextPlacement(3);

    setTimeline(prevTimeline => {
      const newSlide: Slide = {
        id: Date.now(),
        image,
        startTime: placement.startTime,
        duration: placement.duration,
        position: { x: initialX, y: initialY },
        scale,
        rotation: 0,
        transition: 'fade',
        transitionDuration: 0.5,
        zIndex: prevTimeline.length,
        track: placement.track,
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

  const updateTextSlides = (slideIds: number[], updates: Partial<TextSlide>): void => {
    setTextSlides(prev =>
      prev.map(slide => (slideIds.includes(slide.id) ? { ...slide, ...updates } : slide))
    );
  };

  const removeTextSlides = (slideIds: number[]): void => {
    setTextSlides(prev => prev.filter(slide => !slideIds.includes(slide.id)));
    setSelectedTextSlideId(prev => (prev !== null && slideIds.includes(prev) ? null : prev));
  };

  const createTextSlideFromLibrary = (text: string): void => {
    addTextSlide(text);
  };

  const updateCanvasSettings = (updates: Partial<CanvasSettings>): void => {
    setCanvasSettings(prevSettings => ({ ...prevSettings, ...updates }));
  };

  const removeSlides = (slideIds: number[]): void => {
    setTimeline(prevTimeline => prevTimeline.filter(slide => !slideIds.includes(slide.id)));
    setSelectedSlideIds(prevIds => prevIds.filter(id => !slideIds.includes(id)));
  };

  const handleSlideSelect = (clickedId: number, { shift, ctrl }: { shift: boolean, ctrl: boolean }): void => {
    if (clickedId === 0) {
      setSelectedSlideIds([]);
      setSelectedTextSlideId(null);
      setLastSelectedId(null);
      return;
    }

    setSelectedTextSlideId(null);
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

    const targetSlide = timeline.find(slide => slide.id === clickedId);
    if (targetSlide) {
      setCurrentTime(targetSlide.startTime);
    }
  };

  const handleTextSlideSelect = (slideId: number): void => {
    const targetSlide = textSlides.find(slide => slide.id === slideId);
    if (!targetSlide) return;

    setSelectedSlideIds([]);
    setLastSelectedId(null);
    setSelectedTextSlideId(slideId);
    setCurrentTime(targetSlide.startTime);
  };

  const handleTimelineDragEnd = (event: DragEndEvent) => {
    const { active, delta } = event;
    const activeId = String(active.id);
    const [dragType, rawId] = activeId.split('-');
    const draggedId = Number(rawId);

    if (!Number.isFinite(draggedId)) {
      return;
    }

    const trackHeight = 60;
    const pixelsPerSecond = 60;
    const overlaps = (
      aStart: number,
      aDuration: number,
      bStart: number,
      bDuration: number
    ): boolean => aStart < bStart + bDuration && aStart + aDuration > bStart;

    if (dragType === 'image') {
      const wasSelected = selectedSlideIds.includes(draggedId);
      const idsToMove = wasSelected ? selectedSlideIds : [draggedId];

      if (!wasSelected) {
        setSelectedSlideIds([draggedId]);
        setLastSelectedId(draggedId);
      }

      setTimeline(prevTimeline => {
        const updatedTimeline = [...prevTimeline];
        const slidesToMove = updatedTimeline.filter(s => idsToMove.includes(s.id));

        for (const slideToMove of slidesToMove) {
          const newStartTime = Math.max(0, slideToMove.startTime + delta.x / pixelsPerSecond);
          const newTrack = Math.round(slideToMove.track + delta.y / trackHeight);
          const clampedTrack = Math.max(0, Math.min(newTrack, 4));

          const collisionWithImages = updatedTimeline.some(slide =>
            !idsToMove.includes(slide.id) &&
            slide.track === clampedTrack &&
            overlaps(newStartTime, slideToMove.duration, slide.startTime, slide.duration)
          );

          const collisionWithText = textSlides.some(slide =>
            slide.track === clampedTrack &&
            overlaps(newStartTime, slideToMove.duration, slide.startTime, slide.duration)
          );

          if (collisionWithImages || collisionWithText) {
            return prevTimeline;
          }
        }

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
      return;
    }

    if (dragType === 'text') {
      setTextSlides(prevTextSlides => {
        const movingSlide = prevTextSlides.find(slide => slide.id === draggedId);
        if (!movingSlide) return prevTextSlides;

        const newStartTime = Math.max(0, movingSlide.startTime + delta.x / pixelsPerSecond);
        const newTrack = Math.round(movingSlide.track + delta.y / trackHeight);
        const clampedTrack = Math.max(0, Math.min(newTrack, 4));

        const collisionWithText = prevTextSlides.some(slide =>
          slide.id !== movingSlide.id &&
          slide.track === clampedTrack &&
          overlaps(newStartTime, movingSlide.duration, slide.startTime, slide.duration)
        );

        const collisionWithImages = timeline.some(slide =>
          slide.track === clampedTrack &&
          overlaps(newStartTime, movingSlide.duration, slide.startTime, slide.duration)
        );

        if (collisionWithText || collisionWithImages) {
          return prevTextSlides;
        }

        return prevTextSlides.map(slide =>
          slide.id === movingSlide.id
            ? { ...slide, startTime: newStartTime, track: clampedTrack }
            : slide
        );
      });
    }
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

  const fileToDataURL = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = (error) => reject(error);
      reader.readAsDataURL(file);
    });
  };

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

      const finalTimeline = serializableTimeline.filter(
        (slide): slide is NonNullable<typeof slide> => Boolean(slide)
      );

      if (finalTimeline.length !== timeline.length) {
        alert('Some slides could not be exported because their image source was missing.');
      }

      const slideshowData = {
        timeline: finalTimeline,
        textSlides,
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
      const data: Partial<SlideshowData> & { timeline: any[] } = JSON.parse(fileContent);

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
      setTextSlides(
        Array.isArray(data.textSlides)
          ? data.textSlides.map((slide) => ({
              ...slide,
              rotation: typeof slide.rotation === 'number' ? slide.rotation : 0,
            }))
          : []
      );
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
    if (event.target) {
      event.target.value = '';
    }
  };

  const triggerFileSelect = () => fileInputRef.current?.click();

  return (
    <div className="app">
      {/* 4. Conditionally render the warning overlay */}
      {isMobile && <MobileWarning />}

      <header className="app-header">
        <div className="header-section" style={{ flex: 1, justifyContent: 'flex-start' }}>
          <button onClick={toggleLeftPanel} className="header-toggle-btn" title={isLeftPanelOpen ? "Close Library" : "Open Library"}>
            <FiChevronsLeft style={{ transform: isLeftPanelOpen ? 'none' : 'rotate(180deg)' }} />
          </button>
          <span className="app-title">SlideFlow</span>
        </div>
        <div className="header-section toolbar">
          <button
            onClick={togglePlayback}
            title={isPlaying ? "Pause" : "Play"}
            className={`player-main-btn ${isPlaying ? 'active' : ''}`}
          >
            {isPlaying ? <FiPause /> : <FiPlay />}
          </button>
          <div className={`mini-visualizer ${isPlaying ? 'active' : ''}`} aria-hidden="true">
            <span className="bar" />
            <span className="bar" />
            <span className="bar" />
            <span className="bar" />
            <span className="bar" />
          </div>
          <button onClick={() => setShowPreview(true)} title="Preview">
            <FiEye />
          </button>
          <input
            type="file"
            ref={fileInputRef}
            style={{ display: 'none' }}
            accept=".json"
            onChange={handleFileChange}
          />
          <button onClick={triggerFileSelect} title="Import Project">
            <FiUpload />
          </button>
          <button onClick={exportSlideshow} className="primary-action" title="Export Project">
            <FiDownload />
            <span>Export</span>
          </button>
        </div>
        <div className="header-section" style={{ flex: 1, justifyContent: 'flex-end' }}>
          <button onClick={toggleRightPanel} className="header-toggle-btn" title={isRightPanelOpen ? "Close Properties" : "Open Properties"}>
            <FiChevronsRight style={{ transform: isRightPanelOpen ? 'none' : 'rotate(180deg)' }} />
          </button>
        </div>
      </header>

      <div className="app-body">
        <div className={`left-panel ${isLeftPanelOpen ? '' : 'closed'}`}>
          <h2>Library</h2>
          <ImageLibrary
            images={images}
            onImageUpload={handleImageUpload}
            onAddToTimeline={addToTimeline}
            onCreateTextSlide={createTextSlideFromLibrary}
          />
        </div>

        <div className="center-panel">
          <ImageCanvas
            ref={canvasRef}
            canvasContainerRef={canvasContainerRef}
            timeline={timeline}
            textSlides={textSlides}
            currentTime={currentTime}
            selectedSlideIds={selectedSlideIds}
            selectedTextSlideId={selectedTextSlideId}
            onSlideSelect={handleSlideSelect}
            onTextSlideSelect={handleTextSlideSelect}
            onSlidesUpdate={updateSlides}
            onTextSlidesUpdate={updateTextSlides}
            isPlaying={isPlaying}
            canvasSettings={canvasSettings}
            canvasDimensions={canvasDimensions}
          />
        </div>

        <div className={`right-panel ${isRightPanelOpen ? '' : 'closed'}`}>
          <h2>Properties</h2>
          <ControlPanel
            selectedSlides={selectedSlides}
            onSlidesUpdate={updateSlides}
            selectedTextSlide={selectedTextSlide}
            onTextSlideUpdate={(updates) => {
              if (selectedTextSlideId !== null) {
                updateTextSlides([selectedTextSlideId], updates);
              }
            }}
            canvasSettings={canvasSettings}
            onCanvasSettingsChange={updateCanvasSettings}
          />
        </div>
      </div>

      <div className="timeline-container">
        <Timeline
          timeline={timeline}
          textSlides={textSlides}
          currentTime={currentTime}
          onSlidesUpdate={updateSlides}
          onSlidesRemove={removeSlides}
          onTextSlidesUpdate={updateTextSlides}
          onTextSlidesRemove={removeTextSlides}
          onSlideSelect={handleSlideSelect}
          onTextSlideSelect={handleTextSlideSelect}
          selectedSlideIds={selectedSlideIds}
          selectedTextSlideId={selectedTextSlideId}
          onTimelineDragEnd={handleTimelineDragEnd}
        />
      </div>

      {showPreview && (
        <PreviewModal
          timeline={timeline}
          textSlides={textSlides}
          onClose={() => setShowPreview(false)}
          canvasSettings={canvasSettings}
          mainCanvasDimensions={canvasDimensions}
        />
      )}
    </div>
  );
};

export default App;
