import { NextRequest, NextResponse } from 'next/server';
import { generateGreeting } from '@/lib/services/huawei-modelarts.service';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    
    const context = {
      userName: body.userName,
      timeOfDay: body.timeOfDay,
      previousConversations: body.previousConversations,
    };

    // Generate greeting using ModelArts (or fallback)
    const greeting = await generateGreeting(context);

    return NextResponse.json({
      success: true,
      greeting,
    });
  } catch (error) {
    console.error('Greeting generation API error:', error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Failed to generate greeting',
      },
      { status: 500 }
    );
  }
}

export async function GET() {
  // Allow GET requests for simple greeting generation
  try {
    const greeting = await generateGreeting();
    return NextResponse.json({
      success: true,
      greeting,
    });
  } catch (error) {
    console.error('Greeting generation API error:', error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Failed to generate greeting',
      },
      { status: 500 }
    );
  }
}

