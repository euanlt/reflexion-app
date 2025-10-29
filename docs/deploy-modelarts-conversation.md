# Deploy Conversational AI Model on Huawei ModelArts

## Overview

This guide walks you through deploying a conversational AI model on Huawei Cloud ModelArts for the ReflexionApp conversation analysis feature.

## Prerequisites

- Huawei Cloud account with ModelArts service enabled
- IAM user with ModelArts permissions
- Project created in `ap-southeast-3` (or your preferred region)

---

## Option 1: Deploy Pre-trained Model from AI Gallery (Recommended - Easiest)

### Step 1: Access AI Gallery

1. Log in to **Huawei Cloud Console**: https://console.huaweicloud.com/modelarts
2. Navigate to **ModelArts** → **AI Gallery**
3. In the search bar, search for: **"conversational AI"** or **"dialogue"** or **"chatbot"**

### Step 2: Choose a Model

**Recommended models for English conversation:**

1. **Option A: Generic Conversational Model**
   - Search: "conversational" or "dialogue"
   - Look for models with "English" support
   - Check model description for conversational capabilities

2. **Option B: Pangu Models** (if available)
   - Note: Pangu models are primarily Chinese but may support English
   - Check if "Pangu-Chat" or similar variants exist

3. **What to look for in model details:**
   - ✅ Input: Text prompt
   - ✅ Output: Text response
   - ✅ Language: English (or multilingual)
   - ✅ Use case: Dialogue, conversation, or QA

### Step 3: Deploy the Model

1. Click on your chosen model
2. Click **"Deploy"** or **"Subscribe & Deploy"** button
3. Configure deployment settings:
   
   **Basic Configuration:**
   - **Deployment Name**: `reflexion-conversation-ai`
   - **Deployment Type**: Select **"Real-time Services"**
   - **Version**: Latest stable version
   
   **Resource Configuration:**
   - **Specifications**: 
     - For testing: `1 vCPU, 4GB` (cheapest option)
     - For production: `2 vCPU, 8GB` or higher
   - **Instances**: `1` (for testing)
   - **Auto Scaling**: Off (for testing)
   
   **Advanced Settings:**
   - **Timeout**: 300 seconds
   - Leave other settings as default

4. Click **"Next"** and review the configuration
5. Click **"Submit"** to deploy

### Step 4: Wait for Deployment

- Deployment typically takes **5-10 minutes**
- Status will change from "Deploying" → "Running"
- You can monitor progress in **ModelArts** → **Real-time Services**

### Step 5: Get the API Endpoint

Once status is **"Running"**:

1. Go to **ModelArts** → **Real-time Services**
2. Click on your service name (`reflexion-conversation-ai`)
3. Go to the **"Usage Guides"** tab
4. Copy the **API URL** (it will look like):
   ```
   https://infer-modelarts-ap-southeast-1.modelarts-intl.myhuaweicloud.com/v1/infers/xxxxx-xxxx-xxxx
   ```

5. **IMPORTANT**: Check the **"Prediction Input"** section to see the expected format
   - Common formats:
     ```json
     {"text": "your prompt here"}
     ```
     or
     ```json
     {"data": {"req_data": [{"text": "your prompt"}]}}
     ```
   - Note down the exact format shown

### Step 6: Add to Environment Variables

1. Open your `.env.local` file
2. Add (or update):
   ```bash
   HUAWEI_MODELARTS_CONVERSATION_ENDPOINT=https://infer-modelarts-ap-southeast-1.modelarts-intl.myhuaweicloud.com/v1/infers/YOUR_ID_HERE
   ```
3. Save the file
4. **Restart your dev server**: Stop (Ctrl+C) and run `npm run dev`

---

## Option 2: Deploy Custom Model (Advanced)

If you can't find a suitable pre-trained model, you can deploy your own.

### Step 2.1: Get a Model

**Option A: Use Hugging Face Model**
1. Find a conversational model on Hugging Face (e.g., `facebook/blenderbot-400M-distill`)
2. Download the model files

**Option B: Use Open Source Model**
- GPT-2 variants
- DialoGPT
- BLOOM (multilingual)

### Step 2.2: Prepare Model for ModelArts

1. Convert model to ModelArts-compatible format
2. Create `config.json` and `model` files
3. Package according to ModelArts requirements

