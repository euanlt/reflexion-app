# AI Conversation Analysis - Using Huawei Cloud

## Updated Phase 4: AI Conversation Partner with Huawei Cloud

**Changed from:** Azure OpenAI  
**Changed to:** Huawei Cloud Pangu LLM / Conversational Bot Service

## Huawei Cloud Options for Conversational AI

### Option 1: Huawei Pangu Large Language Model ⭐ **RECOMMENDED**

**What it is:**
- Huawei's large language model (similar to GPT-4)
- Supports natural conversations in Chinese and English
- Available via ModelArts API
- Good for open-ended, adaptive conversations

**Setup:**
1. Enable ModelArts service in Huawei Cloud Console
2. Access Pangu NLP models
3. Get API credentials (IAM token)

**Cost:** ~$0.015-0.02 per 1,000 tokens  
**Estimated:** $50-75/month for 1,000 users × 5 conversations

### Option 2: Huawei Conversational Bot Service (CBS)

**What it is:**
- Pre-built dialog management system
- Intent recognition and slot filling
- Good for structured conversations with defined flows
- Easier to set up than Pangu

**Setup:**
1. Enable CBS service
2. Create a bot configuration
3. Define intents and responses
4. Get bot ID

**Cost:** ~$0.01 per conversation  
**Estimated:** $50/month for 1,000 users × 5 conversations

## Implementation Files

### 1. IAM Authentication Service

**New file:** `lib/services/huawei-iam-auth.service.ts`

```typescript
/**
 * Huawei Cloud IAM Authentication
 * Generates tokens for accessing Huawei Cloud services
 */
export class HuaweiIAMAuthService {
  
  private tokenCache: { token: string; expires: number } | null = null;
  
  /**
   * Get IAM token for API authentication
   */
  async getToken(): Promise<string> {
    // Check cache
    if (this.tokenCache && this.tokenCache.expires > Date.now()) {
      return this.tokenCache.token;
    }
    
    const endpoint = 'https://iam.myhuaweicloud.com/v3/auth/tokens';
    
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        auth: {
          identity: {
            methods: ['password'],
            password: {
              user: {
                domain: {
                  name: process.env.HUAWEI_IAM_DOMAIN || 'myhuaweicloud.com'
                },
                name: process.env.HUAWEI_IAM_USERNAME,
                password: process.env.HUAWEI_IAM_PASSWORD
              }
            }
          },
          scope: {
            project: {
              id: process.env.HUAWEI_MODELARTS_PROJECT_ID
            }
          }
        }
      })
    });
    
    const token = response.headers.get('X-Subject-Token');
    if (!token) {
      throw new Error('Failed to get IAM token');
    }
    
    // Cache token (valid for 24 hours typically)
    this.tokenCache = {
      token,
      expires: Date.now() + (23 * 60 * 60 * 1000) // 23 hours
    };
    
    return token;
  }
}
```

### 2. Conversation Partner Service (Huawei Version)

**New file:** `lib/ai/conversation-partner.service.ts`

