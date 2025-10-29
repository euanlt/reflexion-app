import { NextRequest, NextResponse } from 'next/server';
import { transcribeAudio } from '@/lib/services/huawei-speech.service';

export async function POST(request: NextRequest) {
  try {
    console.log('[Transcribe API] Received transcription request');
    
    const formData = await request.formData();
    const audioFile = formData.get('audio') as File;

    if (!audioFile) {
      console.error('[Transcribe API] No audio file in request');
      return NextResponse.json(
        { error: 'No audio file provided' },
        { status: 400 }
      );
    }

    console.log('[Transcribe API] Audio file:', {
      type: audioFile.type,
      size: audioFile.size,
      name: audioFile.name,
    });

    // Convert File to Blob
    const audioBlob = new Blob([await audioFile.arrayBuffer()], {
      type: audioFile.type,
    });

    console.log('[Transcribe API] Calling Huawei SIS...');
    
    // Transcribe using Huawei SIS (server-side with env variables)
    const result = await transcribeAudio(audioBlob);

    console.log('[Transcribe API] ✓ Success:', result.transcript);

    return NextResponse.json({
      success: true,
      transcript: result.transcript,
      confidence: result.confidence,
      wordCount: result.wordCount,
      duration: result.duration,
    });
  } catch (error) {
    console.error('[Transcribe API] ✗ Error:', error);
    console.error('[Transcribe API] Error details:', {
      message: error instanceof Error ? error.message : 'Unknown',
      stack: error instanceof Error ? error.stack : undefined,
    });
    
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to transcribe audio',
      },
      { status: 500 }
    );
  }
}

