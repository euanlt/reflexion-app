# Troubleshooting Huawei Cloud TTS 502 Error

## Current Issue

**Error**: `502 Bad Gateway` when calling Huawei TTS API  
**Location**: `/api/conversation-analysis/synthesize-speech`

## Possible Causes

### 1. TTS Not Available in Region ⚠️

Huawei TTS might not be available in **ap-southeast-3**. 

**Check TTS Availability:**
1. Go to: https://console.huaweicloud.com/sis
2. Look at the region selector (top-right)
3. Switch to your region (ap-southeast-3)
4. Check if **"Text to Speech"** is listed as available

**If TTS is not available in your region:**
- Option A: Switch to a region where TTS is available (e.g., `ap-southeast-1` or `cn-north-4`)
- Option B: Use browser TTS only (already implemented as fallback)

### 2. TTS Service Not Enabled

The SIS service might be enabled, but TTS specifically might not be activated.

**To Enable TTS:**
1. Go to: https://console.huaweicloud.com/sis
2. Navigate to **"Text to Speech"**
3. Click **"Enable Service"** if prompted
4. Wait a few minutes for activation

### 3. Wrong Voice Property

The voice `english_camila_common` might not be available.

**To Check Available Voices:**
1. Go to: https://support.huaweicloud.com/intl/en-us/api-sis/sis_03_0093.html
2. Look for the list of available English voices
3. Common options:
   - `english_camila_common` (female)
   - `english_amelia_common` (female)
   - `english_male_common` (male)

**Update voice in `lib/services/huawei-tts.service.ts`:**
```typescript
property: 'english_amelia_common', // Try different voice
```

### 4. Project ID Not Authorized for TTS

Your project might not have TTS permissions.

**To Fix:**
1. Go to **IAM** > **Users** > Select your IAM user
2. Go to **Permissions** tab
3. Ensure user has:
   - ✅ **SIS FullAccess** OR
   - ✅ **SIS CommonOperations** (includes TTS)
4. If not, click **"Authorize"** and add the permission

## Diagnostic Steps

### Step 1: Deploy Latest Code to Vercel

```bash
git add .
git commit -m "Add detailed TTS logging"
git push origin main
```

Wait for Vercel to redeploy (1-2 minutes).

### Step 2: Test and Check Logs

1. Go to your Vercel app: https://reflexion-app.vercel.app/conversation-analysis
2. Click **"Start Conversation"**
3. Go to Vercel Dashboard > Your Project > **Logs** (Real-time)
4. Look for logs starting with `[TTS Service]` or `[TTS API]`

**What to Look For:**
```
[TTS Service] Request URL: https://sis-ext.ap-southeast-3.myhuaweicloud.com/v1/PROJECT_ID/tts
[TTS Service] Request body: {...}
[TTS Service] Response status: 502 Bad Gateway
[TTS Service] Error response: <exact error message from Huawei>
```

### Step 3: Interpret the Error

The error response from Huawei will tell us exactly what's wrong:

**Common Error Messages:**

| Error Message | Cause | Solution |
|--------------|-------|----------|
| `Service not available in this region` | TTS not supported in ap-southeast-3 | Change region or use browser TTS |
| `Invalid voice property` | Voice doesn't exist | Update voice name |
| `Service not subscribed` | TTS not enabled | Enable TTS in console |
| `Insufficient permissions` | IAM user lacks permission | Add SIS FullAccess permission |

## Solutions

### Solution A: Change Region (If TTS Not Available)

**Update `.env.local` and Vercel env vars:**
```bash
HUAWEI_SIS_REGION=ap-southeast-1  # Change to region with TTS support
```

**Note**: You might need to:
- Create a new project in the new region
- Update `HUAWEI_SIS_PROJECT_ID` accordingly

### Solution B: Use Different Voice

**Edit `lib/services/huawei-tts.service.ts`:**
```typescript
const requestBody = {
  text,
  config: {
    audio_format: 'wav',
    sample_rate: '16000',
    property: 'english_amelia_common', // Try this voice
  },
};
```

### Solution C: Test Locally First

**Test on localhost before deploying:**
```bash
# Make sure .env.local has all correct values
npm run dev

# Visit: http://localhost:3000/api/test-tts-debug
# This will test different TTS formats
```

### Solution D: Use Browser TTS Only (Temporary)

If Huawei TTS keeps failing, the app already falls back to browser TTS automatically. This is working on Vercel currently.

**To verify browser TTS is being used:**
- Open browser console (F12)
- Look for: `"Fallback to browser TTS"` or similar message

## Testing TTS Locally

### Test 1: Check TTS Endpoint

```bash
curl -X POST "https://sis-ext.ap-southeast-3.myhuaweicloud.com/v1/YOUR_PROJECT_ID/tts" \
  -H "Content-Type: application/json" \
  -H "X-Auth-Token: YOUR_TOKEN" \
  -d '{
    "text": "Hello",
    "config": {
      "audio_format": "wav",
      "sample_rate": "16000",
      "property": "english_camila_common"
    }
  }'
```

**Expected Response (Success):**
```json
{
  "trace_id": "...",
  "result": {
    "data": "<base64_audio_data>"
  }
}
```

**Expected Response (Error):**
```json
{
  "error_code": "SIS.XXX",
  "error_msg": "Service not available in this region"
}
```

### Test 2: Use Debug Endpoint

```
http://localhost:3000/api/test-tts-debug
```

This endpoint tests 3 different request formats and tells you which one works.

## Quick Fix Summary

1. **Deploy latest code** (has detailed logging)
2. **Check Vercel logs** for exact error message
3. **Based on error**:
   - "Service not available" → Change region or disable TTS
   - "Invalid voice" → Update voice property
   - "Not subscribed" → Enable TTS in Huawei console
   - "No permission" → Add SIS FullAccess to IAM user

## Current Fallback Behavior ✅

**Good news**: Your app already handles TTS failures gracefully!

If Huawei TTS fails:
- ✅ Falls back to browser `speechSynthesis` automatically
- ✅ User still hears the AI greeting
- ✅ No crash or broken experience

**So the app is working**, just not using Huawei TTS yet. We need to fix the 502 to enable Huawei TTS.

## Next Steps

1. Deploy the updated code to Vercel
2. Check the new detailed logs
3. Share the `[TTS Service] Error response:` log with me
4. We'll fix based on the exact error message from Huawei

---

## Additional Resources

- [Huawei TTS API Docs](https://support.huaweicloud.com/intl/en-us/api-sis/sis_03_0093.html)
- [SIS Service Regions](https://support.huaweicloud.com/intl/en-us/productdesc-sis/sis_01_0006.html)
- [Voice Property List](https://support.huaweicloud.com/intl/en-us/api-sis/sis_03_0106.html)

