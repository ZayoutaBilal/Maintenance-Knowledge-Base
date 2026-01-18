import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  FileText, 
  Clock, 
  Tag, 
  Wrench,
  Plus,
  ArrowRight,
  Search,
} from "lucide-react";
import { useAuth } from "@/lib/auth";
import { formatDistanceToNow } from "date-fns";
import {Problem} from "@/shared/schema.ts";

interface DashboardStats {
  totalProblems: number;
  recentProblems: number;
  totalTags: number;
  totalMachineParts: number;
}

function StatCard({
  title,
  value,
  icon: Icon,
  description,
  testId,
}: {
  title: string;
  value: number | string;
  icon: typeof FileText;
  description: string;
  testId: string;
}) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between gap-2 pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          {title}
        </CardTitle>
        <Icon className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <div className="text-3xl font-medium" data-testid={testId}>
          {value}
        </div>
        <p className="text-sm text-muted-foreground mt-1">{description}</p>
      </CardContent>
    </Card>
  );
}

function RecentProblemCard({ problem }: { problem: Problem }) {
  const timeAgo = formatDistanceToNow(new Date(problem.date), { addSuffix: true });
  
  return (
    <Link href={`/problems/${problem.id}`}>
      <Card className="hover-elevate cursor-pointer">
        <CardContent className="p-4">
          <div className="flex flex-col gap-2">
            <h3 
              className="font-medium line-clamp-1"
              data-testid={`text-problem-title-${problem.id}`}
            >
              {problem.problem}
            </h3>
            <p className="text-sm text-muted-foreground line-clamp-2">
              {problem.solution}
            </p>
            <div className="flex items-center gap-2 flex-wrap mt-1">
              {problem.machinePart && (
                <Badge variant="secondary" size="sm">
                  <Wrench className="h-3 w-3 mr-1" />
                  {problem.machinePart}
                </Badge>
              )}
              {problem.tags?.slice(0, 2).map((tag) => (
                <Badge key={tag} variant="outline" size="sm">
                  {tag}
                </Badge>
              ))}
              {problem.tags && problem.tags.length > 2 && (
                <Badge variant="outline" size="sm">
                  +{problem.tags.length - 2}
                </Badge>
              )}
            </div>
            <div className="flex items-center gap-2 text-xs text-muted-foreground mt-1">
              <Clock className="h-3 w-3" />
              <span>{timeAgo}</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}

function EmptyState() {
  const { canEdit } = useAuth();
  
  return (
    <Card className="col-span-full">
      <CardContent className="flex flex-col items-center justify-center py-16 text-center">
        <div className="flex h-20 w-20 items-center justify-center rounded-full bg-muted mb-6">
          <FileText className="h-10 w-10 text-muted-foreground" />
        </div>
        <h3 className="text-xl font-medium mb-2">No problems yet</h3>
        <p className="text-muted-foreground mb-6 max-w-md">
          Start building your maintenance knowledge base by adding problems and their solutions.
        </p>
        {canEdit && (
          <Button asChild data-testid="button-add-first-problem">
            <Link to="/problems/new">
              <Plus className="h-4 w-4 mr-2" />
              Add First Problem
            </Link>
          </Button>
        )}
      </CardContent>
    </Card>
  );
}

export default function DashboardPage() {
  const { user, canEdit } = useAuth();
  
  const { data: stats, isLoading: statsLoading } = useQuery<DashboardStats>({
    queryKey: ["/api/stats"],
  });

  const { data: problemsData, isLoading: problemsLoading } = useQuery<{
    problems: Problem[];
    total: number;
    page: number;
    totalPages: number;
  }>({
    queryKey: ["/api/problems", { limit: 6 }],
  });

  const recentProblems = problemsData?.problems;

  return (
    <div className="p-6 space-y-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-medium" data-testid="text-page-title">
            Dashboard
          </h1>
          <p className="text-muted-foreground mt-1">
            Welcome back, {user?.username}
          </p>
        </div>
        <div className="flex gap-2 flex-wrap">
          <Button asChild variant="outline" data-testid="button-search">
            <Link href="/search">
              <Search className="h-4 w-4 mr-2" />
              Search
            </Link>
          </Button>
          {canEdit && (
            <Button asChild data-testid="button-add-problem">
              <Link to="/problems/new">
                <Plus className="h-4 w-4 mr-2" />
                Add Problem
              </Link>
            </Button>
          )}
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {statsLoading ? (
          <>
            {[1, 2, 3, 4].map((i) => (
              <Card key={i}>
                <CardHeader className="pb-2">
                  <Skeleton className="h-4 w-24" />
                </CardHeader>
                <CardContent>
                  <Skeleton className="h-8 w-16 mb-2" />
                  <Skeleton className="h-3 w-32" />
                </CardContent>
              </Card>
            ))}
          </>
        ) : (
          <>
            <StatCard
              title="Total Problems"
              value={stats?.totalProblems || 0}
              icon={FileText}
              description="Documented issues"
              testId="stat-total-problems"
            />
            <StatCard
              title="Recent (7 days)"
              value={stats?.recentProblems || 0}
              icon={Clock}
              description="New this week"
              testId="stat-recent-problems"
            />
            <StatCard
              title="Tags"
              value={stats?.totalTags || 0}
              icon={Tag}
              description="Categories"
              testId="stat-total-tags"
            />
            <StatCard
              title="Machine Parts"
              value={stats?.totalMachineParts || 0}
              icon={Wrench}
              description="Components tracked"
              testId="stat-machine-parts"
            />
          </>
        )}
      </div>

      <div className="space-y-4">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-medium">Recent Problems</h2>
            <p className="text-sm text-muted-foreground">
              Latest documented issues and solutions
            </p>
          </div>
          <Button asChild variant="ghost" size="sm" data-testid="link-view-all">
            <Link href="/problems">
              View all
              <ArrowRight className="h-4 w-4 ml-1" />
            </Link>
          </Button>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {problemsLoading ? (
            <>
              {[1, 2, 3].map((i) => (
                <Card key={i}>
                  <CardContent className="p-4">
                    <Skeleton className="h-5 w-3/4 mb-2" />
                    <Skeleton className="h-4 w-full mb-1" />
                    <Skeleton className="h-4 w-2/3 mb-3" />
                    <div className="flex gap-2">
                      <Skeleton className="h-5 w-16" />
                      <Skeleton className="h-5 w-12" />
                    </div>
                  </CardContent>
                </Card>
              ))}
            </>
          ) : recentProblems && recentProblems.length > 0 ? (
            recentProblems.slice(0, 6).map((problem) => (
              <RecentProblemCard key={problem.id} problem={problem} />
            ))
          ) : (
            <EmptyState />
          )}
        </div>
      </div>
    </div>
  );
}
