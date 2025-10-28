import { NextResponse } from 'next/server';
import { getIAMToken, getIAMConfig } from '@/lib/services/huawei-iam.service';

/**
 * Test endpoint to verify IAM token generation works
 * Visit: http://localhost:3000/api/test-token
 */
export async function GET() {
  try {
    console.log('=== Testing IAM Token Generation ===');
    
    const config = getIAMConfig();
    
    // Log configuration (without sensitive data)
    console.log('IAM Config:', {
      username: config.username ? '✓ Set' : '✗ Missing',
      password: config.password ? `✓ Set (${config.password.length} chars)` : '✗ Missing',
      domainName: config.domainName || '✗ Missing',
      projectName: config.projectName || '✗ Missing',
      region: config.region || '✗ Missing',
    });

    // Check for missing required fields
    const missingFields = [];
    if (!config.username) missingFields.push('HUAWEI_IAM_USERNAME');
    if (!config.password) missingFields.push('HUAWEI_IAM_PASSWORD');
    if (!config.domainName) missingFields.push('HUAWEI_IAM_DOMAIN_NAME');
    if (!config.projectName) missingFields.push('HUAWEI_IAM_PROJECT_NAME');

    if (missingFields.length > 0) {
      return NextResponse.json({
        success: false,
        error: 'Missing required configuration',
        missingFields,
        message: 'Add these variables to .env.local and restart server'
      }, { status: 400 });
    }

    console.log('Attempting to get IAM token...');
    const startTime = Date.now();
    
    const token = await getIAMToken(config);
    
    const duration = Date.now() - startTime;
    console.log(`✓ Token obtained successfully in ${duration}ms`);
    console.log(`Token length: ${token.length} characters`);
    console.log(`Token preview: ${token.substring(0, 20)}...`);

    return NextResponse.json({
      success: true,
      message: 'IAM token generated successfully! ✓',
      tokenInfo: {
        hasToken: !!token,
        tokenLength: token.length,
        tokenPreview: `${token.substring(0, 20)}...${token.substring(token.length - 10)}`,
        generationTime: `${duration}ms`,
        iamEndpoint: `https://iam.${config.region}.myhuaweicloud.com/v3/auth/tokens`,
      },
      config: {
        username: config.username,
        domainName: config.domainName,
        projectName: config.projectName,
        region: config.region,
      },
      nextSteps: [
        'Token is valid! ✓',
        'Test TTS at /api/conversation-analysis/synthesize-speech',
        'Test greeting at /api/conversation-analysis/generate-greeting',
      ]
    });
  } catch (error) {
    console.error('❌ Token generation failed:', error);
    
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    const is401 = errorMessage.includes('401');
    
    return NextResponse.json({
      success: false,
      error: errorMessage,
      errorType: is401 ? 'AUTHENTICATION_FAILED' : 'UNKNOWN_ERROR',
      possibleCauses: is401 ? [
        'Incorrect username or password',
        'Incorrect domain name',
        'Incorrect project name',
        'IAM user does not have required permissions',
        'Account may be locked or disabled',
      ] : [
        'Network connectivity issues',
        'Huawei Cloud service unavailable',
        'Invalid region configuration',
      ],
      troubleshooting: {
        step1: 'Verify credentials in Huawei Cloud Console > IAM > Users',
        step2: 'Check domain name in My Credentials > Domain Name',
        step3: 'Check project name in My Credentials > Projects',
        step4: 'Ensure IAM user has SIS FullAccess permission',
        step5: 'Try logging into console with same credentials',
      }
    }, { status: 500 });
  }
}

