import { describe, expect, it } from "vitest";
import type { InitApi, UpdateApi } from "@clockwyrks/simple-2d";
import { game } from "./game";

const initApi = {
  input: { register: () => {}, layout: () => null },
  audio: { define: () => {}, load: async () => {} },
  assets: {
    loadImage: async () => ({}) as ImageBitmap,
    loadAudio: async () => ({}) as AudioBuffer,
    load: async () => new Blob(),
    resolve: (p: string) => p,
  },
  diagnostics: { register: () => {} },
  events: { on: () => () => {} },
  viewport: () => ({
    width: 1280,
    height: 720,
    scale: 1,
    offsetX: 0,
    offsetY: 0,
  }),
} as unknown as InitApi<never>;

const updateApi = (pressed: string[] = []) =>
  ({
    input: {
      value: () => 0,
      pressed: (name: string) => pressed.includes(name),
      pointer: () => ({
        x: 0,
        y: 0,
        down: false,
        device: "mouse",
        buttons: [],
      }),
      pointerPressed: () => false,
      pointerReleased: () => false,
      pointerSamples: () => [],
      pointerContacts: () => [],
      wheel: () => ({ x: 0, y: 0 }),
    },
    audio: {
      play: () => {},
      loop: () => {},
      stop: () => {},
      looping: () => false,
      setMuted: () => {},
      muted: () => false,
    },
    frame: () => ({ count: 0, timeMs: 0, lastDeltaMs: 16 }),
    viewport: () => ({
      width: 1280,
      height: 720,
      scale: 1,
      offsetX: 0,
      offsetY: 0,
    }),
  }) as unknown as UpdateApi;

describe("Carom simulation", () => {
  it("initializes a complete title state and debug surface", async () => {
    const [state, debug] = await game.initialize(initApi);
    expect(state.screen).toBe("title");
    expect(state.ball?.held).toBe(true);
    expect(debug.snapshot(state).version).toBe(1);
    expect(debug.menuItemRect(state, 0)).toEqual({
      x: 420,
      y: 336,
      w: 440,
      h: 48,
    });
  });

  it("serves after the countdown and advances simulation time", async () => {
    const [initial, debug] = await game.initialize(initApi);
    const staged = debug.setScreen(
      debug.setBallHoldTimer(initial, 0.01),
      "countdown",
    );
    const next = game.update(staged, updateApi(), 0.02);
    expect(next.simTime).toBeCloseTo(0.02);
    expect(next.screen).toBe("playing");
    expect(next.ball?.held).toBe(false);
    expect(Math.hypot(next.ball?.vx ?? 0, next.ball?.vy ?? 0)).toBeCloseTo(520);
  });

  it("poses the ball and resolves a wall bounce", async () => {
    const [initial, debug] = await game.initialize(initApi);
    let state = debug.setScreen(initial, "playing");
    state = debug.setBallPosition(state, 640, 20);
    state = debug.setBallVelocity(state, 0, -300);
    const next = game.update(state, updateApi(), 0.05);
    expect(next.ball?.vy).toBeGreaterThan(0);
    expect(next.ball?.y).toBeGreaterThanOrEqual(11);
  });
});
