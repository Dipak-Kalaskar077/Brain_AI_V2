import { useState, useCallback, useEffect } from 'react';
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from '@/lib/queryClient';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { type ChatMessage, type ChatModel, type Message } from '@shared/schema';
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
  const [currentModel, setCurrentModel] = useState<ChatModel>('gemini');
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
  const messagesQuery = useQuery<Message[]>({ 
    queryKey: ['/api/messages', userId ? userId.toString() : ''],
    enabled: !!userId && typeof userId === 'number' && userId > 0, // Only enable if userId is valid number
    queryFn: async () => {
      if (!userId || typeof userId !== 'number' || userId <= 0) {
        // Don't throw, just return empty array
        return [];
      }
      try {
        const response = await apiRequest('GET', `/api/messages/${userId}`);
        return response.json();
      } catch (error: any) {
        // If we get a 401, it means the user is not authenticated
        // Return empty array instead of throwing
        if (error.message?.includes('401')) {
          console.log('[use-chat] 401 error - user not authenticated, returning empty messages');
          return [];
        }
        throw error;
      }
    },
    retry: false, // Don't retry on error
    staleTime: 0, // Always refetch when enabled
    refetchOnMount: false, // Don't refetch on mount if we have data
    refetchOnWindowFocus: false, // Don't refetch on window focus
  });

  // Handle messages data when it loads successfully
  useEffect(() => {
    if (messagesQuery.isSuccess && messagesQuery.data) {
      const data = messagesQuery.data;
      
      if (data && data.length > 0) {
        // First sort messages by timestamp to ensure proper order (oldest first)
        const sortedData = [...data].sort((a, b) => 
          new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
        );
        
        // Transform DB messages to chat messages
        const chatMessages: ChatMessage[] = sortedData.flatMap(msg => [
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
        
        console.log("Processed messages:", chatMessages);
        setMessages(chatMessages);
      } else {
        // If no messages, add welcome message
        addWelcomeMessage();
      }
    } else if (messagesQuery.isError) {
      console.error('Failed to load messages:', messagesQuery.error);
      toast({
        title: 'Error',
        description: 'Failed to load your chat history',
        variant: 'destructive'
      });
      // Add welcome message on error too
      addWelcomeMessage();
    }
  }, [messagesQuery.status, messagesQuery.data, messagesQuery.error, addWelcomeMessage, toast]);

  // Send message mutation
  const sendMessageMutation = useMutation({
    mutationFn: async ({ content, model }: SendMessageParams) => {
      const response = await apiRequest('POST', '/api/chat', {
        userId,
        username,
        content,
        model
      });
      return response.json();
    },
    onSuccess: (data) => {
      // Add the new message pair to the messages array
      const newMessages: ChatMessage[] = [
        {
          id: data.id,
          sender: 'user',
          content: data.userMessage,
          timestamp: formatTime(new Date()),
          model: data.model
        },
        {
          id: data.id,
          sender: 'ai',
          content: data.aiResponse,
          timestamp: formatTime(new Date()),
          model: data.model
        }
      ];
      
      setMessages(prev => [...prev, ...newMessages]);
      
      // Invalidate the messages query to trigger a refresh
      queryClient.invalidateQueries({ queryKey: ['/api/messages', userId?.toString()] });
    },
    onError: (error) => {
      console.error('Failed to send message:', error);
      toast({
        title: 'Error',
        description: 'Failed to send your message',
        variant: 'destructive'
      });
    }
  });

  const sendMessage = useCallback(async (content: string) => {
    if (!content.trim()) return;
    
    sendMessageMutation.mutate({
      content,
      model: currentModel
    });
  }, [currentModel, sendMessageMutation]);

  return {
    messages,
    isLoading: sendMessageMutation.isPending,
    sendMessage,
    currentModel,
    setCurrentModel
  };
}
