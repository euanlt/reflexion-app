import { NextResponse } from 'next/server';
import { getIAMToken, getIAMConfig } from '@/lib/services/huawei-iam.service';

/**
 * Debug endpoint to test TTS with detailed logging
 */
export async function GET() {
  try {
    // Get config
    const iamConfig = getIAMConfig();
    const projectId = process.env.HUAWEI_SIS_PROJECT_ID;
    const region = process.env.HUAWEI_SIS_REGION;

    console.log('TTS Config:', {
      projectId: projectId ? `${projectId.substring(0, 8)}...` : 'MISSING',
      region,
    });

    // Get token
    const token = await getIAMToken(iamConfig);
    console.log('Token obtained:', token.substring(0, 20) + '...');

    // Prepare TTS request
    const endpoint = `https://sis-ext.${region}.myhuaweicloud.com`;
    const url = `${endpoint}/v1/${projectId}/tts`;

    console.log('TTS Endpoint:', url);

    // Try different request formats to find what works
    const requestFormats = [
      {
        name: 'Format 1: Standard',
        body: {
          text: 'Hello, this is a test.',
          config: {
            audio_format: 'wav',
            sample_rate: '16000',
            property: 'english_emily_common',
            speed: 0,
            pitch: 0,
            volume: 0,
          },
        },
      },
      {
        name: 'Format 2: Simple',
        body: {
          text: 'Hello, this is a test.',
          audio_format: 'wav',
          property: 'english_emily_common',
        },
      },
      {
        name: 'Format 3: With voice_name',
        body: {
          text: 'Hello, this is a test.',
          config: {
            audio_format: 'wav',
            voice_name: 'Emily',
            sample_rate: '16000',
          },
        },
      },
    ];

    const results: any[] = [];

    for (const format of requestFormats) {
      try {
        console.log(`Testing ${format.name}...`);
        console.log('Request body:', JSON.stringify(format.body, null, 2));

        const response = await fetch(url, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-Auth-Token': token,
          },
          body: JSON.stringify(format.body),
        });

        const responseText = await response.text();
        console.log(`${format.name} Response:`, response.status, responseText.substring(0, 200));

        results.push({
          format: format.name,
          status: response.status,
          statusText: response.statusText,
          success: response.ok,
          responsePreview: responseText.substring(0, 300),
        });

        // If successful, stop testing
        if (response.ok) {
          return NextResponse.json({
            success: true,
            message: `${format.name} worked!`,
            workingFormat: format.body,
            results,
          });
        }
      } catch (error) {
        results.push({
          format: format.name,
          error: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    }

    return NextResponse.json({
      success: false,
      message: 'None of the formats worked',
      endpoint: url,
      results,
      recommendation: 'Check Huawei TTS API documentation for correct format',
    });
  } catch (error) {
    console.error('TTS Debug error:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    }, { status: 500 });
  }
}