**Note**: This is complex and requires ML expertise. **Use Option 1 if possible.**

### Step 2.3: Upload to OBS

1. Create OBS bucket if you don't have one
2. Upload model files to OBS
3. Note the OBS path

### Step 2.4: Import Model to ModelArts

1. Go to **ModelArts** → **Model Management** → **Models**
2. Click **"Import"**
3. Fill in model details:
   - **Name**: `custom-conversation-model`
   - **Meta Model Source**: OBS path to your model
   - **AI Engine**: PyTorch or TensorFlow (depending on your model)
   - **Input/Output Configuration**: Define text input/output

4. Click **"Next"** and **"Submit"**

### Step 2.5: Deploy the Model

Follow the same steps as Option 1, Step 3 onwards.

---

## Testing Your Deployment

### Quick Test in Console

1. In ModelArts console, go to your real-time service
2. Click **"Prediction"** tab
3. Enter test input according to the format shown
4. Click **"Predict"**
5. Verify you get a text response

### Test with ReflexionApp

1. Ensure endpoint is in `.env.local`
2. Restart dev server
3. Visit: `http://localhost:3000/api/test-modelarts`
4. Check if any format returns status 200
5. Check response contains generated text

---

## Troubleshooting

### Problem: Can't find suitable English conversational model

**Solution**:
1. Try searching for: "text generation", "language model", "NLP"
2. Filter by language: English
3. Check model card for "conversational" or "dialogue" capabilities
4. Contact Huawei support to request specific models

### Problem: Model returns Chinese text

**Solution**:
1. Add English instruction prefix to prompts:
   ```
   "Please respond in English: [user's actual prompt]"
   ```
2. Or switch to a different model that supports English better

### Problem: Deployment fails

**Solution**:
1. Check your account has sufficient quota for ModelArts
2. Verify region availability (try ap-southeast-1 or ap-southeast-3)
3. Try smaller resource specifications
4. Check account balance

### Problem: Model is too slow (>10 seconds)

**Solution**:
1. Increase instance specifications (more vCPU/memory)
2. Enable auto-scaling
3. Consider using a smaller/faster model

---

## Cost Estimation

**Typical costs for testing** (approximate, check current pricing):
- **Small instance** (1 vCPU, 4GB): ~$0.10-0.20 per hour
- **Medium instance** (2 vCPU, 8GB): ~$0.20-0.40 per hour

**Tips to minimize costs**:
- Start with smallest instance
- Stop service when not in use (can restart when needed)
- Use auto-scaling to scale to 0 during idle times
- Monitor usage in Billing Center

---

## Next Steps After Deployment

1. **Get the endpoint URL** from Usage Guides tab
2. **Add to `.env.local`**:
   ```bash
   HUAWEI_MODELARTS_CONVERSATION_ENDPOINT=https://your-endpoint-here
   ```
3. **Note the input format** from the Prediction Input section
4. **Test the endpoint**: Visit `http://localhost:3000/api/test-modelarts`
5. **Update the code** to match the discovered format
6. **Test conversation**: Go to `/conversation-analysis` and try it out

---

## Recommended Models (if available)

Search AI Gallery for these (availability varies by region):

1. **GPT-style models**: Good for open-ended conversation
2. **BERT-based dialogue models**: Good for structured Q&A
3. **T5 variants**: Good for instruction following
4. **Dialogue-focused models**: Specifically trained for conversation

---

## Support Resources

- **ModelArts Documentation**: https://support.huaweicloud.com/intl/en-us/modelarts/index.html
- **AI Gallery**: https://developer.huaweicloud.com/intl/en-us/develop/aigallery
- **Support**: Contact Huawei Cloud support for model recommendations

---

## Summary Checklist

- [ ] Access ModelArts AI Gallery
- [ ] Search for English conversational/dialogue model
- [ ] Deploy as Real-time Service
- [ ] Wait for "Running" status
- [ ] Copy API endpoint URL
- [ ] Check input format in Usage Guides
- [ ] Add endpoint to `.env.local`
- [ ] Restart dev server
- [ ] Test with `/api/test-modelarts`
- [ ] Update code if needed
- [ ] Test full conversation flow

**Once deployed, come back and share:**
1. The endpoint URL (add to `.env.local`)
2. The expected input format from "Usage Guides"
3. Test results from `/api/test-modelarts`

