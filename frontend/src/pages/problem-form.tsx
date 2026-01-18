import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Link, useLocation, useParams } from "wouter";
import { z } from "zod";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from "@/components/ui/form";
import { ArrowLeft, Loader2, Plus, X } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import type { Problem } from "@/shared/schema";

const problemFormSchema = z.object({
  problem: z.string().min(1, "Problem description is required"),
  solution: z.string().min(1, "Solution is required"),
  machinePart: z.string().optional(),
  tags: z.array(z.string()).optional(),
});

type ProblemFormData = z.infer<typeof problemFormSchema>;

export default function ProblemFormPage() {
  const { id } = useParams<{ id: string }>();
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const isEditing = !!id;
  const [tagInput, setTagInput] = useState("");

  const { data: existingProblem, isLoading: loadingProblem } = useQuery<Problem>({
    queryKey: ["/api/problems", id],
    queryFn: async () => {
      const response = await fetch(`/api/problems/${id}`);
      if (!response.ok) throw new Error("Failed to fetch problem");
      return response.json();
    },
    enabled: isEditing,
  });

  const form = useForm<ProblemFormData>({
    resolver: zodResolver(problemFormSchema),
    defaultValues: {
      problem: "",
      solution: "",
      machinePart: "",
      tags: [],
    },
  });

  useEffect(() => {
    if (existingProblem) {
      form.reset({
        problem: existingProblem.problem,
        solution: existingProblem.solution,
        machinePart: existingProblem.machinePart || "",
        tags: existingProblem.tags || [],
      });
    }
  }, [existingProblem, form]);

  const createMutation = useMutation({
    mutationFn: async (data: ProblemFormData) => {
      return apiRequest("POST", "/api/problems", data);
    },
    onSuccess: () => {
      toast({
        title: "Problem created",
        description: "The problem has been successfully added.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/problems"] });
      queryClient.invalidateQueries({ queryKey: ["/api/stats"] });
      navigate("/problems");
    },
    onError: () => {
      toast({
        title: "Creation failed",
        description: "Failed to create the problem. Please try again.",
        variant: "destructive",
      });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async (data: ProblemFormData) => {
      return apiRequest("PUT", `/api/problems/${id}`, data);
    },
    onSuccess: () => {
      toast({
        title: "Problem updated",
        description: "The problem has been successfully updated.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/problems"] });
      queryClient.invalidateQueries({ queryKey: ["/api/problems", id] });
      navigate(`/problems/${id}`);
    },
    onError: () => {
      toast({
        title: "Update failed",
        description: "Failed to update the problem. Please try again.",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: ProblemFormData) => {
    if (isEditing) {
      updateMutation.mutate(data);
    } else {
      createMutation.mutate(data);
    }
  };

  const addTag = () => {
    const trimmedTag = tagInput.trim();
    if (trimmedTag && !form.getValues("tags")?.includes(trimmedTag)) {
      const currentTags = form.getValues("tags") || [];
      form.setValue("tags", [...currentTags, trimmedTag]);
      setTagInput("");
    }
  };

  const removeTag = (tagToRemove: string) => {
    const currentTags = form.getValues("tags") || [];
    form.setValue(
      "tags",
      currentTags.filter((tag) => tag !== tagToRemove)
    );
  };

  const isSubmitting = createMutation.isPending || updateMutation.isPending;

  if (isEditing && loadingProblem) {
    return (
      <div className="p-6 max-w-3xl mx-auto">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-3xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <Button 
          asChild 
          variant="ghost" 
          size="icon" 
          data-testid="button-back"
        >
          <Link href={isEditing ? `/problems/${id}` : "/problems"}>
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <h1 className="text-2xl font-medium" data-testid="text-page-title">
          {isEditing ? "Edit Problem" : "Add Problem"}
        </h1>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{isEditing ? "Edit Problem" : "New Problem"}</CardTitle>
          <CardDescription>
            {isEditing
              ? "Update the problem details and solution."
              : "Document a new maintenance problem and its solution."}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <FormField
                control={form.control}
                name="problem"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Problem Description</FormLabel>
                    <FormControl>
                      <Textarea
                        {...field}
                        placeholder="Describe the problem in detail..."
                        className="min-h-32 resize-y"
                        data-testid="input-problem"
                      />
                    </FormControl>
                    <FormDescription>
                      Provide a clear description of the maintenance issue.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="solution"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Solution</FormLabel>
                    <FormControl>
                      <Textarea
                        {...field}
                        placeholder="Describe the solution step by step..."
                        className="min-h-32 resize-y"
                        data-testid="input-solution"
                      />
                    </FormControl>
                    <FormDescription>
                      Document how this problem was resolved.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="machinePart"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Machine Part (Optional)</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        placeholder="e.g., Conveyor Belt, Hydraulic Pump"
                        data-testid="input-machine-part"
                      />
                    </FormControl>
                    <FormDescription>
                      Specify the machine or component involved.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="tags"
                render={() => (
                  <FormItem>
                    <FormLabel>Tags (Optional)</FormLabel>
                    <div className="flex gap-2">
                      <Input
                        value={tagInput}
                        onChange={(e) => setTagInput(e.target.value)}
                        placeholder="Add a tag..."
                        onKeyDown={(e) => {
                          if (e.key === "Enter") {
                            e.preventDefault();
                            addTag();
                          }
                        }}
                        data-testid="input-tag"
                      />
                      <Button
                        type="button"
                        variant="outline"
                        onClick={addTag}
                        data-testid="button-add-tag"
                      >
                        <Plus className="h-4 w-4" />
                      </Button>
                    </div>
                    {form.watch("tags")?.length > 0 && (
                      <div className="flex gap-2 flex-wrap mt-2">
                        {form.watch("tags")?.map((tag) => (
                          <Badge
                            key={tag}
                            variant="secondary"
                            className="cursor-pointer"
                            onClick={() => removeTag(tag)}
                          >
                            {tag}
                            <X className="h-3 w-3 ml-1" />
                          </Badge>
                        ))}
                      </div>
                    )}
                    <FormDescription>
                      Add keywords to help categorize this problem.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="flex gap-4 pt-4">
                <Button
                  type="submit"
                  disabled={isSubmitting}
                  data-testid="button-submit"
                >
                  {isSubmitting && (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  )}
                  {isEditing ? "Update Problem" : "Add Problem"}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => navigate(isEditing ? `/problems/${id}` : "/problems")}
                  data-testid="button-cancel"
                >
                  Cancel
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
