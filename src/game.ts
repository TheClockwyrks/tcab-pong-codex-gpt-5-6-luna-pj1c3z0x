import type {
  Game,
  InitApi,
  RenderApi,
  UpdateApi,
} from "@clockwyrks/simple-2d";
import type { DeepReadonly } from "ts-essentials";
import * as C from "./constants";

export type Screen =
  "title" | "howto" | "countdown" | "playing" | "paused" | "matchover";
export type Mode = "solo" | "versus";
export type Side = "left" | "right";
export interface PaddleState {
  readonly cy: number;
  readonly vy: number;
  readonly driven: boolean;
  readonly drivenVy: number;
}
export interface AiState {
  readonly tracking: boolean;
  readonly movement: boolean;
}
export interface TrailSample {
  readonly x: number;
  readonly y: number;
  readonly t: number;
}
export interface BallState {
  readonly x: number;
  readonly y: number;
  readonly vx: number;
  readonly vy: number;
  readonly spin: number;
  readonly held: boolean;
  readonly holdTimer: number;
  readonly serveSign: 1 | -1;
  readonly trail: readonly TrailSample[];
}
export interface ObstacleState {
  readonly index: number;
  readonly cx: number;
  readonly cy: number;
}
export interface CaromState {
  readonly screen: Screen;
  readonly mode: Mode;
  readonly menuIndex: number;
  readonly titleIndex: number;
  readonly resumeScreen: "countdown" | "playing";
  readonly score: { readonly p1: number; readonly p2: number };
  readonly winner: Side | null;
  readonly paddles: { readonly left: PaddleState; readonly right: PaddleState };
  readonly ai: AiState;
  readonly receiver: Side;
  readonly ball: BallState | null;
  readonly obstacles: readonly ObstacleState[];
  readonly simTime: number;
  readonly muted: boolean;
}
export interface CaromDebugApi {
  readonly version: number;
  clearWorld(s: DeepReadonly<CaromState>): CaromState;
  spawnBall(s: DeepReadonly<CaromState>): CaromState;
  spawnObstacle(s: DeepReadonly<CaromState>, i: number): CaromState;
  reset(s: DeepReadonly<CaromState>): CaromState;
  reconcile(s: DeepReadonly<CaromState>): CaromState;
  setScreen(s: DeepReadonly<CaromState>, v: Screen): CaromState;
  setMode(s: DeepReadonly<CaromState>, v: Mode): CaromState;
  setMenuIndex(s: DeepReadonly<CaromState>, v: number): CaromState;
  setTitleIndex(s: DeepReadonly<CaromState>, v: number): CaromState;
  setResumeScreen(
    s: DeepReadonly<CaromState>,
    v: "countdown" | "playing",
  ): CaromState;
  setScore(s: DeepReadonly<CaromState>, p1: number, p2: number): CaromState;
  setWinner(s: DeepReadonly<CaromState>, v: Side | null): CaromState;
  setReceiver(s: DeepReadonly<CaromState>, v: Side): CaromState;
  setPaddleCy(s: DeepReadonly<CaromState>, side: Side, v: number): CaromState;
  setPaddleVy(s: DeepReadonly<CaromState>, side: Side, v: number): CaromState;
  setPaddleDriven(
    s: DeepReadonly<CaromState>,
    side: Side,
    v: boolean,
  ): CaromState;
  setBallPosition(
    s: DeepReadonly<CaromState>,
    x: number,
    y: number,
  ): CaromState;
  setBallVelocity(
    s: DeepReadonly<CaromState>,
    x: number,
    y: number,
  ): CaromState;
  setBallSpin(s: DeepReadonly<CaromState>, v: number): CaromState;
  setBallHeld(s: DeepReadonly<CaromState>, v: boolean): CaromState;
  setBallHoldTimer(s: DeepReadonly<CaromState>, v: number): CaromState;
  setBallServeSign(s: DeepReadonly<CaromState>, v: 1 | -1): CaromState;
  drawBallServeSign(s: DeepReadonly<CaromState>): CaromState;
  setAiTracking(s: DeepReadonly<CaromState>, v: boolean): CaromState;
  setAiMovement(s: DeepReadonly<CaromState>, v: boolean): CaromState;
  setMuted(s: DeepReadonly<CaromState>, v: boolean): CaromState;
  snapshot(s: DeepReadonly<CaromState>): Record<string, unknown>;
  menuItemRect(
    s: DeepReadonly<CaromState>,
    i: number,
  ): { x: number; y: number; w: number; h: number } | null;
}
export const BACKGROUND = "#07111f";
const clamp = (v: number, a: number, b: number) => Math.max(a, Math.min(b, v));
const coin = () => (Math.random() < 0.5 ? (-1 as const) : (1 as const));
const ball = (): BallState => ({
  x: C.FIELD_CX,
  y: C.FIELD_CY,
  vx: 0,
  vy: 0,
  spin: 0,
  held: true,
  holdTimer: C.HOLD_TIME,
  serveSign: coin(),
  trail: [],
});
const obs = () =>
  C.OBSTACLE_CENTERS.map((p, index) => ({ index, cx: p.x, cy: p.y }));
