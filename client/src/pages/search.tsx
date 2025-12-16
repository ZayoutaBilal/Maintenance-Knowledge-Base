import {useState} from "react";
import {useMutation} from "@tanstack/react-query";
import {Link} from "wouter";
import {Card, CardContent} from "@/components/ui/card";
import {Badge} from "@/components/ui/badge";
import {Button} from "@/components/ui/button";
import {Input} from "@/components/ui/input";
import {Clock, FileText, Loader2, Search, Sparkles, Wrench,} from "lucide-react";
import {apiRequest} from "@/lib/queryClient";
import type {Problem} from "@shared/schema";
import {formatDistanceToNow} from "date-fns";

interface SearchResult extends Problem {
  similarity?: number;
}

function SearchResultCard({ problem }: { problem: SearchResult }) {
  const timeAgo = formatDistanceToNow(new Date(problem.date), { addSuffix: true });

  return (
    <Link href={`/problems/${problem.id}`}>
      <Card className="hover-elevate cursor-pointer">
        <CardContent className="p-4">
          <div className="flex flex-col gap-2">
            <div className="flex items-start justify-between gap-4">
              <h3 
                className="font-medium line-clamp-2"
                data-testid={`text-result-title-${problem.id}`}
              >
                {problem.problem}
              </h3>
              {problem.similarity !== undefined && (
                  <Badge
                      variant="outline"
                      size="sm"
                      className={`shrink-0 ${
                          problem.similarity >= 0.8
                              ? "border-green-500 text-green-500"
                              : problem.similarity >= 0.6
                                  ? "border-yellow-500 text-yellow-500"
                                  : "border-red-500 text-red-500"
                      }`}
                  >
                    {Math.round(problem.similarity * 100)}% match
                  </Badge>

              )}
            </div>
            <p className="text-sm text-muted-foreground line-clamp-3">
              {problem.solution}
            </p>
            <div className="flex items-center gap-2 flex-wrap mt-1">
              {problem.machinePart && (
                <Badge variant="secondary" size="sm">
                  <Wrench className="h-3 w-3 mr-1" />
                  {problem.machinePart}
                </Badge>
              )}
              {problem.tags?.slice(0, 3).map((tag) => (
                <Badge key={tag} variant="outline" size="sm">
                  {tag}
                </Badge>
              ))}
            </div>
            <div className="flex items-center gap-2 text-xs text-muted-foreground mt-2 pt-2 border-t">
              <Clock className="h-3 w-3" />
              <span>{timeAgo}</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}

export default function SearchPage() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [hasSearched, setHasSearched] = useState(false);

  const searchMutation = useMutation({
    mutationFn: async (searchQuery: string) => {
      const response = await apiRequest("POST", "/api/problems/search", { query: searchQuery });
      return await response.json();
    },
    onSuccess: (data) => {
      setResults(data);
      setHasSearched(true);
    },
  });

  const handleSearch = () => {
    if (query.trim()) {
      searchMutation.mutate(query.trim());
    }
  };

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-medium" data-testid="text-page-title">
          Semantic Search
        </h1>
        <p className="text-muted-foreground mt-1">
          Describe your problem in natural language to find relevant solutions
        </p>
      </div>

      <Card>
        <CardContent className="p-6">
          <div className="flex flex-col gap-4">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Sparkles className="h-4 w-4" />
              <span>AI-powered search understands English and French</span>
            </div>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                <Input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Describe the problem you're looking for..."
                  className="pl-10 h-14 text-base"
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      handleSearch();
                    }
                  }}
                  data-testid="input-search"
                />
              </div>
              <Button
                onClick={handleSearch}
                disabled={!query.trim() || searchMutation.isPending}
                className="h-14 px-6"
                data-testid="button-search"
              >
                {searchMutation.isPending ? (
                  <Loader2 className="h-5 w-5 animate-spin" />
                ) : (
                  <>
                    <Search className="h-5 w-5 mr-2" />
                    Search
                  </>
                )}
              </Button>
            </div>
            <div className="text-sm text-muted-foreground">
              <span className="font-medium">Examples:</span>
              <ul className="mt-1 space-y-1">
                <li>• "The conveyor belt keeps stopping unexpectedly"</li>
                <li>• "La pompe hydraulique fait du bruit"</li>
                <li>• "Motor overheating during peak hours"</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>

      {searchMutation.isPending && (
        <div className="flex items-center justify-center py-12">
          <div className="flex flex-col items-center gap-4">
            <Loader2 className="h-10 w-10 animate-spin text-muted-foreground" />
            <p className="text-muted-foreground">Searching knowledge base...</p>
          </div>
        </div>
      )}

      {hasSearched && !searchMutation.isPending && (
        <div className="space-y-4">
          <div className="flex items-center justify-between gap-4">
            <h2 className="text-xl font-medium">
              Results
              {results.length > 0 && (
                <span className="ml-2 text-muted-foreground font-normal">
                  ({results.length} found)
                </span>
              )}
            </h2>
          </div>

          {results.length > 0 ? (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {results.map((problem) => (
                <SearchResultCard key={problem.id} problem={problem} />
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-16 text-center">
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-muted mb-4">
                  <FileText className="h-8 w-8 text-muted-foreground" />
                </div>
                <h3 className="text-lg font-medium mb-2">No results found</h3>
                <p className="text-muted-foreground max-w-md">
                  Try rephrasing your query or using different keywords. The AI search works best with detailed descriptions.
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {!hasSearched && !searchMutation.isPending && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <div className="flex h-20 w-20 items-center justify-center rounded-full bg-primary/10 mb-6">
              <Search className="h-10 w-10 text-primary" />
            </div>
            <h3 className="text-xl font-medium mb-2">Start Your Search</h3>
            <p className="text-muted-foreground max-w-md">
              Enter a description of your problem above. Our AI will find the most relevant solutions from the knowledge base.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
