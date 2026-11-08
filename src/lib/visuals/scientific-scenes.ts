/** Local scientific illustrations. Geometry is illustrative, not a visualization of research data. */
export type SceneKind = "group" | "bio" | "vision" | "approach";
type Vec = { x: number; y: number; z: number };
type ScreenPoint = Vec & { scale: number };
type RGB = readonly [number, number, number];
export type SceneFrame = {
  ctx: CanvasRenderingContext2D;
  width: number;
  height: number;
  time: number;
  scroll: number;
  pointerX: number;
  pointerY: number;
  reduced: boolean;
};
const BLUE: RGB = [93, 177, 255],
  ICE: RGB = [187, 232, 255],
  SILVER: RGB = [194, 211, 231],
  TEAL: RGB = [100, 204, 209];
const TAU = Math.PI * 2;
const clamp = (x: number, a = 0, b = 1) => Math.max(a, Math.min(b, x));
const mix = (a: number, b: number, t: number) => a + (b - a) * t;
const color = (rgb: RGB, alpha: number) =>
  `rgba(${rgb.join(",")},${clamp(alpha)})`;
function interpolate(a: Vec, b: Vec, t: number): Vec {
  return { x: mix(a.x, b.x, t), y: mix(a.y, b.y, t), z: mix(a.z, b.z, t) };
}
function rotate(p: Vec, x: number, y: number, z = 0): Vec {
  const cy = Math.cos(y),
    sy = Math.sin(y),
    cx = Math.cos(x),
    sx = Math.sin(x),
    cz = Math.cos(z),
    sz = Math.sin(z);
  const px = p.x * cy + p.z * sy,
    pz = -p.x * sy + p.z * cy;
  const py = p.y * cx - pz * sx,
    depth = p.y * sx + pz * cx;
  return { x: px * cz - py * sz, y: px * sz + py * cz, z: depth };
}
function projector(
  cx: number,
  cy: number,
  radius: number,
  yaw: number,
  pitch: number,
  roll = 0,
  camera = 4.5,
) {
  const sy = Math.sin(yaw),
    cyaw = Math.cos(yaw),
    sx = Math.sin(pitch),
    cp = Math.cos(pitch),
    sz = Math.sin(roll),
    cr = Math.cos(roll);
  return (p: Vec): ScreenPoint => {
    const x = p.x * cyaw + p.z * sy,
      z = -p.x * sy + p.z * cyaw;
    const y = p.y * cp - z * sx,
      depth = p.y * sx + z * cp;
    const scale = camera / (camera - depth);
    return {
      x: cx + (x * cr - y * sz) * radius * scale,
      y: cy + (x * sz + y * cr) * radius * scale,
      z: depth,
      scale,
    };
  };
}
function point(
  ctx: CanvasRenderingContext2D,
  p: Vec,
  r: number,
  rgb: RGB,
  alpha = 1,
  glow = 0,
) {
  if (glow > 0.03) {
    const halo = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, r * 7);
    halo.addColorStop(0, color(rgb, glow * 0.4));
    halo.addColorStop(0.3, color(rgb, glow * 0.12));
    halo.addColorStop(1, color(rgb, 0));
    ctx.fillStyle = halo;
    ctx.beginPath();
    ctx.arc(p.x, p.y, r * 7, 0, TAU);
    ctx.fill();
  }
  ctx.beginPath();
  ctx.arc(p.x, p.y, r, 0, TAU);
  ctx.fillStyle = color(rgb, alpha);
  ctx.fill();
}
function bead(
  ctx: CanvasRenderingContext2D,
  p: Vec,
  r: number,
  rgb: RGB,
  alpha = 1,
) {
  const fill = ctx.createRadialGradient(
    p.x - r * 0.35,
    p.y - r * 0.4,
    0.1,
    p.x,
    p.y,
    r,
  );
  fill.addColorStop(0, `rgba(237,251,255,${alpha})`);
  fill.addColorStop(0.32, color(rgb, alpha));
  fill.addColorStop(1, `rgba(24,55,82,${alpha})`);
  ctx.beginPath();
  ctx.arc(p.x, p.y, r, 0, TAU);
  ctx.fillStyle = fill;
  ctx.fill();
}
function wash(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  radius: number,
  rgb: RGB,
  opacity: number,
) {
  const gradient = ctx.createRadialGradient(x, y, 0, x, y, radius);
  gradient.addColorStop(0, color(rgb, opacity));
  gradient.addColorStop(0.5, color(rgb, opacity * 0.25));
  gradient.addColorStop(1, color(rgb, 0));
  ctx.fillStyle = gradient;
  ctx.fillRect(x - radius, y - radius, radius * 2, radius * 2);
}
function line(
  ctx: CanvasRenderingContext2D,
  a: Vec,
  b: Vec,
  rgb: RGB,
  opacity: number,
  width = 1,
) {
  ctx.beginPath();
  ctx.moveTo(a.x, a.y);
  ctx.lineTo(b.x, b.y);
  ctx.lineWidth = width;
  ctx.strokeStyle = color(rgb, opacity);
  ctx.stroke();
}
function cubic(points: readonly Vec[], t: number): Vec {
  const u = 1 - t,
    a = u * u * u,
    b = 3 * u * u * t,
    c = 3 * u * t * t,
    d = t * t * t;
  return {
    x: points[0].x * a + points[1].x * b + points[2].x * c + points[3].x * d,
    y: points[0].y * a + points[1].y * b + points[2].y * c + points[3].y * d,
    z: points[0].z * a + points[1].z * b + points[2].z * c + points[3].z * d,
  };
}
function seeded(seed: number) {
  return () => {
    seed = (Math.imul(1664525, seed) + 1013904223) | 0;
    return (seed >>> 0) / 4294967296;
  };
}

