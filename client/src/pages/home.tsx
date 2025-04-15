import { useState, useEffect } from "react";
import { UsernameModal } from "@/components/username-modal";
import { ChatInterface } from "@/components/chat-interface";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { getStoredValue, setStoredValue } from "@/lib/utils";

export default function Home() {
  const [username, setUsername] = useState<string>("");
  const [userId, setUserId] = useState<number | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(true);
  const { toast } = useToast();

  // Check for stored user on mount
  useEffect(() => {
    const storedUsername = getStoredValue<string>("username", "");
    const storedUserId = getStoredValue<number | null>("userId", null);
    
    if (storedUsername && storedUserId !== null) {
      setUsername(storedUsername);
      setUserId(storedUserId);
      setIsModalOpen(false);
    } else {
      setIsModalOpen(true);
    }
  }, []);

  // Auth mutation
  const authMutation = useMutation({
    mutationFn: async (credentials: { username: string; password: string }) => {
      const response = await apiRequest("POST", "/api/auth", credentials);
      return response.json();
    },
    onSuccess: (data) => {
      setUsername(data.username);
      setUserId(data.id);
      setStoredValue("username", data.username);
      setStoredValue("userId", data.id);
      setIsModalOpen(false);
      
      toast({
        title: "Welcome!",
        description: `Hello, ${data.username}! Brain is ready to assist you.`,
      });
    },
    onError: (error) => {
      console.error("Auth error:", error);
      toast({
        title: "Authentication Failed",
        description: error.message || "Could not authenticate. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleUsernameSubmit = (username: string, password: string) => {
    authMutation.mutate({ username, password });
  };

  return (
    <div className="relative">
      <UsernameModal 
        isOpen={isModalOpen} 
        onSubmit={handleUsernameSubmit} 
      />
      
      {!isModalOpen && (
        <ChatInterface 
          userId={userId} 
          username={username} 
        />
      )}
    </div>
  );
}
