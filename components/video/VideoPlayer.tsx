'use client'

import React, { useRef, useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Slider } from '@/components/ui/slider'
import { Play, Pause, RotateCcw, Maximize2, Volume2 } from 'lucide-react'
import { cn } from '@/lib/utils'

interface VideoPlayerProps {
  videoBlob: Blob
  showControls?: boolean
  autoPlay?: boolean
  onAnalyze?: () => void
  analysisOverlay?: React.ReactNode
}

export function VideoPlayer({ 
  videoBlob, 
  showControls = true, 
  autoPlay = false,
  onAnalyze,
  analysisOverlay
}: VideoPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)
  const [volume, setVolume] = useState(1)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [videoUrl, setVideoUrl] = useState<string>('')

  useEffect(() => {
    const url = URL.createObjectURL(videoBlob)
    setVideoUrl(url)

    return () => {
      URL.revokeObjectURL(url)
    }
  }, [videoBlob])

  useEffect(() => {
    const video = videoRef.current
    if (!video) return

    const updateTime = () => setCurrentTime(video.currentTime)
    const updateDuration = () => setDuration(video.duration)
    const handlePlay = () => setIsPlaying(true)
    const handlePause = () => setIsPlaying(false)
    const handleEnded = () => {
      setIsPlaying(false)
      setCurrentTime(0)
    }

    video.addEventListener('timeupdate', updateTime)
    video.addEventListener('loadedmetadata', updateDuration)
    video.addEventListener('play', handlePlay)
    video.addEventListener('pause', handlePause)
    video.addEventListener('ended', handleEnded)

    if (autoPlay) {
      video.play().catch(console.error)
    }

    return () => {
      video.removeEventListener('timeupdate', updateTime)
      video.removeEventListener('loadedmetadata', updateDuration)
      video.removeEventListener('play', handlePlay)
      video.removeEventListener('pause', handlePause)
      video.removeEventListener('ended', handleEnded)
    }
  }, [autoPlay, videoUrl])

  const togglePlayPause = () => {
    if (!videoRef.current) return
    
    if (isPlaying) {
      videoRef.current.pause()
    } else {
      videoRef.current.play()
    }
  }

  const handleSeek = (value: number[]) => {
    if (!videoRef.current) return
    videoRef.current.currentTime = value[0]
    setCurrentTime(value[0])
  }

  const handleVolumeChange = (value: number[]) => {
    if (!videoRef.current) return
    const newVolume = value[0]
    videoRef.current.volume = newVolume
    setVolume(newVolume)
  }

  const restart = () => {
    if (!videoRef.current) return
    videoRef.current.currentTime = 0
    videoRef.current.play()
  }

  const toggleFullscreen = () => {
    if (!videoRef.current) return
    
    if (!document.fullscreenElement) {
      videoRef.current.requestFullscreen()
      setIsFullscreen(true)
    } else {
      document.exitFullscreen()
      setIsFullscreen(false)
    }
  }

  const formatTime = (seconds: number) => {
    if (isNaN(seconds)) return '0:00'
    const mins = Math.floor(seconds / 60)
    const secs = Math.floor(seconds % 60)
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  return (
    <Card className="p-6 max-w-2xl mx-auto">
      <div className="space-y-4">
        <div className="relative aspect-video bg-black rounded-lg overflow-hidden">
          <video
            ref={videoRef}
            src={videoUrl}
            className="w-full h-full object-contain"
            playsInline
          />
          {analysisOverlay && (
            <div className="absolute inset-0 pointer-events-none">
              {analysisOverlay}
            </div>
          )}
        </div>

        {showControls && (
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground w-12 text-right">
                {formatTime(currentTime)}
              </span>
              <Slider
                value={[currentTime]}
                max={duration || 100}
                step={0.1}
                onValueChange={handleSeek}
                className="flex-1"
              />
              <span className="text-sm text-muted-foreground w-12">
                {formatTime(duration)}
              </span>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Button
                  onClick={togglePlayPause}
                  size="icon"
                  variant="outline"
                >
                  {isPlaying ? (
                    <Pause className="h-4 w-4" />
                  ) : (
                    <Play className="h-4 w-4" />
                  )}
                </Button>
                <Button
                  onClick={restart}
                  size="icon"
                  variant="outline"
                >
                  <RotateCcw className="h-4 w-4" />
                </Button>
                <div className="flex items-center gap-2 ml-4">
                  <Volume2 className="h-4 w-4" />
                  <Slider
                    value={[volume]}
                    max={1}
                    step={0.1}
                    onValueChange={handleVolumeChange}
                    className="w-24"
                  />
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  onClick={toggleFullscreen}
                  size="icon"
                  variant="outline"
                >
                  <Maximize2 className="h-4 w-4" />
                </Button>
                {onAnalyze && (
                  <Button onClick={onAnalyze}>
                    Analyze Video
                  </Button>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </Card>
  )
}