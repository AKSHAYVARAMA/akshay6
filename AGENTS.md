<!-- LOVABLE:BEGIN -->
> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.
<!-- LOVABLE:END -->

- Listing photos are uploaded to the private `remarket-listing-photos` Storage bucket, product rows store object paths, and the UI resolves short-lived signed URLs so photos remain private to the intended listing flow.
- Nearby browsing reads buyer geolocation only after a user action and keeps it in browser state; seller ad coordinates are optional and rounded before saving to protect precise location privacy.
