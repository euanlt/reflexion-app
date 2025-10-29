import { NextResponse } from 'next/server';
import { getIAMToken, getIAMConfig } from '@/lib/services/huawei-iam.service';

/**
 * Test ModelArts with the CORRECT format from Usage Guides
 * Visit: http://localhost:3000/api/test-modelarts-correct
 */
export async function GET() {
  try {
    console.log('=== Testing ModelArts with Correct Format ===');
    
    const endpoint = process.env.HUAWEI_MODELARTS_CONVERSATION_ENDPOINT;
    
    if (!endpoint) {
      return NextResponse.json({
        success: false,
        error: 'HUAWEI_MODELARTS_CONVERSATION_ENDPOINT not set',
      }, { status: 500 });
    }
    
    console.log('[ModelArts Test] Endpoint from env:', endpoint);
    console.log('[ModelArts Test] Full endpoint URL:', endpoint);
    
    // Get IAM token
    const iamConfig = getIAMConfig();
    const token = await getIAMToken(iamConfig);
    console.log('[ModelArts Test] Token obtained');
    console.log('[ModelArts Test] Token length:', token?.length || 0);
    
    // Test 1: Simple prompt (required field only)
    console.log('\n--- Test 1: Simple Prompt (Required Only) ---');
    const format1 = {
      prompt: 'Hello! Please respond in English. How are you today?',
    };
    
    const response1 = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Auth-Token': token,
      },
      body: JSON.stringify(format1),
    });
    
    const text1 = await response1.text();
    console.log('[Test 1] Status:', response1.status);
    console.log('[Test 1] Response:', text1);
    
    let parsedResponse1;
    try {
      parsedResponse1 = JSON.parse(text1);
    } catch (e) {
      parsedResponse1 = text1;
    }
    
    // Test 2: With optional parameters
    console.log('\n--- Test 2: With Optional Parameters ---');
    const format2 = {
      prompt: 'Tell me a short story about friendship.',
      temperature: 0.7,
      max_tokens: 150,
      top_p: 0.9,
    };
    
    const response2 = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Auth-Token': token,
      },
      body: JSON.stringify(format2),
    });
    
    const text2 = await response2.text();
    console.log('[Test 2] Status:', response2.status);
    console.log('[Test 2] Response:', text2);
    
    let parsedResponse2;
    try {
      parsedResponse2 = JSON.parse(text2);
    } catch (e) {
      parsedResponse2 = text2;
    }
    
    // Test 3: With conversation history
    console.log('\n--- Test 3: With Conversation History ---');
    const format3 = {
      prompt: 'What did I just ask you about?',
      history: [
        ['Tell me a short story about friendship.', 'Once upon a time, two friends helped each other.']
      ],
      temperature: 0.7,
      max_tokens: 100,
    };
    
    const response3 = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Auth-Token': token,
      },
      body: JSON.stringify(format3),
    });
    
    const text3 = await response3.text();
    console.log('[Test 3] Status:', response3.status);
    console.log('[Test 3] Response:', text3);
    
    let parsedResponse3;
    try {
      parsedResponse3 = JSON.parse(text3);
    } catch (e) {
      parsedResponse3 = text3;
    }
    
    // Analyze results
    const test1Success = response1.ok;
    const test2Success = response2.ok;
    const test3Success = response3.ok;
    
    // Extract AI response from choices array
    let aiResponse1 = 'N/A';
    let aiResponse2 = 'N/A';
    let aiResponse3 = 'N/A';
    
    if (test1Success && parsedResponse1?.choices?.length > 0) {
      aiResponse1 = parsedResponse1.choices[0]?.message?.content 
                    || parsedResponse1.choices[0]?.text 
                    || JSON.stringify(parsedResponse1.choices[0]);
    }
    
    if (test2Success && parsedResponse2?.choices?.length > 0) {
      aiResponse2 = parsedResponse2.choices[0]?.message?.content 
                    || parsedResponse2.choices[0]?.text 
                    || JSON.stringify(parsedResponse2.choices[0]);
    }
    
    if (test3Success && parsedResponse3?.choices?.length > 0) {
      aiResponse3 = parsedResponse3.choices[0]?.message?.content 
                    || parsedResponse3.choices[0]?.text 
                    || JSON.stringify(parsedResponse3.choices[0]);
    }
    
    return NextResponse.json({
      success: test1Success || test2Success || test3Success,
      message: `${[test1Success, test2Success, test3Success].filter(Boolean).length}/3 tests passed`,
      tests: {
        test1_simple: {
          status: response1.status,
          success: test1Success,
          request: format1,
          response: parsedResponse1,
          aiResponse: aiResponse1,
        },
        test2_with_params: {
          status: response2.status,
          success: test2Success,
          request: format2,
          response: parsedResponse2,
          aiResponse: aiResponse2,
        },
        test3_with_history: {
          status: response3.status,
          success: test3Success,
          request: format3,
          response: parsedResponse3,
          aiResponse: aiResponse3,
        },
      },
      responseStructure: parsedResponse1,
      nextSteps: (test1Success || test2Success || test3Success)
        ? [
            '✅ ModelArts is working!',
            '1. Update lib/services/huawei-modelarts.service.ts with this format',
            '2. Test /api/conversation-analysis/generate-greeting',
            '3. Test full conversation at /conversation-analysis',
          ]
        : [
            '❌ All tests failed',
            '1. Check if the model is running in ModelArts console',
            '2. Verify the endpoint URL is correct',
            '3. Check the error messages above',
          ],
    });
  } catch (error) {
    console.error('❌ ModelArts test failed:', error);
    
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
    }, { status: 500 });
  }
}

