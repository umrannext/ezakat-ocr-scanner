"use client";
import React, { useRef, useState, useCallback, useEffect } from 'react';
import Webcam from 'react-webcam';
import { useRouter } from 'next/navigation';
import { 
  Camera, X, Loader2, ArrowLeft, Image as ImageIcon, 
  RotateCw, ZoomIn, ZoomOut, RefreshCw, Check, Sparkles, Zap, Upload
} from 'lucide-react';
import imageCompression from 'browser-image-compression';

export default function ScanPage() {
  const webcamRef = useRef<Webcam>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  // Pilihan Mod: 'camera' (Imbas Terus dari Kamera) | 'gallery' (Pilih & Selaras dari Galeri)
  const [scanMode, setScanMode] = useState<'camera' | 'gallery'>('camera');
  const [facingMode, setFacingMode] = useState<'environment' | 'user'>('environment');
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingMsg, setProcessingMsg] = useState('Memproses resit...');

  // State Penyelarasan Imej Galeri (Crop, Zoom, Pan & Rotate)
  const [adjustImage, setAdjustImage] = useState<string | null>(null);
  const [zoom, setZoom] = useState<number>(1);
  const [pan, setPan] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [rotation, setRotation] = useState<number>(0);
  const [imgSize, setImgSize] = useState<{ width: number; height: number }>({ width: 0, height: 0 });
  const [isDragging, setIsDragging] = useState<boolean>(false);

  const dragStartRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const panStartRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });

  // ==============================================================
  // PILIHAN 1: IMBAS TERUS DARI KAMERA (1-TAP DIRECT TO REVIEW)
  // ==============================================================
  const captureDirect = useCallback(async () => {
    if (!webcamRef.current) return;
    const imageSrc = webcamRef.current.getScreenshot();
    if (!imageSrc) return;

    setIsProcessing(true);
    setProcessingMsg('Mengimbas resit terus dari kamera...');

    try {
      const res = await fetch(imageSrc);
      const blob = await res.blob();
      const file = new File([blob], "receipt.jpg", { type: "image/jpeg" });
      const compressed = await imageCompression(file, {
        maxSizeMB: 0.15,
        maxWidthOrHeight: 1100,
        useWebWorker: true,
      });

      const reader = new FileReader();
      reader.onloadend = () => {
        const finalBase64 = reader.result as string;
        sessionStorage.setItem('scannedImage', finalBase64);
        router.push('/review');
      };
      reader.readAsDataURL(compressed);
    } catch (err) {
      console.error("Ralat tangkap kamera terus:", err);
      sessionStorage.setItem('scannedImage', imageSrc);
      router.push('/review');
    }
  }, [webcamRef, router]);

  // Tukar Kamera Depan / Belakang
  const toggleCamera = () => {
    setFacingMode(prev => (prev === 'environment' ? 'user' : 'environment'));
  };

  // ==============================================================
  // PILIHAN 2: PILIH DARI GALERI DENGAN PENYELARASAN POSISI & SAIZ
  // ==============================================================
  const triggerGalleryPicker = () => {
    fileInputRef.current?.click();
  };

  const handleGalleryPick = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = reader.result as string;
      setAdjustImage(dataUrl);
      setScanMode('gallery');
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  // Kira saiz awal imej galeri agar muat elok dalam petak
  useEffect(() => {
    if (!adjustImage) return;

    const img = new Image();
    img.src = adjustImage;
    img.onload = () => {
      const frame = containerRef.current;
      const fw = frame ? frame.clientWidth : 320;
      const fh = frame ? frame.clientHeight : 420;

      const scale = Math.min(fw / img.naturalWidth, fh / img.naturalHeight);
      setImgSize({
        width: img.naturalWidth * scale,
        height: img.naturalHeight * scale
      });
      setZoom(1);
      setPan({ x: 0, y: 0 });
      setRotation(0);
    };
  }, [adjustImage]);

  // Pengendali Sentuh / Tetikus untuk Gerakkan (Pan) Imej
  const handlePointerDown = (e: React.PointerEvent) => {
    setIsDragging(true);
    dragStartRef.current = { x: e.clientX, y: e.clientY };
    panStartRef.current = { ...pan };
    (e.target as HTMLElement).setPointerCapture?.(e.pointerId);
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!isDragging) return;
    const dx = e.clientX - dragStartRef.current.x;
    const dy = e.clientY - dragStartRef.current.y;
    setPan({
      x: panStartRef.current.x + dx,
      y: panStartRef.current.y + dy,
    });
  };

  const handlePointerUp = () => {
    setIsDragging(false);
  };

  const rotateImage = () => {
    setRotation(prev => (prev + 90) % 360);
  };

  const resetAdjust = () => {
    setZoom(1);
    setPan({ x: 0, y: 0 });
    setRotation(0);
  };

  // Proses Penyelarasan Imej Galeri & Hantar ke Review
  const processGalleryAndProceed = async () => {
    if (!adjustImage) return;
    setIsProcessing(true);
    setProcessingMsg('Memotong dan memproses resit...');

    try {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.src = adjustImage;
      await new Promise((resolve, reject) => {
        if (img.complete) resolve(true);
        else {
          img.onload = () => resolve(true);
          img.onerror = reject;
        }
      });

      const frame = containerRef.current;
      const frameW = frame ? frame.clientWidth : 320;
      const frameH = frame ? frame.clientHeight : 420;

      // Resolusi kanvas tinggi untuk mengekalkan kejelasan OCR
      const exportW = 1000;
      const exportH = Math.round(exportW * (frameH / frameW));
      const scaleRatio = exportW / frameW;

      const canvas = document.createElement('canvas');
      canvas.width = exportW;
      canvas.height = exportH;
      const ctx = canvas.getContext('2d');
      if (!ctx) throw new Error("Gagal mengaktifkan kanvas");

      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, exportW, exportH);

      const drawW = imgSize.width * scaleRatio;
      const drawH = imgSize.height * scaleRatio;

      ctx.save();
      ctx.translate(exportW / 2, exportH / 2);
      ctx.translate(pan.x * scaleRatio, pan.y * scaleRatio);
      ctx.rotate((rotation * Math.PI) / 180);
      ctx.scale(zoom, zoom);
      ctx.drawImage(img, -drawW / 2, -drawH / 2, drawW, drawH);
      ctx.restore();

      const croppedBase64 = canvas.toDataURL('image/jpeg', 0.92);

      const res = await fetch(croppedBase64);
      const blob = await res.blob();
      const file = new File([blob], "receipt.jpg", { type: "image/jpeg" });
      const compressed = await imageCompression(file, {
        maxSizeMB: 0.15,
        maxWidthOrHeight: 1100,
        useWebWorker: true,
      });

      const reader = new FileReader();
      reader.onloadend = () => {
        const finalBase64 = reader.result as string;
        sessionStorage.setItem('scannedImage', finalBase64);
        router.push('/review');
      };
      reader.readAsDataURL(compressed);
    } catch (err) {
      console.error("Ralat memproses resit galeri:", err);
      setIsProcessing(false);
      alert("Gagal memproses gambar resit. Sila cuba lagi.");
    }
  };

  return (
    <div className="min-h-screen bg-black flex flex-col items-center justify-center relative select-none">
      
      {/* Hidden File Input untuk Galeri */}
      <input
        type="file"
        ref={fileInputRef}
        accept="image/*"
        className="hidden"
        onChange={handleGalleryPick}
      />

      {/* OVERLAY LOADING GLOBAL SEMASA PROSES */}
      {isProcessing && (
        <div className="fixed inset-0 bg-black/85 backdrop-blur-md z-[100] flex flex-col items-center justify-center p-6 text-center">
          <div className="relative mb-4">
            <div className="absolute inset-0 bg-teal-500 rounded-full blur-xl opacity-30 animate-pulse"></div>
            <Loader2 className="animate-spin text-teal-400 relative z-10" size={54} />
          </div>
          <h3 className="text-white font-bold text-lg">{processingMsg}</h3>
          <p className="text-slate-400 text-xs mt-1.5">Sila tunggu sebentar...</p>
        </div>
      )}

      {/* ============================================================== */}
      {/* PAPARAN A: PENYELARASAN IMEJ GALERI (RESIZE, PAN, ROTATE)      */}
      {/* ============================================================== */}
      {adjustImage ? (
        <div className="absolute inset-0 z-50 bg-slate-950 flex flex-col justify-between p-4">
          {/* Header Penyelarasan */}
          <div className="flex items-center justify-between pt-2 pb-1">
            <button 
              onClick={() => { setAdjustImage(null); setScanMode('camera'); }} 
              className="text-white p-2 -ml-2 rounded-full hover:bg-white/10 active:scale-90 transition-all"
              aria-label="Kembali ke Kamera"
            >
              <ArrowLeft size={24} />
            </button>
            <div className="text-center">
              <h2 className="text-white font-bold text-sm tracking-wide">Penyelarasan Resit Galeri</h2>
              <p className="text-[11px] text-teal-400 font-medium">Ubah posisi & saiz resit di dalam petak</p>
            </div>
            <button 
              onClick={resetAdjust}
              className="text-xs font-bold text-slate-300 hover:text-white px-2.5 py-1 bg-white/10 rounded-lg active:scale-95 transition-all"
            >
              Reset
            </button>
          </div>

          {/* Viewport Petak Imbas */}
          <div className="flex-1 flex items-center justify-center py-2 relative overflow-hidden">
            <div 
              ref={containerRef}
              className="w-[88%] max-w-[340px] aspect-[3/4] rounded-2xl overflow-hidden relative border-2 border-teal-400 shadow-[0_0_0_9999px_rgba(0,0,0,0.75)] flex items-center justify-center bg-black/90 cursor-grab active:cursor-grabbing touch-none"
              onPointerDown={handlePointerDown}
              onPointerMove={handlePointerMove}
              onPointerUp={handlePointerUp}
              onPointerCancel={handlePointerUp}
            >
              {imgSize.width > 0 && (
                <img
                  src={adjustImage}
                  alt="Pratonton Resit"
                  draggable={false}
                  className="max-w-none pointer-events-none select-none"
                  style={{
                    width: `${imgSize.width}px`,
                    height: `${imgSize.height}px`,
                    transform: `translate(${pan.x}px, ${pan.y}px) rotate(${rotation}deg) scale(${zoom})`,
                    transformOrigin: 'center center',
                    transition: isDragging ? 'none' : 'transform 0.1s ease-out'
                  }}
                />
              )}

              {/* Grid Panduan Garisan Halus */}
              <div className="absolute inset-0 pointer-events-none grid grid-cols-3 grid-rows-3 border border-teal-400/20">
                <div className="border-r border-b border-white/15"></div>
                <div className="border-r border-b border-white/15"></div>
                <div className="border-b border-white/15"></div>
                <div className="border-r border-b border-white/15"></div>
                <div className="border-r border-b border-white/15"></div>
                <div className="border-b border-white/15"></div>
                <div className="border-r border-b border-white/15"></div>
                <div className="border-r border-b border-white/15"></div>
                <div></div>
              </div>

              {/* Bucu Neon Futuristik */}
              <div className="absolute top-0 left-0 w-6 h-6 border-t-4 border-l-4 border-teal-400 rounded-tl-xl pointer-events-none"></div>
              <div className="absolute top-0 right-0 w-6 h-6 border-t-4 border-r-4 border-teal-400 rounded-tr-xl pointer-events-none"></div>
              <div className="absolute bottom-0 left-0 w-6 h-6 border-b-4 border-l-4 border-teal-400 rounded-bl-xl pointer-events-none"></div>
              <div className="absolute bottom-0 right-0 w-6 h-6 border-b-4 border-r-4 border-teal-400 rounded-br-xl pointer-events-none"></div>
            </div>
          </div>

          {/* Toolbar Pelarasan: Zum, Putar & Panduan */}
          <div className="w-full max-w-sm mx-auto space-y-3 pb-2">
            <div className="bg-slate-900/90 border border-white/10 rounded-2xl p-3 backdrop-blur-md space-y-2">
              <div className="flex items-center justify-between text-xs text-slate-300 font-semibold px-1">
                <span>Zum Skala Imej</span>
                <span className="text-teal-400 font-mono font-bold">{zoom.toFixed(2)}x</span>
              </div>
              
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setZoom(z => Math.max(0.7, +(z - 0.15).toFixed(2)))}
                  className="p-1.5 rounded-lg bg-white/10 text-white hover:bg-white/20 active:scale-90 transition-all"
                  aria-label="Zum Keluar"
                >
                  <ZoomOut size={18} />
                </button>

                <input
                  type="range"
                  min="0.7"
                  max="3.0"
                  step="0.05"
                  value={zoom}
                  onChange={(e) => setZoom(parseFloat(e.target.value))}
                  className="flex-1 accent-teal-500 h-2 bg-slate-700 rounded-lg cursor-pointer"
                />

                <button
                  type="button"
                  onClick={() => setZoom(z => Math.min(3.0, +(z + 0.15).toFixed(2)))}
                  className="p-1.5 rounded-lg bg-white/10 text-white hover:bg-white/20 active:scale-90 transition-all"
                  aria-label="Zum Masuk"
                >
                  <ZoomIn size={18} />
                </button>

                <button
                  type="button"
                  onClick={rotateImage}
                  className="flex items-center gap-1 text-xs font-bold bg-teal-500/20 text-teal-300 border border-teal-500/30 px-3 py-1.5 rounded-xl hover:bg-teal-500/30 active:scale-90 transition-all ml-1 whitespace-nowrap"
                >
                  <RotateCw size={15} />
                  <span>Putar</span>
                </button>
              </div>

              <p className="text-[10px] text-center text-slate-400 pt-0.5">
                Sentuh & seret gambar untuk menyelaraskan nombor dan kod resit di tengah
              </p>
            </div>

            {/* Butang Sahkan / Pilih Semula */}
            <div className="flex gap-3">
              <button
                type="button"
                onClick={triggerGalleryPicker}
                className="w-1/3 py-3.5 rounded-2xl bg-slate-800 text-slate-300 font-bold text-xs active:scale-95 transition-all hover:bg-slate-700"
              >
                Pilih Lain
              </button>
              <button
                type="button"
                onClick={processGalleryAndProceed}
                disabled={isProcessing}
                className="w-2/3 py-3.5 rounded-2xl bg-gradient-to-r from-teal-500 to-emerald-500 text-white font-bold text-sm shadow-lg shadow-teal-500/30 flex items-center justify-center gap-2 active:scale-95 transition-all disabled:opacity-60"
              >
                <Check size={18} />
                <span>Sahkan & Imbas OCR</span>
              </button>
            </div>
          </div>
        </div>
      ) : (

      /* ============================================================== */
      /* PAPARAN B: PILIHAN IMBAS TERUS DARI KAMERA / GALERI            */
      /* ============================================================== */
        <div className="w-full h-screen flex flex-col justify-between relative overflow-hidden bg-black">
          
          {/* Header Atas: Pilihan Mod Segmen (Kamera Terus vs Galeri) */}
          <div className="w-full p-4 pt-4 flex flex-col gap-3 z-20 bg-gradient-to-b from-black/90 via-black/50 to-transparent">
            <div className="flex justify-between items-center">
              <button 
                onClick={() => router.back()} 
                className="text-white p-2 rounded-full bg-black/40 backdrop-blur-md border border-white/10 active:scale-90 transition-all"
                aria-label="Kembali"
              >
                <X size={22} />
              </button>
              <h1 className="text-white font-bold text-xs tracking-wider uppercase">Pilihan Kaedah Imbas</h1>
              <div className="w-9"></div>
            </div>

            {/* SEGMENTED TAB: PILIHAN IMBAS TERUS KAMERA ATAU GALERI */}
            <div className="flex bg-white/15 p-1 rounded-2xl backdrop-blur-md border border-white/10 max-w-xs mx-auto w-full">
              <button
                type="button"
                onClick={() => setScanMode('camera')}
                className={`flex-1 py-2 px-2.5 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 transition-all ${
                  scanMode === 'camera'
                    ? 'bg-gradient-to-r from-teal-500 to-emerald-500 text-white shadow-md'
                    : 'text-slate-300 hover:text-white'
                }`}
              >
                <Zap size={14} className={scanMode === 'camera' ? 'text-amber-200 fill-amber-200' : ''} />
                <span>Imbas Terus Kamera</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setScanMode('gallery');
                  triggerGalleryPicker();
                }}
                className={`flex-1 py-2 px-2.5 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 transition-all ${
                  scanMode === 'gallery'
                    ? 'bg-gradient-to-r from-teal-500 to-emerald-500 text-white shadow-md'
                    : 'text-slate-300 hover:text-white'
                }`}
              >
                <ImageIcon size={14} />
                <span>Dari Galeri</span>
              </button>
            </div>
          </div>

          {/* Area Kamera Langsung dengan Petak Panduan Luas */}
          <div className="relative w-full flex-1 flex items-center justify-center overflow-hidden">
            <Webcam
              audio={false}
              ref={webcamRef}
              screenshotFormat="image/jpeg"
              videoConstraints={{
                facingMode: facingMode,
                aspectRatio: 3 / 4,
                width: { ideal: 1280 },
                height: { ideal: 960 }
              }}
              className="object-cover w-full h-full absolute inset-0"
            />
            
            {/* Petak Imbas Luas (Sempadan Ditolak ke Tepi) */}
            <div className="absolute inset-0 z-10 flex flex-col items-center justify-center pointer-events-none">
              <div className="w-[88%] max-w-[340px] aspect-[3/4] border-2 border-teal-400/70 rounded-3xl relative flex items-center justify-center shadow-[0_0_0_9999px_rgba(0,0,0,0.5)]">
                
                {/* Hiasan Bucu Neon */}
                <div className="absolute -top-1 -left-1 w-8 h-8 border-t-4 border-l-4 border-teal-400 rounded-tl-2xl"></div>
                <div className="absolute -top-1 -right-1 w-8 h-8 border-t-4 border-r-4 border-teal-400 rounded-tr-2xl"></div>
                <div className="absolute -bottom-1 -left-1 w-8 h-8 border-b-4 border-l-4 border-teal-400 rounded-bl-2xl"></div>
                <div className="absolute -bottom-1 -right-1 w-8 h-8 border-b-4 border-r-4 border-teal-400 rounded-br-2xl"></div>
                
                {/* Animasi Garisan Pengimbas */}
                <div className="absolute top-0 w-full h-1 bg-gradient-to-r from-transparent via-teal-400 to-transparent shadow-[0_0_10px_2px_rgba(45,212,191,0.9)] animate-[scan_2.5s_ease-in-out_infinite]"></div>
              </div>

              {/* Arahan Ringkas & Jelas */}
              <p className="text-white text-xs font-semibold bg-black/60 px-4 py-2 rounded-full absolute bottom-[18%] shadow-lg border border-white/15 backdrop-blur-md">
                Halakan ke resit & tekan butang untuk imbas terus
              </p>
            </div>
          </div>

          {/* Bar Kawalan Bawah: Butang Galeri | Shutter Kamera Terus | Tukar Kamera */}
          <div className="w-full pb-8 pt-4 px-6 bg-gradient-to-t from-black via-black/85 to-transparent z-20 flex items-center justify-around">
            
            {/* Pilihan 2: Pilih dari Galeri */}
            <button 
              type="button"
              onClick={triggerGalleryPicker}
              className="flex flex-col items-center gap-1 text-white/80 hover:text-white active:scale-95 transition-all group"
            >
              <div className="w-13 h-13 rounded-2xl bg-white/10 group-hover:bg-white/20 border border-white/20 backdrop-blur-md flex items-center justify-center shadow-lg transition-all">
                <ImageIcon size={22} className="text-white drop-shadow" />
              </div>
              <span className="text-[11px] font-bold tracking-tight">Galeri</span>
            </button>

            {/* Pilihan 1: Butang Shutter - IMBAS TERUS DARI KAMERA */}
            <button 
              type="button"
              onClick={captureDirect}
              disabled={isProcessing}
              className="w-20 h-20 rounded-full bg-white/20 p-1.5 backdrop-blur-md active:scale-90 transition-transform shadow-2xl border border-white/30 flex items-center justify-center group"
              aria-label="Ambil & Imbas Terus"
            >
              <div className="w-full h-full rounded-full bg-gradient-to-tr from-teal-500 to-emerald-400 group-hover:from-teal-400 group-hover:to-emerald-300 flex items-center justify-center shadow-inner transition-all">
                <Camera size={34} className="text-white drop-shadow" />
              </div>
            </button>

            {/* Tukar Kamera Depan / Belakang */}
            <button 
              type="button"
              onClick={toggleCamera}
              className="flex flex-col items-center gap-1 text-white/80 hover:text-white active:scale-95 transition-all group"
            >
              <div className="w-13 h-13 rounded-2xl bg-white/10 group-hover:bg-white/20 border border-white/20 backdrop-blur-md flex items-center justify-center shadow-lg transition-all">
                <RefreshCw size={20} className="text-white drop-shadow" />
              </div>
              <span className="text-[11px] font-bold tracking-tight">Tukar</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
