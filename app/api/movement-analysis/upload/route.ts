import { NextRequest, NextResponse } from 'next/server';
import { getOBSService } from '@/lib/services/huawei-obs.service';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * POST /api/movement-analysis/upload
 * Upload video and analysis results to Huawei Cloud OBS
 */
export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    
    const videoFile = formData.get('video') as File;
    const resultsJson = formData.get('results') as string;
    const userId = formData.get('userId') as string || 'anonymous';
    const taskType = formData.get('taskType') as string || 'movement';
    const timestamp = formData.get('timestamp') as string || new Date().toISOString();

    if (!videoFile || !resultsJson) {
      return NextResponse.json(
        { error: 'Missing required fields: video and results' },
        { status: 400 }
      );
    }

    // Parse analysis results
    const analysisResults = JSON.parse(resultsJson);

    // Convert video file to buffer
    const videoArrayBuffer = await videoFile.arrayBuffer();
    const videoBuffer = Buffer.from(videoArrayBuffer);

    // Initialize OBS service
    const obsService = getOBSService();

    try {
      // Upload video to OBS
      const videoUploadResult = await obsService.uploadVideo(
        videoBuffer,
        userId,
        timestamp,
        taskType
      );

      // Upload analysis results to OBS
      const resultsUploadResult = await obsService.uploadAnalysisResults(
        analysisResults,
        userId,
        timestamp,
        taskType
      );

      // Close OBS connection
      obsService.close();

      return NextResponse.json({
        success: true,
        data: {
          videoKey: videoUploadResult.key,
          resultsKey: resultsUploadResult.key,
          timestamp,
          userId,
          taskType,
        },
      });
    } catch (uploadError) {
      obsService.close();
      throw uploadError;
    }
  } catch (error) {
    console.error('Error in movement analysis upload:', error);
    return NextResponse.json(
      {
        error: 'Failed to upload movement analysis',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

