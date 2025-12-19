import { useState } from "react";
import { useLocation } from "wouter";
import { useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import {
  Sparkles,
  Briefcase,
  Presentation,
  Users,
  GraduationCap,
  ArrowRight,
  CheckCircle2,
} from "lucide-react";

const intents = [
  {
    id: "interview",
    title: "Interview Preparation",
    description: "Prepare for job interviews and improve your responses",
    icon: Briefcase,
  },
  {
    id: "presentation",
    title: "Presentations & Speeches",
    description: "Practice presenting ideas clearly and confidently",
    icon: Presentation,
  },
  {
    id: "sales",
    title: "Sales & Pitching",
    description: "Improve your pitching skills and close more deals",
    icon: Users,
  },
  {
    id: "coaching",
    title: "Communication Coaching",
    description: "General communication and public speaking improvement",
    icon: GraduationCap,
  },
];

export default function Onboarding() {
  const [, navigate] = useLocation();
  const { user } = useAuth();
  const { toast } = useToast();
  const [selectedIntent, setSelectedIntent] = useState<string | null>(null);

  const savePreferences = useMutation({
    mutationFn: async (intent: string) => {
      const response = await apiRequest("POST", "/api/preferences", {
        intent,
        onboardingComplete: true,
      });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/preferences"] });
      navigate("/");
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to save preferences. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleContinue = () => {
    if (selectedIntent) {
      savePreferences.mutate(selectedIntent);
    }
  };

  const handleSkip = () => {
    savePreferences.mutate("interview");
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background p-6">
      <div className="w-full max-w-2xl">
        <div className="mb-8 text-center">
          <div className="mb-4 inline-flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
            <Sparkles className="h-8 w-8 text-primary" />
          </div>
          <h1 className="mb-2 text-3xl font-bold tracking-tight">
            Welcome{user?.firstName ? `, ${user.firstName}` : ""}!
          </h1>
          <p className="text-muted-foreground">
            What would you like to use SpeakAI for?
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          {intents.map((intent) => {
            const Icon = intent.icon;
            const isSelected = selectedIntent === intent.id;

            return (
              <button
                key={intent.id}
                onClick={() => setSelectedIntent(intent.id)}
                className={`relative flex flex-col items-start gap-3 rounded-lg border p-5 text-left transition-all hover-elevate ${
                  isSelected ? "border-primary bg-primary/5" : ""
                }`}
                data-testid={`intent-${intent.id}`}
              >
                {isSelected && (
                  <div className="absolute right-3 top-3">
                    <CheckCircle2 className="h-5 w-5 text-primary" />
                  </div>
                )}
                <div className="flex h-10 w-10 items-center justify-center rounded-md bg-primary/10 text-primary">
                  <Icon className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="font-medium">{intent.title}</h3>
                  <p className="text-sm text-muted-foreground">
                    {intent.description}
                  </p>
                </div>
              </button>
            );
          })}
        </div>

        <div className="mt-8 flex flex-col items-center gap-4">
          <Button
            size="lg"
            className="w-full max-w-xs gap-2"
            onClick={handleContinue}
            disabled={!selectedIntent || savePreferences.isPending}
            data-testid="button-continue"
          >
            Continue
            <ArrowRight className="h-4 w-4" />
          </Button>
          <button
            onClick={handleSkip}
            className="text-sm text-muted-foreground transition-colors hover:text-foreground"
            disabled={savePreferences.isPending}
            data-testid="button-skip"
          >
            Skip for now
          </button>
        </div>
      </div>
    </div>
  );
}
