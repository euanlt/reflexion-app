import { NextRequest, NextResponse } from 'next/server';
import { generateConversationResponse } from '@/lib/services/huawei-modelarts.service';
import type { AssessmentFocus } from '@/lib/ai/cognitive-prompts';

/**
 * API route to generate conversational AI response
 * Uses Huawei ModelArts (server-side with env variables)
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { conversationHistory, assessmentFocus } = body;

    if (!conversationHistory) {
      return NextResponse.json(
        { error: 'No conversation history provided' },
        { status: 400 }
      );
    }

    console.log('[Generate Response API] Generating AI response...');
    console.log('[Generate Response API] History length:', conversationHistory.length);
    console.log('[Generate Response API] Focus:', assessmentFocus);

    // Generate response using ModelArts (server-side)
    const aiResponse = await generateConversationResponse(
      conversationHistory,
      assessmentFocus || 'general'
    );

    console.log('[Generate Response API] ✓ Response generated');

    return NextResponse.json({
      success: true,
      response: aiResponse,
    });
  } catch (error) {
    console.error('[Generate Response API] Error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to generate response',
      },
      { status: 500 }
    );
  }
}

