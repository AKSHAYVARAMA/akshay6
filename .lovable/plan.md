# ReMarket: live chat alerts and AI listing search

## What will change
- Save a private in-app notification for the other chat participant whenever a message is sent.
- Show unread counts and live alerts throughout the app; offer browser notifications when the app is open in a background tab and the user has enabled them.
- Add an AI-assisted search on Browse: buyers describe what they need, and matching approved listings are returned with short reasons.

## How it will work
- Use a database trigger for reliable notification creation and the existing realtime publication for immediate updates. Keep notification reads scoped to the signed-in recipient.
- Ask for browser-notification permission only after the user presses an enable button. No location or notification permission is requested on page load. Browser alerts require the app to remain open; delivery while fully closed is not included.
- Run listing matching in an authenticated Lovable server function, read only approved public listings, validate a bounded search request, and use the Lovable AI Gateway. The model will rank listing IDs only from the server-provided catalog; results will be checked against that catalog before display.

## Technical details
- Add a message-insert trigger that writes one notification to the other conversation participant; no message contents are copied into the notification.
- Reuse the existing `notifications` table and realtime publication; add no user roles, new notification table, or push-service credentials.
- Add a server-side AI search module and the required AI SDK packages, plus a Browse search panel and result display.
- Validate notification delivery and AI search against live preview behavior; report any credential, model, or account limitation rather than silently substituting another provider/model.