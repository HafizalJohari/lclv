'use client'

import { useState, useRef, useEffect } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'
import { AnalysisType } from '@/app/actions/process-image'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Loader2, Upload, Play, Pause, RotateCcw, AlertCircle, Trash2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import { MotionTracker } from '@/lib/motion-tracker'

interface ImageUploadProps {
  onAnalyze: (image: File, analysisTypes: AnalysisType[]) => void
  isProcessing: boolean
}

// Supported video formats
const SUPPORTED_VIDEO_FORMATS = [
  'video/mp4',
  'video/quicktime', // .mov
  'video/x-msvideo',  // .avi
  'video/webm',
  'video/ogg',
  'video/mpeg',
  'video/3gpp',
  'video/x-matroska' // .mkv
]

const MAX_VIDEO_SIZE = 50 * 1024 * 1024 // 50MB

interface VideoQualityMetrics {
  resolution: string;
  bitrate: number;
  stability: number;
  sharpness: number;
  rating: number;
  feedback: string[];
}

// Frame buffer configuration
const FRAME_BUFFER_SIZE = 3 // Number of frames to collect before analysis
const FRAME_INTERVAL = 1000 // Capture frame every 1 second

interface FrameBuffer {
  timestamp: number
  data: string
}

export function ImageUpload({ onAnalyze, isProcessing }: ImageUploadProps) {
  const [selectedImage, setSelectedImage] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [analysisMode, setAnalysisMode] = useState<'general' | 'item_extraction' | 'video'>('general')
  
  // Video states
  const [videoUrl, setVideoUrl] = useState<string | null>(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const animationFrameRef = useRef<number>()
  const [videoQuality, setVideoQuality] = useState<VideoQualityMetrics | null>(null)
  const [selectedVideoAnalysisTypes, setSelectedVideoAnalysisTypes] = useState<AnalysisType[]>(['general'])
  const [frameBuffer, setFrameBuffer] = useState<FrameBuffer[]>([])
  const frameBufferRef = useRef<FrameBuffer[]>([])
  const motionTrackerRef = useRef<MotionTracker>(new MotionTracker())
  const lastProcessedTimeRef = useRef<number>(0)
  const [motionAnalysis, setMotionAnalysis] = useState<{
    averageSpeed: number
    maxSpeed: number
    isMoving: boolean
    dominantDirection: string
    motionPattern: string
  } | null>(null)

  // Update frameBufferRef when frameBuffer changes
  useEffect(() => {
    frameBufferRef.current = frameBuffer
  }, [frameBuffer])

  // Cleanup animation frame on unmount
  useEffect(() => {
    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current)
      }
    }
  }, [])

  const VIDEO_ANALYSIS_OPTIONS = [
    { value: 'general' as AnalysisType, label: 'General Analysis', description: 'Overall scene and content analysis' },
    { value: 'video_motion' as AnalysisType, label: 'Motion Analysis', description: 'Analyze movement patterns and activity' },
    { value: 'video_scene' as AnalysisType, label: 'Scene Analysis', description: 'Analyze scene composition and transitions' },
    { value: 'video_speaking' as AnalysisType, label: 'Speaking Analysis', description: 'Analyze speech and interactions' }
  ]

  const toggleVideoAnalysisType = (type: AnalysisType) => {
    setSelectedVideoAnalysisTypes(prev => {
      if (prev.includes(type)) {
        // Don't remove if it's the last type
        if (prev.length === 1) return prev
        return prev.filter(t => t !== type)
      }
      return [...prev, type]
    })
  }

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setSelectedImage(file)
      const reader = new FileReader()
      reader.onloadend = () => {
        setImagePreview(reader.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  const analyzeVideoQuality = (video: HTMLVideoElement) => {
    const width = video.videoWidth
    const height = video.videoHeight
    const resolution = `${width}x${height}`
    
    // Calculate metrics
    const metrics: VideoQualityMetrics = {
      resolution,
      bitrate: 0, // Will be calculated during playback
      stability: 0,
      sharpness: 0,
      rating: 0,
      feedback: []
    }

    // Assess resolution quality
    const totalPixels = width * height
    if (totalPixels < 921600) { // Less than 720p
      metrics.feedback.push('Low resolution - Recommend minimum 720p')
      metrics.rating += 2
    } else if (totalPixels < 2073600) { // Less than 1080p
      metrics.feedback.push('Medium resolution - Good for most uses')
      metrics.rating += 4
    } else {
      metrics.feedback.push('High resolution - Excellent quality')
      metrics.rating += 5
    }

    // Set initial quality metrics
    setVideoQuality(metrics)
  }

  const handleVideoChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    setError(null)
    setVideoQuality(null)

    if (!file) return

    if (!SUPPORTED_VIDEO_FORMATS.includes(file.type)) {
      setError(`Unsupported format. Supported: ${SUPPORTED_VIDEO_FORMATS.map(format => 
        format.split('/')[1]).join(', ')}`)
      return
    }

    if (file.size > MAX_VIDEO_SIZE) {
      setError(`File too large. Maximum: ${MAX_VIDEO_SIZE / (1024 * 1024)}MB`)
      return
    }

    try {
      const url = URL.createObjectURL(file)
      setVideoUrl(url)
      setIsPlaying(false)
      if (videoRef.current) {
        videoRef.current.src = url
        videoRef.current.onloadedmetadata = () => {
          if (videoRef.current) {
            analyzeVideoQuality(videoRef.current)
          }
        }
      }
    } catch (err) {
      setError('Error loading video. Please try another file.')
      console.error('Error:', err)
    }
  }

  const processFrameBuffer = () => {
    if (frameBufferRef.current.length === 0) return

    // Sort frames by timestamp to ensure order
    const sortedFrames = [...frameBufferRef.current].sort((a, b) => a.timestamp - b.timestamp)
    
    // Use the most recent frame for analysis
    const latestFrame = sortedFrames[sortedFrames.length - 1]
    
    // Convert base64 to File
    fetch(latestFrame.data)
      .then(res => res.blob())
      .then(blob => {
        const file = new File([blob], 'frame.jpg', { type: 'image/jpeg' })
        onAnalyze(file, selectedVideoAnalysisTypes)
      })

    // Clear the buffer
    setFrameBuffer([])
  }

  const captureFrame = () => {
    const video = videoRef.current
    const canvas = canvasRef.current
    if (!video || !canvas || video.paused || video.ended) {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current)
      }
      return
    }

    const context = canvas.getContext('2d')
    if (!context) return

    // Ensure we're not processing frames too quickly
    const currentTime = video.currentTime
    if (currentTime === lastProcessedTimeRef.current) {
      animationFrameRef.current = requestAnimationFrame(captureFrame)
      return
    }
    lastProcessedTimeRef.current = currentTime

    canvas.width = video.videoWidth
    canvas.height = video.videoHeight
    context.drawImage(video, 0, 0, canvas.width, canvas.height)

    // Get center point of the frame for motion tracking
    const centerX = canvas.width / 2
    const centerY = canvas.height / 2

    // Track motion
    if (selectedVideoAnalysisTypes.includes('video_motion')) {
      const motionData = motionTrackerRef.current.track(
        { x: centerX, y: centerY },
        Date.now()
      )

      // Analyze motion patterns
      const analysis = motionTrackerRef.current.analyzeMotion()
      setMotionAnalysis(analysis)
    }

    // Add frame to buffer
    const frameData = canvas.toDataURL('image/jpeg', 0.9)
    const newFrame: FrameBuffer = {
      timestamp: Date.now(),
      data: frameData
    }

    setFrameBuffer(prev => {
      const updated = [...prev, newFrame].slice(-FRAME_BUFFER_SIZE)
      
      if (updated.length === FRAME_BUFFER_SIZE) {
        setTimeout(() => processFrameBuffer(), 0)
      }
      
      return updated
    })

    // Continue capturing frames
    animationFrameRef.current = requestAnimationFrame(captureFrame)
  }

  const togglePlayback = () => {
    const video = videoRef.current
    if (!video || !videoUrl) return

    if (isPlaying) {
      video.pause()
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current)
      }
      if (frameBufferRef.current.length > 0) {
        processFrameBuffer()
      }
    } else {
      video.play()
      setFrameBuffer([])
      motionTrackerRef.current.reset() // Reset motion tracker
      lastProcessedTimeRef.current = 0 // Reset last processed time
      animationFrameRef.current = requestAnimationFrame(captureFrame)
    }
    setIsPlaying(!isPlaying)
  }

  const resetVideo = () => {
    if (videoRef.current) {
      videoRef.current.currentTime = 0
      videoRef.current.pause()
    }
    setIsPlaying(false)
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current)
    }
    setFrameBuffer([])
    motionTrackerRef.current.reset()
    lastProcessedTimeRef.current = 0
    setMotionAnalysis(null)
  }

  const cleanup = () => {
    if (videoUrl) {
      URL.revokeObjectURL(videoUrl)
    }
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current)
    }
    setVideoUrl(null)
    setIsPlaying(false)
    setError(null)
    setVideoQuality(null)
    setFrameBuffer([])
    motionTrackerRef.current.reset()
    lastProcessedTimeRef.current = 0
    setMotionAnalysis(null)
  }

  return (
    <Card className="w-full max-w-3xl p-6 bg-background/50 backdrop-blur-lg">
      <div className="space-y-4">
        <Tabs defaultValue="general" onValueChange={(value) => setAnalysisMode(value as 'general' | 'item_extraction' | 'video')}>
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="general">General Analysis</TabsTrigger>
            <TabsTrigger value="item_extraction">Extract Items</TabsTrigger>
            <TabsTrigger value="video">Video Analysis</TabsTrigger>
          </TabsList>

          {/* General Analysis Tab */}
          <TabsContent value="general">
            <p className="text-sm text-muted-foreground mb-4">
              Upload an image for comprehensive visual analysis including emotions, features, and context.
            </p>
            <div className="flex flex-col items-center gap-4">
              <input
                type="file"
                accept="image/*"
                onChange={handleImageChange}
                className="hidden"
                id="image-upload-general"
              />
              <label
                htmlFor="image-upload-general"
                className="w-full h-64 border-2 border-dashed rounded-lg flex items-center justify-center cursor-pointer hover:border-primary/50 transition-colors"
              >
                {imagePreview && analysisMode === 'general' ? (
                  <img
                    src={imagePreview}
                    alt="Preview"
                    className="max-h-full max-w-full object-contain rounded-lg"
                  />
                ) : (
                  <div className="text-center">
                    <p className="text-muted-foreground">Click or drag to upload an image</p>
                    <p className="text-xs text-muted-foreground mt-2">Supports: JPG, PNG, WebP</p>
                  </div>
                )}
              </label>
              <Button
                onClick={() => selectedImage && onAnalyze(selectedImage, ['general'])}
                disabled={!selectedImage || isProcessing}
                className="w-full"
              >
                {isProcessing ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Analyzing...
                  </>
                ) : (
                  'Analyze Image'
                )}
              </Button>
            </div>
          </TabsContent>

          {/* Item Extraction Tab */}
          <TabsContent value="item_extraction">
            <p className="text-sm text-muted-foreground mb-4">
              Upload an image to extract item names, quantities, and unit prices in JSON format.
            </p>
            <div className="flex flex-col items-center gap-4">
              <input
                type="file"
                accept="image/*"
                onChange={handleImageChange}
                className="hidden"
                id="image-upload-items"
              />
              <label
                htmlFor="image-upload-items"
                className="w-full h-64 border-2 border-dashed rounded-lg flex items-center justify-center cursor-pointer hover:border-primary/50 transition-colors"
              >
                {imagePreview && analysisMode === 'item_extraction' ? (
                  <img
                    src={imagePreview}
                    alt="Preview"
                    className="max-h-full max-w-full object-contain rounded-lg"
                  />
                ) : (
                  <div className="text-center">
                    <p className="text-muted-foreground">Click or drag to upload an image</p>
                    <p className="text-xs text-muted-foreground mt-2">Supports: JPG, PNG, WebP</p>
                  </div>
                )}
              </label>
              <Button
                onClick={() => selectedImage && onAnalyze(selectedImage, ['item_extraction'])}
                disabled={!selectedImage || isProcessing}
                className="w-full"
              >
                {isProcessing ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Extracting...
                  </>
                ) : (
                  'Extract Items'
                )}
              </Button>
            </div>
          </TabsContent>

          {/* Video Analysis Tab */}
          <TabsContent value="video">
            <p className="text-sm text-muted-foreground mb-4">
              Upload a video for frame-by-frame analysis. Supports various formats including MP4, MOV, and AVI.
            </p>
            <div className="space-y-4">
              <div className="flex items-center gap-4">
                <Button
                  onClick={() => document.getElementById('video-upload')?.click()}
                  variant="outline"
                  className="flex items-center gap-2"
                  disabled={isProcessing}
                >
                  <Upload className="h-4 w-4" />
                  Upload Video
                </Button>
                <input
                  id="video-upload"
                  type="file"
                  accept={SUPPORTED_VIDEO_FORMATS.join(',')}
                  onChange={handleVideoChange}
                  className="hidden"
                />
                {videoUrl && (
                  <>
                    <Button
                      onClick={togglePlayback}
                      variant="outline"
                      className="flex items-center gap-2"
                      disabled={isProcessing}
                    >
                      {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                      {isPlaying ? 'Pause Analysis' : 'Start Analysis'}
                    </Button>
                    <Button
                      onClick={resetVideo}
                      variant="outline"
                      className="flex items-center gap-2"
                      disabled={isProcessing}
                    >
                      <RotateCcw className="h-4 w-4" />
                      Reset
                    </Button>
                    <div className="ml-auto">
                      <Button
                        onClick={cleanup}
                        variant="ghost"
                        size="icon"
                        className="h-10 w-10 rounded-full bg-red-100 hover:bg-red-200 text-red-500"
                      >
                        <Trash2 className="h-5 w-5" />
                      </Button>
                    </div>
                  </>
                )}
              </div>

              {/* Analysis Options */}
              {videoUrl && (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    {VIDEO_ANALYSIS_OPTIONS.map((option) => (
                      <div
                        key={option.value}
                        className={cn(
                          "relative flex items-center space-x-2 rounded-lg border p-4 hover:bg-accent transition-colors",
                          selectedVideoAnalysisTypes.includes(option.value) && "border-primary bg-accent"
                        )}
                      >
                        <Checkbox
                          id={option.value}
                          checked={selectedVideoAnalysisTypes.includes(option.value)}
                          onCheckedChange={() => toggleVideoAnalysisType(option.value)}
                          disabled={selectedVideoAnalysisTypes.length === 1 && selectedVideoAnalysisTypes.includes(option.value)}
                          className="data-[state=checked]:bg-primary data-[state=checked]:text-primary-foreground"
                        />
                        <div className="grid gap-1.5">
                          <label
                            htmlFor={option.value}
                            className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                          >
                            {option.label}
                          </label>
                          <p className="text-sm text-muted-foreground">
                            {option.description}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>

                  {error && (
                    <div className="flex items-center gap-2 text-sm text-destructive bg-destructive/10 p-3 rounded-md">
                      <AlertCircle className="w-4 h-4" />
                      {error}
                    </div>
                  )}

                  {/* Video Quality Analysis */}
                  {videoUrl && videoQuality && (
                    <div className="space-y-2 p-4 rounded-lg bg-muted/50">
                      <div className="flex items-center justify-between">
                        <h4 className="font-medium">Video Quality Analysis</h4>
                        <Badge variant={videoQuality.rating >= 8 ? "secondary" : videoQuality.rating >= 5 ? "default" : "destructive"}>
                          Rating: {videoQuality.rating}/10
                        </Badge>
                      </div>
                      <div className="text-sm space-y-1">
                        <p>Resolution: {videoQuality.resolution}</p>
                        {videoQuality.feedback.map((feedback, index) => (
                          <p key={index} className="text-muted-foreground">{feedback}</p>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Motion Analysis Results */}
                  {motionAnalysis && selectedVideoAnalysisTypes.includes('video_motion') && (
                    <div className="space-y-2 p-4 rounded-lg bg-muted/50">
                      <div className="flex items-center justify-between">
                        <h4 className="font-medium">Motion Analysis</h4>
                        <Badge variant={motionAnalysis.isMoving ? "secondary" : "default"}>
                          {motionAnalysis.isMoving ? 'Moving' : 'Static'}
                        </Badge>
                      </div>
                      <div className="text-sm space-y-1">
                        <p>Pattern: {motionAnalysis.motionPattern}</p>
                        <p>Direction: {motionAnalysis.dominantDirection}</p>
                        <p>Average Speed: {motionAnalysis.averageSpeed.toFixed(2)} px/s</p>
                        <p>Max Speed: {motionAnalysis.maxSpeed.toFixed(2)} px/s</p>
                      </div>
                    </div>
                  )}

                  {/* Video Player */}
                  {videoUrl && (
                    <div className="relative rounded-lg overflow-hidden bg-black aspect-video">
                      <video
                        ref={videoRef}
                        className="w-full h-full"
                        onEnded={() => setIsPlaying(false)}
                        onError={() => setError('Error playing video. Format might not be supported.')}
                      >
                        <source src={videoUrl} />
                        Your browser does not support the video tag.
                      </video>
                      <canvas
                        ref={canvasRef}
                        className="hidden"
                      />
                    </div>
                  )}
                </div>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </Card>
  )
} 