export const MIN = 10;
export const MAX = 30;

export const GAP_ANGLE = 120; 
export const START = 180 + GAP_ANGLE / 2;
export const END = 540 - GAP_ANGLE / 2;
export const SWEEP = END - START;

export const clamp = (v, min, max) => Math.min(max, Math.max(min, v));

export const polar = (cx, cy, r, a) => {
  const rad = (a - 90) * Math.PI / 180;
  return {
    x: cx + r * Math.cos(rad),
    y: cy + r * Math.sin(rad)
  };
};

export const arcPath = (r, a0, a1) => {
  const p0 = polar(120, 120, r, a0);
  const p1 = polar(120, 120, r, a1);
  const largeArcFlag = a1 - a0 > 180 ? 1 : 0;
  return `M ${p0.x} ${p0.y} A ${r} ${r} 0 ${largeArcFlag} 1 ${p1.x} ${p1.y}`;
};