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

export interface CanvasSettings {
  aspectRatio: string;
  backgroundColor: string;
  width: number;
  height: number;
  fps: number;
}

export interface SlideshowData {
  timeline: Slide[];
  settings: CanvasSettings;
}

export type TimelineTrack = Slide[];