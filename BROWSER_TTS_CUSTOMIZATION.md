# Browser TTS Voice Customization Guide

## ✅ What I Just Implemented

Added intelligent voice selection to your conversation analysis page with:

1. **Automatic best voice selection** - Finds the highest quality English voice available
2. **Optimized voice settings** - Slower rate (0.85) and slightly higher pitch (1.1) for warmth
3. **Cross-browser compatibility** - Works on Chrome, Safari, Firefox, Edge

## 🎤 Current Voice Settings

```typescript
utterance.rate = 0.85      // Slightly slower for clarity (default: 1.0)
utterance.pitch = 1.1      // Slightly higher for friendliness (default: 1.0)
utterance.volume = 1.0     // Full volume (default: 1.0)
```

## 🔧 How to Customize Further

### Option 1: Change Voice Preferences

In `app/conversation-analysis/page.tsx`, find the `preferences` array:

```typescript
const preferences = [
  // Add your preferred voices here (by name)
  'Google US English Female',
  'Microsoft Zira',
  'Samantha',
  // ... more voices
]
```

**To use a different voice:**
1. Open browser console (F12)
2. Run: `speechSynthesis.getVoices().forEach(v => console.log(v.name, v.lang))`
3. Copy your preferred voice name
4. Add it to the top of the `preferences` array

### Option 2: Adjust Voice Parameters

**Make voice sound more natural:**
```typescript
utterance.rate = 0.85      // Range: 0.1 to 10
utterance.pitch = 1.0      // Range: 0 to 2  
utterance.volume = 1.0     // Range: 0 to 1
```

**Examples:**

**Slower, calm voice (for relaxation):**
```typescript
utterance.rate = 0.7       // Slower
utterance.pitch = 0.9      // Slightly lower
utterance.volume = 0.8     // Softer
```

**Energetic, upbeat voice:**
```typescript
utterance.rate = 1.1       // Faster
utterance.pitch = 1.3      // Higher
utterance.volume = 1.0     // Full volume
```

**Professional, authoritative voice:**
```typescript
utterance.rate = 0.9       // Slightly slower
utterance.pitch = 0.85     // Lower pitch
utterance.volume = 1.0     // Full volume
```

### Option 3: Use Male Voice Instead

Replace the voice selection logic:

```typescript
const preferences = [
  // Male voices
  'Google US English Male',
  'Microsoft David',
  'Alex',
  'Daniel',
  // Any English male voice
  (v: SpeechSynthesisVoice) => v.lang.startsWith('en') && v.name.toLowerCase().includes('male'),
  // Any English voice
  (v: SpeechSynthesisVoice) => v.lang.startsWith('en'),
]
```

## 📊 Available Voices by OS

### Windows
- **Microsoft Zira** (Female, en-US) ⭐ High quality
- **Microsoft David** (Male, en-US)
- **Microsoft Mark** (Male, en-US)

### macOS
- **Samantha** (Female, en-US) ⭐ High quality
- **Alex** (Male, en-US) ⭐ High quality
- **Karen** (Female, en-AU)
- **Daniel** (Male, en-GB)
- **Moira** (Female, en-IE)
- **Fiona** (Female, en-Scotland)

### Chrome (with Google voices)
- **Google US English Female** ⭐ High quality
- **Google US English Male**
- **Google UK English Female**
- **Google UK English Male**

### Android
- Varies by device, usually includes Google voices

### iOS/Safari
- Uses macOS voices (Samantha, Alex, etc.)

## 🎯 Recommended Settings for Your App

For a **cognitive health monitoring app**, I recommend:

```typescript
// Warm, clear, professional voice
utterance.rate = 0.85      // Slow enough for comprehension
utterance.pitch = 1.1      // Friendly and approachable
utterance.volume = 1.0     // Clear and audible

// Prioritize female voices (generally perceived as more empathetic)
preferences = [
  'Samantha',              // macOS - excellent quality
  'Google US English Female', // Chrome - excellent quality
  'Microsoft Zira',        // Windows - good quality
  // ... fallbacks
]
```

