# Huawei ModelArts Conversational AI Setup Guide

## Overview

This guide explains how to set up a conversational AI model on Huawei Cloud ModelArts for real-time cognitive assessment conversations.

## Available Options

### Option A: Huawei Pangu LLM (Recommended)

**Pangu** is Huawei's large language model designed for natural language understanding and generation.

**Pros:**
- Pre-trained on large conversational datasets
- Supports multi-turn conversations
- Can follow system prompts for guided conversations
- Token-based authentication (consistent with our current setup)

**Cons:**
- Requires ModelArts deployment
- May have latency (2-3 seconds per response)
- Paid service (costs per token/request)

**Setup Steps:**
1. Access Huawei Cloud ModelArts console
2. Navigate to Model Marketplace
3. Search for "Pangu" or conversational models
4. Deploy model as a real-time inference service
5. Configure endpoint and authentication
6. Test with sample conversations

### Option B: Custom Fine-Tuned Model

Deploy your own conversational model trained on cognitive assessment data.

**Pros:**
- Tailored specifically for cognitive health assessment
- Can be optimized for medical/health conversations
- Better privacy (your own model)

**Cons:**
- Requires model training expertise
- Need large conversational dataset
- More setup time and effort
- Requires model maintenance

**Setup Steps:**
1. Prepare conversational training data
2. Train model using ModelArts training jobs
3. Create AI application from trained model
4. Deploy as real-time service
5. Configure API endpoint

### Option C: Fallback to Rule-Based System

Use predefined conversation trees and templates instead of AI.

**Pros:**
- No ModelArts dependency
- Predictable and controllable
- Works immediately
- No costs

**Cons:**
- Less natural conversations
- Limited flexibility
- Can't adapt to unexpected user responses
- Requires extensive rule creation

**Implementation:**
Already included as fallback in our architecture.

## Recommended Approach: Hybrid System

**Phase 1 (Immediate):** Start with fallback rule-based system
- Implement predefined question sequences
- Use cognitive assessment prompts
- Get system working end-to-end

**Phase 2 (After ModelArts Setup):** Integrate Pangu LLM
- Deploy Pangu model to ModelArts
- Switch from rule-based to AI responses
- Keep rule-based as fallback

## ModelArts Deployment Steps (Pangu LLM)

### Prerequisites

1. Huawei Cloud account with ModelArts enabled
2. IAM user with ModelArts permissions
3. Project ID and region configured

### Step 1: Access ModelArts

```bash
1. Go to: https://console.huaweicloud.com/modelarts
2. Ensure region is set to ap-southeast-3 (or your region)
3. Navigate to "AI Applications" or "Model Marketplace"
```

### Step 2: Find Conversational Model

Search for available conversational AI models:
- Pangu-Dialog
- Pangu-NLP
- Or custom conversational models in marketplace

### Step 3: Deploy as Service

1. Click on model
2. Select "Deploy" → "Real-Time Service"
3. Configure:
   - **Service Name**: `cognitive-conversation-ai`
   - **Instance Type**: CPU or GPU (GPU for faster responses)
   - **Instance Count**: 1 (can scale later)
   - **Environment Variables**: None (use token auth)

4. Advanced Settings:
   - **Timeout**: 60 seconds
   - **Auto-scaling**: Disabled initially
   - **Health Check**: Default

5. Click **Deploy**
6. Wait 5-10 minutes for deployment

### Step 4: Get Endpoint Details

After deployment:
1. Go to "Inference Deployments" → "Real-Time Services"
2. Find your service: `cognitive-conversation-ai`
3. Copy:
   - **Endpoint URL**: `https://xxxxx.apig.ap-southeast-3.huaweicloudapis.com/v1/infers/xxxxx`
   - **Service ID**: For authentication

### Step 5: Test Endpoint

```bash
# Test with curl
curl -X POST "https://your-endpoint.apig.ap-southeast-3.huaweicloudapis.com/v1/infers/xxxxx" \
  -H "Content-Type: application/json" \
  -H "X-Auth-Token: YOUR_IAM_TOKEN" \
  -d '{
    "inputs": [
      {
        "conversation_history": [
          {"role": "user", "content": "Hello, how are you?"}
        ],
        "system_prompt": "You are a friendly AI companion."
      }
    ]
  }'
```

### Step 6: Configure Environment Variables

Add to `.env.local` and Vercel:

```bash
# ModelArts Conversational AI
HUAWEI_MODELARTS_CONVERSATION_ENDPOINT=https://xxxxx.apig.ap-southeast-3.huaweicloudapis.com/v1/infers/xxxxx
HUAWEI_MODELARTS_SERVICE_ID=xxxxx
```

## API Format

### Request Format

```json
{
  "inputs": [{
    "system_prompt": "You are a friendly AI companion assessing cognitive health...",
    "conversation_history": [
      {"role": "user", "content": "Hello"},
      {"role": "assistant", "content": "Hi! How are you today?"},
      {"role": "user", "content": "I'm good, thanks"}
    ],
    "temperature": 0.7,
    "max_tokens": 150
  }]
}
```

### Response Format

```json
{
  "outputs": [{
    "response": "That's wonderful to hear! Tell me, what did you do this morning?"
  }]
}
```

## Cost Estimates

**Pangu LLM (Estimated):**
- Deployment: $0.50 - $2.00 per hour (depending on instance)
- Inference: $0.001 - $0.01 per request
- For 10 min conversation with 10 turns: ~$0.10 - $0.20

**Note**: Costs vary by region and instance type. Check Huawei Cloud pricing.

## Fallback Strategy

If ModelArts is not available or too costly, our system includes a fallback to rule-based conversations:

1. **Primary**: Huawei ModelArts Pangu LLM
2. **Fallback 1**: Predefined conversation tree with cognitive prompts
3. **Fallback 2**: Simple Q&A mode with fixed questions

This ensures the app works regardless of ModelArts availability.

## Next Steps

1. **Research Phase**: Check if Pangu or similar models are available in your region
2. **Deploy Phase**: Follow deployment steps above
3. **Integration Phase**: Update `HUAWEI_MODELARTS_CONVERSATION_ENDPOINT` in code
4. **Testing Phase**: Test with real conversations

## Support Resources

- [Huawei ModelArts Documentation](https://support.huaweicloud.com/intl/en-us/modelarts/index.html)
- [ModelArts API Reference](https://support.huaweicloud.com/intl/en-us/api-modelarts/modelarts_03_0001.html)
- [Model Deployment Guide](https://support.huaweicloud.com/intl/en-us/engineers-modelarts/modelarts_23_0045.html)

## Current Implementation Status

- ✅ Architecture supports ModelArts integration
- ✅ Fallback system implemented
- ⏳ Awaiting ModelArts endpoint deployment
- ⏳ Needs endpoint URL and testing

