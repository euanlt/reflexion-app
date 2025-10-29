/**
 * Huawei Cloud ModelArts Service
 * Provides AI model inference capabilities for conversation generation
 * Uses token-based authentication (same as SIS)
 * Reference: https://support.huaweicloud.com/intl/en-us/usermanual-standard-modelarts/inference-modelarts-0023.html
 */

import type { ModelArtsGreetingResponse } from '@/types/huawei-services';
import { getIAMToken, getIAMConfig } from './huawei-iam.service';

interface ModelArtsConfig {
  endpoint: string;
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

    // Create a natural, simple greeting
    const timeOfDay = context?.timeOfDay || getTimeOfDay();
    const prompt = `You are a helpful ai mirror. Greet someone warmly for ${timeOfDay} in 1 short sentence.`; 
    
    const requestBody = {
      prompt: prompt,
      temperature: 0.9,  // Higher for more natural, varied responses
      max_tokens: 250,  // Must be > input token count (model requirement)
      top_p: 0.95,
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
    const greeting = data.choices?.[0]?.text?.trim();
    
    if (!greeting) {
      console.warn('[ModelArts] Empty response, using fallback');
      return getFallbackGreeting(context);
    }
    
    console.log('[ModelArts] Greeting generated:', greeting.substring(0, 50) + '...');
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

    // Build prompt with brief context if available
    let prompt = '';
    if (recentTurns.length >= 2) {
      // Include previous turn for context
      const prevUser = recentTurns[0]?.text?.substring(0, 60) || '';
      const prevAI = recentTurns[1]?.text?.substring(0, 60) || '';
      prompt = `Previous: User said "${prevUser}", you replied "${prevAI}". Now user says: "${lastUserMessage}". Reply warmly in 1-2 sentences.`;
    } else {
      // First turn, no context
      prompt = `Someone said: "${lastUserMessage}". Reply warmly in 1-2 sentences.`;
    }

    // Prepare request body using correct ModelArts format
    // NOTE: DO NOT use 'history' parameter - model doesn't support it
    const requestBody = {
      prompt,
      temperature: 0.8,
      max_tokens: 300,  // Must be > input token count (model requirement)
      top_p: 0.95,
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
    const aiResponse = data.choices?.[0]?.text?.trim();
    
    if (!aiResponse) {
      console.error('[ModelArts] Empty or missing AI response!');
      console.error('[ModelArts] Response data:', data);
      console.warn('[ModelArts] Falling back to predefined responses');
      throw new Error('Empty response from ModelArts');
    }

    console.log('[ModelArts] ✅ Response generated:', aiResponse.substring(0, 100) + '...');
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

