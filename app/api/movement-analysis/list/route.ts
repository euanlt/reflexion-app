import { NextRequest, NextResponse } from 'next/server';
import { getOBSService } from '@/lib/services/huawei-obs.service';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * GET /api/movement-analysis/list
 * List all movement analyses from OBS for a specific user
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId') || 'anonymous';
    const maxKeys = parseInt(searchParams.get('maxKeys') || '100', 10);

    const obsService = getOBSService();

    try {
      // List videos for the user
      const videoPrefix = `movement-analysis/videos/${userId}/`;
      const videos = await obsService.listObjects(videoPrefix, maxKeys);

      // List results for the user
      const resultsPrefix = `movement-analysis/results/${userId}/`;
      const results = await obsService.listObjects(resultsPrefix, maxKeys);

      obsService.close();

      // Combine and format the data
      const analyses = videos.map((video: any) => {
        // Extract timestamp from video key
        const keyParts = video.Key.split('/');
        const filename = keyParts[keyParts.length - 1];
        const timestampMatch = filename.match(/^(.+?)-(.+?)\.webm$/);
        
        const timestamp = timestampMatch ? timestampMatch[1] : '';
        const taskType = timestampMatch ? timestampMatch[2] : '';

        // Find corresponding results
        const resultsKey = results.find((r: any) => 
          r.Key.includes(timestamp) && r.Key.includes(taskType)
        )?.Key;

        return {
          videoKey: video.Key,
          resultsKey,
          timestamp,
          taskType,
          size: video.Size,
          lastModified: video.LastModified,
        };
      });

      return NextResponse.json({
        success: true,
        data: {
          analyses,
          count: analyses.length,
          userId,
        },
      });
    } catch (obsError) {
      obsService.close();
      throw obsError;
    }
  } catch (error) {
    console.error('Error listing movement analyses:', error);
    return NextResponse.json(
      {
        error: 'Failed to list movement analyses',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

