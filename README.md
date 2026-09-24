# Pixel Arena

Pixel Arena is a real-time 2v2 side-view / 2.5D shooter foundation for desktop and mobile browsers. This repository replaces the former turn-based IMPACT// prototype.

## Current milestone: M0–M1 foundation

The project now contains a React + Phaser client shell, a shared character and weapon domain package, a mobile-aware HUD, a playable local training range with movement, aiming, hitscan firing, cover, targets, and event feedback, plus a Node server boundary with Zod-validated input commands. The client is configured for the new Supabase project and can read room state from the `matches` table.

Supabase project: `Pixel Arena` (`ktophzsjvpvcvujqymqw`) in EU West.

## Architecture

```text
Browser: React shell + Phaser arena
        ↓ intent commands
Authoritative server: Node / Colyseus-ready room boundary
        ↓ persistence
Supabase: profiles, matches, match_players, match_events
```

The server remains the source of truth for movement, hit resolution, cooldowns, and terrain destruction. The client is allowed to predict local movement later, but it never becomes authoritative.

## Run locally

```bash
pnpm install
pnpm check
pnpm test
pnpm dev
```

The server boundary can be started separately with `pnpm server`. Copy `.env.example` to `.env.local` for local configuration; never place a Supabase service-role key in frontend variables.

## Next build slices

The next slices are the authoritative 30 Hz Colyseus room, 4×4 terrain destruction grid, client prediction/reconciliation, character-specific supplied sprites and projectiles, lane switching, respawn, and a four-player room flow. The Supabase schema is ready to persist room metadata and match events without putting database writes on the simulation tick.

The supplied GrafxKid CC0 license remains in the asset archive and must stay with any imported asset expansion.
