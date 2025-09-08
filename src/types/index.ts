export interface Slide {
  id: string;
  src: string;
  name: string;
  startTime: number;
  duration: number;
  track: number;
  position: { x: number; y: number };
  scale: number;
  rotation: number;
  transition: {
    type: 'fade' | 'slide' | 'zoom' | 'flip' | 'none';
    duration: number;
  };
}

export interface CanvasSettings {
  aspectRatio: string;
  backgroundColor: string;
  width: number;
  height: number;
}

export type TimelineTrack = Slide[];