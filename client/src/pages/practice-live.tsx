import { useState, useEffect, useRef, useCallback } from "react";
import { useParams, useLocation } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import * as SpeechSDK from "microsoft-cognitiveservices-speech-sdk";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { apiRequest, queryClient } from "@/lib/queryClient";
import {
  Square,
  Clock,
  MessageSquare,
  Bot,
  User,
  Loader2,
  Mic,
  MicOff,
  Volume2,
  VolumeX,
  Send,
  Keyboard,
} from "lucide-react";
import type { PracticeSession, SessionMessage } from "@shared/schema";

interface SpeechRecognitionEvent extends Event {
  results: SpeechRecognitionResultList;
}

interface SpeechRecognitionErrorEvent extends Event {
  error: string;
}

interface SpeechRecognitionResult {
  readonly length: number;
  item(index: number): SpeechRecognitionAlternative;
  [index: number]: SpeechRecognitionAlternative;
  isFinal: boolean;
}

interface SpeechRecognitionAlternative {
  transcript: string;
  confidence: number;
}

interface SpeechRecognitionResultList {
  readonly length: number;
  item(index: number): SpeechRecognitionResult;
  [index: number]: SpeechRecognitionResult;
}

interface SpeechRecognitionInstance extends EventTarget {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  onresult: ((event: SpeechRecognitionEvent) => void) | null;
  onerror: ((event: SpeechRecognitionErrorEvent) => void) | null;
  onend: (() => void) | null;
  start(): void;
  stop(): void;
  abort(): void;
}

interface SpeechRecognitionConstructor {
  new(): SpeechRecognitionInstance;
}

declare global {
  interface Window {
    SpeechRecognition: SpeechRecognitionConstructor;
    webkitSpeechRecognition: SpeechRecognitionConstructor;
  }
}

