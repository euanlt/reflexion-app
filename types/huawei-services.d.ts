/**
 * Type definitions for Huawei Cloud Services
 */

export interface HuaweiIAMTokenRequest {
  auth: {
    identity: {
      methods: string[];
      password: {
        user: {
          domain: {
            name: string;
          };
          name: string;
          password: string;
        };
      };
    };
    scope: {
      project: {
        name: string;
      };
    };
  };
}

export interface HuaweiIAMTokenResponse {
  token: {
    expires_at: string;
    methods: string[];
    catalog: any[];
    roles: any[];
    project: {
      domain: {
        id: string;
        name: string;
      };
      id: string;
      name: string;
    };
    user: {
      domain: {
        id: string;
        name: string;
      };
      id: string;
      name: string;
    };
  };
}

export interface HuaweiSISTranscribeRequest {
  config: {
    audio_format: string;
    asr_mode?: string;
    language?: string;
    sample_rate?: number;
    property?: string;
  };
  data: string; // base64 encoded audio
}

export interface HuaweiSISResponse {
  result: {
    text: string;
  };
  trace_id?: string;
  segments?: Array<{
    start_time: number;
    end_time: number;
    result: {
      text: string;
      word_info?: Array<{
        start_time: number;
        end_time: number;
        word: string;
      }>;
    };
  }>;
}

export interface HuaweiTTSRequest {
  text: string;
  config?: {
    audio_format?: string;
    sample_rate?: string;
    property?: string;
    speed?: number;
    pitch?: number;
    volume?: number;
  };
}

export interface HuaweiTTSResponse {
  result: {
    data: string; // base64 audio
  };
  trace_id?: string;
}

export interface ModelArtsGreetingRequest {
  inputs?: {
    time_of_day?: string;
    user_name?: string;
    previous_conversations?: number;
  };
}

export interface ModelArtsGreetingResponse {
  greeting: string;
  trace_id?: string;
}

export interface TranscriptionResult {
  transcript: string;
  confidence?: number;
  duration?: number;
  wordCount?: number;
}

export interface SpeechSynthesisResult {
  audioData: string; // base64
  format: string;
  duration?: number;
}

