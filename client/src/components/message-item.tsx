import { useTextToSpeech } from "@/hooks/use-text-to-speech";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { copyToClipboard, getSingleInitial } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { type ChatMessage } from "@shared/schema";

interface MessageItemProps {
  message: ChatMessage;
  username: string;
  isSpeechEnabled?: boolean;
}

export function MessageItem({ message, username, isSpeechEnabled = true }: MessageItemProps) {
  const { speak, stop, isSpeaking } = useTextToSpeech();
  const [isCurrentlySpeaking, setIsCurrentlySpeaking] = useState(false);
  const { toast } = useToast();
  const isUserMessage = message.sender === "user";

  const handleSpeakMessage = () => {
    if (isCurrentlySpeaking) {
      stop();
      setIsCurrentlySpeaking(false);
    } else {
      speak(message.content);
      setIsCurrentlySpeaking(true);
      
      // When speech ends, reset the local speaking state
      const speechUtterance = new SpeechSynthesisUtterance(message.content);
      speechUtterance.onend = () => setIsCurrentlySpeaking(false);
      
      // In case of error, also reset state
      speechUtterance.onerror = () => setIsCurrentlySpeaking(false);
    }
  };

  const handleCopyContent = async () => {
    await copyToClipboard(message.content);
    toast({
      title: "Copied!",
      description: "Message copied to clipboard",
      duration: 2000,
    });
  };

  return (
    <div
      className={`${
        isUserMessage
          ? "user-message bg-gray-800 text-white ml-auto"
          : "ai-message bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600"
      } max-w-[75%] md:max-w-[67%] lg:max-w-[50%] p-3 px-4 shadow-sm rounded-lg ${
        isUserMessage ? "rounded-br-none" : "rounded-bl-none"
      }`}
    >
      <div className={`flex items-start gap-2 ${isUserMessage ? "flex-row-reverse" : ""}`}>
        <Avatar className={`w-8 h-8 ${isUserMessage ? "bg-gray-600" : "bg-teal-600"}`}>
          <AvatarFallback className="text-white">
            {isUserMessage ? getSingleInitial(username) : <i className="fas fa-brain text-xs"></i>}
          </AvatarFallback>
        </Avatar>

        <div className="w-full">
          <div className={`flex items-center gap-2 ${isUserMessage ? "justify-end" : ""}`}>
            {isUserMessage ? (
              <>
                <span className="text-xs text-gray-300">{message.timestamp}</span>
                <span className="font-medium text-sm text-white">You</span>
              </>
            ) : (
              <>
                <span className="font-medium text-sm text-gray-800 dark:text-white">Brain</span>
                <span className="text-xs text-gray-500 dark:text-gray-400">{message.timestamp}</span>
              </>
            )}
          </div>

          <div className={`message-content mt-1 ${isUserMessage ? "text-right text-white" : "text-gray-800 dark:text-white"}`}>
            {message.content}
          </div>

          {!isUserMessage && (
            <div className="mt-2 flex items-center text-xs text-gray-500 dark:text-gray-400 gap-3">
              <Button
                variant="ghost"
                size="sm"
                className="h-auto p-0 hover:text-gray-700 dark:hover:text-white transition"
                onClick={handleSpeakMessage}
              >
                <i className={`fas ${isCurrentlySpeaking ? "fa-pause" : "fa-volume-up"} mr-1`}></i>
                <span>{isCurrentlySpeaking ? "Pause" : "Speak"}</span>
              </Button>

              <Button
                variant="ghost"
                size="sm"
                className="h-auto p-0 hover:text-gray-700 dark:hover:text-white transition"
                onClick={handleCopyContent}
              >
                <i className="fas fa-copy mr-1"></i>
                <span>Copy</span>
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
