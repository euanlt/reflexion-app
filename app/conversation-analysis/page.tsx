'use client'

import React, { useState, useRef, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { ArrowLeft, MessageSquare, Mic, Video, Brain, Loader2, Volume2, User } from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { generateMockConversationAnalysis } from '@/lib/ai/conversation-mock'
import type { ConversationAssessment } from '@/lib/db'
import { toast } from 'sonner'
import { getConversationManager, type ConversationTurn } from '@/lib/services/conversation-manager.service'
import { VoiceActivityDetector } from '@/lib/audio/voice-activity-detection'

// Conversation states
type ConversationState = 'idle' | 'ai-speaking' | 'listening' | 'processing'

const MAX_CONVERSATION_DURATION = 600 // 10 minutes max

export default function ConversationAnalysisPage() {
  const router = useRouter()
  
  // State machine
  const [conversationState, setConversationState] = useState<ConversationState>('idle')
  const [conversationTurns, setConversationTurns] = useState<ConversationTurn[]>([])
  const [recordedTime, setRecordedTime] = useState(0)
  const [analysisResults, setAnalysisResults] = useState<ConversationAssessment['analysisResults'] | null>(null)
  const [isCameraLoading, setIsCameraLoading] = useState(false)
  const [audioVolume, setAudioVolume] = useState(0)

  // Refs
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const audioChunksRef = useRef<Blob[]>([])
  const timerRef = useRef<NodeJS.Timeout | null>(null)
  const videoRef = useRef<HTMLVideoElement | null>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const vadRef = useRef<VoiceActivityDetector | null>(null)
  const conversationManagerRef = useRef(getConversationManager())
  const isSpeakingRef = useRef(false)

  // Load voices when component mounts
  useEffect(() => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.getVoices()
      window.speechSynthesis.onvoiceschanged = () => {
        const voices = window.speechSynthesis.getVoices()
        console.log('Available voices loaded:', voices.length)
      }
    }

    // Cleanup on unmount
    return () => {
      stopConversation()
    }
  }, [])

  // Helper function to get the best available voice for browser TTS
  const getBestVoice = () => {
    const voices = window.speechSynthesis.getVoices()
    
    const preferences = [
      'Google US English Female',
      'Microsoft Zira',
      'Samantha',
      'Karen',
      'Moira',
      (v: SpeechSynthesisVoice) => v.lang.startsWith('en') && v.name.toLowerCase().includes('female'),
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

    return null
  }

  // Helper function to speak text with best available voice
  const speakText = (text: string, onEnd?: () => void) => {
    if ('speechSynthesis' in window) {
      // Cancel any ongoing speech
      window.speechSynthesis.cancel()
      
      const utterance = new SpeechSynthesisUtterance(text)
      
      const voice = getBestVoice()
      if (voice) {
        utterance.voice = voice
        console.log('Using voice:', voice.name)
      }
      
      utterance.rate = 0.85
      utterance.pitch = 1.1
      utterance.volume = 1.0
      
      utterance.onend = () => {
        console.log('Speech ended')
        isSpeakingRef.current = false
        if (onEnd) onEnd()
      }

      utterance.onerror = (error) => {
        console.error('Speech error:', error)
        isSpeakingRef.current = false
        if (onEnd) onEnd()
      }

      isSpeakingRef.current = true
      window.speechSynthesis.speak(utterance)
    } else if (onEnd) {
      onEnd()
    }
  }

  // Start conversation
  const startConversation = async () => {
    try {
      setIsCameraLoading(true)
      setRecordedTime(0)

      // Initialize conversation manager
      conversationManagerRef.current.start()
      
      // Generate AI greeting
      let greeting = 'Hello! I\'m here to have a nice conversation with you. How are you feeling today?'
      try {
        const greetingResponse = await fetch('/api/conversation-analysis/generate-greeting', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
        })
        
        if (greetingResponse.ok) {
          const data = await greetingResponse.json()
          greeting = data.greeting
        }
      } catch (error) {
        console.error('Error generating greeting:', error)
      }

      // Add greeting to conversation history
      conversationManagerRef.current.addAITurn(greeting)
      setConversationTurns([...conversationManagerRef.current.getAllTurns()])

      // Request camera and microphone access
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: true,
        video: {
          width: { ideal: 1280 },
          height: { ideal: 720 },
          facingMode: 'user'
        }
      })

      streamRef.current = stream

      // Attach video stream to video element
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

      // Start timer
      timerRef.current = setInterval(() => {
        setRecordedTime(prev => {
          if (prev >= MAX_CONVERSATION_DURATION - 1) {
            endConversation()
            return prev
          }
          return prev + 1
        })
      }, 1000)

      // Speak greeting and then start listening
      setConversationState('ai-speaking')
      speakText(greeting, () => {
        // After greeting, start listening
        startListening()
      })

      toast.success('Conversation started')
    } catch (error) {
      console.error('Error starting conversation:', error)
      setIsCameraLoading(false)
      toast.error('Failed to start conversation. Please check camera/microphone permissions.')
    }
  }

  // Start listening for user input
  const startListening = async () => {
    if (!streamRef.current) return

    try {
      console.log('[Conversation] Starting to listen...')
      setConversationState('listening')

      // Initialize audio recording
      const audioStream = new MediaStream(streamRef.current.getAudioTracks())
      const audioRecorder = new MediaRecorder(audioStream, {
        mimeType: 'audio/webm'
      })

      audioChunksRef.current = []

      audioRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          audioChunksRef.current.push(e.data)
        }
      }

      audioRecorder.start()
      mediaRecorderRef.current = audioRecorder

      // Initialize VAD
      vadRef.current = new VoiceActivityDetector({
        silenceThreshold: 30,
        silenceDuration: 2000, // 2 seconds
        minSpeechDuration: 300,
        sampleRate: 100,
      })

      await vadRef.current.start(streamRef.current, {
        onSpeechEnd: () => {
          console.log('[Conversation] User finished speaking')
          handleUserTurnComplete()
        },
        onVolumeChange: (volume) => {
          setAudioVolume(volume)
        },
      })

      console.log('[Conversation] Listening for user input...')
    } catch (error) {
      console.error('Error starting listening:', error)
      toast.error('Failed to start listening')
    }
  }

  // Handle when user finishes their turn
  const handleUserTurnComplete = async () => {
    if (conversationState !== 'listening') return
    if (conversationManagerRef.current.isCurrentlyProcessing()) return

    console.log('[Conversation] Processing user turn...')
    setConversationState('processing')

    // Stop recording this turn
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      mediaRecorderRef.current.stop()

      mediaRecorderRef.current.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' })
        console.log('[Conversation] Audio captured:', audioBlob.size, 'bytes')

        try {
          // Process user turn and get AI response
          const aiResponse = await conversationManagerRef.current.processUserTurn(audioBlob)
          
          // Update turns display
          setConversationTurns([...conversationManagerRef.current.getAllTurns()])

          // Speak AI response
          setConversationState('ai-speaking')
          speakText(aiResponse, () => {
            // After AI finishes speaking, start listening again
            startListening()
          })
        } catch (error) {
          console.error('Error processing turn:', error)
          toast.error('Error processing your response. Please try again.')
          // Resume listening despite error
          startListening()
        }
      }
    }

    // Stop VAD temporarily
    if (vadRef.current) {
      vadRef.current.stop()
    }
  }

  // End conversation manually
  const endConversation = async () => {
    console.log('[Conversation] Ending conversation...')
    
    // Stop everything
    stopConversation()

    // Get conversation summary
    const summary = conversationManagerRef.current.end()
    
    console.log('[Conversation] Summary:', summary)
    toast.success('Conversation ended')

    // Analyze conversation
    setTimeout(() => {
      analyzeConversation(summary.transcript, summary.turns)
    }, 500)
  }

  // Stop all recording and monitoring
  const stopConversation = () => {
    // Stop VAD
    if (vadRef.current) {
      vadRef.current.stop()
      vadRef.current = null
    }

    // Stop media recorder
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop()
    }

    // Stop timer
    if (timerRef.current) {
      clearInterval(timerRef.current)
    }

    // Stop video stream
    if (videoRef.current) {
      videoRef.current.srcObject = null
    }

    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop())
      streamRef.current = null
    }

    // Stop speech synthesis
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel()
    }

    setConversationState('idle')
  }

  // Analyze conversation
  const analyzeConversation = (transcript: string, turns: ConversationTurn[]) => {
    console.log('[Conversation] Analyzing...', { 
      transcriptLength: transcript.length, 
      turnCount: turns.length 
    })

    // TODO: Implement real multi-turn analysis
    // For now, use mock analysis
    const analysis = generateMockConversationAnalysis()
    setAnalysisResults(analysis)
  }

  // Start new conversation
  const startNewConversation = () => {
    setConversationState('idle')
    setConversationTurns([])
    setRecordedTime(0)
    setAnalysisResults(null)
    setAudioVolume(0)
    conversationManagerRef.current.reset()
  }

  // Format time display
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  // Render conversation state indicator
  const renderStateIndicator = () => {
    switch (conversationState) {
      case 'idle':
        return null
      case 'ai-speaking':
        return (
          <div className="flex items-center gap-2 text-blue-600">
            <Volume2 className="w-5 h-5 animate-pulse" />
            <span className="text-sm font-medium">AI is speaking...</span>
          </div>
        )
      case 'listening':
        return (
          <div className="flex items-center gap-2 text-green-600">
            <Mic className={`w-5 h-5 ${audioVolume > 30 ? 'animate-pulse' : ''}`} />
            <span className="text-sm font-medium">Listening...</span>
            {audioVolume > 30 && <span className="text-xs">(Speaking detected)</span>}
          </div>
        )
      case 'processing':
        return (
          <div className="flex items-center gap-2 text-orange-600">
            <Loader2 className="w-5 h-5 animate-spin" />
            <span className="text-sm font-medium">Processing...</span>
          </div>
        )
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 p-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-4 mb-6">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => router.push('/daily-checkin')}
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">AI Mirror Conversation</h1>
            <p className="text-gray-600">Natural conversation for cognitive monitoring</p>
          </div>
        </div>

        {/* Main Content */}
        {conversationState === 'idle' && !analysisResults && (
          <Card>
            <CardHeader>
              <CardTitle>Start Your Conversation</CardTitle>
              <CardDescription>
                Have a natural back-and-forth conversation with your AI companion
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="bg-blue-50 p-4 rounded-lg space-y-2">
                <h3 className="font-semibold text-blue-900">How it works:</h3>
                <ul className="space-y-1 text-sm text-blue-800">
                  <li>• AI will greet you and start the conversation</li>
                  <li>• Speak naturally - the AI will listen and respond</li>
                  <li>• Conversation continues until you end it</li>
                  <li>• Your responses are analyzed for cognitive wellness</li>
                </ul>
              </div>

              <Button
                size="lg"
                className="w-full"
                onClick={startConversation}
                disabled={isCameraLoading}
              >
                {isCameraLoading ? (
                  <>
                    <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                    Initializing...
                  </>
                ) : (
                  <>
                    <MessageSquare className="w-5 h-5 mr-2" />
                    Start Conversation
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Active Conversation View */}
        {conversationState !== 'idle' && !analysisResults && (
          <div className="space-y-4">
            {/* Video Mirror */}
            <Card>
              <CardContent className="p-4">
                <div className="relative">
                  {isCameraLoading && (
                    <div className="absolute inset-0 flex items-center justify-center bg-gray-900 rounded-2xl">
                      <Loader2 className="w-12 h-12 text-white animate-spin" />
                      <p className="text-white ml-3">Initializing mirror...</p>
                    </div>
                  )}
                  <video
                    ref={videoRef}
                    autoPlay
                    playsInline
                    muted
                    className="w-full h-[400px] object-cover rounded-2xl border-4 border-gray-200 shadow-2xl"
                    style={{
                      transform: 'scaleX(-1)',
                      filter: 'contrast(1.05) brightness(1.02)',
                      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                      boxShadow: '0 20px 60px rgba(0,0,0,0.3), inset 0 0 20px rgba(255,255,255,0.1)',
                    }}
                  />
                  
                  {/* Timer */}
                  <div className="absolute bottom-2 right-2 bg-black/50 backdrop-blur-sm px-3 py-1 rounded-full">
                    <span className="text-white text-xs font-mono">{formatTime(recordedTime)}</span>
                  </div>

                  {/* State Indicator */}
                  <div className="absolute top-2 left-2">
                    {renderStateIndicator()}
                  </div>
                </div>

                {/* Controls */}
                <div className="mt-4 flex justify-center">
                  <Button
                    variant="destructive"
                    size="lg"
                    onClick={endConversation}
                  >
                    End Conversation
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Conversation Transcript */}
            <Card>
              <CardHeader>
                <CardTitle>Conversation</CardTitle>
                <CardDescription>{conversationTurns.length} turns</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3 max-h-[300px] overflow-y-auto">
                  {conversationTurns.map((turn, index) => (
                    <div
                      key={index}
                      className={`flex ${turn.speaker === 'user' ? 'justify-end' : 'justify-start'}`}
                    >
                      <div
                        className={`max-w-[80%] rounded-lg p-3 ${
                          turn.speaker === 'user'
                            ? 'bg-blue-500 text-white'
                            : 'bg-gray-200 text-gray-900'
                        }`}
                      >
                        <div className="flex items-center gap-2 mb-1">
                          {turn.speaker === 'user' ? (
                            <User className="w-4 h-4" />
                          ) : (
                            <Brain className="w-4 h-4" />
                          )}
                          <span className="text-xs font-semibold">
                            {turn.speaker === 'user' ? 'You' : 'AI'}
                          </span>
                        </div>
                        <p className="text-sm">{turn.text}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Analysis Results */}
        {analysisResults && (
          <Card>
            <CardHeader>
              <CardTitle>Conversation Analysis</CardTitle>
              <CardDescription>Based on {conversationTurns.length} conversation turns</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Overall Score */}
              <div className="text-center p-6 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-lg">
                <div className="text-5xl font-bold text-blue-600 mb-2">
                  {analysisResults.overallScore}
                </div>
                <div className="text-sm text-gray-600">Overall Cognitive Score</div>
                <div className={`inline-block mt-2 px-3 py-1 rounded-full text-sm font-medium ${
                  analysisResults.riskLevel === 'low' ? 'bg-green-100 text-green-800' :
                  analysisResults.riskLevel === 'moderate' ? 'bg-yellow-100 text-yellow-800' :
                  'bg-red-100 text-red-800'
                }`}>
                  {analysisResults.riskLevel === 'low' ? 'Low Risk' :
                   analysisResults.riskLevel === 'moderate' ? 'Moderate Risk' : 'High Risk'}
                </div>
              </div>

              {/* Detailed Scores */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <h3 className="font-semibold">Speech Metrics</h3>
                  <div className="space-y-1 text-sm">
                    <div className="flex justify-between">
                      <span>Word Finding:</span>
                      <span className="font-medium">{analysisResults.speech.wordFindingScore}/100</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Fluency:</span>
                      <span className="font-medium">{analysisResults.speech.fluencyScore}/100</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Articulation:</span>
                      <span className="font-medium">{analysisResults.speech.articulationScore}/100</span>
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <h3 className="font-semibold">Language Metrics</h3>
                  <div className="space-y-1 text-sm">
                    <div className="flex justify-between">
                      <span>Vocabulary:</span>
                      <span className="font-medium">{analysisResults.language.vocabularyDiversity}/100</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Sentence Complexity:</span>
                      <span className="font-medium">{analysisResults.language.sentenceComplexity}/100</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Coherence:</span>
                      <span className="font-medium">{analysisResults.language.semanticCoherence}/100</span>
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <h3 className="font-semibold">Memory Metrics</h3>
                  <div className="space-y-1 text-sm">
                    <div className="flex justify-between">
                      <span>Short-term Recall:</span>
                      <span className="font-medium">{analysisResults.memory.shortTermRecall}/100</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Temporal Orientation:</span>
                      <span className="font-medium">{analysisResults.memory.temporalOrientation}/100</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Narrative Coherence:</span>
                      <span className="font-medium">{analysisResults.memory.narrativeCoherence}/100</span>
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <h3 className="font-semibold">Cognitive Metrics</h3>
                  <div className="space-y-1 text-sm">
                    <div className="flex justify-between">
                      <span>Topic Maintenance:</span>
                      <span className="font-medium">{analysisResults.cognitive.topicMaintenance}/100</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Abstract Thinking:</span>
                      <span className="font-medium">{analysisResults.cognitive.abstractThinking}/100</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Problem Solving:</span>
                      <span className="font-medium">{analysisResults.cognitive.problemSolving}/100</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Indicators */}
              {analysisResults.indicators.length > 0 && (
                <div>
                  <h3 className="font-semibold mb-2">Observations</h3>
                  <ul className="space-y-1">
                    {analysisResults.indicators.map((indicator, index) => (
                      <li key={index} className="text-sm text-gray-700 flex items-start gap-2">
                        <span className="text-blue-500">•</span>
                        <span>{indicator}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Recommendations */}
              {analysisResults.recommendations.length > 0 && (
                <div>
                  <h3 className="font-semibold mb-2">Recommendations</h3>
                  <ul className="space-y-1">
                    {analysisResults.recommendations.map((rec, index) => (
                      <li key={index} className="text-sm text-gray-700 flex items-start gap-2">
                        <span className="text-green-500">✓</span>
                        <span>{rec}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={startNewConversation}
                >
                  <MessageSquare className="w-4 h-4 mr-2" />
                  New Conversation
                </Button>
                <Button
                  variant="outline"
                  onClick={() => router.push('/dashboard')}
                >
                  View Dashboard
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}

