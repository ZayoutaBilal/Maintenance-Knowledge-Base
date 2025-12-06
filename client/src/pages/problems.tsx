import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import {
  FileText,
  Plus,
  Search,
  Filter,
  Wrench,
  Clock,
  X,
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { useAuth } from "@/lib/auth";
import type { Problem } from "@shared/schema";
import { format, formatDistanceToNow } from "date-fns";

const ITEMS_PER_PAGE = 12;

function ProblemCard({ problem }: { problem: Problem }) {
  const timeAgo = formatDistanceToNow(new Date(problem.date), { addSuffix: true });

  return (
    <Link href={`/problems/${problem.id}`}>
      <Card className="hover-elevate cursor-pointer h-full">
        <CardContent className="p-4 flex flex-col h-full">
          <h3 
            className="font-medium line-clamp-2 mb-2"
            data-testid={`text-problem-title-${problem.id}`}
          >
            {problem.problem}
          </h3>
          <p className="text-sm text-muted-foreground line-clamp-2 flex-1 mb-3">
            {problem.solution}
          </p>
          <div className="flex items-center gap-2 flex-wrap">
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
          <div className="flex items-center gap-2 text-xs text-muted-foreground mt-3 pt-3 border-t">
            <Clock className="h-3 w-3" />
            <span>{timeAgo}</span>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}

function EmptyState({ hasFilters }: { hasFilters: boolean }) {
  const { canEdit } = useAuth();

  if (hasFilters) {
    return (
      <Card className="col-span-full">
        <CardContent className="flex flex-col items-center justify-center py-16 text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-muted mb-4">
            <Search className="h-8 w-8 text-muted-foreground" />
          </div>
          <h3 className="text-lg font-medium mb-2">No matching problems</h3>
          <p className="text-muted-foreground max-w-md">
            Try adjusting your filters or search terms to find what you're looking for.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="col-span-full">
      <CardContent className="flex flex-col items-center justify-center py-16 text-center">
        <div className="flex h-20 w-20 items-center justify-center rounded-full bg-muted mb-6">
          <FileText className="h-10 w-10 text-muted-foreground" />
        </div>
        <h3 className="text-xl font-medium mb-2">No problems documented</h3>
        <p className="text-muted-foreground mb-6 max-w-md">
          Start building your knowledge base by documenting maintenance problems and their solutions.
        </p>
        {canEdit && (
          <Button asChild data-testid="button-add-first-problem">
            <Link href="/problems/new">
              <Plus className="h-4 w-4 mr-2" />
              Add First Problem
            </Link>
          </Button>
        )}
      </CardContent>
    </Card>
  );
}

export default function ProblemsPage() {
  const { canEdit } = useAuth();
  const [page, setPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState("");
  const [machinePart, setMachinePart] = useState<string>("");
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [startDate, setStartDate] = useState<Date | undefined>();
  const [endDate, setEndDate] = useState<Date | undefined>();

  const buildQueryString = () => {
    const params = new URLSearchParams();
    params.set("page", page.toString());
    params.set("limit", ITEMS_PER_PAGE.toString());
    if (searchQuery) params.set("search", searchQuery);
    if (machinePart) params.set("machinePart", machinePart);
    if (selectedTags.length > 0) params.set("tags", selectedTags.join(","));
    if (startDate) params.set("startDate", startDate.toISOString());
    if (endDate) params.set("endDate", endDate.toISOString());
    return params.toString();
  };

  const { data, isLoading } = useQuery<{
    problems: Problem[];
    total: number;
    page: number;
    totalPages: number;
  }>({
    queryKey: ["/api/problems", { page, searchQuery, machinePart, selectedTags, startDate, endDate }],
    queryFn: async () => {
      const response = await fetch(`/api/problems?${buildQueryString()}`);
      if (!response.ok) throw new Error("Failed to fetch problems");
      return response.json();
    },
  });

  const { data: filterOptions } = useQuery<{
    machineParts: string[];
    tags: string[];
  }>({
    queryKey: ["/api/problems/filters"],
  });

  const hasFilters = !!(searchQuery || machinePart || selectedTags.length > 0 || startDate || endDate);

  const clearFilters = () => {
    setSearchQuery("");
    setMachinePart("");
    setSelectedTags([]);
    setStartDate(undefined);
    setEndDate(undefined);
    setPage(1);
  };

  const totalPages = data?.totalPages || 1;

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-medium" data-testid="text-page-title">
            Problems
          </h1>
          <p className="text-muted-foreground mt-1">
            Browse and manage documented maintenance issues
          </p>
        </div>
        {canEdit && (
          <Button asChild data-testid="button-add-problem">
            <Link href="/problems/new">
              <Plus className="h-4 w-4 mr-2" />
              Add Problem
            </Link>
          </Button>
        )}
      </div>

      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search problems..."
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setPage(1);
                }}
                className="pl-9"
                data-testid="input-search"
              />
            </div>

            <div className="flex gap-2 flex-wrap">
              <Select 
                value={machinePart} 
                onValueChange={(v) => { setMachinePart(v === "all" ? "" : v); setPage(1); }}
              >
                <SelectTrigger className="w-[180px]" data-testid="select-machine-part">
                  <Wrench className="h-4 w-4 mr-2" />
                  <SelectValue placeholder="Machine Part" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Parts</SelectItem>
                  {filterOptions?.machineParts?.map((part) => (
                    <SelectItem key={part} value={part}>
                      {part}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" data-testid="button-date-filter">
                    <CalendarIcon className="h-4 w-4 mr-2" />
                    {startDate && endDate
                      ? `${format(startDate, "MMM d")} - ${format(endDate, "MMM d")}`
                      : startDate
                        ? `From ${format(startDate, "MMM d")}`
                        : "Date Range"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <div className="flex">
                    <div className="p-3 border-r">
                      <p className="text-sm font-medium mb-2">Start Date</p>
                      <Calendar
                        mode="single"
                        selected={startDate}
                        onSelect={(d) => { setStartDate(d); setPage(1); }}
                        initialFocus
                      />
                    </div>
                    <div className="p-3">
                      <p className="text-sm font-medium mb-2">End Date</p>
                      <Calendar
                        mode="single"
                        selected={endDate}
                        onSelect={(d) => { setEndDate(d); setPage(1); }}
                        disabled={(date) => startDate ? date < startDate : false}
                      />
                    </div>
                  </div>
                </PopoverContent>
              </Popover>

              {hasFilters && (
                <Button
                  variant="ghost"
                  onClick={clearFilters}
                  data-testid="button-clear-filters"
                >
                  <X className="h-4 w-4 mr-1" />
                  Clear
                </Button>
              )}
            </div>
          </div>

          {selectedTags.length > 0 && (
            <div className="flex gap-2 flex-wrap mt-3 pt-3 border-t">
              <span className="text-sm text-muted-foreground">Tags:</span>
              {selectedTags.map((tag) => (
                <Badge
                  key={tag}
                  variant="secondary"
                  className="cursor-pointer"
                  onClick={() => {
                    setSelectedTags(selectedTags.filter((t) => t !== tag));
                    setPage(1);
                  }}
                >
                  {tag}
                  <X className="h-3 w-3 ml-1" />
                </Badge>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {isLoading ? (
          <>
            {Array.from({ length: 8 }).map((_, i) => (
              <Card key={i}>
                <CardContent className="p-4">
                  <Skeleton className="h-5 w-3/4 mb-2" />
                  <Skeleton className="h-4 w-full mb-1" />
                  <Skeleton className="h-4 w-2/3 mb-4" />
                  <div className="flex gap-2">
                    <Skeleton className="h-5 w-16" />
                    <Skeleton className="h-5 w-12" />
                  </div>
                </CardContent>
              </Card>
            ))}
          </>
        ) : data?.problems && data.problems.length > 0 ? (
          data.problems.map((problem) => (
            <ProblemCard key={problem.id} problem={problem} />
          ))
        ) : (
          <EmptyState hasFilters={hasFilters} />
        )}
      </div>

      {data && data.totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <Button
            variant="outline"
            size="icon"
            onClick={() => setPage(Math.max(1, page - 1))}
            disabled={page === 1}
            data-testid="button-prev-page"
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <div className="flex items-center gap-1 px-4">
            <span className="text-sm" data-testid="text-pagination">
              Page {page} of {totalPages}
            </span>
          </div>
          <Button
            variant="outline"
            size="icon"
            onClick={() => setPage(Math.min(totalPages, page + 1))}
            disabled={page === totalPages}
            data-testid="button-next-page"
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      )}
    </div>
  );
}
