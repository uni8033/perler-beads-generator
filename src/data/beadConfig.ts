export interface BeadColor {
  id: string;
  name: string;
  rgb: [number, number, number];
  hex: string;
}

export interface BeadBrand {
  id: string;
  name: string;
  colors: BeadColor[];
}

export function hexToRgb(hex: string): [number, number, number] {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result ? [
    parseInt(result[1], 16),
    parseInt(result[2], 16),
    parseInt(result[3], 16)
  ] : [0, 0, 0];
}

const RAW_BRANDS_DATA = [
  {
    id: "mard",
    name: "MARD 融豆",
    colors: [
      { id: "A1", hex: "#faf5cd" }, { id: "A2", hex: "#fcfed6" }, { id: "A3", hex: "#fcff92" }, { id: "A4", hex: "#f7ec5c" }, { id: "A5", hex: "#f0d83a" }, { id: "A6", hex: "#fda951" }, { id: "A7", hex: "#fa8c4f" }, { id: "A8", hex: "#fbda4d" }, { id: "A9", hex: "#f79d5f" }, { id: "A10", hex: "#f47e38" }, { id: "A11", hex: "#fedb99" }, { id: "A12", hex: "#fda276" }, { id: "A13", hex: "#fec667" }, { id: "A14", hex: "#f75842" }, { id: "A15", hex: "#fbf65e" }, { id: "A16", hex: "#feff97" }, { id: "A17", hex: "#fde173" }, { id: "A18", hex: "#fcbf80" }, { id: "A19", hex: "#fd7e77" }, { id: "A20", hex: "#f9d666" }, { id: "A21", hex: "#fae393" }, { id: "A22", hex: "#edf878" }, { id: "A23", hex: "#e4c8ba" }, { id: "A24", hex: "#f3f6a9" }, { id: "A25", hex: "#fdf785" }, { id: "A26", hex: "#ffc734" }, { id: "B1", hex: "#dff13b" }, { id: "B2", hex: "#64f343" }, { id: "B3", hex: "#a1f586" }, { id: "B4", hex: "#5fdf34" }, { id: "B5", hex: "#39e158" }, { id: "B6", hex: "#64e0a4" }, { id: "B7", hex: "#3eae7c" }, { id: "B8", hex: "#1d9b54" }, { id: "B9", hex: "#2a5037" }, { id: "B10", hex: "#9ad1ba" }, { id: "B11", hex: "#627032" }, { id: "B12", hex: "#1a6e3d" }, { id: "B13", hex: "#c8e87d" }, { id: "B14", hex: "#abe84f" }, { id: "B15", hex: "#305335" }, { id: "B16", hex: "#c0ed9c" }, { id: "B17", hex: "#9eb33e" }, { id: "B18", hex: "#e6ed4f" }, { id: "B19", hex: "#26b78e" }, { id: "B20", hex: "#cbeccf" }, { id: "B21", hex: "#18616a" }, { id: "B22", hex: "#0a4241" }, { id: "B23", hex: "#343b1a" }, { id: "B24", hex: "#e8faa6" }, { id: "B25", hex: "#4e846d" }, { id: "B26", hex: "#907c35" }, { id: "B27", hex: "#d0e0af" }, { id: "B28", hex: "#9ee5bb" }, { id: "B29", hex: "#c6df5f" }, { id: "B30", hex: "#e3fbb1" }, { id: "B31", hex: "#b4e691" }, { id: "B32", hex: "#92ad60" }, { id: "C1", hex: "#f0fee4" }, { id: "C2", hex: "#abf8fe" }, { id: "C3", hex: "#a2e0f7" }, { id: "C4", hex: "#44cdfb" }, { id: "C5", hex: "#06aadf" }, { id: "C6", hex: "#54a7e9" }, { id: "C7", hex: "#3977ca" }, { id: "C8", hex: "#0f52bd" }, { id: "C9", hex: "#3349c3" }, { id: "C10", hex: "#3cbce3" }, { id: "C11", hex: "#2aded3" }, { id: "C12", hex: "#1e334e" }, { id: "C13", hex: "#cde7fe" }, { id: "C14", hex: "#d5fcf7" }, { id: "C15", hex: "#21c5c4" }, { id: "C16", hex: "#1858a2" }, { id: "C17", hex: "#02d1f3" }, { id: "C18", hex: "#213244" }, { id: "C19", hex: "#18869d" }, { id: "C20", hex: "#1a70a9" }, { id: "C21", hex: "#bcddfc" }, { id: "C22", hex: "#6bb1bb" }, { id: "C23", hex: "#c8e2fd" }, { id: "C24", hex: "#7ec5f9" }, { id: "C25", hex: "#a9e8e0" }, { id: "C26", hex: "#42adcf" }, { id: "C27", hex: "#d0def9" }, { id: "C28", hex: "#bdcee8" }, { id: "C29", hex: "#364a89" }, { id: "D1", hex: "#acb7ef" }, { id: "D2", hex: "#868dd3" }, { id: "D3", hex: "#3554af" }, { id: "D4", hex: "#162d7b" }, { id: "D5", hex: "#b34ec6" }, { id: "D6", hex: "#b37bdc" }, { id: "D7", hex: "#8758a9" }, { id: "D8", hex: "#e3d2fe" }, { id: "D9", hex: "#d5b9f4" }, { id: "D10", hex: "#301a49" }, { id: "D11", hex: "#beb9e2" }, { id: "D12", hex: "#dc99ce" }, { id: "D13", hex: "#b5038d" }, { id: "D14", hex: "#862993" }, { id: "D15", hex: "#2f1f8c" }, { id: "D16", hex: "#e2e4f0" }, { id: "D17", hex: "#c7d3f9" }, { id: "D18", hex: "#9a64b8" }, { id: "D19", hex: "#d8c2d9" }, { id: "D20", hex: "#9a35ad" }, { id: "D21", hex: "#940595" }, { id: "D22", hex: "#38389a" }, { id: "D23", hex: "#eadbf8" }, { id: "D24", hex: "#768ae1" }, { id: "D25", hex: "#4950c2" }, { id: "D26", hex: "#d6c6eb" }, { id: "E1", hex: "#f6d4cb" }, { id: "E2", hex: "#fcc1dd" }, { id: "E3", hex: "#f6bde8" }, { id: "E4", hex: "#e8649e" }, { id: "E5", hex: "#f0569f" }, { id: "E6", hex: "#eb4172" }, { id: "E7", hex: "#c53674" }, { id: "E8", hex: "#fddbe9" }, { id: "E9", hex: "#e376c7" }, { id: "E10", hex: "#d13b95" }, { id: "E11", hex: "#f7dad4" }, { id: "E12", hex: "#f693bf" }, { id: "E13", hex: "#b5026a" }, { id: "E14", hex: "#fad4bf" }, { id: "E15", hex: "#f5c9ca" }, { id: "E16", hex: "#fbf4ec" }, { id: "E17", hex: "#f7e3ec" }, { id: "E18", hex: "#f9c8db" }, { id: "E19", hex: "#f6bbd1" }, { id: "E20", hex: "#d7c6ce" }, { id: "E21", hex: "#c09da4" }, { id: "E22", hex: "#b38c9f" }, { id: "E23", hex: "#937d8a" }, { id: "E24", hex: "#debee5" }, { id: "F1", hex: "#fe9381" }, { id: "F2", hex: "#f63d4b" }, { id: "F3", hex: "#ee4e3e" }, { id: "F4", hex: "#fb2a40" }, { id: "F5", hex: "#e10328" }, { id: "F6", hex: "#913635" }, { id: "F7", hex: "#911932" }, { id: "F8", hex: "#bb0126" }, { id: "F9", hex: "#e0677a" }, { id: "F10", hex: "#874628" }, { id: "F11", hex: "#592323" }, { id: "F12", hex: "#f3536b" }, { id: "F13", hex: "#f45c45" }, { id: "F14", hex: "#fcadb2" }, { id: "F15", hex: "#d50527" }, { id: "F16", hex: "#f8c0a9" }, { id: "F17", hex: "#e89b7d" }, { id: "F18", hex: "#d07f4a" }, { id: "F19", hex: "#be454a" }, { id: "F20", hex: "#c69495" }, { id: "F21", hex: "#f2b8c6" }, { id: "F22", hex: "#f7c3d0" }, { id: "F23", hex: "#ed806c" }, { id: "F24", hex: "#e09daf" }, { id: "F25", hex: "#e84854" }, { id: "G1", hex: "#ffe4d3" }, { id: "G2", hex: "#fcc6ac" }, { id: "G3", hex: "#f1c4a5" }, { id: "G4", hex: "#dcb387" }, { id: "G5", hex: "#e7b34e" }, { id: "G6", hex: "#e3a014" }, { id: "G7", hex: "#985c3a" }, { id: "G8", hex: "#713d2f" }, { id: "G9", hex: "#e4b685" }, { id: "G10", hex: "#da8c42" }, { id: "G11", hex: "#dac898" }, { id: "G12", hex: "#fec993" }, { id: "G13", hex: "#b2714b" }, { id: "G14", hex: "#8b684c" }, { id: "G15", hex: "#f6f8e3" }, { id: "G16", hex: "#f2d8c1" }, { id: "G17", hex: "#77544e" }, { id: "G18", hex: "#ffe3d5" }, { id: "G19", hex: "#dd7d41" }, { id: "G20", hex: "#a5452f" }, { id: "G21", hex: "#b38561" }, { id: "H1", hex: "#ffffff" }, { id: "H2", hex: "#fbfbfb" }, { id: "H3", hex: "#b4b4b4" }, { id: "H4", hex: "#878787" }, { id: "H5", hex: "#464648" }, { id: "H6", hex: "#2c2c2c" }, { id: "H7", hex: "#010101" }, { id: "H8", hex: "#e7d6dc" }, { id: "H9", hex: "#efedee" }, { id: "H10", hex: "#ebebeb" }, { id: "H11", hex: "#cdcdcd" }, { id: "H12", hex: "#fdf6ee" }, { id: "H13", hex: "#f4edf1" }, { id: "H14", hex: "#ced7d4" }, { id: "H15", hex: "#9aa6a6" }, { id: "H16", hex: "#1b1213" }, { id: "H17", hex: "#f0eeef" }, { id: "H18", hex: "#fcfff6" }, { id: "H19", hex: "#f2eee5" }, { id: "H20", hex: "#96a09f" }, { id: "H21", hex: "#f8fbe6" }, { id: "H22", hex: "#cacad2" }, { id: "H23", hex: "#9b9c94" }, { id: "M1", hex: "#bbc6b6" }, { id: "M2", hex: "#909994" }, { id: "M3", hex: "#697e81" }, { id: "M4", hex: "#e0d4bc" }, { id: "M5", hex: "#d1ccaf" }, { id: "M6", hex: "#b0aa86" }, { id: "M7", hex: "#b0a796" }, { id: "M8", hex: "#ae8082" }, { id: "M9", hex: "#a68862" }, { id: "M10", hex: "#c4b3bb" }, { id: "M11", hex: "#9d7693" }, { id: "M12", hex: "#644b51" }, { id: "M13", hex: "#c79266" }, { id: "M14", hex: "#c27563" }, { id: "M15", hex: "#747d7a" }
    ]
  },
  {
    id: "perler",
    name: "Perler 普勒",
    colors: [
      { id: "1", name: "白色", hex: "#FFFFFF" }, { id: "2", name: "浅灰", hex: "#D0D0D0" }, { id: "3", name: "黄色", hex: "#FFD100" }, { id: "4", name: "橙色", hex: "#F6AD42" }, { id: "5", name: "红色", hex: "#E50023" }, { id: "6", name: "粉红", hex: "#FFB6C1" }, { id: "7", name: "浅紫", hex: "#9678B6" }, { id: "8", name: "蓝色", hex: "#004F8E" }, { id: "9", name: "天蓝色", hex: "#64B0E8" }, { id: "10", name: "深绿", hex: "#006838" }, { id: "11", name: "浅绿", hex: "#8BD26F" }, { id: "12", name: "棕色", hex: "#6F4E37" }, { id: "13", name: "黑色", hex: "#000000" }, { id: "14", name: "中灰", hex: "#969696" }, { id: "15", name: "深灰", hex: "#666666" }, { id: "16", name: "紫罗兰", hex: "#604089" }, { id: "17", name: "深蓝", hex: "#1A237E" }, { id: "18", name: "青色", hex: "#00BCD4" }, { id: "19", name: "薄荷绿", hex: "#98FB98" }, { id: "20", name: "橄榄绿", hex: "#808000" }, { id: "21", name: "浅棕", hex: "#A67C52" }, { id: "22", name: "卡其", hex: "#E5C89E" }, { id: "25", name: "玫瑰粉", hex: "#F48FB1" }, { id: "26", name: "酒红", hex: "#B71C1C" }, { id: "28", name: "浅肤色", hex: "#FEDABC" }, { id: "30", name: "深肤色", hex: "#D9B59C" }, { id: "35", name: "珊瑚色", hex: "#FF7F50" }, { id: "40", name: "薰衣草", hex: "#C8A2C8" }, { id: "41", name: "透明", hex: "#FFFFFF" }, { id: "45", name: "珠光白", hex: "#F0F0F0" }, { id: "50", name: "珠光粉", hex: "#FFC0CB" }, { id: "52", name: "夜光绿", hex: "#E1F5C4" }, { id: "60", name: "金属金", hex: "#D4AF37" }, { id: "61", name: "金属银", hex: "#A09F9D" }, { id: "62", name: "金属铜", hex: "#B87333" }
    ]
  },
  {
    id: "artkal",
    name: "Artkal 阿特卡尔",
    colors: [
      { id: "S01", name: "白色", hex: "#FFFFFF" }, { id: "S02", name: "奶油白", hex: "#F5F5DC" }, { id: "S03", name: "橙黄", hex: "#FFB74D" }, { id: "S04", name: "金黄", hex: "#FFC107" }, { id: "S05", name: "正红", hex: "#E50023" }, { id: "S06", name: "玫红", hex: "#D81B60" }, { id: "S07", name: "中灰", hex: "#9E9E9E" }, { id: "S08", name: "天蓝", hex: "#64B5F6" }, { id: "S09", name: "宝蓝", hex: "#1976D2" }, { id: "S10", name: "草绿", hex: "#8BC34A" }, { id: "S11", name: "墨绿", hex: "#2E7D32" }, { id: "S12", name: "棕色", hex: "#6D4C41" }, { id: "S13", name: "黑色", hex: "#000000" }, { id: "S14", name: "浅灰", hex: "#E0E0E0" }, { id: "S15", name: "深灰", hex: "#616161" }, { id: "S16", name: "紫色", hex: "#7E57C2" }, { id: "S17", name: "浅紫", hex: "#B39DDB" }, { id: "S18", name: "青色", hex: "#00BCD4" }, { id: "S19", name: "薄荷绿", hex: "#81C784" }, { id: "S20", name: "橄榄绿", hex: "#808000" }, { id: "S21", name: "浅棕", hex: "#A1887F" }, { id: "S22", name: "卡其色", hex: "#D7CCC8" }, { id: "S23", name: "粉色", hex: "#F48FB1" }, { id: "S24", name: "深粉", hex: "#C2185B" }, { id: "S25", name: "橘红", hex: "#F4511E" }, { id: "S26", name: "酒红", hex: "#B71C1C" }, { id: "S27", name: "深蓝", hex: "#0D47A1" }, { id: "S28", name: "湖蓝", hex: "#2196F3" }, { id: "S29", name: "嫩绿", hex: "#AED581" }, { id: "S30", name: "黄绿", hex: "#CDDC39" }, { id: "S31", name: "土黄", hex: "#8D6E63" }, { id: "S32", name: "深棕", hex: "#4E342E" }, { id: "S33", name: "肤色", hex: "#FDD7B1" }, { id: "S34", name: "深肤色", hex: "#DABBA6" }, { id: "S35", name: "腮红", hex: "#FFAB91" }, { id: "S36", name: "薰衣草", hex: "#B388EB" }, { id: "S40", name: "透明", hex: "#FFFFFF" }, { id: "S41", name: "铜色", hex: "#B87333" }, { id: "S42", name: "银色", hex: "#A09F9D" }, { id: "S43", name: "金色", hex: "#D4AF37" }, { id: "S50", name: "霓虹粉", hex: "#FF3991" }, { id: "S51", name: "霓虹橙", hex: "#FF6600" }, { id: "S52", name: "霓虹黄", hex: "#FFFF00" }, { id: "S53", name: "霓虹绿", hex: "#00FF00" }, { id: "S54", name: "霓虹蓝", hex: "#00BFFF" }, { id: "S60", name: "夜光绿", hex: "#E1F5C4" }, { id: "S61", name: "夜光蓝", hex: "#B2FFFA" }, { id: "S70", name: "雾霾蓝", hex: "#8297D9" }, { id: "S71", name: "莫兰迪灰蓝", hex: "#90A4AE" }, { id: "S79", name: "浅灰", hex: "#BDBDBD" }, { id: "S89", name: "炭灰", hex: "#424242" }, { id: "S99", name: "珠光白", hex: "#F5F5F5" }
    ]
  }
];

export const BEAD_BRANDS_DATA: BeadBrand[] = RAW_BRANDS_DATA.map(brand => ({
  ...brand,
  colors: brand.colors.map((color: any) => ({
    ...color,
    name: color.name || color.id,
    rgb: hexToRgb(color.hex)
  }))
}));

export function findClosestColor(r: number, g: number, b: number, brand: BeadBrand): BeadColor {
  let closest = brand.colors[0];
  let minDistance = Infinity;

  for (const color of brand.colors) {
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

/**
 * Determine text color (black or white) based on background color brightness
 * to ensure readability of the bead label.
 */
export function getContrastYIQ(hexcolor: string): string {
  if (hexcolor.slice(0, 1) === '#') {
    hexcolor = hexcolor.slice(1);
  }
  const r = parseInt(hexcolor.substr(0, 2), 16);
  const g = parseInt(hexcolor.substr(2, 2), 16);
  const b = parseInt(hexcolor.substr(4, 2), 16);
  
  const yiq = ((r * 299) + (g * 587) + (b * 114)) / 1000;
  
  return (yiq >= 128) ? '#333333' : '#FFFFFF';
}