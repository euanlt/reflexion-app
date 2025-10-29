import { NextResponse } from 'next/server';
import { transcribeAudio } from '@/lib/services/huawei-speech.service';

/**
 * Test endpoint for Huawei SIS (Speech-to-Text)
 * Visit: http://localhost:3000/api/test-sis
 */
export async function GET() {
  try {
    console.log('=== Testing Huawei SIS ===');
    
    // Check environment variables
    const projectId = process.env.HUAWEI_SIS_PROJECT_ID;
    const region = process.env.HUAWEI_SIS_REGION;
    
    console.log('Environment check:', {
      hasProjectId: !!projectId,
      projectId: projectId ? `${projectId.substring(0, 4)}...` : 'NOT SET',
      region: region || 'NOT SET',
    });

    if (!projectId) {
      return NextResponse.json({
        success: false,
        error: 'HUAWEI_SIS_PROJECT_ID not set',
        details: {
          projectId: 'MISSING',
          region: region || 'NOT SET',
        },
        instructions: [
          '1. Add HUAWEI_SIS_PROJECT_ID to .env.local',
          '2. Restart the dev server (Ctrl+C, then npm run dev)',
          '3. Try again',
        ],
      }, { status: 500 });
    }

    // Use a minimal WAV file (same format as Postman example)
    // This is a very short silent WAV file (8kHz, 16-bit, mono)
    const silentWavBase64 = 'UklGRiQAAABXQVZFZm10IBAAAAABAAEAQB8AAIA+AAACABAAZGF0YQAAAAA=';
    
    // Convert base64 to blob
    const binaryString = atob(silentWavBase64);
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }
    const testAudioBlob = new Blob([bytes], { type: 'audio/wav' });
    
    console.log('Test audio blob created (WAV):', testAudioBlob.size, 'bytes');

    // Try to transcribe
    console.log('Attempting transcription...');
    const result = await transcribeAudio(testAudioBlob);
    
    console.log('Transcription successful!');
    
    return NextResponse.json({
      success: true,
      message: 'SIS transcription test passed!',
      result: {
        transcript: result.transcript || '(empty/silent audio)',
        confidence: result.confidence,
        wordCount: result.wordCount,
      },
      config: {
        projectId: projectId ? `${projectId.substring(0, 8)}...` : 'NOT SET',
        region,
        endpoint: `https://sis-ext.${region}.myhuaweicloud.com`,
      },
      nextSteps: [
        '✓ SIS is working correctly',
        '✓ Environment variables are loaded',
        '✓ You can now test the conversation analysis',
      ],
    });
  } catch (error) {
    console.error('❌ SIS test failed:', error);
    
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
      troubleshooting: {
        commonIssues: [
          'Environment variables not loaded - restart dev server',
          'IAM credentials incorrect - check username/password',
          'SIS not available in your region',
          'Project ID incorrect',
        ],
        debugSteps: [
          '1. Check /api/test-env to see if variables are loaded',
          '2. Check /api/test-token to verify IAM authentication',
          '3. Restart dev server: Ctrl+C, then npm run dev',
          '4. Try again',
        ],
      },
    }, { status: 500 });
  }
}

