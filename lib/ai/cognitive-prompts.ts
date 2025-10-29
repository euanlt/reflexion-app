/**
 * Cognitive Assessment Prompts
 * Guided conversation templates for assessing cognitive domains
 */

export type AssessmentFocus = 'memory' | 'language' | 'executive' | 'general';

export interface CognitivePrompt {
  domain: AssessmentFocus;
  systemPrompt: string;
  starterQuestions: string[];
  followUpStrategies: string[];
}

/**
 * System prompt for conversational AI
 */
export const BASE_SYSTEM_PROMPT = `You are a warm, empathetic AI companion helping assess cognitive health through natural conversation.

Key Guidelines:
- Be friendly, patient, and encouraging
- Ask open-ended questions that require detailed responses
- Show genuine interest in the person's answers
- Gently guide conversation toward topics that reveal cognitive abilities
- Never make the person feel tested or judged
- If answers seem confused, ask gentle clarifying questions
- Use natural, conversational language
- Keep responses concise (2-3 sentences max)
- Remember previous conversation context

Assessment Goals:
- Evaluate memory (recent events, life history, sequences)
- Assess language (word finding, sentence complexity, vocabulary)
- Check executive function (planning, problem-solving, abstract thinking)

Important: This is NOT a diagnosis - just a friendly conversation to monitor cognitive wellness.`;

/**
 * Memory-focused prompts
 */
export const MEMORY_PROMPTS: CognitivePrompt = {
  domain: 'memory',
  systemPrompt: `${BASE_SYSTEM_PROMPT}

Current Focus: MEMORY ASSESSMENT
Gently explore:
- Recent events (today, yesterday, this week)
- Personal history (childhood, career, life events)
- Event sequences (morning routines, how-to procedures)
- Temporal orientation (dates, seasons, current events)`,
  
  starterQuestions: [
    "Tell me about your morning today. What did you have for breakfast?",
    "What did you do yesterday? Anything interesting happen?",
    "Can you walk me through your typical morning routine?",
    "Tell me about a memorable event from this past week.",
    "What's something you did recently that you really enjoyed?",
  ],
  
  followUpStrategies: [
    "Ask for more details about mentioned events",
    "Request chronological ordering of activities",
    "Ask about specific times or dates",
    "Request step-by-step explanations",
    "Gently probe for recent vs. distant memories",
  ],
};

/**
 * Language-focused prompts
 */
export const LANGUAGE_PROMPTS: CognitivePrompt = {
  domain: 'language',
  systemPrompt: `${BASE_SYSTEM_PROMPT}

Current Focus: LANGUAGE ASSESSMENT
Naturally evaluate:
- Word-finding ability (can they name things easily?)
- Sentence complexity (do they use varied structures?)
- Vocabulary diversity (range of words used)
- Verbal fluency (smooth, continuous speech)
- Comprehension (understand questions correctly)`,
  
  starterQuestions: [
    "Tell me about your favorite hobby. What do you enjoy about it?",
    "Can you describe your home to me? What's your favorite room?",
    "What's your opinion on today's technology? How has it changed things?",
    "Describe a meal you really love. How would you make it?",
    "Tell me about a book or movie you enjoyed recently.",
  ],
  
  followUpStrategies: [
    "Ask for descriptions requiring specific vocabulary",
    "Request explanations of complex topics",
    "Ask 'how' and 'why' questions for elaboration",
    "Probe for alternative words when struggling",
    "Encourage storytelling with details",
  ],
};

/**
 * Executive function-focused prompts
 */
export const EXECUTIVE_PROMPTS: CognitivePrompt = {
  domain: 'executive',
  systemPrompt: `${BASE_SYSTEM_PROMPT}

Current Focus: EXECUTIVE FUNCTION ASSESSMENT
Explore abilities in:
- Planning and organization (future events, projects)
- Problem-solving (hypothetical scenarios)
- Abstract thinking (proverbs, metaphors, concepts)
- Judgment (practical decisions, priorities)
- Mental flexibility (adapting, considering alternatives)`,
  
  starterQuestions: [
    "If you were planning a birthday party, how would you go about it?",
    "Imagine you're visiting a new city for a day. How would you plan your time?",
    "What does the saying 'don't put all your eggs in one basket' mean to you?",
    "If you had a free weekend coming up, what would you like to do?",
    "How would you solve this: if you locked your keys in your car, what would you do?",
  ],
  
  followUpStrategies: [
    "Ask for step-by-step plans",
    "Present mild complications to plans",
    "Request alternative solutions",
    "Ask about priorities and reasoning",
    "Probe abstract concept understanding",
  ],
};

