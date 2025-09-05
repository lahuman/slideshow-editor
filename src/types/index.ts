export interface ImageFile {
  id: number;
  name: string;
  url: string;
  file: File;
}

export interface Position {
  x: number;
  y: number;
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

export type TransitionType = 'none' | 'fade' | 'slide' | 'zoom' | 'flip';

export interface TransitionOption {
  value: TransitionType;
  label: string;
}

export interface CanvasSettings {
  width: number;
  height: number;
  backgroundColor: string;
}

export interface SlideshowData {
  timeline: Slide[];
  settings: {
    width: number;
    height: number;
    fps: number;
  };
}
