# Huawei Cloud OBS Setup Guide

This guide will walk you through setting up Huawei Cloud Object Storage Service (OBS) for the Reflexion app to store movement analysis videos and results.

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Create Huawei Cloud Account](#create-huawei-cloud-account)
3. [Create OBS Bucket](#create-obs-bucket)
4. [Generate Access Credentials](#generate-access-credentials)
5. [Configure Environment Variables](#configure-environment-variables)
6. [Configure Vercel Deployment](#configure-vercel-deployment)
7. [Security Best Practices](#security-best-practices)
8. [Troubleshooting](#troubleshooting)

## Prerequisites

- Email address for account registration
- Valid payment method (credit card)
- Basic understanding of cloud storage concepts
- Access to your Vercel project (for production deployment)

## Create Huawei Cloud Account

### Step 1: Register for Huawei Cloud

1. Go to [Huawei Cloud](https://www.huaweicloud.com/intl/en-us/)
2. Click on "Sign Up" in the top right corner
3. Fill in your email address and create a password
4. Verify your email address
5. Complete the account information form
6. Add a payment method (required for OBS usage)

### Step 2: Choose Your Region

Select the region closest to your users for optimal performance:
- **AP-Singapore** (`ap-southeast-1`): Good for Asia-Pacific users
- **AP-Bangkok** (`ap-southeast-2`): Southeast Asia
- **AP-Hong Kong** (`ap-southeast-3`): East Asia
- **CN-North-4** (`cn-north-4`): China (requires ICP filing)

**Note**: Make sure to use the same region consistently throughout this setup.

## Create OBS Bucket

### Step 1: Navigate to OBS Console

1. Log in to [Huawei Cloud Console](https://console.huaweicloud.com/)
2. Search for "OBS" in the search bar or find it under "Storage" section
3. Click on "Object Storage Service"

### Step 2: Create Bucket

1. Click "Create Bucket" button
2. Fill in the bucket details:
   - **Bucket Name**: Choose a unique name (e.g., `reflexion-movement-analysis`)
     - Must be globally unique across all Huawei Cloud
     - Only lowercase letters, numbers, hyphens allowed
     - 3-63 characters long
   - **Region**: Select your chosen region (e.g., `ap-southeast-1`)
   - **Storage Class**: Select "Standard" (for frequently accessed data)
   - **Bucket Policy**: Select "Private" (recommended for security)
   - **Default Encryption**: Enable "SSE-KMS" for enhanced security (optional but recommended)

3. Click "Create Now"

### Step 3: Configure CORS (Required for Web Upload)

1. Open your newly created bucket
2. Go to "Permissions" tab
3. Click on "CORS Rules"
4. Click "Create"
5. Add the following CORS configuration:

```json
{
  "CORSRules": [
    {
      "AllowedOrigin": ["*"],
      "AllowedMethod": ["GET", "PUT", "POST", "DELETE", "HEAD"],
      "AllowedHeader": ["*"],
      "ExposeHeader": ["ETag"],
      "MaxAgeSeconds": 3600
    }
  ]
}
```

**For Production**: Replace `"*"` in `AllowedOrigin` with your actual domain:
```json
"AllowedOrigin": ["https://your-app.vercel.app"]
```

6. Click "OK" to save

## Generate Access Credentials

### Step 1: Create Access Key

1. Click on your username in the top right corner
2. Select "My Credentials"
3. Go to "Access Keys" tab
4. Click "Create Access Key"
5. **IMPORTANT**: Download the credentials CSV file immediately
   - This is your only chance to download the Secret Access Key
   - Store it securely (password manager recommended)

The file contains:
- **Access Key ID**: Public identifier (like a username)
- **Secret Access Key**: Private key (like a password) - **Keep this secret!**

### Step 2: Create IAM User (Recommended for Production)

For better security, create a dedicated IAM user with limited permissions:

1. Go to "Identity and Access Management (IAM)" console
2. Click "Users" → "Create User"
3. Set username (e.g., `reflexion-obs-user`)
4. Enable "Programmatic access"
5. Click "Next"
6. Select "Attach policies directly"
7. Search for and select:
   - `OBS Administrator` (or create a custom policy with only required permissions)
8. Click "Next" → "Create User"
9. Download the access credentials

### Custom IAM Policy (Least Privilege)

For maximum security, create a custom policy with minimum required permissions:

```json
{
  "Version": "1.1",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "obs:object:PutObject",
        "obs:object:GetObject",
        "obs:object:DeleteObject",
        "obs:bucket:ListBucket"
      ],
      "Resource": [
        "OBS:*:*:bucket:reflexion-movement-analysis",
        "OBS:*:*:object:reflexion-movement-analysis/*"
      ]
    }
  ]
}
```

Replace `reflexion-movement-analysis` with your actual bucket name.

## Configure Environment Variables

### Local Development

1. Create a `.env.local` file in the project root:

```bash
# Huawei Cloud OBS Configuration
HUAWEI_OBS_ACCESS_KEY_ID=your_access_key_id_here
HUAWEI_OBS_SECRET_ACCESS_KEY=your_secret_access_key_here
HUAWEI_OBS_ENDPOINT=obs.ap-southeast-1.myhuaweicloud.com
HUAWEI_OBS_BUCKET_NAME=reflexion-movement-analysis
```

2. Replace the values:
   - `HUAWEI_OBS_ACCESS_KEY_ID`: Your Access Key ID from the credentials file
   - `HUAWEI_OBS_SECRET_ACCESS_KEY`: Your Secret Access Key from the credentials file
   - `HUAWEI_OBS_ENDPOINT`: Your region's OBS endpoint (see table below)
   - `HUAWEI_OBS_BUCKET_NAME`: Your bucket name

### OBS Endpoints by Region

| Region | Endpoint |
|--------|----------|
| AP-Singapore | `obs.ap-southeast-1.myhuaweicloud.com` |
| AP-Bangkok | `obs.ap-southeast-2.myhuaweicloud.com` |
| AP-Hong Kong | `obs.ap-southeast-3.myhuaweicloud.com` |
| CN-North-4 | `obs.cn-north-4.myhuaweicloud.com` |
| CN-East-3 | `obs.cn-east-3.myhuaweicloud.com` |

Full list: [Huawei OBS Endpoints](https://support.huaweicloud.com/intl/en-us/productdesc-obs/obs_03_0152.html)

### Test Your Configuration

Run the development server to test:

```bash
npm run dev
```

Navigate to the Movement Analysis page and try recording and saving a video.

## Configure Vercel Deployment

### Step 1: Add Environment Variables to Vercel

1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Select your project
3. Go to "Settings" → "Environment Variables"
4. Add each environment variable:

| Name | Value | Environment |
|------|-------|-------------|
| `HUAWEI_OBS_ACCESS_KEY_ID` | Your Access Key ID | Production, Preview, Development |
| `HUAWEI_OBS_SECRET_ACCESS_KEY` | Your Secret Access Key | Production, Preview, Development |
| `HUAWEI_OBS_ENDPOINT` | Your OBS endpoint | Production, Preview, Development |
| `HUAWEI_OBS_BUCKET_NAME` | Your bucket name | Production, Preview, Development |

**Important**: 
- Mark `HUAWEI_OBS_SECRET_ACCESS_KEY` as sensitive
- These variables are server-side only (no `NEXT_PUBLIC_` prefix)
- Apply to all environments or configure separately for production/preview

### Step 2: Redeploy

1. Go to "Deployments" tab
2. Click "..." on the latest deployment
3. Select "Redeploy"
4. Check "Use existing Build Cache" (optional, for faster builds)
5. Click "Redeploy"

Your app will now have access to Huawei Cloud OBS in production!

## Security Best Practices

### 1. Access Key Management

- **Never commit credentials to Git**: Always use environment variables
- **Rotate keys regularly**: Change access keys every 90 days
- **Use IAM users**: Don't use root account credentials
- **Principle of least privilege**: Grant only necessary permissions

### 2. Bucket Security

- **Keep bucket private**: Use bucket policies to restrict access
- **Enable encryption**: Use SSE-KMS for data at rest
- **Enable versioning**: Protect against accidental deletion (optional)
- **Enable logging**: Track access to your bucket

### 3. Network Security

- **HTTPS only**: OBS SDK uses HTTPS by default
- **CORS configuration**: Restrict to your domain in production
- **Signed URLs**: Use temporary URLs (expires in 1 hour by default)

### 4. Monitoring

1. Enable OBS logging:
   - Go to bucket settings
   - Enable "Logging"
   - Set target bucket for logs

2. Set up CloudWatch alarms (optional):
   - Monitor bucket size
   - Track request counts
   - Alert on unusual activity

### 5. Cost Management

- **Set lifecycle rules**: Auto-delete old videos after X days
- **Monitor usage**: Check OBS console regularly
- **Set budget alerts**: Configure cost alerts in Huawei Cloud

Example lifecycle rule to delete videos older than 90 days:

1. Go to bucket → "Lifecycle Rules"
2. Click "Create"
3. Configure:
   - **Prefix**: `movement-analysis/videos/`
   - **Delete after**: 90 days
   - **Apply to**: Current versions

## Troubleshooting

### Common Issues

#### 1. "Access Denied" Error

**Cause**: Incorrect credentials or insufficient permissions

**Solution**:
- Verify Access Key ID and Secret Access Key
- Check IAM user permissions
- Ensure bucket policy allows access

#### 2. "Bucket Not Found" Error

**Cause**: Incorrect bucket name or region

**Solution**:
- Verify bucket name matches environment variable
- Ensure endpoint matches bucket region
- Check bucket exists in OBS console

#### 3. "SignatureDoesNotMatch" Error

**Cause**: Incorrect Secret Access Key or time sync issue

**Solution**:
- Verify Secret Access Key is correct
- Check server time is synchronized
- Regenerate access keys if needed

#### 4. CORS Errors in Browser

**Cause**: CORS not configured or incorrect configuration

**Solution**:
- Configure CORS rules in bucket settings
- Add your domain to AllowedOrigin
- Clear browser cache and retry

#### 5. Upload Timeout

**Cause**: Large video files or slow connection

**Solution**:
- Check network connection
- Reduce video quality/duration
- Increase timeout in OBS client (if needed)

### Testing the Integration

#### Test Upload Locally

1. Start development server: `npm run dev`
2. Navigate to Movement Analysis page
3. Record a short video
4. Click "Analyze"
5. Click "Save to Huawei Cloud"
6. Check browser console for errors
7. Verify upload in OBS console:
   - Go to bucket
   - Navigate to `movement-analysis/videos/`
   - You should see the uploaded video

#### Verify API Routes

Test API endpoints directly:

```bash
# Upload test (requires FormData)
curl -X POST http://localhost:3000/api/movement-analysis/upload \
  -F "video=@test-video.webm" \
  -F "results={}" \
  -F "userId=test-user" \
  -F "taskType=finger-tap" \
  -F "timestamp=$(date -u +%Y-%m-%dT%H:%M:%SZ)"

# List analyses
curl http://localhost:3000/api/movement-analysis/list?userId=test-user

# Get analysis with signed URL
curl "http://localhost:3000/api/movement-analysis/123?videoKey=movement-analysis/videos/test-user/2024-01-01.webm"
```

### Getting Help

- **Huawei Cloud Support**: [Support Portal](https://console.huaweicloud.com/ticket/)
- **OBS Documentation**: [Official Docs](https://support.huaweicloud.com/intl/en-us/obs/index.html)
- **SDK Documentation**: [Node.js SDK](https://support.huaweicloud.com/intl/en-us/sdk-nodejs-devg-obs/obs_29_0001.html)

## Next Steps

After successful setup:

1. **Test thoroughly**: Record and save multiple videos
2. **Monitor costs**: Check OBS billing regularly
3. **Set up backups**: Configure bucket replication (optional)
4. **Implement cleanup**: Set lifecycle rules to manage storage costs
5. **Document for team**: Share credentials securely with team members

## Appendix: Environment Variables Quick Reference

```bash
# .env.local (Development)
HUAWEI_OBS_ACCESS_KEY_ID=<your-access-key-id>
HUAWEI_OBS_SECRET_ACCESS_KEY=<your-secret-access-key>
HUAWEI_OBS_ENDPOINT=obs.ap-southeast-1.myhuaweicloud.com
HUAWEI_OBS_BUCKET_NAME=reflexion-movement-analysis
```

Remember to add these same variables to:
- Vercel Dashboard (for production)
- Team members' local `.env.local` files (for development)
- CI/CD environment (if applicable)

---

**Last Updated**: October 2025  
**Version**: 1.0  
**Author**: Reflexion Development Team

