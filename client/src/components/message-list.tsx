import { useEffect, useRef } from "react";
import { MessageItem } from "./message-item";
import { type ChatMessage } from "@shared/schema";

interface MessageListProps {
  messages: Message[];
  username: string;
  isLoading: boolean;
  isSpeechEnabled: boolean;
  isTyping: boolean;
}

export function MessageList({ messages, username, isLoading, isSpeechEnabled, isTyping }: MessageListProps) {
  return (
    <div className="flex-1 overflow-y-auto p-4">
      {messages.map((message, index) => (
        <MessageItem
          key={index}
          message={message}
          username={username}
          isSpeechEnabled={isSpeechEnabled}
        />
      ))}
      {(isLoading || isTyping) && (
        <div className="flex items-center text-sm text-gray-500 mt-2">
          <div className="animate-pulse flex gap-1">
            <span>●</span>
            <span>●</span>
            <span>●</span>
          </div>
          <span className="ml-2">
            {isTyping ? 'Listening...' : 'AI is typing...'}
          </span>
        </div>
      )}
    </div>
  );
}
