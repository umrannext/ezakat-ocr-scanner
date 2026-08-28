"use client";
import React, { useRef, useState, useCallback } from 'react';
import Webcam from 'react-webcam';
import { useRouter } from 'next/navigation';
import { Camera, X, Loader2, AlertCircle } from 'lucide-react';
import imageCompression from 'browser-image-compression';
import Tesseract from 'tesseract.js';

export default function ScanPage() {
  const webcamRef = useRef<Webcam>(null);
  const router = useRouter();
  const [isProcessing, setIsProcessing] = useState(false);
  const [scanError, setScanError] = useState('');

  const capture = useCallback(async () => {
    if (webcamRef.current) {
      const imageSrc = webcamRef.current.getScreenshot();
      if (imageSrc) {
        setIsProcessing(true);
        try {
          // Convert base64 to File object for compression
          const res = await fetch(imageSrc);
          const blob = await res.blob();
          const file = new File([blob], "receipt.jpg", { type: "image/jpeg" });
          
          // Compress image - mengecilkan saiz tapi mengekalkan kualiti untuk OCR
          const options = {
            maxSizeMB: 0.1, // max 100KB
            maxWidthOrHeight: 800,
            useWebWorker: true,
          };
          const compressedFile = await imageCompression(file, options);
          
          // Convert back to base64 for passing to review page
          const reader = new FileReader();
          reader.readAsDataURL(compressedFile);
          reader.onloadend = async () => {
            const base64data = reader.result as string;
            
            // Saringan Pantas (Quick OCR Validation)
            try {
              const result = await Tesseract.recognize(base64data, 'eng');
              const text = result.data.text;
              
              // Syarat: Mesti ada sekurang-kurangnya 10 aksara dan mengandungi nombor
              const hasNumbers = /\d/.test(text);
              if (text.trim().length < 10 || !hasNumbers) {
                setScanError("Gambar tidak jelas, terkeluar dari petak border, atau bukan resit. Sila imbas semula.");
                setIsProcessing(false);
                return;
              }
            } catch (err) {
              console.error("Ralat Saringan Tesseract:", err);
            }

            // Jika melepasi saringan
            setScanError('');
            sessionStorage.setItem('scannedImage', base64data);
            router.push('/review');
          };
        } catch (error) {
          console.error("Error compressing image:", error);
          setIsProcessing(false);
        }
      }
    }
  }, [webcamRef, router]);

  return (
    <div className="min-h-screen bg-black flex flex-col items-center justify-center relative pb-20">
      {/* Header */}
      <div className="absolute top-0 w-full p-4 flex justify-between items-center z-20 bg-gradient-to-b from-black/80 to-transparent">
        <button onClick={() => router.back()} className="text-white p-2">
          <X size={28} />
        </button>
        <h1 className="text-white font-semibold text-lg tracking-wide">Imbas Resit Zakat</h1>
        <div className="w-10"></div> {/* Spacer */}
      </div>

      {scanError && (
        <div className="absolute top-20 w-[90%] max-w-sm bg-red-500/95 text-white p-4 rounded-2xl backdrop-blur-md shadow-2xl z-50 flex items-center gap-3 animate-[bounce_0.5s_ease-out]">
          <AlertCircle size={32} className="shrink-0" />
          <p className="text-[13px] font-bold leading-tight">{scanError}</p>
          <button onClick={() => setScanError('')} className="p-2 ml-auto active:scale-90 bg-red-600/50 rounded-full">
            <X size={16}/>
          </button>
        </div>
      )}

      {/* Webcam */}
      <div className="relative w-full h-[85vh] flex items-center justify-center overflow-hidden bg-gray-900">
        <Webcam
          audio={false}
          ref={webcamRef}
          screenshotFormat="image/jpeg"
          videoConstraints={{
            facingMode: 'environment', // Use back camera on mobile
            aspectRatio: 3/4
          }}
          className="object-cover w-full h-full absolute inset-0"
        />
        
        {/* Scanning Guidelines Overlay */}
        <div className="absolute inset-0 z-10 flex flex-col items-center justify-center pointer-events-none">
          {/* Petak segi empat sama untuk resit 3x3 inci */}
          <div className="w-3/4 aspect-square border-2 border-white/40 rounded-xl relative flex items-center justify-center bg-teal-400/5 shadow-[0_0_0_9999px_rgba(0,0,0,0.5)]">
            {/* Corners (Futuristic UI) */}
            <div className="absolute -top-1 -left-1 w-10 h-10 border-t-4 border-l-4 border-teal-400 rounded-tl-xl"></div>
            <div className="absolute -top-1 -right-1 w-10 h-10 border-t-4 border-r-4 border-teal-400 rounded-tr-xl"></div>
            <div className="absolute -bottom-1 -left-1 w-10 h-10 border-b-4 border-l-4 border-teal-400 rounded-bl-xl"></div>
            <div className="absolute -bottom-1 -right-1 w-10 h-10 border-b-4 border-r-4 border-teal-400 rounded-br-xl"></div>
            
            {/* Animated Scanning Line */}
            <div className="absolute top-0 w-full h-1 bg-teal-400 shadow-[0_0_8px_2px_rgba(16,185,129,0.8)] animate-[scan_2s_ease-in-out_infinite]"></div>
          </div>
          <p className="text-white text-sm font-medium bg-black/60 px-4 py-2 rounded-full absolute bottom-[15%] shadow-lg border border-white/10 backdrop-blur-sm">
            Posisikan resit dalam petak di atas
          </p>
        </div>
      </div>

      {/* Capture Button */}
      <div className="absolute bottom-24 w-full flex justify-center z-20">
        <button 
          onClick={capture}
          disabled={isProcessing}
          className="w-[84px] h-[84px] bg-gray-200/50 rounded-full flex items-center justify-center backdrop-blur-md active:scale-95 transition-transform disabled:opacity-50"
        >
          {isProcessing ? (
            <div className="w-[72px] h-[72px] bg-white rounded-full flex items-center justify-center">
              <Loader2 className="animate-spin text-teal-600" size={32} />
            </div>
          ) : (
            <div className="w-[72px] h-[72px] bg-white rounded-full flex items-center justify-center shadow-inner">
               <Camera size={36} className="text-gray-800" />
            </div>
          )}
        </button>
      </div>
    </div>
  );
}
