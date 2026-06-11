# BuraTS

Online multiplayer **Bura** — 2v2 teams, 36-card deck.

## Stack

- **client/** — React 19 + TypeScript + Vite, socket.io-client, Google sign-in (`@react-oauth/google`)
- **server/** — Node + TypeScript, Express + Socket.IO. All game rules are enforced server-side; clients only ever receive their own hand and counts for everything hidden.

## Running locally

### Server

```sh
cd server
npm install
npm run dev        # nodemon + tsx on port 5000 (override with PORT)
```

The server console accepts commands (`help`, `clients`, `rooms`, `<roomID>`, `clear`, `exit`).

### Client

```sh
cd client
npm install
cp .env.example .env   # fill in your values
npm run dev
```

Environment variables (see [client/.env.example](client/.env.example)):

| Variable | Purpose |
| --- | --- |
| `VITE_GOOGLE_CLIENT_ID` | Google OAuth client ID used by the login button |
| `VITE_RENDER_URL` | Socket.IO server URL (defaults to `http://localhost:5000` when unset) |

## Tests

```sh
cd server
npm test           # vitest — game rules, winner determination, davi, state views
```

## Gameplay notes

- Rooms hold exactly 4 players in two teams; partners sit across (seats 0 & 2 vs 1 & 3).
- A round's winning team scores the current multiplier; first team to **11 points** wins the game.
- **Bura**: five trump cards played at once instantly wins the round.
- **Davi**: the player on turn may offer to raise the stake before playing; the challenged player accepts, declines (forfeits at the current stake) or challenges back. Levels use the traditional words (davi, se, chari, … yazdahi).
- If a player disconnects (or leaves) mid-game the game pauses for 2 minutes; if they don't return, the game is aborted.

## Production build

```sh
cd server && npm run build && npm start   # compiles to dist/
cd client && npm run build                # static bundle in dist/
```
