import { useState, useEffect, useRef, useCallback } from "react";
import { useParams, useLocation } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { apiRequest, queryClient } from "@/lib/queryClient";
import {
  Send,
  Square,
  Clock,
  MessageSquare,
  Bot,
  User,
  Sparkles,
  Loader2,
} from "lucide-react";
import type { PracticeSession, SessionMessage } from "@shared/schema";

export default function PracticeLive() {
  const { id } = useParams<{ id: string }>();
  const [, navigate] = useLocation();
  const { user } = useAuth();
  const { toast } = useToast();

  const [input, setInput] = useState("");
  const [isStreaming, setIsStreaming] = useState(false);
  const [streamingContent, setStreamingContent] = useState("");
  const [elapsedTime, setElapsedTime] = useState(0);
  const [isTimerRunning, setIsTimerRunning] = useState(true);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const { data: session, isLoading: sessionLoading } = useQuery<
    PracticeSession & { messages: SessionMessage[] }
  >({
    queryKey: ["/api/sessions", id],
    refetchInterval: false,
  });

  const messages = session?.messages || [];

  useEffect(() => {
    if (!isTimerRunning) return;
    const interval = setInterval(() => {
      setElapsedTime((t) => t + 1);
    }, 1000);
    return () => clearInterval(interval);
  }, [isTimerRunning]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, streamingContent]);

  useEffect(() => {
    if (session && messages.length === 0 && !isStreaming) {
      startInterview();
    }
  }, [session, messages.length]);

  const startInterview = async () => {
    setIsStreaming(true);
    setStreamingContent("");

    try {
      const response = await fetch(`/api/sessions/${id}/start`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
      });

      if (!response.ok) throw new Error("Failed to start interview");

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      let content = "";

      while (reader) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value);
        const lines = chunk.split("\n");

        for (const line of lines) {
          if (line.startsWith("data: ")) {
            try {
              const data = JSON.parse(line.slice(6));
              if (data.content) {
                content += data.content;
                setStreamingContent(content);
              }
              if (data.done) {
                queryClient.invalidateQueries({ queryKey: ["/api/sessions", id] });
              }
            } catch (e) {}
          }
        }
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to start the interview. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsStreaming(false);
      setStreamingContent("");
    }
  };

  const sendMessage = async () => {
    if (!input.trim() || isStreaming) return;

    const userMessage = input.trim();
    setInput("");
    setIsStreaming(true);
    setStreamingContent("");

    try {
      const response = await fetch(`/api/sessions/${id}/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ content: userMessage }),
      });

      if (!response.ok) throw new Error("Failed to send message");

      await queryClient.invalidateQueries({ queryKey: ["/api/sessions", id] });

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      let content = "";

      while (reader) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value);
        const lines = chunk.split("\n");

        for (const line of lines) {
          if (line.startsWith("data: ")) {
            try {
              const data = JSON.parse(line.slice(6));
              if (data.content) {
                content += data.content;
                setStreamingContent(content);
              }
              if (data.done) {
                queryClient.invalidateQueries({ queryKey: ["/api/sessions", id] });
              }
            } catch (e) {}
          }
        }
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to send message. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsStreaming(false);
      setStreamingContent("");
      inputRef.current?.focus();
    }
  };

  const endSession = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("POST", `/api/sessions/${id}/end`);
      return response.json();
    },
    onSuccess: () => {
      setIsTimerRunning(false);
      queryClient.invalidateQueries({ queryKey: ["/api/sessions", id] });
      queryClient.invalidateQueries({ queryKey: ["/api/sessions"] });
      navigate(`/sessions/${id}`);
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to end session. Please try again.",
        variant: "destructive",
      });
    },
  });

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  if (sessionLoading) {
    return (
      <div className="flex h-full flex-col p-6">
        <Skeleton className="mb-4 h-12 w-full" />
        <Skeleton className="flex-1" />
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col">
      <header className="flex items-center justify-between gap-4 border-b p-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-md bg-primary/10">
            <MessageSquare className="h-5 w-5 text-primary" />
          </div>
          <div className="flex flex-col">
            <span className="font-medium">
              {session?.role || "Interview"} Practice
            </span>
            <span className="text-xs text-muted-foreground">
              {session?.company || "General"}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <Badge variant="secondary" className="gap-1.5 px-3 py-1.5">
            <Clock className="h-3.5 w-3.5" />
            {formatTime(elapsedTime)}
          </Badge>

          <Button
            variant="destructive"
            size="sm"
            onClick={() => endSession.mutate()}
            disabled={endSession.isPending}
            data-testid="button-end-session"
          >
            <Square className="mr-1.5 h-3 w-3" />
            End Session
          </Button>
        </div>
      </header>

      <ScrollArea className="flex-1 p-4">
        <div className="mx-auto flex max-w-3xl flex-col gap-4">
          {messages.map((message) => (
            <MessageBubble
              key={message.id}
              role={message.role as "user" | "assistant"}
              content={message.content}
              userName={user?.firstName || "You"}
            />
          ))}

          {isStreaming && streamingContent && (
            <MessageBubble
              role="assistant"
              content={streamingContent}
              isStreaming
            />
          )}

          {isStreaming && !streamingContent && (
            <div className="flex items-center gap-2 text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
              <span className="text-sm">AI is thinking...</span>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>
      </ScrollArea>

      <div className="border-t p-4">
        <div className="mx-auto flex max-w-3xl gap-3">
          <Textarea
            ref={inputRef}
            placeholder="Type your response..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={isStreaming}
            className="min-h-[60px] resize-none"
            data-testid="input-message"
          />
          <Button
            onClick={sendMessage}
            disabled={!input.trim() || isStreaming}
            className="shrink-0 px-4"
            data-testid="button-send"
          >
            {isStreaming ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
          </Button>
        </div>
        <p className="mx-auto mt-2 max-w-3xl text-center text-xs text-muted-foreground">
          Press Enter to send, Shift+Enter for new line
        </p>
      </div>
    </div>
  );
}

function MessageBubble({
  role,
  content,
  userName,
  isStreaming,
}: {
  role: "user" | "assistant";
  content: string;
  userName?: string;
  isStreaming?: boolean;
}) {
  const isUser = role === "user";

  return (
    <div
      className={`flex gap-3 ${isUser ? "flex-row-reverse" : ""}`}
      data-testid={`message-${role}`}
    >
      <Avatar className="h-8 w-8 shrink-0">
        <AvatarFallback
          className={
            isUser
              ? "bg-primary text-primary-foreground"
              : "bg-accent text-accent-foreground"
          }
        >
          {isUser ? <User className="h-4 w-4" /> : <Bot className="h-4 w-4" />}
        </AvatarFallback>
      </Avatar>

      <div
        className={`flex max-w-[80%] flex-col gap-1 ${
          isUser ? "items-end" : "items-start"
        }`}
      >
        <span className="text-xs text-muted-foreground">
          {isUser ? userName || "You" : "AI Interviewer"}
        </span>
        <div
          className={`rounded-lg px-4 py-3 ${
            isUser
              ? "bg-primary text-primary-foreground"
              : "bg-muted"
          }`}
        >
          <p className="whitespace-pre-wrap text-sm leading-relaxed">
            {content}
            {isStreaming && (
              <span className="ml-1 inline-block h-3 w-1 animate-pulse bg-current" />
            )}
          </p>
        </div>
      </div>
    </div>
  );
}
