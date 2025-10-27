declare module 'esdk-obs-nodejs' {
  interface ObsClientConfig {
    access_key_id: string;
    secret_access_key: string;
    server: string;
  }

  interface PutObjectRequest {
    Bucket: string;
    Key: string;
    Body: Buffer;
    ContentType?: string;
    Metadata?: Record<string, string>;
  }

  interface GetObjectMetadataRequest {
    Bucket: string;
    Key: string;
  }

  interface DeleteObjectRequest {
    Bucket: string;
    Key: string;
  }

  interface ListObjectsRequest {
    Bucket: string;
    Prefix?: string;
    MaxKeys?: number;
  }

  interface CreateSignedUrlRequest {
    Method: string;
    Bucket: string;
    Key: string;
    Expires: number;
  }

  interface CommonMsg {
    Status: number;
    Code?: string;
    Message?: string;
  }

  interface PutObjectResult {
    CommonMsg: CommonMsg;
    InterfaceResult: {
      ETag?: string;
      VersionId?: string;
    };
  }

  interface GetObjectMetadataResult {
    CommonMsg: CommonMsg;
    InterfaceResult: {
      Metadata?: Record<string, string>;
    };
  }

  interface DeleteObjectResult {
    CommonMsg: CommonMsg;
    InterfaceResult: any;
  }

  interface ListObjectsResult {
    CommonMsg: CommonMsg;
    InterfaceResult: {
      Contents?: Array<{
        Key: string;
        Size: number;
        LastModified: string;
      }>;
    };
  }

  interface CreateSignedUrlResult {
    CommonMsg: CommonMsg;
    InterfaceResult: {
      SignedUrl?: string;
    };
  }

  class ObsClient {
    constructor(config: ObsClientConfig);
    
    putObject(request: PutObjectRequest): Promise<PutObjectResult>;
    
    getObjectMetadata(request: GetObjectMetadataRequest): Promise<GetObjectMetadataResult>;
    
    deleteObject(request: DeleteObjectRequest): Promise<DeleteObjectResult>;
    
    listObjects(request: ListObjectsRequest): Promise<ListObjectsResult>;
    
    createSignedUrlSync(request: CreateSignedUrlRequest): CreateSignedUrlResult;
    
    close(): void;
  }

  export default ObsClient;
}

