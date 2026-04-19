import { useState, useRef, useEffect, useCallback } from 'react';
import { Upload, Eraser, ChevronDown, Download, Sparkles, ZoomIn, ZoomOut, Move, Image as ImageIcon, CheckCircle2, Crown, Heart, Wand2, Scissors, Paintbrush, Loader2, Undo, MessageCircle, X } from 'lucide-react';
import { BEAD_BRANDS_DATA, findClosestColor, getContrastYIQ } from './data/beadConfig';
import type { BeadBrand, BeadColor } from './data/beadConfig';
import { removeBackground } from '@imgly/background-removal';

interface PixelData {
  colorId: string;
  color: BeadColor;
}

interface ColorCount {
  colorId: string;
  color: BeadColor;
  count: number;
}

type GridSize = 30 | 50 | 52 | 100 | 200;

const GRID_OPTIONS: { label: string; value: GridSize }[] = [
  { label: '30 x 30 迷你', value: 30 },
  { label: '50 x 50 标准', value: 50 },
  { label: '52 x 52 经典', value: 52 },
  { label: '100 x 100 巨型', value: 100 },
  { label: '200 x 200 终极', value: 200 },
];

// Helper function to call SiliconFlow Image Generation API
const generateImageWithAI = async (userPrompt: string): Promise<HTMLImageElement> => {
  // Use local relative path pointing to Netlify Function
  // In local Vite dev environment, Vite proxy will forward this.
  // In Netlify production, it naturally works.
  const API_URL = '/.netlify/functions/generateImage';

  // Construct a strong prompt for cute pixel/vector art style suitable for perler beads
  const enhancedPrompt = `(Masterpiece), (Pixel Art Sprite), (Flat 2D Vector), ${userPrompt}, (bold clean outlines), (flat color blocks), (solid white background), simple shapes, minimal shading, limited palette, high contrast, centered composition, adorable aesthetic, kawaii style, [no gradients, no blur, no realistic textures]`;

  try {
    const response = await fetch(API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
        // API Key is now injected by the Netlify Function Backend
      },
      body: JSON.stringify({
        model: 'Kwai-Kolors/Kolors', // Using a supported Kolors model
        prompt: enhancedPrompt,
        image_size: '1024x1024',
        batch_size: 1
      })
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error('API responded with error:', errorData);
      throw new Error(errorData.message || 'Failed to generate image');
    }

    const data = await response.json();
    const imageUrl = data.images[0].url;

    return new Promise((resolve, reject) => {
      const img = new Image();
      img.crossOrigin = 'Anonymous'; // Crucial for CORS when using external images in canvas
      img.onload = () => resolve(img);
      img.onerror = () => {
        console.error('Failed to load image from URL:', imageUrl);
        reject(new Error('Failed to load generated image'));
      };
      img.src = imageUrl;
    });

  } catch (error) {
    console.error("AI Generation Error details:", error);
    throw error;
  }
};

function calculateGridDimensions(imgWidth: number, imgHeight: number, maxGridSize: number) {
  const isLandscape = imgWidth > imgHeight;
  let gridW, gridH;
  
  if (isLandscape) {
    gridW = maxGridSize;
    gridH = Math.max(1, Math.round((imgHeight / imgWidth) * maxGridSize));
  } else {
    gridH = maxGridSize;
    gridW = Math.max(1, Math.round((imgWidth / imgHeight) * maxGridSize));
  }
  
  return { gridW, gridH };
}

function processImage(
  img: HTMLImageElement,
  maxGridSize: number,
  brand: BeadBrand
): { pixels: PixelData[][]; colorCounts: ColorCount[]; gridW: number; gridH: number } {
  
  const { gridW, gridH } = calculateGridDimensions(img.width, img.height, maxGridSize);

  const hiddenCanvas = document.createElement('canvas');
  hiddenCanvas.width = gridW;
  hiddenCanvas.height = gridH;
  const ctx = hiddenCanvas.getContext('2d', { willReadFrequently: true })!;
  
  // Disable smoothing for pixel art look
  ctx.imageSmoothingEnabled = false;
  ctx.drawImage(img, 0, 0, gridW, gridH);

  const imageData = ctx.getImageData(0, 0, gridW, gridH);
  const pixels: PixelData[][] = [];
  const colorMap = new Map<string, number>();

  for (let y = 0; y < gridH; y++) {
    const row: PixelData[] = [];
    for (let x = 0; x < gridW; x++) {
      const i = (y * gridW + x) * 4;
      const r = imageData.data[i];
      const g = imageData.data[i + 1];
      const b = imageData.data[i + 2];
      const a = imageData.data[i + 3];

      if (a < 128) {
        row.push({ colorId: 'transparent', color: brand.colors[0] });
        continue;
      }

      const matchedColor = findClosestColor(r, g, b, brand);
      row.push({ colorId: matchedColor.id, color: matchedColor });

      const currentCount = colorMap.get(matchedColor.id) || 0;
      colorMap.set(matchedColor.id, currentCount + 1);
    }
    pixels.push(row);
  }

  const colorCounts: ColorCount[] = [];
  colorMap.forEach((count, colorId) => {
    const color = brand.colors.find(c => c.id === colorId)!;
    colorCounts.push({ colorId, color, count });
  });
  
  // Sort primarily by ID for better legend organization
  colorCounts.sort((a, b) => {
    const aMatch = a.colorId.match(/([A-Za-z]*)(\d+)/);
    const bMatch = b.colorId.match(/([A-Za-z]*)(\d+)/);
    
    if (aMatch && bMatch && aMatch[1] === bMatch[1]) {
      return parseInt(aMatch[2]) - parseInt(bMatch[2]);
    }
    return a.colorId.localeCompare(b.colorId);
  });

  return { pixels, colorCounts, gridW, gridH };
}

