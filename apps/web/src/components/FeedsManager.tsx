"use client";

import { useState, useEffect, type ChangeEvent, type KeyboardEvent, type FormEvent } from "react";
import { FeedIcon } from "@/src/lib/feed-icon";
import { formatDateTime } from "@/src/lib/date-utils";
import FeedStatusBadge from "./FeedStatusBadge";
import FeedDetails from "./FeedDetails";
import { useToast } from "@/src/hooks/useToast";
import { ToastContainer } from "./Toast";

interface Feed {
  id: string;
  title: string;
  url: string;
  siteUrl?: string;
  refreshIntervalMinutes: number;
  lastFetchedAt?: string;
  isActive: boolean;
  status?: 'active' | 'degraded' | 'blocked' | 'unreachable' | 'paused';
  consecutiveFailures?: number;
  lastError?: string | null;
  _count?: {
    items: number;
  };
}

export default function FeedsManager() {
  const [feeds, setFeeds] = useState<Feed[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Feed | null>(null);
  const [showDiscover, setShowDiscover] = useState(false);
  const [discoverUrl, setDiscoverUrl] = useState("");
  const [selectedFeedId, setSelectedFeedId] = useState<string | null>(null);
  const [discovering, setDiscovering] = useState(false);
  const [discoveredFeeds, setDiscoveredFeeds] = useState<Array<{ url: string; title: string; type: string }>>([]);
  const [importingOPML, setImportingOPML] = useState(false);
  const [importResult, setImportResult] = useState<{ imported: number; skipped: number; total: number; errors?: string[] } | null>(null);
  const [formData, setFormData] = useState({
    title: "",
    url: "",
    siteUrl: "",
    refreshIntervalMinutes: 180,
  });
  const { toasts, removeToast, success, error, warning } = useToast();

  useEffect(() => {
    fetchFeeds();
  }, []);

  const fetchFeeds = async () => {
    try {
      const res = await fetch("/api/feeds");
      if (res.ok) {
        const data = await res.json();
        setFeeds(data);
      }
    } catch (error) {
      console.error("Error fetching feeds:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    
    if (formData.refreshIntervalMinutes < 180) {
      warning("Refresh interval must be at least 180 minutes (3 hours)");
      return;
    }

    try {
      const url = editing ? `/api/feeds/${editing.id}` : "/api/feeds";
      const method = editing ? "PUT" : "POST";
      
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (res.ok) {
        fetchFeeds();
        setShowForm(false);
        setEditing(null);
        setFormData({ title: "", url: "", siteUrl: "", refreshIntervalMinutes: 60 });
        success(editing ? "Feed updated successfully!" : "Feed created successfully!");
      } else {
        const data = await res.json();
        error(data.error || "Error saving feed");
      }
    } catch (err) {
      console.error("Error saving feed:", err);
      error("Failed to save feed");
    }
  };

  const handleEdit = (feed: Feed) => {
    setEditing(feed);
    setFormData({
      title: feed.title,
      url: feed.url,
      siteUrl: feed.siteUrl || "",
      refreshIntervalMinutes: feed.refreshIntervalMinutes,
    });
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this feed? All associated items will also be deleted.")) return;

    try {
      const res = await fetch(`/api/feeds/${id}`, { method: "DELETE" });
      const data = await res.json();
      
      if (res.ok) {
        fetchFeeds();
        // Show success message if provided
        if (data.message) {
          success(data.message);
        } else {
          success("Feed deleted successfully!");
        }
      } else {
        // Show specific error message from API
        const errorMessage = data.error || `Error deleting feed: ${res.status} ${res.statusText}`;
        error(errorMessage);
        console.error("Delete feed error:", { status: res.status, error: data });
      }
    } catch (err) {
      console.error("Error deleting feed:", err);
      error(`Failed to delete feed: ${err instanceof Error ? err.message : "Unknown error"}`);
    }
  };

  const handleFetch = async (id: string) => {
    try {
      const res = await fetch(`/api/feeds/${id}/fetch`, { method: "POST" });
      if (res.ok) {
        const data = await res.json();
        success(`Fetched ${data.itemsCreated} new items, updated ${data.itemsUpdated} items`);
        fetchFeeds();
      } else {
        const data = await res.json();
        error(data.error || "Error fetching feed");
      }
    } catch (err) {
      console.error("Error fetching feed:", err);
      error("Failed to fetch feed");
    }
  };

  if (loading) {
    return (
      <div className="text-center py-8">
        <div className="inline-block card-admin p-6">
          <p className="text-sm text-muted-foreground animate-pulse">
            Loading…
          </p>
        </div>
      </div>
    );
  }

  const handleDiscover = async () => {
    if (!discoverUrl.trim()) {
      warning("Please enter a URL");
      return;
    }

    setDiscovering(true);
    setDiscoveredFeeds([]);

    try {
      const res = await fetch("/api/feeds/discover", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: discoverUrl }),
      });

      const data = await res.json();

      if (res.ok) {
        setDiscoveredFeeds(data.feeds || []);
        if (data.feeds.length === 0) {
          warning("No feeds found for this URL");
        } else {
          success(`Found ${data.feeds.length} feed(s)`);
        }
      } else {
        error(data.error || "Error discovering feeds");
      }
    } catch (err) {
      console.error("Error discovering feeds:", err);
      error("Failed to discover feeds");
    } finally {
      setDiscovering(false);
    }
  };

  const handleUseDiscoveredFeed = (feed: { url: string; title: string }) => {
    setFormData({
      title: feed.title,
      url: feed.url,
      siteUrl: discoverUrl,
      refreshIntervalMinutes: 180,
    });
    setShowDiscover(false);
    setShowForm(true);
    setDiscoveredFeeds([]);
    setDiscoverUrl("");
  };

  const handleExportOPML = async () => {
    try {
      const res = await fetch("/api/feeds/export/opml");
      
      if (!res.ok) {
        const data = await res.json();
        error(data.error || "Error exporting OPML");
        return;
      }

      // Get filename from Content-Disposition header or use default
      const contentDisposition = res.headers.get("content-disposition");
      let filename = "thefeeder-feeds.opml";
      if (contentDisposition) {
        const filenameMatch = contentDisposition.match(/filename="?(.+)"?/);
        if (filenameMatch) {
          filename = filenameMatch[1];
        }
      }

      // Create blob and download
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
      success("OPML exported successfully!");
    } catch (err) {
      console.error("Error exporting OPML:", err);
      error("Failed to export OPML");
    }
  };

  const handleImportOPML = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.includes("xml") && !file.name.endsWith(".opml")) {
      error("Invalid file type. Please upload an OPML (.opml) file");
      return;
    }

    setImportingOPML(true);
    setImportResult(null);

    try {
      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch("/api/feeds/import/opml", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();

      if (res.ok) {
        setImportResult({
          imported: data.imported,
          skipped: data.skipped,
          total: data.total,
          errors: data.errors,
        });
        // Refresh feeds list
        fetchFeeds();
        // Clear file input
        event.target.value = "";
        success(`Successfully imported ${data.imported} feed(s)!`);
      } else {
        error(data.error || "Error importing OPML");
      }
    } catch (err) {
      console.error("Error importing OPML:", err);
      error("Failed to import OPML");
    } finally {
      setImportingOPML(false);
    }
  };

  return (
    <div>
      <ToastContainer toasts={toasts} onRemove={removeToast} />
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-4">
        <h2 className="text-base md:text-lg font-bold text-primary">Feeds</h2>
        <div className="flex gap-2 flex-wrap w-full sm:w-auto">
          <input
            type="file"
            accept=".opml,.xml"
            onChange={handleImportOPML}
            disabled={importingOPML}
            className="hidden"
            id="opml-import-input"
          />
          <label
            htmlFor="opml-import-input"
            className={`btn-admin flex-1 sm:flex-initial cursor-pointer ${importingOPML ? "btn-admin-secondary opacity-50 cursor-not-allowed" : "btn-admin-secondary"}`}
          >
            {importingOPML ? "Importing…" : "Import OPML"}
          </label>
          <button onClick={handleExportOPML} className="btn-admin btn-admin-secondary flex-1 sm:flex-initial">
            Export OPML
          </button>
          <button
            onClick={() => {
              setShowDiscover(!showDiscover);
              setShowForm(false);
              if (showDiscover) {
                setDiscoveredFeeds([]);
                setDiscoverUrl("");
              }
            }}
            className="btn-admin btn-admin-secondary flex-1 sm:flex-initial"
          >
            {showDiscover ? "Cancel" : "Discover"}
          </button>
          <button
            onClick={() => {
              setShowForm(!showForm);
              setEditing(null);
              setShowDiscover(false);
              setFormData({ title: "", url: "", siteUrl: "", refreshIntervalMinutes: 60 });
            }}
            className="btn-admin btn-admin-primary flex-1 sm:flex-initial"
          >
            {showForm ? "Cancel" : "Add Feed"}
          </button>
        </div>
      </div>

      {importResult && (
        <div className="mb-4 card-admin p-4 space-y-3">
          <h3 className="label-admin mb-2 font-semibold text-foreground">Import result</h3>
          <div className="space-y-2">
            <p className="text-xs text-muted-foreground">
              <span className="text-green-600 dark:text-green-400">Imported: {importResult.imported}</span>
              {" · "}
              <span className="text-amber-600 dark:text-amber-400">Skipped: {importResult.skipped}</span>
              {" · "}
              <span>Total: {importResult.total}</span>
            </p>
            {importResult.errors && importResult.errors.length > 0 && (
              <div className="mt-2 p-2 bg-destructive/10 border border-destructive/30 rounded-lg text-xs text-destructive">
                <p className="font-semibold mb-1">Errors</p>
                <ul className="list-disc list-inside space-y-1">
                  {importResult.errors.map((err: string, index: number) => (
                    <li key={index}>{err}</li>
                  ))}
                </ul>
              </div>
            )}
            <button onClick={() => setImportResult(null)} className="btn-admin btn-admin-ghost mt-1">
              Close
            </button>
          </div>
        </div>
      )}

      {showDiscover && (
        <div className="mb-4 card-admin p-4 space-y-3">
          <h3 className="label-admin mb-2 font-semibold text-foreground">Discover feeds</h3>
          <p className="text-xs text-muted-foreground mb-3">
            Enter a website URL and we'll automatically discover RSS/Atom feeds.
          </p>
          <div className="flex flex-col sm:flex-row gap-2">
            <input
              type="url"
              value={discoverUrl}
              onChange={(e: ChangeEvent<HTMLInputElement>) => setDiscoverUrl(e.target.value)}
              placeholder="https://example.com or r/programming or youtube.com/channel/..."
              className="input-admin flex-1 min-w-0"
              onKeyDown={(e: KeyboardEvent<HTMLInputElement>) => e.key === "Enter" && (e.preventDefault(), handleDiscover())}
            />
            <button
              onClick={handleDiscover}
              disabled={discovering}
              className="btn-admin btn-admin-primary flex-shrink-0 w-full sm:w-auto disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {discovering ? "Searching…" : "Discover"}
            </button>
          </div>
          {discoveredFeeds.length > 0 && (
            <div className="mt-4 space-y-2">
              <p className="label-admin font-semibold text-foreground">Found {discoveredFeeds.length} feed(s)</p>
              <div className="space-y-2">
                {discoveredFeeds.map((feed: { url: string; title: string; type: string }, index: number) => (
                  <div key={index} className="card-admin p-3">
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
                      <div className="flex-1 min-w-0 w-full sm:w-auto">
                        <p className="text-sm font-bold text-primary mb-1 truncate">{feed.title}</p>
                        <p className="text-xs text-muted-foreground break-all mb-2">{feed.url}</p>
                        <span className="text-[10px] text-muted-foreground">{feed.type}</span>
                      </div>
                      <button onClick={() => handleUseDiscoveredFeed(feed)} className="btn-admin btn-admin-primary flex-shrink-0 w-full sm:w-auto">
                        Use
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {showForm && (
        <form onSubmit={handleSubmit} className="mb-4 card-admin p-4 space-y-3">
          <div>
            <label className="label-admin mb-1.5">Title</label>
            <input
              type="text"
              value={formData.title}
              onChange={(e: ChangeEvent<HTMLInputElement>) => setFormData({ ...formData, title: e.target.value })}
              required
              className="input-admin w-full"
            />
          </div>
          <div>
            <label className="label-admin mb-1.5">Feed URL</label>
            <input
              type="url"
              value={formData.url}
              onChange={(e: ChangeEvent<HTMLInputElement>) => setFormData({ ...formData, url: e.target.value })}
              required
              className="input-admin w-full"
            />
          </div>
          <div>
            <label className="label-admin mb-1.5">Site URL (optional)</label>
            <input
              type="url"
              value={formData.siteUrl}
              onChange={(e: ChangeEvent<HTMLInputElement>) => setFormData({ ...formData, siteUrl: e.target.value })}
              className="input-admin w-full"
            />
          </div>
          <div>
            <label className="label-admin mb-1.5">Refresh interval (minutes, min 180)</label>
            <input
              type="number"
              min={180}
              value={formData.refreshIntervalMinutes}
              onChange={(e: ChangeEvent<HTMLInputElement>) => setFormData({ ...formData, refreshIntervalMinutes: parseInt(e.target.value) || 180 })}
              required
              className="input-admin w-full"
            />
          </div>
          <button type="submit" className="btn-admin btn-admin-primary">
            {editing ? "Update" : "Create"} feed
          </button>
        </form>
      )}

      <div className="space-y-4">
        {feeds.map((feed: Feed) => (
          <div
            key={feed.id}
            className={`card-admin p-3 md:p-4 flex flex-col md:flex-row items-start md:items-center justify-between gap-3 ${!feed.isActive ? "opacity-70" : ""}`}
          >
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                <FeedIcon url={feed.url} size={16} className="flex-shrink-0" />
                <h3 className="font-bold text-primary text-sm md:text-base">{feed.title}</h3>
                {feed.status && <FeedStatusBadge status={feed.status} />}
                {!feed.isActive && (
                  <span className="text-[10px] bg-muted text-muted-foreground border border-border px-1.5 py-0.5 rounded">Inactive</span>
                )}
              </div>
              <p className="text-xs text-muted-foreground mb-2 break-all">{feed.url}</p>
              {feed.consecutiveFailures && feed.consecutiveFailures > 0 && (
                <div className="mb-2 p-2 rounded-lg border border-destructive/30 bg-destructive/10">
                  <p className="text-xs text-destructive">
                    {feed.consecutiveFailures} consecutive failure{feed.consecutiveFailures > 1 ? "s" : ""}
                    {feed.lastError && `: ${feed.lastError.substring(0, 100)}${feed.lastError.length > 100 ? "…" : ""}`}
                  </p>
                </div>
              )}
              <div className="flex flex-wrap gap-3 text-[10px] md:text-xs text-muted-foreground">
                <span>Interval: {feed.refreshIntervalMinutes} min</span>
                <span>Items: {feed._count?.items || 0}</span>
                <span>Last: {feed.lastFetchedAt ? formatDateTime(feed.lastFetchedAt) : "Never"}</span>
              </div>
            </div>
            <div className="flex gap-2 sm:gap-1.5 flex-wrap w-full sm:w-auto">
              <button onClick={() => setSelectedFeedId(feed.id)} className="btn-admin btn-admin-primary flex-1 sm:flex-initial">
                Health
              </button>
              <button onClick={() => handleFetch(feed.id)} className="btn-admin btn-admin-secondary flex-1 sm:flex-initial">
                Fetch
              </button>
              <button onClick={() => handleEdit(feed)} className="btn-admin btn-admin-secondary flex-1 sm:flex-initial">
                Edit
              </button>
              <button onClick={() => handleDelete(feed.id)} className="btn-admin btn-admin-destructive flex-1 sm:flex-initial">
                Delete
              </button>
            </div>
          </div>
        ))}
      </div>

      {feeds.length === 0 && (
        <div className="text-center py-8 sm:py-10 md:py-12">
          <div className="flex flex-col items-center gap-3 sm:gap-4">
            <div className="glow-soft">
              <img src="/logo.png" alt="Logo" className="w-14 h-14 sm:w-16 sm:h-16 md:w-20 md:h-20 opacity-70" />
            </div>
            <div className="p-4 sm:p-5 md:p-6 max-w-md mx-2">
              <p className="text-sm sm:text-base md:text-lg font-bold text-primary mb-1.5 sm:mb-2">
                No feeds yet
              </p>
              <p className="text-xs sm:text-sm text-muted-foreground">
                Add your first feed to get started.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Feed Details Modal */}
      {selectedFeedId && (
        <FeedDetails
          feedId={selectedFeedId}
          onClose={() => setSelectedFeedId(null)}
        />
      )}
    </div>
  );
}

