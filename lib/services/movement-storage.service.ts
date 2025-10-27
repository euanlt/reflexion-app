import {
  db,
  VideoAssessment,
  saveVideoAssessment,
  getVideoAssessments,
  updateVideoAssessmentCloudSync,
} from '../db';

export interface SaveMovementAnalysisParams {
  videoBlob: Blob;
  analysisResults: VideoAssessment['analysisResults'];
  taskType: VideoAssessment['taskType'];
  videoDuration: number;
  userId?: string;
}

export interface MovementAnalysisWithUrl extends VideoAssessment {
  videoUrl?: string;
  resultsUrl?: string;
}

/**
 * Movement Analysis Storage Service
 * Handles saving movement analysis to both OBS and local IndexedDB
 */
export class MovementStorageService {
  private static instance: MovementStorageService;

  private constructor() {}

  static getInstance(): MovementStorageService {
    if (!MovementStorageService.instance) {
      MovementStorageService.instance = new MovementStorageService();
    }
    return MovementStorageService.instance;
  }

  /**
   * Save movement analysis to cloud and local storage
   */
  async saveMovementAnalysis(params: SaveMovementAnalysisParams): Promise<{
    localId: number;
    videoKey: string;
    resultsKey: string;
  }> {
    const {
      videoBlob,
      analysisResults,
      taskType,
      videoDuration,
      userId = 'anonymous',
    } = params;

    const timestamp = new Date().toISOString();

    // First, save to local database with pending status
    const localAssessment: Omit<VideoAssessment, 'id'> = {
      taskType,
      videoBlob,
      videoDuration,
      analysisResults,
      recordedAt: timestamp,
      analyzedAt: timestamp,
      cloudSyncStatus: 'uploading',
      userId,
    };

    const localId = await saveVideoAssessment(localAssessment);

    try {
      // Prepare form data for upload
      const formData = new FormData();
      formData.append('video', videoBlob, `${timestamp}.webm`);
      formData.append('results', JSON.stringify(analysisResults));
      formData.append('userId', userId);
      formData.append('taskType', taskType);
      formData.append('timestamp', timestamp);

      // Upload to cloud via API
      const response = await fetch('/api/movement-analysis/upload', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Upload failed');
      }

      const result = await response.json();

      if (!result.success) {
        throw new Error('Upload failed');
      }

      // Update local database with cloud references
      await updateVideoAssessmentCloudSync(
        localId,
        result.data.videoKey,
        result.data.resultsKey
      );

      return {
        localId,
        videoKey: result.data.videoKey,
        resultsKey: result.data.resultsKey,
      };
    } catch (error) {
      // Mark as failed in local database
      await db.videoAssessments.update(localId, {
        cloudSyncStatus: 'failed',
      });

      console.error('Error saving movement analysis:', error);
      throw new Error(
        `Failed to save to cloud: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  /**
   * Get movement analysis history from local database
   */
  async getMovementAnalysisHistory(limit: number = 10): Promise<VideoAssessment[]> {
    try {
      return await getVideoAssessments(limit);
    } catch (error) {
      console.error('Error getting movement analysis history:', error);
      return [];
    }
  }

  /**
   * Get a specific movement analysis with cloud video URL
   */
  async getMovementAnalysisById(id: number): Promise<MovementAnalysisWithUrl | null> {
    try {
      const assessment = await db.videoAssessments.get(id);
      
      if (!assessment) {
        return null;
      }

      // If synced to cloud, get signed URLs
      if (assessment.cloudSyncStatus === 'synced' && assessment.obsVideoKey) {
        try {
          const response = await fetch(
            `/api/movement-analysis/${id}?videoKey=${encodeURIComponent(assessment.obsVideoKey)}&resultsKey=${encodeURIComponent(assessment.obsResultsKey || '')}`
          );

          if (response.ok) {
            const result = await response.json();
            return {
              ...assessment,
              videoUrl: result.data.videoUrl,
              resultsUrl: result.data.resultsUrl,
            };
          }
        } catch (error) {
          console.error('Error fetching signed URLs:', error);
        }
      }

      // Return without URLs if not synced or if fetch failed
      return assessment;
    } catch (error) {
      console.error('Error getting movement analysis by ID:', error);
      return null;
    }
  }

  /**
   * Get analyses by cloud sync status
   */
  async getAnalysesByStatus(
    status: VideoAssessment['cloudSyncStatus']
  ): Promise<VideoAssessment[]> {
    try {
      return await db.videoAssessments
        .where('cloudSyncStatus')
        .equals(status || 'pending')
        .toArray();
    } catch (error) {
      console.error('Error getting analyses by status:', error);
      return [];
    }
  }

  /**
   * Retry failed uploads
   */
  async retryFailedUploads(): Promise<number> {
    const failedAssessments = await this.getAnalysesByStatus('failed');
    let successCount = 0;

    for (const assessment of failedAssessments) {
      if (!assessment.id || !assessment.videoBlob || !assessment.analysisResults) {
        continue;
      }

      try {
        await db.videoAssessments.update(assessment.id, {
          cloudSyncStatus: 'uploading',
        });

        const timestamp = new Date().toISOString();
        const formData = new FormData();
        formData.append('video', assessment.videoBlob, `${timestamp}.webm`);
        formData.append('results', JSON.stringify(assessment.analysisResults));
        formData.append('userId', assessment.userId || 'anonymous');
        formData.append('taskType', assessment.taskType);
        formData.append('timestamp', assessment.recordedAt);

        const response = await fetch('/api/movement-analysis/upload', {
          method: 'POST',
          body: formData,
        });

        if (response.ok) {
          const result = await response.json();
          await updateVideoAssessmentCloudSync(
            assessment.id,
            result.data.videoKey,
            result.data.resultsKey
          );
          successCount++;
        } else {
          await db.videoAssessments.update(assessment.id, {
            cloudSyncStatus: 'failed',
          });
        }
      } catch (error) {
        console.error(`Error retrying upload for assessment ${assessment.id}:`, error);
        if (assessment.id) {
          await db.videoAssessments.update(assessment.id, {
            cloudSyncStatus: 'failed',
          });
        }
      }
    }

    return successCount;
  }

  /**
   * Get cloud storage statistics
   */
  async getStorageStats(): Promise<{
    total: number;
    synced: number;
    pending: number;
    failed: number;
    uploading: number;
  }> {
    const all = await db.videoAssessments.toArray();
    
    return {
      total: all.length,
      synced: all.filter(a => a.cloudSyncStatus === 'synced').length,
      pending: all.filter(a => a.cloudSyncStatus === 'pending').length,
      failed: all.filter(a => a.cloudSyncStatus === 'failed').length,
      uploading: all.filter(a => a.cloudSyncStatus === 'uploading').length,
    };
  }
}

// Export singleton instance
export const movementStorageService = MovementStorageService.getInstance();

