# Startup AYUSH Portal — My Profile

A pixel-matched rebuild of the "My Profile" page for the Startup AYUSH Portal
(SIH1345), built with React + Vite + Tailwind CSS.

## What's inside

- `src/MyProfile.jsx` — the full page component (navbar, hero banner, profile
  card, personal information section, "How do you use AYUSH?" role cards,
  footer)
- `src/assets/logo.jpeg` — the "Startup AYUSH Portal" wordmark, bundled as a
  real image asset and imported directly in the navbar
- `src/assets/hero-bg.jpeg` — the botanical mortar & pestle / herbs banner
  texture, used as the hero section's background image
- `src/assets/mockup-reference.jpeg` — the original page mockup, kept for
  reference only (not imported anywhere)
- Ministry of India emblem is pulled live from the official Wikimedia URL in
  the navbar

## Design tokens

| Token | Value | Usage |
|---|---|---|
| Primary green | `#1F5C36` | Headings, footer background, outlined buttons |
| Accent green | `#6BAF3E` | Leaf accents, underline strokes |
| Orange | `#D97A29` | "Startup" wordmark color, Investor card accent |

## Run it locally

```bash
npm install
npm run dev
```

Then open the printed local URL (typically `http://localhost:5173`).

## Build for production

```bash
npm run build
npm run preview
```

## Notes

- Icons are from `lucide-react`.
- Fully responsive — the profile card, info rows, and role cards stack
  cleanly on small screens (test at `sm` breakpoint and below).
- Mock data (Ayush Sharma / ayush_sharma23 / etc.) lives directly in
  `MyProfile.jsx` — swap in real user data or wire up an API call there.
