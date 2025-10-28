import { NextRequest, NextResponse } from 'next/server';
import { transcribeAudio } from '@/lib/services/huawei-speech.service';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const audioFile = formData.get('audio') as File;

    if (!audioFile) {
      return NextResponse.json(
        { error: 'No audio file provided' },
        { status: 400 }
      );
    }

    // Convert File to Blob
    const audioBlob = new Blob([await audioFile.arrayBuffer()], {
      type: audioFile.type,
    });

    // Transcribe using Huawei SIS
    const result = await transcribeAudio(audioBlob);

    return NextResponse.json({
      success: true,
      transcript: result.transcript,
      confidence: result.confidence,
      wordCount: result.wordCount,
      duration: result.duration,
    });
  } catch (error) {
    console.error('Transcription API error:', error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Failed to transcribe audio',
      },
      { status: 500 }
    );
  }
}

