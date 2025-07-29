'use client'

import React, { useEffect, useRef, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'

export function CameraTest() {
  const videoRef = useRef<HTMLVideoElement>(null)
  const [status, setStatus] = useState<string>('Not started')
  const [error, setError] = useState<string>('')
  const [stream, setStream] = useState<MediaStream | null>(null)

  const startCamera = async () => {
    try {
      setStatus('Checking browser support...')
      
      // Check browser support
      if (!navigator.mediaDevices) {
        throw new Error('navigator.mediaDevices is not available')
      }
      
      if (!navigator.mediaDevices.getUserMedia) {
        throw new Error('getUserMedia is not available')
      }
      
      setStatus('Requesting camera permission...')
      
      // Simple constraints
      const constraints = {
        video: true,
        audio: false
      }
      
      console.log('Requesting getUserMedia with constraints:', constraints)
      const mediaStream = await navigator.mediaDevices.getUserMedia(constraints)
      
      setStatus('Got media stream, attaching to video element...')
      console.log('Media stream:', mediaStream)
      console.log('Video tracks:', mediaStream.getVideoTracks())
      
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream
        setStatus('Stream attached, waiting for video to play...')
        
        // Try to play the video
        try {
          await videoRef.current.play()
          setStatus('Camera is working!')
        } catch (playError) {
          console.error('Play error:', playError)
          setStatus('Stream attached but video won\'t play')
        }
      }
      
      setStream(mediaStream)
      setError('')
    } catch (err: any) {
      console.error('Camera error:', err)
      setError(`Error: ${err.name} - ${err.message}`)
      setStatus('Failed to start camera')
    }
  }

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach(track => {
        track.stop()
        console.log('Stopped track:', track)
      })
      setStream(null)
    }
    
    if (videoRef.current) {
      videoRef.current.srcObject = null
    }
    
    setStatus('Camera stopped')
  }

  useEffect(() => {
    // Log environment info
    console.log('User Agent:', navigator.userAgent)
    console.log('Protocol:', window.location.protocol)
    console.log('MediaDevices available:', !!navigator.mediaDevices)
    console.log('getUserMedia available:', !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia))
    
    return () => {
      stopCamera()
    }
  }, [])

  return (
    <Card className="p-6 max-w-2xl mx-auto">
      <h2 className="text-xl font-bold mb-4">Camera Test</h2>
      
      <div className="space-y-4">
        <div className="text-sm space-y-1">
          <p><strong>Status:</strong> {status}</p>
          {error && <p className="text-red-600"><strong>Error:</strong> {error}</p>}
          <p><strong>Protocol:</strong> {window.location.protocol}</p>
          <p><strong>MediaDevices:</strong> {navigator.mediaDevices ? 'Available' : 'Not available'}</p>
        </div>
        
        <div className="aspect-video bg-black rounded overflow-hidden">
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            className="w-full h-full"
            onLoadedMetadata={() => console.log('Video metadata loaded')}
            onPlay={() => console.log('Video playing')}
            onError={(e) => console.error('Video error:', e)}
          />
        </div>
        
        <div className="flex gap-2">
          <Button onClick={startCamera} disabled={!!stream}>
            Start Camera
          </Button>
          <Button onClick={stopCamera} disabled={!stream} variant="outline">
            Stop Camera
          </Button>
        </div>
        
        <div className="text-xs text-muted-foreground">
          <p>Check browser console for detailed logs</p>
          <p>Make sure you are using HTTPS or localhost</p>
          <p>Allow camera permissions when prompted</p>
        </div>
      </div>
    </Card>
  )
}