function renderCanvas(
  canvas: HTMLCanvasElement,
  pixels: PixelData[][],
  gridW: number,
  gridH: number,
  showLabels: boolean,
  highlightColorId: string | null
) {
  const ctx = canvas.getContext('2d')!;
  
  const targetCellSize = 30; // Bigger cells for clear bead display
  const padding = 10;
  
  canvas.width = gridW * targetCellSize + padding * 2;
  canvas.height = gridH * targetCellSize + padding * 2;

  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // Background for grid
  ctx.fillStyle = '#FFFFFF';
  ctx.fillRect(padding, padding, gridW * targetCellSize, gridH * targetCellSize);

  // 1. Draw Grid Lines
  // Thin lines
  ctx.beginPath();
  for (let x = 0; x <= gridW; x++) {
    const pos = padding + x * targetCellSize;
    ctx.moveTo(pos, padding);
    ctx.lineTo(pos, padding + gridH * targetCellSize);
  }
  for (let y = 0; y <= gridH; y++) {
    const pos = padding + y * targetCellSize;
    ctx.moveTo(padding, pos);
    ctx.lineTo(padding + gridW * targetCellSize, pos);
  }
  ctx.strokeStyle = 'rgba(0, 0, 0, 0.08)';
  ctx.lineWidth = 1;
  ctx.stroke();

  // Thick lines every 5 cells
  ctx.beginPath();
  for (let x = 0; x <= gridW; x += 5) {
    const pos = padding + x * targetCellSize;
    ctx.moveTo(pos, padding);
    ctx.lineTo(pos, padding + gridH * targetCellSize);
  }
  for (let y = 0; y <= gridH; y += 5) {
    const pos = padding + y * targetCellSize;
    ctx.moveTo(padding, pos);
    ctx.lineTo(padding + gridW * targetCellSize, pos);
  }
  ctx.strokeStyle = 'rgba(0, 0, 0, 0.25)';
  ctx.lineWidth = 2;
  ctx.stroke();

  // 2. Draw Beads
  for (let y = 0; y < gridH; y++) {
    for (let x = 0; x < gridW; x++) {
      const pixel = pixels[y][x];
      if (pixel.colorId === 'transparent') continue;

      const isHighlighted = highlightColorId === null || pixel.colorId === highlightColorId;
      const isFaded = highlightColorId !== null && pixel.colorId !== highlightColorId;

      const px = padding + x * targetCellSize + targetCellSize / 2;
      const py = padding + y * targetCellSize + targetCellSize / 2;

      ctx.globalAlpha = isFaded ? 0.15 : 1.0;

      // Square shape (Ironed beads look)
      const sqSize = targetCellSize * 0.96;
      const sqX = padding + x * targetCellSize + (targetCellSize - sqSize) / 2;
      const sqY = padding + y * targetCellSize + (targetCellSize - sqSize) / 2;

      // Draw bead shadow
      ctx.fillStyle = 'rgba(0,0,0,0.1)';
      ctx.beginPath();
      ctx.roundRect(sqX + 1.5, sqY + 1.5, sqSize, sqSize, 4);
      ctx.fill();

      // Draw bead
      ctx.fillStyle = pixel.color.hex;
      ctx.beginPath();
      ctx.roundRect(sqX, sqY, sqSize, sqSize, 4);
      ctx.fill();

      // Draw highlight (less pronounced for square)
      ctx.fillStyle = 'rgba(255,255,255,0.15)';
      ctx.beginPath();
      ctx.roundRect(sqX, sqY, sqSize, sqSize * 0.3, 4);
      ctx.fill();

      // Draw Labels
      if (showLabels && isHighlighted) {
        ctx.fillStyle = getContrastYIQ(pixel.color.hex);
        ctx.font = `bold ${targetCellSize * 0.35}px "Nunito", sans-serif`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(pixel.colorId, px, py + 1);
      }
      
      // Reset alpha for next element
      ctx.globalAlpha = 1.0;
    }
  }
}

