import { NextResponse } from 'next/server';
import { synthesizeSpeech } from '@/lib/services/huawei-tts.service';

/**
 * Test endpoint to verify Huawei TTS works
 * Visit: http://localhost:3000/api/test-tts
 */
export async function GET() {
  try {
    console.log('=== Testing Huawei TTS ===');
    
    const testText = 'Hello, this is a test of Huawei Text to Speech service.';
    console.log('Test text:', testText);
    
    const startTime = Date.now();
    const result = await synthesizeSpeech(testText);
    const duration = Date.now() - startTime;
    
    console.log(`✓ TTS synthesis successful in ${duration}ms`);
    console.log(`Audio data length: ${result.audioData.length} characters (base64)`);
    console.log(`Format: ${result.format}`);
    
    return NextResponse.json({
      success: true,
      message: 'TTS synthesis successful! ✓',
      result: {
        hasAudioData: !!result.audioData,
        audioDataLength: result.audioData.length,
        format: result.format,
        duration: result.duration,
        synthesisTime: `${duration}ms`,
        audioPreview: `${result.audioData.substring(0, 50)}...`,
      },
      testText,
      nextSteps: [
        'TTS is working! ✓',
        'Audio data is base64 encoded',
        'Use this in the browser to play audio',
      ]
    });
  } catch (error) {
    console.error('❌ TTS test failed:', error);
    
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    const is401 = errorMessage.includes('401');
    
    return NextResponse.json({
      success: false,
      error: errorMessage,
      errorType: is401 ? 'AUTHENTICATION_FAILED' : 'TTS_SERVICE_ERROR',
      possibleCauses: is401 ? [
        'IAM token generation failed',
        'Token expired (should be cached for 24h)',
        'SIS service not enabled',
      ] : [
        'Incorrect SIS project ID',
        'Incorrect region',
        'SIS service quota exceeded',
        'Network connectivity issues',
      ],
      troubleshooting: {
        step1: 'Run /api/test-token first to verify token works',
        step2: 'Verify SIS is enabled in Huawei Cloud Console',
        step3: 'Check HUAWEI_SIS_PROJECT_ID matches your SIS project',
        step4: 'Check HUAWEI_SIS_REGION is correct (e.g., ap-southeast-1)',
      }
    }, { status: 500 });
  }
}

