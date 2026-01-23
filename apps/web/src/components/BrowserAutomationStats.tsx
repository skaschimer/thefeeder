"use client";

import { useState, useEffect } from 'react';

interface BrowserAutomationStatsProps {
  className?: string;
}

interface BrowserStats {
  totalAttempts: number;
  successfulAttempts: number;
  failedAttempts: number;
  successRate: number;
  avgResponseTime: number | null;
  feedsUsingBrowser: number;
}

export default function BrowserAutomationStats({ className = '' }: BrowserAutomationStatsProps) {
  const [stats, setStats] = useState<BrowserStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
    // Refresh stats every 5 minutes
    const interval = setInterval(fetchStats, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  const fetchStats = async () => {
    try {
      const res = await fetch('/api/browser-automation/stats');
      if (res.ok) {
        const data = await res.json();
        setStats(data);
      }
    } catch (error) {
      console.error('Error fetching browser automation stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatResponseTime = (ms: number | null) => {
    if (ms === null) return 'N/A';
    if (ms < 1000) return `${ms}ms`;
    return `${(ms / 1000).toFixed(2)}s`;
  };

  if (loading) {
    return (
      <div className={`card-admin p-4 ${className}`}>
        <h3 className="text-sm font-bold mb-3 text-primary">Browser automation</h3>
        <p className="text-xs text-muted-foreground">Loading…</p>
      </div>
    );
  }

  if (!stats) {
    return null;
  }

  return (
    <div className={`card-admin p-4 ${className}`}>
      <h3 className="text-sm font-bold mb-3 text-primary">Browser automation (last 7 days)</h3>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <div className="text-xs text-muted-foreground">Success rate</div>
          <div
            className={`text-lg font-bold ${
              stats.successRate >= 80 ? "text-primary" : stats.successRate >= 50 ? "text-amber-500" : "text-destructive"
            }`}
          >
            {stats.successRate}%
          </div>
        </div>
        <div>
          <div className="text-xs text-muted-foreground">Feeds using browser</div>
          <div className="text-lg font-bold text-foreground">{stats.feedsUsingBrowser}</div>
        </div>
        <div>
          <div className="text-xs text-muted-foreground">Total attempts</div>
          <div className="text-lg font-bold text-foreground">{stats.totalAttempts}</div>
          <div className="text-xs text-muted-foreground">
            {stats.successfulAttempts} success / {stats.failedAttempts} failed
          </div>
        </div>
        <div>
          <div className="text-xs text-muted-foreground">Avg response time</div>
          <div className="text-lg font-bold text-foreground">{formatResponseTime(stats.avgResponseTime)}</div>
        </div>
      </div>
      {stats.feedsUsingBrowser > 0 && (
        <div className="mt-3 p-2 rounded-lg bg-muted/50 border border-border">
          <p className="text-xs text-muted-foreground">
            {stats.feedsUsingBrowser} feed{stats.feedsUsingBrowser > 1 ? "s" : ""} require
            {stats.feedsUsingBrowser === 1 ? "s" : ""} browser automation to bypass blocking.
          </p>
        </div>
      )}
    </div>
  );
}
