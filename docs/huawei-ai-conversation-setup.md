# Huawei Cloud AI Conversation Setup Guide

This guide will help you set up Huawei Cloud services for the AI conversation feature, which includes speech recognition, text-to-speech, and AI conversation generation.

## Table of Contents

1. [Overview](#overview)
2. [Prerequisites](#prerequisites)
3. [Service Setup](#service-setup)
4. [Configuration](#configuration)
5. [Testing](#testing)
6. [Troubleshooting](#troubleshooting)

## Overview

The AI conversation feature uses three Huawei Cloud services:

1. **Speech Interaction Service (SIS)** - For speech-to-text transcription and text-to-speech synthesis
2. **ModelArts** - For AI-powered greeting generation
3. **IAM** - For authentication and authorization

### Feature Flow

1. User clicks "Start Conversation"
2. AI generates a personalized greeting using ModelArts
3. Greeting is synthesized to speech using Huawei TTS
4. User speaks for 3-10 minutes (video and audio recorded)
5. Audio is transcribed using Huawei SIS
6. Transcript is analyzed for cognitive health markers
7. Results are displayed with recommendations

## Prerequisites

- Active Huawei Cloud account
- Project created in Huawei Cloud console
- Basic understanding of cloud services

## Service Setup

### 1. Enable Speech Interaction Service (SIS)

#### Step 1: Access SIS Console
1. Log in to [Huawei Cloud Console](https://console.huaweicloud.com)
2. Navigate to **Service List** > **AI** > **Speech Interaction Service**
3. Click **Enable Service** if not already enabled

#### Step 2: Get Project ID
1. In the SIS console, note your **Project ID** (top right)
2. Or get it from **My Credentials** > **Projects**

#### Step 3: Create IAM User (if not exists)
1. Go to **Service List** > **Management & Deployment** > **Identity and Access Management**
2. Click **Users** > **Create User**
3. Enter username (e.g., `reflexion-app-user`)
4. Set a strong password
5. Click **Next** > Assign permissions (select **SIS FullAccess**)
6. Click **Create**
7. **Important**: Save the username and password - you'll need these for token-based authentication

**Note**: We're using token-based authentication instead of AK/SK because:
- Audio files (15-50 MB) exceed the 12 MB limit for AK/SK authentication
- Tokens are cached for 24 hours, improving performance
- Simpler implementation with just username/password credentials

### 2. Enable ModelArts (Optional)

ModelArts is used for AI greeting generation. If not configured, the system falls back to predefined greetings.

#### Step 1: Access ModelArts
1. Navigate to **Service List** > **AI** > **ModelArts**
2. Click **Enable Service**

#### Step 2: Deploy a Model
1. Go to **Model Deployment** > **Real-Time Services**
2. Click **Deploy**
3. Choose a conversational AI model or upload your own
4. Note the **API Endpoint** and **API Key** after deployment

**Note**: For MVP testing, you can skip ModelArts setup. The app will use fallback greetings.

### 3. Get Region Information

1. Note your region code (e.g., `ap-southeast-1`, `ap-southeast-3`, `cn-north-4`)
2. This is visible in the console URL or service settings

## Configuration

### Step 1: Set Environment Variables

Create or update `.env.local` in your project root:

```bash
# Huawei Speech Recognition (SIS)
HUAWEI_SIS_PROJECT_ID=your_project_id_here
HUAWEI_SIS_REGION=ap-southeast-1

# Huawei IAM (Token-based Authentication)
# Get these from IAM > Users in Huawei Cloud Console
HUAWEI_IAM_USERNAME=your_iam_username
HUAWEI_IAM_PASSWORD=your_iam_password
HUAWEI_IAM_DOMAIN_NAME=your_domain_name
HUAWEI_IAM_PROJECT_NAME=your_project_name

# Huawei ModelArts (Optional - fallback greetings used if not configured)
HUAWEI_MODELARTS_ENDPOINT=https://your-endpoint.apig.ap-southeast-1.huaweicloudapis.com
HUAWEI_MODELARTS_API_KEY=your_api_key_here
```

**Where to find these values:**
- **Username**: The IAM username you created
- **Password**: The password you set for the IAM user
- **Domain Name**: Your Huawei Cloud account name (found in **My Credentials**)
- **Project Name**: Your project/region name (e.g., `ap-southeast-1`, found in **My Credentials** > **Projects**)

### Step 2: Configuration Examples

#### Example for Singapore (ap-southeast-1):
```bash
HUAWEI_SIS_PROJECT_ID=0abc123456789def
HUAWEI_SIS_REGION=ap-southeast-1
HUAWEI_IAM_USERNAME=reflexion-app-user
HUAWEI_IAM_PASSWORD=YourSecurePassword123!
HUAWEI_IAM_DOMAIN_NAME=your-account-name
HUAWEI_IAM_PROJECT_NAME=ap-southeast-1
```

#### Example for Singapore with ModelArts:
```bash
HUAWEI_SIS_PROJECT_ID=0abc123456789def
HUAWEI_SIS_REGION=ap-southeast-1
HUAWEI_IAM_USERNAME=reflexion-app-user
HUAWEI_IAM_PASSWORD=YourSecurePassword123!
HUAWEI_IAM_DOMAIN_NAME=your-account-name
HUAWEI_IAM_PROJECT_NAME=ap-southeast-1
HUAWEI_MODELARTS_ENDPOINT=https://xyz123.apig.ap-southeast-1.huaweicloudapis.com/v1/infers/abc-model
HUAWEI_MODELARTS_API_KEY=def456ghi789jkl012
```

### Step 3: Restart Development Server

```bash
npm run dev
```

## Testing

### Test the AI Conversation Flow

1. Navigate to the app in your browser
2. Go to **Daily Check-in** or **Conversation Analysis** page
3. Click **Start Conversation**

#### Expected Behavior:

✅ **With Full Configuration:**
- AI greeting is generated using ModelArts
- Greeting is spoken using Huawei TTS
- After speaking, audio is transcribed using Huawei SIS
- Transcript appears in results

✅ **Without ModelArts (Fallback):**
- Random predefined greeting is used
- Greeting is spoken using Huawei TTS
- Transcription works normally

✅ **Without Huawei Services (Full Fallback):**
- Random predefined greeting is used
- Browser text-to-speech is used
- Transcription shows error message

### Verify API Endpoints

Check browser console for successful API calls:
- `POST /api/conversation-analysis/generate-greeting` → 200 OK
- `POST /api/conversation-analysis/synthesize-speech` → 200 OK
- `POST /api/conversation-analysis/transcribe` → 200 OK

## Troubleshooting

### Issue: "Failed to transcribe audio"

**Possible Causes:**
1. SIS service not enabled
2. Incorrect Project ID or Region
3. Invalid IAM credentials (username/password/domain/project)
4. Audio format not supported
5. Audio file too large (though token-based auth supports large files)

**Solutions:**
- Verify SIS is enabled in Huawei Cloud console
- Double-check all IAM credentials in `.env.local`
- Verify username/password are correct
- Ensure IAM user has SIS permissions
- Check domain name and project name match your account
- Check browser console for detailed error messages

**Tip**: Check the server logs for "IAM token request failed" messages

### Issue: "Transcription unavailable" message

**Possible Causes:**
1. Missing or invalid environment variables
2. Network connectivity issues
3. API quota exceeded

**Solutions:**
- Restart development server after updating `.env.local`
- Check Huawei Cloud service status
- Verify API quotas in console

### Issue: Audio not playing after greeting

**Possible Causes:**
1. TTS API error
2. Audio format issue
3. Browser autoplay restrictions

**Solutions:**
- Check browser console for TTS errors
- System falls back to browser TTS automatically
- Ensure user interaction (click) before audio playback

### Issue: Greeting is always the same

**Explanation:**
- If ModelArts is not configured, predefined greetings are used
- This is normal and expected behavior

**Solution (if using ModelArts):**
- Verify MODELARTS_ENDPOINT and API_KEY are correct
- Check ModelArts service is running in console

## API Endpoints Reference

### Generate Greeting
```
POST /api/conversation-analysis/generate-greeting
GET  /api/conversation-analysis/generate-greeting
```

**Response:**
```json
{
  "success": true,
  "greeting": "Hello! It's wonderful to see you today. How are you feeling?"
}
```

### Synthesize Speech
```
POST /api/conversation-analysis/synthesize-speech
```

**Request:**
```json
{
  "text": "Hello there!",
  "speed": -10,
  "pitch": 0,
  "volume": 0
}
```

**Response:**
```json
{
  "success": true,
  "audioData": "base64_encoded_audio",
  "format": "wav",
  "duration": 1.5
}
```

### Transcribe Audio
```
POST /api/conversation-analysis/transcribe
```

**Request:**
- FormData with 'audio' file

**Response:**
```json
{
  "success": true,
  "transcript": "This is the transcribed text...",
  "confidence": 0.95,
  "wordCount": 42,
  "duration": 30
}
```

## Security Best Practices

1. **Never commit `.env.local`** to version control
2. Use **separate credentials** for development and production
3. Implement **rate limiting** in production
4. Enable **API Gateway** for additional security
5. Regularly **rotate access keys**
6. Use **IAM policies** to grant minimal required permissions

## Cost Considerations

### SIS Pricing (Approximate)
- Speech Recognition: ~$0.006 per minute
- Text-to-Speech: ~$0.016 per 1000 characters

### ModelArts Pricing
- Varies by model and instance type
- Consider using **batch inference** for lower costs
- Use **auto-scaling** to optimize costs

### Recommendations
- Monitor usage in Huawei Cloud console
- Set up billing alerts
- Use free tier where available
- Test with short conversations during development

## Additional Resources

- [Huawei SIS Documentation](https://support.huaweicloud.com/intl/en-us/sis/index.html)
- [ModelArts Documentation](https://support.huaweicloud.com/intl/en-us/modelarts/index.html)
- [IAM Best Practices](https://support.huaweicloud.com/intl/en-us/usermanual-iam/iam_01_0001.html)
- [Huawei Cloud Console](https://console.huaweicloud.com)

## Support

If you encounter issues:
1. Check browser console for errors
2. Verify environment variables
3. Test API endpoints using Postman or curl
4. Review Huawei Cloud service logs
5. Contact Huawei Cloud support for service-specific issues

---

**Last Updated**: October 2025

