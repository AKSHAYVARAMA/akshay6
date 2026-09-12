-- Support the offline marketplace lifecycle.
ALTER TYPE public.product_status ADD VALUE IF NOT EXISTS 'sold';

-- Keep conversation ordering correct whenever a buyer or seller sends a message.
CREATE OR REPLACE FUNCTION public.touch_conversation_on_message()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.conversations
  SET last_message_at = NEW.created_at
  WHERE id = NEW.conversation_id;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS messages_touch_conversation ON public.messages;
CREATE TRIGGER messages_touch_conversation
AFTER INSERT ON public.messages
FOR EACH ROW EXECUTE FUNCTION public.touch_conversation_on_message();

-- The inbox needs conversation updates as well as message inserts.
ALTER PUBLICATION supabase_realtime ADD TABLE public.conversations;
