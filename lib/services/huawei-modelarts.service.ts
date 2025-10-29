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
  const config = getModelArtsConfig();
  
  // If ModelArts is not configured, return a fallback greeting
  if (!config.endpoint) {
    console.warn('ModelArts not configured, using fallback greeting');
    return getFallbackGreeting(context);
  }

  try {
    // Get IAM token for authentication
    const iamConfig = getIAMConfig();
    const token = await getIAMToken(iamConfig);

    // Prepare request body
    const timeOfDay = context?.timeOfDay || getTimeOfDay();
    const requestBody = {
      inputs: {
        time_of_day: timeOfDay,
        user_name: context?.userName || 'there',
        previous_conversations: context?.previousConversations || 0,
        prompt: `Generate a warm, friendly greeting for a cognitive health conversation. Time: ${timeOfDay}. Keep it natural and encouraging.`,
      },
    };

    // Make API request to ModelArts endpoint using token-based auth
    const response = await fetch(config.endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Auth-Token': token,  // Token-based authentication
      },
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('ModelArts API error:', errorText);
      throw new Error(`ModelArts request failed: ${response.status}`);
    }

    const data: ModelArtsGreetingResponse = await response.json();
    
    return data.greeting || getFallbackGreeting(context);
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
  
  if (!conversationEndpoint) {
    console.warn('[ModelArts] Conversation endpoint not configured, using fallback');
    return generateFallbackConversationResponse(conversationHistory, assessmentFocus);
  }

  try {
    // Get IAM token for authentication
    const iamConfig = getIAMConfig();
    const token = await getIAMToken(iamConfig);

    // Build prompt with cognitive assessment guidance
    const {buildConversationPrompt} = await import('@/lib/ai/cognitive-prompts');
    const prompt = buildConversationPrompt(
      assessmentFocus,
      conversationHistory,
      conversationHistory.length === 0
    );

    // Prepare request body for ModelArts
    const requestBody = {
      inputs: [{
        prompt,
        temperature: 0.7,
        max_tokens: 150,
        top_p: 0.9,
      }],
    };

    console.log('[ModelArts] Generating conversation response...');

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
    
    // Extract response text from ModelArts response
    // Format may vary depending on model, adjust as needed
    let aiResponse = '';
    if (data.outputs && data.outputs[0]) {
      aiResponse = data.outputs[0].response || data.outputs[0].text || data.outputs[0];
    } else if (data.response) {
      aiResponse = data.response;
    } else {
      aiResponse = JSON.stringify(data);
    }

    // Clean up response
    aiResponse = aiResponse.trim();
    
    if (!aiResponse) {
      throw new Error('Empty response from ModelArts');
    }

    console.log('[ModelArts] Response generated:', aiResponse.substring(0, 100) + '...');
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

