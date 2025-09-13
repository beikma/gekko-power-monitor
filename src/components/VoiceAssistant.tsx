import { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { supabase } from '@/integrations/supabase/client';
import { Mic, MicOff, Volume2, VolumeX, MessageSquare, Activity, X } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';

interface Interaction {
  id: string;
  timestamp: string;
  userText: string;
  assistantText: string;
  intent?: string;
  tool?: string;
  duration?: number;
}

interface VoiceAssistantProps {
  onClose?: () => void;
  isFloating?: boolean;
}

export function VoiceAssistant({ onClose, isFloating = false }: VoiceAssistantProps) {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [response, setResponse] = useState('');
  const [interactions, setInteractions] = useState<Interaction[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [speechSupported, setSpeechSupported] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [manualInput, setManualInput] = useState('');
  
  const recognitionRef = useRef<any>(null);
  const { toast } = useToast();

  // Check Web Speech API support
  useEffect(() => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    setSpeechSupported(!!SpeechRecognition);

    if (SpeechRecognition) {
      const recognition = new SpeechRecognition();
      recognition.continuous = true;
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
          processUserInput(finalTranscript.trim());
          setTranscript(''); // Clear after processing
        }
      };

      recognition.onerror = (event: any) => {
        console.error('Speech recognition error:', event.error);
        setIsListening(false);
        
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
      };

      recognitionRef.current = recognition;
    }

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
    };
  }, []);

  const toggleListening = () => {
    if (!speechSupported) return;

    if (isListening) {
      recognitionRef.current?.stop();
      setIsListening(false);
    } else {
      try {
        recognitionRef.current?.start();
        setIsListening(true);
        setTranscript('');
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

  const speak = (text: string) => {
    if (!text.trim()) return;

    // Stop any current speech
    window.speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 0.9;
    utterance.pitch = 1;
    utterance.volume = 0.8;
    
    utterance.onstart = () => setIsSpeaking(true);
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);

    window.speechSynthesis.speak(utterance);
  };

  const stopSpeaking = () => {
    window.speechSynthesis.cancel();
    setIsSpeaking(false);
  };

  const processUserInput = async (userText: string) => {
    setIsProcessing(true);
    const startTime = Date.now();

    try {
      // Simple intent detection
      const intent = detectIntent(userText);
      
      console.log(`Detected intent: ${intent} from "${userText}"`);

      const { data, error } = await supabase.functions.invoke('assistant-route', {
        body: {
          intent,
          text: userText,
          params: getIntentParams(intent)
        }
      });

      if (error) {
        throw new Error(error.message);
      }

      const duration = Date.now() - startTime;
      const assistantText = data.speechText || data.text || 'I received your request but have no response.';
      
      // Create interaction record
      const interaction: Interaction = {
        id: Date.now().toString(),
        timestamp: new Date().toLocaleTimeString(),
        userText,
        assistantText,
        intent: data.intent,
        tool: data.tool,
        duration
      };

      // Update state
      setInteractions(prev => [interaction, ...prev.slice(0, 4)]); // Keep last 5
      setResponse(assistantText);
      
      // Speak the response
      speak(assistantText);

      toast({
        title: 'Assistant Response',
        description: `Processed "${intent}" intent in ${duration}ms`,
      });

    } catch (error) {
      console.error('Assistant error:', error);
      const errorText = 'Sorry, I encountered an error processing your request.';
      setResponse(errorText);
      speak(errorText);
      
      toast({
        title: 'Assistant Error',
        description: error instanceof Error ? error.message : 'Unknown error occurred',
        variant: 'destructive'
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const detectIntent = (text: string): string => {
    const lowerText = text.toLowerCase();
    
    if (lowerText.includes('weather') || lowerText.includes('temperature') || lowerText.includes('forecast')) {
      return 'weather';
    }
    if (lowerText.includes('health') || lowerText.includes('status') || lowerText.includes('system')) {
      return 'health';
    }
    if (lowerText.includes('energy') || lowerText.includes('consumption') || lowerText.includes('prediction')) {
      return 'forecast';
    }
    if (lowerText.includes('light') || lowerText.includes('lamp') || lowerText.includes('brightness')) {
      return 'lights';
    }
    
    return 'unknown';
  };

  const getIntentParams = (intent: string) => {
    switch (intent) {
      case 'weather':
        return { lat: 46.7944, lon: 11.9464, hours: 24 }; // Bruneck default
      case 'forecast':
        return { hours: 48 };
      default:
        return {};
    }
  };

  const handleManualSubmit = () => {
    if (manualInput.trim()) {
      processUserInput(manualInput.trim());
      setManualInput('');
    }
  };

  const CardComponent = isFloating ? 'div' : Card;
  const cardProps = isFloating ? {
    className: "fixed bottom-4 right-4 w-96 bg-card border rounded-lg shadow-lg z-50"
  } : {};

  return (
    <CardComponent {...cardProps}>
      {isFloating && (
        <div className="flex items-center justify-between p-3 border-b">
          <div className="flex items-center gap-2">
            <MessageSquare className="h-4 w-4" />
            <span className="font-medium text-sm">Voice Assistant</span>
          </div>
          {onClose && (
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>
      )}
      
      {!isFloating && (
        <CardHeader>
          <div className="flex items-center gap-2">
            <div className="p-2 bg-gradient-to-br from-blue-500 to-purple-500 rounded-lg">
              <MessageSquare className="h-5 w-5 text-white" />
            </div>
            <div>
              <CardTitle className="text-lg">Voice Assistant</CardTitle>
              <CardDescription>
                {speechSupported ? 'Click mic to talk or type below' : 'Speech recognition not supported - type to chat'}
              </CardDescription>
            </div>
          </div>
        </CardHeader>
      )}
      
      <CardContent className="space-y-4 p-4">
        {/* Controls */}
        <div className="flex gap-2">
          {speechSupported ? (
            <Button
              onClick={toggleListening}
              disabled={isProcessing}
              variant={isListening ? "destructive" : "default"}
              className="flex-1"
            >
              {isListening ? <MicOff className="h-4 w-4 mr-2" /> : <Mic className="h-4 w-4 mr-2" />}
              {isListening ? 'Stop Listening' : 'Start Listening'}
            </Button>
          ) : (
            <div className="flex gap-2 flex-1">
              <Input
                value={manualInput}
                onChange={(e) => setManualInput(e.target.value)}
                placeholder="Type your message..."
                onKeyPress={(e) => e.key === 'Enter' && handleManualSubmit()}
                disabled={isProcessing}
              />
              <Button onClick={handleManualSubmit} disabled={isProcessing || !manualInput.trim()}>
                Send
              </Button>
            </div>
          )}
          
          <Button
            onClick={isSpeaking ? stopSpeaking : () => speak(response)}
            disabled={!response || isProcessing}
            variant="outline"
            size="sm"
          >
            {isSpeaking ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
          </Button>
        </div>

        {/* Status Badges */}
        <div className="flex flex-wrap gap-2 text-xs">
          <Badge variant={speechSupported ? "default" : "secondary"}>
            {speechSupported ? "Speech Ready" : "Text Only"}
          </Badge>
          {isListening && <Badge variant="destructive">Listening...</Badge>}
          {isProcessing && <Badge variant="outline">Processing...</Badge>}
          {isSpeaking && <Badge variant="outline">Speaking...</Badge>}
        </div>

        {/* Live Transcript */}
        {speechSupported && transcript && (
          <div className="p-3 bg-muted/50 rounded-lg border">
            <div className="text-xs text-muted-foreground mb-1">Live Transcript:</div>
            <div className="text-sm">{transcript}</div>
          </div>
        )}

        {/* Response Area */}
        {response && (
          <div className="p-3 bg-primary/5 rounded-lg border">
            <div className="text-xs text-muted-foreground mb-1">Assistant:</div>
            <div className="text-sm">{response}</div>
          </div>
        )}

        {/* Interaction History */}
        {interactions.length > 0 && (
          <div className="space-y-2">
            <div className="text-xs font-medium text-muted-foreground">Recent Interactions:</div>
            <ScrollArea className="h-32">
              <div className="space-y-2">
                {interactions.map((interaction) => (
                  <div key={interaction.id} className="p-2 bg-muted/30 rounded text-xs">
                    <div className="flex items-center gap-2 mb-1">
                      <Badge variant="outline" className="text-xs">
                        {interaction.intent}
                      </Badge>
                      {interaction.tool && (
                        <Badge variant="secondary" className="text-xs">
                          {interaction.tool}
                        </Badge>
                      )}
                      <span className="text-muted-foreground">{interaction.timestamp}</span>
                      {interaction.duration && (
                        <span className="text-muted-foreground">({interaction.duration}ms)</span>
                      )}
                    </div>
                    <div className="text-muted-foreground">You: {interaction.userText}</div>
                    <div>Assistant: {interaction.assistantText}</div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </div>
        )}

        {/* Getting Started */}
        {interactions.length === 0 && !response && (
          <div className="text-center py-4 text-muted-foreground">
            <Activity className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <div className="text-sm">
              Try saying: "What's the weather?", "System health", or "Energy forecast"
            </div>
          </div>
        )}
      </CardContent>
    </CardComponent>
  );
}