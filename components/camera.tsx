'use client'

import { useEffect, useRef, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Camera, StopCircle, Loader2, Clock, AlertCircle, Eye } from 'lucide-react'
import { captureVideoFrame } from '@/utils/camera'
import type { AnalysisType } from '@/app/actions/process-image'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { Card, CardContent } from "@/components/ui/card"
import { cn } from "@/lib/utils"
import { detectGaze } from '@/app/utils/gaze-detection'
import { VideoUpload } from '@/components/video-upload'
import { toast } from 'sonner'

interface CameraProps {
  onFrame: (imageData: string, analysisTypes: AnalysisType[]) => void
  isProcessing: boolean
  latestAnalysis?: string
}

interface EyeGazeData {
  gazeDirection: string;
  faces: Array<{
    x: number;
    y: number;
    width: number;
    height: number;
    eyePoints?: Array<{
      x: number;
      y: number;
      confidence: number;
    }>;
  }>;
  confidence: number;
}

interface HydrationData {
  hydrationLevel: number;
  indicators: string[];
  advice: string;
  confidence: 'high' | 'medium' | 'low';
}

const ANALYSIS_OPTIONS = [
  {
    value: 'general',
    label: 'General Analysis',
    description: 'Comprehensive analysis of all visual aspects'
  },
  {
    value: 'hydration',
    label: 'Hydration Level',
    description: 'Analyze skin hydration and provide advice'
  },
  {
    value: 'emotion',
    label: 'Emotion Detection',
    description: 'Analyze facial expressions and emotions'
  },
  {
    value: 'fatigue',
    label: 'Fatigue Analysis',
    description: 'Detect signs of tiredness and fatigue'
  },
  {
    value: 'gender',
    label: 'Gender Presentation',
    description: 'Analyze apparent gender presentation'
  },
  {
    value: 'description',
    label: 'Person Description',
    description: 'Detailed physical description'
  },
  {
    value: 'accessories',
    label: 'Accessories',
    description: 'Detect visible accessories and items'
  },
  {
    value: 'gaze',
    label: 'Gaze Analysis',
    description: 'Track eye direction and attention'
  },
  {
    value: 'hair',
    label: 'Hair Analysis',
    description: 'Analyze hair style, color, and characteristics'
  },
  {
    value: 'crowd',
    label: 'Crowd Analysis',
    description: 'Analyze group size, demographics, and behavior'
  },
  {
    value: 'text_detection',
    label: 'Character Detection',
    description: 'Detect and extract text, numbers, and characters from images'
  },
  {
    value: 'hand_gesture',
    label: 'Hand Gestures',
    description: 'Detect and respond to hand gestures'
  }
] as const

const TIME_INTERVALS = {
  0: 'Live feedback',
  1000: '1 second',
  3000: '3 seconds',
  5000: '5 seconds',
  7000: '7 seconds',
  10000: '10 seconds',
} as const

type TimeInterval = keyof typeof TIME_INTERVALS

