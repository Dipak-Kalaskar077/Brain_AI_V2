import { useState, useCallback, useEffect } from 'react';
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from '@/lib/queryClient';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { type ChatMessage, type ChatModel } from '@shared/schema';
import { formatTime } from '@/lib/utils';

interface UseChatProps {
  userId: number | null;
  username: string;
  isSpeechEnabled: boolean;
}

interface SendMessageParams {
  content: string;
  model: ChatModel;
}

export function useChat({ userId, username, isSpeechEnabled }: UseChatProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [currentModel, setCurrentModel] = useState<ChatModel>('openai');
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  // Function to add welcome message
  const addWelcomeMessage = useCallback(() => {
    if (!username) return;
    
    const welcomeMessage: ChatMessage = {
      sender: 'ai',
      content: `Hello ${username}! I'm Brain, your personal AI assistant. I can help you with information, answer questions, or just chat. Feel free to ask me anything!`,
      timestamp: formatTime(new Date())
    };
    
    setMessages(prev => [welcomeMessage]);
  }, [username]);
  
  // Load messages when userId changes
  useQuery({ 
    queryKey: ['/api/messages', userId],
    enabled: !!userId,
    onSuccess: (data) => {
      if (data && data.length > 0) {
        // Transform DB messages to chat messages
        const chatMessages: ChatMessage[] = data.flatMap(msg => [
          {
            id: msg.id,
            sender: 'user',
            content: msg.content,
            timestamp: formatTime(new Date(msg.timestamp)),
            model: msg.model as ChatModel
          },
          {
            id: msg.id,
            sender: 'ai',
            content: msg.aiResponse,
            timestamp: formatTime(new Date(msg.timestamp)),
            model: msg.model as ChatModel
          }
        ]);
        setMessages(chatMessages);
      } else {
        // If no messages, add welcome message
        addWelcomeMessage();
      }
    },
    onError: (error) => {
      console.error('Failed to load messages:', error);
      toast({
        title: 'Error',
        description: 'Failed to load your chat history',
        variant: 'destructive'
      });
      // Add welcome message on error too
      addWelcomeMessage();
    }
  });
  
  // Send message mutation
  const sendMessageMutation = useMutation({
    mutationFn: async ({ content, model }: SendMessageParams) => {
      if (!userId) throw new Error('User not authenticated');
      
      const response = await apiRequest('POST', '/api/chat', { 
        userId, 
        content, 
        model 
      });
      
      return response.json();
    },
    onMutate: ({ content }) => {
      // Optimistically add user message
      const userMessage: ChatMessage = {
        sender: 'user',
        content,
        timestamp: formatTime(new Date()),
        model: currentModel
      };
      
      setMessages(prev => [...prev, userMessage]);
      
      return { userMessage };
    },
    onSuccess: (data) => {
      // Add AI response
      const aiMessage: ChatMessage = {
        id: data.id,
        sender: 'ai',
        content: data.aiResponse,
        timestamp: formatTime(new Date(data.timestamp)),
        model: data.model
      };
      
      setMessages(prev => [...prev, aiMessage]);
      
      // Invalidate queries to get fresh data
      queryClient.invalidateQueries({ queryKey: ['/api/messages', userId] });
    },
    onError: (error, _, context) => {
      console.error('Send message error:', error);
      
      // Remove the optimistically added message
      if (context?.userMessage) {
        setMessages(prev => prev.filter(msg => msg !== context.userMessage));
      }
      
      toast({
        title: 'Message Failed',
        description: error.message || 'Failed to send your message',
        variant: 'destructive'
      });
    }
  });
  
  // Effect to initialize with welcome message if no userId (first time)
  useEffect(() => {
    if (!userId && username) {
      addWelcomeMessage();
    }
  }, [userId, username, addWelcomeMessage]);
  
  // Send message function
  const sendMessage = useCallback((content: string) => {
    if (!content.trim()) return;
    sendMessageMutation.mutate({ content, model: currentModel });
  }, [sendMessageMutation, currentModel]);
  
  return {
    messages,
    isLoading: sendMessageMutation.isPending,
    sendMessage,
    currentModel,
    setCurrentModel
  };
}