function App() {
  const [activeBrandId, setActiveBrandId] = useState<string>(BEAD_BRANDS_DATA[0].id);
  const [maxGridSize, setMaxGridSize] = useState<GridSize>(50);
  const [showLabels, setShowLabels] = useState<boolean>(true);
  
  const [pixels, setPixels] = useState<PixelData[][] | null>(null);
  const [colorCounts, setColorCounts] = useState<ColorCount[]>([]);
  const [actualGridW, setActualGridW] = useState(0);
  const [actualGridH, setActualGridH] = useState(0);
  
  const [isProcessing, setIsProcessing] = useState(false);
  const [originalImage, setOriginalImage] = useState<HTMLImageElement | null>(null);

  // New states for magical features
  const [isRemovingBg, setIsRemovingBg] = useState(false);
  const [aiPrompt, setAiPrompt] = useState('');
  const [isAiGenerating, setIsAiGenerating] = useState(false);
  
  // QR Code Modal State
  const [showQrModal, setShowQrModal] = useState(false);
  const [showQrPopover, setShowQrPopover] = useState(false);

  // Close popover when clicking outside
  useEffect(() => {
    const handleGlobalClick = (e: MouseEvent) => {
      // Find the closest parent with our specific class
      const target = e.target as HTMLElement;
      if (!target.closest('.qr-widget-container')) {
        setShowQrPopover(false);
      }
    };
    
    if (showQrPopover) {
      document.addEventListener('click', handleGlobalClick);
      // Touch event for better mobile support
      document.addEventListener('touchstart', handleGlobalClick);
    }
    
    return () => {
      document.removeEventListener('click', handleGlobalClick);
      document.removeEventListener('touchstart', handleGlobalClick);
    };
  }, [showQrPopover]);

  // Highlighting
  const [highlightColorId, setHighlightColorId] = useState<string | null>(null);

  // Pan and Zoom State
  const [scale, setScale] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const lastMousePos = useRef({ x: 0, y: 0 });
  const lastTouchDist = useRef<number | null>(null);

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const canvasContainerRef = useRef<HTMLDivElement>(null);
  const activeBrand = BEAD_BRANDS_DATA.find(b => b.id === activeBrandId)!;

  // Reprocess Image
  const processAndRender = useCallback((img: HTMLImageElement, currentBrand: BeadBrand, currentMaxGrid: number) => {
    setIsProcessing(true);
    setTimeout(() => {
      const result = processImage(img, currentMaxGrid, currentBrand);
      setPixels(result.pixels);
      setColorCounts(result.colorCounts);
      setActualGridW(result.gridW);
      setActualGridH(result.gridH);
      
      // Auto-fit zoom based on image size and container
      const containerH = 400; // approximate view height
      const rawH = result.gridH * 30 + 20;
      if (rawH > containerH) {
        setScale(containerH / rawH);
      } else {
        setScale(1);
      }
      setPan({ x: 0, y: 0 });
      
      setIsProcessing(false);
    }, 50);
  }, []);

  // Trigger processing when image, grid size, or brand changes
  useEffect(() => {
    if (originalImage) {
      processAndRender(originalImage, activeBrand, maxGridSize);
    }
  }, [maxGridSize, activeBrand, originalImage, processAndRender]);

  // Re-render canvas when pixels or label toggle changes
  useEffect(() => {
    if (pixels && canvasRef.current) {
      renderCanvas(canvasRef.current, pixels, actualGridW, actualGridH, showLabels, highlightColorId);
    }
  }, [pixels, actualGridW, actualGridH, showLabels, highlightColorId]);

  // Clipboard Paste Support
  useEffect(() => {
    const handlePaste = (e: ClipboardEvent) => {
      if (e.clipboardData && e.clipboardData.files.length > 0) {
        const file = e.clipboardData.files[0];
        if (file.type.startsWith('image/')) {
          loadImageFromFile(file);
        }
      }
    };
    window.addEventListener('paste', handlePaste);
    return () => window.removeEventListener('paste', handlePaste);
  }, []);

  const loadImageFromFile = (file: File) => {
    const img = new Image();
    img.onload = () => {
      setOriginalImage(img);
    }
    img.src = URL.createObjectURL(file);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      loadImageFromFile(file);
    }
    e.target.value = '';
  };

  const [historyImages, setHistoryImages] = useState<HTMLImageElement[]>([]);

  const handleUndoBg = () => {
    if (historyImages.length > 0) {
      const prev = historyImages[historyImages.length - 1];
      setHistoryImages(historyImages.slice(0, -1));
      setOriginalImage(prev);
    }
  };

  const handleRemoveBgClick = async () => {
    if (!originalImage) return;
    setIsRemovingBg(true);
    try {
      setHistoryImages(prev => [...prev, originalImage]);
      const imageBlob = await removeBackground(originalImage.src);
      const url = URL.createObjectURL(imageBlob);
      const newImg = new Image();
      newImg.onload = () => {
        setOriginalImage(newImg);
      };
      newImg.src = url;
    } catch (error) {
      console.error('Failed to remove background:', error);
      alert('抠图失败，请稍后重试或检查图片。');
    } finally {
      setIsRemovingBg(false);
    }
  };

  const handleAiGenerate = async () => {
    if (!aiPrompt.trim()) return;
    setIsAiGenerating(true);
    try {
      const generated = await generateImageWithAI(aiPrompt);
      setOriginalImage(generated);
      // Clear history when generating new image
      setHistoryImages([]);
    } catch (error) {
      console.error('Failed to generate image:', error);
      alert('AI 生图失败，请稍后重试或检查提示词。');
    } finally {
      setIsAiGenerating(false);
    }
  };

  // Zoom and Pan Handlers
  useEffect(() => {
    const el = canvasContainerRef.current;
    if (!el) return;

    const handleWheelNative = (e: WheelEvent) => {
      if (!pixels) return;
      e.preventDefault();
      // Use a smaller sensitivity for smoother zooming
      const zoomSensitivity = 0.001;
      const delta = -e.deltaY * zoomSensitivity;
      setScale(prev => Math.min(Math.max(0.1, prev * (1 + delta)), 5));
    };

    el.addEventListener('wheel', handleWheelNative, { passive: false });
    return () => el.removeEventListener('wheel', handleWheelNative);
  }, [pixels]);

  const handleMouseDown = (e: React.MouseEvent) => {
    if (!pixels) return;
    setIsDragging(true);
    lastMousePos.current = { x: e.clientX, y: e.clientY };
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    const dx = e.clientX - lastMousePos.current.x;
    const dy = e.clientY - lastMousePos.current.y;
    setPan(prev => ({ x: prev.x + dx, y: prev.y + dy }));
    lastMousePos.current = { x: e.clientX, y: e.clientY };
  };

  const handleMouseUpOrLeave = () => {
    setIsDragging(false);
  };

  // Touch Handlers for Mobile Pan/Zoom
  const getTouchDistance = (touches: React.TouchList) => {
    return Math.hypot(
      touches[0].clientX - touches[1].clientX,
      touches[0].clientY - touches[1].clientY
    );
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    if (!pixels) return;
    if (e.touches.length === 1) {
      setIsDragging(true);
      lastMousePos.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
    } else if (e.touches.length === 2) {
      lastTouchDist.current = getTouchDistance(e.touches);
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!pixels) return;
    if (e.touches.length === 1 && isDragging) {
      const dx = e.touches[0].clientX - lastMousePos.current.x;
      const dy = e.touches[0].clientY - lastMousePos.current.y;
      setPan(prev => ({ x: prev.x + dx, y: prev.y + dy }));
      lastMousePos.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
    } else if (e.touches.length === 2 && lastTouchDist.current !== null) {
      const dist = getTouchDistance(e.touches);
      const delta = (dist - lastTouchDist.current) * 0.01;
      setScale(prev => Math.min(Math.max(0.1, prev + delta), 5));
      lastTouchDist.current = dist;
    }
  };

  const handleTouchEnd = () => {
    setIsDragging(false);
    lastTouchDist.current = null;
  };

  const handleExport = () => {
    if (!canvasRef.current || colorCounts.length === 0) return;

    const exportCanvas = document.createElement('canvas');
    const ctx = exportCanvas.getContext('2d')!;
    
    const sourceCanvas = canvasRef.current;
    
    const padding = 60;
    // Legend height calculation: 8 items per row
    const cols = 8;
    const rowHeight = 60;
    const rows = Math.ceil(colorCounts.length / cols);
    const statsHeight = rows * rowHeight + 160; 
    
    exportCanvas.width = Math.max(sourceCanvas.width + padding * 2, 1200);
    exportCanvas.height = sourceCanvas.height + statsHeight + padding * 2;

    // 1. Draw Cream Background
    ctx.fillStyle = '#FAF7F2';
    ctx.fillRect(0, 0, exportCanvas.width, exportCanvas.height);

    // 2. Draw Main Grid centered horizontally
    const canvasX = (exportCanvas.width - sourceCanvas.width) / 2;
    ctx.drawImage(sourceCanvas, canvasX, padding);

    // 3. Draw Stats Title
    const statsStartY = padding + sourceCanvas.height + 60;
    ctx.fillStyle = '#4A4A4A';
    ctx.font = 'bold 36px "Nunito", sans-serif';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'top';
    ctx.fillText(`材料清单 - ${activeBrand.name} (${actualGridW}x${actualGridH})`, padding, statsStartY);

    const totalBeads = colorCounts.reduce((acc, curr) => acc + curr.count, 0);
    ctx.fillStyle = '#8B8B8B';
    ctx.font = 'bold 20px "Nunito", sans-serif';
    ctx.fillText(`总计: ${totalBeads} 颗`, padding, statsStartY + 50);

    // 4. Draw Stats Legend (Square blocks matching website UI)
    let currentX = padding;
    let currentY = statsStartY + 100;
    const colWidth = (exportCanvas.width - padding * 2) / cols;

    colorCounts.forEach((stat, index) => {
      if (index > 0 && index % cols === 0) {
        currentX = padding;
        currentY += rowHeight;
      }

      const itemWidth = colWidth - 16;
      const itemHeight = 36;
      const radius = 6;
      
      // Draw main border / background
      ctx.beginPath();
      ctx.roundRect(currentX + 8, currentY + 12, itemWidth, itemHeight, radius);
      ctx.fillStyle = '#FFFFFF';
      ctx.fill();
      ctx.lineWidth = 1;
      ctx.strokeStyle = '#D1D5DB'; // Tailwind gray-300
      ctx.stroke();

      // Left part (color block)
      ctx.save();
      ctx.beginPath();
      // Clip to rounded rect
      ctx.roundRect(currentX + 8, currentY + 12, itemWidth, itemHeight, radius);
      ctx.clip();
      
      ctx.fillStyle = stat.color.hex;
      ctx.fillRect(currentX + 8, currentY + 12, itemWidth / 2, itemHeight);
      
      // Divider line
      ctx.beginPath();
      ctx.moveTo(currentX + 8 + itemWidth / 2, currentY + 12);
      ctx.lineTo(currentX + 8 + itemWidth / 2, currentY + 12 + itemHeight);
      ctx.strokeStyle = '#E5E7EB'; // Tailwind gray-200
      ctx.stroke();
      
      ctx.restore();

      // Text Left (Color ID)
      ctx.fillStyle = getContrastYIQ(stat.color.hex);
      ctx.font = 'bold 16px "Nunito", sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(stat.colorId, currentX + 8 + itemWidth / 4, currentY + 12 + itemHeight / 2 + 1);
      
      // Text Right (Count)
      ctx.fillStyle = '#1F2937'; // Tailwind gray-800
      ctx.font = 'bold 16px "Nunito", sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(`${stat.count}`, currentX + 8 + (itemWidth * 3) / 4, currentY + 12 + itemHeight / 2 + 1);

      currentX += colWidth;
    });

    // Trigger Download
    const link = document.createElement('a');
    link.download = `fuse-bead-${activeBrand.id}-${Date.now()}.png`;
    link.href = exportCanvas.toDataURL('image/png');
    link.click();
  };

  return (
    <div className="min-h-screen bg-[#FFF5F5] text-gray-700 font-sans selection:bg-pink-200 pb-16">
      
      {/* App Header */}
      <header className="pt-8 pb-4">
        <div className="max-w-7xl mx-auto px-6 lg:px-10 flex items-center justify-between">
          <div className="flex items-center gap-4 bg-white px-6 py-3 rounded-[2rem] shadow-[0_4px_20px_rgb(0,0,0,0.03)] border border-pink-50">
            <div className="w-12 h-12 bg-gradient-to-br from-pink-100 to-orange-100 text-pink-500 rounded-full flex items-center justify-center shadow-inner">
              <Sparkles size={24} strokeWidth={2.5} />
            </div>
            <div>
              <h1 className="text-2xl font-extrabold text-gray-800 tracking-tight">像素拼豆魔法</h1>
              <p className="text-sm text-pink-400 font-bold flex items-center gap-1">
                <Crown size={14} /> Creamy & Cute V5
              </p>
            </div>
          </div>
          
          <div className="hidden sm:flex items-center gap-3">
             <div className="bg-white px-5 py-2.5 rounded-full shadow-sm border border-pink-50 flex items-center gap-2">
               <span className="w-2.5 h-2.5 bg-green-400 rounded-full animate-pulse shadow-[0_0_8px_rgba(74,222,128,0.6)]"></span>
               <span className="text-sm font-bold text-gray-600">魔法工坊已就绪</span>
             </div>
          </div>
        </div>
      </header>

      {/* Main Content Layout */}
      <main className="max-w-7xl mx-auto px-6 lg:px-10 flex flex-col gap-6">
        
        <div className="grid grid-cols-1 lg:grid-cols-[380px_1fr] gap-6">
          
          {/* Left Column: Tools & Controls */}
          <div className="flex flex-col gap-6">
            
            {/* Input Source Card */}
            <div className="bg-white rounded-[2.5rem] p-6 shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-pink-50 relative overflow-hidden">
              <div className="absolute -right-10 -top-10 w-32 h-32 bg-pink-50 rounded-full opacity-50 blur-2xl"></div>
              <h2 className="text-xl font-extrabold text-gray-800 mb-4 flex items-center gap-2">
                <Paintbrush className="text-pink-400" /> 获取图纸来源
              </h2>
              
              <div className="space-y-4 relative z-10">
                {/* Local Upload */}
                <div className="p-4 bg-gray-50 rounded-3xl border border-gray-100 hover:border-pink-100 transition-colors">
                  <label className="flex w-full items-center justify-center px-6 py-3 rounded-full bg-white text-gray-700 font-bold hover:bg-pink-50 hover:text-pink-500 transition-all shadow-sm cursor-pointer group">
                    <Upload size={18} className="mr-2 group-hover:-translate-y-0.5 transition-transform" />
                    <span>导入图片或图纸</span>
                    <input type="file" accept="image/*" onChange={handleFileUpload} className="hidden" />
                  </label>
                  <p className="text-xs text-center text-gray-400 mt-3 font-medium">支持导入已有图纸以重新转换<br/>或直接在网页任意处 <kbd className="bg-white px-2 py-0.5 rounded shadow-sm">Ctrl+V</kbd> 粘贴</p>
                </div>

                <div className="flex items-center justify-center gap-2">
                  <div className="h-px bg-gray-100 flex-1"></div>
                  <span className="text-xs font-bold text-gray-300">OR</span>
                  <div className="h-px bg-gray-100 flex-1"></div>
                </div>

                {/* AI Generation */}
                <div className="p-4 bg-gradient-to-br from-pink-50 to-orange-50 rounded-3xl border border-pink-100">
                  <h3 className="text-sm font-bold text-pink-600 mb-2 flex items-center gap-1">
                    <Wand2 size={16} /> AI 灵感创作
                  </h3>
                  <textarea
                    value={aiPrompt}
                    onChange={e => setAiPrompt(e.target.value)}
                    placeholder="输入灵感，如：一只正在吃脆脆鲨的蓝色小鲨鱼..."
                    className="w-full h-24 p-3 rounded-2xl bg-white border-none focus:ring-2 focus:ring-pink-200 text-sm font-medium resize-none shadow-inner"
                  />
                  <button
                    onClick={handleAiGenerate}
                    disabled={isAiGenerating || !aiPrompt.trim()}
                    className="mt-3 w-full flex items-center justify-center px-6 py-3 rounded-full bg-pink-400 text-white font-bold hover:bg-pink-500 disabled:bg-pink-200 transition-all shadow-md shadow-pink-200"
                  >
                    {isAiGenerating ? (
                      <>
                        <Loader2 size={18} className="mr-2 animate-spin" />
                        <span>正在为你施展魔法...</span>
                      </>
                    ) : (
                      <>
                        <Wand2 size={18} className="mr-2" />
                        <span>生成魔法拼豆</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>

            {/* Magic Tools Card */}
            {originalImage && (
              <div className="bg-white rounded-[2.5rem] p-6 shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-blue-50 relative overflow-hidden animate-in fade-in slide-in-from-bottom-4">
                <div className="absolute -left-10 -top-10 w-32 h-32 bg-blue-50 rounded-full opacity-50 blur-2xl"></div>
                <h2 className="text-xl font-extrabold text-gray-800 mb-4 flex items-center gap-2 relative z-10">
                  <Scissors className="text-blue-400" /> 图像处理
                </h2>
                <div className="relative z-10 flex gap-2">
                  <button
                    onClick={handleRemoveBgClick}
                    disabled={isRemovingBg}
                    className="flex-1 flex items-center justify-center px-6 py-3 rounded-full bg-blue-50 text-blue-600 font-bold hover:bg-blue-100 disabled:opacity-50 transition-all shadow-sm"
                  >
                    {isRemovingBg ? (
                      <>
                        <Loader2 size={18} className="mr-2 animate-spin" />
                        <span>处理中...</span>
                      </>
                    ) : (
                      <>
                        <Eraser size={18} className="mr-2" />
                        <span>一键智能去背景</span>
                      </>
                    )}
                  </button>
                  {historyImages.length > 0 && (
                    <button
                      onClick={handleUndoBg}
                      className="flex items-center justify-center px-4 py-3 rounded-full bg-gray-50 text-gray-600 font-bold hover:bg-gray-100 transition-all shadow-sm"
                      title="撤回抠图"
                    >
                      <Undo size={18} />
                    </button>
                  )}
                </div>
              </div>
            )}

            {/* Stats Overview */}
            <div className="bg-white rounded-[2.5rem] p-6 shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-orange-50">
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-orange-50 rounded-2xl p-4 flex flex-col items-center justify-center">
                  <h4 className="text-2xl font-extrabold text-orange-500 mb-1">{colorCounts.reduce((acc, curr) => acc + curr.count, 0)}</h4>
                  <p className="text-xs font-bold text-orange-300">需要颗粒总数</p>
                </div>
                <div className="bg-green-50 rounded-2xl p-4 flex flex-col items-center justify-center">
                  <h4 className="text-2xl font-extrabold text-green-500 mb-1">{colorCounts.length > 0 ? colorCounts.length : '0'}</h4>
                  <p className="text-xs font-bold text-green-300">使用色号数量</p>
                </div>
                <div className="col-span-2 bg-gray-50 rounded-2xl p-4 flex flex-col items-center justify-center">
                  <h4 className="text-2xl font-extrabold text-gray-600 mb-1">{actualGridW ? `${actualGridW}x${actualGridH}` : '-'}</h4>
                  <p className="text-xs font-bold text-gray-400">图纸实际网格尺寸</p>
                </div>
              </div>
            </div>

          </div>

          {/* Right Column: Canvas & Controls */}
          <div className="flex flex-col gap-6">
            
            {/* Top Action Bar */}
            <div className="bg-white rounded-[2.5rem] shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-pink-50 p-4 flex flex-wrap items-center gap-3 justify-between">
              
              <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto">
                {/* Brand Selection */}
                <div className="relative flex-1 sm:flex-none bg-gray-50 rounded-full">
                  <select
                    value={activeBrandId}
                    onChange={e => setActiveBrandId(e.target.value)}
                    className="w-full appearance-none pl-5 pr-10 py-2.5 bg-transparent text-sm font-bold text-gray-700 focus:outline-none cursor-pointer"
                  >
                    {BEAD_BRANDS_DATA.map(opt => (
                      <option key={opt.id} value={opt.id}>{opt.name}</option>
                    ))}
                  </select>
                  <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400" size={16} />
                </div>

                {/* Grid Size */}
                <div className="relative flex-1 sm:flex-none bg-gray-50 rounded-full">
                  <select
                    value={maxGridSize}
                    onChange={e => setMaxGridSize(Number(e.target.value) as GridSize)}
                    className="w-full appearance-none pl-5 pr-10 py-2.5 bg-transparent text-sm font-bold text-gray-700 focus:outline-none cursor-pointer"
                  >
                    {GRID_OPTIONS.map(opt => (
                      <option key={opt.value} value={opt.value}>{opt.label}</option>
                    ))}
                  </select>
                  <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400" size={16} />
                </div>
                
                {/* Label Toggle */}
                <label className="flex items-center gap-2 cursor-pointer px-4 py-2 bg-gray-50 rounded-full">
                  <input 
                    type="checkbox" 
                    className="sr-only" 
                    checked={showLabels}
                    onChange={(e) => setShowLabels(e.target.checked)}
                  />
                  <div className={`block w-10 h-6 rounded-full transition-colors duration-300 ${showLabels ? 'bg-pink-400' : 'bg-gray-300'}`}></div>
                  <div className={`absolute left-5 top-3 bg-white w-4 h-4 rounded-full transition-transform duration-300 shadow-sm ${showLabels ? 'translate-x-4' : ''}`}></div>
                  <span className="text-sm font-bold text-gray-600">色号标注</span>
                </label>

                {/* Zoom Percentage */}
                <div className="relative flex items-center bg-gray-50 rounded-full px-4 py-2 gap-2 w-full sm:w-auto">
                  <ZoomIn size={16} className="text-gray-400" />
                  <select
                    value={Math.round(scale * 100)}
                    onChange={e => {
                      setScale(Number(e.target.value) / 100);
                      setPan({ x: 0, y: 0 }); // Reset pan when manually zooming
                    }}
                    className="bg-transparent text-sm font-bold text-gray-600 focus:outline-none cursor-pointer appearance-none pr-4"
                  >
                    {[10, 25, 50, 75, 100, 125, 150, 200, 300, 400, 500].map(val => (
                      <option key={val} value={val}>{val}%</option>
                    ))}
                  </select>
                  <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400" size={14} />
                </div>
              </div>

              {/* Export Button */}
              <button
                onClick={handleExport}
                disabled={colorCounts.length === 0}
                className="w-full sm:w-auto inline-flex items-center justify-center px-6 py-2.5 rounded-full bg-rose-400 text-white font-bold hover:bg-rose-500 disabled:bg-gray-200 disabled:text-gray-400 transition-all shadow-md shadow-rose-200 hover:-translate-y-0.5"
              >
                <Download size={18} className="mr-2" />
                <span>下载图纸</span>
              </button>

            </div>

            {/* Main Canvas Area */}
            <div className="bg-white rounded-[2.5rem] shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-pink-50 overflow-hidden flex flex-col h-[500px] lg:h-[650px] relative">
              
              {/* Zoom Controls */}
              <div className="absolute bottom-6 right-6 z-20 flex flex-col gap-3">
                <button onClick={() => setScale(s => Math.min(5, s + 0.2))} className="w-12 h-12 bg-white rounded-full shadow-lg border border-pink-50 flex items-center justify-center text-gray-600 hover:text-pink-500 hover:bg-pink-50 transition-colors">
                  <ZoomIn size={24} />
                </button>
                <button onClick={() => setScale(s => Math.max(0.1, s - 0.2))} className="w-12 h-12 bg-white rounded-full shadow-lg border border-pink-50 flex items-center justify-center text-gray-600 hover:text-pink-500 hover:bg-pink-50 transition-colors">
                  <ZoomOut size={24} />
                </button>
                <button onClick={() => { setScale(1); setPan({x:0, y:0}); }} className="w-12 h-12 bg-white rounded-full shadow-lg border border-pink-50 flex items-center justify-center text-gray-600 hover:text-pink-500 hover:bg-pink-50 transition-colors">
                  <Move size={20} />
                </button>
              </div>

              {/* Canvas Container */}
              <div 
                ref={canvasContainerRef}
                className="flex-1 relative overflow-hidden checkerboard cursor-move rounded-[2.5rem]"
                onMouseDown={handleMouseDown}
                onMouseMove={handleMouseMove}
                onMouseUp={handleMouseUpOrLeave}
                onMouseLeave={handleMouseUpOrLeave}
                onTouchStart={handleTouchStart}
                onTouchMove={handleTouchMove}
                onTouchEnd={handleTouchEnd}
                onTouchCancel={handleTouchEnd}
              >
                {isProcessing ? (
                  <div className="absolute inset-0 flex flex-col items-center justify-center text-gray-500 gap-4 bg-white/60 backdrop-blur-sm z-10">
                    <div className="w-12 h-12 border-4 border-pink-100 border-t-pink-400 rounded-full animate-spin"></div>
                    <span className="font-bold text-lg">图纸生成中...</span>
                  </div>
                ) : pixels ? (
                  <div 
                    className="absolute origin-center transition-transform duration-75 ease-out"
                    style={{
                      left: '50%',
                      top: '50%',
                      transform: `translate(calc(-50% + ${pan.x}px), calc(-50% + ${pan.y}px)) scale(${scale})`
                    }}
                  >
                    <canvas
                      ref={canvasRef}
                      className="shadow-2xl rounded-lg"
                      style={{ display: 'block' }}
                    />
                  </div>
                ) : (
                  <div className="absolute inset-0 flex flex-col items-center justify-center text-gray-400 gap-6">
                    <div className="w-32 h-32 bg-pink-50 rounded-full flex items-center justify-center animate-bounce shadow-inner">
                      <ImageIcon size={48} className="text-pink-200" />
                    </div>
                    <p className="font-bold text-lg text-gray-500">上传图片，或者直接粘贴哦 ~</p>
                  </div>
                )}
              </div>
            </div>

            {/* Legend Grid Section */}
            {colorCounts.length > 0 && (
              <div className="bg-white p-8 rounded-[2.5rem] shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-pink-50">
                <div className="flex flex-wrap items-center justify-between mb-8 gap-4">
                  <h3 className="text-2xl font-extrabold text-gray-800 flex items-center gap-3">
                    <CheckCircle2 className="text-green-400" size={28} />
                    图纸材料清单
                  </h3>
                  <span className="text-sm font-bold text-pink-500 bg-pink-50 px-4 py-1.5 rounded-full border border-pink-100">
                    {activeBrand.name} 色库
                  </span>
                </div>
                
                {/* CSS Grid for Compact Layout */}
                <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-8 gap-3">
                  {colorCounts.map((color) => {
                    const isSelected = highlightColorId === color.colorId;
                    const textColor = getContrastYIQ(color.color.hex);
                    return (
                      <button 
                        key={color.colorId} 
                        onClick={() => setHighlightColorId(isSelected ? null : color.colorId)}
                        className={`flex items-stretch rounded-lg border transition-all w-full overflow-hidden
                          ${isSelected 
                            ? 'ring-2 ring-pink-400 border-pink-400 scale-105 shadow-md' 
                            : 'hover:shadow-md hover:-translate-y-0.5 cursor-pointer border-gray-300 bg-white hover:border-pink-300'
                          }`}
                      >
                        <div 
                          className="flex items-center justify-center py-2 w-1/2 border-r border-gray-200"
                          style={{ backgroundColor: color.color.hex, color: textColor }}
                        >
                          <span className="font-bold text-sm tracking-tight">{color.colorId}</span>
                        </div>
                        <div className="flex items-center justify-center py-2 w-1/2 bg-white">
                          <span className="text-gray-800 text-sm font-bold">{color.count}</span>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
            
          </div>
        </div>
        
        {/* Footer decoration */}
        <div className="mt-8 flex items-center justify-center gap-2 text-gray-400 font-medium text-sm">
           <span>Crafted with</span>
           <Heart size={16} className="text-rose-400 fill-rose-400 animate-pulse" />
           <span>for Pixel Artists</span>
        </div>

      </main>

      {/* Floating QR Code Widget */}
      <div 
        className="qr-widget-container fixed bottom-6 left-6 z-50 flex flex-col items-start"
        onMouseEnter={() => setShowQrPopover(true)}
        onMouseLeave={() => setShowQrPopover(false)}
      >
        {/* Collapsed State (Button with Text) */}
        <div 
          className={`bg-white rounded-full shadow-lg border border-pink-100 flex items-center justify-center text-pink-500 cursor-pointer absolute bottom-0 left-0 transition-all duration-300 z-10 px-4 py-2.5 gap-2 font-bold hover:bg-pink-50 ${showQrPopover ? 'opacity-0 scale-75 pointer-events-none' : 'opacity-100 scale-100'}`}
          onClick={(e) => {
            // Stop propagation to prevent immediate global click trigger
            e.stopPropagation();
            setShowQrPopover(true);
          }}
        >
          <MessageCircle size={20} className="animate-pulse" />
          <span className="text-sm tracking-wide">加入内测群</span>
        </div>
        
        {/* Expanded State (QR Code Card) */}
        <div 
          className={`bg-white p-3 rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.12)] border border-pink-100 flex-col items-center gap-2 transition-all duration-300 origin-bottom-left flex ${showQrPopover ? 'opacity-100 scale-100 pointer-events-auto' : 'opacity-0 scale-90 pointer-events-none'}`}
        >
          <div 
            className="w-32 h-32 bg-gray-50 rounded-xl overflow-hidden border border-gray-100 p-1 cursor-pointer hover:scale-105 transition-transform"
            onClick={(e) => {
              e.stopPropagation();
              setShowQrModal(true);
              setShowQrPopover(false);
            }}
            title="点击放大二维码"
          >
            <img src="/qrcode.png" alt="群聊二维码" className="w-full h-full object-contain" />
          </div>
          <div className="text-center">
            <p className="text-xs font-bold text-gray-700">像素拼豆内测群</p>
            <p className="text-[10px] text-pink-400 mt-0.5 font-semibold">点击放大扫码加入 ✨</p>
          </div>
        </div>
      </div>

      {/* Fullscreen QR Code Modal */}
      {showQrModal && (
        <div 
          className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200"
          onClick={() => setShowQrModal(false)}
        >
          <div 
            className="bg-white p-6 rounded-[2rem] shadow-2xl max-w-sm w-full flex flex-col items-center gap-4 relative animate-in zoom-in-95 duration-200"
            onClick={e => e.stopPropagation()} // Prevent closing when clicking inside the card
          >
            <button 
              onClick={() => setShowQrModal(false)}
              className="absolute top-4 right-4 w-8 h-8 bg-gray-100 hover:bg-pink-100 text-gray-500 hover:text-pink-500 rounded-full flex items-center justify-center transition-colors"
            >
              <X size={18} />
            </button>
            
            <h3 className="text-xl font-extrabold text-gray-800 mt-2">像素拼豆魔法内测群</h3>
            <p className="text-sm font-bold text-pink-500 bg-pink-50 px-4 py-1.5 rounded-full border border-pink-100">
              扫一扫上面的二维码图案，加群聊天
            </p>
            
            <div className="w-full aspect-square bg-gray-50 rounded-2xl border-2 border-dashed border-gray-200 p-2 mt-2">
              <img src="/qrcode.png" alt="群聊二维码放大版" className="w-full h-full object-contain" />
            </div>
          </div>
        </div>
      )}

    </div>
  );
}

export default App;
