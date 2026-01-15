import { useEffect, useState, useCallback } from "react";
import { MessageList } from "./message-list";
import { useChat } from "@/hooks/use-chat";
import { useTextToSpeech } from "@/hooks/use-text-to-speech";
import { type ChatModel } from "@shared/schema";
import { Button } from "@/components/ui/button";
import { apiRequest } from "@/lib/queryClient";
import { VoiceCommandInput } from './VoiceCommandInput';
import { Input } from "./ui/input";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "./ui/tooltip";
import { Loader2, Upload } from "lucide-react";

interface ChatInterfaceProps {
  userId: number | null;
  username: string;
  onSignOut: () => void;
}

export function ChatInterface({ userId, username, onSignOut }: ChatInterfaceProps) {
  const [isTyping, setIsTyping] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  
  const [isSpeechEnabled, setIsSpeechEnabled] = useState(true);
  const [inputMessage, setInputMessage] = useState("");
  const { speak } = useTextToSpeech();

  const { 
    messages, 
    isLoading, 
    sendMessage, 
    currentModel, 
    setCurrentModel 
  } = useChat({ 
    userId, 
    username,
    isSpeechEnabled
  });

  // Speak the new AI message when it arrives
  useEffect(() => {
    if (isSpeechEnabled && messages.length > 0) {
      const lastMessage = messages[messages.length - 1];
      if (lastMessage.sender === 'ai' && !isLoading) {
        speak(lastMessage.content);
      }
    }
  }, [messages, isLoading, isSpeechEnabled, speak]);

  const handleModelChange = (model: ChatModel) => {
    setCurrentModel(model);
  };

  // Add sign-out handling
  const handleSignOut = async () => {
    try {
      await apiRequest('POST', '/api/logout');
      // Redirect to home page or trigger a state change that shows the login screen
      window.location.reload(); // Simple approach to reset the app
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  const handleVoiceCommand = useCallback((command: string) => {
    if (command.includes('send message')) {
      const message = command.replace('send message', '').trim();
      if (message) {
        sendMessage(message);
      }
    } else {
      // Treat as regular message
      sendMessage(command);
    }
  }, [sendMessage]);

  const handleSubmit = useCallback((e: React.FormEvent) => {
    e.preventDefault();
    if (!inputMessage.trim() || isLoading) return;

    sendMessage(inputMessage);
    setInputMessage("");
  }, [inputMessage, isLoading, sendMessage]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
    }
  };

  return (
    <TooltipProvider>
      <div className="chat-container flex flex-col h-screen">
        {/* Header */}
        <header className="bg-white dark:bg-gray-800 shadow-sm px-4 py-3 flex items-center justify-between z-10">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-full bg-teal-600 flex items-center justify-center text-white">
              <i className="fas fa-brain"></i>
            </div>
            <div>
              <h1 className="font-bold text-gray-800 dark:text-white">Dipak's Personal AI Assistant</h1>
              <div className="text-xs text-gray-500 dark:text-gray-400 flex items-center">
                <span className="inline-block w-2 h-2 rounded-full bg-green-500 mr-1"></span>
                <span>Brain is online</span>
              </div>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <div className="text-sm px-3 py-1 bg-gray-100 dark:bg-gray-700 rounded-full text-gray-800 dark:text-white">
              <span>{username}</span>
            </div>
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={onSignOut}
              className="text-gray-600 hover:text-gray-800 dark:text-gray-400 dark:hover:text-white"
            >
              Sign Out
            </Button>
          </div>
        </header>

        {/* Messages */}
        <MessageList 
          messages={messages} 
          username={username} 
          isLoading={isLoading}
          isSpeechEnabled={isSpeechEnabled}
          isTyping={isTyping}
        />

        <div className="border-t p-4">
          <form onSubmit={handleSubmit} className="flex gap-4">
            <div className="flex-1 flex gap-2 items-center">
              <Input
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                placeholder="Type your message..."
                className="flex-1"
              />
              
              <Tooltip>
                <TooltipTrigger asChild>
                  <label className="cursor-pointer">
                    <Input
                      type="file"
                      className="hidden"
                      onChange={handleFileChange}
                      accept="image/*,.pdf,.doc,.docx"
                    />
                    <Upload className="h-5 w-5 text-gray-500 hover:text-gray-700" />
                  </label>
                </TooltipTrigger>
                <TooltipContent>Upload file</TooltipContent>
              </Tooltip>

              <Tooltip>
                <TooltipTrigger asChild>
                  <VoiceCommandInput 
                    onCommand={(text) => setInputMessage(text)} 
                    onListeningChange={(isListening) => setIsTyping(isListening)}
                  />
                </TooltipTrigger>
                <TooltipContent>Voice input</TooltipContent>
              </Tooltip>

              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => setIsSpeechEnabled(!isSpeechEnabled)}
                    className={`${isSpeechEnabled ? 'text-green-500' : 'text-gray-500'}`}
                  >
                    <i className="fas fa-volume-up"></i>
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Toggle AI speech</TooltipContent>
              </Tooltip>
            </div>

            <Tooltip>
              <TooltipTrigger asChild>
                <Button type="submit" disabled={isLoading}>
                  {isLoading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    'Send'
                  )}
                </Button>
              </TooltipTrigger>
              <TooltipContent>Send message (Ctrl+Enter)</TooltipContent>
            </Tooltip>
          </form>
        </div>
      </div>
    </TooltipProvider>
  );
}
