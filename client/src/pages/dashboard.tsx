import { Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/hooks/use-auth";
import {
  Play,
  Target,
  TrendingUp,
  Clock,
  Award,
  ChevronRight,
  Calendar,
  MessageSquare,
} from "lucide-react";
import type { PracticeSession } from "@shared/schema";

export default function Dashboard() {
  const { user } = useAuth();

  const { data: sessions, isLoading: sessionsLoading } = useQuery<PracticeSession[]>({
    queryKey: ["/api/sessions"],
  });

  const { data: stats } = useQuery<{
    totalSessions: number;
    completedSessions: number;
    averageScore: number;
    streak: number;
  }>({
    queryKey: ["/api/stats"],
  });

  const completedSessions = sessions?.filter((s) => s.status === "completed") || [];
  const recentSessions = completedSessions.slice(0, 5);

  return (
    <div className="flex flex-col gap-8 p-6">
      <div className="flex flex-col gap-2">
        <h1 className="text-2xl font-bold tracking-tight">
          Welcome back, {user?.firstName || "there"}!
        </h1>
        <p className="text-muted-foreground">
          Ready to practice? Let's sharpen those interview skills.
        </p>
      </div>

      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          icon={MessageSquare}
          label="Total Sessions"
          value={stats?.totalSessions ?? completedSessions.length}
          loading={sessionsLoading}
        />
        <StatCard
          icon={Target}
          label="Completed"
          value={stats?.completedSessions ?? completedSessions.length}
          loading={sessionsLoading}
        />
        <StatCard
          icon={TrendingUp}
          label="Average Score"
          value={stats?.averageScore ? `${stats.averageScore}%` : "--"}
          loading={sessionsLoading}
        />
        <StatCard
          icon={Award}
          label="Current Streak"
          value={`${stats?.streak ?? 0} days`}
          loading={sessionsLoading}
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader className="flex flex-row flex-wrap items-center justify-between gap-4">
            <div>
              <CardTitle>Quick Start</CardTitle>
              <CardDescription>
                Jump into a practice session with popular templates
              </CardDescription>
            </div>
            <Button asChild data-testid="button-new-session">
              <Link href="/practice">
                <Play className="mr-2 h-4 w-4" />
                New Session
              </Link>
            </Button>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 sm:grid-cols-2">
              <QuickStartCard
                title="Behavioral Interview"
                description="Practice STAR method responses"
                href="/practice?template=behavioral"
                icon={MessageSquare}
              />
              <QuickStartCard
                title="Technical Interview"
                description="Explain your projects & skills"
                href="/practice?template=technical"
                icon={Target}
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5 text-muted-foreground" />
              Recent Sessions
            </CardTitle>
          </CardHeader>
          <CardContent>
            {sessionsLoading ? (
              <div className="space-y-3">
                {[1, 2, 3].map((i) => (
                  <Skeleton key={i} className="h-12 w-full" />
                ))}
              </div>
            ) : recentSessions.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <Clock className="mb-3 h-10 w-10 text-muted-foreground/50" />
                <p className="text-sm text-muted-foreground">
                  No sessions yet. Start practicing!
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {recentSessions.map((session) => (
                  <Link
                    key={session.id}
                    href={`/sessions/${session.id}`}
                    className="flex items-center justify-between rounded-md border p-3 transition-colors hover-elevate"
                    data-testid={`session-${session.id}`}
                  >
                    <div className="flex flex-col gap-1">
                      <span className="text-sm font-medium">
                        {session.role || "General Practice"}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {session.completedAt
                          ? new Date(session.completedAt).toLocaleDateString()
                          : "In progress"}
                      </span>
                    </div>
                    <ChevronRight className="h-4 w-4 text-muted-foreground" />
                  </Link>
                ))}
              </div>
            )}
            {recentSessions.length > 0 && (
              <Button variant="ghost" className="mt-4 w-full" asChild>
                <Link href="/sessions">View All Sessions</Link>
              </Button>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Your Progress</CardTitle>
          <CardDescription>
            Track your improvement across different interview skills
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            <ProgressItem label="Communication Clarity" value={72} />
            <ProgressItem label="STAR Method Structure" value={58} />
            <ProgressItem label="Technical Explanation" value={65} />
            <ProgressItem label="Confidence & Delivery" value={80} />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function StatCard({
  icon: Icon,
  label,
  value,
  loading,
}: {
  icon: React.ElementType;
  label: string;
  value: string | number;
  loading?: boolean;
}) {
  return (
    <Card>
      <CardContent className="flex items-center gap-4 p-6">
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-md bg-primary/10 text-primary">
          <Icon className="h-6 w-6" />
        </div>
        <div className="flex flex-col">
          <span className="text-sm text-muted-foreground">{label}</span>
          {loading ? (
            <Skeleton className="mt-1 h-7 w-16" />
          ) : (
            <span className="text-2xl font-bold">{value}</span>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

function QuickStartCard({
  title,
  description,
  href,
  icon: Icon,
}: {
  title: string;
  description: string;
  href: string;
  icon: React.ElementType;
}) {
  return (
    <Link
      href={href}
      className="group flex items-center gap-4 rounded-lg border p-4 transition-colors hover-elevate"
      data-testid={`quickstart-${title.toLowerCase().replace(" ", "-")}`}
    >
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-primary/10 text-primary">
        <Icon className="h-5 w-5" />
      </div>
      <div className="flex flex-col">
        <span className="font-medium">{title}</span>
        <span className="text-sm text-muted-foreground">{description}</span>
      </div>
      <ChevronRight className="ml-auto h-5 w-5 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
    </Link>
  );
}

function ProgressItem({ label, value }: { label: string; value: number }) {
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium">{label}</span>
        <span className="text-sm text-muted-foreground">{value}%</span>
      </div>
      <Progress value={value} className="h-2" />
    </div>
  );
}