const pad = (): PaddleState => ({
  cy: C.FIELD_CY,
  vy: 0,
  driven: false,
  drivenVy: 0,
});
const title = (muted = false): CaromState => ({
  screen: "title",
  mode: "solo",
  menuIndex: 0,
  titleIndex: 0,
  resumeScreen: "playing",
  score: { p1: 0, p2: 0 },
  winner: null,
  paddles: { left: pad(), right: pad() },
  ai: { tracking: true, movement: true },
  receiver: "left",
  ball: ball(),
  obstacles: obs(),
  simTime: 0,
  muted,
});
const match = (s: DeepReadonly<CaromState>, mode: Mode): CaromState => ({
  ...s,
  screen: "countdown",
  mode,
  menuIndex: 0,
  resumeScreen: "playing",
  score: { p1: 0, p2: 0 },
  winner: null,
  receiver: "left",
  paddles: { left: pad(), right: pad() },
  ball: ball(),
  obstacles: obs(),
});
const move = (p: PaddleState, v: number, dt: number): PaddleState => {
  const cy = clamp(p.cy + v * dt, C.PADDLE_MIN_CY, C.PADDLE_MAX_CY);
  return { ...p, cy, vy: dt && cy !== p.cy ? (cy - p.cy) / dt : 0 };
};
const menu = (screen: Screen) =>
  screen === "title"
    ? C.TITLE_ITEMS
    : screen === "howto"
      ? ["BACK TO TITLE"]
      : screen === "paused"
        ? C.PAUSE_ITEMS
        : C.MATCHOVER_ITEMS;
const rect = (screen: Screen, i: number) =>
  screen === "playing" ||
  screen === "countdown" ||
  i < 0 ||
  i >= menu(screen).length
    ? null
    : { x: 420, y: 336 + i * 64, w: 440, h: 48 };