export default function PracticeLive() {
  const { id } = useParams<{ id: string }>();
  const [, navigate] = useLocation();
  const { user } = useAuth();
  const { toast } = useToast();

  const [isStreaming, setIsStreaming] = useState(false);
  const [streamingContent, setStreamingContent] = useState("");
  const [elapsedTime, setElapsedTime] = useState(0);
  const [isTimerRunning, setIsTimerRunning] = useState(true);
  const [isRecording, setIsRecording] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [currentTranscript, setCurrentTranscript] = useState("");
  const [voiceEnabled, setVoiceEnabled] = useState(true);
  const [autoListen, setAutoListen] = useState(true);
  const [textInput, setTextInput] = useState("");
  const [useTextMode, setUseTextMode] = useState(false);
  const [speechSupported, setSpeechSupported] = useState(false);
  const [ttsSupported, setTtsSupported] = useState(false);
  const [useAzureTTS, setUseAzureTTS] = useState(false);
  const [azureToken, setAzureToken] = useState<{ authToken: string; region: string } | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const recognitionRef = useRef<SpeechRecognitionInstance | null>(null);
  const synthRef = useRef<SpeechSynthesis | null>(null);
  const azureSynthesizerRef = useRef<SpeechSDK.SpeechSynthesizer | null>(null);
  const pendingSpeechRef = useRef<string>("");
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const { data: session, isLoading: sessionLoading } = useQuery<
    PracticeSession & { messages: SessionMessage[] }
  >({
    queryKey: ["/api/sessions", id],
    refetchInterval: false,
  });

  const messages = session?.messages || [];

  useEffect(() => {
    if (window.speechSynthesis) {
      synthRef.current = window.speechSynthesis;
      setTtsSupported(true);
    }
    
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    
    if (SpeechRecognition) {
      setSpeechSupported(true);
      const recognition = new SpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = "en-US";

      recognition.onresult = (event) => {
        let finalTranscript = "";
        let interimTranscript = "";
        
        for (let i = 0; i < event.results.length; i++) {
          const result = event.results[i];
          if (result.isFinal) {
            finalTranscript += result[0].transcript;
          } else {
            interimTranscript += result[0].transcript;
          }
        }
        
        setCurrentTranscript(finalTranscript || interimTranscript);
      };

      recognition.onerror = (event) => {
        console.error("Speech recognition error:", event.error);
        if (event.error !== "aborted" && event.error !== "no-speech") {
          toast({
            title: "Microphone Error",
            description: "Could not access microphone. Please check permissions.",
            variant: "destructive",
          });
        }
        setIsRecording(false);
      };

      recognition.onend = () => {
        setIsRecording(false);
      };

      recognitionRef.current = recognition;
    }

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.abort();
      }
      if (synthRef.current) {
        synthRef.current.cancel();
      }
      if (azureSynthesizerRef.current) {
        azureSynthesizerRef.current.close();
      }
    };
  }, [toast]);

  // Fetch Azure Speech token and set up auto-refresh
  useEffect(() => {
    let tokenRefreshTimer: NodeJS.Timeout | null = null;

    async function initializeAzureSpeech() {
      try {
        const response = await fetch("/api/speech/token", { credentials: "include" });
        if (response.ok) {
          const data = await response.json();
          console.log("Azure Speech token received, region:", data.region);
          if (data.authToken && data.region) {
            setAzureToken(data);
            
            // Close existing synthesizer if any
            if (azureSynthesizerRef.current) {
              try {
                azureSynthesizerRef.current.close();
              } catch (e) {
                // Ignore close errors
              }
              azureSynthesizerRef.current = null;
            }
            
            // Initialize Azure Speech synthesizer
            const speechConfig = SpeechSDK.SpeechConfig.fromAuthorizationToken(
              data.authToken,
              data.region
            );
            speechConfig.speechSynthesisVoiceName = "en-US-JennyNeural";
            
            // Use default speaker output - wrap in try/catch
            try {
              const audioConfig = SpeechSDK.AudioConfig.fromDefaultSpeakerOutput();
              const synthesizer = new SpeechSDK.SpeechSynthesizer(speechConfig, audioConfig);
              
              if (synthesizer) {
                azureSynthesizerRef.current = synthesizer;
                setUseAzureTTS(true);
                console.log("Azure Speech SDK initialized successfully");
              }
            } catch (sdkError) {
              console.error("Azure SDK initialization error:", sdkError);
              setUseAzureTTS(false);
            }

            // Refresh token every 8 minutes (before 10-minute expiry)
            tokenRefreshTimer = setTimeout(initializeAzureSpeech, 8 * 60 * 1000);
          }
        } else {
          console.log("Azure Speech token fetch failed:", response.status);
          setUseAzureTTS(false);
        }
      } catch (error) {
        console.error("Azure Speech init error:", error instanceof Error ? error.message : error);
        setUseAzureTTS(false);
      }
    }
    
    initializeAzureSpeech();
    
    return () => {
      if (tokenRefreshTimer) {
        clearTimeout(tokenRefreshTimer);
      }
    };
  }, []);

  const speakText = useCallback((text: string) => {
    if (!voiceEnabled) return;

    const onSpeechEnd = () => {
      setIsSpeaking(false);
      if (autoListen && recognitionRef.current && !useTextMode) {
        setTimeout(() => {
          try {
            recognitionRef.current?.start();
            setIsRecording(true);
            setCurrentTranscript("");
          } catch (e) {
            console.error("Failed to start recognition:", e);
          }
        }, 500);
      }
    };

    // Helper to use browser TTS fallback
    const useBrowserTTS = () => {
      if (!synthRef.current) {
        setIsSpeaking(false);
        return;
      }
      
      synthRef.current.cancel();
      
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 1.0;
      utterance.pitch = 1.0;
      utterance.volume = 1.0;
      
      utterance.onstart = () => setIsSpeaking(true);
      utterance.onend = onSpeechEnd;
      utterance.onerror = () => setIsSpeaking(false);
      
      synthRef.current.speak(utterance);
    };

    // Try Azure TTS first - check ref directly to avoid stale closure issues
    const azureSynth = azureSynthesizerRef.current;
    console.log("speakText called, synthesizer exists:", !!azureSynth);
    if (azureSynth) {
      console.log("Using Azure TTS to speak:", text.substring(0, 50) + "...");
      setIsSpeaking(true);
      azureSynth.speakTextAsync(
        text,
        (result) => {
          console.log("Azure TTS result:", result.reason, SpeechSDK.ResultReason[result.reason]);
          if (result.reason === SpeechSDK.ResultReason.SynthesizingAudioCompleted) {
            console.log("Azure TTS completed successfully");
            onSpeechEnd();
          } else {
            console.error("Azure TTS failed, falling back to browser TTS:", result.errorDetails);
            useBrowserTTS();
          }
        },
        (error) => {
          console.error("Azure TTS error, falling back to browser TTS:", error);
          useBrowserTTS();
        }
      );
      return;
    } else {
      console.log("Using browser TTS (Azure not available)");
    }
    
    // Use browser TTS when Azure is not available
    useBrowserTTS();
  }, [voiceEnabled, autoListen, useTextMode]);

  const startRecording = useCallback(() => {
    if (!recognitionRef.current || isRecording || isSpeaking || isStreaming) return;
    
    if (synthRef.current) {
      synthRef.current.cancel();
    }
    
    try {
      setCurrentTranscript("");
      recognitionRef.current.start();
      setIsRecording(true);
    } catch (e) {
      console.error("Failed to start recognition:", e);
    }
  }, [isRecording, isSpeaking, isStreaming]);

  const stopRecordingAndSend = useCallback(async () => {
    if (!recognitionRef.current || !isRecording) return;
    
    recognitionRef.current.stop();
    setIsRecording(false);
    
    const transcript = currentTranscript.trim();
    if (!transcript) {
      toast({
        title: "No speech detected",
        description: "Please try speaking again.",
      });
      return;
    }
    
    setCurrentTranscript("");
    setIsStreaming(true);
    setStreamingContent("");

    try {
      const response = await fetch(`/api/sessions/${id}/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ content: transcript }),
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
                pendingSpeechRef.current = content;
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
      if (pendingSpeechRef.current) {
        speakText(pendingSpeechRef.current);
        pendingSpeechRef.current = "";
      }
      setStreamingContent("");
    }
  }, [id, isRecording, currentTranscript, toast, speakText]);

  const sendTextMessage = useCallback(async () => {
    if (!textInput.trim() || isStreaming) return;

    const userMessage = textInput.trim();
    setTextInput("");
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
                pendingSpeechRef.current = content;
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
      if (pendingSpeechRef.current && voiceEnabled && ttsSupported) {
        speakText(pendingSpeechRef.current);
        pendingSpeechRef.current = "";
      }
      setStreamingContent("");
      inputRef.current?.focus();
    }
  }, [id, textInput, isStreaming, toast, speakText, voiceEnabled, ttsSupported]);

  const handleModeSwitch = useCallback((toTextMode: boolean) => {
    if (recognitionRef.current && isRecording) {
      recognitionRef.current.abort();
      setIsRecording(false);
      setCurrentTranscript("");
    }
    if (synthRef.current && isSpeaking) {
      synthRef.current.cancel();
      setIsSpeaking(false);
    }
    setUseTextMode(toTextMode);
  }, [isRecording, isSpeaking]);

  const handleVoiceToggle = useCallback((enabled: boolean) => {
    if (!enabled) {
      if (synthRef.current) {
        synthRef.current.cancel();
      }
      // Azure TTS doesn't have a cancel method on synthesizer, just stop speaking state
      setIsSpeaking(false);
    }
    setVoiceEnabled(enabled);
  }, []);

  useEffect(() => {
    if (!isTimerRunning) return;
    const interval = setInterval(() => {
      setElapsedTime((t) => t + 1);
    }, 1000);
    return () => clearInterval(interval);
  }, [isTimerRunning]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, streamingContent, currentTranscript]);

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
                pendingSpeechRef.current = content;
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
      if (pendingSpeechRef.current) {
        speakText(pendingSpeechRef.current);
        pendingSpeechRef.current = "";
      }
      setStreamingContent("");
    }
  };

  const endSession = useMutation({
    mutationFn: async () => {
      if (synthRef.current) synthRef.current.cancel();
      if (recognitionRef.current) recognitionRef.current.abort();
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
              {session?.company || "General"} - Voice Mode
            </span>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <Switch
              id="voice-toggle"
              checked={voiceEnabled}
              onCheckedChange={handleVoiceToggle}
              data-testid="switch-voice"
            />
            <Label htmlFor="voice-toggle" className="text-xs">
              {voiceEnabled ? <Volume2 className="h-4 w-4" /> : <VolumeX className="h-4 w-4" />}
            </Label>
          </div>

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

          {currentTranscript && (
            <MessageBubble
              role="user"
              content={currentTranscript}
              userName={user?.firstName || "You"}
              isStreaming
            />
          )}

          <div ref={messagesEndRef} />
        </div>
      </ScrollArea>

      <div className="border-t p-6">
        <div className="mx-auto flex max-w-3xl flex-col items-center gap-4">
          {isSpeaking && (
            <div className="flex items-center gap-2 text-primary">
              <Volume2 className="h-5 w-5 animate-pulse" />
              <span className="text-sm font-medium">AI is speaking...</span>
            </div>
          )}

          {useTextMode || !speechSupported ? (
            <div className="flex w-full gap-3">
              <Textarea
                ref={inputRef}
                placeholder="Type your response..."
                value={textInput}
                onChange={(e) => setTextInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    sendTextMessage();
                  }
                }}
                disabled={isStreaming || isSpeaking}
                className="min-h-[60px] resize-none"
                data-testid="input-message"
              />
              <Button
                onClick={sendTextMessage}
                disabled={!textInput.trim() || isStreaming || isSpeaking}
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
          ) : (
            <>
              {!isSpeaking && !isStreaming && (
                <Button
                  size="lg"
                  variant={isRecording ? "destructive" : "default"}
                  onClick={isRecording ? stopRecordingAndSend : startRecording}
                  className="h-20 w-20 rounded-full"
                  data-testid="button-microphone"
                >
                  {isRecording ? (
                    <MicOff className="h-8 w-8" />
                  ) : (
                    <Mic className="h-8 w-8" />
                  )}
                </Button>
              )}

              {isStreaming && (
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Loader2 className="h-5 w-5 animate-spin" />
                  <span className="text-sm">Processing your response...</span>
                </div>
              )}
            </>
          )}

          <p className="text-center text-sm text-muted-foreground">
            {useTextMode || !speechSupported
              ? "Press Enter to send, Shift+Enter for new line"
              : isRecording 
                ? "Listening... Click to stop and send" 
                : isSpeaking 
                  ? "Wait for AI to finish speaking" 
                  : isStreaming
                    ? "Please wait..."
                    : "Click the microphone to start speaking"}
          </p>

          <div className="flex flex-wrap items-center justify-center gap-4">
            {speechSupported && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleModeSwitch(!useTextMode)}
                data-testid="button-toggle-mode"
              >
                {useTextMode ? (
                  <>
                    <Mic className="mr-2 h-4 w-4" />
                    Switch to Voice
                  </>
                ) : (
                  <>
                    <Keyboard className="mr-2 h-4 w-4" />
                    Switch to Text
                  </>
                )}
              </Button>
            )}

            {!useTextMode && speechSupported && (
              <div className="flex items-center gap-2">
                <Switch
                  id="auto-listen"
                  checked={autoListen}
                  onCheckedChange={setAutoListen}
                  data-testid="switch-auto-listen"
                />
                <Label htmlFor="auto-listen" className="text-xs text-muted-foreground">
                  Auto-listen after AI speaks
                </Label>
              </div>
            )}
          </div>
        </div>
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