**Why these settings:**
- ✅ **0.85 rate**: Gives users time to process information
- ✅ **1.1 pitch**: Warmer and more engaging than default
- ✅ **Female voice**: Studies show better engagement for health apps
- ✅ **English voices**: Ensures clarity for your target audience

## 🧪 Testing Different Voices

Add this button to your page for testing (development only):

```typescript
{/* Voice Test Button - Remove in production */}
<Button onClick={() => {
  const voices = window.speechSynthesis.getVoices();
  voices.forEach((voice, i) => {
    setTimeout(() => {
      const utterance = new SpeechSynthesisUtterance(
        `Hello, I am ${voice.name}`
      );
      utterance.voice = voice;
      utterance.rate = 0.85;
      utterance.pitch = 1.1;
      window.speechSynthesis.speak(utterance);
    }, i * 3000); // 3 seconds between each
  });
}}>
  Test All Voices
</Button>
```

## 🔍 Debugging Voice Issues

### Issue: No voices available

**Solution:** Voices load asynchronously. The code now includes:
```typescript
useEffect(() => {
  window.speechSynthesis.onvoiceschanged = () => {
    const voices = window.speechSynthesis.getVoices();
    console.log('Voices loaded:', voices.length);
  }
}, []);
```

### Issue: Voice sounds robotic

**Solution:** Adjust rate and pitch:
```typescript
utterance.rate = 0.85;  // Slower = more natural
utterance.pitch = 1.1;  // Slight variation = less robotic
```

### Issue: Voice cuts off

**Solution:** Some browsers stop speech if tab is inactive. Add:
```typescript
utterance.onend = () => {
  console.log('Speech completed');
};

utterance.onerror = (event) => {
  console.error('Speech error:', event);
};
```

## 📝 Quick Reference

| Parameter | Range | Default | Your Setting | Effect |
|-----------|-------|---------|--------------|--------|
| `rate` | 0.1 - 10 | 1.0 | 0.85 | Speed of speech |
| `pitch` | 0 - 2 | 1.0 | 1.1 | Frequency of voice |
| `volume` | 0 - 1 | 1.0 | 1.0 | Loudness |
| `voice` | null or SpeechSynthesisVoice | null | Auto-selected | Specific voice |

## 🎨 Advanced: Dynamic Voice Selection

Want different voices for different contexts?

```typescript
const getVoiceForContext = (context: 'greeting' | 'instruction' | 'result') => {
  const voices = window.speechSynthesis.getVoices();
  
  switch(context) {
    case 'greeting':
      // Warm, friendly voice
      return voices.find(v => v.name === 'Samantha') || voices[0];
    case 'instruction':
      // Clear, professional voice
      return voices.find(v => v.name === 'Alex') || voices[0];
    case 'result':
      // Calm, reassuring voice
      return voices.find(v => v.name === 'Karen') || voices[0];
    default:
      return voices[0];
  }
};
```

## ✅ Current Implementation Status

- ✅ Automatic best voice selection
- ✅ Optimized rate/pitch/volume
- ✅ Cross-browser compatibility
- ✅ Fallback to default if no voice available
- ✅ Logging for debugging
- ✅ Voice preloading

## 🚀 Next Steps (Optional)

1. **Add voice selection UI** - Let users choose their preferred voice
2. **Save voice preference** - Store in localStorage
3. **Add voice preview** - Test button to hear current voice
4. **Language support** - Add voices for other languages

## 📚 Resources

- [MDN Web Speech API](https://developer.mozilla.org/en-US/docs/Web/API/Web_Speech_API)
- [SpeechSynthesis Browser Support](https://caniuse.com/speech-synthesis)
- [Voice List by Browser](https://developer.mozilla.org/en-US/docs/Web/API/SpeechSynthesis/getVoices)