const requireBall = (s: DeepReadonly<CaromState>) => {
  if (!s.ball) throw new Error("Carom debug: no ball is present");
  return s.ball;
};
type Hit = "paddle" | "wall" | "obstacle" | null;
function hit(
  b: BallState,
  r: { x0: number; y0: number; x1: number; y1: number },
  kind: "left" | "right" | "obstacle",
  p?: PaddleState,
): { b: BallState; e: Hit } {
  const d = [
    b.x - (r.x0 - C.BALL_R),
    r.x1 + C.BALL_R - b.x,
    b.y - (r.y0 - C.BALL_R),
    r.y1 + C.BALL_R - b.y,
  ];
  if (!(
    b.x > r.x0 - C.BALL_R &&
    b.x < r.x1 + C.BALL_R &&
    b.y > r.y0 - C.BALL_R &&
    b.y < r.y1 + C.BALL_R
  ))
    return { b, e: null };
  let f = 0;
  for (let i = 1; i < 4; i++) if (d[i] < d[f]) f = i;
  let n = { ...b };
  if (f === 0) n = { ...n, x: r.x0 - C.BALL_R, vx: b.vx > 0 ? -b.vx : b.vx };
  if (f === 1) n = { ...n, x: r.x1 + C.BALL_R, vx: b.vx < 0 ? -b.vx : b.vx };
  if (f === 2) n = { ...n, y: r.y0 - C.BALL_R, vy: b.vy > 0 ? -b.vy : b.vy };
  if (f === 3) n = { ...n, y: r.y1 + C.BALL_R, vy: b.vy < 0 ? -b.vy : b.vy };
  if ((kind === "left" || kind === "right") && f < 2 && p) {
    const sp = Math.min(Math.hypot(b.vx, b.vy) * C.SPEED_MULT, C.SPEED_CAP),
      a = clamp((b.y - p.cy) / C.PADDLE_HALF, -1, 1) * C.MAX_BOUNCE_ANGLE,
      dir = kind === "left" ? 1 : -1;
    n = {
      ...n,
      x: kind === "left" ? C.P1_X1 + C.BALL_R : C.P2_X0 - C.BALL_R,
      vx: dir * sp * Math.cos(a),
      vy: sp * Math.sin(a),
      spin: clamp(
        b.spin + p.vy * C.SPIN_FROM_PADDLE,
        -C.SPIN_CLAMP,
        C.SPIN_CLAMP,
      ),
    };
    return { b: n, e: "paddle" };
  }
  return { b: n, e: kind === "obstacle" ? "obstacle" : "wall" };
}

