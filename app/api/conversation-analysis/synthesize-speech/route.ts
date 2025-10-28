import { NextRequest, NextResponse } from 'next/server';
import { synthesizeSpeech } from '@/lib/services/huawei-tts.service';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { text, speed, pitch, volume } = body;

    if (!text) {
      return NextResponse.json(
        { error: 'No text provided' },
        { status: 400 }
      );
    }

    // Synthesize speech using Huawei TTS
    const result = await synthesizeSpeech(text, {
      speed,
      pitch,
      volume,
    });

    return NextResponse.json({
      success: true,
      audioData: result.audioData,
      format: result.format,
      duration: result.duration,
    });
  } catch (error) {
    console.error('Speech synthesis API error:', error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Failed to synthesize speech',
      },
      { status: 500 }
    );
  }
}

