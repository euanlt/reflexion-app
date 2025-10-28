/**
 * Huawei Cloud Text-to-Speech Service (TTS)
 * Provides speech synthesis capabilities
 */

import type { HuaweiTTSResponse, SpeechSynthesisResult } from '@/types/huawei-services';
import { getIAMToken, getIAMConfig } from './huawei-iam.service';

interface TTSConfig {
  projectId: string;
  region: string;
  endpoint?: string;
}

/**
 * Synthesize speech from text using Huawei TTS
 */
export async function synthesizeSpeech(
  text: string,
  options?: {
    speed?: number;
    pitch?: number;
    volume?: number;
  }
): Promise<SpeechSynthesisResult> {
  const config = getTTSConfig();
  
  if (!config.projectId) {
    throw new Error('Huawei TTS project ID is not configured');
  }

  try {
    // Get authentication token
    const iamConfig = getIAMConfig();
    const token = await getIAMToken(iamConfig);

    // Prepare TTS API request
    const endpoint = config.endpoint || `https://sis-ext.${config.region}.myhuaweicloud.com`;
    const url = `${endpoint}/v1/${config.projectId}/tts`;

    const requestBody = {
      text,
      config: {
        audio_format: 'wav',
        sample_rate: '16000',
        property: 'english_emily_common',
        speed: options?.speed || 0,
        pitch: options?.pitch || 0,
        volume: options?.volume || 0,
      },
    };

    // Make API request
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Auth-Token': token,
      },
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('TTS API error:', errorText);
      throw new Error(`TTS synthesis failed: ${response.status} ${response.statusText}`);
    }

    const data: HuaweiTTSResponse = await response.json();

    // Return base64 audio data
    return {
      audioData: data.result.data,
      format: 'wav',
      duration: text.length * 0.05, // Rough estimate: 50ms per character
    };
  } catch (error) {
    console.error('Error synthesizing speech:', error);
    throw new Error(error instanceof Error ? error.message : 'Failed to synthesize speech');
  }
}

/**
 * Convert base64 audio to blob
 */
export function base64ToAudioBlob(base64: string, mimeType: string = 'audio/wav'): Blob {
  const binaryString = atob(base64);
  const bytes = new Uint8Array(binaryString.length);
  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return new Blob([bytes], { type: mimeType });
}

/**
 * Get TTS configuration from environment variables
 */
export function getTTSConfig(): TTSConfig {
  return {
    projectId: process.env.HUAWEI_SIS_PROJECT_ID || '',
    region: process.env.HUAWEI_SIS_REGION || 'ap-southeast-1',
  };
}

