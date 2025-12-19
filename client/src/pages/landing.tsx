import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/theme-toggle";
import {
  Sparkles,
  MessageSquare,
  Target,
  TrendingUp,
  Play,
  CheckCircle2,
  ArrowRight,
} from "lucide-react";

export default function Landing() {
  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-50 border-b bg-background/80 backdrop-blur-sm">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-4 px-6">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-md bg-primary">
              <Sparkles className="h-5 w-5 text-primary-foreground" />
            </div>
            <span className="text-lg font-semibold tracking-tight">SpeakAI</span>
          </div>
          <div className="flex items-center gap-3">
            <ThemeToggle />
            <Button asChild data-testid="button-login">
              <a href="/api/login">Get Started</a>
            </Button>
          </div>
        </div>
      </header>

      <main>
        <section className="relative overflow-hidden py-24 sm:py-32">
          <div className="absolute inset-0 -z-10 bg-gradient-to-b from-primary/5 to-transparent" />
          <div className="mx-auto max-w-7xl px-6">
            <div className="mx-auto max-w-3xl text-center">
              <div className="mb-6 inline-flex items-center gap-2 rounded-full bg-primary/10 px-4 py-1.5 text-sm font-medium text-primary">
                <Sparkles className="h-4 w-4" />
                AI-Powered Interview Practice
              </div>
              <h1 className="text-4xl font-bold tracking-tight sm:text-5xl md:text-6xl">
                Master Your Interview Skills with{" "}
                <span className="text-primary">AI Coaching</span>
              </h1>
              <p className="mt-6 text-lg text-muted-foreground sm:text-xl">
                Practice with an AI interviewer that adapts to your goals.
                Get instant feedback, track your progress, and build confidence
                for your next big opportunity.
              </p>
              <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
                <Button size="lg" className="gap-2 px-8" asChild data-testid="button-start-practicing">
                  <a href="/api/login">
                    <Play className="h-4 w-4" />
                    Start Practicing Free
                  </a>
                </Button>
                <Button variant="outline" size="lg" className="gap-2" asChild>
                  <a href="#features">
                    Learn More
                    <ArrowRight className="h-4 w-4" />
                  </a>
                </Button>
              </div>
            </div>
          </div>
        </section>

        <section id="features" className="border-t bg-card py-24">
          <div className="mx-auto max-w-7xl px-6">
            <div className="mx-auto max-w-2xl text-center">
              <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
                Everything You Need to Succeed
              </h2>
              <p className="mt-4 text-muted-foreground">
                Our AI-powered platform helps you prepare for any interview scenario
                with personalized practice and detailed feedback.
              </p>
            </div>

            <div className="mt-16 grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
              <FeatureCard
                icon={MessageSquare}
                title="Realistic AI Interviews"
                description="Practice with an AI interviewer that responds naturally to your answers, just like a real interview."
              />
              <FeatureCard
                icon={Target}
                title="Personalized Practice"
                description="Choose your target role, company, and interviewer style. Customize questions for your specific needs."
              />
              <FeatureCard
                icon={TrendingUp}
                title="Detailed Feedback"
                description="Get scored on clarity, structure, and content. Track your improvement over time with analytics."
              />
            </div>
          </div>
        </section>

        <section className="border-t py-24">
          <div className="mx-auto max-w-7xl px-6">
            <div className="mx-auto max-w-2xl text-center">
              <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
                How It Works
              </h2>
              <p className="mt-4 text-muted-foreground">
                Get started in minutes and transform your interview skills.
              </p>
            </div>

            <div className="mt-16 grid gap-8 sm:grid-cols-3">
              <StepCard
                number={1}
                title="Choose Your Scenario"
                description="Select from behavioral, technical, or custom interview templates tailored to your goals."
              />
              <StepCard
                number={2}
                title="Practice with AI"
                description="Have a realistic conversation with our AI interviewer that adapts to your responses."
              />
              <StepCard
                number={3}
                title="Review & Improve"
                description="Get detailed feedback on each session and track your progress over time."
              />
            </div>
          </div>
        </section>

        <section className="border-t bg-primary py-24 text-primary-foreground">
          <div className="mx-auto max-w-7xl px-6 text-center">
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
              Ready to Ace Your Next Interview?
            </h2>
            <p className="mx-auto mt-4 max-w-xl text-primary-foreground/80">
              Join thousands of professionals who have improved their interview
              skills with SpeakAI.
            </p>
            <Button
              size="lg"
              variant="secondary"
              className="mt-8 gap-2 px-8"
              asChild
              data-testid="button-cta-bottom"
            >
              <a href="/api/login">
                Get Started Now
                <ArrowRight className="h-4 w-4" />
              </a>
            </Button>
          </div>
        </section>
      </main>

      <footer className="border-t py-8">
        <div className="mx-auto max-w-7xl px-6">
          <div className="flex flex-col items-center justify-between gap-4 sm:flex-row">
            <div className="flex items-center gap-2">
              <div className="flex h-7 w-7 items-center justify-center rounded-md bg-primary">
                <Sparkles className="h-4 w-4 text-primary-foreground" />
              </div>
              <span className="text-sm font-medium">SpeakAI</span>
            </div>
            <p className="text-sm text-muted-foreground">
              Built for better interviews.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}

function FeatureCard({
  icon: Icon,
  title,
  description,
}: {
  icon: React.ElementType;
  title: string;
  description: string;
}) {
  return (
    <div className="group relative rounded-lg border bg-background p-6 transition-colors">
      <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-md bg-primary/10 text-primary">
        <Icon className="h-6 w-6" />
      </div>
      <h3 className="mb-2 text-lg font-semibold">{title}</h3>
      <p className="text-sm text-muted-foreground">{description}</p>
    </div>
  );
}

function StepCard({
  number,
  title,
  description,
}: {
  number: number;
  title: string;
  description: string;
}) {
  return (
    <div className="relative text-center">
      <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-primary text-lg font-bold text-primary-foreground">
        {number}
      </div>
      <h3 className="mb-2 text-lg font-semibold">{title}</h3>
      <p className="text-sm text-muted-foreground">{description}</p>
    </div>
  );
}