/** A moving, tapered electrical front, with a fine white core and blue corona. */
function impulse(
  ctx: CanvasRenderingContext2D,
  path: ScreenPoint[],
  progress: number,
  strength = 1,
  tail = 0.32,
) {
  const count = path.length - 1;
  if (progress <= 0 || progress > 1 + tail) return;
  const from = Math.max(1, Math.floor((progress - tail) * count));
  const to = Math.min(count, Math.ceil(progress * count));
  ctx.save();
  ctx.globalCompositeOperation = "lighter";
  ctx.lineCap = "round";
  for (const [width, opacity, rgb] of [
    [9, 0.1, BLUE],
    [2.5, 0.65, BLUE],
    [0.85, 0.95, ICE],
  ] as const) {
    for (let i = from; i <= to; i++) {
      const age = progress - i / count;
      if (age < 0 || age > tail) continue;
      const a = path[i - 1],
        b = path[i];
      const depth = 0.08 + 0.92 * Math.pow(clamp(((a.z + b.z) / 2 + 1) / 2), 2);
      line(
        ctx,
        a,
        b,
        rgb,
        (1 - age / tail) * depth * opacity * strength,
        width,
      );
    }
  }
  if (progress < 1) {
    const index = progress * count,
      i = Math.floor(index);
    const p = interpolate(path[i], path[Math.min(i + 1, count)], index - i);
    const depth = clamp((p.z + 1) / 2);
    point(
      ctx,
      p,
      1.6 + depth * 1.5,
      ICE,
      depth * strength,
      depth * 0.85 * strength,
    );
  }
  ctx.restore();
}

function activation(
  ctx: CanvasRenderingContext2D,
  p: ScreenPoint,
  age: number,
  strength = 1,
) {
  if (age < 0 || age > 0.8) return;
  const energy = Math.min(age / 0.06, 1) * Math.exp(-age * 5) * strength;
  const depth = Math.pow(clamp((p.z + 1) / 2), 2);
  point(ctx, p, 1.8 + energy * 2.3, ICE, energy * depth, energy * depth);
  ctx.beginPath();
  ctx.arc(p.x, p.y, 3 + age * 15, 0, TAU);
  ctx.strokeStyle = color(BLUE, energy * depth * 0.5);
  ctx.lineWidth = 0.8;
  ctx.stroke();
}

