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
          ? "user-message bg-primary-600 text-white ml-auto"
          : "ai-message bg-gray-100 dark:bg-gray-800"
      } max-w-[75%] md:max-w-[67%] lg:max-w-[50%] p-3 px-4 shadow-sm rounded-2xl ${
        isUserMessage ? "rounded-br-none" : "rounded-bl-none"
      }`}
    >
      <div className={`flex items-start gap-2 ${isUserMessage ? "flex-row-reverse" : ""}`}>
        <Avatar className={`w-8 h-8 ${isUserMessage ? "bg-gray-300 dark:bg-gray-700" : "bg-primary-600"}`}>
          <AvatarFallback className={`${isUserMessage ? "text-gray-700 dark:text-gray-300" : "text-white"}`}>
            {isUserMessage ? getSingleInitial(username) : <i className="fas fa-brain text-xs"></i>}
          </AvatarFallback>
        </Avatar>

        <div className="w-full">
          <div className={`flex items-center gap-2 ${isUserMessage ? "justify-end" : ""}`}>
            {isUserMessage ? (
              <>
                <span className="text-xs text-gray-100">{message.timestamp}</span>
                <span className="font-medium text-sm">You</span>
              </>
            ) : (
              <>
                <span className="font-medium text-sm">Brain</span>
                <span className="text-xs text-gray-500 dark:text-gray-400">{message.timestamp}</span>
              </>
            )}
          </div>

          <div className={`message-content mt-1 ${isUserMessage ? "text-right" : ""}`}>
            {message.content}
          </div>

          {!isUserMessage && (
            <div className="mt-1 flex items-center text-xs text-gray-500 dark:text-gray-400 gap-3">
              <Button
                variant="ghost"
                size="sm"
                className="h-auto p-0 hover:text-primary-600 transition"
                onClick={handleSpeakMessage}
              >
                <i className={`fas ${isCurrentlySpeaking ? "fa-pause" : "fa-volume-up"} mr-1`}></i>
                <span>{isCurrentlySpeaking ? "Pause" : "Speak"}</span>
              </Button>

              <Button
                variant="ghost"
                size="sm"
                className="h-auto p-0 hover:text-primary-600 transition"
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
