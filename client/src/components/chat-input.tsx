import { useRef, useState, FormEvent, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { type ChatModel } from "@shared/schema";

interface ChatInputProps {
  onSendMessage: (message: string) => void;
  isLoading: boolean;
  currentModel: ChatModel;
  onChangeModel: (model: ChatModel) => void;
  isSpeechEnabled: boolean;
  onToggleSpeech: (enabled: boolean) => void;
}

export function ChatInput({ 
  onSendMessage, 
  isLoading, 
  currentModel, 
  onChangeModel,
  isSpeechEnabled,
  onToggleSpeech
}: ChatInputProps) {
  const [message, setMessage] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Auto-resize textarea
  useEffect(() => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const adjustHeight = () => {
      textarea.style.height = "auto";
      const scrollHeight = textarea.scrollHeight;
      textarea.style.height = `${Math.min(scrollHeight, 120)}px`;
    };

    // Call on mount and when content changes
    adjustHeight();
    textarea.addEventListener("input", adjustHeight);

    return () => {
      textarea.removeEventListener("input", adjustHeight);
    };
  }, [message]);

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!message.trim() || isLoading) return;

    onSendMessage(message);
    setMessage("");
    
    // Reset textarea height
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
    }
  };

  return (
    <div className="input-area bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 p-3">
      <div className="flex items-center gap-2 mb-2 text-sm text-gray-600 dark:text-gray-400 px-1">
        <div className="flex items-center gap-1 mr-4">
          <span>AI Model:</span>
          <span className="bg-gray-100 dark:bg-gray-700 py-1 px-3 rounded-md text-xs">
            <i className="fas fa-robot mr-1"></i> Gemini
          </span>
        </div>

        <div className="flex items-center gap-2">
          <Switch 
            id="speechToggle" 
            checked={isSpeechEnabled}
            onCheckedChange={onToggleSpeech}
          />
          <Label htmlFor="speechToggle" className="cursor-pointer">
            Text-to-Speech
          </Label>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="flex items-center gap-2">
        <div className="relative flex-1">
          <Textarea
            ref={textareaRef}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Message Brain..."
            className="w-full rounded-xl resize-none overflow-hidden min-h-[50px] max-h-[120px] pr-10"
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                handleSubmit(e);
              }
            }}
          />
        </div>

        <Button
          type="submit"
          disabled={isLoading || !message.trim()}
          className="bg-primary-600 hover:bg-primary-700 text-white rounded-full w-12 h-12 flex items-center justify-center flex-shrink-0"
        >
          <i className="fas fa-paper-plane"></i>
        </Button>
      </form>

      <div className="text-xs text-center mt-2 text-gray-500 dark:text-gray-400">
        AI may produce inaccurate information about people, places, or facts.
      </div>
    </div>
  );
}
