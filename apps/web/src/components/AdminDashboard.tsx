"use client";

import { useState, useEffect } from "react";
import { signOut } from "next-auth/react";
import FeedsManager from "./FeedsManager";
import SubscribersManager from "./SubscribersManager";
import NotificationBell from "./NotificationBell";
import BrowserAutomationStats from "./BrowserAutomationStats";
import { ThemeToggle } from "./ThemeToggle";
import { SiteLogo } from "./SiteLogo";

export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState<"feeds" | "subscribers">("feeds");
  const [pendingCount, setPendingCount] = useState<number>(0);

  // Fetch pending subscribers count
  const fetchPendingCount = async () => {
    try {
      const res = await fetch("/api/subscribers/count");
      if (res.ok) {
        const data = await res.json();
        setPendingCount(data.pending || 0);
      }
    } catch (error) {
      console.error("Error fetching pending count:", error);
    }
  };

  // Poll for pending count every 30 seconds
  useEffect(() => {
    fetchPendingCount(); // Initial fetch
    const interval = setInterval(fetchPendingCount, 30000); // Poll every 30 seconds
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="min-h-screen relative overflow-x-hidden overflow-y-auto scanlines" style={{ background: 'var(--color-bg-primary)', transition: 'var(--theme-transition)' }}>
      <div className="vaporwave-grid" />
      <div className="absolute inset-0 opacity-30" style={{
        background: 'var(--gradient-bg-overlay)',
        transition: 'var(--theme-transition)'
      }} />
      
      <div className="relative z-10 p-3 md:p-4">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <header className="mb-4 md:mb-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
              <div className="glow-soft flex-shrink-0">
                <SiteLogo className="w-10 h-10 md:w-12 md:h-12" alt="Logo" />
              </div>
              <div className="min-w-0 flex-1">
                <h1 className="text-base sm:text-lg md:text-xl font-bold text-primary neon-glow-pink truncate">
                  Admin Dashboard
                </h1>
                <p className="text-muted-foreground text-xs mt-0.5 truncate">Manage feeds and subscribers</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <ThemeToggle />
              <NotificationBell />
              <button
                onClick={() => signOut({ callbackUrl: "/" })}
                className="btn-admin btn-admin-destructive flex-shrink-0 w-full sm:w-auto"
              >
                Sign out
              </button>
            </div>
          </header>

          {/* Browser Automation Stats */}
          <div className="mb-4">
            <BrowserAutomationStats />
          </div>

          {/* Tabs */}
          <div className="flex gap-2 mb-4">
            <button
              onClick={() => setActiveTab("feeds")}
              className={`btn-admin border rounded-lg px-3 py-1.5 text-sm font-medium transition ${
                activeTab === "feeds" ? "btn-admin-primary shadow-[var(--shadow-glow)]" : "btn-admin-secondary"
              }`}
            >
              Feeds
            </button>
            <button
              onClick={() => setActiveTab("subscribers")}
              className={`btn-admin relative border rounded-lg px-3 py-1.5 text-sm font-medium transition ${
                activeTab === "subscribers" ? "btn-admin-primary shadow-[var(--shadow-glow)]" : "btn-admin-secondary"
              }`}
            >
              Subscribers
              {pendingCount > 0 && (
                <span className="absolute -top-1 -right-1 min-w-[16px] h-4 px-1 rounded-full bg-primary text-primary-foreground text-[10px] font-medium flex items-center justify-center border border-primary/30">
                  {pendingCount > 99 ? "99+" : pendingCount}
                </span>
              )}
            </button>
          </div>

          {/* Content */}
          <div className="card-admin p-4 md:p-5 backdrop-blur-md">
            {activeTab === "feeds" && <FeedsManager />}
            {activeTab === "subscribers" && <SubscribersManager onSubscriberUpdate={fetchPendingCount} />}
          </div>
        </div>
      </div>
    </div>
  );
}