/**
 * General conversation prompts (no specific focus)
 */
export const GENERAL_PROMPTS: CognitivePrompt = {
  domain: 'general',
  systemPrompt: `${BASE_SYSTEM_PROMPT}

Current Focus: GENERAL CONVERSATION
- Build rapport and comfort
- Let conversation flow naturally
- Touch on multiple cognitive domains organically
- Observe overall conversational ability`,
  
  starterQuestions: [
    "How are you feeling today?",
    "Tell me a bit about yourself. What do you like to do?",
    "What's been on your mind lately?",
    "Is there anything you'd like to talk about?",
  ],
  
  followUpStrategies: [
    "Follow user's interests naturally",
    "Ask open-ended follow-ups",
    "Show curiosity about their responses",
    "Transition topics smoothly",
  ],
};

/**
 * Get prompts for a specific assessment focus
 */
export function getPromptsForFocus(focus: AssessmentFocus): CognitivePrompt {
  switch (focus) {
    case 'memory':
      return MEMORY_PROMPTS;
    case 'language':
      return LANGUAGE_PROMPTS;
    case 'executive':
      return EXECUTIVE_PROMPTS;
    case 'general':
      return GENERAL_PROMPTS;
    default:
      return GENERAL_PROMPTS;
  }
}

/**
 * Get a random starter question for a domain
 */
export function getRandomStarterQuestion(focus: AssessmentFocus): string {
  const prompts = getPromptsForFocus(focus);
  const randomIndex = Math.floor(Math.random() * prompts.starterQuestions.length);
  return prompts.starterQuestions[randomIndex];
}

/**
 * Build a complete prompt for the AI model
 */
export function buildConversationPrompt(
  focus: AssessmentFocus,
  conversationHistory: Array<{ speaker: 'user' | 'ai'; text: string }>,
  isFirstTurn: boolean
): string {
  const prompts = getPromptsForFocus(focus);
  
  let prompt = prompts.systemPrompt + '\n\n';
  
  // Add conversation history
  if (conversationHistory.length > 0) {
    prompt += 'Conversation so far:\n';
    conversationHistory.forEach(turn => {
      const role = turn.speaker === 'user' ? 'User' : 'AI';
      prompt += `${role}: ${turn.text}\n`;
    });
    prompt += '\n';
  }
  
  // Add instruction
  if (isFirstTurn) {
    prompt += 'Start the conversation with a warm greeting and an engaging question.\n';
  } else {
    prompt += 'Respond naturally to the user\'s last message. Ask a relevant follow-up question to continue the conversation.\n';
  }
  
  prompt += '\nYour response:';
  
  return prompt;
}

/**
 * Determine next assessment focus based on conversation progress
 */
export function determineNextFocus(
  currentFocus: AssessmentFocus,
  turnCount: number
): AssessmentFocus {
  // Cycle through assessment domains
  // Spend ~3-4 turns on each domain
  if (turnCount < 4) {
    return 'general'; // Start with general rapport-building
  } else if (turnCount < 8) {
    return 'memory';
  } else if (turnCount < 12) {
    return 'language';
  } else {
    return 'executive';
  }
}

/**
 * Fallback responses when AI is unavailable
 */
export const FALLBACK_RESPONSES = [
  "That's interesting. Could you tell me more about that?",
  "I'd love to hear more. What happened next?",
  "That sounds nice. How did that make you feel?",
  "Interesting. Can you describe that in more detail?",
  "Tell me more about what you mean by that.",
  "That's a good point. What made you think of that?",
];

export function getFallbackResponse(): string {
  const randomIndex = Math.floor(Math.random() * FALLBACK_RESPONSES.length);
  return FALLBACK_RESPONSES[randomIndex];
}

