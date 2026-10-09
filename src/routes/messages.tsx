import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { MessageCircle, RefreshCw, Send } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";

import { RequireAuth } from "@/components/require-auth";
import { MarketplaceImage } from "@/components/marketplace-image";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/messages")({
  head: () => ({
    meta: [
      { title: "Messages — ReMarket" },
      {
        name: "description",
        content: "Chat live with buyers and sellers about ReMarket listings.",
      },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: () => (
    <RequireAuth>
      <MessagesPage />
    </RequireAuth>
  ),
});

type Conversation = {
  id: string;
  buyer_id: string;
  seller_id: string;
  last_message_at: string;
  product: { title: string; images: string[] } | null;
};

type ChatMessage = { id: string; sender_id: string; body: string; created_at: string };

function MessagesPage() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [activeId, setActiveId] = useState<string | null>(null);
  const [draft, setDraft] = useState("");
  const [realtimeState, setRealtimeState] = useState("CONNECTING");
  const bottomRef = useRef<HTMLDivElement>(null);

  const { data: conversations = [], isLoading: conversationsLoading } = useQuery({
    queryKey: ["conversations", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("conversations")
        .select("id, buyer_id, seller_id, last_message_at, product:products(title, images)")
        .order("last_message_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as unknown as Conversation[];
    },
  });

  const selectedConversation = useMemo(
    () => conversations.find((conversation) => conversation.id === activeId),
    [activeId, conversations],
  );

  useEffect(() => {
    if (!activeId && conversations[0]) setActiveId(conversations[0].id);
  }, [activeId, conversations]);

  const { data: messages = [], isLoading: messagesLoading } = useQuery({
    queryKey: ["messages", activeId],
    enabled: !!activeId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("messages")
        .select("id, sender_id, body, created_at")
        .eq("conversation_id", activeId!)
        .order("created_at", { ascending: true });
      if (error) throw error;
      return (data ?? []) as ChatMessage[];
    },
  });

  useEffect(() => {
    if (!user) return;
    const channel = supabase
      .channel(`inbox:${user.id}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "messages" },
        (payload) => {
          const incoming = payload.new as { conversation_id: string };
          void queryClient.invalidateQueries({ queryKey: ["messages", incoming.conversation_id] });
          void queryClient.invalidateQueries({ queryKey: ["conversations", user.id] });
        },
      )
      .on("postgres_changes", { event: "UPDATE", schema: "public", table: "conversations" }, () => {
        void queryClient.invalidateQueries({ queryKey: ["conversations", user.id] });
      })
      .subscribe((status) => setRealtimeState(status));
    return () => {
      void supabase.removeChannel(channel);
    };
  }, [queryClient, user]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const send = async () => {
    const body = draft.trim();
    if (!body || !activeId || !user) return;
    const { error } = await supabase
      .from("messages")
      .insert({ conversation_id: activeId, sender_id: user.id, body: body.slice(0, 1000) });
    if (error) {
      toast.error(error.message);
      return;
    }
    setDraft("");
    void queryClient.invalidateQueries({ queryKey: ["messages", activeId] });
  };

  return (
    <div className="market-section px-4 py-8 sm:px-8">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-sm font-bold uppercase tracking-wider text-primary">
            Buyer–seller inbox
          </p>
          <h1 className="mt-1 text-4xl font-extrabold">Messages</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Ask questions, negotiate and arrange a safe meetup.
          </p>
        </div>
        <div
          className={`flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-bold ${realtimeState === "SUBSCRIBED" ? "bg-green-50 text-accent" : "bg-yellow-50 text-yellow-700"}`}
        >
          <span
            className={`size-2 rounded-full ${realtimeState === "SUBSCRIBED" ? "bg-accent" : "bg-yellow-500"}`}
          />
          {realtimeState === "SUBSCRIBED" ? "Live updates on" : "Connecting…"}
        </div>
      </div>
      <div className="mt-6 grid min-h-[580px] overflow-hidden rounded-2xl border border-border bg-white shadow-sm lg:grid-cols-[300px_1fr]">
        <aside className="border-b border-border lg:border-b-0 lg:border-r">
          <div className="flex items-center justify-between border-b border-border px-4 py-4">
            <p className="font-bold">Conversations</p>
            <Button
              variant="ghost"
              size="icon"
              aria-label="Refresh conversations"
              onClick={() =>
                void queryClient.invalidateQueries({ queryKey: ["conversations", user?.id] })
              }
            >
              <RefreshCw className="size-4" />
            </Button>
          </div>
          <div className="max-h-[230px] overflow-y-auto p-2 lg:max-h-[520px]">
            {conversationsLoading && (
              <p className="p-3 text-sm text-muted-foreground">Loading conversations…</p>
            )}
            {conversations.map((conversation) => (
              <button
                key={conversation.id}
                onClick={() => setActiveId(conversation.id)}
                className={`flex w-full items-center gap-3 rounded-xl p-3 text-left transition ${activeId === conversation.id ? "bg-secondary" : "hover:bg-[#f4f6f8]"}`}
              >
                <MarketplaceImage
                  src={conversation.product?.images?.[0] ?? ""}
                  alt=""
                  className="size-12 rounded-lg object-cover"
                />
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-bold">
                    {conversation.product?.title ?? "Listing"}
                  </span>
                  <span className="mt-1 block text-xs text-muted-foreground">
                    {new Date(conversation.last_message_at).toLocaleString()}
                  </span>
                </span>
              </button>
            ))}
            {!conversationsLoading && conversations.length === 0 && (
              <div className="p-5 text-center">
                <MessageCircle className="mx-auto size-8 text-muted-foreground" />
                <p className="mt-2 text-sm text-muted-foreground">
                  Your seller conversations will appear here.
                </p>
              </div>
            )}
          </div>
        </aside>
        <section className="flex min-h-[520px] flex-col">
          <div className="border-b border-border px-5 py-4">
            {selectedConversation ? (
              <>
                <p className="font-bold">
                  {selectedConversation.product?.title ?? "Listing conversation"}
                </p>
                <p className="text-xs text-muted-foreground">Live chat · no online payment</p>
              </>
            ) : (
              <p className="font-bold text-muted-foreground">Choose a conversation</p>
            )}
          </div>
          <div className="flex-1 space-y-3 overflow-y-auto bg-[#f8fafc] p-5">
            {messagesLoading && <p className="text-sm text-muted-foreground">Loading messages…</p>}
            {messages.map((message) => (
              <div
                key={message.id}
                className={`max-w-[80%] rounded-2xl px-4 py-3 text-sm shadow-sm ${message.sender_id === user?.id ? "ml-auto bg-primary text-white" : "bg-white text-foreground"}`}
              >
                <p>{message.body}</p>
                <p
                  className={`mt-1 text-[10px] ${message.sender_id === user?.id ? "text-blue-100" : "text-muted-foreground"}`}
                >
                  {new Date(message.created_at).toLocaleTimeString([], {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </p>
              </div>
            ))}
            {activeId && messages.length === 0 && (
              <p className="text-sm text-muted-foreground">Say hello to start the conversation.</p>
            )}
            {!activeId && (
              <p className="text-sm text-muted-foreground">Pick a conversation to read it.</p>
            )}
            <div ref={bottomRef} />
          </div>
          <div className="border-t border-border bg-white p-4">
            <div className="flex gap-2">
              <Input
                value={draft}
                maxLength={1000}
                disabled={!activeId}
                placeholder={activeId ? "Write a message…" : "Select a conversation first"}
                onChange={(event) => setDraft(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === "Enter" && !event.shiftKey) {
                    event.preventDefault();
                    void send();
                  }
                }}
              />
              <Button
                onClick={() => void send()}
                disabled={!activeId || !draft.trim()}
                className="rounded-xl bg-primary"
              >
                <Send className="mr-2 size-4" /> Send
              </Button>
            </div>
            <p className="mt-2 text-[11px] text-muted-foreground">
              Never share payment details or send money before inspecting the item.
            </p>
          </div>
        </section>
      </div>
    </div>
  );
}