```typescript
import { HuaweiIAMAuthService } from '../services/huawei-iam-auth.service';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

export class ConversationPartnerService {
  
  private authService = new HuaweiIAMAuthService();
  
  /**
   * Generate AI response using Huawei Pangu LLM
   */
  async generateResponse(
    conversationType: string,
    conversationHistory: Message[],
    userMessage: string
  ): Promise<string> {
    
    const systemPrompt = this.getSystemPrompt(conversationType);
    const token = await this.authService.getToken();
    
    // Build conversation context
    const prompt = this.buildPrompt(systemPrompt, conversationHistory, userMessage);
    
    // Call Huawei Pangu API
    const endpoint = `${process.env.HUAWEI_MODELARTS_ENDPOINT}/v1/${process.env.HUAWEI_MODELARTS_PROJECT_ID}/infers/pangu-nlp`;
    
    try {
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Auth-Token': token
        },
        body: JSON.stringify({
          inputs: [{
            prompt: prompt,
            max_tokens: 150,
            temperature: 0.7,
            top_p: 0.9,
            frequency_penalty: 0.3,
            presence_penalty: 0.3
          }]
        })
      });
      
      if (!response.ok) {
        throw new Error(`Pangu API error: ${response.status}`);
      }
      
      const data = await response.json();
      
      // Extract response text
      return data.outputs?.[0]?.text?.trim() || 
             "I'm sorry, I didn't catch that. Could you repeat?";
             
    } catch (error) {
      console.error('Error calling Huawei Pangu:', error);
      return "I'm having trouble responding right now. Let's try again.";
    }
  }
  
  /**
   * Alternative: Use Conversational Bot Service (CBS)
   * Simpler setup, good for structured conversations
   */
  async generateResponseWithCBS(
    conversationType: string,
    userMessage: string,
    sessionId: string
  ): Promise<string> {
    
    const token = await this.authService.getToken();
    
    // CBS endpoint varies by region
    const region = process.env.HUAWEI_OBS_ENDPOINT?.split('.')[1] || 'ap-southeast-1';
    const endpoint = `https://cbs.${region}.myhuaweicloud.com`;
    
    try {
      const response = await fetch(`${endpoint}/v1/cbs/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Auth-Token': token
        },
        body: JSON.stringify({
          bot_id: process.env.HUAWEI_CBS_BOT_ID,
          session_id: sessionId,
          query: userMessage,
          user_id: `cognitive-assessment-${Date.now()}`
        })
      });
      
      if (!response.ok) {
        throw new Error(`CBS API error: ${response.status}`);
      }
      
      const data = await response.json();
      return data.response || "I'm sorry, I didn't understand that.";
      
    } catch (error) {
      console.error('Error calling Huawei CBS:', error);
      return "Let me try to understand better. Could you rephrase that?";
    }
  }
  
  /**
   * Build prompt with context
   */
  private buildPrompt(
    systemPrompt: string,
    history: Message[],
    userMessage: string
  ): string {
    
    // Combine system prompt, history, and current message
    let prompt = `${systemPrompt}\n\nConversation:\n`;
    
    // Add conversation history (last 5 exchanges for context)
    const recentHistory = history.slice(-10);
    for (const msg of recentHistory) {
      if (msg.role === 'user') {
        prompt += `User: ${msg.content}\n`;
      } else {
        prompt += `Assistant: ${msg.content}\n`;
      }
    }
    
    // Add current user message
    prompt += `User: ${userMessage}\nAssistant:`;
    
    return prompt;
  }
  
  /**
   * System prompts for different conversation types
   * Optimized for cognitive assessment
   */
  private getSystemPrompt(type: string): string {
    const prompts = {
      'memory-recall': `You are a friendly AI companion helping assess memory through conversation. 
        Ask about recent activities and encourage detailed stories. Gently probe for temporal details 
        (when, where, who) without being clinical. Be warm, non-judgmental, and natural.
        Keep your responses short and conversational (1-2 sentences). 
        Example: "That sounds interesting! What time of day was that?"`,
        
      'current-events': `You are discussing current events in a friendly way. 
        Ask about news the user has heard, their opinions, and understanding. 
        Keep it conversational and engaging without being political.
        Keep responses brief (1-2 sentences).
        Example: "What did you find most interesting about that?"`,
        
      'problem-solving': `You are helping the user think through a planning scenario. 
        Ask questions that require executive function and organization, but keep it casual.
        Focus on practical details and steps. Keep responses focused (1-2 sentences).
        Example: "Good idea! What would you do first?"`,
        
      'storytelling': `You are an interested listener encouraging stories from the past. 
        Ask follow-up questions about emotions, context, and specific details.
        Show genuine interest and warmth. Keep your questions brief.
        Example: "How did that make you feel?"`,
        
      'open': `You are a friendly, empathetic conversational partner. 
        Chat naturally about any topics the user brings up. Be engaging and supportive.
        Keep responses conversational and brief (1-2 sentences).
        Example: "Tell me more about that!"
`
    };
    
    return prompts[type] || prompts['open'];
  }
}
```

## Environment Variables

Add these to `.env.local`:

```bash
# Existing Huawei OBS config...
HUAWEI_OBS_ACCESS_KEY_ID=your_access_key
HUAWEI_OBS_SECRET_ACCESS_KEY=your_secret_key
HUAWEI_OBS_ENDPOINT=obs.ap-southeast-1.myhuaweicloud.com
HUAWEI_OBS_BUCKET_NAME=your_bucket_name

# NEW: Huawei Cloud IAM Authentication
HUAWEI_IAM_DOMAIN=myhuaweicloud.com
HUAWEI_IAM_USERNAME=your_iam_username
HUAWEI_IAM_PASSWORD=your_iam_password

# NEW: Huawei ModelArts (for Pangu LLM)
HUAWEI_MODELARTS_ENDPOINT=https://modelarts.ap-southeast-1.myhuaweicloud.com
HUAWEI_MODELARTS_PROJECT_ID=your_project_id

# OPTIONAL: Huawei CBS (if using Conversational Bot Service)
HUAWEI_CBS_BOT_ID=your_bot_id
```

## Setup Guide for Huawei Pangu

### Step 1: Enable ModelArts Service

1. Go to [Huawei Cloud Console](https://console.huaweicloud.com/)
2. Search for "ModelArts"
3. Click "Enable Service"
4. Choose your region (same as OBS for consistency)

### Step 2: Access Pangu Models

1. In ModelArts console, go to "AI Gallery"
2. Search for "Pangu" models
3. Find "Pangu-NLP" or "Pangu-Alpha"
4. Click "Deploy" or "Use API"
5. Note the endpoint URL

### Step 3: Get Credentials

1. Go to "My Credentials"
2. Note your Project ID (needed for API calls)
3. Create IAM user for programmatic access:
   - Go to IAM service
   - Create user with "Programmatic access"
   - Assign "ModelArts FullAccess" policy
   - Save username and password

### Step 4: Test Connection

```typescript
// Test script
const authService = new HuaweiIAMAuthService();
const token = await authService.getToken();
console.log('Token obtained:', token.substring(0, 20) + '...');

const conversationService = new ConversationPartnerService();
const response = await conversationService.generateResponse(
  'open',
  [],
  'Hello, how are you?'
);
console.log('AI Response:', response);
```

## Cost Comparison

### Huawei Pangu vs Azure OpenAI

| Metric | Huawei Pangu | Azure OpenAI (GPT-4) |
|--------|--------------|----------------------|
| **Input tokens** | $0.015/1K | $0.03/1K |
| **Output tokens** | $0.02/1K | $0.06/1K |
| **For 1,000 users × 5 conversations** | ~$50-75/month | ~$75-120/month |
| **Region availability** | Asia-Pacific optimized | Global |
| **Language support** | Chinese + English | 50+ languages |
| **Integration** | Same cloud as OBS/SIS | Separate cloud |

### Cost Savings with Full Huawei Stack

**Using Huawei for everything:**
- OBS storage: $1/month
- Speech Recognition (SIS): $150/month
- Pangu LLM: $60/month
- **Total: ~$211/month**

**Mixed (Huawei OBS/SIS + Azure OpenAI):**
- OBS: $1/month
- SIS: $150/month
- Azure OpenAI: $90/month
- **Total: ~$241/month**

**Savings: ~$30/month (12% cheaper)** ✅

### Benefits of Full Huawei Stack

1. **Unified Billing** - Single invoice
2. **Better Integration** - All services in same cloud
3. **Data Sovereignty** - All data stays in Huawei Cloud
4. **Latency** - Lower latency (same region)
5. **Support** - Single support channel
6. **Cost Optimization** - Potential bundle discounts

## Implementation Checklist

- [ ] Enable ModelArts service in Huawei Cloud
- [ ] Create IAM user for ModelArts access
- [ ] Get Project ID and endpoint URL
- [ ] Add environment variables to `.env.local`
- [ ] Create `huawei-iam-auth.service.ts`
- [ ] Update `conversation-partner.service.ts` to use Huawei
- [ ] Test authentication and token generation
- [ ] Test conversation generation
- [ ] Deploy to Vercel with environment variables
- [ ] Monitor costs and performance

## Fallback Strategy

If Huawei Pangu is not available in your region or has issues:

1. **Primary:** Use Huawei CBS (Conversational Bot Service)
2. **Secondary:** Keep Azure OpenAI as backup
3. **Tertiary:** Use client-side Web Speech API with predefined prompts

## Recommendation

✅ **Use Huawei Pangu LLM** for:
- All-in-one Huawei Cloud solution
- Lower latency in Asia-Pacific
- Cost savings
- Better integration
- Data sovereignty

The implementation is straightforward and provides good cost savings while keeping all services in one cloud platform!

---

**Ready to implement?** Let me know when you want to start building this! 🚀

