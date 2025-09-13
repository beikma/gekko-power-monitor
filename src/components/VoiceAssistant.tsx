import { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { supabase } from '@/integrations/supabase/client';
import { Mic, MicOff, Volume2, VolumeX, MessageSquare, Activity, X, HelpCircle, AlertTriangle, CheckCircle, Clock, Database } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { VoiceCapabilitiesOverview } from './VoiceDataSources';

interface Interaction {
  id: string;
  timestamp: string;
  userText: string;
  assistantText: string;
  intent?: string;
  confidence?: number;
  success?: boolean;
  responseTime?: number;
  data?: any;
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
  const [currentIntent, setCurrentIntent] = useState<string | null>(null);
  const [currentConfidence, setCurrentConfidence] = useState<number | null>(null);
  const [mcpStatus, setMcpStatus] = useState<'unknown' | 'connected' | 'error'>('unknown');
  
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

  const speak = async (text: string) => {
    if (!text.trim()) return;

    // Stop any current speech
    window.speechSynthesis.cancel();
    setIsSpeaking(true);

    try {
      // Use OpenAI TTS for better quality
      const { data, error } = await supabase.functions.invoke('text-to-speech', {
        body: {
          text,
          voice: 'nova',
          speed: 0.9
        }
      });

      if (error) {
        fallbackToWebSpeech(text);
        return;
      }

      if (data?.audioContent) {
        console.log('🎵 Decoding OpenAI audio...');
        const binaryString = atob(data.audioContent);
        const bytes = new Uint8Array(binaryString.length);
        
        for (let i = 0; i < binaryString.length; i++) {
          bytes[i] = binaryString.charCodeAt(i);
        }

        const audioBlob = new Blob([bytes], { type: 'audio/mpeg' });
        const audioUrl = URL.createObjectURL(audioBlob);
        const audio = new Audio(audioUrl);
        
        audio.volume = 1.0;
        audio.preload = 'auto';
        
        audio.onplay = () => console.log('🎵 Playing OpenAI audio');
        audio.onended = () => {
          setIsSpeaking(false);
          URL.revokeObjectURL(audioUrl);
          console.log('🎵 Audio ended');
        };
        audio.onerror = (error) => {
          console.error('🚫 Audio error:', error);
          setIsSpeaking(false);
          URL.revokeObjectURL(audioUrl);
          fallbackToWebSpeech(text);
        };

        try {
          await audio.play();
          console.log('🎵 Audio playback initiated');
        } catch (playError) {
          console.error('🚫 Play failed:', playError);
          setIsSpeaking(false);
          URL.revokeObjectURL(audioUrl);
          fallbackToWebSpeech(text);
        }
      } else {
        throw new Error('No audio content');
      }

    } catch (error) {
      console.error('TTS Error:', error);
      fallbackToWebSpeech(text);
    }
  };

  const fallbackToWebSpeech = (text: string) => {
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.volume = 1.0;
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
    setCurrentIntent(null);
    setCurrentConfidence(null);

    try {
      // Call the new voice-assistant endpoint
      const { data, error } = await supabase.functions.invoke('voice-assistant', {
        body: {
          text: userText,
          userId: 'demo-user', // In real app, get from auth
          clientIp: 'unknown'
        }
      });

      if (error) {
        throw new Error(error.message);
      }

      const assistantText = data.speechText || data.message || 'I received your request but have no response.';
      
      // Update current intent/confidence
      setCurrentIntent(data.intent);
      setCurrentConfidence(data.confidence);
      setMcpStatus(data.success ? 'connected' : 'error');
      
      // Create interaction record
      const interaction: Interaction = {
        id: Date.now().toString(),
        timestamp: new Date().toLocaleTimeString(),
        userText,
        assistantText,
        intent: data.intent,
        confidence: data.confidence,
        success: data.success,
        responseTime: data.responseTime,
        data: data.data
      };

      // Update state
      setInteractions(prev => [interaction, ...prev.slice(0, 9)]); // Keep last 10
      setResponse(assistantText);
      
      // Speak the response with await for better handling
      await speak(assistantText);

      toast({
        title: data.success ? 'Command Executed' : 'Command Failed',
        description: `${data.intent} (${Math.round((data.confidence || 0) * 100)}% confidence) - ${data.responseTime}ms`,
        variant: data.success ? 'default' : 'destructive'
      });

    } catch (error) {
      console.error('Voice Assistant error:', error);
      const errorText = 'Sorry, I encountered an error processing your request.';
      setResponse(errorText);
      speak(errorText);
      setMcpStatus('error');
      
      toast({
        title: 'Assistant Error',
        description: error instanceof Error ? error.message : 'Unknown error occurred',
        variant: 'destructive'
      });
    } finally {
      setIsProcessing(false);
    }
  };

  // Test MCP connection on mount
  useEffect(() => {
    const testConnection = async () => {
      try {
        const { data } = await supabase.functions.invoke('voice-assistant', {
          body: { text: 'system health' }
        });
        setMcpStatus(data.success ? 'connected' : 'error');
      } catch {
        setMcpStatus('error');
      }
    };
    
    testConnection();
  }, []);

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
          <Badge variant={mcpStatus === 'connected' ? 'default' : mcpStatus === 'error' ? 'destructive' : 'secondary'}>
            <div className="flex items-center gap-1">
              {mcpStatus === 'connected' && <CheckCircle className="h-3 w-3" />}
              {mcpStatus === 'error' && <AlertTriangle className="h-3 w-3" />}
              {mcpStatus === 'unknown' && <Clock className="h-3 w-3" />}
              MCP {mcpStatus === 'connected' ? 'Ready' : mcpStatus === 'error' ? 'Error' : 'Testing'}
            </div>
          </Badge>
          {isListening && <Badge variant="destructive">Listening...</Badge>}
          {isProcessing && <Badge variant="outline">Processing...</Badge>}
          {isSpeaking && <Badge variant="outline">Speaking...</Badge>}
          {currentIntent && (
            <Badge variant="outline">
              {currentIntent} ({Math.round((currentConfidence || 0) * 100)}%)
            </Badge>
          )}
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
          <div className={`p-3 rounded-lg border ${interactions[0]?.success ? 'bg-emerald-50 border-emerald-200' : 'bg-red-50 border-red-200'}`}>
            <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
              <span>Assistant:</span>
              {interactions[0]?.success ? (
                <CheckCircle className="h-3 w-3 text-emerald-600" />
              ) : (
                <AlertTriangle className="h-3 w-3 text-red-600" />
              )}
              {interactions[0]?.responseTime && (
                <span>({interactions[0].responseTime}ms)</span>
              )}
            </div>
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
                  <div key={interaction.id} className={`p-2 rounded text-xs ${interaction.success ? 'bg-emerald-50' : 'bg-red-50'}`}>
                    <div className="flex items-center gap-2 mb-1">
                      <Badge variant="outline" className="text-xs">
                        {interaction.intent}
                      </Badge>
                      {interaction.confidence && (
                        <Badge variant="secondary" className="text-xs">
                          {Math.round(interaction.confidence * 100)}%
                        </Badge>
                      )}
                      {interaction.success ? (
                        <CheckCircle className="h-3 w-3 text-emerald-600" />
                      ) : (
                        <AlertTriangle className="h-3 w-3 text-red-600" />
                      )}
                      <span className="text-muted-foreground">{interaction.timestamp}</span>
                      {interaction.responseTime && (
                        <span className="text-muted-foreground">({interaction.responseTime}ms)</span>
                      )}
                    </div>
                    <div className="text-muted-foreground">You: {interaction.userText}</div>
                    <div>Assistant: {interaction.assistantText}</div>
                    {interaction.data && (
                      <div className="text-xs text-muted-foreground mt-1">
                        Data: {JSON.stringify(interaction.data, null, 2)}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </ScrollArea>
          </div>
        )}

        {/* Help and Getting Started */}
        <div className="flex items-center gap-2">
          <Dialog>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm" className="flex-1">
                <HelpCircle className="h-4 w-4 mr-2" />
                Sample Commands
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Voice Commands & Data Access</DialogTitle>
                <DialogDescription>
                  ChatGPT can access all your building systems and data sources
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <h4 className="font-medium text-sm mb-2">Control Commands</h4>
                    <ul className="text-sm text-muted-foreground space-y-1">
                      <li>• "Set office temperature to 22.5"</li>
                      <li>• "Turn lobby lights to 80 percent"</li>
                      <li>• "Adjust meeting room temperature"</li>
                      <li>• "Turn off all lights"</li>
                    </ul>
                  </div>
                  <div>
                    <h4 className="font-medium text-sm mb-2">Status Queries</h4>
                    <ul className="text-sm text-muted-foreground space-y-1">
                      <li>• "What's the current energy usage?"</li>
                      <li>• "Show me building temperature"</li>
                      <li>• "How much solar power today?"</li>
                      <li>• "What's the weather forecast?"</li>
                    </ul>
                  </div>
                  <div>
                    <h4 className="font-medium text-sm mb-2">Analytics</h4>
                    <ul className="text-sm text-muted-foreground space-y-1">
                      <li>• "Give me an energy analysis"</li>
                      <li>• "Show optimization opportunities"</li>
                      <li>• "What's our carbon footprint?"</li>
                      <li>• "Efficiency recommendations"</li>
                    </ul>
                  </div>
                  <div>
                    <h4 className="font-medium text-sm mb-2">System Health</h4>
                    <ul className="text-sm text-muted-foreground space-y-1">
                      <li>• "System health check"</li>
                      <li>• "Any active alarms?"</li>
                      <li>• "Show all available systems"</li>
                      <li>• "Connection status"</li>
                    </ul>
                  </div>
                </div>
                
                <VoiceCapabilitiesOverview />
              </div>
            </DialogContent>
          </Dialog>
          
          <Dialog>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm">
                <Database className="h-4 w-4 mr-2" />
                Data Sources
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Available Data Sources</DialogTitle>
                <DialogDescription>
                  Real-time access to all building systems and external data
                </DialogDescription>
              </DialogHeader>
              <VoiceCapabilitiesOverview />
            </DialogContent>
          </Dialog>
        </div>

        {interactions.length === 0 && !response && (
          <div className="text-center py-4 text-muted-foreground">
            <MessageSquare className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <div className="text-sm">
              Ready for your voice commands!
            </div>
            <div className="text-xs mt-1">
              Click "Sample Commands" above to see what you can say
            </div>
          </div>
        )}
      </CardContent>
    </CardComponent>
  );
}