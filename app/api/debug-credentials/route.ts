import { NextResponse } from 'next/server';

/**
 * Debug endpoint to show what credentials are being read
 * IMPORTANT: Only use this for debugging! Remove after fixing.
 */
export async function GET() {
  const credentials = {
    username: process.env.HUAWEI_IAM_USERNAME,
    usernameLength: process.env.HUAWEI_IAM_USERNAME?.length || 0,
    usernamePreview: process.env.HUAWEI_IAM_USERNAME 
      ? `${process.env.HUAWEI_IAM_USERNAME.substring(0, 3)}...` 
      : 'NOT SET',
    
    passwordSet: !!process.env.HUAWEI_IAM_PASSWORD,
    passwordLength: process.env.HUAWEI_IAM_PASSWORD?.length || 0,
    
    domainName: process.env.HUAWEI_IAM_DOMAIN_NAME,
    domainLength: process.env.HUAWEI_IAM_DOMAIN_NAME?.length || 0,
    
    projectName: process.env.HUAWEI_IAM_PROJECT_NAME,
    projectLength: process.env.HUAWEI_IAM_PROJECT_NAME?.length || 0,
    
    region: process.env.HUAWEI_SIS_REGION,
    projectId: process.env.HUAWEI_SIS_PROJECT_ID 
      ? `${process.env.HUAWEI_SIS_PROJECT_ID.substring(0, 8)}...` 
      : 'NOT SET',
  };

  // Check for issues
  const issues = [];
  
  if (!credentials.username) {
    issues.push('❌ HUAWEI_IAM_USERNAME is not set');
  } else if (credentials.username.includes(' ')) {
    issues.push('⚠️  Username contains spaces - check for extra spaces');
  }
  
  if (!credentials.passwordSet) {
    issues.push('❌ HUAWEI_IAM_PASSWORD is not set');
  } else if (credentials.passwordLength < 8) {
    issues.push('⚠️  Password seems too short - verify it\'s correct');
  }
  
  if (!credentials.domainName) {
    issues.push('❌ HUAWEI_IAM_DOMAIN_NAME is not set');
  } else if (credentials.domainName.includes(' ')) {
    issues.push('⚠️  Domain name contains spaces - check for extra spaces');
  }
  
  if (!credentials.projectName) {
    issues.push('❌ HUAWEI_IAM_PROJECT_NAME is not set');
  } else if (credentials.projectName !== credentials.region) {
    issues.push(`⚠️  PROJECT_NAME (${credentials.projectName}) should equal REGION (${credentials.region})`);
  }

  return NextResponse.json({
    credentials,
    issues: issues.length > 0 ? issues : ['✓ All credentials are set'],
    instructions: {
      username: 'IAM > Users > find your IAM username (e.g., "john_smith" or "admin_user")',
      password: 'The password you set for this IAM user',
      domainName: 'My Credentials > Domain Name (your account name, NOT account ID)',
      projectName: 'Should be the same as your region (e.g., "ap-southeast-3")',
      region: 'The region you\'re using (e.g., "ap-southeast-3")',
    },
    commonMistakes: [
      'Using account name instead of IAM username',
      'Using account ID instead of domain name',
      'Using project ID instead of project name (region)',
      'Extra spaces or hidden characters in .env.local',
      'Not restarting dev server after changing .env.local',
    ]
  });
}

