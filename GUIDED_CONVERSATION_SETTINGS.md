# Guided Conversation Settings

## Overview
The AI conversation is now configured to guide users through cognitive assessment topics in a natural, concise way.

## Response Format

### Conciseness Rules
- **1 sentence only** for all responses
- **No emojis** - automatically stripped via post-processing
- **No verbose phrases** - "I'm here to help", "Great to hear from you", etc. are removed
- **Direct questions** - AI jumps straight to assessment questions
- **Lower temperature (0.5)** - better instruction-following
- **Post-processing cleanup** - removes unwanted content even if model adds it

### What Gets Removed
The `cleanAIResponse()` function automatically removes:
- 35+ common emojis (😊, 😀, 👍, etc.)
- Verbose phrases: "Of course, I'm here to help!", "Great to hear from you!", etc.
- Extra quotes around responses
- "That's..." or "That sounds..." sentence starters
- Extra whitespace

## Assessment Focus Areas

The conversation automatically cycles through these domains:

| Turns | Focus | Guidance |
|-------|-------|----------|
| 0-3 | General | "Ask a friendly question to keep the conversation flowing" |
| 4-7 | Memory | "Ask about their day, recent activities, or what they had for meals" |
| 8-11 | Language | "Ask them to describe something or explain how to do something" |
| 12+ | Executive | "Ask about their plans, decision-making, or problem-solving" |

## Example Conversation Flow

**Before** (verbose, emojis, repetitive):
```
AI: "Hey there! How was your day? Hope it was fabulous 😊"
User: "It was good."
AI: "Great to hear from you! How has your day been so far? 😊"
User: "Been good."
AI: "That's great to hear! How has your day been? Did you have a good meal or do anything interesting recently?"
```

**After** (concise, guided, no emojis):
```
AI: "Good evening! How was your day?"
User: "It was good."
AI: "What did you have for breakfast today?"  [Memory focus]
User: "I had cereal."
AI: "Describe your favorite cereal."  [Language focus]
User: "It's crunchy and sweet."
AI: "You have a free weekend. What would you do?"  [Executive focus]
```

## Sample Questions by Domain

### Memory Questions
- "What did you have for breakfast today?"
- "What did you do yesterday?"
- "Walk me through your morning routine?"
- "Tell me about something memorable from this week."

### Language Questions
- "What's your favorite hobby and why?"
- "Describe your home. What's your favorite room?"
- "How has technology changed over the years?"
- "Describe a meal you love. How do you make it?"

### Executive Function Questions
- "How would you plan a birthday party?"
- "You're visiting a new city. How do you plan your day?"
- "What does 'don't put all your eggs in one basket' mean?"
- "You locked your keys in your car. What now?"

## Fallback Responses
When ModelArts is unavailable, these concise responses are used:
- "Tell me more about that."
- "What happened next?"
- "How did that make you feel?"
- "Can you describe that in detail?"

## Technical Implementation

### Files Modified
1. `lib/services/huawei-modelarts.service.ts`
   - Updated greeting prompt to be concise and start conversation
   - Added assessment-specific guidance in conversation responses
   - Limited responses to 15-20 words max
   - Removed verbose AI disclaimers

2. `lib/ai/cognitive-prompts.ts`
   - Shortened all starter questions
   - Made fallback responses more concise
   - Removed unnecessary preambles

### Prompt Engineering

**Greeting Prompt:**
```typescript
`Reply in exactly 1 sentence. Say "${timeOfDay}" greeting and ask "How was your day?". NO emojis. NO extra words.`
```

**Conversation Prompt:**
```typescript
`User: "${lastUserMessage}". Task: ${guidance}. RULES: 1 sentence only. NO emojis. NO "great to hear". Start your question directly.`
```

**ModelArts Configuration:**
```typescript
{
  temperature: 0.5,  // Lower for better instruction-following (was 0.8-0.9)
  max_tokens: 300,
  top_p: 0.9
}
```

**Post-Processing:**
All responses go through `cleanAIResponse()` which:
1. Removes all emojis
2. Strips verbose phrases
3. Removes quote marks
4. Cleans whitespace
5. Capitalizes first letter

## Testing
Visit: `http://localhost:3000/conversation-analysis`

Expected improvements:
- ✅ Shorter, more natural responses
- ✅ No repetitive "I'm here to help"
- ✅ No emojis
- ✅ Guided questions for cognitive assessment
- ✅ Smooth transitions between assessment domains

