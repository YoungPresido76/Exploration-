# Chillverse — 3D Exploration World: Planning Doc

Status: **PLANNING — not yet approved for build**
This file is self-contained. It carries every fact about the existing codebase
needed to scope and build this feature without re-opening the repo. Update
the checkboxes below as phases complete; this is the living tracker.

---

## 1. Goal

Turn the existing 2D, click-a-dot "Exploration" feature into a real 3D world
the player walks/looks around in — while keeping the underlying idle-game
mechanics (timed chamber runs, energy, XP, artifacts) completely unchanged
on the backend. Longer-term, the same walkable space should be able to grow
into a lightweight social hub without a rebuild.

---

## 2. What already exists (extracted from `chillverse-main.zip`)

### 2.1 Stack
- React + TypeScript + Vite, Tailwind, Supabase backend, Vercel hosting.
- **`@react-three/fiber` ^8.17.10`, `@react-three/drei` ^9.114.3`, `three` ^0.169.0` are already installed and used** — this is not a new dependency.
- One existing r3f scene: `src/features/exploration/ControllerScene.tsx` — loads a `.glb` via `useGLTF`, normalizes it into a bounding box, drags-to-rotate with pointer state kept in a `ref` (not React state) so dragging never triggers re-renders, uses `<Environment>` + `<ContactShadows>` from drei, fades in via scroll progress. **This is the house style to follow** for any new r3f code: refs for per-frame mutable state, `useFrame` for animation, normalize imported models to a target size rather than trusting authored scale.
- Only 3D asset currently shipped: `public/models/ps5-controller.glb`. **No environment or character models exist yet** — these need to be sourced or generated before Phase 1 can start.
- Design language: dark gamified theme, neon violet/cyan/orange accents, font Outfit (UI) + Space Mono (numbers/mono bits).

### 2.2 Known infra constraint — asset budget matters
A code comment in `src/features/impostor/Scene.tsx` states the org is **over its Supabase cached-egress quota with a hard Fair Use date**, which is *why* that game's scenery is CSS instead of images/sprites. This directly affects the 3D world:
- glTF/GLB models must be **Draco/Meshopt-compressed**, textures kept small (prefer 512–1024px, compressed formats like KTX2/Basis where the pipeline supports it).
- Serving models from `/public` (bundled, CDN-cached by Vercel) is safer than pulling large binary assets from Supabase Storage on every load, given the egress situation.
- Favor procedural/low-poly stylized environments over photoreal asset packs — smaller downloads, matches the existing gamified aesthetic, and is cheaper to produce solo.

### 2.3 The current Exploration feature (what it does today)
Files: `src/features/exploration/{Exploration.tsx, RegionMap.tsx, explorationMaps.ts, fieldLog.ts, ControllerScene.tsx}`

**Data model (`explorationMaps.ts`):**
```ts
export interface Chamber {
  id: number
  name: string
  baseTimeHours: number
  xpReward: number
  artifact: boolean
  energyCost: number   // energy spent to dispatch an expedition here
  x: number             // % position on the 2D map canvas, 0–100
  y: number
}

export interface ExplorationMap {
  id: number
  name: string
  tier: string          // 'I' | 'II' | 'III' | 'IV'
  xpRequired: number     // XP gate to unlock this region
  image: string          // flat background art, Supabase Storage URL
  artifactLocation: string  // matches artifacts.location in DB
  entry: { x: number; y: number }  // where the traveller marker starts
  chambers: Chamber[]    // always 5 per region today
}

