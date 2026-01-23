"use client";

import FeedCard from "@/src/components/FeedCard";
import { useTheme } from "@/src/contexts/ThemeContext";
import { formatDate } from "@/src/lib/date-utils";
import { sanitizeForDisplay } from "@/src/lib/html-utils";

interface Item {
  id: string;
  title: string;
  url: string;
  summary?: string;
  publishedAt?: string;
  author?: string;
  likes?: number;
  dislikes?: number;
  userVote?: "like" | "dislike" | null;
  feed?: {
    title: string;
    url?: string;
  };
}

interface FeedListProps {
  items: Item[];
  loading?: boolean;
}

export default function FeedList({ items, loading }: FeedListProps) {
  const { theme } = useTheme();

  if (loading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4 px-3 sm:px-4 md:px-6">
        {[...Array(6)].map((_, i) => (
          <div
            key={i}
            className="border-2 p-3 sm:p-3.5 md:p-4 animate-pulse"
            style={{
              background: 'var(--color-bg-secondary)',
              borderColor: 'var(--color-border)'
            }}
          >
            <div 
              className="h-2.5 sm:h-3 rounded w-14 sm:w-16 mb-1.5 sm:mb-2"
              style={{ background: 'var(--color-accent-primary)', opacity: 0.2 }}
            />
            <div 
              className="h-4 sm:h-5 rounded w-full mb-1.5 sm:mb-2"
              style={{ background: 'var(--color-accent-primary)', opacity: 0.2 }}
            />
            <div 
              className="h-2.5 sm:h-3 rounded w-3/4 mb-1 sm:mb-1.5"
              style={{ background: 'var(--color-accent-secondary)', opacity: 0.2 }}
            />
            <div 
              className="h-2.5 sm:h-3 rounded w-1/2"
              style={{ background: 'var(--color-accent-secondary)', opacity: 0.2 }}
            />
          </div>
        ))}
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="text-center py-6 sm:py-8 px-3 sm:px-4">
        <div className="p-3 sm:p-4 md:p-6 max-w-md mx-auto">
          <p 
            className="text-xs sm:text-sm md:text-base font-bold mb-1.5 sm:mb-2 uppercase tracking-wider"
            style={{
              color: 'var(--color-accent-primary)',
              textShadow: 'var(--shadow-glow-strong)'
            }}
          >
            NO FEEDS YET
          </p>
        </div>
      </div>
    );
  }

  if (theme === "directory") {
    return (
      <div className="relative z-10 px-3 sm:px-4 md:px-6 pb-6">
        <div className="max-w-3xl mx-auto">
          <h2
            className="text-sm font-bold mb-3 border-b pb-1"
            style={{ color: "var(--color-text-primary)", borderColor: "var(--color-border)" }}
          >
            Latest Articles
          </h2>
          <ul className="space-y-1 list-none">
            {items.map((item) => (
              <li key={item.id}>
                <a
                  href={item.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block py-1 text-[var(--color-accent-primary)] underline hover:opacity-80"
                  dangerouslySetInnerHTML={{ __html: sanitizeForDisplay(item.title) }}
                />
                {(item.feed?.title || item.publishedAt) && (
                  <span
                    className="block text-xs pl-0 mt-0"
                    style={{ color: "var(--color-text-muted)" }}
                  >
                    {[item.feed?.title, item.publishedAt ? formatDate(item.publishedAt) : null]
                      .filter(Boolean)
                      .join(" · ")}
                  </span>
                )}
              </li>
            ))}
          </ul>
        </div>
      </div>
    );
  }

  return (
    <div className="relative z-10 px-3 sm:px-4 md:px-6 pb-6">
      <div className="max-w-7xl mx-auto">
        <h2 
          className="text-xs sm:text-sm md:text-base font-bold mb-3 sm:mb-4 md:mb-5 text-center uppercase tracking-wider"
          style={{
            color: 'var(--color-accent-secondary)',
            textShadow: 'var(--shadow-glow)'
          }}
        >
          Latest Articles
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4">
          {items.map((item) => (
            <FeedCard key={item.id} {...item} />
          ))}
        </div>
      </div>
    </div>
  );
}