function globeScene() {
  const nodes: Vec[] = Array.from({ length: 380 }, (_, i) => {
    const y = 1 - ((i + 0.5) / 380) * 2,
      r = Math.sqrt(1 - y * y),
      a = i * Math.PI * (3 - Math.sqrt(5));
    return { x: Math.cos(a) * r, y, z: Math.sin(a) * r };
  });
  const edges: [number, number][] = [];
  nodes.forEach((p, i) =>
    nodes
      .map((q, j) => ({ j, d: Math.hypot(p.x - q.x, p.y - q.y, p.z - q.z) }))
      .filter((q) => q.j > i && q.d < 0.25)
      .sort((a, b) => a.d - b.d)
      .slice(0, 4)
      .forEach((q) => edges.push([i, q.j])),
  );
  const routes = Array.from({ length: 12 }, (_, i) => {
    const a = nodes[(i * 31 + 7) % nodes.length],
      b = nodes[(i * 31 + 120) % nodes.length],
      dot = clamp(a.x * b.x + a.y * b.y + a.z * b.z, -0.98, 0.98),
      angle = Math.acos(dot);
    return Array.from({ length: 45 }, (_, j) => {
      const t = j / 44,
        sa = Math.sin((1 - t) * angle) / Math.sin(angle),
        sb = Math.sin(t * angle) / Math.sin(angle);
      return {
        x: (a.x * sa + b.x * sb) * 1.012,
        y: (a.y * sa + b.y * sb) * 1.012,
        z: (a.z * sa + b.z * sb) * 1.012,
      };
    });
  });
  // Precompute connected branching cascades once; each arrival triggers the next links.
  const adjacent: number[][] = nodes.map(() => []);
  edges.forEach(([a, b]) => {
    adjacent[a].push(b);
    adjacent[b].push(a);
  });
  // Opposite pairs keep a visible firing front as the globe turns.
  const origins: Vec[] = [
    { x: 0.25, y: -0.45, z: 0.86 },
    { x: -0.55, y: 0.45, z: 0.7 },
    { x: 0.85, y: 0.25, z: 0.45 },
    { x: -0.65, y: -0.4, z: 0.65 },
  ];
  const targets = origins.flatMap((p) => [p, { x: -p.x, y: -p.y, z: -p.z }]);
  const cascades = targets.map((target, wave) => {
    const root = nodes.reduce(
      (best, node, i) =>
        Math.hypot(node.x - target.x, node.y - target.y, node.z - target.z) <
        Math.hypot(
          nodes[best].x - target.x,
          nodes[best].y - target.y,
          nodes[best].z - target.z,
        )
          ? i
          : best,
      0,
    );
    const random = seeded(910 + wave),
      visited = new Set([root]);
    const queue = [{ node: root, at: 0, level: 0 }];
    const links: { points: Vec[]; at: number; duration: number }[] = [];
    for (let cursor = 0; cursor < queue.length; cursor++) {
      const parent = queue[cursor];
      if (parent.level === 4) continue;
      const candidates = adjacent[parent.node]
        .map((node) => ({ node, rank: random() }))
        .filter(({ node }) => !visited.has(node))
        .sort((a, b) => a.rank - b.rank)
        .slice(0, parent.level === 0 ? 3 : 2);
      for (const { node } of candidates) {
        if (visited.has(node)) continue;
        visited.add(node);
        const a = nodes[parent.node],
          b = nodes[node],
          duration = 0.17 + random() * 0.08;
        const points = Array.from({ length: 13 }, (_, i) => {
          const t = i / 12,
            p = interpolate(a, b, t),
            length = Math.hypot(p.x, p.y, p.z);
          const lift =
            1.015 +
            Math.sin(t * Math.PI) * (0.008 + Math.sin(i * 2.3 + wave) * 0.004);
          return {
            x: (p.x / length) * lift,
            y: (p.y / length) * lift,
            z: (p.z / length) * lift,
          };
        });
        links.push({ points, at: parent.at, duration });
        queue.push({ node, at: parent.at + duration, level: parent.level + 1 });
      }
    }
    return { links, arrivals: queue };
  });
  return ({
    ctx,
    width: w,
    height: h,
    time,
    scroll,
    pointerX,
    pointerY,
    reduced,
  }: SceneFrame) => {
    const mobile = w < 750,
      cx = w * (mobile ? 0.52 : 0.74),
      cy = h * (mobile ? 0.745 : 0.48) - scroll * 12,
      r = mobile ? w * 0.425 : Math.min(h * 0.395, w * 0.279);
    const project = projector(
      cx,
      cy,
      r,
      time * 0.13 + scroll * 0.78 + pointerX * 0.1,
      -0.2 + scroll * 0.2 + pointerY * 0.06,
    );
    wash(ctx, cx, cy, r * 1.35, BLUE, 0.14);
    const sphere = ctx.createRadialGradient(
      cx - r * 0.35,
      cy - r * 0.4,
      r * 0.04,
      cx,
      cy,
      r * 1.025,
    );
    sphere.addColorStop(0, "#193c5f60");
    sphere.addColorStop(0.6, "#0b1f345a");
    sphere.addColorStop(1, "#030b1633");
    ctx.fillStyle = sphere;
    ctx.beginPath();
    ctx.arc(cx, cy, r * 1.02, 0, TAU);
    ctx.fill();
    const projected = nodes.map(project);
    for (const [i, j] of edges) {
      const a = projected[i],
        b = projected[j],
        depth = clamp(((a.z + b.z) / 2 + 1) / 2);
      line(ctx, a, b, BLUE, 0.045 + depth * depth * 0.49, 0.35 + depth * 0.65);
    }
    routes.forEach((route, index) => {
      const p = route.map(project);
      for (let i = 1; i < p.length; i++) {
        const depth = clamp((p[i].z + 1) / 2);
        line(ctx, p[i - 1], p[i], BLUE, 0.025 + depth * 0.1, 0.7);
      }
      if (!reduced && index % 2 === 0)
        impulse(ctx, p, (time * 0.32 + index * 0.19) % 1.5, 1.25);
    });
    if (!reduced) {
      cascades.forEach((cascade, index) => {
        const age = (time + Math.floor(index / 2) * 0.9) % 3.6;
        for (const link of cascade.links) {
          const progress = (age - link.at) / link.duration;
          if (progress > 0 && progress < 1.8)
            impulse(ctx, link.points.map(project), progress, 1.05, 0.8);
        }
        for (const arrival of cascade.arrivals)
          activation(ctx, projected[arrival.node], age - arrival.at);
      });
    }
    projected.forEach((p, i) => {
      const depth = clamp((p.z + 1) / 2),
        hub = i % 19 === 0;
      point(
        ctx,
        p,
        (hub ? 2 : 0.85) + depth * 0.6,
        hub ? ICE : SILVER,
        0.12 + depth * 0.8,
        0,
      );
    });
    const rim = ctx.createLinearGradient(cx - r, cy - r, cx + r, cy + r);
    rim.addColorStop(0, "#b5e6ff1a");
    rim.addColorStop(0.38, "#69bfff70");
    rim.addColorStop(0.65, "#69bfff0a");
    rim.addColorStop(1, "#94ddff5c");
    ctx.beginPath();
    ctx.arc(cx, cy, r * 1.027, 0, TAU);
    ctx.strokeStyle = rim;
    ctx.lineWidth = 0.8;
    ctx.stroke();
  };
}

