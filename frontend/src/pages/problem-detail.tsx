import { useQuery, useMutation } from "@tanstack/react-query";
import { Link, useLocation, useParams } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  ArrowLeft,
  Edit,
  Trash2,
  Wrench,
  Calendar,
  User,
  Clock,
  Loader2,
} from "lucide-react";
import { useAuth } from "@/lib/auth";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { format } from "date-fns";
import {Problem, SafeUser} from "@/shared/schema";

interface ProblemWithCreator extends Problem {
  creator?: SafeUser;
}

export default function ProblemDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [, navigate] = useLocation();
  const { canManage } = useAuth();
  const { toast } = useToast();

  const { data: problem, isLoading } = useQuery<ProblemWithCreator>({
    queryKey: ["/api/problems", id],
    queryFn: async () => {
      const response = await fetch(`/api/problems/${id}`);
      if (!response.ok) throw new Error("Failed to fetch problem");
      return response.json();
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async () => {
      await apiRequest("DELETE", `/api/problems/${id}`);
    },
    onSuccess: () => {
      toast({
        title: "Problem deleted",
        description: "The problem has been successfully removed.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/problems"] });
      navigate("/problems");
    },
    onError: () => {
      toast({
        title: "Delete failed",
        description: "Failed to delete the problem. Please try again.",
        variant: "destructive",
      });
    },
  });

  if (isLoading) {
    return (
      <div className="p-6 max-w-4xl mx-auto space-y-6">
        <div className="flex items-center gap-4">
          <Skeleton className="h-9 w-9" />
          <Skeleton className="h-8 w-64" />
        </div>
        <Card>
          <CardContent className="p-6 space-y-6">
            <Skeleton className="h-6 w-3/4" />
            <Skeleton className="h-32 w-full" />
            <Skeleton className="h-6 w-1/2" />
            <Skeleton className="h-24 w-full" />
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!problem) {
    return (
      <div className="p-6 max-w-4xl mx-auto">
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <h2 className="text-xl font-medium mb-2">Problem not found</h2>
            <p className="text-muted-foreground mb-4">
              The problem you're looking for doesn't exist or has been removed.
            </p>
            <Button asChild>
              <Link href="/problems">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Problems
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-4">
          <Button asChild variant="ghost" size="icon" data-testid="button-back">
            <Link href="/problems">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <h1 className="text-2xl font-medium" data-testid="text-problem-title">
            Problem Details
          </h1>
        </div>
        {canManage && (
          <div className="flex gap-2">
            <Button asChild variant="outline" data-testid="button-edit">
              <Link href={`/problems/${id}/edit`}>
                <Edit className="h-4 w-4 mr-2" />
                Edit
              </Link>
            </Button>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="destructive" data-testid="button-delete">
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Delete Problem</AlertDialogTitle>
                  <AlertDialogDescription>
                    Are you sure you want to delete this problem? This action cannot be undone.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={() => deleteMutation.mutate()}
                    className="bg-destructive text-destructive-foreground"
                  >
                    {deleteMutation.isPending && (
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    )}
                    Delete
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        )}
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-xl" data-testid="text-problem-description">
            {problem.problem}
          </CardTitle>
          <div className="flex items-center gap-4 flex-wrap text-sm text-muted-foreground mt-2">
            {problem.machinePart && (
              <div className="flex items-center gap-1">
                <Wrench className="h-4 w-4" />
                <span data-testid="text-machine-part">{problem.machinePart}</span>
              </div>
            )}
            <div className="flex items-center gap-1">
              <Calendar className="h-4 w-4" />
              <span data-testid="text-date">
                {format(new Date(problem.date), "MMMM d, yyyy")}
              </span>
            </div>
            {problem.creator && (
              <div className="flex items-center gap-1">
                <User className="h-4 w-4" />
                <span data-testid="text-creator">{problem.creator.username}</span>
              </div>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <div>
            <h3 className="text-sm font-medium text-muted-foreground mb-2">
              Solution
            </h3>
            <div 
              className="prose prose-sm dark:prose-invert max-w-none"
              data-testid="text-solution"
            >
              {problem.solution.split("\n").map((line, i) => (
                <p key={i}>{line}</p>
              ))}
            </div>
          </div>

          {problem.tags && problem.tags.length > 0 && (
            <div>
              <h3 className="text-sm font-medium text-muted-foreground mb-2">
                Tags
              </h3>
              <div className="flex gap-2 flex-wrap">
                {problem.tags.map((tag) => (
                  <Badge key={tag} variant="secondary" data-testid={`badge-tag-${tag}`}>
                    {tag}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          <div className="pt-4 border-t">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Clock className="h-4 w-4" />
              <span>
                Last updated: {format(new Date(problem.updatedAt), "MMMM d, yyyy 'at' h:mm a")}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
