import { useState, useEffect } from "react";
import { useLocation, useSearch } from "wouter";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import {
  Play,
  User,
  Building2,
  MessageSquare,
  Plus,
  X,
  Sparkles,
  CheckCircle2,
} from "lucide-react";
import type { PracticeTemplate, InterviewerPersona } from "@shared/schema";

const DEFAULT_TEMPLATES: Partial<PracticeTemplate>[] = [
  {
    id: 1,
    name: "Behavioral Interview",
    category: "behavioral",
    description: "Practice answering questions about past experiences using the STAR method.",
    rubricItems: ["Clear situation context", "Specific actions taken", "Measurable results", "Active listening"],
    defaultQuestions: [
      "Tell me about yourself.",
      "Describe a challenging situation at work and how you handled it.",
      "Give an example of a time you showed leadership.",
      "Tell me about a time you failed and what you learned.",
    ],
    difficulty: "medium",
  },
  {
    id: 2,
    name: "Technical Interview",
    category: "technical",
    description: "Explain your technical skills, projects, and problem-solving approach.",
    rubricItems: ["Technical accuracy", "Clear explanations", "Structured thinking", "Problem-solving approach"],
    defaultQuestions: [
      "Walk me through a technical project you're proud of.",
      "How do you approach debugging a complex issue?",
      "Explain a technical concept to me as if I'm non-technical.",
      "What technologies are you most excited about learning?",
    ],
    difficulty: "hard",
  },
  {
    id: 3,
    name: "General Interview",
    category: "behavioral",
    description: "A mix of common interview questions to help you prepare broadly.",
    rubricItems: ["Communication clarity", "Confidence", "Relevance of answers", "Enthusiasm"],
    defaultQuestions: [
      "Why are you interested in this role?",
      "What are your greatest strengths?",
      "Where do you see yourself in 5 years?",
      "Do you have any questions for me?",
    ],
    difficulty: "easy",
  },
];

const DEFAULT_PERSONAS: Partial<InterviewerPersona>[] = [
  {
    id: 1,
    name: "Alex",
    style: "friendly",
    description: "A supportive interviewer who helps you feel comfortable and provides encouragement.",
  },
  {
    id: 2,
    name: "Jordan",
    style: "professional",
    description: "A balanced, straightforward interviewer focused on evaluating your qualifications.",
  },
  {
    id: 3,
    name: "Morgan",
    style: "challenging",
    description: "A rigorous interviewer who asks follow-up questions and pushes you to be specific.",
  },
];