function dnaScene() {
  return ({
    ctx,
    width: w,
    height: h,
    time,
    scroll,
    pointerX,
    pointerY,
  }: SceneFrame) => {
    const mobile = w < 750,
      cx = w * (mobile ? 0.57 : 0.77),
      cy = h * (mobile ? 0.74 : 0.5) - scroll * 14,
      length = mobile ? h * 0.43 : h * 0.83;
    const phase = time * 0.22 + scroll * 1.5 + pointerX * 0.1,
      roll = -0.23 + scroll * 0.06 + pointerY * 0.025;
    const project = projector(
      cx,
      cy,
      length * 0.5,
      0,
      scroll * 0.04,
      roll,
      3.8,
    );
    wash(ctx, cx, cy, length * 0.59, BLUE, 0.1);
    const turns = 2.65,
      radius = mobile ? 0.34 : 0.36;
    const sample = (p: number, s: number): Vec => ({
      x: Math.sin(p * TAU * turns + phase + s * Math.PI) * radius,
      y: (p - 0.5) * 2,
      z: Math.cos(p * TAU * turns + phase + s * Math.PI) * radius,
    });
    type Segment = {
      a: ScreenPoint;
      b: ScreenPoint;
      kind: "backbone" | "pair";
      rgb: RGB;
      highlight: number;
    };
    const segments: Segment[] = [],
      beads: { p: ScreenPoint; rgb: RGB; highlight: number }[] = [];
    const palette: RGB[] = [BLUE, TEAL, SILVER, [139, 168, 235]];
    const scan = (time * 0.085 + scroll * 0.12 + 1) % 1;
    for (let strand = 0; strand < 2; strand++) {
      for (let i = 1; i <= 190; i++) {
        const p = i / 190,
          highlight = Math.exp(-Math.pow((p - scan) * 15, 2));
        segments.push({
          a: project(sample((i - 1) / 190, strand)),
          b: project(sample(p, strand)),
          kind: "backbone",
          rgb: strand ? SILVER : BLUE,
          highlight,
        });
      }
    }
    for (let i = 0; i < 28; i++) {
      const p = 0.025 + (i / 27) * 0.95,
        a = sample(p, 0),
        b = sample(p, 1),
        highlight = Math.exp(-Math.pow((p - scan) * 15, 2));
      const pair = palette[i % 4],
        complement = palette[(i + 2) % 4];
      segments.push({
        a: project(a),
        b: project(interpolate(a, b, 0.46)),
        kind: "pair",
        rgb: pair,
        highlight,
      });
      segments.push({
        a: project(interpolate(a, b, 0.54)),
        b: project(b),
        kind: "pair",
        rgb: complement,
        highlight,
      });
      const centerA = project(interpolate(a, b, 0.47)),
        centerB = project(interpolate(a, b, 0.53));
      segments.push({
        a: centerA,
        b: centerB,
        kind: "pair",
        rgb: SILVER,
        highlight: highlight * 0.3,
      });
      beads.push(
        { p: project(a), rgb: BLUE, highlight },
        { p: project(b), rgb: SILVER, highlight },
      );
    }
    segments.sort((a, b) => a.a.z + a.b.z - (b.a.z + b.b.z));
    ctx.lineCap = "round";
    for (const segment of segments) {
      const { a, b, kind, rgb, highlight } = segment,
        depth = clamp(((a.z + b.z) / 2 + radius) / (2 * radius)),
        thickness =
          ((kind === "backbone" ? 5.6 : 3.1) *
            (mobile ? 0.77 : 1) *
            (a.scale + b.scale)) /
          2;
      line(ctx, a, b, [9, 25, 42], 0.6, thickness + 2.5);
      const shine = ctx.createLinearGradient(a.x, a.y, b.x, b.y);
      shine.addColorStop(0, color(rgb, 0.38 + depth * 0.5));
      shine.addColorStop(
        0.5,
        color(ICE, 0.45 + depth * 0.45 + highlight * 0.1),
      );
      shine.addColorStop(1, color(rgb, 0.4 + depth * 0.5));
      ctx.beginPath();
      ctx.moveTo(a.x, a.y);
      ctx.lineTo(b.x, b.y);
      ctx.lineWidth = thickness;
      ctx.strokeStyle = shine;
      ctx.stroke();
      if (kind === "backbone")
        line(
          ctx,
          { x: a.x - 1, y: a.y - 1, z: a.z },
          { x: b.x - 1, y: b.y - 1, z: b.z },
          ICE,
          0.18 + depth * 0.45,
          0.7,
        );
    }
    beads
      .sort((a, b) => a.p.z - b.p.z)
      .forEach(({ p, rgb, highlight }) => {
        const depth = clamp((p.z + radius) / (2 * radius));
        if (highlight > 0.5) point(ctx, p, 3, ICE, 0.1, highlight * 0.55);
        bead(ctx, p, (mobile ? 3.2 : 4.1) * p.scale, rgb, 0.45 + depth * 0.55);
      });
  };
}

