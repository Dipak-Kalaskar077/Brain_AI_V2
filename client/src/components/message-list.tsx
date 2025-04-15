import { useEffect, useRef } from "react";
import { MessageItem } from "./message-item";
import { type ChatMessage } from "@shared/schema";

interface MessageListProps {
  messages: ChatMessage[];
  username: string;
  isLoading: boolean;
  isSpeechEnabled: boolean;
}

export function MessageList({ messages, username, isLoading, isSpeechEnabled }: MessageListProps) {
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  return (
    <div className="messages-container p-4 bg-gray-50 dark:bg-gray-900 space-y-4 flex-1 overflow-y-auto">
      {messages.map((message, index) => (
        <MessageItem
          key={`${message.sender}-${index}-${message.timestamp || ''}`}
          message={message}
          username={username}
          isSpeechEnabled={isSpeechEnabled}
        />
      ))}

      {isLoading && (
        <div className="ai-message bg-gray-100 dark:bg-gray-800 max-w-[75%] md:max-w-[67%] lg:max-w-[50%] p-3 px-4 shadow-sm rounded-2xl rounded-bl-none">
          <div className="flex items-start gap-2">
            <div className="w-8 h-8 rounded-full bg-primary-600 flex items-center justify-center text-white flex-shrink-0">
              <i className="fas fa-brain text-xs"></i>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-medium text-sm">Brain</span>
                <span className="text-xs text-gray-500 dark:text-gray-400">Just now</span>
              </div>
              <div className="message-content mt-1 flex items-center">
                <span>Thinking</span>
                <span className="ml-1 animate-pulse">...</span>
              </div>
            </div>
          </div>
        </div>
      )}

      <div ref={messagesEndRef} />
    </div>
  );
}
