import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";

import { RequireAuth } from "@/components/require-auth";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/notifications")({
  head: () => ({
    meta: [
      { title: "Notifications — ReMarket" },
      { name: "description", content: "Messages and listing activity from ReMarket." },
      { property: "og:title", content: "Notifications — ReMarket" },
      { property: "og:description", content: "Messages and listing activity from ReMarket." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: () => (
    <RequireAuth>
      <NotificationsPage />
    </RequireAuth>
  ),
});

interface Notification {
  id: string;
  title: string;
  body: string;
  read: boolean;
  created_at: string;
}

function NotificationsPage() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: notifications = [] } = useQuery({
    queryKey: ["notifications", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data } = await supabase.from("notifications").select("*").order("created_at", { ascending: false });
      return (data ?? []) as Notification[];
    },
  });

  useEffect(() => {
    if (!user) return;
    const channel = supabase
      .channel("notifications-live")
      .on("postgres_changes", { event: "*", schema: "public", table: "notifications" }, () => {
        void queryClient.invalidateQueries({ queryKey: ["notifications"] });
      })
      .subscribe();
    return () => {
      void supabase.removeChannel(channel);
    };
  }, [user, queryClient]);

  const markAllRead = async () => {
    await supabase.from("notifications").update({ read: true }).eq("read", false);
    void queryClient.invalidateQueries({ queryKey: ["notifications"] });
  };

  return (
    <div className="px-4 py-10 sm:px-8">
      <div className="flex items-center justify-between">
        <h1 className="font-display text-4xl tracking-tight">Notifications</h1>
        <Button variant="secondary" className="rounded-full" onClick={() => void markAllRead()}>
          Mark all read
        </Button>
      </div>
      <div className="mt-6 space-y-3">
        {notifications.map((notification) => (
          <div
            key={notification.id}
            className={`glass-panel rounded-3xl p-5 ${notification.read ? "opacity-60" : ""}`}
          >
            <p className="font-display text-lg">{notification.title}</p>
            <p className="text-sm text-muted-foreground">{notification.body}</p>
            <p className="mt-1 text-xs text-muted-foreground">{new Date(notification.created_at).toLocaleString()}</p>
          </div>
        ))}
        {notifications.length === 0 && <p className="text-muted-foreground">Nothing new right now.</p>}
      </div>
    </div>
  );
}
