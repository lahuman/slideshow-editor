# Data Model

This document defines the core data structures for the slideshow editor project. These types will be implemented in `src/types/index.ts`.

## Project
Represents the entire slideshow project.

```typescript
interface Project {
  id: string; // Unique identifier for the project
  name: string; // Project name
  canvas: Canvas; // Canvas settings
  slides: Slide[]; // Array of slides in the timeline
  imageLibrary: ImageFile[]; // Library of uploaded images
}
```

## Canvas
Defines the properties of the main editing canvas.

```typescript
interface Canvas {
  width: number; // e.g., 1920
  height: number; // e.g., 1080
  backgroundColor: string; // e.g., '#000000'
}
```

## ImageFile
Represents an image file uploaded by the user.

```typescript
interface ImageFile {
  id: string; // Unique ID for the library image
  name: string; // Original file name
  url: string; // Object URL for browser display
}
```

## Slide
Represents a single slide in the timeline.

```typescript
interface Slide {
  id: string; // Unique identifier for the slide
  name: string; // Display name for the slide (often the image name)
  imageId: string; // ID of the image from the imageLibrary
  duration: number; // Duration in seconds
  startTime: number; // Start time on the timeline in seconds
  properties: {
    position: { x: number; y: number };
    scale: number; // e.g., 1 for 100%
    rotation: number; // degrees
    zIndex: number; // Stacking order
  };
  transition: Transition;
}
```

## Transition
Defines the transition effect leading into a slide.

```typescript
interface Transition {
  type: 'none' | 'fade' | 'slide' | 'zoom' | 'flip';
  duration: number; // Duration of the transition in seconds
}
```
