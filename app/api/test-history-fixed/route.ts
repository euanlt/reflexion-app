import { NextResponse } from 'next/server';
import { getIAMToken, getIAMConfig } from '@/lib/services/huawei-iam.service';

/**
 * Test history parameter with CORRECT max_tokens
 */
export async function GET() {
  try {
    console.log('=== Testing History Parameter (Fixed) ===');
    
    const endpoint = process.env.HUAWEI_MODELARTS_CONVERSATION_ENDPOINT;
    
    if (!endpoint) {
      return NextResponse.json({
        success: false,
        error: 'HUAWEI_MODELARTS_CONVERSATION_ENDPOINT not set',
      }, { status: 500 });
    }
    
    const iamConfig = getIAMConfig();
    const token = await getIAMToken(iamConfig);
    
    // Test 1: With history parameter AND sufficient max_tokens
    console.log('\n--- Test 1: History with max_tokens: 400 ---');
    
    const requestBody = {
      prompt: 'What did I just tell you about?',
      history: [
        ['My name is Sarah and I love gardening.', 'Nice to meet you, Sarah! Gardening sounds wonderful.']
      ],
      temperature: 0.7,
      max_tokens: 400,  // HIGH ENOUGH for input + output
      top_p: 0.9,
    };
    
    console.log('[Test 1] Request:', JSON.stringify(requestBody, null, 2));
    
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Auth-Token': token,
      },
      body: JSON.stringify(requestBody),
    });
    
    const data = await response.json();
    console.log('[Test 1] Status:', response.status);
    console.log('[Test 1] Response:', JSON.stringify(data, null, 2));
    
    const aiText = data.choices?.[0]?.text || '';
    const mentionsSarah = aiText.toLowerCase().includes('sarah');
    const mentionsGardening = aiText.toLowerCase().includes('garden');
    
    return NextResponse.json({
      success: response.ok,
      status: response.status,
      request: requestBody,
      response: data,
      aiText,
      analysis: {
        mentionsSarah,
        mentionsGardening,
        usedHistory: mentionsSarah || mentionsGardening,
      },
      conclusion: (mentionsSarah || mentionsGardening)
        ? '✅ SUCCESS! History parameter WORKS with sufficient max_tokens!'
        : '❌ History parameter may not be working correctly',
    });
  } catch (error) {
    console.error('Test failed:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
    }, { status: 500 });
  }
}

