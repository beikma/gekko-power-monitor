import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { MessageSquare } from 'lucide-react';
import { VoiceAssistant } from './VoiceAssistant';

export function VoiceToggle() {
  const [showAssistant, setShowAssistant] = useState(false);

  return (
    <>
      <Button
        onClick={() => setShowAssistant(true)}
        variant="outline"
        size="sm"
        className="border-primary/20 hover:bg-primary/5"
      >
        <MessageSquare className="h-4 w-4 mr-2" />
        Voice
      </Button>

      {showAssistant && (
        <VoiceAssistant 
          onClose={() => setShowAssistant(false)}
          isFloating={true}
        />
      )}
    </>
  );
}