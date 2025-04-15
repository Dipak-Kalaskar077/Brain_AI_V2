import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Form, FormControl, FormField, FormItem, FormMessage } from "@/components/ui/form";

interface UsernameModalProps {
  isOpen: boolean;
  onSubmit: (username: string, password: string) => void;
  onClose?: () => void;
}

const formSchema = z.object({
  username: z.string().min(2, "Username must be at least 2 characters"),
  password: z.string().min(4, "Password must be at least 4 characters"),
});

export function UsernameModal({ isOpen, onSubmit, onClose }: UsernameModalProps) {
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      username: "",
      password: "",
    },
  });

  const handleSubmit = (values: z.infer<typeof formSchema>) => {
    onSubmit(values.username, values.password);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md mx-auto">
        <DialogHeader className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary-50 text-primary mx-auto mb-4">
            <i className="fas fa-robot text-3xl"></i>
          </div>
          <DialogTitle className="text-2xl font-bold">Welcome to Dipak's Personal AI Assistant</DialogTitle>
          <DialogDescription className="text-gray-600 dark:text-gray-300 mt-2">
            Hello! I'm Brain, your personal AI. Let me know your name to get started.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="username"
              render={({ field }) => (
                <FormItem>
                  <Label htmlFor="username" className="text-sm font-medium">Your Name</Label>
                  <FormControl>
                    <Input
                      {...field}
                      id="username"
                      placeholder="Enter your name"
                      className="w-full px-4 py-3 rounded-lg"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="password"
              render={({ field }) => (
                <FormItem>
                  <Label htmlFor="password" className="text-sm font-medium">Password</Label>
                  <FormControl>
                    <Input
                      {...field}
                      id="password"
                      type="password"
                      placeholder="Enter a password"
                      className="w-full px-4 py-3 rounded-lg"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <Button 
              type="submit" 
              className="w-full py-3 px-4 font-medium rounded-lg flex items-center justify-center"
            >
              <span>Get Started</span>
              <i className="fas fa-arrow-right ml-2"></i>
            </Button>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
