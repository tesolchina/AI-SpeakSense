import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  MessageSquare,
  Target,
  Mic,
  Clock,
  Lightbulb,
  BookOpen,
  ArrowRight,
  Lock,
  Play,
} from "lucide-react";

const exercises = [
  {
    id: 1,
    title: "STAR Method Practice",
    description: "Learn to structure your answers using Situation, Task, Action, Result.",
    tags: ["structure", "storytelling"],
    icon: Target,
    duration: "10 min",
    available: true,
  },
  {
    id: 2,
    title: "Elevator Pitch",
    description: "Perfect your 60-second introduction for any networking scenario.",
    tags: ["conciseness", "clarity"],
    icon: Clock,
    duration: "5 min",
    available: true,
  },
  {
    id: 3,
    title: "Active Listening",
    description: "Practice responding thoughtfully to interviewer questions.",
    tags: ["listening", "engagement"],
    icon: Mic,
    duration: "8 min",
    available: true,
  },
  {
    id: 4,
    title: "Technical Explanation",
    description: "Explain complex concepts simply to non-technical audiences.",
    tags: ["technical", "simplification"],
    icon: Lightbulb,
    duration: "12 min",
    available: false,
  },
  {
    id: 5,
    title: "Handling Difficult Questions",
    description: "Learn strategies for tough questions like weaknesses and failures.",
    tags: ["strategy", "composure"],
    icon: MessageSquare,
    duration: "15 min",
    available: false,
  },
  {
    id: 6,
    title: "Company Research Deep Dive",
    description: "Practice weaving company knowledge into your interview answers.",
    tags: ["research", "preparation"],
    icon: BookOpen,
    duration: "10 min",
    available: false,
  },
];

export default function Exercises() {
  return (
    <div className="flex flex-col gap-6 p-6">
      <div className="flex flex-col gap-2">
        <h1 className="text-2xl font-bold tracking-tight">Exercises</h1>
        <p className="text-muted-foreground">
          Bite-sized practice modules to sharpen specific interview skills.
        </p>
      </div>

      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {exercises.map((exercise) => (
          <ExerciseCard key={exercise.id} exercise={exercise} />
        ))}
      </div>

      <Card className="mt-4">
        <CardContent className="flex flex-col items-center justify-center gap-4 py-12 text-center sm:flex-row sm:text-left">
          <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-primary/10">
            <Target className="h-8 w-8 text-primary" />
          </div>
          <div className="flex flex-col gap-1">
            <h3 className="text-lg font-semibold">Want Full Interview Practice?</h3>
            <p className="text-muted-foreground">
              Jump into a complete mock interview session with our AI interviewer.
            </p>
          </div>
          <Button asChild className="shrink-0 gap-2">
            <Link href="/practice">
              Start Practice
              <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}

function ExerciseCard({
  exercise,
}: {
  exercise: {
    id: number;
    title: string;
    description: string;
    tags: string[];
    icon: React.ElementType;
    duration: string;
    available: boolean;
  };
}) {
  const Icon = exercise.icon;

  return (
    <Card
      className={`group relative transition-all ${
        exercise.available ? "hover-elevate" : "opacity-60"
      }`}
    >
      {!exercise.available && (
        <div className="absolute right-4 top-4">
          <Badge variant="secondary" className="gap-1">
            <Lock className="h-3 w-3" />
            Coming Soon
          </Badge>
        </div>
      )}
      <CardHeader>
        <div className="mb-2 flex h-12 w-12 items-center justify-center rounded-md bg-primary/10 text-primary">
          <Icon className="h-6 w-6" />
        </div>
        <CardTitle className="text-lg">{exercise.title}</CardTitle>
        <CardDescription>{exercise.description}</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex flex-wrap items-center gap-2">
          {exercise.tags.map((tag) => (
            <Badge key={tag} variant="outline" className="text-xs">
              {tag}
            </Badge>
          ))}
          <Badge variant="secondary" className="ml-auto gap-1 text-xs">
            <Clock className="h-3 w-3" />
            {exercise.duration}
          </Badge>
        </div>
        {exercise.available && (
          <Button className="mt-4 w-full gap-2" variant="secondary" asChild>
            <Link href={`/exercises/${exercise.id}`} data-testid={`exercise-${exercise.id}`}>
              <Play className="h-4 w-4" />
              Start Exercise
            </Link>
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
