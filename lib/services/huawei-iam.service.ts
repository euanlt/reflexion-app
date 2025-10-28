/**
 * Huawei Cloud IAM Service
 * Handles token-based authentication for Huawei Cloud APIs
 * Reference: https://support.huaweicloud.com/intl/en-us/api-sis/sis_03_0058.html
 */

interface IAMConfig {
  username: string;
  password: string;
  domainName: string;
  projectName: string;
  region: string;
}

interface TokenCache {
  token: string;
  expiresAt: number;
}

let tokenCache: TokenCache | null = null;

/**
 * Get IAM authentication token using username/password
 * Token validity: 24 hours (cached for 23 hours to be safe)
 * 
 * This uses token-based authentication which is recommended for:
 * - Request bodies larger than 12 MB (our audio files are 15-50 MB)
 * - Better performance with token caching
 * 
 * Reference: https://support.huaweicloud.com/intl/en-us/api-sis/sis_03_0058.html
 */
export async function getIAMToken(config: IAMConfig): Promise<string> {
  // Check if we have a valid cached token
  if (tokenCache && tokenCache.expiresAt > Date.now()) {
    console.log('Using cached IAM token');
    return tokenCache.token;
  }

  try {
    const iamEndpoint = `https://iam.${config.region}.myhuaweicloud.com/v3/auth/tokens`;
    
    console.log('Requesting new IAM token from:', iamEndpoint);
    
    const response = await fetch(iamEndpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        auth: {
          identity: {
            methods: ['password'],
            password: {
              user: {
                name: config.username,
                password: config.password,
                domain: {
                  name: config.domainName,
                },
              },
            },
          },
          scope: {
            project: {
              name: config.projectName,
            },
          },
        },
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('IAM token request failed:', response.status, errorText);
      throw new Error(`Failed to get IAM token: ${response.status} ${response.statusText}`);
    }

    // Token is returned in the X-Subject-Token header
    const token = response.headers.get('X-Subject-Token');
    
    if (!token) {
      throw new Error('No token received from IAM service');
    }

    console.log('Successfully obtained IAM token');

    // Cache for 23 hours (tokens are valid for 24 hours)
    tokenCache = {
      token,
      expiresAt: Date.now() + (23 * 60 * 60 * 1000),
    };

    return token;
  } catch (error) {
    console.error('Error getting IAM token:', error);
    throw new Error(
      error instanceof Error 
        ? error.message 
        : 'Failed to get IAM authentication token'
    );
  }
}

/**
 * Get IAM configuration from environment variables
 */
export function getIAMConfig(): IAMConfig {
  const config = {
    username: process.env.HUAWEI_IAM_USERNAME || '',
    password: process.env.HUAWEI_IAM_PASSWORD || '',
    domainName: process.env.HUAWEI_IAM_DOMAIN_NAME || '',
    projectName: process.env.HUAWEI_IAM_PROJECT_NAME || '',
    region: process.env.HUAWEI_SIS_REGION || 'ap-southeast-1',
  };

  // Validate required fields
  const missingFields = [];
  if (!config.username) missingFields.push('HUAWEI_IAM_USERNAME');
  if (!config.password) missingFields.push('HUAWEI_IAM_PASSWORD');
  if (!config.domainName) missingFields.push('HUAWEI_IAM_DOMAIN_NAME');
  if (!config.projectName) missingFields.push('HUAWEI_IAM_PROJECT_NAME');

  if (missingFields.length > 0) {
    console.warn(`Missing IAM configuration: ${missingFields.join(', ')}`);
  }

  return config;
}

/**
 * Clear the token cache (useful for testing or when tokens expire)
 */
export function clearTokenCache(): void {
  tokenCache = null;
  console.log('IAM token cache cleared');
}

