# Local Computer Vision (LCLV) with Moondream

This project is a real-time computer vision application built with Typescript, Next.js and TailwindCSS that leverages the Moondream AI model for advanced visual analysis. Here's how it works:


![Screenshot 2025-01-17 at 8 38 10 AM](https://github.com/user-attachments/assets/193ff854-8130-4ff2-8751-96447c1b1fe3)


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

### 3. Moondream Station Capabilities
The application leverages the powerful Moondream vision model which provides:

- **Advanced Scene Understanding**: Deep comprehension of visual contexts and environments
- **Multi-modal Analysis**: Combines visual perception with natural language understanding
- **Real-time Processing**: Optimized for live video stream analysis with minimal latency
- **Precise Object Detection**: Accurate identification and localization of objects, people, and features
- **Contextual Reasoning**: Ability to understand relationships between elements in the scene
- **Adaptive Analysis**: Dynamic adjustment to different lighting conditions and environments
- **High Accuracy**: State-of-the-art computer vision performance for reliable results
- **Local Processing**: Complete privacy with no cloud dependencies

### 4. Dark Mode Support
The application includes comprehensive dark mode functionality:

- **Automatic Theme Detection**: Respects system-wide dark/light mode preferences
- **Manual Toggle**: Users can manually switch between light and dark themes
- **Consistent Styling**: All UI components adapt seamlessly to the selected theme
- **Enhanced Visibility**: Optimized contrast ratios for better visibility in low-light conditions
- **Canvas Overlays**: Analysis visualizations adapt to match the current theme
- **Persistent Preference**: Theme selection is saved and restored across sessions
- **Smooth Transitions**: Elegant theme switching animations for better user experience

### 5. Technical Implementation
- Uses Moondream AI model running locally via Ollama
- Implements caching system for recent analyses (5-second cache)
- Features retry mechanism with exponential backoff
- Supports multiple face detection and tracking
- Real-time visualization of gaze directions and connections

### 6. User Interface
- Clean, modern interface using TailwindCSS
- Responsive design that works across devices
- Interactive controls for analysis type selection
- Adjustable time intervals for analysis frequency
- Real-time feedback and visualization overlays

### 7. Performance Features
- Efficient frame processing
- Request debouncing to prevent overload
- Smooth rendering using requestAnimationFrame
- Automatic resizing and responsive canvas

### 8. Privacy-Focused
- All processing happens locally on the user's machine
- No data sent to external servers
- No image storage or persistence


  [![Tonton Video](https://img.youtube.com/vi/Ivwgdj0K0_8/maxresdefault.jpg)](https://youtu.be/Ivwgdj0K0_8)
    Demo Video

## How It Works

1. The camera feed is captured using the `getUserMedia` API
2. Frames are processed at the selected interval
3. The image data is sent to the local Moondream model via Ollama
4. Analysis results are processed and displayed in real-time
5. Visual overlays are drawn on the canvas for features like gaze tracking
6. Results can be interacted with through the UI

The application provides a comprehensive suite of computer vision analysis tools while maintaining privacy and performance by running everything locally on the user's machine.

## Installation Guide

This project supports multiple ways to run Moondream locally. Choose the method that works best for your system:

### Option 1: Moondream Station (Recommended) 🚀

**Moondream Station** is the easiest and most efficient way to run Moondream locally. It's a free, open-source tool that eliminates the complexities of Python installations, dependencies, and technical setups.

#### What is Moondream Station?
- **100% Free**: No cost, just powerful vision-language capabilities
- **Easy Installation**: Simplified setup to quickly get you started  
- **Local Performance**: Run models locally for optimal speed and privacy
- **Automatic Updates**: Effortless maintenance and up-to-date features
- **No Technical Headaches**: Skip Python setups, dependencies, and configurations

#### System Requirements
- **Mac**: Apple Silicon (M1, M2, M3) or Intel-based Macs
- **Linux**: Most modern distributions supported
- **Windows**: Support coming soon
- **Memory**: At least 4GB of available RAM recommended
- **Storage**: ~2GB for model and application files

#### Installation Steps

**For Mac & Linux:**
```bash
curl https://depot.moondream.ai/station/install.sh | bash
```

**Alternative manual installation:**
1. Visit [https://moondream.ai/station](https://moondream.ai/station)
2. Download the installer for your operating system
3. Follow the installation wizard
4. Launch Moondream Station from your applications

#### Verify Installation
After installation, verify that Moondream Station is running:
```bash
# Check if Moondream Station is running
curl http://localhost:8888/health
```

#### Key Features of Moondream Station:
- **Quick and Hassle-Free Installation**: Get up and running in minutes
- **Seamless Command Line Integration**: Easy terminal access and API integration
- **Always Current**: Automatic model updates and improvements
- **Privacy First**: All processing happens locally on your machine
- **Developer Friendly**: Clean API for easy integration with applications

#### Privacy & Telemetry
- Moondream Station includes optional usage tracking for tool improvement
- You can disable telemetry anytime with: `admin toggle-metrics --confirm`
- **Important**: It never collects your images or personal data
- Only high-level usage, performance, and error data is collected

### Option 2: Ollama (Alternative Method)

If you prefer using Ollama or encounter issues with Moondream Station:

#### Prerequisites
1. Install Ollama from [https://ollama.ai](https://ollama.ai)
2. Ensure you have at least 4GB of available RAM
3. Have a working internet connection for initial model download

#### Installation Steps
```bash
# Pull the Moondream model
ollama pull moondream

# Run Moondream
ollama run moondream
```

### Option 3: Run the LCLV Application

Once you have either Moondream Station or Ollama running, set up the LCLV application:

#### Clone and Setup
```bash
# Clone the repository
git clone https://github.com/HafizalJohari/lclv.git

# Navigate to project directory
cd lclv

# Install dependencies
npm install

# Start the development server
npm run dev
```

#### Access the Application
Open your browser and navigate to `http://localhost:3000` to start using the Local Computer Vision application.

### Troubleshooting

**Moondream Station Issues:**
- Ensure your system meets the minimum requirements
- Check that port 8888 is not being used by another application
- For Mac users: You may need to allow the application in System Preferences > Security & Privacy

**Ollama Issues:**
- Verify Ollama is properly installed and running
- Check that the Moondream model downloaded correctly with `ollama list`
- Ensure port 11434 (default Ollama port) is available

**Application Issues:**
- Make sure Node.js (version 16+) is installed
- Clear browser cache and reload the page
- Check browser console for any error messages

### Getting Help
- **Documentation**: [https://docs.moondream.ai](https://docs.moondream.ai)
- **Community Support**: Join the [Discord community](https://discord.gg/moondream)
- **GitHub Issues**: Report bugs on the [Moondream GitHub](https://github.com/vikhyat/moondream)

---

**Reference Links:**
- Moondream Station: [https://moondream.ai/station](https://moondream.ai/station)
- Moondream GitHub: [https://github.com/vikhyat/moondream](https://github.com/vikhyat/moondream)
- Ollama: [https://ollama.ai](https://ollama.ai)

MIT License

Copyright (c) 2024 Hafizal Johari

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
