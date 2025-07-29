'use client'

import React, { useState, useRef, useCallback, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Video, Square, Circle, Camera, CameraOff, RotateCcw } from 'lucide-react'
import { cn } from '@/lib/utils'

interface VideoRecorderProps {
  onRecordingComplete: (videoBlob: Blob) => void
  maxDuration?: number // in seconds
  instructions?: string
  taskType?: 'movement' | 'speech' | 'drawing'
}

export function VideoRecorder({ 
  onRecordingComplete, 
  maxDuration = 30,
  instructions = "Press record when ready to begin",
  taskType = 'movement'
}: VideoRecorderProps) {
  const [isRecording, setIsRecording] = useState(false)
  const [isPreviewing, setIsPreviewing] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [recordedTime, setRecordedTime] = useState(0)
  const [facingMode, setFacingMode] = useState<'user' | 'environment'>('user')
  const [error, setError] = useState<string | null>(null)
  
  const videoRef = useRef<HTMLVideoElement>(null)
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const chunksRef = useRef<Blob[]>([])
  const timerRef = useRef<NodeJS.Timeout | null>(null)

  const startCamera = useCallback(async () => {
    try {
      setError(null)
      setIsLoading(true)
      
      // Check if getUserMedia is available
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        setError('Camera access is not supported in this browser. Please use a modern browser.')
        setIsLoading(false)
        return
      }

      const constraints: MediaStreamConstraints = {
        video: {
          facingMode,
          width: { ideal: 1280 },
          height: { ideal: 720 }
        },
        audio: taskType === 'speech'
      }

      console.log('Requesting camera with constraints:', constraints)
      const stream = await navigator.mediaDevices.getUserMedia(constraints)
      console.log('Camera stream obtained:', stream)
      console.log('Video tracks:', stream.getVideoTracks())
      
      streamRef.current = stream
      
      // Set preview state first to render the video element
      setIsPreviewing(true)
      
      // Wait a moment for the video element to be rendered
      setTimeout(async () => {
        if (videoRef.current && streamRef.current) {
          console.log('Attaching stream to video element')
          videoRef.current.srcObject = streamRef.current
          
          try {
            // Ensure video plays
            await videoRef.current.play()
            console.log('Video is playing')
          } catch (playErr) {
            console.error('Failed to play video:', playErr)
            setError('Failed to start video playback')
          }
        } else {
          console.error('Video ref or stream not available')
          setError('Failed to initialize video')
        }
        setIsLoading(false)
      }, 100)
    } catch (err: any) {
      console.error('Camera access error:', err)
      setIsLoading(false)
      
      // Provide more specific error messages
      if (err.name === 'NotAllowedError') {
        setError('Camera permission denied. Please allow camera access in your browser settings.')
      } else if (err.name === 'NotFoundError') {
        setError('No camera found. Please ensure your device has a camera.')
      } else if (err.name === 'NotReadableError') {
        setError('Camera is already in use by another application.')
      } else if (err.name === 'OverconstrainedError') {
        setError('Camera does not support the requested settings.')
      } else {
        setError(`Unable to access camera: ${err.message || 'Unknown error'}`)
      }
    }
  }, [facingMode, taskType])

  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop())
      streamRef.current = null
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null
    }
    setIsPreviewing(false)
  }, [])

  const startRecording = useCallback(async () => {
    if (!streamRef.current) return

    chunksRef.current = []
    
    // Try different mime types for better compatibility
    const mimeTypes = [
      'video/webm;codecs=vp9,opus',
      'video/webm;codecs=vp8,opus',
      'video/webm',
      'video/mp4'
    ]
    
    let selectedMimeType = ''
    for (const mimeType of mimeTypes) {
      if (MediaRecorder.isTypeSupported(mimeType)) {
        selectedMimeType = mimeType
        break
      }
    }
    
    if (!selectedMimeType) {
      setError('No supported video format found in this browser.')
      return
    }
    
    const options: MediaRecorderOptions = {
      mimeType: selectedMimeType
    }
    
    try {
      console.log('Starting recording with mime type:', selectedMimeType)
      const mediaRecorder = new MediaRecorder(streamRef.current, options)
      mediaRecorderRef.current = mediaRecorder

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunksRef.current.push(event.data)
        }
      }

      mediaRecorder.onstop = () => {
        const videoBlob = new Blob(chunksRef.current, { type: selectedMimeType })
        onRecordingComplete(videoBlob)
        stopCamera()
      }

      mediaRecorder.start()
      setIsRecording(true)
      setRecordedTime(0)

      // Start timer
      timerRef.current = setInterval(() => {
        setRecordedTime(prev => {
          if (prev >= maxDuration - 1) {
            stopRecording()
            return prev
          }
          return prev + 1
        })
      }, 1000)
    } catch (err) {
      setError('Unable to start recording. Please try again.')
      console.error('Recording error:', err)
    }
  }, [maxDuration, onRecordingComplete, stopCamera])

  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop()
      setIsRecording(false)
      
      if (timerRef.current) {
        clearInterval(timerRef.current)
        timerRef.current = null
      }
    }
  }, [isRecording])

  const toggleCamera = () => {
    setFacingMode(prev => prev === 'user' ? 'environment' : 'user')
    if (isPreviewing) {
      stopCamera()
      setTimeout(startCamera, 100)
    }
  }

  useEffect(() => {
    return () => {
      stopCamera()
      if (timerRef.current) {
        clearInterval(timerRef.current)
      }
    }
  }, [stopCamera])

  // Re-attach stream when video element becomes available
  useEffect(() => {
    if (isPreviewing && videoRef.current && streamRef.current) {
      console.log('Re-attaching stream to video element in useEffect')
      videoRef.current.srcObject = streamRef.current
      videoRef.current.play().catch(err => {
        console.error('Failed to play video in useEffect:', err)
      })
    }
  }, [isPreviewing])

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  return (
    <Card className="p-6 max-w-2xl mx-auto">
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <Video className="h-5 w-5" />
            Video Recording
          </h3>
          {isRecording && (
            <div className="flex items-center gap-2">
              <Circle className="h-4 w-4 text-red-500 animate-pulse" />
              <span className="text-sm font-medium">{formatTime(recordedTime)} / {formatTime(maxDuration)}</span>
            </div>
          )}
        </div>

        <p className="text-sm text-muted-foreground">{instructions}</p>

        <div className="relative bg-black rounded-lg overflow-hidden" style={{ minHeight: '400px' }}>
          {isLoading && (
            <div className="absolute inset-0 flex items-center justify-center bg-background/80 z-10">
              <div className="text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
                <p className="text-sm text-muted-foreground">Loading camera...</p>
              </div>
            </div>
          )}
          {isPreviewing ? (
            <>
              <video
                ref={videoRef}
                autoPlay={true}
                playsInline={true}
                muted={true}
                controls={false}
                className="w-full h-full"
                style={{ 
                  display: 'block',
                  minHeight: '400px',
                  objectFit: 'cover'
                }}
                onLoadedMetadata={() => console.log('Video metadata loaded')}
                onPlay={() => console.log('Video playing')}
                onError={(e) => {
                  console.error('Video element error:', e)
                  setError('Video playback error. Please try again.')
                }}
              />
              {taskType === 'movement' && (
                <div className="absolute inset-0 pointer-events-none">
                  <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-64 h-80 border-2 border-primary/30 rounded-lg" />
                  <p className="absolute bottom-4 left-1/2 transform -translate-x-1/2 text-sm text-primary bg-background/80 px-3 py-1 rounded">
                    Position yourself within the guide
                  </p>
                </div>
              )}
            </>
          ) : (
            <div className="flex items-center justify-center h-full" style={{ minHeight: '400px' }}>
              <Camera className="h-16 w-16 text-muted-foreground" />
            </div>
          )}
        </div>

        {error && (
          <div className="bg-destructive/10 text-destructive text-sm p-3 rounded-md">
            {error}
          </div>
        )}

        <div className="flex gap-2 justify-center">
          {!isPreviewing ? (
            <Button onClick={startCamera} size="lg">
              <Camera className="mr-2 h-4 w-4" />
              Start Camera
            </Button>
          ) : (
            <>
              {!isRecording ? (
                <>
                  <Button onClick={stopCamera} variant="outline">
                    <CameraOff className="mr-2 h-4 w-4" />
                    Stop Camera
                  </Button>
                  <Button onClick={toggleCamera} variant="outline" size="icon">
                    <RotateCcw className="h-4 w-4" />
                  </Button>
                  <Button onClick={startRecording} size="lg" className="bg-red-500 hover:bg-red-600">
                    <Circle className="mr-2 h-4 w-4" />
                    Start Recording
                  </Button>
                </>
              ) : (
                <Button onClick={stopRecording} size="lg" variant="destructive">
                  <Square className="mr-2 h-4 w-4" />
                  Stop Recording
                </Button>
              )}
            </>
          )}
        </div>
      </div>
    </Card>
  )
}