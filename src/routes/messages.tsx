import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import { RequireAuth } from "@/components/require-auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/messages")({
  head: () => ({
    meta: [
      { title: "Messages — ReMarket" },
      { name: "description", content: "Chat with buyers and sellers about listings on ReMarket." },
      { property: "og:title", content: "Messages — ReMarket" },
      { property: "og:description", content: "Chat with buyers and sellers about listings on ReMarket." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: () => (
    <RequireAuth>
      <MessagesPage />
    </RequireAuth>
  ),
});

function MessagesPage() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [activeId, setActiveId] = useState<string | null>(null);
  const [draft, setDraft] = useState("");

  const { data: conversations = [] } = useQuery({
    queryKey: ["conversations", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data } = await supabase
        .from("conversations")
        .select("id, last_message_at, product:products(title, images)")
        .order("last_message_at", { ascending: false });
      return data ?? [];
    },
  });

  const { data: messages = [] } = useQuery({
    queryKey: ["messages", activeId],
    enabled: !!activeId,
    queryFn: async () => {
      const { data } = await supabase
        .from("messages")
        .select("*")
        .eq("conversation_id", activeId!)
        .order("created_at", { ascending: true });
      return data ?? [];
    },
  });

  useEffect(() => {
    if (!user) return;
    const channel = supabase
      .channel("messages-live")
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "messages" }, () => {
        void queryClient.invalidateQueries({ queryKey: ["messages"] });
      })
      .subscribe();
    return () => {
      void supabase.removeChannel(channel);
    };
  }, [user, queryClient]);

  const send = async () => {
    const body = draft.trim();
    if (!body || !activeId) return;
    const { error } = await supabase.from("messages").insert({
      conversation_id: activeId,
      sender_id: user!.id,
      body: body.slice(0, 1000),
    });
    if (error) {
      toast.error(error.message);
      return;
    }
    setDraft("");
    void queryClient.invalidateQueries({ queryKey: ["messages", activeId] });
  };

  return (
    <div className="px-4 py-10 sm:px-8">
      <h1 className="font-display text-4xl tracking-tight">Messages</h1>
      <div className="mt-6 grid gap-5 lg:grid-cols-3">
        <div className="glass-panel space-y-2 rounded-3xl p-4">
          {conversations.map((conversation) => (
            <button
              key={conversation.id}
              onClick={() => setActiveId(conversation.id)}
              className={`w-full rounded-2xl p-3 text-left text-sm transition ${
                activeId === conversation.id ? "bg-secondary" : "hover:bg-secondary/60"
              }`}
            >
              <span className="font-semibold">
                {(conversation.product as { title?: string } | null)?.title ?? "Listing"}
              </span>
              <span className="block text-xs text-muted-foreground">
                {new Date(conversation.last_message_at).toLocaleString()}
              </span>
            </button>
          ))}
          {conversations.length === 0 && <p className="p-3 text-sm text-muted-foreground">No conversations yet.</p>}
        </div>

        <div className="glass-panel flex min-h-[420px] flex-col rounded-3xl p-5 lg:col-span-2">
          <div className="flex-1 space-y-3 overflow-y-auto">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`max-w-[75%] rounded-2xl px-4 py-2 text-sm ${
                  message.sender_id === user?.id
                    ? "sunset-gradient ml-auto text-primary-foreground"
                    : "bg-secondary"
                }`}
              >
                {message.body}
              </div>
            ))}
            {activeId && messages.length === 0 && (
              <p className="text-sm text-muted-foreground">Say hello to start the conversation.</p>
            )}
            {!activeId && <p className="text-sm text-muted-foreground">Pick a conversation to read it.</p>}
          </div>
          <div className="mt-4 flex gap-2">
            <Input
              value={draft}
              maxLength={1000}
              placeholder="Write a message…"
              onChange={(event) => setDraft(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter") void send();
              }}
            />
            <Button
              onClick={() => void send()}
              className="sunset-gradient rounded-full border-0 text-primary-foreground"
            >
              Send
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
