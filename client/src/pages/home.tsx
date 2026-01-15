import { useState, useEffect, useCallback } from "react";
import { UsernameModal } from "@/components/username-modal";
import { ChatInterface } from "@/components/chat-interface";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { getStoredValue, setStoredValue, removeStoredValue } from "@/lib/utils";

export default function Home() {
  const [username, setUsername] = useState<string>("");
  const [userId, setUserId] = useState<number | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(true);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  useEffect(() => {
    const storedUsername = getStoredValue("username");
    const storedUserId = getStoredValue("userId");
    
    if (storedUsername && storedUserId) {
      setUsername(storedUsername);
      setUserId(Number(storedUserId));
      setIsModalOpen(false);
    } else {
      // Ensure modal is open if no stored credentials
      setIsModalOpen(true);
      setUsername("");
      setUserId(null);
    }
  }, []);

  const authMutation = useMutation({
    mutationFn: async (credentials: { username: string; password: string }) => {
      // Clear any existing queries before attempting auth
      queryClient.clear();
      
      const response = await apiRequest("POST", "/api/auth", credentials);
      const data = await response.json();
      return data;
    },
    onSuccess: (data) => {
      // Clear cache again to ensure fresh start
      queryClient.clear();
      
      setUsername(data.username);
      setUserId(data.id);
      setStoredValue("username", data.username);
      setStoredValue("userId", data.id.toString());
      setIsModalOpen(false);
      
      toast({
        title: "Welcome!",
        description: `Hello, ${data.username}! Brain is ready to assist you.`,
      });
    },
    onError: (error: Error) => {
      // Clear cache on error too
      queryClient.clear();
      
      // Extract a more user-friendly error message
      let errorMessage = error.message;
      if (errorMessage.includes('401')) {
        errorMessage = 'Invalid username or password. Please try again.';
      } else if (errorMessage.includes('400')) {
        errorMessage = 'Please check your input and try again.';
      }
      
      toast({
        title: "Authentication Failed",
        description: errorMessage,
        variant: "destructive",
      });
    },
  });

  const handleUsernameSubmit = (username: string, password: string) => {
    authMutation.mutate({ username, password });
  };

  const handleSignOut = useCallback(async () => {
    // Immediately clear all state and cache to prevent any queries from running
    queryClient.clear();
    queryClient.cancelQueries(); // Cancel any in-flight queries
    
    // Clear stored values first
    removeStoredValue("username");
    removeStoredValue("userId");
    
    // Reset state immediately
    setUsername("");
    setUserId(null);
    setIsModalOpen(true);
    
    // Call logout endpoint in background (non-blocking)
    apiRequest("POST", "/api/logout").catch((logoutError) => {
      // Ignore logout endpoint errors, we've already cleared local state
      console.log("Logout endpoint call failed (non-critical):", logoutError);
    });
    
    toast({
      title: "Signed Out",
      description: "You have been signed out successfully.",
    });
  }, [toast, queryClient]);

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
          onSignOut={handleSignOut}
        />
      )}
    </div>
  );
}
