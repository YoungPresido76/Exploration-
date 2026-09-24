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

## M2 authoritative room slice

The current build now includes a native WebSocket room server with a 30 Hz authoritative simulation. Rooms accept up to four players, assign alternating red/blue teams, transition from lobby to warmup when full, validate sequenced input commands, simulate movement and firing on the server, resolve damage and respawns, emit snapshots, and persist periodic match events to Supabase when a service-role key is configured. The terrain is represented as a 4×4-cell grid with material and hit points; shot impacts can remove cells and are included in the event stream.

The browser client connects to `/ws`, sends input intent at 30 Hz, displays the latest server tick and room state, and uses the server health/player snapshot for the HUD. The current Phaser visual is still the M0 training-range renderer; the next client pass will replace its local visual state with interpolated remote player and terrain state.

## Next build slices

The next slices are client-side prediction and reconciliation against the authoritative snapshot, remote-player interpolation, real four-player lobby/ready UI, lane switching, character-specific supplied sprites and projectiles, and a production room deployment. Supabase remains persistence and analytics rather than the simulation transport.

The supplied GrafxKid CC0 license remains in the asset archive and must stay with any imported asset expansion.
