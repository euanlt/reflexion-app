/**
 * Voice Activity Detection (VAD)
 * Detects when user stops speaking based on audio volume levels
 */

export interface VADConfig {
  silenceThreshold: number;     // Volume threshold below which is considered silence (0-255)
  silenceDuration: number;      // Duration of silence in ms to trigger speech end
  minSpeechDuration: number;    // Minimum speech duration in ms to be considered valid
  sampleRate: number;           // How often to check audio levels (ms)
}

export class VoiceActivityDetector {
  private audioContext: AudioContext | null = null;
  private analyser: AnalyserNode | null = null;
  private dataArray: Uint8Array | null = null;
  private stream: MediaStream | null = null;
  
  private isActive = false;
  private isSpeaking = false;
  private silenceStartTime: number | null = null;
  private speechStartTime: number | null = null;
  private checkInterval: NodeJS.Timeout | null = null;
  
  private config: VADConfig;
  private onSpeechStart?: () => void;
  private onSpeechEnd?: () => void;
  private onVolumeChange?: (volume: number) => void;

  constructor(config?: Partial<VADConfig>) {
    this.config = {
      silenceThreshold: 30,        // Default: 30 out of 255
      silenceDuration: 2000,       // Default: 2 seconds
      minSpeechDuration: 300,      // Default: 300ms minimum speech
      sampleRate: 100,             // Default: check every 100ms
      ...config,
    };
  }

  /**
   * Start monitoring audio stream for voice activity
   */
  async start(
    stream: MediaStream,
    callbacks: {
      onSpeechStart?: () => void;
      onSpeechEnd?: () => void;
      onVolumeChange?: (volume: number) => void;
    }
  ): Promise<void> {
    if (this.isActive) {
      console.warn('[VAD] Already active');
      return;
    }

    this.onSpeechStart = callbacks.onSpeechStart;
    this.onSpeechEnd = callbacks.onSpeechEnd;
    this.onVolumeChange = callbacks.onVolumeChange;
    this.stream = stream;

    try {
      // Create audio context and analyser
      this.audioContext = new AudioContext();
      this.analyser = this.audioContext.createAnalyser();
      
      // Configure analyser
      this.analyser.fftSize = 2048;
      this.analyser.smoothingTimeConstant = 0.8;
      
      // Connect stream to analyser
      const source = this.audioContext.createMediaStreamSource(stream);
      source.connect(this.analyser);
      
      // Create data array for volume levels
      const bufferLength = this.analyser.frequencyBinCount;
      this.dataArray = new Uint8Array(bufferLength);
      
      this.isActive = true;
      this.isSpeaking = false;
      this.silenceStartTime = null;
      this.speechStartTime = null;
      
      // Start checking audio levels
      this.startChecking();
      
      console.log('[VAD] Started monitoring');
    } catch (error) {
      console.error('[VAD] Failed to start:', error);
      throw error;
    }
  }

  /**
   * Stop monitoring
   */
  stop(): void {
    if (!this.isActive) {
      return;
    }

    // Stop checking interval
    if (this.checkInterval) {
      clearInterval(this.checkInterval);
      this.checkInterval = null;
    }

    // Close audio context
    if (this.audioContext) {
      this.audioContext.close();
      this.audioContext = null;
    }

    this.analyser = null;
    this.dataArray = null;
    this.stream = null;
    this.isActive = false;
    this.isSpeaking = false;
    this.silenceStartTime = null;
    this.speechStartTime = null;

    console.log('[VAD] Stopped monitoring');
  }

  /**
   * Check if currently speaking
   */
  getIsSpeaking(): boolean {
    return this.isSpeaking;
  }

  /**
   * Get current audio volume level (0-255)
   */
  private getAudioLevel(): number {
    if (!this.analyser || !this.dataArray) {
      return 0;
    }

    // Get frequency data
    this.analyser.getByteFrequencyData(this.dataArray);

    // Calculate average volume
    let sum = 0;
    for (let i = 0; i < this.dataArray.length; i++) {
      sum += this.dataArray[i];
    }
    const average = sum / this.dataArray.length;

    return average;
  }

  /**
   * Periodically check audio levels
   */
  private startChecking(): void {
    this.checkInterval = setInterval(() => {
      const volume = this.getAudioLevel();
      
      // Notify volume change
      if (this.onVolumeChange) {
        this.onVolumeChange(volume);
      }

      // Check if speaking or silent
      const isSilent = volume < this.config.silenceThreshold;
      const now = Date.now();

      if (isSilent) {
        // Volume is below threshold (silence detected)
        if (this.isSpeaking) {
          // Was speaking, now silent
          if (this.silenceStartTime === null) {
            this.silenceStartTime = now;
          } else {
            // Check if silence duration exceeded
            const silenceDuration = now - this.silenceStartTime;
            if (silenceDuration >= this.config.silenceDuration) {
              // Silence long enough - speech has ended
              const speechDuration = this.speechStartTime 
                ? now - this.speechStartTime 
                : 0;
              
              // Only trigger if speech was long enough
              if (speechDuration >= this.config.minSpeechDuration) {
                console.log('[VAD] Speech ended (silence detected)');
                this.isSpeaking = false;
                this.speechStartTime = null;
                if (this.onSpeechEnd) {
                  this.onSpeechEnd();
                }
              } else {
                console.log('[VAD] Speech too short, ignoring');
                this.isSpeaking = false;
                this.speechStartTime = null;
              }
            }
          }
        }
      } else {
        // Volume is above threshold (speech detected)
        this.silenceStartTime = null; // Reset silence timer

        if (!this.isSpeaking) {
          // Was not speaking, now speaking
          console.log('[VAD] Speech started (volume:', volume, ')');
          this.isSpeaking = true;
          this.speechStartTime = now;
          if (this.onSpeechStart) {
            this.onSpeechStart();
          }
        }
      }
    }, this.config.sampleRate);
  }

  /**
   * Update configuration
   */
  updateConfig(config: Partial<VADConfig>): void {
    this.config = {
      ...this.config,
      ...config,
    };
    console.log('[VAD] Config updated:', this.config);
  }
}

/**
 * Simple helper function to create and start VAD
 */
export async function startVoiceActivityDetection(
  stream: MediaStream,
  onSpeechEnd: () => void,
  config?: Partial<VADConfig>
): Promise<VoiceActivityDetector> {
  const vad = new VoiceActivityDetector(config);
  await vad.start(stream, {
    onSpeechEnd,
    onSpeechStart: () => console.log('[VAD] User started speaking'),
    onVolumeChange: (volume) => {
      // Optionally log volume for debugging
      // console.log('[VAD] Volume:', volume);
    },
  });
  return vad;
}

