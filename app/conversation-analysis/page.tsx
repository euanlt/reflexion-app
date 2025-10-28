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

type AssessmentStep = 'instructions' | 'conversation' | 'review' | 'analysis'

const conversationTypes = [
  {
    id: 'memory-recall',
    title: 'Memory Recall',
    description: 'Discuss recent activities and experiences',
    duration: 180, // 3 minutes
    icon: '🧠',
    prompt: 'Tell me about what you did yesterday. What did you have for breakfast? Did you meet anyone?',
    instructions: [
      'Think about your activities from yesterday',
      'Speak naturally and take your time',
      'Include as many details as you can remember',
      'Mention specific times, places, and people',
    ]
  },
  {
    id: 'current-events',
    title: 'Current Events',
    description: 'Talk about recent news or happenings',
    duration: 180,
    icon: '📰',
    prompt: 'What\'s something interesting in the news lately? What do you think about it?',
    instructions: [
      'Think about news you\'ve heard recently',
      'Share your thoughts and opinions',
      'Explain why it interests you',
      'Feel free to discuss any topic',
    ]
  },
  {
    id: 'problem-solving',
    title: 'Problem Solving',
    description: 'Plan and organize a scenario',
    duration: 240, // 4 minutes
    icon: '🎯',
    prompt: 'If you were planning a family gathering, how would you organize it? Walk me through your plan.',
    instructions: [
      'Think through the steps needed',
      'Explain your reasoning',
      'Consider different aspects (food, guests, activities)',
      'Talk through any challenges you might face',
    ]
  },
  {
    id: 'storytelling',
    title: 'Storytelling',
    description: 'Share a memory from your past',
    duration: 300, // 5 minutes
    icon: '📖',
    prompt: 'Tell me about a favorite memory from your childhood. What made it special?',
    instructions: [
      'Choose a memory that stands out to you',
      'Describe the setting and people involved',
      'Share how you felt during that time',
      'Include as many details as you remember',
    ]
  },
]

