# Huawei Cloud TTS Options - WebSocket vs REST

## Current Situation

We discovered that Huawei's TTS API uses **WebSocket** (`wss://`) for Real-Time TTS (RTTS), not a simple REST API.

**Documentation Reference:**
https://support.huaweicloud.com/intl/en-us/api-sis/sis_03_0113.html

## Why Our Current Code Fails

```typescript
// ❌ What we're doing - REST POST
fetch('https://sis-ext.ap-southeast-3.myhuaweicloud.com/v1/PROJECT_ID/tts', {
  method: 'POST',
  ...
})
// Error: "No backend available" (APIG.0610)
```

**Reason:** The `/tts` endpoint doesn't exist as a REST API - only `/rtts` as WebSocket.

## Huawei TTS Architecture

According to the documentation:

### Real-Time TTS (RTTS) - WebSocket Only

**Endpoint:** `wss://sis-ext.{region}.myhuaweicloud.com/v1/{project_id}/rtts`

**Protocol:** WebSocket

**Use Case:** Streaming TTS for long texts, real-time applications

**Example:**
```javascript
const ws = new WebSocket('wss://endpoint/v1/PROJECT_ID/rtts', {
  headers: { 'X-Auth-Token': token }
});

ws.onopen = () => {
  ws.send(JSON.stringify({
    command: 'START',
    text: 'Hello, this is a test.',
    config: {
      audio_format: 'pcm',
      property: 'chinese_xiaoyu_common',
      sample_rate: '8000'
    }
  }));
};

ws.onmessage = (event) => {
  if (event.data instanceof Blob) {
    // Received audio data (binary)
    console.log('Received audio chunk');
  } else {
    // Received JSON response (text)
    console.log('Response:', event.data);
  }
};
```

**Challenges on Vercel:**
- ❌ Serverless functions don't support persistent WebSocket connections
- ❌ Would need client-side implementation (browser → Huawei directly)
- ❌ Security concern: exposing IAM token to client
- ❌ Complex streaming audio handling

### Short Sentence TTS - Does it exist?

**Looking for:** A REST API equivalent to Short Sentence ASR

**ASR has:**
- Short Sentence: `POST /v1/{project_id}/asr/short-audio` (REST) ✅
- Real-Time: `wss /v1/{project_id}/rasr` (WebSocket) ✅

**TTS might have:**
- Short Sentence: `POST /v1/{project_id}/tts` (REST) ❓ **NOT FOUND**
- Real-Time: `wss /v1/{project_id}/rtts` (WebSocket) ✅ **CONFIRMED**

**Conclusion:** Huawei only provides WebSocket-based TTS, no simple REST API.

## Why This Matters for Your App

### Your Current Setup
- ✅ Greeting generation (ModelArts) - Works via REST API
- ✅ Speech transcription (SIS) - Works via REST API (short-audio)
- ❌ Speech synthesis (TTS) - Requires WebSocket (not compatible with Vercel serverless)

### Your Requirements
- Short greeting (10-20 words)
- One-time playback at conversation start
- Not streaming or real-time

**Browser TTS is perfect for this!**

## Recommended Solution

### ⭐ Option 1: Keep Browser TTS (Recommended)

**Implementation:** Already done! ✅

```typescript
// Fallback to browser TTS (already in code)
if ('speechSynthesis' in window) {
  const utterance = new SpeechSynthesisUtterance(greeting);
  utterance.rate = 0.9;
  utterance.pitch = 1.0;
  window.speechSynthesis.speak(utterance);
}
```

**Pros:**
- ✅ Works everywhere (all browsers, all regions)
- ✅ No cost
- ✅ No complex WebSocket implementation
- ✅ No Vercel limitations
- ✅ Good quality (uses OS native voices)
- ✅ Zero latency (runs locally)

**Cons:**
- Voice varies by user's OS/browser
- Can't customize voice characteristics precisely

**Best for:** Your cognitive health app where consistency matters more than specific voice characteristics

### Option 2: Implement Client-Side WebSocket TTS

**Implementation:** Complex, not recommended

```typescript
// Would need to run in browser, not API route
const connectTTS = () => {
  // Problem: Need to expose IAM token to client
  const token = await fetch('/api/get-token'); // Security issue!
  
  const ws = new WebSocket(`wss://sis-ext.${region}.myhuaweicloud.com/v1/${projectId}/rtts`, {
    headers: { 'X-Auth-Token': token }
  });
  
  // Complex streaming audio handling...
};
```

**Pros:**
- Uses Huawei TTS
- Consistent voice across users

**Cons:**
- ❌ Exposes IAM credentials to client
- ❌ Complex implementation (100+ lines)
- ❌ Requires WebSocket client library
- ❌ Still doesn't work in ap-southeast-3 (no backend)
- ❌ Additional debugging and maintenance
- ❌ Costs money (Huawei TTS charges per character)

**Not worth it** for short greetings!

### Option 3: Use Third-Party TTS

**Alternative services with simple REST APIs:**
- ElevenLabs (high-quality voices, REST API)
- Google Cloud TTS (REST API)
- AWS Polly (REST API)
- Azure Speech (REST API - you mentioned avoiding Azure)

**Pros:**
- Simple REST API integration
- Works on Vercel serverless
- High-quality voices

**Cons:**
- Additional cost
- Not using Huawei ecosystem

## Decision Matrix

| Option | Complexity | Cost | Quality | Vercel Compatible | Recommended |
|--------|-----------|------|---------|-------------------|-------------|
| Browser TTS | ⭐ Easy | Free | Good | ✅ Yes | ⭐⭐⭐⭐⭐ |
| Huawei WebSocket TTS | ⭐⭐⭐⭐⭐ Very Hard | Paid | Excellent | ❌ Partial | ⭐ |
| Third-Party REST TTS | ⭐⭐ Medium | Paid | Excellent | ✅ Yes | ⭐⭐⭐ |

## Final Recommendation

**Keep browser TTS** because:

1. ✅ **Already implemented and working**
2. ✅ **Perfect for your use case** (short greetings, not streaming)
3. ✅ **No additional cost**
4. ✅ **No complex WebSocket implementation**
5. ✅ **Works everywhere, no region restrictions**
6. ✅ **Zero maintenance**

**Your cognitive health monitoring app** doesn't need fancy voice synthesis - it needs:
- Clear, understandable greetings ✅
- Reliable conversation recording ✅
- Accurate speech transcription ✅ (using Huawei SIS REST API)
- Meaningful cognitive analysis ✅

Browser TTS delivers all of this perfectly!

## What to Update

### 1. Update Documentation

Mark TTS as "Browser-based (Huawei WebSocket not compatible with Vercel)" in your docs.

### 2. Remove Huawei TTS Code (Optional)

Since it won't work on Vercel, you can either:
- Keep the code with clear comments explaining why it's not used
- Remove it to simplify the codebase

### 3. Update hua.plan.md

Change:
```markdown
- [ ] Create lib/services/huawei-tts.service.ts for text-to-speech synthesis
```

To:
```markdown
- [x] TTS: Using browser speechSynthesis (Huawei WebSocket TTS not compatible with Vercel serverless)
```

## References

- [Huawei Real-Time TTS (WebSocket)](https://support.huaweicloud.com/intl/en-us/api-sis/sis_03_0113.html)
- [Web Speech API (Browser TTS)](https://developer.mozilla.org/en-US/docs/Web/API/SpeechSynthesis)
- [Vercel Serverless Functions Limitations](https://vercel.com/docs/functions/limitations)

