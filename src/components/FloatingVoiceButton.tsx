import { useState, useEffect, useRef } from 'react';
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Mic, MicOff, Volume2, VolumeX, Activity } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/components/ui/use-toast';

interface FloatingVoiceButtonProps {
  className?: string;
}

export function FloatingVoiceButton({ className = "fixed bottom-6 right-6 z-50" }: FloatingVoiceButtonProps) {
  const [isListening, setIsListening] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [speechSupported, setSpeechSupported] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [vuLevel, setVuLevel] = useState(0);
  
  const recognitionRef = useRef<any>(null);
  const vuIntervalRef = useRef<number | null>(null);
  const { toast } = useToast();

  // Initialize speech recognition
  useEffect(() => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    setSpeechSupported(!!SpeechRecognition);

    if (SpeechRecognition) {
      const recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = true;
      recognition.lang = 'en-US';

      recognition.onresult = (event: any) => {
        let finalTranscript = '';
        let interimTranscript = '';

        for (let i = event.resultIndex; i < event.results.length; i++) {
          const transcript = event.results[i][0].transcript;
          if (event.results[i].isFinal) {
            finalTranscript += transcript;
          } else {
            interimTranscript += transcript;
          }
        }

        setTranscript(finalTranscript + interimTranscript);

        // Process final transcript
        if (finalTranscript.trim()) {
          processVoiceCommand(finalTranscript.trim());
          setTranscript('');
        }
      };

      recognition.onerror = (event: any) => {
        console.error('Speech recognition error:', event.error);
        setIsListening(false);
        stopVuMeter();
        
        if (event.error !== 'aborted') {
          toast({
            title: 'Speech Recognition Error',
            description: `Failed to recognize speech: ${event.error}`,
            variant: 'destructive'
          });
        }
      };

      recognition.onend = () => {
        setIsListening(false);
        stopVuMeter();
      };

      recognitionRef.current = recognition;
    }

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
      stopVuMeter();
    };
  }, []);

  // VU meter simulation
  const startVuMeter = () => {
    vuIntervalRef.current = window.setInterval(() => {
      setVuLevel(Math.random() * 100);
    }, 100);
  };

  const stopVuMeter = () => {
    if (vuIntervalRef.current) {
      clearInterval(vuIntervalRef.current);
      vuIntervalRef.current = null;
    }
    setVuLevel(0);
  };

  const toggleListening = () => {
    if (!speechSupported) {
      toast({
        title: 'Speech Not Supported',
        description: 'Your browser does not support speech recognition.',
        variant: 'destructive'
      });
      return;
    }

    if (isListening) {
      recognitionRef.current?.stop();
      setIsListening(false);
      stopVuMeter();
    } else {
      try {
        recognitionRef.current?.start();
        setIsListening(true);
        setTranscript('');
        startVuMeter();
      } catch (error) {
        console.error('Failed to start recognition:', error);
        toast({
          title: 'Microphone Error',
          description: 'Failed to start speech recognition. Please check microphone permissions.',
          variant: 'destructive'
        });
      }
    }
  };

  const processVoiceCommand = async (text: string) => {
    setIsProcessing(true);
    setIsListening(false);
    stopVuMeter();

    try {
      const { data, error } = await supabase.functions.invoke('voice-assistant', {
        body: {
          text,
          userId: 'demo-user',
          clientIp: 'unknown'
        }
      });

      if (error) {
        throw new Error(error.message);
      }

      const response = data.speechText || data.message || 'Command processed.';
      
      // Speak the response with await for better error handling
      await speak(response);

      toast({
        title: data.success ? 'Command Executed' : 'Command Failed',
        description: `${data.intent} - ${response}`,
        variant: data.success ? 'default' : 'destructive'
      });

    } catch (error) {
      const errorText = 'Sorry, I encountered an error processing your request.';
      speak(errorText);
      
      toast({
        title: 'Voice Command Error',
        description: error instanceof Error ? error.message : 'Unknown error occurred',
        variant: 'destructive'
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const speak = async (text: string) => {
    if (!text.trim()) return;

    // Stop any current speech
    window.speechSynthesis.cancel();
    setIsSpeaking(true);

    try {
      console.log('🎵 Generating speech for:', text.substring(0, 50) + '...');
      
      // First try OpenAI TTS (higher quality)
      const { data, error } = await supabase.functions.invoke('text-to-speech', {
        body: {
          text,
          voice: 'nova', // Female voice, good for assistants
          speed: 0.9
        }
      });

      if (error) {
        console.warn('OpenAI TTS failed, falling back to browser TTS:', error);
        fallbackToWebSpeech(text);
        return;
      }

      if (data?.audioContent) {
        // Decode base64 audio and play
        const audioData = atob(data.audioContent);
        const arrayBuffer = new ArrayBuffer(audioData.length);
        const view = new Uint8Array(arrayBuffer);
        
        for (let i = 0; i < audioData.length; i++) {
          view[i] = audioData.charCodeAt(i);
        }

        // Create audio blob and play
        const audioBlob = new Blob([arrayBuffer], { type: 'audio/mpeg' });
        const audioUrl = URL.createObjectURL(audioBlob);
        const audio = new Audio(audioUrl);
        
        audio.volume = 1.0;
        audio.onended = () => {
          setIsSpeaking(false);
          URL.revokeObjectURL(audioUrl);
          console.log('🎵 OpenAI TTS playback completed');
        };
        audio.onerror = (error) => {
          console.error('Audio playback error:', error);
          setIsSpeaking(false);
          URL.revokeObjectURL(audioUrl);
          // Fallback to web speech
          fallbackToWebSpeech(text);
        };

        await audio.play();
        console.log('🎵 Playing OpenAI TTS audio');
        
      } else {
        throw new Error('No audio content received');
      }

    } catch (error) {
      console.error('TTS Error:', error);
      fallbackToWebSpeech(text);
    }
  };

  const fallbackToWebSpeech = (text: string) => {
    console.log('🎤 Falling back to browser speech synthesis');
    
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 0.85;
    utterance.pitch = 1.1;
    utterance.volume = 1.0;
    
    // Try to get a better voice
    const voices = window.speechSynthesis.getVoices();
    const preferredVoice = voices.find(voice => 
      voice.name.includes('Google') || 
      voice.name.includes('Microsoft') ||
      voice.lang.startsWith('en')
    );
    if (preferredVoice) {
      utterance.voice = preferredVoice;
    }
    
    utterance.onstart = () => {
      console.log('🎤 Browser TTS started');
    };
    utterance.onend = () => {
      setIsSpeaking(false);
      console.log('🎤 Browser TTS ended');
    };
    utterance.onerror = (error) => {
      console.error('Browser TTS error:', error);
      setIsSpeaking(false);
      toast({
        title: 'Speech Error',
        description: 'Audio output failed. Check your device volume and try again.',
        variant: 'destructive'
      });
    };

    window.speechSynthesis.speak(utterance);
  };

  const stopSpeaking = () => {
    window.speechSynthesis.cancel();
    setIsSpeaking(false);
  };

  if (!speechSupported) return null;

  return (
    <div className={className}>
      <div className="flex flex-col items-center gap-2">
        {/* Live transcript */}
        {transcript && (
          <div className="bg-black/80 text-white text-xs px-3 py-2 rounded-lg max-w-xs text-center">
            {transcript}
          </div>
        )}
        
        {/* Status badges */}
        {(isProcessing || isSpeaking) && (
          <div className="flex gap-1">
            {isProcessing && (
              <Badge variant="outline" className="text-xs bg-white/90">
                Processing...
              </Badge>
            )}
            {isSpeaking && (
              <Badge variant="outline" className="text-xs bg-white/90">
                Speaking...
              </Badge>
            )}
          </div>
        )}

        {/* Main button container */}
        <div className="relative">
          {/* VU meter ring */}
          {isListening && (
            <div 
              className="absolute inset-0 rounded-full border-4 border-red-400 animate-pulse"
              style={{
                transform: `scale(${1 + vuLevel * 0.003})`,
                opacity: vuLevel * 0.01
              }}
            />
          )}
          
          {/* Main voice button */}
          <Button
            onClick={toggleListening}
            disabled={isProcessing}
            variant={isListening ? "destructive" : "default"}
            size="lg"
            className={`
              h-16 w-16 rounded-full shadow-lg transition-all duration-200
              ${isListening ? 'bg-red-500 hover:bg-red-600' : 'bg-primary hover:bg-primary/90'}
              ${isProcessing ? 'opacity-50' : ''}
            `}
          >
            {isListening ? (
              <MicOff className="h-6 w-6" />
            ) : isProcessing ? (
              <Activity className="h-6 w-6 animate-spin" />
            ) : (
              <Mic className="h-6 w-6" />
            )}
          </Button>

          {/* Speaker control button */}
          {isSpeaking && (
            <Button
              onClick={stopSpeaking}
              variant="outline"
              size="sm"
              className="absolute -top-2 -right-2 h-8 w-8 rounded-full bg-white shadow-md"
            >
              <VolumeX className="h-3 w-3" />
            </Button>
          )}
        </div>

        {/* Instruction text */}
        {!isListening && !isProcessing && !isSpeaking && (
          <div className="text-xs text-muted-foreground text-center">
            Tap to speak
          </div>
        )}
      </div>
    </div>
  );
}