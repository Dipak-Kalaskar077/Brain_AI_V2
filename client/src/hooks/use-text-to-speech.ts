import { useState, useCallback, useEffect } from 'react';

interface UseTextToSpeechOptions {
  rate?: number;
  pitch?: number;
  volume?: number;
}

export function useTextToSpeech(options: UseTextToSpeechOptions = {}) {
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [utterance, setUtterance] = useState<SpeechSynthesisUtterance | null>(null);
  const [voice, setVoice] = useState<SpeechSynthesisVoice | null>(null);
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
  
  // Set default options
  const { rate = 1, pitch = 1, volume = 1 } = options;

  // Initialize voices when the component mounts
  useEffect(() => {
    if (!window.speechSynthesis) return;
    
    // Function to load and set available voices
    const loadVoices = () => {
      const availableVoices = window.speechSynthesis.getVoices();
      if (availableVoices.length > 0) {
        setVoices(availableVoices);
        
        // Try to find an English voice, preferably female
        const englishVoice = availableVoices.find(
          (v) => v.lang.includes('en') && v.name.includes('Female')
        ) || availableVoices.find(
          (v) => v.lang.includes('en')
        ) || availableVoices[0];
        
        setVoice(englishVoice);
      }
    };
    
    // Load voices right away in case they're already available
    loadVoices();
    
    // Chrome loads voices asynchronously, so we need this event
    window.speechSynthesis.onvoiceschanged = loadVoices;
    
    // Cleanup
    return () => {
      window.speechSynthesis.onvoiceschanged = null;
      if (window.speechSynthesis.speaking) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);
  
  // Handle speech end and errors
  useEffect(() => {
    if (!utterance) return;
    
    const handleEnd = () => {
      setIsSpeaking(false);
      setIsPaused(false);
    };
    
    const handleError = (e: Event) => {
      console.error('Speech synthesis error:', e);
      setIsSpeaking(false);
      setIsPaused(false);
    };
    
    utterance.onend = handleEnd;
    utterance.onerror = handleError;
    
    return () => {
      utterance.onend = null;
      utterance.onerror = null;
    };
  }, [utterance]);
  
  // Speak text
  const speak = useCallback((text: string) => {
    if (!window.speechSynthesis) {
      console.error('Speech synthesis not supported in this browser');
      return;
    }
    
    // Cancel any ongoing speech
    window.speechSynthesis.cancel();
    
    // Create new utterance
    const newUtterance = new SpeechSynthesisUtterance(text);
    
    // Set properties
    newUtterance.rate = rate;
    newUtterance.pitch = pitch;
    newUtterance.volume = volume;
    
    if (voice) {
      newUtterance.voice = voice;
    }
    
    // Store and speak
    setUtterance(newUtterance);
    window.speechSynthesis.speak(newUtterance);
    setIsSpeaking(true);
    setIsPaused(false);
  }, [rate, pitch, volume, voice]);
  
  // Stop speaking
  const stop = useCallback(() => {
    if (!window.speechSynthesis) return;
    
    window.speechSynthesis.cancel();
    setIsSpeaking(false);
    setIsPaused(false);
  }, []);
  
  // Pause speaking
  const pause = useCallback(() => {
    if (!window.speechSynthesis || !isSpeaking) return;
    
    window.speechSynthesis.pause();
    setIsPaused(true);
  }, [isSpeaking]);
  
  // Resume speaking
  const resume = useCallback(() => {
    if (!window.speechSynthesis || !isPaused) return;
    
    window.speechSynthesis.resume();
    setIsPaused(false);
  }, [isPaused]);
  
  return {
    speak,
    stop,
    pause,
    resume,
    isSpeaking,
    isPaused,
    voices,
    currentVoice: voice,
    setVoice,
    isSupported: !!window.speechSynthesis,
  };
}
