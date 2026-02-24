export interface ImageFile {
  id: number;
  name: string;
  url: string;
  file: File;
  width: number;
  height: number;
}

export interface Position {
  x: number;
  y: number;
}

export type TransitionType = 'fade' | 'slide' | 'zoom' | 'flip' | 'none';

export interface TransitionOption {
  value: TransitionType;
  label: string;
}

export interface Slide {
  id: number;
  image: ImageFile;
  startTime: number;
  duration: number;
  position: Position;
  scale: number;
  rotation: number;
  transition: TransitionType;
  transitionDuration: number;
  zIndex: number;
  track: number;
}

export interface TextSlide {
  id: number;
  text: string;
  startTime: number;
  duration: number;
  position: Position;
  rotation: number;
  fontSize: number;
  color: string;
  backgroundColor: string;
  maxWidth: number;
  align: 'left' | 'center' | 'right';
  zIndex: number;
  track: number;
}

// Library에서 관리하는 자막 템플릿 (타임라인 정보 없음)
export interface TextTemplate {
  id: number;
  name: string;
  text: string;
}

export interface CanvasSettings {
  aspectRatio: string;
  backgroundColor: string;
  width: number;
  height: number;
  fps: number;
}

export interface SlideshowData {
  timeline: Slide[];
  textSlides: TextSlide[];
  settings: CanvasSettings;
}

export type TimelineTrack = Slide[];
