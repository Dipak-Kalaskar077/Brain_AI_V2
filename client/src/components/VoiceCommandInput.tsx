import React, { useState, useCallback, useEffect } from 'react';
import { Button } from './ui/button';
import { Mic, MicOff } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface VoiceCommandInputProps {
  onCommand: (command: string) => void;
}

export function VoiceCommandInput({ onCommand }: VoiceCommandInputProps) {
  const [isListening, setIsListening] = useState(false);
  const [recognition, setRecognition] = useState<SpeechRecognition | null>(null);
  const { toast } = useToast();

  const startListening = useCallback(() => {
    try {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      const recognition = new SpeechRecognition();
      
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = 'en-US';

      recognition.onstart = () => {
        toast({
          title: "Voice Command Active",
          description: "Listening for commands...",
        });
        setIsListening(true);
      };

      recognition.onresult = (event) => {
        const transcript = Array.from(event.results)
          .map(result => result[0].transcript)
          .join('');

        if (event.results[0].isFinal) {
          onCommand(transcript.toLowerCase());
        }
      };

      recognition.onerror = (event) => {
        console.error('Speech recognition error:', event.error);
        toast({
          title: "Error",
          description: "Failed to recognize voice command",
          variant: "destructive",
        });
        setIsListening(false);
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      setRecognition(recognition);
      recognition.start();
    } catch (error) {
      toast({
        title: "Error",
        description: "Voice recognition not supported in this browser",
        variant: "destructive",
      });
    }
  }, [onCommand, toast]);

  const stopListening = useCallback(() => {
    if (recognition) {
      recognition.stop();
      setIsListening(false);
      toast({
        title: "Voice Command Stopped",
        description: "Voice input deactivated",
      });
    }
  }, [recognition, toast]);

  useEffect(() => {
    return () => {
      if (recognition) {
        recognition.stop();
      }
    };
  }, [recognition]);

  return (
    <Button
      variant="outline"
      size="icon"
      onClick={isListening ? stopListening : startListening}
      className={`transition-colors ${isListening ? 'bg-red-100 hover:bg-red-200' : 'hover:bg-accent'}`}
    >
      {isListening ? (
        <MicOff className="h-5 w-5 text-red-500" />
      ) : (
        <Mic className="h-5 w-5" />
      )}
    </Button>
  );
}