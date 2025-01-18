'use client'

import { useState, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { Upload, Play, Pause, RotateCcw, AlertCircle } from 'lucide-react'
import type { AnalysisType } from '@/app/actions/process-image'

interface VideoUploadProps {
  onFrame: (imageData: string, analysisTypes: AnalysisType[]) => void
  isProcessing: boolean
  selectedAnalysisTypes: AnalysisType[]
}

// Supported video formats
const SUPPORTED_FORMATS = [
  'video/mp4',
  'video/quicktime', // .mov
  'video/x-msvideo',  // .avi
  'video/webm',
  'video/ogg',
  'video/mpeg',
  'video/3gpp',
  'video/x-matroska' // .mkv
]

const MAX_FILE_SIZE = 500 * 1024 * 1024 // 500MB

export function VideoUpload({ onFrame, isProcessing, selectedAnalysisTypes }: VideoUploadProps) {
  const [videoUrl, setVideoUrl] = useState<string | null>(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const frameIntervalRef = useRef<NodeJS.Timeout>()

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    setError(null)

    if (!file) return

    // Check file type
    if (!SUPPORTED_FORMATS.includes(file.type)) {
      setError(`Unsupported file format. Supported formats: ${SUPPORTED_FORMATS.map(format => 
        format.split('/')[1]).join(', ')}`)
      return
    }

    // Check file size
    if (file.size > MAX_FILE_SIZE) {
      setError(`File size too large. Maximum size: ${MAX_FILE_SIZE / (1024 * 1024)}MB`)
      return
    }

    try {
      const url = URL.createObjectURL(file)
      setVideoUrl(url)
      setIsPlaying(false)
      if (videoRef.current) {
        videoRef.current.src = url
      }
    } catch (err) {
      setError('Error loading video file. Please try another file.')
      console.error('Error loading video:', err)
    }
  }

  const captureFrame = () => {
    const video = videoRef.current
    const canvas = canvasRef.current
    if (!video || !canvas || video.paused || video.ended) return

    const context = canvas.getContext('2d')
    if (!context) return

    // Set canvas size to match video
    canvas.width = video.videoWidth
    canvas.height = video.videoHeight

    // Draw the current frame
    context.drawImage(video, 0, 0, canvas.width, canvas.height)

    // Convert to base64 and send for analysis
    const frameData = canvas.toDataURL('image/jpeg', 0.9) // Added quality parameter
    onFrame(frameData, selectedAnalysisTypes)
  }

  const togglePlayback = () => {
    const video = videoRef.current
    if (!video || !videoUrl) return

    if (isPlaying) {
      video.pause()
      if (frameIntervalRef.current) {
        clearInterval(frameIntervalRef.current)
      }
    } else {
      video.play()
      // Capture frames every 1 second while playing
      frameIntervalRef.current = setInterval(captureFrame, 1000)
    }
    setIsPlaying(!isPlaying)
  }

  const resetVideo = () => {
    if (videoRef.current) {
      videoRef.current.currentTime = 0
      videoRef.current.pause()
    }
    setIsPlaying(false)
    if (frameIntervalRef.current) {
      clearInterval(frameIntervalRef.current)
    }
  }

  // Cleanup function
  const cleanup = () => {
    if (videoUrl) {
      URL.revokeObjectURL(videoUrl)
    }
    if (frameIntervalRef.current) {
      clearInterval(frameIntervalRef.current)
    }
    setVideoUrl(null)
    setIsPlaying(false)
    setError(null)
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-4">
       
        <input
          id="video-upload"
          type="file"
          accept={SUPPORTED_FORMATS.join(',')}
          onChange={handleFileChange}
          className="hidden"
        />
        {videoUrl && (
          <>
            <Button
              onClick={togglePlayback}
              variant="outline"
              disabled={isProcessing}
            >
              {isPlaying ? (
                <Pause className="w-4 h-4 mr-2" />
              ) : (
                <Play className="w-4 h-4 mr-2" />
              )}
              {isPlaying ? 'Pause' : 'Play'}
            </Button>
            <Button
              onClick={resetVideo}
              variant="outline"
              disabled={isProcessing}
            >
              <RotateCcw className="w-4 h-4 mr-2" />
              Reset
            </Button>
            <Button
              onClick={cleanup}
              variant="destructive"
              disabled={isProcessing}
            >
              Remove Video
            </Button>
          </>
        )}
      </div>

      {error && (
        <div className="flex items-center gap-2 text-sm text-destructive bg-destructive/10 p-3 rounded-md">
          <AlertCircle className="w-4 h-4" />
          {error}
        </div>
      )}

      {videoUrl && (
        <div className="relative rounded-lg overflow-hidden bg-black aspect-video">
          <video
            ref={videoRef}
            className="w-full h-full"
            onEnded={() => setIsPlaying(false)}
            onError={() => setError('Error playing video. The format might not be supported.')}
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
  )
} 