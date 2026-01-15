import { VoiceCommandInput } from './VoiceCommandInput';

export function ChatInterface({ userId, username, onSignOut }: ChatInterfaceProps) {
  // ... existing code ...

  const handleVoiceCommand = useCallback((command: string) => {
    // Handle common voice commands
    if (command.includes('send message')) {
      const message = command.replace('send message', '').trim();
      if (message) {
        sendMessage(message);
      }
    }
    else if (command.includes('clear chat')) {
      setMessages([]);
    }
    else if (command.includes('sign out')) {
      onSignOut();
    }
    else {
      // Treat as regular message
      sendMessage(command);
    }
  }, [sendMessage, onSignOut]);

  return (
    <div className="flex flex-col h-screen">
      {/* ... existing header code ... */}
      
      {/* ... existing messages display code ... */}
      
      <div className="border-t p-4">
        <form onSubmit={handleSubmit} className="flex gap-4">
          <div className="flex-1 flex gap-2 items-center">
            <Input
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              placeholder="Type your message..."
              className="flex-1"
            />
            <VoiceCommandInput onCommand={handleVoiceCommand} />
          </div>
          <Button type="submit" disabled={isLoading}>
            Send
          </Button>
        </form>
      </div>
    </div>
  );
}