export default function ConversationAnalysisPage() {
  const router = useRouter()
  const [currentStep, setCurrentStep] = useState<AssessmentStep>('instructions')
  const [selectedType, setSelectedType] = useState(conversationTypes[0])
  const [isRecording, setIsRecording] = useState(false)
  const [isPaused, setIsPaused] = useState(false)
  const [recordedTime, setRecordedTime] = useState(0)
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null)
  const [videoBlob, setVideoBlob] = useState<Blob | null>(null)
  const [transcript, setTranscript] = useState('')
  const [analysisResults, setAnalysisResults] = useState<ConversationAssessment['analysisResults'] | null>(null)
  const [isAnalyzing, setIsAnalyzing] = useState(false)

  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const audioChunksRef = useRef<Blob[]>([])
  const videoChunksRef = useRef<Blob[]>([])
  const timerRef = useRef<NodeJS.Timeout | null>(null)
  const videoRef = useRef<HTMLVideoElement | null>(null)
  const streamRef = useRef<MediaStream | null>(null)

  const startRecording = async () => {
    try {
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

      // Display video preview
      if (videoRef.current) {
        videoRef.current.srcObject = stream
        videoRef.current.play()
      }

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
        setRecordedTime(prev => prev + 1)
      }, 1000)

      // Auto-stop after duration
      setTimeout(() => {
        if (mediaRecorderRef.current?.state === 'recording') {
          stopRecording()
        }
      }, selectedType.duration * 1000)

      toast.success('Recording started')
    } catch (error) {
      console.error('Error starting recording:', error)
      toast.error('Failed to start recording. Please check permissions.')
    }
  }

  const stopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop()
      setIsRecording(false)

      if (timerRef.current) {
        clearInterval(timerRef.current)
      }

      // Simulate generating transcript (in real implementation, this would call speech-to-text API)
      setTimeout(() => {
        setTranscript(`[Mock transcript of your ${selectedType.title} conversation would appear here. In production, this will use Huawei Cloud Speech Recognition Service to transcribe the audio in real-time.]`)
        setCurrentStep('review')
      }, 1000)

      toast.success('Recording completed')
    }
  }

  const handleAnalyze = async () => {
    setIsAnalyzing(true)
    
    // Simulate AI analysis delay
    await new Promise(resolve => setTimeout(resolve, 3000))
    
    // Generate mock analysis results
    const results = generateMockConversationAnalysis()
    setAnalysisResults(results)
    setIsAnalyzing(false)
    setCurrentStep('analysis')
    
    toast.success('Analysis complete')
  }

  const startNewConversation = () => {
    setAudioBlob(null)
    setVideoBlob(null)
    setTranscript('')
    setAnalysisResults(null)
    setRecordedTime(0)
    setCurrentStep('instructions')
  }

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

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

      {currentStep === 'instructions' && (
        <Card>
          <CardHeader>
            <CardTitle>Select Conversation Type</CardTitle>
            <CardDescription>
              Choose a conversation topic for cognitive assessment
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue={selectedType.id} onValueChange={(value) => {
              const type = conversationTypes.find(t => t.id === value)
              if (type) setSelectedType(type)
            }}>
              <TabsList className="grid w-full grid-cols-2 lg:grid-cols-4">
                {conversationTypes.map(type => (
                  <TabsTrigger key={type.id} value={type.id}>
                    <span className="mr-1">{type.icon}</span>
                    <span className="hidden sm:inline">{type.title}</span>
                  </TabsTrigger>
                ))}
              </TabsList>
              {conversationTypes.map(type => (
                <TabsContent key={type.id} value={type.id} className="space-y-4 mt-4">
                  <div>
                    <h3 className="font-semibold mb-2 flex items-center gap-2">
                      <span className="text-2xl">{type.icon}</span>
                      {type.title}
                    </h3>
                    <p className="text-sm text-muted-foreground mb-4">{type.description}</p>
                    
                    <div className="bg-muted p-4 rounded-lg mb-4">
                      <h4 className="font-medium mb-2">Conversation Prompt:</h4>
                      <p className="text-sm italic">"{type.prompt}"</p>
                    </div>

                    <div className="bg-muted/50 p-4 rounded-lg">
                      <h4 className="font-medium mb-2">Tips:</h4>
                      <ul className="list-disc list-inside space-y-1">
                        {type.instructions.map((instruction, index) => (
                          <li key={index} className="text-sm">{instruction}</li>
                        ))}
                      </ul>
                    </div>

                    <p className="text-sm text-muted-foreground mt-4">
                      Duration: up to {Math.floor(type.duration / 60)} minutes
                    </p>
                  </div>
                  
                  <Button 
                    onClick={startRecording}
                    size="lg"
                    className="w-full"
                  >
                    <Mic className="mr-2 h-5 w-5" />
                    Start Conversation
                  </Button>
                </TabsContent>
              ))}
            </Tabs>
          </CardContent>
        </Card>
      )}

      {currentStep === 'conversation' && (
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Video className="h-5 w-5 text-red-500 animate-pulse" />
                Recording: {selectedType.title}
              </CardTitle>
              <CardDescription>Speak naturally and take your time</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Video Preview */}
              <div className="relative bg-black rounded-lg overflow-hidden aspect-video">
                <video
                  ref={videoRef}
                  autoPlay
                  muted
                  playsInline
                  className="w-full h-full object-cover"
                />
                <div className="absolute top-4 left-4 bg-red-600 text-white px-3 py-1 rounded-full flex items-center gap-2 text-sm font-medium">
                  <span className="w-2 h-2 bg-white rounded-full animate-pulse"></span>
                  REC
                </div>
                <div className="absolute top-4 right-4 bg-black/50 text-white px-3 py-1 rounded-lg text-sm font-medium">
                  {formatTime(recordedTime)} / {formatTime(selectedType.duration)}
                </div>
              </div>
              
              <div className="bg-muted p-4 rounded-lg">
                <p className="text-sm font-medium mb-2 text-center">Remember the prompt:</p>
                <p className="text-sm italic text-center">"{selectedType.prompt}"</p>
              </div>
              
              <div className="flex gap-2 justify-center">
                <Button
                  onClick={stopRecording}
                  variant="destructive"
                  size="lg"
                  className="min-w-[200px]"
                >
                  <Pause className="mr-2 h-5 w-5" />
                  Stop Recording
                </Button>
              </div>
              
              <div className="text-center text-sm text-muted-foreground">
                🎤 Audio and video are being recorded for analysis
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {currentStep === 'review' && (
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Review Your Conversation</CardTitle>
              <CardDescription>
                Review the recording and transcript before analysis
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="bg-muted p-4 rounded-lg">
                <p className="text-sm font-medium mb-2">Recording Details:</p>
                <ul className="text-sm space-y-1">
                  <li>Type: {selectedType.title}</li>
                  <li>Duration: {formatTime(recordedTime)}</li>
                  <li>Audio: {audioBlob ? 'Recorded' : 'Not available'}</li>
                  <li>Video: {videoBlob ? 'Recorded' : 'Not available'}</li>
                </ul>
              </div>

              <div className="bg-muted/50 p-4 rounded-lg">
                <h4 className="font-medium mb-2">Transcript Preview:</h4>
                <p className="text-sm">{transcript}</p>
              </div>
              
              <div className="flex gap-2 justify-center">
                <Button
                  variant="outline"
                  onClick={startNewConversation}
                >
                  Record Again
                </Button>
                <Button
                  onClick={handleAnalyze}
                  disabled={isAnalyzing}
                  className="min-w-[120px]"
                >
                  {isAnalyzing ? (
                    <>
                      <Brain className="mr-2 h-4 w-4 animate-pulse" />
                      Analyzing...
                    </>
                  ) : (
                    <>
                      <Brain className="mr-2 h-4 w-4" />
                      Analyze Conversation
                    </>
                  )}
                </Button>
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
              
              <div className="flex gap-2 justify-center pt-4 border-t">
                <Button
                  variant="outline"
                  onClick={startNewConversation}
                >
                  New Conversation
                </Button>
                <Button
                  onClick={() => router.push('/')}
                >
                  Back to Dashboard
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}

