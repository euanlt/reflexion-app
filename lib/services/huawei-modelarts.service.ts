/**
 * Huawei Cloud ModelArts Service
 * Provides AI model inference capabilities for conversation generation
 * Uses token-based authentication (same as SIS)
 * Reference: https://support.huaweicloud.com/intl/en-us/usermanual-standard-modelarts/inference-modelarts-0023.html
 */

import type { ModelArtsGreetingResponse } from '@/types/huawei-services';
import { getPromptsForFocus } from '@/lib/ai/cognitive-prompts';
import { getIAMToken, getIAMConfig } from './huawei-iam.service';

interface ModelArtsConfig {
  endpoint: string;
}

/**
 * Clean up AI response to ensure it's concise and appropriate
 */
function cleanAIResponse(text: string): string {
  let cleaned = text.trim();
  
  // Remove common emojis using explicit character list
  const emojis = ['😊', '😀', '👍', '❤️', '✨', '🙂', '😃', '😄', '😁', '😆', '😅', '🤣', '😂', '🙃', '😉', '😇', '🥰', '😍', '🤩', '😘', '😗', '☺️', '😚', '😙', '🥲', '😋', '😛', '😜', '🤪', '😝', '🤑', '🤗', '🤭', '🤫', '🤔', '🤐'];
  for (const emoji of emojis) {
    cleaned = cleaned.split(emoji).join('');
  }
  
  // Remove verbose phrases
  const verbosePhrases = [
    "Of course, I'm here to help!",
    "Of course, I'm here to help",
    "I'm here to help!",
    "I'm here to help",
    "Great to hear from you!",
    "Great to hear from you",
    "That's great to hear!",
    "That's great to hear",
    "It's great to hear",
    "I'd love to hear",
    "Thank you for sharing",
  ];
  
  for (const phrase of verbosePhrases) {
    cleaned = cleaned.replace(new RegExp(phrase, 'gi'), '');
  }
  
  // Remove extra quotes that the model might add
  cleaned = cleaned.replace(/^["']|["']$/g, '');
  
  // Clean up extra whitespace
  cleaned = cleaned.replace(/\s+/g, ' ').trim();
  
  // If it starts with "That's" or "That sounds", remove it
  cleaned = cleaned.replace(/^(That's|That sounds)\s+\w+[.,!]\s*/i, '');
  
  // Ensure first letter is capitalized
  if (cleaned.length > 0) {
    cleaned = cleaned.charAt(0).toUpperCase() + cleaned.slice(1);
  }
  
  return cleaned;
}

/**
 * Basic normalization for text comparisons
 */
function normalizeText(input: string): string {
  return input
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Choose the next starter question for a focus, avoiding repeats
 */
function pickNonRepeatingStarter(
  assessmentFocus: 'memory' | 'language' | 'executive' | 'general',
  conversationHistory: Array<{ speaker: 'user' | 'ai'; text: string }>
): string {
  const prompts = getPromptsForFocus(assessmentFocus);
  const asked = new Set(
    conversationHistory
      .filter(t => t.speaker === 'ai')
      .map(t => normalizeText(t.text))
  );

  for (const q of prompts.starterQuestions) {
    if (!asked.has(normalizeText(q))) return q;
  }
  // If all were asked, just return the first as a safe fallback
  return prompts.starterQuestions[0] || 'Tell me more about that.';
}

/**
 * Enforce diversity and specificity in AI responses.
 * - Avoid repeating previous AI question
 * - Avoid generic "how was your day" after it's been asked once
 * - If user declined (e.g., "no", "not much"), pivot to a concrete follow-up per focus
 */
function enforceResponseDiversity(
  conversationHistory: Array<{ speaker: 'user' | 'ai'; text: string }>,
  proposed: string,
  assessmentFocus: 'memory' | 'language' | 'executive' | 'general'
): string {
  const cleaned = cleanAIResponse(proposed);
  const lastAITurn = [...conversationHistory].reverse().find(t => t.speaker === 'ai');
  const lastUserTurn = [...conversationHistory].reverse().find(t => t.speaker === 'user');

  const cleanedNorm = normalizeText(cleaned);
  const lastAiNorm = lastAITurn ? normalizeText(lastAITurn.text) : '';

  const askedAboutDayBefore = conversationHistory.some(t =>
    t.speaker === 'ai' && /how (?:was|is) (?:your|ur) day/i.test(t.text)
  );

  const isRepeat = cleanedNorm === lastAiNorm;
  const isHowWasDay = /how (?:was|is) (?:your|ur) day/.test(cleanedNorm);

  // If user said "no", "not much", or similar — pivot with concrete question
  const userDeclined = lastUserTurn
    ? /^(no|nope|not really|nothing|didnt|didn't|not much|im good|i'm good)\b/i.test(
        lastUserTurn.text.trim()
      )
    : false;

  if (userDeclined || isRepeat || (isHowWasDay && askedAboutDayBefore)) {
    // Provide a concrete, domain-specific follow-up
    switch (assessmentFocus) {
      case 'memory':
        return 'What did you have for breakfast today?';
      case 'language':
        return 'Describe a hobby you enjoy and why you like it.';
      case 'executive':
        return 'You have a free weekend. What would you plan to do?';
      default:
        return pickNonRepeatingStarter(assessmentFocus, conversationHistory);
    }
  }

  return cleaned;
}

/**
 * Generate a personalized AI greeting using ModelArts
 * Uses token-based authentication with X-Auth-Token header
 */
export async function generateGreeting(context?: {
  userName?: string;
  timeOfDay?: string;
  previousConversations?: number;
}): Promise<string> {
  // Use conversation endpoint for greetings
  const endpoint = process.env.HUAWEI_MODELARTS_CONVERSATION_ENDPOINT;
  
  // If ModelArts is not configured, return a fallback greeting
  if (!endpoint) {
    console.warn('[ModelArts] Not configured, using fallback greeting');
    return getFallbackGreeting(context);
  }

  try {
    // Get IAM token for authentication
    const iamConfig = getIAMConfig();
    const token = await getIAMToken(iamConfig);

    // Create a natural greeting that starts a guided conversation
    const timeOfDay = context?.timeOfDay || getTimeOfDay();
    const prompt = `Reply in exactly 1 sentence. Say "${timeOfDay}" greeting and ask "How was your day?". NO emojis. NO extra words.`; 
    
    const requestBody = {
      prompt: prompt,
      temperature: 0.5,  // Lower for better instruction-following
      max_tokens: 250,  // Must be > input token count (model requirement)
      top_p: 0.9,
    };

    console.log('[ModelArts] Generating greeting...');
    console.log('[ModelArts] Endpoint:', endpoint);
    console.log('[ModelArts] Request body:', JSON.stringify(requestBody, null, 2));

    // Make API request to ModelArts endpoint using token-based auth
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Auth-Token': token,  // Token-based authentication
      },
      body: JSON.stringify(requestBody),
    });

    console.log('[ModelArts] Response status:', response.status);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('[ModelArts] API error:', errorText);
      console.error('[ModelArts] Response headers:', Object.fromEntries(response.headers.entries()));
      throw new Error(`ModelArts request failed: ${response.status}`);
    }

        const data = await response.json();
        console.log('[ModelArts] Response data:', JSON.stringify(data, null, 2));
        
        // Extract greeting from choices array
        const rawGreeting = data.choices?.[0]?.text?.trim();
        
        if (!rawGreeting) {
          console.warn('[ModelArts] Empty response, using fallback');
          return getFallbackGreeting(context);
        }
        
        // Clean up the greeting
        const greeting = cleanAIResponse(rawGreeting);
        
        console.log('[ModelArts] Raw greeting:', rawGreeting);
        console.log('[ModelArts] Cleaned greeting:', greeting);
        return greeting;
  } catch (error) {
    console.error('Error generating greeting with ModelArts:', error);
    // Fall back to predefined greetings
    return getFallbackGreeting(context);
  }
}

/**
 * Get fallback greeting when ModelArts is unavailable
 */
function getFallbackGreeting(context?: {
  userName?: string;
  timeOfDay?: string;
}): string {
  const timeOfDay = context?.timeOfDay || getTimeOfDay();
  const userName = context?.userName || 'there';
  
  const greetings = [
    `Good ${timeOfDay}, ${userName}! It's wonderful to see you today. How are you feeling?`,
    `Hello ${userName}! I hope you're having a lovely ${timeOfDay}. I'd love to hear about what's been going on in your life lately.`,
    `Hi ${userName}! Thank you for taking the time to chat with me this ${timeOfDay}. What's on your mind?`,
    `Good ${timeOfDay}! I'm here to have a nice conversation with you. How has your day been so far?`,
    `Hello ${userName}! Let's have a pleasant conversation together. How are things with you today?`,
  ];
  
  return greetings[Math.floor(Math.random() * greetings.length)];
}

/**
 * Get current time of day
 */
function getTimeOfDay(): string {
  const hour = new Date().getHours();
  if (hour < 12) return 'morning';
  if (hour < 18) return 'afternoon';
  return 'evening';
}

/**
 * Generate conversational AI response based on conversation history
 * This is for multi-turn conversations with context
 */
export async function generateConversationResponse(
  conversationHistory: Array<{ speaker: 'user' | 'ai'; text: string }>,
  assessmentFocus: 'memory' | 'language' | 'executive' | 'general' = 'general'
): Promise<string> {
  const config = getModelArtsConfig();
  
  // Check if conversation endpoint is configured
  const conversationEndpoint = process.env.HUAWEI_MODELARTS_CONVERSATION_ENDPOINT;
  
  console.log('[ModelArts] Conversation endpoint check:', {
    isSet: !!conversationEndpoint,
    endpoint: conversationEndpoint ? `${conversationEndpoint.substring(0, 50)}...` : 'NOT SET'
  });
  
  if (!conversationEndpoint) {
    console.warn('[ModelArts] Conversation endpoint not configured, using fallback');
    return generateFallbackConversationResponse(conversationHistory, assessmentFocus);
  }

  try {
    // Get IAM token for authentication
    const iamConfig = getIAMConfig();
    const token = await getIAMToken(iamConfig);

    // Get recent conversation for context (last 2 turns = 1 user + 1 AI)
    const recentTurns = conversationHistory.slice(-2);
    const lastUserMessage = conversationHistory
      .filter(t => t.speaker === 'user')
      .pop()?.text || 'Hello!';

    // Build guided conversation prompt based on assessment focus
    let prompt = '';
    
    // Create assessment-specific guidance
    const focusGuidance: Record<string, string> = {
      memory: 'Ask about their day, recent activities, or what they had for meals',
      language: 'Ask them to describe something or explain how to do something',
      executive: 'Ask about their plans, decision-making, or problem-solving',
      general: 'Ask a friendly question to keep the conversation flowing',
    };
    
    const guidance = focusGuidance[assessmentFocus] || focusGuidance.general;
    
    if (recentTurns.length >= 2) {
      // Include context + guidance
      const prevUser = recentTurns[0]?.text?.substring(0, 50) || '';
      const prevAI = recentTurns[1]?.text?.substring(0, 50) || '';
      prompt = `User: "${lastUserMessage}". Task: ${guidance}. RULES: 1 sentence only. NO emojis. Do not repeat earlier questions. Avoid asking about their day again.`;
    } else {
      // First turn - respond and guide
      prompt = `User: "${lastUserMessage}". Task: ${guidance}. RULES: 1 sentence only. NO emojis. Start your question directly.`;
    }

    // Prepare request body using correct ModelArts format
    // NOTE: DO NOT use 'history' parameter - model doesn't support it
    const requestBody = {
      prompt,
      temperature: 0.5,  // Lower for better instruction-following
      max_tokens: 300,  // Must be > input token count (model requirement)
      top_p: 0.9,
    };

    console.log('[ModelArts] Generating conversation response...');
    console.log('[ModelArts] Last user message:', lastUserMessage);
    console.log('[ModelArts] Full prompt:', prompt);

    // Make API request to ModelArts conversation endpoint
    const response = await fetch(conversationEndpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Auth-Token': token,
      },
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('[ModelArts] API error:', errorText);
      throw new Error(`ModelArts conversation request failed: ${response.status}`);
    }

    const data = await response.json();
    console.log('[ModelArts] Full response:', JSON.stringify(data, null, 2));
    
    // Extract response text from choices array (correct ModelArts format)
    const rawResponse = data.choices?.[0]?.text?.trim();
    
    if (!rawResponse) {
      console.error('[ModelArts] Empty or missing AI response!');
      console.error('[ModelArts] Response data:', data);
      console.warn('[ModelArts] Falling back to predefined responses');
      throw new Error('Empty response from ModelArts');
    }

    // Clean and enforce diversity/specificity rules
    const aiResponse = enforceResponseDiversity(
      conversationHistory,
      rawResponse,
      assessmentFocus
    );

    console.log('[ModelArts] Raw response:', rawResponse.substring(0, 100) + '...');
    console.log('[ModelArts] ✅ Cleaned response:', aiResponse.substring(0, 100) + '...');
    return aiResponse;
  } catch (error) {
    console.error('[ModelArts] Error generating conversation response:', error);
    // Fall back to rule-based responses
    return generateFallbackConversationResponse(conversationHistory, assessmentFocus);
  }
}

