import { NextResponse } from 'next/server';

/**
 * Test endpoint to verify environment variables are loaded
 * Visit: http://localhost:3000/api/test-env
 */
export async function GET() {
  const envStatus = {
    // SIS Configuration
    hasSisProjectId: !!process.env.HUAWEI_SIS_PROJECT_ID,
    sisProjectId: process.env.HUAWEI_SIS_PROJECT_ID ? 
      `${process.env.HUAWEI_SIS_PROJECT_ID.substring(0, 4)}...` : 'NOT SET',
    sisRegion: process.env.HUAWEI_SIS_REGION || 'NOT SET',
    
    // IAM Configuration
    hasUsername: !!process.env.HUAWEI_IAM_USERNAME,
    username: process.env.HUAWEI_IAM_USERNAME || 'NOT SET',
    hasPassword: !!process.env.HUAWEI_IAM_PASSWORD,
    passwordLength: process.env.HUAWEI_IAM_PASSWORD?.length || 0,
    hasDomainName: !!process.env.HUAWEI_IAM_DOMAIN_NAME,
    domainName: process.env.HUAWEI_IAM_DOMAIN_NAME || 'NOT SET',
    hasProjectName: !!process.env.HUAWEI_IAM_PROJECT_NAME,
    projectName: process.env.HUAWEI_IAM_PROJECT_NAME || 'NOT SET',
    
    // ModelArts (Optional)
    hasModelArtsEndpoint: !!process.env.HUAWEI_MODELARTS_ENDPOINT,
    modelArtsEndpoint: process.env.HUAWEI_MODELARTS_ENDPOINT ? 
      `${process.env.HUAWEI_MODELARTS_ENDPOINT.substring(0, 30)}...` : 'NOT SET (Optional)',
  };

  // Check if all required variables are set
  const allRequired = 
    envStatus.hasSisProjectId &&
    envStatus.hasUsername &&
    envStatus.hasPassword &&
    envStatus.hasDomainName &&
    envStatus.hasProjectName;

  return NextResponse.json({
    status: allRequired ? 'READY' : 'MISSING VARIABLES',
    allRequiredVariablesSet: allRequired,
    environment: envStatus,
    missingVariables: [
      !envStatus.hasSisProjectId && 'HUAWEI_SIS_PROJECT_ID',
      !envStatus.hasUsername && 'HUAWEI_IAM_USERNAME',
      !envStatus.hasPassword && 'HUAWEI_IAM_PASSWORD',
      !envStatus.hasDomainName && 'HUAWEI_IAM_DOMAIN_NAME',
      !envStatus.hasProjectName && 'HUAWEI_IAM_PROJECT_NAME',
    ].filter(Boolean),
    instructions: allRequired 
      ? 'All required variables are set. Test token generation next at /api/test-token'
      : 'Add missing variables to .env.local and restart server',
  });
}

