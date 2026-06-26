export function colorFor(
  value: number,
  min: number,
  max: number,
  from: [number, number, number] = [219, 234, 254], // Light Blue
  to: [number, number, number] = [30, 58, 138]      // Dark Blue
): string {
  const t = (value - min) / (max - min || 1);
  const r = Math.round(from[0] + (to[0] - from[0]) * Math.max(0, Math.min(1, t)));
  const g = Math.round(from[1] + (to[1] - from[1]) * Math.max(0, Math.min(1, t)));
  const b = Math.round(from[2] + (to[2] - from[2]) * Math.max(0, Math.min(1, t)));
  return `rgb(${r},${g},${b})`;
}

// Convert Hex string (e.g., "#3b82f6") to RGB tuple
export function hexToRgb(hex: string): [number, number, number] {
  const shorthandRegex = /^#?([a-f\d])([a-f\d])([a-f\d])$/i;
  const fullHex = hex.replace(shorthandRegex, (_, r, g, b) => r + r + g + g + b + b);
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(fullHex);
  return result
    ? [parseInt(result[1], 16), parseInt(result[2], 16), parseInt(result[3], 16)]
    : [255, 255, 255];
}
