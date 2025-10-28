import { NextRequest, NextResponse } from 'next/server';
import { synthesizeSpeech } from '@/lib/services/huawei-tts.service';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { text } = body;

    if (!text) {
      return NextResponse.json(
        { error: 'No text provided' },
        { status: 400 }
      );
    }

    console.log('[TTS API] Starting speech synthesis...');
    console.log('[TTS API] Text length:', text.length);
    console.log('[TTS API] Region:', process.env.HUAWEI_SIS_REGION);
    console.log('[TTS API] Project ID:', process.env.HUAWEI_SIS_PROJECT_ID?.substring(0, 8) + '...');

    // Synthesize speech using Huawei TTS
    const result = await synthesizeSpeech(text);

    console.log('[TTS API] Synthesis successful, audio data length:', result.audioData?.length || 0);

    return NextResponse.json({
      success: true,
      audioData: result.audioData,
      format: result.format,
      duration: result.duration,
    });
  } catch (error) {
    console.error('[TTS API] Speech synthesis error:', error);
    console.error('[TTS API] Error details:', {
      message: error instanceof Error ? error.message : 'Unknown',
      stack: error instanceof Error ? error.stack : undefined,
    });
    
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to synthesize speech',
      },
      { status: 500 }
    );
  }
}

