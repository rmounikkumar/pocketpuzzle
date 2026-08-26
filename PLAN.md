# ArcPuzzels — End-to-End Plan (Zero Cost, Ad-Funded)

Goal: ship a polished free web puzzle game that generates pocket money from ads, with $0 spent.

---

## 1. The honest revenue math

| Metric | Realistic range |
|---|---|
| Web ad RPM (display banners) | ~$0.50 – $3 per 1,000 views |
| Rewarded video / interstitials via game portals | ~$3 – $15 per 1,000 plays (portal keeps a share) |
| Pocket money target ($30–$100/mo) | needs roughly 10k–100k plays/month |

Translation: one decent puzzle game with modest traffic = coffee money. Three to five shipped games cross-linking each other, or one game that gets featured on a portal = real pocket money. Plan for a **portfolio**, not one lottery ticket.

## 2. The product

**Game:** 2048-style merge puzzle ("ArcPuzzels" is a placeholder — pick an ASO-friendly name before launch: short, unique, searchable).
Why this first: ~300 lines of core logic, no art pipeline needed (tiles are colored numbers), proven retention, and it's the fastest path to your first dollar. Variants/twists differentiate you from the thousands of clones.

Ideas for the twist (pick ONE): daily challenge seed (Wordle-style "everyone gets the same board"), undo-limited mode with rewarded-ad continue, or a themed skin system.

## 3. Stack — everything free

| Layer | Choice | Cost |
|---|---|---|
| Language | TypeScript | Free |
| Build/dev server | Vite | Free |
| Rendering | Plain DOM + CSS (puzzle games don't need an engine) | Free |
| Hosting | GitHub Pages (+ itch.io page) | Free |
| CI/CD | GitHub Actions (deploy on push to main) | Free |
| Analytics | GA4 + portal dashboards | Free |
| Art/SFX | Kenney.nl (CC0), jsfxr for sounds, Google Fonts | Free |
| Ads | Portal SDKs → Google AdSense later (see ladder below) | Free |
| PWA/offline | vite-plugin-pwa (add in week 2) | Free |

## 4. Architecture

```
Game/
├── PLAN.md                  ← this file
├── index.html               ← shell incl. reserved ad slots (top/bottom)
├── package.json
├── tsconfig.json
├── vite.config.ts           ← base './' so builds work on any host path
├── .github/workflows/deploy.yml   ← push to main = auto-deploy
├── public/favicon.svg
└── src/
    ├── main.ts              ← game loop, input (keyboard + swipe), state
    ├── styles.css
    ├── core/
    │   ├── board.ts         ← PURE logic: move/merge/spawn/win/lose (testable)
    │   └── storage.ts       ← safe localStorage wrapper
    ├── ui/
    │   └── renderer.ts      ← DOM rendering only, no game logic
    └── ads/
        └── adBridge.ts      ← THE IMPORTANT BIT ↓
```

**Ad abstraction (`src/ads/adBridge.ts`):** everything calls `ads.showInterstitial()` / `ads.showRewarded()` through one interface. Today it's a `NullAdProvider` (no-ops). When you get into CrazyGames/Poki/AdSense you write a small adapter per provider and flip an env var (`VITE_AD_PROVIDER=crazygames`). You never touch game code again. This is what makes one codebase shippable to every monetization channel.

## 5. Monetization ladder (do it in THIS order)

1. **Phase A — Game portals first (week 4).** Submit to **CrazyGames**, **GameDistribution**, **itch.io**. They bring traffic, serve the ads, handle advertisers, and pay you a monthly rev-share (typically ~50%+). This beats DIY AdSense at low traffic because portals solve the #1 problem: nobody knows your game exists.
2. **Phase B — Your own copy + AdSense (month 2–3).** Once the game gets steady organic traffic (>~1k visits/day), run it on GitHub Pages with **Google AdSense** banners in the reserved slots. Requirements to prep NOW:
   - AdSense account (18+, or a parent's)
   - A privacy policy page (required)
   - `non-personalized ads` fallback + consent message for EU users (Google UMP snippet, free)
3. **Phase C — Rewarded ads.** Highest eCPM format. "Watch ad → undo a move / keep playing after loss." Implement behind the same bridge; enable per-platform.

## 6. Four-week execution plan

**Week 1 — Core + juice.** Finish gameplay: animations (merge pop, slide), win/lose overlay, best-score persistence. Add sound (jsfxr). Playtest with 5 friends.
**Week 2 — Meta + mobile.** Swipe input polish, responsive layout, PWA (installable, offline), optional twist feature (daily seed). Reserve ad slots in layout now so ads never shift layout later.
**Week 3 — Ship-readiness.** Title/thumbnail/icon (the thumbnail sells the click — spend real time here), 20-second gameplay GIF, meta tags/OG image, QA on iOS Safari + Android Chrome, wire portal-ready ad adapter seam.
**Week 4 — Launch.**
- [ ] Push to GitHub → Pages live
- [ ] Upload build to itch.io
- [ ] Submit to CrazyGames + GameDistribution (they review in days–weeks)
- [ ] Create privacy-policy page
- [ ] GA4 installed
- [ ] Post gameplay clip to TikTok/Shorts/Reddit r/WebGames (free distribution)

## 7. Growth loop (this is where the money actually comes from)

- **Ship several small games**, each linking to the others ("More puzzles →") — portfolio compounding.
- Iterate on data: portals show plays/retention. Double down on whichever game holds players >3 min.
- One short vertical gameplay video per week costs nothing and is how web games pop off.
- Only chase AdSense/own-site traffic once portals prove demand.

## 8. KPIs to watch

Plays/day · avg session length · D1 return rate · ad impressions per play · (later) AdSense RPM.

## 9. Costs

Everything above: **$0**. The only future *optional* cost is a custom domain (~$10/year) once AdSense is live — it improves approval odds and branding. Never required.

## 10. Run it

```bash
npm install
npm run dev      # local dev server
npm run check    # FULL GATE: unit tests + type-check + production build
```

Rule for this project: every change must pass `npm run check` before it counts as done.

Deploy: create a GitHub repo, push, enable Pages → Source: "GitHub Actions". Every push to main auto-deploys.
