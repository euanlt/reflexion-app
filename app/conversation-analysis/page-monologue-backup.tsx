'use client'

import React, { useState, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ArrowLeft, MessageSquare, Mic, Video, Brain, Play, Pause } from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { generateMockConversationAnalysis } from '@/lib/ai/conversation-mock'
import type { ConversationAssessment } from '@/lib/db'
import { toast } from 'sonner'

type AssessmentStep = 'start' | 'conversation' | 'analysis'

const MAX_CONVERSATION_DURATION = 600 // 10 minutes max

export default function ConversationAnalysisPage() {
  const router = useRouter()
  const [currentStep, setCurrentStep] = useState<AssessmentStep>('start')
  const [isRecording, setIsRecording] = useState(false)
  const [recordedTime, setRecordedTime] = useState(0)
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null)
  const [videoBlob, setVideoBlob] = useState<Blob | null>(null)
  const [transcript, setTranscript] = useState('')
  const [analysisResults, setAnalysisResults] = useState<ConversationAssessment['analysisResults'] | null>(null)
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [isCameraLoading, setIsCameraLoading] = useState(false)
  const [aiGreeting, setAiGreeting] = useState('')

  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const audioChunksRef = useRef<Blob[]>([])
  const videoChunksRef = useRef<Blob[]>([])
  const timerRef = useRef<NodeJS.Timeout | null>(null)
  const videoRef = useRef<HTMLVideoElement | null>(null)
  const streamRef = useRef<MediaStream | null>(null)

  // Load voices when component mounts
  React.useEffect(() => {
    if ('speechSynthesis' in window) {
      // Load voices (some browsers need this to populate the voice list)
      window.speechSynthesis.getVoices()
      
      // Chrome needs this event to load voices
      window.speechSynthesis.onvoiceschanged = () => {
        const voices = window.speechSynthesis.getVoices()
        console.log('Available voices loaded:', voices.length)
      }
    }
  }, [])

  // Helper function to get the best available voice for browser TTS
  const getBestVoice = () => {
    const voices = window.speechSynthesis.getVoices()
    
    // Priority order: English female voices, then any English, then default
    const preferences = [
      // High-quality English voices (varies by OS)
      'Google US English Female',
      'Microsoft Zira',
      'Samantha',
      'Karen',
      'Moira',
      'Tessa',
      'Victoria',
      'Fiona',
      // Any English female voice
      (v: SpeechSynthesisVoice) => v.lang.startsWith('en') && v.name.toLowerCase().includes('female'),
      // Any English voice
      (v: SpeechSynthesisVoice) => v.lang.startsWith('en'),
    ]

    for (const pref of preferences) {
      if (typeof pref === 'string') {
        const voice = voices.find(v => v.name === pref)
        if (voice) return voice
      } else {
        const voice = voices.find(pref)
        if (voice) return voice
      }
    }

    return null // Use default voice
  }

  // Helper function to speak text with best available voice
  const speakText = (text: string) => {
    if ('speechSynthesis' in window) {
      const utterance = new SpeechSynthesisUtterance(text)
      
      // Get best available voice
      const voice = getBestVoice()
      if (voice) {
        utterance.voice = voice
        console.log('Using voice:', voice.name)
      }
      
      // Voice customization
      utterance.rate = 0.85      // Slightly slower for clarity
      utterance.pitch = 1.1      // Slightly higher pitch (more friendly)
      utterance.volume = 1.0     // Full volume
      
      window.speechSynthesis.speak(utterance)
    }
  }

  const startRecording = async () => {
    try {
      setIsCameraLoading(true)
      
      // Generate AI greeting using Huawei ModelArts
      let greeting = '';
      try {
        const greetingResponse = await fetch('/api/conversation-analysis/generate-greeting', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
        });
        
        if (greetingResponse.ok) {
          const data = await greetingResponse.json();
          greeting = data.greeting;
        } else {
          // Fallback greeting if API fails
          greeting = "Hello! It's wonderful to see you today. How are you feeling?";
        }
      } catch (error) {
        console.error('Error generating greeting:', error);
        greeting = "Hello! It's wonderful to see you today. How are you feeling?";
      }
      
      setAiGreeting(greeting)
      
      // Request audio and video permissions
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: true,
        video: {
          width: { ideal: 1280 },
          height: { ideal: 720 },
          facingMode: 'user'
        }
      })

      // Store stream reference
      streamRef.current = stream

      // Wait for the video element to be ready before attaching stream
      setTimeout(async () => {
        if (videoRef.current && streamRef.current) {
          videoRef.current.srcObject = streamRef.current
          try {
            await videoRef.current.play()
            console.log('Video is playing')
          } catch (playErr) {
            console.error('Failed to play video:', playErr)
            toast.error('Failed to start video playback')
          }
        }
        setIsCameraLoading(false)
      }, 100)

      // Create separate recorders for audio and video
      const audioStream = new MediaStream(stream.getAudioTracks())
      const videoStream = stream

      const audioRecorder = new MediaRecorder(audioStream, {
        mimeType: 'audio/webm'
      })

      const videoRecorder = new MediaRecorder(videoStream, {
        mimeType: 'video/webm'
      })

      audioChunksRef.current = []
      videoChunksRef.current = []

      audioRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          audioChunksRef.current.push(e.data)
        }
      }

      videoRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          videoChunksRef.current.push(e.data)
        }
      }

      audioRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' })
        setAudioBlob(audioBlob)
      }

      videoRecorder.onstop = () => {
        const videoBlob = new Blob(videoChunksRef.current, { type: 'video/webm' })
        setVideoBlob(videoBlob)
        
        // Stop video preview
        if (videoRef.current) {
          videoRef.current.srcObject = null
        }
        
        // Stop all tracks
        stream.getTracks().forEach(track => track.stop())
        streamRef.current = null
      }

      mediaRecorderRef.current = videoRecorder
      audioRecorder.start()
      videoRecorder.start()

      setIsRecording(true)
      setRecordedTime(0)
      setCurrentStep('conversation')

      // Start timer
      timerRef.current = setInterval(() => {
        setRecordedTime(prev => {
          // Auto-stop after max duration
          if (prev >= MAX_CONVERSATION_DURATION - 1) {
            stopRecording()
            return prev
          }
          return prev + 1
        })
      }, 1000)

      // Speak the AI greeting using Huawei TTS
      try {
        const ttsResponse = await fetch('/api/conversation-analysis/synthesize-speech', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ text: greeting, speed: -10, pitch: 0, volume: 0 }),
        });
        
        if (ttsResponse.ok) {
          const ttsData = await ttsResponse.json();
          // Convert base64 audio to blob and play
          const audioBlob = base64ToBlob(ttsData.audioData, 'audio/wav');
          const audioUrl = URL.createObjectURL(audioBlob);
          const audio = new Audio(audioUrl);
          audio.play().catch((err) => {
            console.error('Failed to play TTS audio:', err);
            // Fallback to browser TTS
            speakText(greeting);
          });
        } else {
          // Fallback to browser TTS
          speakText(greeting);
        }
      } catch (error) {
        console.error('Error with TTS:', error);
        // Fallback to browser TTS
        speakText(greeting);
      }

      toast.success('Conversation started')
    } catch (error) {
      console.error('Error starting recording:', error)
      setIsCameraLoading(false)
      toast.error('Failed to start recording. Please check camera/microphone permissions.')
    }
  }

  const stopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop()
      setIsRecording(false)

      if (timerRef.current) {
        clearInterval(timerRef.current)
      }

      toast.success('Conversation ended')
      
      // Automatically start analysis after audio is saved
      setTimeout(() => {
        handleAnalyze()
      }, 1000)
    }
  }

  const handleAnalyze = async () => {
    setIsAnalyzing(true)
    
    try {
      // Transcribe audio using Huawei SIS
      let transcriptText = '';
      
      if (audioBlob) {
        try {
          const formData = new FormData();
          formData.append('audio', audioBlob, 'conversation.webm');
          
          const transcribeResponse = await fetch('/api/conversation-analysis/transcribe', {
            method: 'POST',
            body: formData,
          });
          
          if (transcribeResponse.ok) {
            const transcribeData = await transcribeResponse.json();
            transcriptText = transcribeData.transcript;
            toast.success('Transcription complete');
          } else {
            throw new Error('Transcription failed');
          }
        } catch (error) {
          console.error('Error transcribing audio:', error);
          transcriptText = '[Transcription unavailable. Audio recording was captured but transcription service is not configured or failed.]';
          toast.error('Transcription failed, using mock analysis');
        }
      } else {
        transcriptText = '[No audio recorded]';
      }
      
      setTranscript(transcriptText);
      
      // Simulate AI analysis delay
      await new Promise(resolve => setTimeout(resolve, 2000))
      
      // Generate mock analysis results based on transcript
      const results = generateMockConversationAnalysis()
      setAnalysisResults(results)
      setIsAnalyzing(false)
      setCurrentStep('analysis')
      
      toast.success('Analysis complete')
    } catch (error) {
      console.error('Error during analysis:', error);
      setIsAnalyzing(false)
      toast.error('Analysis failed. Please try again.');
    }
  }

  const startNewConversation = () => {
    setAudioBlob(null)
    setVideoBlob(null)
    setTranscript('')
    setAnalysisResults(null)
    setRecordedTime(0)
    setAiGreeting('')
    setCurrentStep('start')
  }

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  // Helper function to convert base64 to blob
  const base64ToBlob = (base64: string, mimeType: string = 'audio/wav'): Blob => {
    const binaryString = atob(base64)
    const bytes = new Uint8Array(binaryString.length)
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i)
    }
    return new Blob([bytes], { type: mimeType })
  }

  // Re-attach stream when video element becomes available
  React.useEffect(() => {
    if (currentStep === 'conversation' && videoRef.current && streamRef.current && !isCameraLoading) {
      console.log('Re-attaching stream to video element in useEffect')
      videoRef.current.srcObject = streamRef.current
      videoRef.current.play().catch(err => {
        console.error('Failed to play video in useEffect:', err)
      })
    }
  }, [currentStep, isCameraLoading])

  return (
    <div className="container mx-auto p-4 max-w-4xl">
      <div className="mb-6">
        <Link href="/">
          <Button variant="ghost" size="sm" className="mb-4">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Dashboard
          </Button>
        </Link>
        
        <h1 className="text-3xl font-bold flex items-center gap-2">
          <MessageSquare className="h-8 w-8" />
          Conversation Analysis
        </h1>
        <p className="text-muted-foreground mt-2">
          Passive cognitive monitoring through natural conversation
        </p>
      </div>

      {currentStep === 'start' && (
        <Card className="max-w-2xl mx-auto">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 w-20 h-20 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
              <MessageSquare className="h-10 w-10 text-white" />
            </div>
            <CardTitle className="text-2xl">AI Mirror Conversation</CardTitle>
            <CardDescription className="text-base mt-2">
              Have a natural conversation with your AI companion for cognitive health monitoring
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="bg-gradient-to-br from-blue-50 to-purple-50 dark:from-blue-950 dark:to-purple-950 p-6 rounded-xl border-2 border-blue-200 dark:border-blue-800">
              <h3 className="font-semibold mb-3 flex items-center gap-2">
                <span>✨</span>
                How it works
              </h3>
              <ul className="space-y-2 text-sm">
                <li className="flex items-start gap-2">
                  <span className="text-blue-600 dark:text-blue-400 font-bold">1.</span>
                  <span>The AI will greet you and start a friendly conversation</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-blue-600 dark:text-blue-400 font-bold">2.</span>
                  <span>Speak naturally about anything - your day, memories, thoughts</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-blue-600 dark:text-blue-400 font-bold">3.</span>
                  <span>When you're done, end the conversation to see your results</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-blue-600 dark:text-blue-400 font-bold">4.</span>
                  <span>Your speech patterns will be analyzed for cognitive health insights</span>
                </li>
              </ul>
            </div>

            <div className="bg-muted/50 p-4 rounded-lg">
              <p className="text-sm text-center">
                💡 <strong>Tip:</strong> Find a quiet place and speak clearly. The conversation can last up to {Math.floor(MAX_CONVERSATION_DURATION / 60)} minutes.
              </p>
            </div>
            
            <Button 
              onClick={startRecording}
              size="lg"
              className="w-full text-lg h-14 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
            >
              <Mic className="mr-2 h-6 w-6" />
              Start Conversation
            </Button>
          </CardContent>
        </Card>
      )}

      {currentStep === 'conversation' && (
        <div className="space-y-4 max-w-4xl mx-auto">
          <Card>
            <CardContent className="p-6 space-y-4">
              {/* Mirror Video Preview */}
              <div className="relative rounded-2xl overflow-hidden aspect-video shadow-2xl border-4 border-gray-200 bg-gradient-to-br from-gray-100 via-gray-50 to-gray-100">
                {isCameraLoading && (
                  <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-gray-800 to-gray-900 z-20">
                    <div className="text-center text-white">
                      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
                      <p className="text-sm">Initializing mirror...</p>
                    </div>
                  </div>
                )}
                <video
                  ref={videoRef}
                  autoPlay={true}
                  muted={true}
                  playsInline={true}
                  className="w-full h-full"
                  style={{ 
                    display: 'block',
                    objectFit: 'cover',
                    transform: 'scaleX(-1)',
                    filter: 'contrast(1.05) brightness(1.02)'
                  }}
                  onLoadedMetadata={() => console.log('Video metadata loaded')}
                  onPlay={() => console.log('Video playing')}
                  onError={(e) => {
                    console.error('Video element error:', e)
                    toast.error('Video playback error. Please try again.')
                  }}
                />
                {!isCameraLoading && (
                  <div className="absolute bottom-2 right-2 bg-black/50 text-white px-2 py-1 rounded text-xs font-mono backdrop-blur-sm">
                    {formatTime(recordedTime)}
                  </div>
                )}
                {/* Mirror frame effect */}
                <div className="absolute inset-0 pointer-events-none rounded-2xl" 
                     style={{
                       boxShadow: 'inset 0 0 60px rgba(255,255,255,0.1), inset 0 0 20px rgba(255,255,255,0.05)'
                     }}
                />
              </div>
              
              {/* AI Greeting Display */}
              {aiGreeting && (
                <div className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-950 dark:to-purple-950 p-5 rounded-xl border-2 border-blue-200 dark:border-blue-800">
                  <div className="flex items-start gap-3">
                    <div className="flex-shrink-0 w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                      <MessageSquare className="h-5 w-5 text-white" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-blue-900 dark:text-blue-100 mb-1">AI Companion</p>
                      <p className="text-sm text-gray-700 dark:text-gray-300 italic">"{aiGreeting}"</p>
                    </div>
                  </div>
                </div>
              )}
              
              <div className="flex gap-2 justify-center pt-2">
                <Button
                  onClick={stopRecording}
                  variant="destructive"
                  size="lg"
                  className="min-w-[200px]"
                >
                  <Pause className="mr-2 h-5 w-5" />
                  End Conversation
                </Button>
              </div>
              
              <div className="text-center text-sm text-muted-foreground">
                Speak naturally • Your conversation is being recorded for analysis
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Analyzing State */}
      {isAnalyzing && (
        <div className="max-w-2xl mx-auto">
          <Card>
            <CardContent className="p-12">
              <div className="text-center">
                <Brain className="h-16 w-16 mx-auto mb-6 text-primary animate-pulse" />
                <h3 className="text-xl font-semibold mb-2">Analyzing Your Conversation</h3>
                <p className="text-muted-foreground mb-6">
                  Processing speech patterns and cognitive markers...
                </p>
                <div className="flex justify-center gap-2">
                  <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                  <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                  <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {currentStep === 'analysis' && analysisResults && (
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>Analysis Results</span>
                <span className={`text-sm font-normal px-3 py-1 rounded-full ${
                  analysisResults.riskLevel === 'low' ? 'bg-green-100 text-green-800' :
                  analysisResults.riskLevel === 'moderate' ? 'bg-yellow-100 text-yellow-800' :
                  'bg-red-100 text-red-800'
                }`}>
                  {analysisResults.riskLevel.toUpperCase()} RISK
                </span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="text-center">
                <div className="text-4xl font-bold mb-2">
                  {analysisResults.overallScore}%
                </div>
                <p className="text-sm text-muted-foreground">Overall Cognitive Health Score</p>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="bg-muted p-4 rounded-lg">
                  <h4 className="font-medium mb-3">🗣️ Speech Metrics</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span>Fluency:</span>
                      <span className="font-medium">{analysisResults.speech.fluencyScore}%</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Word Finding:</span>
                      <span className="font-medium">{analysisResults.speech.wordFindingScore}%</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Speech Rate:</span>
                      <span className="font-medium">{analysisResults.speech.speechRate} wpm</span>
                    </div>
                  </div>
                </div>

                <div className="bg-muted p-4 rounded-lg">
                  <h4 className="font-medium mb-3">📚 Language Quality</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span>Vocabulary:</span>
                      <span className="font-medium">{analysisResults.language.vocabularyDiversity}%</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Coherence:</span>
                      <span className="font-medium">{analysisResults.language.semanticCoherence}%</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Grammar:</span>
                      <span className="font-medium">{analysisResults.language.grammarAccuracy}%</span>
                    </div>
                  </div>
                </div>

                <div className="bg-muted p-4 rounded-lg">
                  <h4 className="font-medium mb-3">🧠 Memory & Recall</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span>Short-term:</span>
                      <span className="font-medium">{analysisResults.memory.shortTermRecall}%</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Orientation:</span>
                      <span className="font-medium">{analysisResults.memory.temporalOrientation}%</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Narrative:</span>
                      <span className="font-medium">{analysisResults.memory.narrativeCoherence}%</span>
                    </div>
                  </div>
                </div>

                <div className="bg-muted p-4 rounded-lg">
                  <h4 className="font-medium mb-3">🎯 Cognitive Function</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span>Topic Focus:</span>
                      <span className="font-medium">{analysisResults.cognitive.topicMaintenance}%</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Abstract Thinking:</span>
                      <span className="font-medium">{analysisResults.cognitive.abstractThinking}%</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Problem Solving:</span>
                      <span className="font-medium">{analysisResults.cognitive.problemSolving}%</span>
                    </div>
                  </div>
                </div>
              </div>

              {analysisResults.indicators.length > 0 && (
                <div className="bg-yellow-50 border border-yellow-200 p-4 rounded-lg">
                  <h4 className="font-medium mb-2">⚠️ Indicators Detected</h4>
                  <ul className="text-sm space-y-1">
                    {analysisResults.indicators.map((indicator, index) => (
                      <li key={index}>• {indicator}</li>
                    ))}
                  </ul>
                </div>
              )}

              {analysisResults.recommendations.length > 0 && (
                <div className="bg-blue-50 border border-blue-200 p-4 rounded-lg">
                  <h4 className="font-medium mb-2">💡 Recommendations</h4>
                  <ul className="text-sm space-y-1">
                    {analysisResults.recommendations.map((rec, index) => (
                      <li key={index}>• {rec}</li>
                    ))}
                  </ul>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Conversation Details */}
          <Card>
            <CardHeader>
              <CardTitle>Conversation Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="bg-muted p-4 rounded-lg">
                <p className="text-sm font-medium mb-2">Recording Information:</p>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <span className="text-muted-foreground">Duration:</span>
                    <span className="ml-2 font-medium">{formatTime(recordedTime)}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Audio:</span>
                    <span className="ml-2 font-medium">{audioBlob ? '✓ Recorded' : '✗ Not available'}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Video:</span>
                    <span className="ml-2 font-medium">{videoBlob ? '✓ Recorded' : '✗ Not available'}</span>
                  </div>
                </div>
              </div>

              {transcript && (
                <div className="bg-muted/50 p-4 rounded-lg">
                  <h4 className="font-medium mb-2">Transcript Preview:</h4>
                  <p className="text-sm text-muted-foreground">{transcript}</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Actions */}
          <div className="flex gap-2 justify-center">
            <Button
              variant="outline"
              onClick={startNewConversation}
              size="lg"
            >
              New Conversation
            </Button>
            <Button
              onClick={() => router.push('/')}
              size="lg"
            >
              Back to Dashboard
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}

