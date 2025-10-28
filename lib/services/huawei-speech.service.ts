/**
 * Huawei Cloud Speech Recognition Service (SIS)
 * Provides speech-to-text transcription capabilities
 */

import type { HuaweiSISResponse, TranscriptionResult } from '@/types/huawei-services';
import { getIAMToken, getIAMConfig } from './huawei-iam.service';

interface SISConfig {
  projectId: string;
  region: string;
  endpoint?: string;
}

/**
 * Convert audio blob to base64 string
 */
async function audioToBase64(audioBlob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const base64 = (reader.result as string).split(',')[1];
      resolve(base64);
    };
    reader.onerror = reject;
    reader.readAsDataURL(audioBlob);
  });
}

/**
 * Transcribe audio using Huawei SIS
 */
export async function transcribeAudio(
  audioBlob: Blob
): Promise<TranscriptionResult> {
  const config = getSISConfig();
  
  if (!config.projectId) {
    throw new Error('Huawei SIS project ID is not configured');
  }

  try {
    // Convert audio to base64
    const audioBase64 = await audioToBase64(audioBlob);

    // Get authentication token
    const iamConfig = getIAMConfig();
    const token = await getIAMToken(iamConfig);

    // Prepare SIS API request
    const endpoint = config.endpoint || `https://sis-ext.${config.region}.myhuaweicloud.com`;
    const url = `${endpoint}/v1/${config.projectId}/asr/short-audio`;

    const requestBody = {
      config: {
        audio_format: 'wav',
        asr_mode: 'short',
        language: 'english_8k',
        sample_rate: 16000,
        property: 'english_16k_general',
      },
      data: audioBase64,
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
      console.error('SIS API error:', errorText);
      throw new Error(`SIS transcription failed: ${response.status} ${response.statusText}`);
    }

    const data: HuaweiSISResponse = await response.json();

    // Extract transcript from response
    const transcript = data.result?.text || '';
    
    // Count words for analysis
    const wordCount = transcript.split(/\s+/).filter(word => word.length > 0).length;

    return {
      transcript,
      confidence: 0.95, // SIS doesn't always return confidence, default to high
      duration: audioBlob.size / 16000, // Rough estimate
      wordCount,
    };
  } catch (error) {
    console.error('Error transcribing audio:', error);
    throw new Error(error instanceof Error ? error.message : 'Failed to transcribe audio');
  }
}

/**
 * Get SIS configuration from environment variables
 */
export function getSISConfig(): SISConfig {
  return {
    projectId: process.env.HUAWEI_SIS_PROJECT_ID || '',
    region: process.env.HUAWEI_SIS_REGION || 'ap-southeast-1',
  };
}