type Branch = {
  curve: [Vec, Vec, Vec, Vec];
  width: number;
  neuron: number;
  phase: number;
  level: number;
};
function neuronsScene() {
  const random = seeded(7013);
  const cells: Vec[] = [
    { x: 0.06, y: -0.03, z: 0.28 },
    { x: -0.72, y: -0.53, z: -0.2 },
    { x: 0.73, y: -0.55, z: -0.06 },
    { x: -0.56, y: 0.63, z: 0.02 },
    { x: 0.78, y: 0.53, z: -0.22 },
  ];
  const branches: Branch[] = [];
  cells.forEach((cell, index) => {
    function grow(
      start: Vec,
      angle: number,
      length: number,
      depth: number,
      width: number,
    ) {
      const bend = (random() - 0.5) * 0.7,
        end = {
          x: start.x + Math.cos(angle + bend) * length,
          y: start.y + Math.sin(angle + bend) * length,
          z: start.z + (random() - 0.5) * 0.13,
        };
      branches.push({
        curve: [
          start,
          {
            x: start.x + Math.cos(angle) * length * 0.4,
            y: start.y + Math.sin(angle) * length * 0.4,
            z: start.z,
          },
          {
            x: end.x - Math.cos(angle + bend) * length * 0.25,
            y: end.y - Math.sin(angle + bend) * length * 0.25,
            z: end.z,
          },
          end,
        ],
        width,
        neuron: index,
        phase: random(),
        level: 2 - depth,
      });
      if (depth > 0) {
        grow(
          end,
          angle + bend + 0.45 + random() * 0.3,
          length * 0.56,
          depth - 1,
          width * 0.58,
        );
        grow(
          end,
          angle + bend - 0.45 - random() * 0.3,
          length * 0.56,
          depth - 1,
          width * 0.58,
        );
      }
    }
    for (let arm = 0; arm < 7; arm++)
      grow(
        cell,
        (arm / 7) * TAU + random() * 0.35,
        0.19 + random() * 0.09,
        2,
        1.9,
      );
  });
  // Inputs converge before the central cell sends its outgoing signals.
  const firingTimes = [2.5, 0.7, 3.6, 1, 3.82];
  const connections = [
    { a: 1, b: 0, launch: 0.7, duration: 1.05 },
    { a: 3, b: 0, launch: 1, duration: 1.05 },
    { a: 0, b: 2, launch: 2.5, duration: 1.1 },
    { a: 0, b: 4, launch: 2.72, duration: 1.1 },
  ];
  const axons = connections.map((connection) => {
    const p = cells[connection.a],
      q = cells[connection.b];
    const curve: [Vec, Vec, Vec, Vec] = [
      p,
      { x: mix(p.x, q.x, 0.3), y: p.y - 0.12, z: p.z + 0.1 },
      { x: mix(p.x, q.x, 0.65), y: q.y + 0.13, z: q.z - 0.08 },
      q,
    ];
    return {
      ...connection,
      curve,
      points: Array.from({ length: 45 }, (_, i) => cubic(curve, i / 44)),
    };
  });
  return ({
    ctx,
    width: w,
    height: h,
    time,
    scroll,
    pointerX,
    pointerY,
    reduced,
  }: SceneFrame) => {
    const radius = Math.min(w * 0.36, h * 0.39),
      cx = w * 0.51,
      cy = h * 0.49 - scroll * 13;
    const project = projector(
      cx,
      cy,
      radius,
      scroll * 0.22 + pointerX * 0.08,
      -0.08 + scroll * 0.12 + pointerY * 0.06,
      Math.sin(time * 0.07) * 0.012,
      5,
    );
    wash(ctx, cx, cy, radius * 1.6, BLUE, 0.11);
    const cycle = (time + 0.65) % 6.6;
    const charge = cells.map((_, i) => {
      const age = cycle - firingTimes[i];
      return reduced
        ? 0.25
        : 0.15 + (age >= 0 ? Math.exp(-age * 3.2) * 0.85 : 0);
    });
    for (const branch of [...branches].sort(
      (a, b) => a.curve[0].z - b.curve[0].z,
    )) {
      const p = branch.curve.map(project),
        depth = clamp((p[0].z + 0.4) / 0.8),
        energy = charge[branch.neuron];
      ctx.beginPath();
      ctx.moveTo(p[0].x, p[0].y);
      ctx.bezierCurveTo(p[1].x, p[1].y, p[2].x, p[2].y, p[3].x, p[3].y);
      ctx.strokeStyle = color(
        branch.width > 1 ? BLUE : ICE,
        0.15 + depth * 0.35 + energy * 0.16,
      );
      ctx.lineWidth = branch.width * (0.6 + depth * 0.6);
      ctx.stroke();
      if (branch.width < 0.8) point(ctx, p[3], 0.8, SILVER, 0.28 + depth * 0.3);
      if (!reduced) {
        const onset =
          firingTimes[branch.neuron] -
          0.64 +
          (2 - branch.level) * 0.17 +
          branch.phase * 0.035;
        const progress = (cycle - onset) / 0.23;
        if (progress > 0 && progress < 1.32) {
          const path = Array.from({ length: 12 }, (_, i) =>
            project(cubic(branch.curve, 1 - i / 11)),
          );
          impulse(ctx, path, progress, branch.width > 1 ? 1.45 : 0.85);
        }
      }
    }
    axons.forEach((axon) => {
      const p = axon.curve.map(project);
      ctx.beginPath();
      ctx.moveTo(p[0].x, p[0].y);
      ctx.bezierCurveTo(p[1].x, p[1].y, p[2].x, p[2].y, p[3].x, p[3].y);
      ctx.strokeStyle = color(BLUE, 0.32);
      ctx.lineWidth = 2.2;
      ctx.stroke();
      if (!reduced) {
        impulse(
          ctx,
          axon.points.map(project),
          (cycle - axon.launch) / axon.duration,
          1.8,
        );
        const arrivalAge = cycle - axon.launch - axon.duration;
        if (arrivalAge >= 0 && arrivalAge < 0.8) {
          charge[axon.b] = Math.max(charge[axon.b], Math.exp(-arrivalAge * 3));
          activation(ctx, project(cells[axon.b]), arrivalAge, 1.3);
        }
      }
    });
    cells
      .map((cell, i) => ({ p: project(cell), i }))
      .sort((a, b) => a.p.z - b.p.z)
      .forEach(({ p, i }) => {
        const r = (i === 0 ? 15 : 10) * p.scale,
          energy = charge[i];
        wash(ctx, p.x, p.y, r * (3 + energy), BLUE, 0.12 + energy * 0.19);
        ctx.beginPath();
        for (let k = 0; k <= 48; k++) {
          const angle = (k / 48) * TAU,
            edge =
              r *
              (1 +
                0.13 * Math.sin(angle * 5 + i) +
                0.09 * Math.cos(angle * 7 + i));
          const x = p.x + Math.cos(angle) * edge,
            y = p.y + Math.sin(angle) * edge;
          if (k === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        }
        const body = ctx.createRadialGradient(
          p.x - r * 0.3,
          p.y - r * 0.35,
          0,
          p.x,
          p.y,
          r * 1.3,
        );
        body.addColorStop(0, color(ICE, 0.7 + energy * 0.3));
        body.addColorStop(0.4, color(BLUE, 0.3 + energy * 0.4));
        body.addColorStop(1, "#132c49dd");
        ctx.closePath();
        ctx.fillStyle = body;
        ctx.fill();
        ctx.strokeStyle = color(ICE, 0.45 + energy * 0.5);
        ctx.lineWidth = 1.1;
        ctx.stroke();
        bead(ctx, p, r * 0.32, ICE, 0.9);
      });
  };
}

function convergenceScene() {
  const colors: RGB[] = [BLUE, SILVER, TEAL];
  // Nine filaments give each connected flow a substantial, folded ribbon surface.
  const flows = colors.map((rgb, index) => ({
    rgb,
    tracks: Array.from({ length: 9 }, (_, track) => {
      const side = (track - 4) / 4;
      return Array.from({ length: 145 }, (_, j) => {
        const a = (j / 144) * TAU;
        return rotate(
          {
            x: Math.cos(a) * (0.85 + side * 0.055),
            y: Math.sin(a) * (0.62 + side * 0.055),
            z: Math.sin(a * 2) * 0.17 + side * 0.085 * Math.cos(a),
          },
          0.45 + index * 0.63,
          index * 0.4,
          (index * TAU) / 3,
        );
      });
    }),
  }));
  return ({
    ctx,
    width: w,
    height: h,
    time,
    scroll,
    pointerX,
    pointerY,
    reduced,
  }: SceneFrame) => {
    const radius = Math.min(w * 0.43, h * 0.4),
      cx = w * 0.51,
      cy = h * 0.48 - scroll * 10;
    const project = projector(
      cx,
      cy,
      radius,
      time * 0.07 + scroll * 0.48 + pointerX * 0.08,
      0.16 + scroll * 0.2 + pointerY * 0.04,
      -0.1,
      4.5,
    );
    wash(ctx, cx, cy, radius * 1.5, BLUE, 0.1);
    const segments: {
      a: ScreenPoint;
      b: ScreenPoint;
      rgb: RGB;
      energy: number;
      track: number;
    }[] = [];
    flows.forEach(({ tracks, rgb }, index) => {
      const phase = reduced ? 0.35 : (time * 0.095 + index * 0.33) % 1;
      tracks.forEach((points, track) => {
        const p = points.map(project);
        for (let i = 1; i < p.length; i++) {
          const delta = Math.abs(i / 144 - phase),
            energy = Math.exp(-Math.pow(Math.min(delta, 1 - delta) * 17, 2));
          segments.push({ a: p[i - 1], b: p[i], rgb, energy, track });
        }
      });
    });
    segments
      .sort((a, b) => a.a.z + a.b.z - (b.a.z + b.b.z))
      .forEach(({ a, b, rgb, energy, track }) => {
        const depth = clamp(((a.z + b.z) / 2 + 0.8) / 1.6),
          edge = track === 0 || track === 8;
        const sheen =
          0.38 + 0.62 * Math.pow(Math.sin((track / 8) * Math.PI), 2);
        line(
          ctx,
          a,
          b,
          rgb,
          (0.13 + depth * 0.62 + energy * 0.22) * sheen,
          edge ? 0.75 : 1.7,
        );
        if (track === 4 && energy > 0.91 && depth > 0.5)
          point(ctx, b, 1.8, ICE, 0.5, energy * 0.18);
      });
    flows.forEach(({ tracks, rgb }, index) => {
      for (let k = 0; k < 3; k++) {
        const indexOnPath = Math.floor(
            ((time * 0.095 + index * 0.33 + k / 3) % 1) * 144,
          ),
          p = project(tracks[4][indexOnPath]);
        bead(ctx, p, 2.7 * p.scale, rgb, 0.9);
      }
    });
    const center = project({ x: 0, y: 0, z: 0 });
    point(ctx, center, 3, ICE, 0.85, 0.55);
  };
}

export function createScientificScene(
  kind: SceneKind,
): (frame: SceneFrame) => void {
  switch (kind) {
    case "group":
      return globeScene();
    case "bio":
      return dnaScene();
    case "vision":
      return neuronsScene();
    case "approach":
      return convergenceScene();
  }
}
