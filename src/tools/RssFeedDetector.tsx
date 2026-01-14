import { useState, useCallback } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";

interface FeedResult {
  url: string;
  status: "found" | "not_found" | "error" | "pending";
  type?: string;
  title?: string;
}

const COMMON_FEED_PATHS = [
  "/feed",
  "/rss",
  "/feed.xml",
  "/rss.xml",
  "/atom.xml",
  "/feed/",
  "/rss/",
  "/index.xml",
  "/feeds/posts/default",
  "/blog/feed",
  "/blog/rss",
  "/blog/feed.xml",
  "/blog/rss.xml",
  "/blog/atom.xml",
  "/.rss",
  "/feed/rss",
  "/feed/atom",
  "/rss/feed",
  "/atom",
  "/rss2",
  "/feed.rss",
  "/feed.atom",
  "/posts.rss",
  "/articles.rss",
  "/news/feed",
  "/news/rss",
];

const CORS_PROXY = "https://api.allorigins.win/raw?url=";

function normalizeUrl(input: string): string {
  let url = input.trim();
  if (!url) return "";

  // Add protocol if missing
  if (!url.startsWith("http://") && !url.startsWith("https://")) {
    url = "https://" + url;
  }

  // Remove trailing slash for consistency
  url = url.replace(/\/+$/, "");

  try {
    const parsed = new URL(url);
    return `${parsed.protocol}//${parsed.host}`;
  } catch {
    return "";
  }
}

function isValidFeedContent(content: string): { isValid: boolean; type?: string; title?: string } {
  const trimmed = content.trim();

  // Check for XML declaration or root elements
  if (
    trimmed.includes("<rss") ||
    trimmed.includes("<channel>") ||
    trimmed.includes("<item>")
  ) {
    const titleMatch = trimmed.match(/<title[^>]*>([^<]+)<\/title>/i);
    return { isValid: true, type: "RSS", title: titleMatch?.[1] };
  }

  if (trimmed.includes("<feed") || trimmed.includes("xmlns:atom") || trimmed.includes("<entry>")) {
    const titleMatch = trimmed.match(/<title[^>]*>([^<]+)<\/title>/i);
    return { isValid: true, type: "Atom", title: titleMatch?.[1] };
  }

  // Check for JSON feed
  try {
    const json = JSON.parse(trimmed);
    if (json.version?.includes("jsonfeed") || json.feed_url || json.items) {
      return { isValid: true, type: "JSON Feed", title: json.title };
    }
  } catch {
    // Not JSON
  }

  return { isValid: false };
}

function extractFeedsFromHtml(html: string, baseUrl: string): FeedResult[] {
  const feeds: FeedResult[] = [];
  const linkRegex = /<link[^>]+>/gi;
  const matches = html.match(linkRegex) || [];

  for (const link of matches) {
    const typeMatch = link.match(/type=["']([^"']+)["']/i);
    const hrefMatch = link.match(/href=["']([^"']+)["']/i);
    const titleMatch = link.match(/title=["']([^"']+)["']/i);

    if (typeMatch && hrefMatch) {
      const type = typeMatch[1].toLowerCase();
      if (
        type.includes("rss") ||
        type.includes("atom") ||
        type.includes("feed") ||
        type.includes("xml")
      ) {
        let feedUrl = hrefMatch[1];

        // Handle relative URLs
        if (feedUrl.startsWith("/")) {
          feedUrl = baseUrl + feedUrl;
        } else if (!feedUrl.startsWith("http")) {
          feedUrl = baseUrl + "/" + feedUrl;
        }

        feeds.push({
          url: feedUrl,
          status: "found",
          type: type.includes("atom") ? "Atom" : "RSS",
          title: titleMatch?.[1],
        });
      }
    }
  }

  return feeds;
}

