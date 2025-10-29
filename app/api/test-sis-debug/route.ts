import { NextResponse } from 'next/server';
import { getIAMToken, getIAMConfig } from '@/lib/services/huawei-iam.service';
import { getSISConfig } from '@/lib/services/huawei-speech.service';

/**
 * Debug endpoint to test SIS with different configurations
 * Visit: http://localhost:3000/api/test-sis-debug
 */
export async function GET() {
  try {
    console.log('=== SIS Debug Test ===');
    
    const sisConfig = getSISConfig();
    const iamConfig = getIAMConfig();
    
    if (!sisConfig.projectId) {
      return NextResponse.json({
        success: false,
        error: 'HUAWEI_SIS_PROJECT_ID not set'
      }, { status: 500 });
    }
    
    // Get auth token
    const token = await getIAMToken(iamConfig);
    const endpoint = sisConfig.endpoint || `https://sis-ext.${sisConfig.region}.myhuaweicloud.com`;
    const url = `${endpoint}/v1/${sisConfig.projectId}/asr/short-audio`;
    
    // Silent WAV audio (8kHz, 16-bit, mono) - same as Postman
    const silentWavBase64 = 'UklGRiQAAABXQVZFZm10IBAAAAABAAEAQB8AAIA+AAACABAAZGF0YQAAAAA=';
    
    console.log('[SIS Debug] Testing configurations...');
    console.log('[SIS Debug] URL:', url);
    console.log('[SIS Debug] Project ID:', sisConfig.projectId);
    console.log('[SIS Debug] Region:', sisConfig.region);
    console.log('[SIS Debug] Audio data length:', silentWavBase64.length);
    
    const results: any[] = [];
    
    // Test 1: Exact Postman format
    console.log('\n--- Test 1: Exact Postman Format ---');
    const postmanFormat = {
      config: {
        audio_format: 'wav',
        property: 'english_8k_common',
        add_punc: 'yes',
      },
      data: silentWavBase64,
    };
    
    try {
      const response1 = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Auth-Token': token,
        },
        body: JSON.stringify(postmanFormat),
      });
      
      const responseText1 = await response1.text();
      console.log('[Test 1] Status:', response1.status);
      console.log('[Test 1] Response:', responseText1);
      
      results.push({
        test: 'Postman Format (wav + english_8k_common)',
        config: postmanFormat.config,
        status: response1.status,
        success: response1.ok,
        response: responseText1.substring(0, 200),
      });
    } catch (error) {
      results.push({
        test: 'Postman Format',
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
    
    // Test 2: Auto format with 16k
    console.log('\n--- Test 2: Auto Format (16k) ---');
    const autoFormat = {
      config: {
        audio_format: 'auto',
        property: 'english_16k_common',
        add_punc: 'yes',
      },
      data: silentWavBase64,
    };
    
    try {
      const response2 = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Auth-Token': token,
        },
        body: JSON.stringify(autoFormat),
      });
      
      const responseText2 = await response2.text();
      console.log('[Test 2] Status:', response2.status);
      console.log('[Test 2] Response:', responseText2);
      
      results.push({
        test: 'Auto Format (auto + english_16k_common)',
        config: autoFormat.config,
        status: response2.status,
        success: response2.ok,
        response: responseText2.substring(0, 200),
      });
    } catch (error) {
      results.push({
        test: 'Auto Format',
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
    
    // Test 3: WAV format with 16k
    console.log('\n--- Test 3: WAV + 16k ---');
    const wavFormat16k = {
      config: {
        audio_format: 'wav',
        property: 'english_16k_common',
        add_punc: 'yes',
      },
      data: silentWavBase64,
    };
    
    try {
      const response3 = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Auth-Token': token,
        },
        body: JSON.stringify(wavFormat16k),
      });
      
      const responseText3 = await response3.text();
      console.log('[Test 3] Status:', response3.status);
      console.log('[Test 3] Response:', responseText3);
      
      results.push({
        test: 'WAV + 16k (wav + english_16k_common)',
        config: wavFormat16k.config,
        status: response3.status,
        success: response3.ok,
        response: responseText3.substring(0, 200),
      });
    } catch (error) {
      results.push({
        test: 'WAV + 16k',
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
    
    // Summary
    const successfulTests = results.filter(r => r.success);
    
    return NextResponse.json({
      success: successfulTests.length > 0,
      message: `${successfulTests.length}/${results.length} configurations worked`,
      results,
      recommendation: successfulTests.length > 0 
        ? `Use: ${successfulTests[0].test}`
        : 'None of the configurations worked. Check error messages.',
      config: {
        url,
        projectId: sisConfig.projectId.substring(0, 8) + '...',
        region: sisConfig.region,
      },
    });
  } catch (error) {
    console.error('❌ SIS debug test failed:', error);
    
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
    }, { status: 500 });
  }
}

