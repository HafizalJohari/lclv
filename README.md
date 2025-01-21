# Local Computer Vision (LCLV) with Moondream

This project is a real-time computer vision application built with Typescript, Next.js and TailwindCSS that leverages the Moondream AI model for advanced visual analysis. Here's how it works:


![Screenshot 2025-01-17 at 8 38 10 AM](https://github.com/user-attachments/assets/193ff854-8130-4ff2-8751-96447c1b1fe3)


## Core Features

### 1. Real-Time Camera Analysis
- Captures live video feed from the user's camera
- Processes frames at configurable intervals (1-10 seconds or live)
- Uses HTML5 Canvas for drawing overlays and visualizations

### 2. Multiple Analysis Types
The app can analyze various aspects of the video feed:

- **General Analysis**: Overall scene interpretation and context
- **Emotion Detection**: Facial expression and emotional state analysis
- **Fatigue Analysis**: Signs of tiredness using facial indicators
- **Gender Presentation**: Analysis of apparent gender presentation
- **Person Description**: Detailed physical characteristics
- **Accessories**: Detection of worn items and accessories
- **Gaze Analysis**: Eye tracking and attention direction
- **Hair Analysis**: Detailed hair characteristics assessment
- **Crowd Analysis**: Group dynamics and demographic patterns

### 3. Technical Implementation
- Uses Moondream AI model running locally via Ollama
- Implements caching system for recent analyses (5-second cache)
- Features retry mechanism with exponential backoff
- Supports multiple face detection and tracking
- Real-time visualization of gaze directions and connections

### 4. User Interface
- Clean, modern interface using TailwindCSS
- Responsive design that works across devices
- Interactive controls for analysis type selection
- Adjustable time intervals for analysis frequency
- Real-time feedback and visualization overlays

### 5. Performance Features
- Efficient frame processing
- Request debouncing to prevent overload
- Smooth rendering using requestAnimationFrame
- Automatic resizing and responsive canvas

### 6. Privacy-Focused
- All processing happens locally on the user's machine
- No data sent to external servers
- No image storage or persistence

## How It Works

1. The camera feed is captured using the `getUserMedia` API
2. Frames are processed at the selected interval
3. The image data is sent to the local Moondream model via Ollama
4. Analysis results are processed and displayed in real-time
5. Visual overlays are drawn on the canvas for features like gaze tracking
6. Results can be interacted with through the UI

The application provides a comprehensive suite of computer vision analysis tools while maintaining privacy and performance by running everything locally on the user's machine.

https://github.com/vikhyat/moondream.git
## Running Moondream with Ollama

### Prerequisites
1. Install Ollama from https://ollama.ai
2. Ensure you have at least 4GB of available RAM
3. Have a working internet connection for initial model download

### Installation Steps

1. First, pull the Moondream model using Ollama:
2. 'ollama run moondream`

Make sure you run moondrean in ollama locally.



Step 2:
Clone the repo and run the app from https://github.com/HafizalJohari/lclv.git

```
git clone https://github.com/HafizalJohari/lclv.git
```
Then
```
cd lclv
npm install
npm run dev
```

Thats it!
