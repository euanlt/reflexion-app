import { NextRequest, NextResponse } from 'next/server';
import { getOBSService } from '@/lib/services/huawei-obs.service';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * GET /api/movement-analysis/[id]
 * Get a specific movement analysis with signed video URL
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { searchParams } = new URL(request.url);
    const videoKey = searchParams.get('videoKey');
    const resultsKey = searchParams.get('resultsKey');

    if (!videoKey) {
      return NextResponse.json(
        { error: 'Missing required parameter: videoKey' },
        { status: 400 }
      );
    }

    const obsService = getOBSService();

    try {
      // Generate signed URL for video (valid for 1 hour)
      const videoUrl = await obsService.getSignedUrl(videoKey, 3600);

      let resultsUrl = null;
      if (resultsKey) {
        resultsUrl = await obsService.getSignedUrl(resultsKey, 3600);
      }

      obsService.close();

      return NextResponse.json({
        success: true,
        data: {
          id: params.id,
          videoUrl,
          resultsUrl,
          expiresIn: 3600, // seconds
        },
      });
    } catch (obsError) {
      obsService.close();
      throw obsError;
    }
  } catch (error) {
    console.error('Error getting movement analysis:', error);
    return NextResponse.json(
      {
        error: 'Failed to get movement analysis',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

