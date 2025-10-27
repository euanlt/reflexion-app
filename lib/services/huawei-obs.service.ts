import ObsClient from 'esdk-obs-nodejs';

export interface OBSConfig {
  accessKeyId: string;
  secretAccessKey: string;
  endpoint: string;
  bucketName: string;
}

export interface UploadResult {
  key: string;
  etag: string;
  versionId?: string;
}

/**
 * Huawei Cloud OBS Service
 * Server-side only service for interacting with Huawei Cloud Object Storage
 */
export class HuaweiOBSService {
  private client: ObsClient;
  private bucketName: string;

  constructor(config: OBSConfig) {
    this.client = new ObsClient({
      access_key_id: config.accessKeyId,
      secret_access_key: config.secretAccessKey,
      server: config.endpoint,
    });
    this.bucketName = config.bucketName;
  }

  /**
   * Upload video blob to OBS
   */
  async uploadVideo(
    videoBuffer: Buffer,
    userId: string,
    timestamp: string,
    taskType: string
  ): Promise<UploadResult> {
    const key = `movement-analysis/videos/${userId}/${timestamp}-${taskType}.webm`;

    try {
      const result = await this.client.putObject({
        Bucket: this.bucketName,
        Key: key,
        Body: videoBuffer,
        ContentType: 'video/webm',
        Metadata: {
          userId,
          timestamp,
          taskType,
          uploadedAt: new Date().toISOString(),
        },
      });

      if (result.CommonMsg.Status < 300) {
        return {
          key,
          etag: result.InterfaceResult.ETag || '',
          versionId: result.InterfaceResult.VersionId,
        };
      } else {
        throw new Error(`Upload failed with status ${result.CommonMsg.Status}`);
      }
    } catch (error) {
      console.error('Error uploading video to OBS:', error);
      throw new Error(`Failed to upload video: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Upload analysis results (JSON) to OBS
   */
  async uploadAnalysisResults(
    analysisResults: any,
    userId: string,
    timestamp: string,
    taskType: string
  ): Promise<UploadResult> {
    const key = `movement-analysis/results/${userId}/${timestamp}-${taskType}.json`;
    const jsonContent = JSON.stringify(analysisResults, null, 2);

    try {
      const result = await this.client.putObject({
        Bucket: this.bucketName,
        Key: key,
        Body: Buffer.from(jsonContent, 'utf-8'),
        ContentType: 'application/json',
        Metadata: {
          userId,
          timestamp,
          taskType,
          uploadedAt: new Date().toISOString(),
        },
      });

      if (result.CommonMsg.Status < 300) {
        return {
          key,
          etag: result.InterfaceResult.ETag || '',
          versionId: result.InterfaceResult.VersionId,
        };
      } else {
        throw new Error(`Upload failed with status ${result.CommonMsg.Status}`);
      }
    } catch (error) {
      console.error('Error uploading results to OBS:', error);
      throw new Error(`Failed to upload results: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Generate a temporary signed URL for video access
   * Default expiration: 1 hour (3600 seconds)
   */
  async getSignedUrl(key: string, expiresInSeconds: number = 3600): Promise<string> {
    try {
      const result = await this.client.createSignedUrlSync({
        Method: 'GET',
        Bucket: this.bucketName,
        Key: key,
        Expires: expiresInSeconds,
      });

      if (result.CommonMsg.Status < 300 && result.InterfaceResult.SignedUrl) {
        return result.InterfaceResult.SignedUrl;
      } else {
        throw new Error(`Failed to generate signed URL: ${result.CommonMsg.Status}`);
      }
    } catch (error) {
      console.error('Error generating signed URL:', error);
      throw new Error(`Failed to generate signed URL: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * List objects in a specific prefix (folder)
   */
  async listObjects(prefix: string, maxKeys: number = 100): Promise<any[]> {
    try {
      const result = await this.client.listObjects({
        Bucket: this.bucketName,
        Prefix: prefix,
        MaxKeys: maxKeys,
      });

      if (result.CommonMsg.Status < 300 && result.InterfaceResult.Contents) {
        return result.InterfaceResult.Contents;
      } else {
        return [];
      }
    } catch (error) {
      console.error('Error listing objects:', error);
      throw new Error(`Failed to list objects: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Get object metadata
   */
  async getObjectMetadata(key: string): Promise<any> {
    try {
      const result = await this.client.getObjectMetadata({
        Bucket: this.bucketName,
        Key: key,
      });

      if (result.CommonMsg.Status < 300) {
        return result.InterfaceResult.Metadata || {};
      } else {
        throw new Error(`Failed to get metadata: ${result.CommonMsg.Status}`);
      }
    } catch (error) {
      console.error('Error getting object metadata:', error);
      throw new Error(`Failed to get metadata: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Delete an object
   */
  async deleteObject(key: string): Promise<boolean> {
    try {
      const result = await this.client.deleteObject({
        Bucket: this.bucketName,
        Key: key,
      });

      return result.CommonMsg.Status < 300;
    } catch (error) {
      console.error('Error deleting object:', error);
      throw new Error(`Failed to delete object: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Close the OBS client connection
   */
  close(): void {
    if (this.client) {
      this.client.close();
    }
  }
}

/**
 * Get OBS service instance with environment configuration
 * Server-side only
 */
export function getOBSService(): HuaweiOBSService {
  const config: OBSConfig = {
    accessKeyId: process.env.HUAWEI_OBS_ACCESS_KEY_ID || '',
    secretAccessKey: process.env.HUAWEI_OBS_SECRET_ACCESS_KEY || '',
    endpoint: process.env.HUAWEI_OBS_ENDPOINT || '',
    bucketName: process.env.HUAWEI_OBS_BUCKET_NAME || '',
  };

  // Validate configuration
  if (!config.accessKeyId || !config.secretAccessKey || !config.endpoint || !config.bucketName) {
    throw new Error('Missing required Huawei Cloud OBS configuration. Please check environment variables.');
  }

  return new HuaweiOBSService(config);
}