export interface ChamberState {
  status: 'idle' | 'running' | 'done'
  startedAt?: number
  durationMs?: number
  artifactFound?: boolean
}
```

**The four regions today** (`MAPS` array — tier, name, chamber count, energy costs
all defined client-side in this file, not in the DB):
1. **Greenfields** (Tier I, xpRequired 0) — 5 chambers, energy 30–80
2. **Crystal Lake** (Tier II, xpRequired 31,500) — 5 chambers, energy 45–110
3. **Under World** (Tier III, xpRequired 94,500) — 5 chambers, energy 60–140
4. **The Void** (Tier IV, xpRequired 262,500) — 5 chambers, energy 80–175

Tier colors: `{ I: '#3ecf8e', II: '#4f8ef7', III: '#9b6dff', IV: '#f5c542' }`

**Rules that must not change:**
- Chambers unlock **sequentially** within a region (chamber N+1 needs N done); regions unlock via both an XP gate *and* the previous region being fully cleared.
- A chamber run takes real wall-clock hours (`baseTimeHours`, currently 5h flat) — **this is an idle/asynchronous mechanic, not real-time player movement.** The player dispatches an expedition, then it resolves hours later whether they're online or not.
- Progress is deliberately shown **without numbers** — no percentage, no ETA — only spatial/vague status text (`'Departing'`, `'En route'`, `'Deep in the interior'`, `'Nearing the site'`).
- Energy: `MAX_ENERGY = 200`, refills server-side (rate not exposed to the client) — read via `get_exploration_energy` RPC, spent via `spend_exploration_energy` RPC.

**Backend surface used (all pre-existing, do not need to change for a v1 3D reskin):**
- Table: `exploration_chamber_runs` — read/inserted/updated for run lifecycle.
- Table: `player_artifacts`, `artifacts` — artifact unlocks, joined for display.
- Table: `user_inventory` — items granted from chamber completion.
- RPC: `get_exploration_energy(p_user_id)`, `spend_exploration_energy(...)`.
- RPC: `award_xp(p_user_id, p_xp)`.
- Realtime: a presence channel `user-activity:{userId}` is already tracked elsewhere in `Exploration.tsx` (`supabase.channel(...).track(...)`) — **this is the existing precedent for "who's online," useful if multiplayer is added later.**

**Current UI (`RegionMap.tsx`):** one flat region image, 5 chamber dots placed at
authored `x/y` percentages, a route line connecting `entry → chamber1 → … → chamber5`,
a traveller marker (with the player's equipped avatar image inside it) that
lerps along the active leg based on elapsed time, fog-of-war on node names
(only reachable chambers show their real name), a bottom sheet for the
selected chamber (name, XP, energy cost, Explore/Locked/Running button).

### 2.4 What a 3D version needs to preserve
The 3D world is a **presentation-layer replacement for `RegionMap.tsx` only**.
`Exploration.tsx` (data fetching, run lifecycle, energy spend, XP award) and
the whole Supabase surface above stay as-is for v1. The 3D scene just needs
to expose the same inputs/outputs `RegionMap` currently does:
- Props in: `map`, `chamberStates`, `energy`, `loadingRuns`, `avatarUrl`.
- Callback out: `onExplore(chamber)`, `onBack()`.

---

## 3. The two directions, and how they combine

**Option A — 3D-ify Exploration itself.** Same 4 regions/20 chambers/energy
system, reskinned as a real 3D environment instead of a flat image with dots.
Zero backend changes. Lowest risk, fastest to ship, immediately makes the
existing feature feel dramatically better.

**Option B — A separate persistent 3D hub.** A shared social space (a "town square"),
decoupled from the chamber/energy grind — for hanging out, maybe seeing other
players, cosmetic display of artifacts/rank, entry points into other games.
Bigger scope, needs new backend work (presence, position sync), no existing
data model to build on.

**Recommendation: build A first, architect it so it can grow into B.**
Concretely: each region becomes a real walkable 3D space (not just a
backdrop) that the player's avatar can freely roam on foot, independent of
the timed expedition mechanic underneath. That single decision gets you:
- Option A's win immediately (chambers become actual 3D locations you walk up to).
- A natural seam for Option B later — the same region scenes could later host
  other players' avatars via the presence-channel pattern that already exists
  (`user-activity:{userId}`), with zero rework of the terrain/asset pipeline.
- No premature multiplayer complexity now, since that question is still open.

---

## 4. Recommendations on the open questions

### 4.1 Camera / movement — recommended: free-roam third-person, idle-game-aware
Given the constraints above (5-hour async runs, mobile-friendly audience,
existing "vague progress" design philosophy), a literal WASD/joystick
**free-roam third-person character** exploring the region on foot is the
best fit — but it controls *exploration of the space*, not the *expedition
itself*:
- Walking up to a chamber node opens the same bottom-sheet interaction that
  exists today (inspect → dispatch expedition), unchanged in substance.
- Once dispatched, the run keeps resolving asynchronously in the background
  exactly as it does now (hours of real time) — the 3D world does **not**
  need to simulate the journey in real-time. A simple ambient touch (a
  glowing trail toward the active chamber, or a small automated "expedition
  marker" drifting along the path, matching today's spatial-only progress
  philosophy) is enough to represent it visually.
- On mobile, this becomes a virtual joystick + look-drag, which the target
  audience (Lagos/Nigeria-based social gaming platform) will be more
  comfortable with than fiddly orbit-camera controls.

Fallback if a full character controller proves too much scope for Phase 1:
degrade gracefully to **orbit-camera + click-to-move** (closer to today's
UX, much less code — no character rig, no collision/physics needed). This
is called out explicitly as **Phase 1a vs 1b** below so the smallest version
can ship first.

### 4.2 Multiplayer — recommended: defer, but don't foreclose it
Build solo-only through Phase 3. The presence-channel pattern already used
for `user-activity:{userId}` means adding "see other avatars" later is a
Realtime-subscription addition, not an architecture change — so deferring
costs nothing structurally. Revisit after Phase 3 ships and the walkable
region proves out.

---

## 5. Phased plan (smallest/fastest first)

### Phase 0 — Prove the concept (single region, no character)
- [ ] Pick/build one low-poly environment (start with Greenfields, Tier I) as a `.glb`, Draco-compressed, served from `/public/models/`.
- [ ] Place the 5 existing chamber coordinates as 3D markers/props in the scene (reuse `explorationMaps.ts` `x/y`, mapped onto a ground plane or terrain height data).
- [ ] Static orbit camera (drei `<OrbitControls>` or similar), no movement yet — just prove the region reads well in 3D and chamber nodes are clickable (raycasting) and open the existing bottom sheet.
- [ ] Confirm bundle size / load time is acceptable on a mid-range mobile device before going further.

### Phase 1 — Movement
- [ ] **1a (fallback):** click-to-move / orbit camera, avatar glides to clicked chamber.
- [ ] **1b (target):** third-person free-roam character — WASD/virtual joystick, camera-follow rig, basic ground collision (no physics engine needed, height-map or simple raycast-to-ground is enough).
- [ ] Wire `onExplore`/`onBack` callbacks to match `RegionMap.tsx`'s existing contract so `Exploration.tsx` doesn't need to change.
- [ ] Fog-of-war parity: unreached chambers still render as unnamed/obscured in 3D (e.g. shrouded geometry, no label) matching current behavior.

### Phase 2 — All four regions
- [ ] Author/source distinct environment art per tier (Greenfields → Crystal Lake → Under World → The Void), reusing `TIER_COLORS` as the lighting/fog palette per region.
- [ ] Ambient representation of an active expedition (drifting marker/trail) per the async-run note in 4.1.
- [ ] Replace `RegionMap.tsx` usage inside `Exploration.tsx` with the new 3D component; keep `RegionMap.tsx` in place (or delete) only once the 3D version is fully at parity.

### Phase 3 — Polish
- [ ] Per-tier ambient audio/SFX, particle accents matching each region's theme.
- [ ] Avatar reads the player's actual equipped avatar (parity with today's marker showing `avatarUrl`).
- [ ] Performance pass: LOD/culling if needed, texture atlasing, mobile frame-rate target (aim ≥30fps on mid-range Android).

### Phase 4 — Optional, future (multiplayer hub)
- [ ] Only revisit after Phase 3 ships. Add Realtime presence (pattern already exists) to show other players' avatars moving in the same region.
- [ ] Decide then whether this stays scoped to Exploration regions or grows into a separate hub space (Option B).

---

## 6. Open items to resolve before Phase 0 can actually start
- **Asset sourcing**: are environment/character models being bought (asset store), generated (AI 3D generation), or hand-modeled? This determines Phase 0 timeline more than anything else.
- **Character rig**: do we need a custom avatar model, or can the character be a simple stylized placeholder (capsule/low-poly figure) for Phase 0–1 while art is sourced?
- **Target devices**: confirm minimum spec (older Android phones are a real constraint for a Lagos-based audience) — this affects poly-count/texture budgets from day one.
- **Terrain interaction**: flat plane with painted paths (cheapest, fastest) vs. actual sculpted terrain with elevation (matches the moodier "Deep Hollow"/"Void Sanctum" chamber names better, costs more).
