import { NextResponse } from 'next/server';

/**
 * Test endpoint to verify Vercel environment variables
 * Visit: https://your-app.vercel.app/api/test-vercel-env
 */
export async function GET() {
  return NextResponse.json({
    environment: process.env.NODE_ENV,
    envVars: {
      // Check if each variable is set (don't expose actual values)
      HUAWEI_IAM_USERNAME: process.env.HUAWEI_IAM_USERNAME ? `Set (${process.env.HUAWEI_IAM_USERNAME.length} chars)` : '❌ NOT SET',
      HUAWEI_IAM_PASSWORD: process.env.HUAWEI_IAM_PASSWORD ? `Set (${process.env.HUAWEI_IAM_PASSWORD.length} chars)` : '❌ NOT SET',
      HUAWEI_IAM_DOMAIN_NAME: process.env.HUAWEI_IAM_DOMAIN_NAME ? `Set (${process.env.HUAWEI_IAM_DOMAIN_NAME.length} chars)` : '❌ NOT SET',
      HUAWEI_IAM_PROJECT_NAME: process.env.HUAWEI_IAM_PROJECT_NAME || '❌ NOT SET',
      HUAWEI_SIS_PROJECT_ID: process.env.HUAWEI_SIS_PROJECT_ID ? `Set (${process.env.HUAWEI_SIS_PROJECT_ID.substring(0, 8)}...)` : '❌ NOT SET',
      HUAWEI_SIS_REGION: process.env.HUAWEI_SIS_REGION || '❌ NOT SET',
      HUAWEI_MODELARTS_ENDPOINT: process.env.HUAWEI_MODELARTS_ENDPOINT ? 'Set ✓' : '❌ NOT SET',
    },
    checks: [
      process.env.HUAWEI_IAM_USERNAME ? '✓ Username set' : '❌ Username missing',
      process.env.HUAWEI_IAM_PASSWORD ? '✓ Password set' : '❌ Password missing',
      process.env.HUAWEI_IAM_DOMAIN_NAME ? '✓ Domain name set' : '❌ Domain name missing',
      process.env.HUAWEI_IAM_PROJECT_NAME ? '✓ Project name set' : '❌ Project name missing',
      process.env.HUAWEI_SIS_PROJECT_ID ? '✓ SIS Project ID set' : '❌ SIS Project ID missing',
      process.env.HUAWEI_SIS_REGION ? '✓ SIS Region set' : '❌ SIS Region missing',
    ],
    allSet: !!(
      process.env.HUAWEI_IAM_USERNAME &&
      process.env.HUAWEI_IAM_PASSWORD &&
      process.env.HUAWEI_IAM_DOMAIN_NAME &&
      process.env.HUAWEI_IAM_PROJECT_NAME &&
      process.env.HUAWEI_SIS_PROJECT_ID &&
      process.env.HUAWEI_SIS_REGION
    ),
  });
}

