# Carom

Carom is a browser-based top-down paddle duel where paddle motion becomes spin. Rally the ball through the two orange banks, shape clever angles, and win the match by two points.

## Install and run

```sh
npm ci
npm run dev
```

Open the local Vite URL. To produce the static site, run `npm run build`; the complete site is written to `dist/` and can be served from any static web host.

## Controls

- Solo: `W` / `S` move the left paddle. The right paddle is controlled by the AI.
- Versus: `W` / `S` move the left paddle; `Arrow Up` / `Arrow Down` move the right paddle.
- `Enter` or `Space` selects a menu item; `P` pauses; `Escape` backs out or pauses; `M` toggles sound.

Move a paddle as it strikes the ball to add curve. The top and bottom walls and the orange obstacles preserve speed, while paddle hits accelerate the rally.
