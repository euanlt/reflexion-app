# Environment Variables Configuration

## Required Environment Variables

All environment variables should be added to `.env.local` for local development and to your deployment platform (e.g., Vercel) for production.

### Huawei Cloud OBS (Object Storage)

```bash
# Object Storage Service for video/audio storage
HUAWEI_OBS_ACCESS_KEY_ID=your_access_key_id
HUAWEI_OBS_SECRET_ACCESS_KEY=your_secret_access_key
HUAWEI_OBS_ENDPOINT=obs.ap-southeast-3.myhuaweicloud.com
HUAWEI_OBS_BUCKET_NAME=your_bucket_name
```

### Huawei Speech Recognition (SIS)

```bash
# Speech-to-text transcription
HUAWEI_SIS_PROJECT_ID=your_project_id_here
HUAWEI_SIS_REGION=ap-southeast-3
```

### Huawei IAM (Token-based Authentication)

```bash
# Identity and Access Management for API authentication
HUAWEI_IAM_USERNAME=your_iam_username
HUAWEI_IAM_PASSWORD=your_iam_password
HUAWEI_IAM_DOMAIN_NAME=your_domain_name
HUAWEI_IAM_PROJECT_NAME=ap-southeast-3  # Must match SIS_REGION
```

### Huawei ModelArts (AI Models)

```bash
# AI greeting generation (optional - fallback greetings used if not configured)
HUAWEI_MODELARTS_ENDPOINT=https://your-endpoint.apig.ap-southeast-3.huaweicloudapis.com

# Real-time conversational AI endpoint (optional - rule-based fallback if not configured)
HUAWEI_MODELARTS_CONVERSATION_ENDPOINT=https://your-conversation-endpoint.apig.ap-southeast-3.huaweicloudapis.com
```

## Complete `.env.local` Template

```bash
# ===================================
# HUAWEI CLOUD CONFIGURATION
# ===================================

# Object Storage Service (OBS)
HUAWEI_OBS_ACCESS_KEY_ID=your_access_key_id
HUAWEI_OBS_SECRET_ACCESS_KEY=your_secret_access_key
HUAWEI_OBS_ENDPOINT=obs.ap-southeast-3.myhuaweicloud.com
HUAWEI_OBS_BUCKET_NAME=reflexion-app-storage

# Speech Interaction Service (SIS)
HUAWEI_SIS_PROJECT_ID=abc123def456789
HUAWEI_SIS_REGION=ap-southeast-3

# Identity and Access Management (IAM)
HUAWEI_IAM_USERNAME=reflexion_app_user
HUAWEI_IAM_PASSWORD=YourSecurePassword123!
HUAWEI_IAM_DOMAIN_NAME=your-account-name
HUAWEI_IAM_PROJECT_NAME=ap-southeast-3

# ModelArts AI Services (Optional)
HUAWEI_MODELARTS_ENDPOINT=https://your-endpoint.apig.ap-southeast-3.huaweicloudapis.com
HUAWEI_MODELARTS_CONVERSATION_ENDPOINT=https://your-conversation-endpoint.apig.ap-southeast-3.huaweicloudapis.com
```

## Variable Details

### OBS (Object Storage Service)

- **Access Key ID & Secret**: Generated in Huawei Cloud Console > IAM > Access Keys
- **Endpoint**: Region-specific OBS endpoint (see Huawei Cloud docs for your region)
- **Bucket Name**: Name of your OBS bucket (create in OBS console)

### SIS (Speech Interaction Service)

- **Project ID**: Found in My Credentials > API Credentials
- **Region**: The region where SIS is available (e.g., ap-southeast-1, ap-southeast-2, ap-southeast-3)

### IAM (Identity and Access Management)

- **Username**: IAM user created for the application (NOT your account name)
- **Password**: Password for the IAM user
- **Domain Name**: Your Huawei Cloud account name (found in My Credentials > Domain Name)
- **Project Name**: MUST be the same as SIS_REGION (e.g., if REGION=ap-southeast-3, PROJECT_NAME=ap-southeast-3)

### ModelArts

- **Endpoint**: API endpoint for deployed AI models
- **Conversation Endpoint**: Endpoint for conversational AI model (used for real-time conversations)

## Fallback Behavior

The application is designed to work with graceful degradation:

### Greeting Generation
- **Primary**: Huawei ModelArts endpoint
- **Fallback**: Predefined greeting templates (no API needed)

### Text-to-Speech
- **Primary**: Browser `speechSynthesis` API (no cloud service needed)
- **Note**: Huawei TTS requires WebSocket which is not compatible with Vercel serverless

### Conversation AI
- **Primary**: Huawei ModelArts conversation endpoint
- **Fallback 1**: Rule-based conversation system with cognitive prompts
- **Fallback 2**: Simple predefined Q&A

### Speech Recognition
- **Primary**: Huawei SIS (required for transcription)
- **Fallback**: Mock transcript for development/testing

## Setup Guides

For detailed setup instructions, see:

- **OBS Setup**: `docs/huawei-cloud-setup.md`
- **SIS & IAM Setup**: `docs/huawei-ai-conversation-setup.md`
- **ModelArts Deployment**: `docs/huawei-modelarts-conversation-setup.md`

## Security Notes

1. **Never commit `.env.local` to git** - it's already in `.gitignore`
2. **Use different credentials** for development and production
3. **Rotate credentials regularly**
4. **Use IAM users with minimal required permissions**
5. **For Vercel**: Add all variables in Project Settings > Environment Variables

## Testing Configuration

To test if your environment variables are loaded correctly:

```bash
# Local development
npm run dev

# Then visit these test endpoints:
http://localhost:3000/api/test-env          # Check which variables are set
http://localhost:3000/api/test-token        # Test IAM token generation
http://localhost:3000/api/test-greeting     # Test greeting generation
http://localhost:3000/api/test-all          # Test all services
```

## Troubleshooting

### Common Issues

**Issue**: `Failed to get IAM token: 401`
- **Solution**: Verify username, password, domain name, and project name are correct
- **Check**: PROJECT_NAME should equal REGION

**Issue**: `ModelArts endpoint not configured`
- **Solution**: This is normal if you haven't deployed ModelArts yet. Fallback will be used.

**Issue**: `TTS synthesis failed: 502 Bad Gateway`
- **Solution**: TTS uses WebSocket which isn't supported on Vercel. Browser TTS is used instead.

**Issue**: Environment variables not loading on Vercel
- **Solution**: 
  1. Check variables are added in Vercel dashboard
  2. Redeploy after adding variables
  3. Variables don't take effect until redeployment

## Minimal Configuration (For Testing)

To test the app with minimal setup, you only need:

```bash
# Required for speech recognition
HUAWEI_SIS_PROJECT_ID=your_project_id
HUAWEI_SIS_REGION=ap-southeast-3

# Required for authentication
HUAWEI_IAM_USERNAME=your_username
HUAWEI_IAM_PASSWORD=your_password
HUAWEI_IAM_DOMAIN_NAME=your_domain
HUAWEI_IAM_PROJECT_NAME=ap-southeast-3
```

All other features will use fallbacks and the app will still function.

