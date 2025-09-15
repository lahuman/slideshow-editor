import React, {
  useState,
  useEffect,
  useRef,
  useMemo,
  useCallback,
} from "react";
import {
  FiX,
  FiPlay,
  FiPause,
  FiMaximize,
  FiMinimize,
  FiRepeat,
  FiSkipBack,
  FiSkipForward,
  FiVideo,
  FiDownload,
} from "react-icons/fi";
import { Slide, CanvasSettings } from "../types";

interface PreviewModalProps {
  timeline: Slide[];
  onClose: () => void;
  canvasSettings: CanvasSettings;
  mainCanvasDimensions: { width: number; height: number };
}

const PreviewModal: React.FC<PreviewModalProps> = ({
  timeline,
  onClose,
  canvasSettings,
  mainCanvasDimensions,
}) => {
  // 기본 상태
  const [isPlaying, setIsPlaying] = useState<boolean>(true);
  const [isLooping, setIsLooping] = useState<boolean>(true);
  const [currentTime, setCurrentTime] = useState<number>(0);
  const [isFullscreen, setIsFullscreen] = useState<boolean>(
    !!document.fullscreenElement
  );

  // 녹화 상태
  const [isRecording, setIsRecording] = useState<boolean>(false);
  const [hasRecorded, setHasRecorded] = useState<boolean>(false);
  const [recordedVideoUrl, setRecordedVideoUrl] = useState<string>("");
  const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder | null>(
    null
  );
  const [recordingCanvas, setRecordingCanvas] =
    useState<HTMLCanvasElement | null>(null);

  // 이미지 캐시 및 로딩 상태
  const [imageCache, setImageCache] = useState<Map<string, HTMLImageElement>>(
    new Map()
  );
  const [imagesLoaded, setImagesLoaded] = useState<boolean>(false);

  // 미리보기 영역 크기
  const [previewDimensions, setPreviewDimensions] = useState({
    width: mainCanvasDimensions.width || 800,
    height: mainCanvasDimensions.height || 600,
  });

  const modalRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLDivElement>(null);
  const recordedChunksRef = useRef<Blob[]>([]);

  // rAF 제어
  const rafIdRef = useRef<number | null>(null);
  const lastTsRef = useRef<number | null>(null);
  const playingRef = useRef<boolean>(false);
  const recordingTimeRef = useRef<number>(0); // 녹화용 시간 추적

  // 총 길이
  const totalDuration = useMemo(
    () =>
      timeline.reduce(
        (acc, slide) => Math.max(acc, slide.startTime + slide.duration),
        0
      ),
    [timeline]
  );

  // 스케일 팩터
  const scaleFactor = useMemo(() => {
    if (mainCanvasDimensions.width === 0 || previewDimensions.width === 0)
      return 0;
    return previewDimensions.width / mainCanvasDimensions.width;
  }, [mainCanvasDimensions, previewDimensions]);

  // 지원되는 MIME 타입 확인 함수
  const getSupportedMimeType = useCallback((): {
    mimeType: string;
    extension: string;
  } => {
    const formats = [
      { mimeType: "video/mp4;codecs=h264,aac", extension: "mp4" },
      { mimeType: "video/mp4", extension: "mp4" },
      { mimeType: "video/webm;codecs=vp9,opus", extension: "webm" },
      { mimeType: "video/webm;codecs=vp8,opus", extension: "webm" },
      { mimeType: "video/webm", extension: "webm" },
    ];

    for (const format of formats) {
      if (MediaRecorder.isTypeSupported(format.mimeType)) {
        console.log("Selected format:", format);
        return format;
      }
    }

    return { mimeType: "video/webm", extension: "webm" };
  }, []);

  // 이미지 사전 로딩
  const preloadImages = useCallback(async () => {
    const cache = new Map<string, HTMLImageElement>();
    const tasks = timeline.map(
      (slide) =>
        new Promise<void>((resolve) => {
          if (cache.has(slide.image.url)) {
            resolve();
            return;
          }
          const img = new Image();
          img.crossOrigin = "anonymous";
          img.onload = () => {
            cache.set(slide.image.url, img);
            resolve();
          };
          img.onerror = () => {
            console.warn(`Failed to load image: ${slide.image.url}`);
            resolve();
          };
          img.src = slide.image.url;
        })
    );

    await Promise.all(tasks);
    setImageCache(cache);
    setImagesLoaded(true);
  }, [timeline]);

  useEffect(() => {
    setImagesLoaded(false);
    if (timeline.length > 0) preloadImages();
  }, [timeline, preloadImages]);

  // 리사이즈 감시
  useEffect(() => {
    if (previewDimensions.width === 0 && mainCanvasDimensions.width > 0) {
      setPreviewDimensions({
        width: mainCanvasDimensions.width,
        height: mainCanvasDimensions.height,
      });
    }
  }, [mainCanvasDimensions, previewDimensions.width]);

  useEffect(() => {
    const resizeObserver = new ResizeObserver((entries) => {
      if (!entries || entries.length === 0) return;
      const entry = entries[0];
      const { width, height } = entry.contentRect;
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
    const onFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
      if (document.fullscreenElement) {
        setPreviewDimensions({
          width: window.innerWidth,
          height: window.innerHeight,
        });
      }
    };
    document.addEventListener("fullscreenchange", onFullscreenChange);
    return () =>
      document.removeEventListener("fullscreenchange", onFullscreenChange);
  }, []);

  // 스타일 계산 함수 - time 파라미터 추가
  const getSlideStyleAtTime = useCallback(
    (slide: Slide, time: number): React.CSSProperties => {
      const {
        startTime,
        duration,
        transition,
        transitionDuration,
        position,
        scale,
        rotation,
        zIndex,
        image,
      } = slide;
      const endTime = startTime + duration;
      const fadeInEndTime = startTime + transitionDuration;
      const fadeOutStartTime = endTime - transitionDuration;

      let opacity = 0;
      let finalTransform = `rotate(${rotation}deg)`;
      let transitionTransform = "";

      if (time >= startTime && time < endTime) {
        opacity = 1;
        let transitionProgress = 1;

        if (time < fadeInEndTime && transitionDuration > 0) {
          transitionProgress = (time - startTime) / transitionDuration;
          switch (transition) {
            case "fade":
              opacity = transitionProgress;
              break;
            case "slide":
              transitionTransform = `translateX(${
                (1 - transitionProgress) * 100
              }%)`;
              break;
            case "zoom":
              transitionTransform = `scale(${transitionProgress})`;
              break;
            case "flip":
              transitionTransform = `perspective(1000px) rotateY(${
                (1 - transitionProgress) * 90
              }deg)`;
              break;
          }
        } else if (time >= fadeOutStartTime && transitionDuration > 0) {
          transitionProgress = (endTime - time) / transitionDuration;
          switch (transition) {
            case "fade":
              opacity = transitionProgress;
              break;
            case "slide":
              transitionTransform = `translateX(${
                (1 - transitionProgress) * -100
              }%)`;
              break;
            case "zoom":
              transitionTransform = `scale(${transitionProgress})`;
              break;
            case "flip":
              transitionTransform = `perspective(1000px) rotateY(${
                (1 - transitionProgress) * -90
              }deg)`;
              break;
          }
        }
      }

      return {
        position: "absolute",
        left: position.x * scaleFactor,
        top: position.y * scaleFactor,
        width: Math.max(1, image.width * scale * scaleFactor),
        height: Math.max(1, image.height * scale * scaleFactor),
        opacity: Math.max(0, Math.min(1, opacity)),
        transform: `${finalTransform} ${transitionTransform}`.trim(),
        transformOrigin: "center",
        zIndex,
      };
    },
    [scaleFactor]
  );

  // 기존 getSlideStyle (currentTime 사용)
  const getSlideStyle = useCallback(
    (slide: Slide) => getSlideStyleAtTime(slide, currentTime),
    [getSlideStyleAtTime, currentTime]
  );

  // 현재 보이는 슬라이드
  const visibleSlides = useMemo(
    () =>
      timeline
        .filter((slide) => {
          const endTime = slide.startTime + slide.duration;
          return currentTime >= slide.startTime && currentTime < endTime;
        })
        .sort((a, b) => a.zIndex - b.zIndex),
    [timeline, currentTime]
  );

  // 특정 시간의 보이는 슬라이드
  const getVisibleSlidesAtTime = useCallback(
    (time: number) => {
      return timeline
        .filter((slide) => {
          const endTime = slide.startTime + slide.duration;
          return time >= slide.startTime && time < endTime;
        })
        .sort((a, b) => a.zIndex - b.zIndex);
    },
    [timeline]
  );

  // 캔버스에 특정 시간의 프레임 그리기
  const drawFrameToCanvasAtTime = useCallback(
    (time: number) => {
      if (!recordingCanvas || !imagesLoaded) return;

      const ctx = recordingCanvas.getContext("2d");
      if (!ctx) return;

      // 클리어 + 배경
      ctx.clearRect(0, 0, recordingCanvas.width, recordingCanvas.height);
      ctx.fillStyle = canvasSettings.backgroundColor;
      ctx.fillRect(0, 0, recordingCanvas.width, recordingCanvas.height);

      // 해당 시간의 보이는 슬라이드들
      const slidesAtTime = getVisibleSlidesAtTime(time);

      for (const slide of slidesAtTime) {
        const img = imageCache.get(slide.image.url);
        if (!img || !img.complete) continue;

        const style = getSlideStyleAtTime(slide, time);
        const left = Number(style.left) || 0;
        const top = Number(style.top) || 0;
        const width = Number(style.width) || 0;
        const height = Number(style.height) || 0;
        const opacity = Number(style.opacity ?? 1);

        if (width <= 0 || height <= 0 || opacity <= 0) continue;

        ctx.save();
        ctx.globalAlpha = opacity;

        // 회전 적용
        const centerX = left + width / 2;
        const centerY = top + height / 2;
        ctx.translate(centerX, centerY);

        const transform = `${style.transform ?? ""}`;
        const rotMatch = transform.match(/rotate\(([-\d.]+)deg\)/);
        if (rotMatch) {
          const deg = parseFloat(rotMatch[1]);
          ctx.rotate((deg * Math.PI) / 180);
        }

        try {
          ctx.imageSmoothingEnabled = true;
          ctx.imageSmoothingQuality = "high";
          ctx.drawImage(img, -width / 2, -height / 2, width, height);
        } catch (error) {
          console.error("Error drawing image to canvas:", error);
        }

        ctx.restore();
      }
    },
    [
      recordingCanvas,
      imagesLoaded,
      imageCache,
      getSlideStyleAtTime,
      getVisibleSlidesAtTime,
      canvasSettings.backgroundColor,
    ]
  );

  // 현재 시간으로 캔버스 그리기 (기존 함수)
  useCallback(() => {
    drawFrameToCanvasAtTime(currentTime);
  }, [drawFrameToCanvasAtTime, currentTime]);

  // rAF 루프 - 녹화 모드와 실시간 모드 분리
  const tick = useCallback(
    (ts: number) => {
      if (!playingRef.current) return;

      if (lastTsRef.current == null) {
        lastTsRef.current = ts;
      }

      let deltaSec: number;

      if (isRecording) {
        // 녹화 모드: 고정 시간 간격 (60fps = 1/60초)
        deltaSec = 1 / 60;
        recordingTimeRef.current += deltaSec;
      } else {
        // 실시간 모드: 실제 경과 시간 기반
        deltaSec = Math.min(0.1, (ts - lastTsRef.current) / 1000);
      }

      lastTsRef.current = ts;

      setCurrentTime((prev) => {
        let next: number;

        if (isRecording) {
          // 녹화 모드에서는 고정 간격으로 시간 진행
          next = recordingTimeRef.current;
        } else {
          // 실시간 모드
          next = prev + deltaSec;
        }

        if (totalDuration > 0 && next >= totalDuration) {
          if (isRecording) {
            stopRecording();
            return totalDuration;
          }

          if (isLooping) {
            return 0;
          } else {
            setIsPlaying(false);
            playingRef.current = false;
            return totalDuration;
          }
        }

        return next;
      });

      // 녹화 중이면 해당 시간의 프레임 그리기
      if (isRecording) {
        drawFrameToCanvasAtTime(recordingTimeRef.current);
      }

      rafIdRef.current = requestAnimationFrame(tick);
    },
    [totalDuration, isRecording, isLooping, drawFrameToCanvasAtTime]
  );

  const startPlaybackLoop = useCallback(() => {
    if (rafIdRef.current) {
      cancelAnimationFrame(rafIdRef.current);
    }
    lastTsRef.current = null;
    playingRef.current = true;
    rafIdRef.current = requestAnimationFrame(tick);
  }, [tick]);

  const stopPlaybackLoop = useCallback(() => {
    playingRef.current = false;
    if (rafIdRef.current) {
      cancelAnimationFrame(rafIdRef.current);
      rafIdRef.current = null;
    }
  }, []);

  useEffect(() => {
    if (isPlaying && totalDuration > 0) {
      startPlaybackLoop();
    } else {
      stopPlaybackLoop();
    }
    return () => stopPlaybackLoop();
  }, [isPlaying, totalDuration, startPlaybackLoop, stopPlaybackLoop]);

  // 녹화 시작
  const startCanvasRecording = async () => {
    if (!imagesLoaded) {
      alert("이미지 로드가 완료되지 않았습니다. 잠시 후 다시 시도해주세요.");
      return;
    }

    try {
      // 기존 녹화 URL 정리
      if (recordedVideoUrl) {
        URL.revokeObjectURL(recordedVideoUrl);
        setRecordedVideoUrl("");
      }

      // 비가시 캔버스 생성
      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d");
      if (!ctx) {
        throw new Error("캔버스 컨텍스트를 생성할 수 없습니다.");
      }

      canvas.width = previewDimensions.width;
      canvas.height = previewDimensions.height;
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = "high";
      setRecordingCanvas(canvas);

      // 60fps 스트림
      const stream = canvas.captureStream(60);

      const { mimeType } = getSupportedMimeType();

      const options: MediaRecorderOptions = {
        mimeType,
        videoBitsPerSecond: 8000000,
      };

      console.log("Recording with:", options);

      const recorder = new MediaRecorder(stream, options);
      recordedChunksRef.current = [];

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          recordedChunksRef.current.push(e.data);
        }
      };

      recorder.onstop = () => {
        console.log(
          "Recording stopped, chunks:",
          recordedChunksRef.current.length
        );

        const blob = new Blob(recordedChunksRef.current, {
          type: mimeType.split(";")[0],
        });

        const videoUrl = URL.createObjectURL(blob);
        setRecordedVideoUrl(videoUrl);
        setHasRecorded(true);
        setIsRecording(false);
        setRecordingCanvas(null);

        console.log("Video URL created:", videoUrl);
        console.log("Blob size:", blob.size, "bytes");
      };

      recorder.onerror = (e) => {
        console.error("MediaRecorder error:", e);
        setIsRecording(false);
        setRecordingCanvas(null);
        alert("녹화 중 오류가 발생했습니다.");
      };

      setMediaRecorder(recorder);
      setIsRecording(true);
      setHasRecorded(false);

      // 녹화 초기화
      recordingTimeRef.current = 0; // 녹화용 시간 초기화
      setIsLooping(false);
      setCurrentTime(0);
      setIsPlaying(true);

      recorder.start(100);
    } catch (err) {
      console.error("녹화 시작 오류:", err);
      alert("녹화를 시작할 수 없습니다: " + (err as Error).message);
      setIsRecording(false);
      setRecordingCanvas(null);
    }
  };

  // 녹화 중지
  const stopRecording = useCallback(() => {
    try {
      if (mediaRecorder && mediaRecorder.state === "recording") {
        mediaRecorder.stop();
      }
    } catch (error) {
      console.error("Error stopping recorder:", error);
    }

    setIsRecording(false);
    setIsPlaying(false);
    stopPlaybackLoop();
    recordingTimeRef.current = 0; // 시간 초기화
  }, [mediaRecorder, stopPlaybackLoop]);

  // 다운로드
  const downloadRecording = () => {
    if (!recordedVideoUrl) return;

    const { extension } = getSupportedMimeType();
    const a = document.createElement("a");
    a.href = recordedVideoUrl;
    a.download = `slideshow-recording-${Date.now()}.${extension}`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  // 나머지 컨트롤 함수들은 동일
  const handleTimeSliderChange = (
    e: React.ChangeEvent<HTMLInputElement>
  ): void => {
    if (isRecording) return;
    const newTime = parseFloat(e.target.value);
    setCurrentTime(newTime);
  };

  const togglePlayback = (): void => {
    if (isRecording) return;
    if (currentTime >= totalDuration && !isLooping) {
      setCurrentTime(0);
    }
    setIsPlaying((prev) => !prev);
  };

  const handlePrevious = () => {
    if (isRecording) return;
    const previousSlides = timeline.filter(
      (slide) => slide.startTime < currentTime
    );
    if (previousSlides.length > 0) {
      const latestPreviousSlide = previousSlides.reduce((latest, current) =>
        current.startTime > latest.startTime ? current : latest
      );
      setCurrentTime(latestPreviousSlide.startTime);
    } else {
      setCurrentTime(0);
    }
  };

  const handleNext = () => {
    if (isRecording) return;
    const nextSlides = timeline.filter(
      (slide) => slide.startTime > currentTime
    );
    if (nextSlides.length > 0) {
      const earliestNextSlide = nextSlides.reduce((earliest, current) =>
        current.startTime < earliest.startTime ? current : earliest
      );
      setCurrentTime(earliestNextSlide.startTime);
    } else {
      setCurrentTime(totalDuration);
    }
  };

  const toggleFullscreen = () => {
    if (isRecording) return;
    const element = canvasRef.current;
    if (!element) return;

    if (!document.fullscreenElement) {
      element.requestFullscreen().catch((err) => {
        console.error(
          `Error attempting to enable full-screen mode: ${err.message} (${err.name})`
        );
      });
    } else {
      document.exitFullscreen();
    }
  };

  // 컴포넌트 언마운트 시 정리
  useEffect(() => {
    return () => {
      if (recordedVideoUrl) {
        URL.revokeObjectURL(recordedVideoUrl);
      }
      stopPlaybackLoop();
    };
  }, [recordedVideoUrl, stopPlaybackLoop]);

  return (
    <div className="preview-modal-overlay" ref={modalRef} onClick={onClose}>
      <div className="preview-modal" onClick={(e) => e.stopPropagation()}>
        <div className="preview-header">
          <h3>Preview</h3>
          <div className="header-controls">
            {!hasRecorded && !isRecording && (
              <button
                onClick={startCanvasRecording}
                className="record-btn"
                title="정확한 타이밍으로 비디오 녹화"
                disabled={timeline.length === 0 || !imagesLoaded}
              >
                <FiVideo />
                <span>
                  {imagesLoaded ? "비디오 녹화" : "이미지 로딩 중..."}
                </span>
              </button>
            )}
            {isRecording && (
              <button
                onClick={stopRecording}
                className="record-btn recording"
                title="녹화 중지"
              >
                <FiVideo />
                <span className="recording-indicator">● 녹화 중...</span>
              </button>
            )}
            {hasRecorded && recordedVideoUrl && (
              <button
                onClick={downloadRecording}
                className="download-btn"
                title="녹화된 비디오 다운로드"
              >
                <FiDownload />
                <span>다운로드</span>
              </button>
            )}
            <button onClick={onClose} className="close-btn">
              <FiX />
            </button>
          </div>
        </div>

        <div className="preview-canvas">
          <div
            className="preview-canvas-inner"
            ref={canvasRef}
            style={{
              aspectRatio: canvasSettings.aspectRatio.replace(":", " / "),
              background: canvasSettings.backgroundColor,
            }}
          >
            {visibleSlides.map((slide) => {
              const img = imageCache.get(slide.image.url);
              if (!img || !img.complete) return null;

              return (
                <div
                  key={slide.id}
                  className="preview-slide"
                  style={getSlideStyle(slide)}
                >
                  <img
                    src={slide.image.url}
                    alt={slide.image.name}
                    style={{
                      width: "100%",
                      height: "100%",
                      objectFit: "contain",
                      userSelect: "none",
                      pointerEvents: "none",
                      // 녹색 가이드 제거를 위한 스타일 추가
                      border: "none",
                      outline: "none",
                      boxShadow: "none",
                    }}
                  />
                </div>
              );
            })}
          </div>
        </div>

        <div className="preview-controls">
          <button
            onClick={handlePrevious}
            title="Previous Slide"
            disabled={isRecording}
          >
            <FiSkipBack />
          </button>
          <button
            onClick={togglePlayback}
            title={isPlaying ? "Pause" : "Play"}
            disabled={isRecording}
          >
            {isPlaying ? <FiPause /> : <FiPlay />}
          </button>
          <button
            onClick={handleNext}
            title="Next Slide"
            disabled={isRecording}
          >
            <FiSkipForward />
          </button>
          <div className="time-display">
            {currentTime.toFixed(1)}s / {totalDuration.toFixed(1)}s
            {isRecording && (
              <span className="recording-text">정확한 타이밍으로 녹화 중</span>
            )}
          </div>
          <input
            type="range"
            min={0}
            max={totalDuration}
            step={0.01}
            value={currentTime}
            onChange={handleTimeSliderChange}
            className="time-slider"
            disabled={isRecording}
          />
          <button
            onClick={() => setIsLooping((prev) => !prev)}
            title="Toggle Loop"
            style={{ color: isLooping ? "var(--color-accent)" : "inherit" }}
            disabled={isRecording}
          >
            <FiRepeat />
          </button>
          <button
            onClick={toggleFullscreen}
            title={isFullscreen ? "Exit Fullscreen" : "Enter Fullscreen"}
            disabled={isRecording}
          >
            {isFullscreen ? <FiMinimize /> : <FiMaximize />}
          </button>
        </div>
      </div>
    </div>
  );
};

export default PreviewModal;