export default function RssFeedDetector() {
  const [url, setUrl] = useState("");
  const [isScanning, setIsScanning] = useState(false);
  const [results, setResults] = useState<FeedResult[]>([]);
  const [htmlFeeds, setHtmlFeeds] = useState<FeedResult[]>([]);
  const [scanProgress, setScanProgress] = useState(0);
  const [error, setError] = useState("");

  const scanForFeeds = useCallback(async () => {
    const baseUrl = normalizeUrl(url);
    if (!baseUrl) {
      setError("Please enter a valid URL");
      return;
    }

    setIsScanning(true);
    setError("");
    setResults([]);
    setHtmlFeeds([]);
    setScanProgress(0);

    // Initialize results with pending status
    const initialResults: FeedResult[] = COMMON_FEED_PATHS.map((path) => ({
      url: baseUrl + path,
      status: "pending" as const,
    }));
    setResults(initialResults);

    // First, try to fetch the main page and extract feed links from HTML
    try {
      const response = await fetch(CORS_PROXY + encodeURIComponent(baseUrl));
      if (response.ok) {
        const html = await response.text();
        const extractedFeeds = extractFeedsFromHtml(html, baseUrl);
        setHtmlFeeds(extractedFeeds);
      }
    } catch {
      // Ignore errors when fetching main page
    }

    // Check each common feed path
    const updatedResults = [...initialResults];

    for (let i = 0; i < COMMON_FEED_PATHS.length; i++) {
      const path = COMMON_FEED_PATHS[i];
      const feedUrl = baseUrl + path;

      try {
        const response = await fetch(
          CORS_PROXY + encodeURIComponent(feedUrl),
          { signal: AbortSignal.timeout(5000) }
        );

        if (response.ok) {
          const content = await response.text();
          const { isValid, type, title } = isValidFeedContent(content);

          updatedResults[i] = {
            url: feedUrl,
            status: isValid ? "found" : "not_found",
            type,
            title,
          };
        } else {
          updatedResults[i] = {
            url: feedUrl,
            status: "not_found",
          };
        }
      } catch {
        updatedResults[i] = {
          url: feedUrl,
          status: "error",
        };
      }

      setScanProgress(((i + 1) / COMMON_FEED_PATHS.length) * 100);
      setResults([...updatedResults]);
    }

    setIsScanning(false);
  }, [url]);

  const foundFeeds = results.filter((r) => r.status === "found");
  const allFoundFeeds = [...htmlFeeds, ...foundFeeds];

  // Deduplicate feeds by URL
  const uniqueFeeds = allFoundFeeds.filter(
    (feed, index, self) => index === self.findIndex((f) => f.url === feed.url)
  );

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  return (
    <div className="min-h-screen bg-background p-4 md:p-8">
      <div className="mx-auto max-w-3xl space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-3xl">RSS Feed Detector</CardTitle>
            <CardDescription>
              Enter a website URL to discover RSS/Atom feeds by checking common
              feed paths and parsing HTML link tags
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="url">Website URL</Label>
              <div className="flex gap-2">
                <Input
                  id="url"
                  type="text"
                  placeholder="e.g., example.com or https://example.com"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && !isScanning && scanForFeeds()}
                  className="flex-1"
                  disabled={isScanning}
                />
                <Button onClick={scanForFeeds} disabled={isScanning || !url.trim()}>
                  {isScanning ? "Scanning..." : "Detect Feeds"}
                </Button>
              </div>
              {error && <p className="text-sm text-destructive">{error}</p>}
            </div>

            {isScanning && (
              <div className="space-y-2 animate-in fade-in duration-300">
                <div className="flex justify-between text-sm text-muted-foreground">
                  <span>Scanning feed paths...</span>
                  <span>{Math.round(scanProgress)}%</span>
                </div>
                <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
                  <div
                    className="h-full bg-primary transition-all duration-300"
                    style={{ width: `${scanProgress}%` }}
                  />
                </div>
              </div>
            )}

            {uniqueFeeds.length > 0 && (
              <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
                <Card className="border-green-500/20 bg-green-500/5">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-lg text-green-600 dark:text-green-400">
                      Found {uniqueFeeds.length} Feed{uniqueFeeds.length !== 1 ? "s" : ""}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {uniqueFeeds.map((feed, index) => (
                      <div
                        key={feed.url}
                        className="flex items-start justify-between gap-2 rounded-md border bg-background p-3"
                      >
                        <div className="min-w-0 flex-1 space-y-1">
                          {feed.title && (
                            <p className="font-medium text-sm truncate">{feed.title}</p>
                          )}
                          <p className="text-xs text-muted-foreground break-all">
                            {feed.url}
                          </p>
                          {feed.type && (
                            <span className="inline-block rounded-full bg-primary/10 px-2 py-0.5 text-xs text-primary">
                              {feed.type}
                            </span>
                          )}
                        </div>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => copyToClipboard(feed.url)}
                          className="shrink-0"
                        >
                          Copy
                        </Button>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              </div>
            )}

            {!isScanning && results.length > 0 && uniqueFeeds.length === 0 && (
              <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
                <Card className="border-orange-500/20 bg-orange-500/5">
                  <CardContent className="pt-6">
                    <p className="text-center text-muted-foreground">
                      No RSS or Atom feeds found at common paths for this website.
                      <br />
                      <span className="text-sm">
                        The site may not have a public feed, or it might be at an unusual location.
                      </span>
                    </p>
                  </CardContent>
                </Card>
              </div>
            )}

            {!isScanning && results.length > 0 && (
              <details className="text-sm">
                <summary className="cursor-pointer text-muted-foreground hover:text-foreground">
                  View all checked paths ({results.length})
                </summary>
                <div className="mt-3 max-h-64 overflow-y-auto rounded-md border bg-muted/30 p-3">
                  <div className="space-y-1 font-mono text-xs">
                    {results.map((result) => (
                      <div
                        key={result.url}
                        className={`flex items-center gap-2 ${
                          result.status === "found"
                            ? "text-green-600 dark:text-green-400"
                            : result.status === "error"
                              ? "text-orange-600 dark:text-orange-400"
                              : "text-muted-foreground"
                        }`}
                      >
                        <span className="w-4">
                          {result.status === "found" && "✓"}
                          {result.status === "not_found" && "✗"}
                          {result.status === "error" && "⚠"}
                          {result.status === "pending" && "○"}
                        </span>
                        <span className="truncate">{result.url}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </details>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Common RSS Feed Locations
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-muted-foreground leading-relaxed">
              This tool checks common feed paths including:{" "}
              <code className="bg-muted px-1 rounded">/feed</code>,{" "}
              <code className="bg-muted px-1 rounded">/rss</code>,{" "}
              <code className="bg-muted px-1 rounded">/feed.xml</code>,{" "}
              <code className="bg-muted px-1 rounded">/atom.xml</code>,{" "}
              and {COMMON_FEED_PATHS.length - 4} more variations. It also parses
              the HTML for{" "}
              <code className="bg-muted px-1 rounded">
                {"<link rel=\"alternate\" type=\"application/rss+xml\">"}
              </code>{" "}
              tags.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
