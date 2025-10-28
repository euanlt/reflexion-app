import { NextResponse } from 'next/server';

/**
 * Test all Huawei Cloud services in sequence
 * Visit: http://localhost:3000/api/test-all
 * 
 * This runs all tests in order and reports the results
 */
export async function GET(request: Request) {
  const results: any = {
    timestamp: new Date().toISOString(),
    overallStatus: 'UNKNOWN',
    tests: {},
  };

  const baseUrl = new URL(request.url).origin;

  try {
    // Test 1: Environment Variables
    console.log('\n=== Test 1: Environment Variables ===');
    const envResponse = await fetch(`${baseUrl}/api/test-env`);
    const envData = await envResponse.json();
    results.tests.environment = {
      status: envData.allRequiredVariablesSet ? 'PASS' : 'FAIL',
      ...envData,
    };

    if (!envData.allRequiredVariablesSet) {
      results.overallStatus = 'FAIL';
      results.failureReason = 'Missing environment variables';
      return NextResponse.json(results, { status: 500 });
    }

    // Test 2: IAM Token Generation
    console.log('\n=== Test 2: IAM Token Generation ===');
    const tokenResponse = await fetch(`${baseUrl}/api/test-token`);
    const tokenData = await tokenResponse.json();
    results.tests.iamToken = {
      status: tokenData.success ? 'PASS' : 'FAIL',
      ...tokenData,
    };

    if (!tokenData.success) {
      results.overallStatus = 'FAIL';
      results.failureReason = 'IAM token generation failed';
      return NextResponse.json(results, { status: 500 });
    }

    // Test 3: TTS Service
    console.log('\n=== Test 3: Text-to-Speech ===');
    const ttsResponse = await fetch(`${baseUrl}/api/test-tts`);
    const ttsData = await ttsResponse.json();
    results.tests.textToSpeech = {
      status: ttsData.success ? 'PASS' : 'FAIL',
      ...ttsData,
    };

    // Test 4: Greeting Generation
    console.log('\n=== Test 4: Greeting Generation ===');
    const greetingResponse = await fetch(`${baseUrl}/api/test-greeting`);
    const greetingData = await greetingResponse.json();
    results.tests.greeting = {
      status: greetingData.success ? 'PASS' : 'FAIL',
      ...greetingData,
    };

    // Determine overall status
    const allPassed = 
      results.tests.environment.status === 'PASS' &&
      results.tests.iamToken.status === 'PASS' &&
      results.tests.textToSpeech.status === 'PASS' &&
      results.tests.greeting.status === 'PASS';

    results.overallStatus = allPassed ? 'PASS' : 'PARTIAL';
    
    // Summary
    results.summary = {
      total: 4,
      passed: Object.values(results.tests).filter((t: any) => t.status === 'PASS').length,
      failed: Object.values(results.tests).filter((t: any) => t.status === 'FAIL').length,
    };

    results.message = allPassed 
      ? 'All tests passed! ✓ Your Huawei Cloud integration is working correctly.'
      : 'Some tests passed. Check individual test results for details.';

    results.nextSteps = allPassed
      ? [
          'All services are working! ✓',
          'Try the conversation analysis feature in the app',
          'The AI will speak using Huawei TTS',
          'Your conversation will be transcribed using Huawei SIS',
        ]
      : [
          'Fix the failing tests first',
          'Check the troubleshooting section for each failed test',
          'Greeting failure is OK if you\'re not using ModelArts',
        ];

    console.log('\n=== Test Summary ===');
    console.log(`Overall: ${results.overallStatus}`);
    console.log(`Passed: ${results.summary.passed}/${results.summary.total}`);

    return NextResponse.json(results);

  } catch (error) {
    console.error('❌ Test execution failed:', error);
    
    results.overallStatus = 'ERROR';
    results.error = error instanceof Error ? error.message : 'Unknown error';
    
    return NextResponse.json(results, { status: 500 });
  }
}

