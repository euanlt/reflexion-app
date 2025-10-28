/**
 * Huawei Cloud ModelArts Service
 * Provides AI model inference capabilities for conversation generation
 */

import type { ModelArtsGreetingResponse } from '@/types/huawei-services';

interface ModelArtsConfig {
  endpoint: string;
  apiKey: string;
}

/**
 * Generate a personalized AI greeting using ModelArts
 */
export async function generateGreeting(context?: {
  userName?: string;
  timeOfDay?: string;
  previousConversations?: number;
}): Promise<string> {
  const config = getModelArtsConfig();
  
  // If ModelArts is not configured, return a fallback greeting
  if (!config.endpoint || !config.apiKey) {
    console.warn('ModelArts not configured, using fallback greeting');
    return getFallbackGreeting(context);
  }

  try {
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

    // Make API request to ModelArts endpoint
    const response = await fetch(config.endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Apig-AppCode': config.apiKey,
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
 * Get ModelArts configuration from environment variables
 */
export function getModelArtsConfig(): ModelArtsConfig {
  return {
    endpoint: process.env.HUAWEI_MODELARTS_ENDPOINT || '',
    apiKey: process.env.HUAWEI_MODELARTS_API_KEY || '',
  };
}

