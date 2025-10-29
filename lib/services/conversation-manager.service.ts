/**
 * Conversation Manager Service
 * Orchestrates the real-time conversation flow:
 * 1. User speaks → 2. Transcribe → 3. Generate AI response → 4. Speak response
 */

import { transcribeAudio } from './huawei-speech.service';
import { generateConversationResponse } from './huawei-modelarts.service';
import type { AssessmentFocus } from '@/lib/ai/cognitive-prompts';
import { determineNextFocus, getFallbackResponse } from '@/lib/ai/cognitive-prompts';

export interface ConversationTurn {
  speaker: 'user' | 'ai';
  text: string;
  timestamp: number;
  audioBlob?: Blob;
  duration?: number;
}

export interface ConversationMetrics {
  totalTurns: number;
  userTurns: number;
  aiTurns: number;
  averageUserResponseTime: number;
  averageTurnDuration: number;
  totalDuration: number;
}

export class ConversationManager {
  private turns: ConversationTurn[] = [];
  private currentFocus: AssessmentFocus = 'general';
  private conversationStartTime: number | null = null;
  private lastTurnTime: number | null = null;
  private isProcessing = false;

  /**
   * Initialize a new conversation
   */
  start(): void {
    this.turns = [];
    this.currentFocus = 'general';
    this.conversationStartTime = Date.now();
    this.lastTurnTime = Date.now();
    this.isProcessing = false;
    console.log('[ConversationManager] Conversation started');
  }

  /**
   * Process a user turn: transcribe audio → generate AI response
   */
  async processUserTurn(audioBlob: Blob): Promise<string> {
    if (this.isProcessing) {
      console.warn('[ConversationManager] Already processing a turn');
      throw new Error('Already processing');
    }

    this.isProcessing = true;
    const turnStartTime = Date.now();

    try {
      console.log('[ConversationManager] Processing user turn...');
      
      // Step 1: Transcribe user's audio
      let userText = '';
      try {
        const transcriptionResult = await transcribeAudio(audioBlob);
        userText = transcriptionResult.transcript;
        console.log('[ConversationManager] Transcription:', userText);
      } catch (error) {
        console.error('[ConversationManager] Transcription failed:', error);
        // Use fallback text
        userText = '[Speech unclear - transcription failed]';
      }

      // Add user turn to history
      const userTurn: ConversationTurn = {
        speaker: 'user',
        text: userText,
        timestamp: turnStartTime,
        audioBlob,
        duration: this.lastTurnTime ? turnStartTime - this.lastTurnTime : 0,
      };
      this.turns.push(userTurn);

      // Update assessment focus based on progress
      this.currentFocus = determineNextFocus(this.currentFocus, this.turns.length);

      // Step 2: Generate AI response
      let aiResponse = '';
      try {
        aiResponse = await generateConversationResponse(
          this.getConversationHistory(),
          this.currentFocus
        );
        console.log('[ConversationManager] AI response:', aiResponse);
      } catch (error) {
        console.error('[ConversationManager] AI response generation failed:', error);
        // Use fallback response
        aiResponse = getFallbackResponse();
        console.log('[ConversationManager] Using fallback response:', aiResponse);
      }

      // Add AI turn to history
      const aiTurn: ConversationTurn = {
        speaker: 'ai',
        text: aiResponse,
        timestamp: Date.now(),
        duration: Date.now() - turnStartTime,
      };
      this.turns.push(aiTurn);

      this.lastTurnTime = Date.now();
      this.isProcessing = false;

      return aiResponse;
    } catch (error) {
      this.isProcessing = false;
      console.error('[ConversationManager] Error processing turn:', error);
      throw error;
    }
  }

  /**
   * Add an AI turn manually (e.g., greeting at start)
   */
  addAITurn(text: string): void {
    const turn: ConversationTurn = {
      speaker: 'ai',
      text,
      timestamp: Date.now(),
    };
    this.turns.push(turn);
    this.lastTurnTime = Date.now();
    console.log('[ConversationManager] AI turn added:', text);
  }

  /**
   * Get conversation history in format suitable for AI
   */
  getConversationHistory(): Array<{ speaker: 'user' | 'ai'; text: string }> {
    return this.turns.map(turn => ({
      speaker: turn.speaker,
      text: turn.text,
    }));
  }

  /**
   * Get all turns with full details
   */
  getAllTurns(): ConversationTurn[] {
    return [...this.turns];
  }

  /**
   * Get conversation metrics for analysis
   */
  getMetrics(): ConversationMetrics {
    const userTurns = this.turns.filter(t => t.speaker === 'user');
    const aiTurns = this.turns.filter(t => t.speaker === 'ai');

    const totalDuration = this.conversationStartTime 
      ? Date.now() - this.conversationStartTime 
      : 0;

    const userResponseTimes = userTurns
      .map(t => t.duration || 0)
      .filter(d => d > 0);

    const averageUserResponseTime = userResponseTimes.length > 0
      ? userResponseTimes.reduce((a, b) => a + b, 0) / userResponseTimes.length
      : 0;

    const allDurations = this.turns
      .map(t => t.duration || 0)
      .filter(d => d > 0);

    const averageTurnDuration = allDurations.length > 0
      ? allDurations.reduce((a, b) => a + b, 0) / allDurations.length
      : 0;

    return {
      totalTurns: this.turns.length,
      userTurns: userTurns.length,
      aiTurns: aiTurns.length,
      averageUserResponseTime,
      averageTurnDuration,
      totalDuration,
    };
  }

  /**
   * Get full transcript as text
   */
  getTranscript(): string {
    return this.turns
      .map(turn => {
        const speaker = turn.speaker === 'user' ? 'User' : 'AI';
        return `${speaker}: ${turn.text}`;
      })
      .join('\n\n');
  }

  /**
   * Get current assessment focus
   */
  getCurrentFocus(): AssessmentFocus {
    return this.currentFocus;
  }

  /**
   * Check if currently processing
   */
  isCurrentlyProcessing(): boolean {
    return this.isProcessing;
  }

  /**
   * End conversation and return summary
   */
  end(): {
    transcript: string;
    turns: ConversationTurn[];
    metrics: ConversationMetrics;
  } {
    const summary = {
      transcript: this.getTranscript(),
      turns: this.getAllTurns(),
      metrics: this.getMetrics(),
    };

    console.log('[ConversationManager] Conversation ended', {
      totalTurns: this.turns.length,
      duration: summary.metrics.totalDuration,
    });

    return summary;
  }

  /**
   * Reset/clear conversation
   */
  reset(): void {
    this.turns = [];
    this.currentFocus = 'general';
    this.conversationStartTime = null;
    this.lastTurnTime = null;
    this.isProcessing = false;
    console.log('[ConversationManager] Reset');
  }
}

/**
 * Singleton instance for the app
 */
let conversationManagerInstance: ConversationManager | null = null;

export function getConversationManager(): ConversationManager {
  if (!conversationManagerInstance) {
    conversationManagerInstance = new ConversationManager();
  }
  return conversationManagerInstance;
}

