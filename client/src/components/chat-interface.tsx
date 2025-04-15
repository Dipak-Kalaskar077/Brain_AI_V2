import { useEffect } from "react";
import { MessageList } from "./message-list";
import { ChatInput } from "./chat-input";
import { useChat } from "@/hooks/use-chat";
import { useTextToSpeech } from "@/hooks/use-text-to-speech";
import { type ChatModel } from "@shared/schema";

interface ChatInterfaceProps {
  userId: number | null;
  username: string;
}

export function ChatInterface({ userId, username }: ChatInterfaceProps) {
  const [isSpeechEnabled, setIsSpeechEnabled] = useState(true);
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

  return (
    <div className="chat-container flex flex-col h-screen">
      {/* Header */}
      <header className="bg-white dark:bg-gray-800 shadow-sm px-4 py-3 flex items-center justify-between z-10">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-full bg-primary-600 flex items-center justify-center text-white">
            <i className="fas fa-robot"></i>
          </div>
          <div>
            <h1 className="font-bold">Dipak's Personal AI Assistant</h1>
            <div className="text-xs text-gray-500 dark:text-gray-400 flex items-center">
              <span className="inline-block w-2 h-2 rounded-full bg-green-500 mr-1"></span>
              <span>Brain is online</span>
            </div>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <div className="text-sm px-3 py-1 bg-gray-100 dark:bg-gray-700 rounded-full">
            <span>{username}</span>
          </div>
        </div>
      </header>

      {/* Messages */}
      <MessageList 
        messages={messages} 
        username={username} 
        isLoading={isLoading}
        isSpeechEnabled={isSpeechEnabled}
      />

      {/* Input Area */}
      <ChatInput 
        onSendMessage={sendMessage}
        isLoading={isLoading}
        currentModel={currentModel}
        onChangeModel={handleModelChange}
        isSpeechEnabled={isSpeechEnabled}
        onToggleSpeech={setIsSpeechEnabled}
      />
    </div>
  );
}

// Import at the top
import { useState } from "react";