export const game: Game<CaromState, CaromDebugApi> = {
  initialize(api: InitApi<CaromState>) {
    for (const a of C.ACTIONS)
      api.input.register(a, { keys: [...C.BINDINGS[a]] });
    api.audio.define(C.CUES.paddleHit, {
      wave: "square",
      freq: 220,
      freqTo: 440,
      gain: 0.08,
      durationMs: 65,
    });
    api.audio.define(C.CUES.wallBounce, {
      wave: "triangle",
      freq: 300,
      freqTo: 180,
      gain: 0.06,
      durationMs: 50,
    });
    api.audio.define(C.CUES.obstacleBounce, {
      freq: 520,
      freqTo: 260,
      gain: 0.06,
      durationMs: 70,
    });
    api.audio.define(C.CUES.score, {
      wave: "sawtooth",
      freq: 180,
      freqTo: 620,
      gain: 0.08,
      durationMs: 180,
    });
    for (const [n, f] of [
      ["screen", (s: CaromState) => s.screen],
      ["mode", (s: CaromState) => s.mode],
      ["score", (s: CaromState) => `${s.score.p1} - ${s.score.p2}`],
      [
        "ball",
        (s: CaromState) =>
          s.ball ? `${s.ball.x.toFixed(0)},${s.ball.y.toFixed(0)}` : "none",
      ],
      [
        "velocity",
        (s: CaromState) =>
          s.ball ? `${s.ball.vx.toFixed(0)},${s.ball.vy.toFixed(0)}` : "none",
      ],
      [
        "speed",
        (s: CaromState) => (s.ball ? Math.hypot(s.ball.vx, s.ball.vy) : 0),
      ],
      ["spin", (s: CaromState) => s.ball?.spin ?? 0],
      [
        "p1",
        (s: CaromState) =>
          `${s.paddles.left.cy.toFixed(0)} / ${s.paddles.left.vy.toFixed(0)}`,
      ],
      [
        "p2",
        (s: CaromState) =>
          `${s.paddles.right.cy.toFixed(0)} / ${s.paddles.right.vy.toFixed(0)}`,
      ],
    ] as const)
      api.diagnostics.register(n, f);
    const pose = (
      s: DeepReadonly<CaromState>,
      f: (b: BallState) => BallState,
    ): CaromState => ({ ...s, ball: f(requireBall(s)) });
    const debug: CaromDebugApi = {
      version: C.CAROM_DEBUG_VERSION,
      clearWorld: (s) => ({ ...s, ball: null, obstacles: [] }),
      spawnBall: (s) => ({ ...s, ball: ball() }),
      spawnObstacle: (s, i) => {
        if (i !== 0 && i !== 1)
          throw new Error("Carom debug: invalid obstacle index");
        return {
          ...s,
          obstacles: [
            ...s.obstacles.filter((o) => o.index !== i),
            {
              index: i,
              cx: C.OBSTACLE_CENTERS[i].x,
              cy: C.OBSTACLE_CENTERS[i].y,
            },
          ].sort((a, b) => a.index - b.index),
        };
      },
      reset: (s) => title(s.muted),
      reconcile: (s) => ({ ...s }),
      setScreen: (s, v) => ({ ...s, screen: v }),
      setMode: (s, v) => ({ ...s, mode: v }),
      setMenuIndex: (s, v) => ({ ...s, menuIndex: v }),
      setTitleIndex: (s, v) => ({ ...s, titleIndex: v }),
      setResumeScreen: (s, v) => ({ ...s, resumeScreen: v }),
      setScore: (s, p1, p2) => ({ ...s, score: { p1, p2 } }),
      setWinner: (s, v) => ({ ...s, winner: v }),
      setReceiver: (s, v) => ({ ...s, receiver: v }),
      setPaddleCy: (s, side, v) => ({
        ...s,
        paddles: { ...s.paddles, [side]: { ...s.paddles[side], cy: v } },
      }),
      setPaddleVy: (s, side, v) => ({
        ...s,
        paddles: { ...s.paddles, [side]: { ...s.paddles[side], drivenVy: v } },
      }),
      setPaddleDriven: (s, side, v) => ({
        ...s,
        paddles: { ...s.paddles, [side]: { ...s.paddles[side], driven: v } },
      }),
      setBallPosition: (s, x, y) => pose(s, (b) => ({ ...b, x, y })),
      setBallVelocity: (s, vx, vy) => pose(s, (b) => ({ ...b, vx, vy })),
      setBallSpin: (s, v) => pose(s, (b) => ({ ...b, spin: v })),
      setBallHeld: (s, v) => pose(s, (b) => ({ ...b, held: v })),
      setBallHoldTimer: (s, v) => pose(s, (b) => ({ ...b, holdTimer: v })),
      setBallServeSign: (s, v) => pose(s, (b) => ({ ...b, serveSign: v })),
      drawBallServeSign: (s) => pose(s, (b) => ({ ...b, serveSign: coin() })),
      setAiTracking: (s, v) => ({ ...s, ai: { ...s.ai, tracking: v } }),
      setAiMovement: (s, v) => ({ ...s, ai: { ...s.ai, movement: v } }),
      setMuted: (s, v) => ({ ...s, muted: v }),
      snapshot: (s) => ({
        version: 1,
        screen: s.screen,
        mode: s.mode,
        menuIndex: s.menuIndex,
        titleIndex: s.titleIndex,
        resumeScreen: s.resumeScreen,
        score: { ...s.score },
        winner: s.winner,
        muted: s.muted,
        paddles: { left: { ...s.paddles.left }, right: { ...s.paddles.right } },
        ai: { ...s.ai },
        receiver: s.receiver,
        ball: s.ball
          ? { ...s.ball, speed: Math.hypot(s.ball.vx, s.ball.vy) }
          : null,
        obstacles: s.obstacles.map((o) => ({ ...o })),
        simTime: s.simTime,
      }),
      menuItemRect: (s, i) => rect(s.screen, i),
    };
    return [title(false), debug];
  },
  update(state, api: UpdateApi, dt) {
    let s: CaromState = {
      ...state,
      simTime: state.simTime + dt,
      muted: api.audio.muted(),
    };
    const i = api.input;
    if (i.pressed("mute")) {
      api.audio.setMuted(!api.audio.muted());
      s = { ...s, muted: api.audio.muted() };
    }
    const nav = (n: number) => {
      const u = i.pressed("p1-up") || i.pressed("p2-up"),
        d = i.pressed("p1-down") || i.pressed("p2-down");
      return u && !d
        ? (s.menuIndex + n - 1) % n
        : d && !u
          ? (s.menuIndex + 1) % n
          : s.menuIndex;
    };
    const yes = i.pressed("confirm");
    if (s.screen === "title") {
      const m = nav(3);
      s = { ...s, menuIndex: m };
      return yes
        ? m === 0
          ? match({ ...s, titleIndex: m }, "solo")
          : m === 1
            ? match({ ...s, titleIndex: m }, "versus")
            : { ...s, titleIndex: m, screen: "howto", menuIndex: 0 }
        : s;
    }
    if (s.screen === "howto")
      return i.pressed("back") || yes
        ? { ...s, screen: "title", menuIndex: s.titleIndex }
        : s;
    if (s.screen === "paused") {
      if (i.pressed("pause") || i.pressed("back"))
        return { ...s, screen: s.resumeScreen };
      const m = nav(3);
      s = { ...s, menuIndex: m };
      return yes
        ? m === 0
          ? { ...s, screen: s.resumeScreen }
          : m === 1
            ? match(s, s.mode)
            : title(s.muted)
        : s;
    }
    if (s.screen === "matchover") {
      const m = nav(2);
      s = { ...s, menuIndex: m };
      if (i.pressed("back")) return title(s.muted);
      return yes ? (m === 0 ? match(s, s.mode) : title(s.muted)) : s;
    }
    if (i.pressed("pause"))
      return { ...s, screen: "paused", resumeScreen: s.screen, menuIndex: 0 };
    const human = (p: PaddleState, up: string, down: string) =>
      p.driven
        ? move(p, p.drivenVy, dt)
        : move(p, (i.value(down) - i.value(up)) * C.PADDLE_SPEED, dt);
    const left = human(s.paddles.left, "p1-up", "p1-down");
    let right: PaddleState;
    if (s.mode === "solo" && !s.paddles.right.driven) {
      let target = C.AI_HOME_Y,
        dead = C.AI_HOME_DEADZONE;
      if (s.screen === "playing" && s.ai.tracking && s.ball && s.ball.vx > 0) {
        target = s.ball.y - s.ball.vy * C.AI_REACT;
        dead = C.AI_DEADZONE;
      }
      const diff = target - s.paddles.right.cy;
      right = move(
        s.paddles.right,
        s.ai.movement && Math.abs(diff) > dead
          ? Math.sign(diff) *
              Math.min(C.AI_SPEED, Math.abs(diff) / Math.max(dt, 1e-6))
          : 0,
        dt,
      );
    } else right = human(s.paddles.right, "p2-up", "p2-down");
    s = { ...s, paddles: { left, right } };
    if (s.screen === "countdown" && s.ball) {
      const t = s.ball.holdTimer - dt;
      if (t <= 0) {
        const dir = s.receiver === "left" ? -1 : 1;
        s = {
          ...s,
          screen: "playing",
          ball: {
            ...s.ball,
            held: false,
            holdTimer: 0,
            vx: dir * C.SERVE_SPEED * Math.cos(C.SERVE_ANGLE),
            vy: s.ball.serveSign * C.SERVE_SPEED * Math.sin(C.SERVE_ANGLE),
          },
        };
      } else s = { ...s, ball: { ...s.ball, holdTimer: t } };
      return s;
    }
    if (s.screen !== "playing" || !s.ball) return s;
    let b = s.ball;
    const n = Math.max(
        1,
        Math.ceil((Math.hypot(b.vx, b.vy) * dt) / C.MAX_SUBSTEP),
      ),
      h = dt / n;
    const sounds = { paddle: 0, wall: 0, obstacle: 0 };
    for (let k = 0; k < n; k++) {
      const v = Math.hypot(b.vx, b.vy);
      if (v) {
        const a = (b.spin / v) * h,
          c = Math.cos(a),
          q = Math.sin(a);
        b = { ...b, vx: b.vx * c - b.vy * q, vy: b.vx * q + b.vy * c };
      }
      b = {
        ...b,
        spin: b.spin * Math.pow(0.5, h / C.SPIN_HALFLIFE),
        x: b.x + b.vx * h,
        y: b.y + b.vy * h,
      };
      if (b.y - C.BALL_R < 0 && b.vy < 0) {
        b = { ...b, y: C.BALL_R, vy: -b.vy };
        sounds.wall++;
      } else if (b.y + C.BALL_R > C.FIELD_H && b.vy > 0) {
        b = { ...b, y: C.FIELD_H - C.BALL_R, vy: -b.vy };
        sounds.wall++;
      }
      for (const [r, kind, p] of [
        [
          {
            x0: C.P1_X0,
            y0: left.cy - C.PADDLE_HALF,
            x1: C.P1_X1,
            y1: left.cy + C.PADDLE_HALF,
          },
          "left",
          left,
        ],
        [
          {
            x0: C.P2_X0,
            y0: right.cy - C.PADDLE_HALF,
            x1: C.P2_X1,
            y1: right.cy + C.PADDLE_HALF,
          },
          "right",
          right,
        ],
      ] as const) {
        const z = hit(b, r, kind, p);
        b = z.b;
        if (z.e) sounds[z.e]++;
      }
      for (const o of s.obstacles) {
        const z = hit(b, C.OBSTACLES[o.index], "obstacle");
        b = z.b;
        if (z.e) sounds[z.e]++;
      }
    }
    if (sounds.paddle) api.audio.play(C.CUES.paddleHit);
    if (sounds.wall) api.audio.play(C.CUES.wallBounce);
    if (sounds.obstacle) api.audio.play(C.CUES.obstacleBounce);
    b = {
      ...b,
      trail: [...b.trail, { x: b.x, y: b.y, t: s.simTime }].filter(
        (x) => s.simTime - x.t <= C.TRAIL_TIME,
      ),
    };
    s = { ...s, ball: b };
    if (b.x - C.BALL_R > C.FIELD_W || b.x + C.BALL_R < 0) {
      const scorer = b.x > C.FIELD_CX ? "left" : "right",
        score = {
          p1: s.score.p1 + (scorer === "left" ? 1 : 0),
          p2: s.score.p2 + (scorer === "right" ? 1 : 0),
        };
      api.audio.play(C.CUES.score);
      const win =
        score.p1 >= C.WIN_SCORE && score.p1 - score.p2 >= C.WIN_LEAD
          ? "left"
          : score.p2 >= C.WIN_SCORE && score.p2 - score.p1 >= C.WIN_LEAD
            ? "right"
            : null;
      s = win
        ? { ...s, score, winner: win, screen: "matchover", menuIndex: 0 }
        : {
            ...s,
            score,
            receiver: scorer === "left" ? "right" : "left",
            screen: "countdown",
            ball: ball(),
          };
    }
    return s;
  },
  render(state, api: RenderApi) {
    const x = api.ctx;
    x.fillStyle = BACKGROUND;
    x.fillRect(0, 0, C.FIELD_W, C.FIELD_H);
    x.globalAlpha =
      state.screen === "title" || state.screen === "howto" ? 0.35 : 1;
    x.strokeStyle = "rgba(150,210,240,.25)";
    x.lineWidth = 3;
    x.setLineDash([14, 18]);
    x.beginPath();
    x.moveTo(C.NET_X, 28);
    x.lineTo(C.NET_X, C.FIELD_H - 28);
    x.stroke();
    x.setLineDash([]);
    for (const o of state.obstacles) {
      x.fillStyle = "#ffad52";
      x.beginPath();
      x.roundRect(o.cx - 10, o.cy - 70, 20, 140, 10);
      x.fill();
    }
    const p = (xx: number, v: PaddleState, c: string) => {
      x.fillStyle = c;
      x.beginPath();
      x.roundRect(xx, v.cy - C.PADDLE_HALF, 16, 110, 8);
      x.fill();
    };
    p(C.P1_X0, state.paddles.left, "#47d7ff");
    p(C.P2_X0, state.paddles.right, "#ff5d9d");
    if (state.ball) {
      for (let j = 1; j < state.ball.trail.length; j++) {
        x.strokeStyle = "rgba(255,255,255,.2)";
        x.lineWidth = 5;
        x.beginPath();
        x.moveTo(state.ball.trail[j - 1].x, state.ball.trail[j - 1].y);
        x.lineTo(state.ball.trail[j].x, state.ball.trail[j].y);
        x.stroke();
      }
      x.fillStyle = "#fff";
      x.beginPath();
      x.arc(state.ball.x, state.ball.y, C.BALL_R, 0, Math.PI * 2);
      x.fill();
    }
    x.globalAlpha = 1;
    if (
      ["playing", "countdown", "paused", "matchover"].includes(state.screen)
    ) {
      x.fillStyle = "#e3f4ff";
      x.font = "700 46px system-ui";
      x.textAlign = "center";
      x.fillText(`${state.score.p1}`, C.FIELD_CX - 90, 72);
      x.fillText(`${state.score.p2}`, C.FIELD_CX + 90, 72);
    }
    if (state.screen === "countdown" && state.ball) {
      x.font = "700 24px system-ui";
      x.fillStyle = "#b9d2e4";
      x.fillText(
        `SERVE IN ${Math.ceil(state.ball.holdTimer)}`,
        C.FIELD_CX,
        650,
      );
    }
    if (state.screen !== "playing" && state.screen !== "countdown")
      drawMenu(state, x);
  },
};
function drawMenu(s: DeepReadonly<CaromState>, x: CanvasRenderingContext2D) {
  x.fillStyle = "rgba(4,10,20,.82)";
  x.fillRect(250, 80, 780, 580);
  x.textAlign = "center";
  x.fillStyle = "#f6fbff";
  x.font = "900 86px system-ui";
  x.fillText(
    s.screen === "title"
      ? C.TITLE_TEXT
      : s.screen === "howto"
        ? "HOW TO PLAY"
        : s.screen === "paused"
          ? "PAUSED"
          : `${s.winner === "left" ? "PLAYER ONE" : "PLAYER TWO"} WINS`,
    C.FIELD_CX,
    205,
  );
  if (s.screen === "howto") {
    x.font = "500 19px system-ui";
    x.fillStyle = "#a8c0d4";
    [
      "W / S    Move left paddle",
      "Arrow keys    Move right paddle",
      "Strike while moving to add spin",
      "Bank shots off the orange obstacles",
    ].forEach((t, i) => x.fillText(t, C.FIELD_CX, 270 + i * 40));
  }
  const a = menu(s.screen);
  a.forEach((v, i) => {
    const y = 370 + i * 64;
    if (i === s.menuIndex) {
      x.fillStyle = "rgba(71,215,255,.15)";
      x.fillRect(420, y - 34, 440, 48);
    }
    x.fillStyle = i === s.menuIndex ? "#47d7ff" : "#a8c0d4";
    x.font = "700 20px system-ui";
    x.fillText(v, C.FIELD_CX, y);
  });
}
