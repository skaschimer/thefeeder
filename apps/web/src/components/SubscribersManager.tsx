"use client";

import { useState, useEffect } from "react";
import { useToast } from "@/src/hooks/useToast";
import { ToastContainer } from "./Toast";

/**
 * Format date deterministically to avoid hydration errors
 * Uses UTC to ensure same output on server and client
 */
function formatDate(dateString: string): string {
  const date = new Date(dateString);
  const year = date.getUTCFullYear();
  const month = String(date.getUTCMonth() + 1).padStart(2, '0');
  const day = String(date.getUTCDate()).padStart(2, '0');
  return `${day}/${month}/${year}`;
}

interface Subscriber {
  id: string;
  name: string;
  email: string;
  status: "pending" | "approved" | "rejected";
  createdAt: string;
  approvedAt?: string;
}

interface SubscribersManagerProps {
  onSubscriberUpdate?: () => void;
}

export default function SubscribersManager({ onSubscriberUpdate }: SubscribersManagerProps) {
  const [subscribers, setSubscribers] = useState<Subscriber[]>([]);
  const [loading, setLoading] = useState(true);
  const { toasts, removeToast, success, error } = useToast();

  useEffect(() => {
    fetchSubscribers();
  }, []);

  const fetchSubscribers = async () => {
    try {
      const res = await fetch("/api/subscribers");
      if (res.ok) {
        const data = await res.json();
        setSubscribers(data);
      }
    } catch (error) {
      console.error("Error fetching subscribers:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateStatus = async (id: string, status: "pending" | "approved" | "rejected") => {
    try {
      const res = await fetch(`/api/subscribers/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });

      if (res.ok) {
        fetchSubscribers();
        onSubscriberUpdate?.(); // Update pending count in parent
        success(`Subscriber ${status === "approved" ? "approved" : status === "rejected" ? "rejected" : "revoked"} successfully!`);
      } else {
        const data = await res.json();
        error(data.error || "Error updating subscriber");
      }
    } catch (err) {
      console.error("Error updating subscriber:", err);
      error("Failed to update subscriber");
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this subscriber?")) return;

    try {
      const res = await fetch(`/api/subscribers/${id}`, { method: "DELETE" });
      if (res.ok) {
        fetchSubscribers();
        onSubscriberUpdate?.(); // Update pending count in parent
        success("Subscriber deleted successfully!");
      } else {
        error("Error deleting subscriber");
      }
    } catch (err) {
      console.error("Error deleting subscriber:", err);
      error("Failed to delete subscriber");
    }
  };

  if (loading) {
    return (
      <div className="text-center py-8">
        <div className="inline-block card-admin p-6">
          <p className="text-sm text-muted-foreground animate-pulse">Loading…</p>
        </div>
      </div>
    );
  }

  const pendingCount = subscribers.filter((s) => s.status === "pending").length;
  const approvedCount = subscribers.filter((s) => s.status === "approved").length;

  return (
    <div>
      <ToastContainer toasts={toasts} onRemove={removeToast} />
      <div className="mb-4">
        <h2 className="text-base md:text-lg font-bold text-primary mb-3">Subscribers</h2>
        <div className="flex flex-wrap gap-3 text-xs text-muted-foreground">
          <span className="flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 bg-primary rounded-full animate-pulse" />
            Pending: <span className="text-primary font-bold">{pendingCount}</span>
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 bg-secondary rounded-full" />
            Approved: <span className="text-secondary font-bold">{approvedCount}</span>
          </span>
          <span className="flex items-center gap-1.5">
            Total: <span className="text-foreground font-bold">{subscribers.length}</span>
          </span>
        </div>
      </div>

      <div className="space-y-3">
        {subscribers.map((subscriber) => (
          <div
            key={subscriber.id}
            className={`card-admin p-3 md:p-4 ${subscriber.status === "rejected" ? "opacity-70" : ""}`}
          >
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-3">
              <div className="flex-1">
                <h3 className="font-bold text-primary text-sm md:text-base mb-1">{subscriber.name}</h3>
                <p className="text-xs text-muted-foreground mb-2 break-all">{subscriber.email}</p>
                <div className="flex flex-wrap gap-3 text-[10px] md:text-xs text-muted-foreground">
                  <span>
                    Status:{" "}
                    <span
                      className={`font-bold ${
                        subscriber.status === "approved"
                          ? "text-primary"
                          : subscriber.status === "pending"
                            ? "text-muted-foreground"
                            : "text-destructive"
                      }`}
                    >
                      {subscriber.status}
                    </span>
                  </span>
                  <span>Joined: {formatDate(subscriber.createdAt)}</span>
                  {subscriber.approvedAt && (
                    <span>Approved: {formatDate(subscriber.approvedAt)}</span>
                  )}
                </div>
              </div>
              <div className="flex gap-2 sm:gap-1.5 flex-wrap w-full sm:w-auto">
                {subscriber.status === "pending" && (
                  <>
                    <button
                      onClick={() => handleUpdateStatus(subscriber.id, "approved")}
                      className="btn-admin btn-admin-primary flex-1 sm:flex-initial"
                    >
                      Approve
                    </button>
                    <button
                      onClick={() => handleUpdateStatus(subscriber.id, "rejected")}
                      className="btn-admin btn-admin-destructive flex-1 sm:flex-initial"
                    >
                      Reject
                    </button>
                  </>
                )}
                {subscriber.status === "approved" && (
                  <button
                    onClick={() => handleUpdateStatus(subscriber.id, "pending")}
                    className="btn-admin btn-admin-secondary flex-1 sm:flex-initial"
                  >
                    Revoke
                  </button>
                )}
                <button
                  onClick={() => handleDelete(subscriber.id)}
                  className="btn-admin btn-admin-destructive flex-1 sm:flex-initial"
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {subscribers.length === 0 && (
        <div className="text-center py-8 sm:py-10 md:py-12">
          <div className="flex flex-col items-center gap-3 sm:gap-4">
            <div className="glow-soft">
              <img src="/logo.png" alt="Logo" className="w-14 h-14 sm:w-16 sm:h-16 md:w-20 md:h-20 opacity-70" />
            </div>
            <div className="p-4 sm:p-5 md:p-6 max-w-md mx-2">
              <p className="text-sm sm:text-base md:text-lg font-bold text-primary mb-1.5 sm:mb-2">
                No subscribers yet
              </p>
              <p className="text-xs sm:text-sm text-muted-foreground">
                Subscribers will appear here once they sign up.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}