export function CameraComponent({ onFrame, isProcessing, latestAnalysis }: CameraProps): JSX.Element {
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [isStreaming, setIsStreaming] = useState(false)
  const streamRef = useRef<MediaStream | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [selectedAnalysisTypes, setSelectedAnalysisTypes] = useState<AnalysisType[]>(['emotion'])
  const [selectedInterval, setSelectedInterval] = useState<TimeInterval>(5000)
  const frameRequestRef = useRef<number>()
  const [eyeGazeData, setEyeGazeData] = useState<EyeGazeData | null>(null)
  const [videoSize, setVideoSize] = useState({ width: 0, height: 0 })
  const [hydrationData, setHydrationData] = useState<HydrationData | null>(null)
  const [lastGestureResponse, setLastGestureResponse] = useState<string | null>(null)

  // Handle video metadata loaded
  const handleVideoLoad = () => {
    const video = videoRef.current
    if (video) {
      const { videoWidth, videoHeight } = video
      setVideoSize({ width: videoWidth, height: videoHeight })
      
      // Update canvas size
      const canvas = canvasRef.current
      if (canvas) {
        canvas.width = videoWidth
        canvas.height = videoHeight
        // Redraw if we have eye gaze data
        if (eyeGazeData) {
          drawBoundingBoxes()
        }
      }
    }
  }

  const startCamera = async () => {
    try {
      setError(null)
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { 
          facingMode: 'user',
          width: { ideal: 720 },
          height: { ideal: 480 }
        } 
      })
      if (videoRef.current) {
        videoRef.current.srcObject = stream
        streamRef.current = stream
        setIsStreaming(true)
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to access camera'
      console.error('Error accessing camera:', error)
      setError(errorMessage)
    }
  }

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop())
      streamRef.current = null
      setIsStreaming(false)
      setError(null)
    }
  }

  const toggleAnalysisType = (type: AnalysisType) => {
    setSelectedAnalysisTypes(prev => {
      if (prev.includes(type)) {
        // Don't remove if it's the last item
        if (prev.length === 1) return prev
        return prev.filter(t => t !== type)
      }
      return [...prev, type]
    })
  }

  // Function to process frame for live feedback
  const processFrame = async () => {
    if (videoRef.current && isStreaming && !isProcessing) {
      try {
        const frameData = await captureVideoFrame(videoRef.current)
        onFrame(frameData, selectedAnalysisTypes)
      } catch (error) {
        console.error('Error capturing frame:', error)
        setError('Failed to capture video frame')
      }
    }
    // Request next frame if still in live mode
    if (selectedInterval === 0) {
      frameRequestRef.current = requestAnimationFrame(processFrame)
    }
  }

  useEffect(() => {
    let interval: NodeJS.Timeout

    if (isStreaming && !isProcessing) {
      if (selectedInterval === 0) {
        // Live feedback mode
        frameRequestRef.current = requestAnimationFrame(processFrame)
      } else {
        // Interval mode
        interval = setInterval(async () => {
          if (videoRef.current) {
            try {
              const frameData = await captureVideoFrame(videoRef.current)
              onFrame(frameData, selectedAnalysisTypes)
            } catch (error) {
              console.error('Error capturing frame:', error)
              setError('Failed to capture video frame')
            }
          }
        }, selectedInterval)
      }
    }

    return () => {
      if (interval) clearInterval(interval)
      if (frameRequestRef.current) {
        cancelAnimationFrame(frameRequestRef.current)
      }
    }
  }, [isStreaming, isProcessing, onFrame, selectedAnalysisTypes, selectedInterval])

  useEffect(() => {
    return () => {
      stopCamera()
    }
  }, [])

  // Function to draw bounding boxes and gaze indicators
  const drawBoundingBoxes = () => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx || !eyeGazeData) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    eyeGazeData.faces.forEach((face, index) => {
      // Draw face box
      ctx.strokeStyle = '#10B981';
      ctx.lineWidth = 2;
      ctx.strokeRect(face.x, face.y, face.width, face.height);

      // Draw eye points if available
      if (face.eyePoints) {
        face.eyePoints.forEach(point => {
          ctx.beginPath();
          ctx.arc(point.x, point.y, 3, 0, 2 * Math.PI);
          ctx.fillStyle = '#10B981';
          ctx.fill();
        });
      }

      // Add face label
      ctx.font = '14px system-ui';
      ctx.fillStyle = '#10B981';
      ctx.fillText(`Face ${index + 1}`, face.x, face.y - 5);
    });

    // Add confidence indicator
    ctx.fillStyle = '#10B981';
    ctx.fillText(`Confidence: ${(eyeGazeData.confidence * 100).toFixed(1)}%`, 10, 20);

    // Draw hydration indicator if hydration analysis is selected
    if (selectedAnalysisTypes.includes('hydration') && hydrationData) {
      drawHydrationIndicator(ctx, canvas);
    }
  };

  // Add hydration level visualization
  const drawHydrationIndicator = (ctx: CanvasRenderingContext2D, canvas: HTMLCanvasElement) => {
    if (!hydrationData) return

    // Position in top-right corner
    const x = canvas.width - 220
    const y = 20
    const width = 200
    const height = 100

    // Draw background
    ctx.fillStyle = 'rgba(0, 0, 0, 0.7)'
    ctx.roundRect(x, y, width, height, 8)
    ctx.fill()

    // Draw hydration level bar
    const barWidth = 180
    const barHeight = 10
    const barX = x + 10
    const barY = y + 30

    // Background bar
    ctx.fillStyle = 'rgba(255, 255, 255, 0.2)'
    ctx.roundRect(barX, barY, barWidth, barHeight, 4)
    ctx.fill()

    // Hydration level bar
    const levelWidth = (hydrationData.hydrationLevel / 10) * barWidth
    const levelColor = hydrationData.hydrationLevel > 7 
      ? '#10B981' // Good hydration
      : hydrationData.hydrationLevel > 4 
        ? '#FBBF24' // Moderate
        : '#EF4444' // Poor hydration

    ctx.fillStyle = levelColor
    ctx.roundRect(barX, barY, levelWidth, barHeight, 4)
    ctx.fill()

    // Draw text
    ctx.fillStyle = '#FFFFFF'
    ctx.font = 'bold 14px system-ui'
    ctx.fillText('Hydration Level', barX, y + 20)
    
    ctx.font = '12px system-ui'
    ctx.fillText(`${hydrationData.hydrationLevel}/10 (${hydrationData.confidence} confidence)`, barX, y + 55)
    
    // Draw advice
    ctx.fillStyle = '#FFFFFF'
    ctx.font = '12px system-ui'
    const words = hydrationData.advice.split(' ')
    let line = ''
    let lineY = y + 75
    
    words.forEach(word => {
      const testLine = line + word + ' '
      const metrics = ctx.measureText(testLine)
      
      if (metrics.width > width - 20) {
        ctx.fillText(line, barX, lineY)
        line = word + ' '
        lineY += 15
      } else {
        line = testLine
      }
    })
    ctx.fillText(line, barX, lineY)
  }

  // Update eye gaze data when analysis includes gaze detection
  useEffect(() => {
    if (latestAnalysis && selectedAnalysisTypes.includes('gaze')) {
      const processGazeData = async () => {
        try {
          if (!videoRef.current) return;
          
          const frameData = await captureVideoFrame(videoRef.current);
          const gazeResult = await detectGaze(frameData);
          
          // Convert detection results to EyeGazeData format
          const faces = gazeResult.objects.map((obj, index) => ({
            x: obj.box.x1,
            y: obj.box.y1,
            width: obj.box.x2 - obj.box.x1,
            height: obj.box.y2 - obj.box.y1,
            eyePoints: gazeResult.points.slice(index * 2, (index * 2) + 2)
          }));

          setEyeGazeData({
            gazeDirection: 'Analyzing gaze direction...',
            faces,
            confidence: Math.min(...gazeResult.objects.map(obj => obj.confidence))
          });

        } catch (error) {
          console.error('Error processing gaze data:', error);
          setEyeGazeData(null);
        }
      };

      processGazeData();
    } else {
      setEyeGazeData(null);
    }
  }, [latestAnalysis, selectedAnalysisTypes]);

  // Draw bounding boxes when eye gaze data updates or video size changes
  useEffect(() => {
    if (eyeGazeData && videoRef.current) {
      // Use requestAnimationFrame for smooth rendering
      const animate = () => {
        drawBoundingBoxes()
        if (isStreaming && selectedAnalysisTypes.includes('gaze')) {
          requestAnimationFrame(animate)
        }
      }
      requestAnimationFrame(animate)
    }
  }, [eyeGazeData, isStreaming, selectedAnalysisTypes])

  // Add resize observer to handle window resizing
  useEffect(() => {
    if (!videoRef.current) return

    const resizeObserver = new ResizeObserver(() => {
      if (eyeGazeData) {
        drawBoundingBoxes()
      }
    })

    resizeObserver.observe(videoRef.current)

    return () => {
      resizeObserver.disconnect()
    }
  }, [eyeGazeData])

  // Update analysis effect to handle hydration data
  useEffect(() => {
    if (latestAnalysis && selectedAnalysisTypes.includes('hydration')) {
      try {
        // Find the hydration section in the analysis
        const hydrationMatch = latestAnalysis.match(/HYDRATION ANALYSIS:\s*([\s\S]*?)(?=\n\n|\n?$)/);
        if (hydrationMatch) {
          const hydrationText = hydrationMatch[1];
          
          // Extract hydration level (assuming it's mentioned in format "X/10")
          const levelMatch = hydrationText.match(/(\d+)\/10/);
          const level = levelMatch ? parseInt(levelMatch[1]) : 5;

          // Extract confidence level
          let confidence: 'high' | 'medium' | 'low' = 'medium';
          if (hydrationText.toLowerCase().includes('high confidence')) confidence = 'high';
          if (hydrationText.toLowerCase().includes('low confidence')) confidence = 'low';

          // Extract advice
          const adviceMatch = hydrationText.match(/advice:?\s*(.*?)(?=\n|$)/i);
          const advice = adviceMatch ? adviceMatch[1].trim() : 'No specific advice provided';

          // Extract indicators
          const indicators = hydrationText
            .split('\n')
            .filter(line => line.trim().startsWith('-') || line.trim().startsWith('•'))
            .map(line => line.replace(/^[-•]\s*/, '').trim());

          setHydrationData({
            hydrationLevel: level,
            confidence,
            advice,
            indicators
          });
        }
      } catch (error) {
        console.error('Error parsing hydration data:', error);
        setHydrationData(null);
      }
    } else {
      setHydrationData(null);
    }
  }, [latestAnalysis, selectedAnalysisTypes]);

  // Add useEffect to handle gesture responses
  useEffect(() => {
    if (latestAnalysis && selectedAnalysisTypes.includes('hand_gesture')) {
      try {
        // Extract gesture response from analysis
        const gestureMatch = latestAnalysis.match(/RESPONSE:\s*([^\n]+)/);
        const gesture = gestureMatch?.[1]?.trim();
        
        if (gesture && gesture !== lastGestureResponse) {
          setLastGestureResponse(gesture);
          
          // Show toast notification for the gesture response
          toast(gesture, {
            description: "Hand gesture detected",
            duration: 3000
          });

          // Text-to-speech for the response (optional)
          if ('speechSynthesis' in window) {
            const utterance = new SpeechSynthesisUtterance(gesture);
            window.speechSynthesis.speak(utterance);
          }
        }
      } catch (error) {
        console.error('Error processing gesture response:', error);
      }
    }
  }, [latestAnalysis, selectedAnalysisTypes, lastGestureResponse]);

  return (
    <div className="w-full space-y-6">
      <Card className="bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <CardContent className="p-6">
          <div className="flex flex-col space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold">Analysis Options</h3>
              <Select
                value={selectedInterval.toString()}
                onValueChange={(value) => setSelectedInterval(parseInt(value) as TimeInterval)}
              >
                <SelectTrigger className="w-[150px]">
                  <Clock className="w-4 h-4 mr-2" />
                  <SelectValue placeholder="Interval" />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(TIME_INTERVALS).map(([value, label]) => (
                    <SelectItem key={value} value={value}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {ANALYSIS_OPTIONS.map((option) => (
                <div
                  key={option.value}
                  className={cn(
                    "relative flex items-center space-x-2 rounded-lg border p-4 hover:bg-accent transition-colors",
                    selectedAnalysisTypes.includes(option.value as AnalysisType) && "border-primary bg-accent"
                  )}
                >
                  <Checkbox
                    id={option.value}
                    checked={selectedAnalysisTypes.includes(option.value as AnalysisType)}
                    onCheckedChange={() => toggleAnalysisType(option.value as AnalysisType)}
                    disabled={selectedAnalysisTypes.length === 1 && selectedAnalysisTypes.includes(option.value as AnalysisType)}
                    className="data-[state=checked]:bg-primary data-[state=checked]:text-primary-foreground"
                  />
                  <label
                    htmlFor={option.value}
                    className="flex-1 text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                  >
                    {option.label}
                  </label>
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 gap-6">
        <VideoUpload 
          onFrame={onFrame}
          isProcessing={isProcessing}
          selectedAnalysisTypes={selectedAnalysisTypes}
        />

        <Card className="relative overflow-hidden">
          <CardContent className="p-0">
            <div className="relative">
              <video
                ref={videoRef}
                autoPlay
                playsInline
                onLoadedMetadata={handleVideoLoad}
                className="w-full aspect-video bg-muted rounded-lg"
              />
              <canvas
                ref={canvasRef}
                className="absolute top-0 left-0 w-full h-full pointer-events-none"
                style={{ objectFit: 'cover' }}
              />
              {selectedAnalysisTypes.includes('gaze') && (
                <div className="absolute top-4 left-4 bg-background/90 backdrop-blur-sm px-3 py-1.5 rounded-md shadow-lg">
                  <div className="flex items-center gap-2 text-sm">
                    <Eye className="w-4 h-4 text-emerald-500" />
                    <span className="font-medium text-emerald-500">Gaze Detection Active</span>
                  </div>
                </div>
              )}
            </div>
            
            {error && (
              <div className="absolute top-4 left-4 right-4 bg-destructive/90 backdrop-blur-sm text-destructive-foreground px-4 py-2 rounded-md text-sm shadow-lg">
                <div className="flex items-center gap-2">
                  <AlertCircle className="w-4 h-4" />
                  {error}
                </div>
              </div>
            )}
            
            <div className="absolute bottom-4 right-4 flex gap-2">
              {!isStreaming ? (
                <Button onClick={startCamera} variant="default" className="shadow-lg">
                  <Camera className="w-4 h-4 mr-2" />
                  Start Camera
                </Button>
              ) : (
                <>
                  {isProcessing ? (
                    <div className="flex items-center gap-2 bg-background/90 backdrop-blur-sm px-4 py-2 rounded-md shadow-lg">
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span className="text-sm font-medium">
                        Analyzing {selectedAnalysisTypes.length} features...
                      </span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2 bg-background/90 backdrop-blur-sm px-4 py-2 rounded-md shadow-lg">
                      <Clock className="w-4 h-4" />
                      <span className="text-sm font-medium">
                        {selectedInterval === 0 ? 'Live analysis' : `Every ${TIME_INTERVALS[selectedInterval]}`}
                      </span>
                    </div>
                  )}
                  <Button onClick={stopCamera} variant="destructive" className="shadow-lg">
                    <StopCircle className="w-4 h-4 mr-2" />
                    Stop Camera
                  </Button>
                </>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

