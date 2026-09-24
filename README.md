# IMPACT//

IMPACT// is a standalone browser prototype for a fast 2v2 turn-based arcade artillery game. It is currently intentionally offline and self-contained so the combat loop can be playtested before adding an external host or multiplayer service.

## Run locally

```bash
pnpm install
pnpm dev
```

Open the Vite URL shown in the terminal. Build validation is available with:

```bash
pnpm check
pnpm build
```

## Prototype controls

- **Mouse:** aim on the battlefield and click to fire.
- **Space:** fire the selected weapon.
- **1 / 2 / 3:** select Cannon, Cluster, or Wormhole.
- **Q:** deploy the Wormhole special.
- **Reset:** restart the current match.
- The other three players are automated for solo testing.

## Included loop

The standalone build includes a 2v2 local match, turn timer, automated turns, three weapons, ballistic projectile travel, destructible cover, team health, hit feedback, eliminations, victory state, and rematch flow. The art direction uses selected assets from the supplied GrafxKid packs without letting the packs dictate the game identity.

## Repository naming

The GitHub repository is being renamed from `Exploration-` to `IMPACT--`. GitHub repository names cannot contain the `//` characters used by the in-game title, so `IMPACT--` is the closest valid repository representation. The product title remains exactly **IMPACT//**.

## Later Chillverse integration

The current build does not depend on `https://chillverse.com.ng/`. Once the standalone loop is approved, the next integration phase can expose the game as an embeddable module with a documented launch contract, parent-window messaging, resize handling, and any required account/session bridge. That work is intentionally deferred until the core game is stable.

## Blueprint asset implementation

The current build uses the supplied GrafxKid ecosystem as its visual anchor. It includes four character identities with distinct attacks: Toggle poison bubbles, Tracy crossbow arrows, Percy fireballs, and Angie seed clusters. It also uses the supplied Grassland, Autumn Forest, Tropics, and Winter World backgrounds and terrain sheets, plus a Cave mode built from the supplied universal rock, blocks, lava, and destruction-compatible tiles. The Mini FX, Items & UI pack supplies explosion, dust, sparkle, health, cursor, emote, and pickup assets.

The combat loop now connects character identity to projectile silhouette and impact behavior. Terrain rotation changes the visible biome and material note, while impact resolution emits material-aware debris and updates destructible cover. The game remains a standalone local 2v2 test with automated opponents; the real-time Colyseus server and Chillverse embedding remain a separate integration phase.