export default function PracticeSetup() {
  const [, navigate] = useLocation();
  const search = useSearch();
  const { toast } = useToast();

  const searchParams = new URLSearchParams(search);
  const preselectedTemplate = searchParams.get("template");

  const [selectedTemplate, setSelectedTemplate] = useState<number | null>(
    preselectedTemplate === "behavioral" ? 1 :
    preselectedTemplate === "technical" ? 2 : null
  );
  const [selectedPersona, setSelectedPersona] = useState<number>(1);
  const [role, setRole] = useState("");
  const [company, setCompany] = useState("");
  const [customQuestions, setCustomQuestions] = useState<string[]>([]);
  const [newQuestion, setNewQuestion] = useState("");

  const { data: templates, isLoading: templatesLoading } = useQuery<PracticeTemplate[]>({
    queryKey: ["/api/templates"],
  });

  const { data: personas, isLoading: personasLoading } = useQuery<InterviewerPersona[]>({
    queryKey: ["/api/personas"],
  });

  const displayTemplates = templates?.length ? templates : DEFAULT_TEMPLATES as PracticeTemplate[];
  const displayPersonas = personas?.length ? personas : DEFAULT_PERSONAS as InterviewerPersona[];

  const currentTemplate = displayTemplates.find((t) => t.id === selectedTemplate);

  const createSessionMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("POST", "/api/sessions", {
        templateId: selectedTemplate,
        personaId: selectedPersona,
        role: role || "General",
        company: company || "Generic",
        customQuestions,
      });
      return response.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/sessions"] });
      navigate(`/practice/${data.id}`);
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to create practice session. Please try again.",
        variant: "destructive",
      });
    },
  });

  const addQuestion = () => {
    if (newQuestion.trim()) {
      setCustomQuestions([...customQuestions, newQuestion.trim()]);
      setNewQuestion("");
    }
  };

  const removeQuestion = (index: number) => {
    setCustomQuestions(customQuestions.filter((_, i) => i !== index));
  };

  const handleStart = () => {
    if (!selectedTemplate) {
      toast({
        title: "Select a template",
        description: "Please choose a practice template to continue.",
        variant: "destructive",
      });
      return;
    }
    createSessionMutation.mutate();
  };

  return (
    <div className="flex flex-col gap-8 p-6">
      <div className="flex flex-col gap-2">
        <h1 className="text-2xl font-bold tracking-tight">Practice Setup</h1>
        <p className="text-muted-foreground">
          Configure your practice session to match your interview goals.
        </p>
      </div>

      <div className="grid gap-8 lg:grid-cols-3">
        <div className="flex flex-col gap-6 lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Choose a Template</CardTitle>
              <CardDescription>
                Select the type of interview you want to practice
              </CardDescription>
            </CardHeader>
            <CardContent>
              {templatesLoading ? (
                <div className="grid gap-4 sm:grid-cols-2">
                  {[1, 2, 3].map((i) => (
                    <Skeleton key={i} className="h-32" />
                  ))}
                </div>
              ) : (
                <div className="grid gap-4 sm:grid-cols-2">
                  {displayTemplates.map((template) => (
                    <button
                      key={template.id}
                      onClick={() => setSelectedTemplate(template.id)}
                      className={`relative flex flex-col items-start gap-2 rounded-lg border p-4 text-left transition-all hover-elevate ${
                        selectedTemplate === template.id
                          ? "border-primary bg-primary/5"
                          : ""
                      }`}
                      data-testid={`template-${template.id}`}
                    >
                      {selectedTemplate === template.id && (
                        <div className="absolute right-3 top-3">
                          <CheckCircle2 className="h-5 w-5 text-primary" />
                        </div>
                      )}
                      <div className="flex items-center gap-2">
                        <MessageSquare className="h-5 w-5 text-primary" />
                        <span className="font-medium">{template.name}</span>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {template.description}
                      </p>
                      <Badge variant="secondary" className="mt-1">
                        {template.difficulty}
                      </Badge>
                    </button>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Interview Details</CardTitle>
              <CardDescription>
                Customize the interview context (optional)
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid gap-6 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="role" className="flex items-center gap-2">
                    <User className="h-4 w-4 text-muted-foreground" />
                    Target Role
                  </Label>
                  <Input
                    id="role"
                    placeholder="e.g., Software Engineer"
                    value={role}
                    onChange={(e) => setRole(e.target.value)}
                    data-testid="input-role"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="company" className="flex items-center gap-2">
                    <Building2 className="h-4 w-4 text-muted-foreground" />
                    Target Company
                  </Label>
                  <Input
                    id="company"
                    placeholder="e.g., Google"
                    value={company}
                    onChange={(e) => setCompany(e.target.value)}
                    data-testid="input-company"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-muted-foreground" />
                  Interviewer Style
                </Label>
                {personasLoading ? (
                  <Skeleton className="h-10 w-full" />
                ) : (
                  <Select
                    value={selectedPersona.toString()}
                    onValueChange={(v) => setSelectedPersona(parseInt(v))}
                  >
                    <SelectTrigger data-testid="select-persona">
                      <SelectValue placeholder="Select interviewer style" />
                    </SelectTrigger>
                    <SelectContent>
                      {displayPersonas.map((persona) => (
                        <SelectItem key={persona.id} value={persona.id!.toString()}>
                          <div className="flex flex-col">
                            <span className="font-medium">{persona.name}</span>
                            <span className="text-xs text-muted-foreground">
                              {persona.style} - {persona.description}
                            </span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Custom Questions</CardTitle>
              <CardDescription>
                Add specific questions you want to practice (optional)
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-2">
                <Textarea
                  placeholder="Enter a custom question..."
                  value={newQuestion}
                  onChange={(e) => setNewQuestion(e.target.value)}
                  className="min-h-[60px] resize-none"
                  data-testid="input-custom-question"
                />
                <Button
                  variant="secondary"
                  onClick={addQuestion}
                  disabled={!newQuestion.trim()}
                  data-testid="button-add-question"
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>

              {customQuestions.length > 0 && (
                <div className="space-y-2">
                  {customQuestions.map((q, i) => (
                    <div
                      key={i}
                      className="flex items-start gap-2 rounded-md border bg-muted/50 p-3"
                    >
                      <span className="flex-1 text-sm">{q}</span>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6 shrink-0"
                        onClick={() => removeQuestion(i)}
                        data-testid={`button-remove-question-${i}`}
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="flex flex-col gap-6">
          <Card className="sticky top-6">
            <CardHeader>
              <CardTitle>Session Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <SummaryItem
                  label="Template"
                  value={currentTemplate?.name || "Not selected"}
                />
                <SummaryItem
                  label="Role"
                  value={role || "General"}
                />
                <SummaryItem
                  label="Company"
                  value={company || "Generic"}
                />
                <SummaryItem
                  label="Interviewer"
                  value={displayPersonas.find((p) => p.id === selectedPersona)?.name || "Alex"}
                />
                <SummaryItem
                  label="Custom Questions"
                  value={customQuestions.length.toString()}
                />
              </div>

              {currentTemplate && (
                <div className="space-y-2 border-t pt-4">
                  <span className="text-sm font-medium">Evaluation Criteria</span>
                  <div className="flex flex-wrap gap-1">
                    {currentTemplate.rubricItems.map((item, i) => (
                      <Badge key={i} variant="secondary" className="text-xs">
                        {item}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              <Button
                className="w-full gap-2"
                size="lg"
                onClick={handleStart}
                disabled={!selectedTemplate || createSessionMutation.isPending}
                data-testid="button-start-session"
              >
                <Play className="h-4 w-4" />
                {createSessionMutation.isPending ? "Starting..." : "Start Practice"}
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

function SummaryItem({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between text-sm">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-medium">{value}</span>
    </div>
  );
}