/**
 * Generate fallback conversation response when ModelArts is unavailable
 * Uses simple rule-based logic with cognitive assessment prompts
 */
function generateFallbackConversationResponse(
  conversationHistory: Array<{ speaker: 'user' | 'ai'; text: string }>,
  assessmentFocus: 'memory' | 'language' | 'executive' | 'general'
): string {
  // If this is the first turn, use a greeting
  if (conversationHistory.length === 0) {
    return getFallbackGreeting();
  }

  // Get the last user message
  const userTurns = conversationHistory.filter(t => t.speaker === 'user');
  const lastUserMessage = userTurns[userTurns.length - 1]?.text || '';

  // Use domain-specific fallback responses
  const {getRandomStarterQuestion, FALLBACK_RESPONSES} = require('@/lib/ai/cognitive-prompts');
  
  // For the first few turns, ask domain-specific questions
  const turnCount = conversationHistory.length;
  if (turnCount < 10 && turnCount % 2 === 0) {
    // Every other turn, ask a focused question
    return getRandomStarterQuestion(assessmentFocus);
  }

  // Otherwise use generic follow-up responses
  const responses = FALLBACK_RESPONSES;
  const randomIndex = Math.floor(Math.random() * responses.length);
  return responses[randomIndex];
}

/**
 * Get ModelArts configuration from environment variables
 */
export function getModelArtsConfig(): ModelArtsConfig {
  return {
    endpoint: process.env.HUAWEI_MODELARTS_ENDPOINT || '',
  };
}

