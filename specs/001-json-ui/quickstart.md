# Quickstart Guide: Manual MVP Test

This guide provides the steps to manually test the core user flow of the slideshow editor, from creation to export.

## Prerequisites
- The application is running in a development environment (`npm run dev`).
- You have at least two images (e.g., `image1.jpg`, `image2.png`) saved on your local machine.

## Test Steps

### 1. Launch and Initial Setup
1.  Open your web browser and navigate to the application URL (e.g., `http://localhost:5173`).
2.  Verify that the main UI is displayed, including an empty Image Library, a Canvas, a Control Panel, and a Timeline.

### 2. Upload Images
1.  Locate the Image Library panel.
2.  Drag `image1.jpg` from your file explorer and drop it into the Image Library.
3.  **Expected Result**: A thumbnail for `image1.jpg` appears in the library.
4.  Repeat the process for `image2.png`.
5.  **Expected Result**: A thumbnail for `image2.png` also appears in the library.

### 3. Create Slides
1.  Drag the `image1.jpg` thumbnail from the Image Library onto the Timeline.
2.  **Expected Result**: A new slide representing `image1.jpg` appears on the timeline. The image is displayed in the center of the Canvas.
3.  Drag the `image2.png` thumbnail from the Library to the right of the first slide on the Timeline.
4.  **Expected Result**: A second slide appears on the timeline after the first one.

### 4. Edit Slide Properties
1.  Click on the first slide (`image1.jpg`) in the Timeline to select it.
2.  **Expected Result**: The Control Panel now shows the properties for this slide.
3.  In the Control Panel, change the **Rotation** to `45`.
4.  **Expected Result**: The image on the Canvas rotates 45 degrees in real-time.
5.  Change the **Scale** to `1.5`.
6.  **Expected Result**: The image on the Canvas becomes 50% larger.
7.  On the timeline, drag the right edge of the first slide to change its duration.
8.  **Expected Result**: The duration value in the Control Panel updates.

### 5. Add Transitions
1.  Select the second slide (`image2.png`) on the Timeline.
2.  In the Control Panel, find the **Transition** section.
3.  Select `fade` from the transition type dropdown.
4.  Set the transition duration to `1.0` second.
5.  **Expected Result**: The transition is now associated with the second slide.

### 6. Preview the Slideshow
1.  Click the **Preview** button, usually located in the header or near the canvas.
2.  **Expected Result**: A preview modal opens.
3.  The slideshow begins to play automatically.
4.  You should see `image1.jpg` (rotated and scaled) for its set duration.
5.  It should then fade into `image2.png` over 1 second.
6.  The preview should loop or stop after the last slide.

### 7. Export the Project
1.  Close the preview modal.
2.  Click the **Export** button.
3.  **Expected Result**: A JSON file (e.g., `project.json`) is downloaded to your computer.
4.  Open the downloaded file in a text editor.
5.  **Expected Result**: The JSON structure should reflect all the settings you configured: two slides, their properties (rotation, scale), and the transition effect.
