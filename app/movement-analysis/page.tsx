'use client'

import React, { useState } from 'react'
import { VideoRecorder } from '@/components/video/VideoRecorder'
import { VideoPlayer } from '@/components/video/VideoPlayer'
import { VideoAnalysisResults, generateMockAnalysis } from '@/components/video/VideoAnalysisResults'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ArrowLeft, Activity, FileVideo, Brain } from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { movementStorageService } from '@/lib/services/movement-storage.service'
import { toast } from 'sonner'

type AssessmentStep = 'instructions' | 'recording' | 'review' | 'analysis'
type CloudSyncStatus = 'idle' | 'saving' | 'saved' | 'error'

const movementTasks = [
  {
    id: 'finger-tap',
    title: 'Finger Tapping',
    description: 'Tap your thumb and index finger together repeatedly',
    duration: 15,
    instructions: [
      'Sit comfortably with your hand visible to the camera',
      'Tap your thumb and index finger together as quickly as you can',
      'Try to maintain a steady rhythm',
      'Continue for the full duration'
    ]
  },
  {
    id: 'hand-movement',
    title: 'Hand Opening and Closing',
    description: 'Open and close your hands repeatedly',
    duration: 15,
    instructions: [
      'Hold both hands in front of the camera',
      'Open your hands wide, spreading all fingers',
      'Close your hands into fists',
      'Repeat this motion smoothly and continuously'
    ]
  },
  {
    id: 'arm-raise',
    title: 'Arm Raising',
    description: 'Raise your arms above your head',
    duration: 20,
    instructions: [
      'Stand or sit with your full upper body visible',
      'Start with arms at your sides',
      'Slowly raise both arms above your head',
      'Lower them back down and repeat'
    ]
  }
]

export default function MovementAnalysisPage() {
  const router = useRouter()
  const [currentStep, setCurrentStep] = useState<AssessmentStep>('instructions')
  const [selectedTask, setSelectedTask] = useState(movementTasks[0])
  const [recordedVideo, setRecordedVideo] = useState<Blob | null>(null)
  const [analysisResults, setAnalysisResults] = useState<ReturnType<typeof generateMockAnalysis> | null>(null)
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [cloudSyncStatus, setCloudSyncStatus] = useState<CloudSyncStatus>('idle')
  const [savedAnalysisId, setSavedAnalysisId] = useState<number | null>(null)

  const handleRecordingComplete = (videoBlob: Blob) => {
    setRecordedVideo(videoBlob)
    setCurrentStep('review')
  }

  const handleAnalyze = async () => {
    setIsAnalyzing(true)
    
    // Simulate AI analysis delay
    await new Promise(resolve => setTimeout(resolve, 3000))
    
    // Generate mock analysis results
    const results = generateMockAnalysis()
    setAnalysisResults(results)
    setIsAnalyzing(false)
    setCurrentStep('analysis')
  }

  const handleSaveToCloud = async () => {
    if (!recordedVideo || !analysisResults) {
      toast.error('No video or analysis results to save')
      return
    }

    setCloudSyncStatus('saving')
    toast.info('Saving to Huawei Cloud...')

    try {
      const result = await movementStorageService.saveMovementAnalysis({
        videoBlob: recordedVideo,
        analysisResults,
        taskType: selectedTask.id as any,
        videoDuration: selectedTask.duration,
        userId: 'user-' + Math.random().toString(36).substr(2, 9), // In production, use actual user ID
      })

      setSavedAnalysisId(result.localId)
      setCloudSyncStatus('saved')
      toast.success('Successfully saved to cloud!')
    } catch (error) {
      console.error('Error saving to cloud:', error)
      setCloudSyncStatus('error')
      toast.error(error instanceof Error ? error.message : 'Failed to save to cloud')
    }
  }

  const startNewRecording = () => {
    setRecordedVideo(null)
    setAnalysisResults(null)
    setCurrentStep('instructions')
    setCloudSyncStatus('idle')
    setSavedAnalysisId(null)
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
          <Activity className="h-8 w-8" />
          Movement Analysis
        </h1>
        <p className="text-muted-foreground mt-2">
          Record yourself performing simple movements for cognitive health assessment
        </p>
      </div>

      {currentStep === 'instructions' && (
        <Card>
          <CardHeader>
            <CardTitle>Select Movement Task</CardTitle>
            <CardDescription>
              Choose a movement assessment to begin
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue={selectedTask.id} onValueChange={(value) => {
              const task = movementTasks.find(t => t.id === value)
              if (task) setSelectedTask(task)
            }}>
              <TabsList className="grid w-full grid-cols-3">
                {movementTasks.map(task => (
                  <TabsTrigger key={task.id} value={task.id}>
                    {task.title}
                  </TabsTrigger>
                ))}
              </TabsList>
              {movementTasks.map(task => (
                <TabsContent key={task.id} value={task.id} className="space-y-4">
                  <div>
                    <h3 className="font-semibold mb-2">{task.title}</h3>
                    <p className="text-sm text-muted-foreground mb-4">{task.description}</p>
                    <div className="bg-muted p-4 rounded-lg">
                      <h4 className="font-medium mb-2">Instructions:</h4>
                      <ol className="list-decimal list-inside space-y-1">
                        {task.instructions.map((instruction, index) => (
                          <li key={index} className="text-sm">{instruction}</li>
                        ))}
                      </ol>
                    </div>
                    <p className="text-sm text-muted-foreground mt-4">
                      Duration: {task.duration} seconds
                    </p>
                  </div>
                  <Button 
                    onClick={() => setCurrentStep('recording')}
                    size="lg"
                    className="w-full"
                  >
                    Start Recording
                  </Button>
                </TabsContent>
              ))}
            </Tabs>
          </CardContent>
        </Card>
      )}

      {currentStep === 'recording' && (
        <div className="space-y-4">
          <Card className="mb-4">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileVideo className="h-5 w-5" />
                Recording: {selectedTask.title}
              </CardTitle>
              <CardDescription>{selectedTask.description}</CardDescription>
            </CardHeader>
          </Card>
          
          <VideoRecorder
            onRecordingComplete={handleRecordingComplete}
            maxDuration={selectedTask.duration}
            instructions={`Position yourself in the frame and press record to begin the ${selectedTask.title} task`}
            taskType="movement"
          />
        </div>
      )}

      {currentStep === 'review' && recordedVideo && (
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Review Your Recording</CardTitle>
              <CardDescription>
                Check your recording before analysis
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <VideoPlayer
                videoBlob={recordedVideo}
                onAnalyze={handleAnalyze}
                autoPlay
              />
              
              <div className="flex gap-2 justify-center">
                <Button
                  variant="outline"
                  onClick={() => setCurrentStep('recording')}
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
                      Analyze Video
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {currentStep === 'analysis' && analysisResults && recordedVideo && (
        <div className="space-y-6">
          <VideoAnalysisResults 
            results={analysisResults}
            cloudSyncStatus={cloudSyncStatus}
            onSaveToCloud={handleSaveToCloud}
          />
          
          <Card>
            <CardHeader>
              <CardTitle>Your Recording</CardTitle>
            </CardHeader>
            <CardContent>
              <VideoPlayer
                videoBlob={recordedVideo}
                showControls={true}
              />
            </CardContent>
          </Card>
          
          <div className="flex gap-2 justify-center">
            <Button
              variant="outline"
              onClick={startNewRecording}
            >
              New Recording
            </Button>
            <Button
              onClick={() => router.push('/')}
            >
              Back to Dashboard
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}