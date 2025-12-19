import { useParams, Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import {
  ArrowLeft,
  Calendar,
  Clock,
  Target,
  Building2,
  MessageSquare,
  Bot,
  User,
  TrendingUp,
  Star,
  AlertCircle,
  CheckCircle2,
} from "lucide-react";
import type { PracticeSession, SessionMessage, SessionFeedback } from "@shared/schema";

export default function SessionDetail() {
  const { id } = useParams<{ id: string }>();

  const { data: session, isLoading } = useQuery<
    PracticeSession & { messages: SessionMessage[]; feedback?: SessionFeedback }
  >({
    queryKey: ["/api/sessions", id],
  });

  const formatDate = (date: Date | string | null) => {
    if (!date) return "--";
    return new Date(date).toLocaleDateString("en-US", {
      weekday: "long",
      month: "long",
      day: "numeric",
      year: "numeric",
    });
  };

  const formatDuration = (start: Date | string | null, end: Date | string | null) => {
    if (!start || !end) return "--";
    const duration = new Date(end).getTime() - new Date(start).getTime();
    const minutes = Math.floor(duration / 60000);
    const seconds = Math.floor((duration % 60000) / 1000);
    return `${minutes}m ${seconds}s`;
  };

  if (isLoading) {
    return (
      <div className="flex flex-col gap-6 p-6">
        <Skeleton className="h-10 w-32" />
        <div className="grid gap-6 lg:grid-cols-3">
          <Skeleton className="h-96 lg:col-span-2" />
          <Skeleton className="h-96" />
        </div>
      </div>
    );
  }

  if (!session) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 p-6 py-24">
        <AlertCircle className="h-12 w-12 text-muted-foreground" />
        <h2 className="text-xl font-semibold">Session Not Found</h2>
        <p className="text-muted-foreground">
          The session you're looking for doesn't exist.
        </p>
        <Button asChild>
          <Link href="/sessions">Back to Sessions</Link>
        </Button>
      </div>
    );
  }

  const feedback = session.feedback;
  const rubricScores = (feedback?.rubricScores as Record<string, number>) || {};

  return (
    <div className="flex flex-col gap-6 p-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/sessions">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div className="flex flex-col gap-1">
          <h1 className="text-2xl font-bold tracking-tight">
            {session.role || "General"} Interview
          </h1>
          <p className="text-muted-foreground">
            Session #{session.id} - {session.company || "Generic"}
          </p>
        </div>
        <Badge variant={session.status === "completed" ? "default" : "secondary"} className="ml-auto">
          {session.status === "completed" ? (
            <>
              <CheckCircle2 className="mr-1 h-3 w-3" />
              Completed
            </>
          ) : (
            session.status
          )}
        </Badge>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="flex flex-col gap-6 lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MessageSquare className="h-5 w-5 text-muted-foreground" />
                Conversation Transcript
              </CardTitle>
              <CardDescription>
                {session.messages?.length || 0} messages exchanged
              </CardDescription>
            </CardHeader>
            <CardContent>
              {!session.messages || session.messages.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <MessageSquare className="mb-3 h-10 w-10 text-muted-foreground/50" />
                  <p className="text-muted-foreground">No messages in this session.</p>
                </div>
              ) : (
                <ScrollArea className="h-[400px] pr-4">
                  <div className="flex flex-col gap-4">
                    {session.messages.map((message) => (
                      <TranscriptMessage
                        key={message.id}
                        role={message.role as "user" | "assistant"}
                        content={message.content}
                      />
                    ))}
                  </div>
                </ScrollArea>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="flex flex-col gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Session Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <DetailRow
                icon={Target}
                label="Role"
                value={session.role || "General"}
              />
              <DetailRow
                icon={Building2}
                label="Company"
                value={session.company || "Generic"}
              />
              <DetailRow
                icon={Calendar}
                label="Date"
                value={formatDate(session.createdAt)}
              />
              <DetailRow
                icon={Clock}
                label="Duration"
                value={formatDuration(session.startedAt, session.completedAt)}
              />
            </CardContent>
          </Card>

          {feedback && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5 text-muted-foreground" />
                  Performance
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex flex-col items-center gap-2">
                  <div className="relative flex h-24 w-24 items-center justify-center rounded-full bg-primary/10">
                    <span className="text-3xl font-bold text-primary">
                      {feedback.overallScore || 0}
                    </span>
                  </div>
                  <span className="text-sm text-muted-foreground">
                    Overall Score
                  </span>
                </div>

                <Separator />

                <div className="space-y-4">
                  {Object.entries(rubricScores).map(([key, value]) => (
                    <div key={key} className="space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <span className="capitalize">{key.replace(/_/g, " ")}</span>
                        <span className="text-muted-foreground">{value}%</span>
                      </div>
                      <Progress value={value} className="h-2" />
                    </div>
                  ))}
                </div>

                {feedback.strengths && feedback.strengths.length > 0 && (
                  <>
                    <Separator />
                    <div className="space-y-2">
                      <span className="flex items-center gap-2 text-sm font-medium">
                        <Star className="h-4 w-4 text-yellow-500" />
                        Strengths
                      </span>
                      <ul className="space-y-1 text-sm text-muted-foreground">
                        {feedback.strengths.map((s, i) => (
                          <li key={i} className="flex items-start gap-2">
                            <CheckCircle2 className="mt-0.5 h-3 w-3 shrink-0 text-green-500" />
                            {s}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </>
                )}

                {feedback.improvements && feedback.improvements.length > 0 && (
                  <div className="space-y-2">
                    <span className="flex items-center gap-2 text-sm font-medium">
                      <TrendingUp className="h-4 w-4 text-blue-500" />
                      Areas to Improve
                    </span>
                    <ul className="space-y-1 text-sm text-muted-foreground">
                      {feedback.improvements.map((s, i) => (
                        <li key={i} className="flex items-start gap-2">
                          <AlertCircle className="mt-0.5 h-3 w-3 shrink-0 text-orange-500" />
                          {s}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {!feedback && session.status === "completed" && (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-8 text-center">
                <TrendingUp className="mb-3 h-10 w-10 text-muted-foreground/50" />
                <p className="text-sm text-muted-foreground">
                  Feedback is being generated...
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}

function DetailRow({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ElementType;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-center gap-3">
      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-muted">
        <Icon className="h-4 w-4 text-muted-foreground" />
      </div>
      <div className="flex flex-col">
        <span className="text-xs text-muted-foreground">{label}</span>
        <span className="text-sm font-medium">{value}</span>
      </div>
    </div>
  );
}

function TranscriptMessage({
  role,
  content,
}: {
  role: "user" | "assistant";
  content: string;
}) {
  const isUser = role === "user";

  return (
    <div className={`flex gap-3 ${isUser ? "flex-row-reverse" : ""}`}>
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
        className={`flex max-w-[85%] rounded-lg px-4 py-3 ${
          isUser ? "bg-primary text-primary-foreground" : "bg-muted"
        }`}
      >
        <p className="whitespace-pre-wrap text-sm leading-relaxed">{content}</p>
      </div>
    </div>
  );
}
