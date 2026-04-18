export interface ColorEntry {
  id: string;
  name: string;
  rgb: [number, number, number];
  hex: string;
}

export const MARD_COLORS: ColorEntry[] = [
  { id: "M01", name: "正红", rgb: [220, 20, 60], hex: "#DC143C" },
  { id: "M02", name: "明黄", rgb: [255, 215, 0], hex: "#FFD700" },
  { id: "M03", name: "天蓝", rgb: [135, 206, 235], hex: "#87CEEB" },
  { id: "M04", name: "纯黑", rgb: [0, 0, 0], hex: "#000000" },
  { id: "M05", name: "纯白", rgb: [255, 255, 255], hex: "#FFFFFF" },
  { id: "M06", name: "草绿", rgb: [50, 205, 50], hex: "#32CD32" },
  { id: "M07", name: "肉色", rgb: [255, 228, 196], hex: "#FFE4C4" }
];

export function findClosestColor(r: number, g: number, b: number): ColorEntry {
  let closest = MARD_COLORS[0];
  let minDistance = Infinity;

  for (const color of MARD_COLORS) {
    const dr = r - color.rgb[0];
    const dg = g - color.rgb[1];
    const db = b - color.rgb[2];
    const distance = Math.sqrt(dr * dr + dg * dg + db * db);
    if (distance < minDistance) {
      minDistance = distance;
      closest = color;
    }
  }

  return closest;
}