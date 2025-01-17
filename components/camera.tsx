'use client'

import { useEffect, useRef, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Camera, StopCircle, Loader2, Clock, AlertCircle, Eye } from 'lucide-react'
import { captureVideoFrame } from '@/utils/camera'
import { AnalysisType } from '@/app/actions/process-image'
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

interface CameraProps {
  onFrame: (imageData: string, analysisTypes: AnalysisType[]) => void
  isProcessing: boolean
  latestAnalysis?: string
}

interface EyeGazeData {
  gazeDirection: string;
  faces: {
    x: number;
    y: number;
    width: number;
    height: number;
  }[];
  connections: {
    from: number;
    to: number;
    color: string;
  }[];
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

// Add hydration data interface
interface HydrationData {
  hydrationLevel: number;
  indicators: string[];
  advice: string;
  confidence: 'high' | 'medium' | 'low';
}

export function CameraComponent({ onFrame, isProcessing, latestAnalysis }: CameraProps) {
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
          width: { ideal: 1920 },
          height: { ideal: 1080 }
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
    const canvas = canvasRef.current
    const video = videoRef.current
    if (!canvas || !video) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    // Get the actual displayed dimensions of the video
    const videoRect = video.getBoundingClientRect()
    
    // Set canvas size to match displayed video size
    canvas.width = videoRect.width
    canvas.height = videoRect.height

    // Clear previous drawings
    ctx.clearRect(0, 0, canvas.width, canvas.height)

    // Draw gaze detection elements if available
    if (eyeGazeData) {
      // Draw connections first (so they appear behind boxes)
      if (eyeGazeData.connections) {
        eyeGazeData.connections.forEach(connection => {
          const fromFace = eyeGazeData.faces[connection.from]
          const toFace = eyeGazeData.faces[connection.to]
          
          if (fromFace && toFace) {
            ctx.beginPath()
            ctx.strokeStyle = connection.color
            ctx.lineWidth = 2
            // Start from the center of the face boxes
            ctx.moveTo(
              fromFace.x + fromFace.width / 2,
              fromFace.y + fromFace.height / 2
            )
            ctx.lineTo(
              toFace.x + toFace.width / 2,
              toFace.y + toFace.height / 2
            )
            ctx.stroke()
          }
        })
      }

      // Draw face boxes
      if (eyeGazeData.faces) {
        eyeGazeData.faces.forEach((face, index) => {
          // Draw face bounding box
          ctx.strokeStyle = '#10B981' // Emerald green
          ctx.lineWidth = 2
          ctx.strokeRect(face.x, face.y, face.width, face.height)

          // Add subtle background to the box
          ctx.fillStyle = 'rgba(16, 185, 129, 0.1)'
          ctx.fillRect(face.x, face.y, face.width, face.height)

          // Add face index label
          ctx.font = '14px system-ui'
          ctx.fillStyle = '#10B981'
          ctx.fillText(`Face ${index + 1}`, face.x + 4, face.y - 6)
        })
      }

      // Add gaze direction indicator
      ctx.font = '14px system-ui'
      ctx.fillStyle = '#10B981'
      ctx.fillText(`Gaze: ${eyeGazeData.gazeDirection}`, 10, 24)
    }

    // Draw hydration indicator if hydration analysis is selected
    if (selectedAnalysisTypes.includes('hydration') && hydrationData) {
      drawHydrationIndicator(ctx, canvas)
    }
  }

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
      try {
        // Find the gaze analysis section in the latest analysis
        const gazeSection = latestAnalysis.split('GAZE ANALYSIS:\n')[1]?.split('\n\n')[0]
        if (!gazeSection) return

        // Parse the JSON response
        const gazeData = JSON.parse(gazeSection)
        
        // Get video dimensions
        const video = videoRef.current
        if (!video) return
        const videoRect = video.getBoundingClientRect()

        // Convert relative positions to pixel coordinates
        const faces = gazeData.faces.map((face: any, index: number) => {
          // Calculate face box dimensions (adjust these values as needed)
          const width = videoRect.width * 0.2 // 20% of video width
          const height = width // Square boxes

          // Calculate position based on relative position description
          let x = 0
          let y = videoRect.height * 0.2 // 20% from top

          switch (face.position.toLowerCase()) {
            case 'left':
              x = videoRect.width * 0.2
              break
            case 'center':
              x = (videoRect.width - width) / 2
              break
            case 'right':
              x = videoRect.width * 0.8 - width
              break
            // Add more position cases as needed
          }

          return {
            x,
            y,
            width,
            height
          }
        })

        // Create connections based on gaze patterns
        const connections = gazeData.connections.map((conn: any) => ({
          from: conn.from,
          to: conn.to,
          color: conn.type === 'mutual_gaze' ? '#10B981' : '#6B7280'
        }))

        setEyeGazeData({
          gazeDirection: gazeData.summary,
          faces,
          connections
        })
      } catch (error) {
        console.error('Error parsing gaze data:', error)
        setEyeGazeData(null)
      }
    } else {
      setEyeGazeData(null)
    }
  }, [latestAnalysis, selectedAnalysisTypes])

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
        const hydrationSection = latestAnalysis.split('HYDRATION ANALYSIS:\n')[1]?.split('\n\n')[0]
        if (hydrationSection) {
          const data = JSON.parse(hydrationSection)
          setHydrationData(data)
        }
      } catch (error) {
        console.error('Error parsing hydration data:', error)
        setHydrationData(null)
      }
    } else {
      setHydrationData(null)
    }
  }, [latestAnalysis, selectedAnalysisTypes])

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

