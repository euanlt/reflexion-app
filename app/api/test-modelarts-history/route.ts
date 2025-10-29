import { NextResponse } from 'next/server';
import { getIAMToken, getIAMConfig } from '@/lib/services/huawei-iam.service';

/**
 * Test if we can provide conversation context in the PROMPT TEXT
 * instead of using the history parameter
 */
export async function GET() {
  try {
    console.log('=== Testing Conversation History in Prompt ===');
    
    const endpoint = process.env.HUAWEI_MODELARTS_CONVERSATION_ENDPOINT;
    
    if (!endpoint) {
      return NextResponse.json({
        success: false,
        error: 'HUAWEI_MODELARTS_CONVERSATION_ENDPOINT not set',
      }, { status: 500 });
    }
    
    const iamConfig = getIAMConfig();
    const token = await getIAMToken(iamConfig);
    
    // Test 1: WITHOUT context
    console.log('\n--- Test 1: No Context ---');
    const prompt1 = 'What did I just tell you?';
    
    const response1 = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Auth-Token': token,
      },
      body: JSON.stringify({
        prompt: prompt1,
        temperature: 0.7,
        max_tokens: 300,
        top_p: 0.9,
      }),
    });
    
    const data1 = await response1.json();
    console.log('[Test 1] Status:', response1.status);
    console.log('[Test 1] Response:', data1.choices?.[0]?.text || 'No response');
    
    // Test 2: WITH context in prompt text
    console.log('\n--- Test 2: Context in Prompt Text ---');
    const conversationContext = `Previous conversation:
User: "My name is John and I'm 45 years old."
AI: "Nice to meet you, John!"

Now the user asks:`;
    
    const prompt2 = `${conversationContext} "What's my name and age?"`;
    
    console.log('[Test 2] Prompt:', prompt2);
    
    const response2 = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Auth-Token': token,
      },
      body: JSON.stringify({
        prompt: prompt2,
        temperature: 0.7,
        max_tokens: 300,
        top_p: 0.9,
      }),
    });
    
    const data2 = await response2.json();
    console.log('[Test 2] Status:', response2.status);
    console.log('[Test 2] Response:', data2.choices?.[0]?.text || 'No response');
    
    // Test 3: Shorter context version
    console.log('\n--- Test 3: Brief Context ---');
    const prompt3 = `Context: User said "I like pizza". User asks: "What food do I like?"`;
    
    const response3 = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Auth-Token': token,
      },
      body: JSON.stringify({
        prompt: prompt3,
        temperature: 0.7,
        max_tokens: 300,
        top_p: 0.9,
      }),
    });
    
    const data3 = await response3.json();
    console.log('[Test 3] Status:', response3.status);
    console.log('[Test 3] Response:', data3.choices?.[0]?.text || 'No response');
    
    return NextResponse.json({
      success: true,
      message: 'Context tests completed',
      tests: {
        test1_no_context: {
          prompt: prompt1,
          status: response1.status,
          response: data1.choices?.[0]?.text || 'No response',
          canAnswerCorrectly: false, // Should fail - no context
        },
        test2_full_context: {
          prompt: prompt2,
          status: response2.status,
          response: data2.choices?.[0]?.text || 'No response',
          canAnswerCorrectly: data2.choices?.[0]?.text?.toLowerCase().includes('john') || 
                              data2.choices?.[0]?.text?.includes('45'),
        },
        test3_brief_context: {
          prompt: prompt3,
          status: response3.status,
          response: data3.choices?.[0]?.text || 'No response',
          canAnswerCorrectly: data3.choices?.[0]?.text?.toLowerCase().includes('pizza'),
        },
      },
      conclusion: 'Check if Test 2 and 3 mention the correct information from context',
    });
  } catch (error) {
    console.error('Test failed:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    }, { status: 500 });
  }
}

