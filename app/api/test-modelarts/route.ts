import { NextResponse } from 'next/server';
import { getIAMToken, getIAMConfig } from '@/lib/services/huawei-iam.service';

/**
 * Test endpoint to discover ModelArts API format
 * Visit: http://localhost:3000/api/test-modelarts
 */
export async function GET() {
  try {
    console.log('=== Testing ModelArts Endpoint ===');
    
    const endpoint = process.env.HUAWEI_MODELARTS_CONVERSATION_ENDPOINT;
    
    if (!endpoint) {
      return NextResponse.json({
        success: false,
        error: 'HUAWEI_MODELARTS_CONVERSATION_ENDPOINT not set',
        instructions: [
          '1. Add HUAWEI_MODELARTS_CONVERSATION_ENDPOINT to .env.local',
          '2. Get the endpoint URL from ModelArts console > Real-time Services > Your service > Usage Guides tab',
          '3. Restart dev server',
        ],
      }, { status: 500 });
    }
    
    console.log('[ModelArts Test] Endpoint:', endpoint);
    
    // Get IAM token
    const iamConfig = getIAMConfig();
    const token = await getIAMToken(iamConfig);
    console.log('[ModelArts Test] Token obtained');
    
    const results: any[] = [];
    
    // Test 1: Simple prompt with inputs array (current implementation)
    console.log('\n--- Test 1: Inputs Array Format ---');
    const format1 = {
      inputs: [{
        prompt: 'Hello! Please respond in English.',
        temperature: 0.7,
        max_tokens: 100,
      }],
    };
    
    try {
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
      console.log('[Test 1] Response:', text1.substring(0, 300));
      
      let parsedResponse1;
      try {
        parsedResponse1 = JSON.parse(text1);
      } catch (e) {
        parsedResponse1 = text1;
      }
      
      results.push({
        test: 'Format 1: inputs array',
        format: format1,
        status: response1.status,
        success: response1.ok,
        response: parsedResponse1,
        responsePreview: typeof parsedResponse1 === 'string' 
          ? parsedResponse1.substring(0, 200)
          : JSON.stringify(parsedResponse1).substring(0, 200),
      });
    } catch (error) {
      results.push({
        test: 'Format 1: inputs array',
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
    
    // Test 2: Direct prompt format
    console.log('\n--- Test 2: Direct Prompt Format ---');
    const format2 = {
      prompt: 'Hello! Please respond in English.',
      max_tokens: 100,
      temperature: 0.7,
    };
    
    try {
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
      console.log('[Test 2] Response:', text2.substring(0, 300));
      
      let parsedResponse2;
      try {
        parsedResponse2 = JSON.parse(text2);
      } catch (e) {
        parsedResponse2 = text2;
      }
      
      results.push({
        test: 'Format 2: direct prompt',
        format: format2,
        status: response2.status,
        success: response2.ok,
        response: parsedResponse2,
        responsePreview: typeof parsedResponse2 === 'string' 
          ? parsedResponse2.substring(0, 200)
          : JSON.stringify(parsedResponse2).substring(0, 200),
      });
    } catch (error) {
      results.push({
        test: 'Format 2: direct prompt',
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
    
    // Test 3: Text/data format (common in ModelArts examples)
    console.log('\n--- Test 3: Data Format ---');
    const format3 = {
      data: {
        req_data: [{
          prompt: 'Hello! Please respond in English.',
        }],
      },
    };
    
    try {
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
      console.log('[Test 3] Response:', text3.substring(0, 300));
      
      let parsedResponse3;
      try {
        parsedResponse3 = JSON.parse(text3);
      } catch (e) {
        parsedResponse3 = text3;
      }
      
      results.push({
        test: 'Format 3: data/req_data',
        format: format3,
        status: response3.status,
        success: response3.ok,
        response: parsedResponse3,
        responsePreview: typeof parsedResponse3 === 'string' 
          ? parsedResponse3.substring(0, 200)
          : JSON.stringify(parsedResponse3).substring(0, 200),
      });
    } catch (error) {
      results.push({
        test: 'Format 3: data format',
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
    
    // Test 4: Messages array format (ChatGPT-style)
    console.log('\n--- Test 4: Messages Format ---');
    const format4 = {
      messages: [
        { role: 'user', content: 'Hello! Please respond in English.' }
      ],
      max_tokens: 100,
      temperature: 0.7,
    };
    
    try {
      const response4 = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Auth-Token': token,
        },
        body: JSON.stringify(format4),
      });
      
      const text4 = await response4.text();
      console.log('[Test 4] Status:', response4.status);
      console.log('[Test 4] Response:', text4.substring(0, 300));
      
      let parsedResponse4;
      try {
        parsedResponse4 = JSON.parse(text4);
      } catch (e) {
        parsedResponse4 = text4;
      }
      
      results.push({
        test: 'Format 4: messages array',
        format: format4,
        status: response4.status,
        success: response4.ok,
        response: parsedResponse4,
        responsePreview: typeof parsedResponse4 === 'string' 
          ? parsedResponse4.substring(0, 200)
          : JSON.stringify(parsedResponse4).substring(0, 200),
      });
    } catch (error) {
      results.push({
        test: 'Format 4: messages format',
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
    
    // Test 5: Simple text field
    console.log('\n--- Test 5: Simple Text Field ---');
    const format5 = {
      text: 'Hello! Please respond in English.',
    };
    
    try {
      const response5 = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Auth-Token': token,
        },
        body: JSON.stringify(format5),
      });
      
      const text5 = await response5.text();
      console.log('[Test 5] Status:', response5.status);
      console.log('[Test 5] Response:', text5.substring(0, 300));
      
      let parsedResponse5;
      try {
        parsedResponse5 = JSON.parse(text5);
      } catch (e) {
        parsedResponse5 = text5;
      }
      
      results.push({
        test: 'Format 5: simple text field',
        format: format5,
        status: response5.status,
        success: response5.ok,
        response: parsedResponse5,
        responsePreview: typeof parsedResponse5 === 'string' 
          ? parsedResponse5.substring(0, 200)
          : JSON.stringify(parsedResponse5).substring(0, 200),
      });
    } catch (error) {
      results.push({
        test: 'Format 5: simple text',
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
    
    // Test 6: Query field (common in Chinese models)
    console.log('\n--- Test 6: Query Field ---');
    const format6 = {
      query: 'Hello! Please respond in English.',
      max_length: 100,
    };
    
    try {
      const response6 = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Auth-Token': token,
        },
        body: JSON.stringify(format6),
      });
      
      const text6 = await response6.text();
      console.log('[Test 6] Status:', response6.status);
      console.log('[Test 6] Response:', text6.substring(0, 300));
      
      let parsedResponse6;
      try {
        parsedResponse6 = JSON.parse(text6);
      } catch (e) {
        parsedResponse6 = text6;
      }
      
      results.push({
        test: 'Format 6: query field',
        format: format6,
        status: response6.status,
        success: response6.ok,
        response: parsedResponse6,
        responsePreview: typeof parsedResponse6 === 'string' 
          ? parsedResponse6.substring(0, 200)
          : JSON.stringify(parsedResponse6).substring(0, 200),
      });
    } catch (error) {
      results.push({
        test: 'Format 6: query format',
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
    
    // Analyze results
    const successfulTests = results.filter(r => r.success);
    const workingFormat = successfulTests.length > 0 ? successfulTests[0] : null;
    
    return NextResponse.json({
      success: successfulTests.length > 0,
      message: `${successfulTests.length}/${results.length} formats worked`,
      endpoint: endpoint.substring(0, 50) + '...',
      results,
      recommendation: workingFormat 
        ? {
            message: `✅ Use ${workingFormat.test}`,
            format: workingFormat.format,
            responseStructure: workingFormat.response,
          }
        : '❌ None of the 6 standard formats worked. Please check the "Usage Guides" tab in your ModelArts real-time service for the exact input format example.',
      nextSteps: successfulTests.length > 0 
        ? [
            '✅ Working format found!',
            '1. Update lib/services/huawei-modelarts.service.ts with the working format',
            '2. Test /api/conversation-analysis/generate-greeting',
            '3. Test full conversation on /conversation-analysis',
          ]
        : [
            '❌ No working format found. Next steps:',
            '1. Go to ModelArts console → Real-time Services → Your service',
            '2. Click "Usage Guides" tab',
            '3. Copy the exact JSON example from "Prediction Input"',
            '4. Share it so we can add it to the tests',
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

