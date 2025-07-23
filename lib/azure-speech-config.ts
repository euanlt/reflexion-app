// Azure OpenAI Configuration
export const AZURE_OPENAI_CONFIG = {
  endpoint: process.env.NEXT_PUBLIC_AZURE_OPENAI_ENDPOINT || '',
  apiKey: process.env.NEXT_PUBLIC_AZURE_OPENAI_API_KEY || '',
  deployment: process.env.NEXT_PUBLIC_AZURE_OPENAI_DEPLOYMENT || 'gpt-4o-mini-audio-preview',
  apiVersion: process.env.NEXT_PUBLIC_AZURE_OPENAI_API_VERSION || '2025-01-01-preview'
};

// Convert Blob to Base64
export async function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const base64 = reader.result as string;
      resolve(base64.split(',')[1]);
    };
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

// Call Azure OpenAI API
export async function callAzureOpenAI(messages: any[], includeAudio: boolean = false) {
  const url = `${AZURE_OPENAI_CONFIG.endpoint}/openai/deployments/${AZURE_OPENAI_CONFIG.deployment}/chat/completions?api-version=${AZURE_OPENAI_CONFIG.apiVersion}`;
  
  const body: any = {
    messages: messages,
    max_tokens: 1000,
    temperature: 0.7
  };

  if (includeAudio) {
    body.modalities = ["text", "audio"];
    body.audio = {
      voice: 'alloy',
      format: 'wav'
    };
  }

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'api-key': AZURE_OPENAI_CONFIG.apiKey
    },
    body: JSON.stringify(body)
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`API Error (${response.status}): ${error}`);
  }

  return await response.json();
}

// Transcribe audio using Azure OpenAI
export async function transcribeAudioWithAzure(audioBlob: Blob): Promise<string> {
  try {
    const base64Audio = await blobToBase64(audioBlob);
    
    const messages = [{
      role: 'user',
      content: [
        {
          type: 'text',
          text: 'Please transcribe this audio word for word. Provide only the transcription without any additional commentary or analysis.'
        },
        {
          type: 'input_audio',
          input_audio: {
            data: base64Audio,
            format: 'wav'
          }
        }
      ]
    }];

    const response = await callAzureOpenAI(messages);
    const transcription = response.choices[0].message.content;
    
    return transcription || '';
  } catch (error) {
    console.error('Azure transcription error:', error);
    throw error;
  }
}