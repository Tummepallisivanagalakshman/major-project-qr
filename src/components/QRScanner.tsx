import React, { useEffect, useRef, useState } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import { AlertCircle, RefreshCw, Camera, ShieldCheck, Sparkles } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface QRScannerProps {
  onScanSuccess: (decodedText: string) => void;
}

const QRScanner: React.FC<QRScannerProps> = ({ onScanSuccess }) => {
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const readerId = useRef(`reader-${Math.random().toString(36).substr(2, 9)}`);
  const [error, setError] = useState<string | null>(null);
  const [isInitializing, setIsInitializing] = useState(true);

  useEffect(() => {
    let isMounted = true;
    const html5QrCode = new Html5Qrcode(readerId.current);
    scannerRef.current = html5QrCode;
    let lastScannedText = '';
    let lastScannedTime = 0;

    const config = { fps: 15, qrbox: { width: 250, height: 250 } };

    const startScanning = async () => {
      try {
        setIsInitializing(true);
        setError(null);
        
        await html5QrCode.start(
          { facingMode: "environment" },
          config,
          (decodedText) => {
            const now = Date.now();
            // Prevent scanning the exact same QR code within 3 seconds
            if (decodedText !== lastScannedText || now - lastScannedTime > 3000) {
              lastScannedText = decodedText;
              lastScannedTime = now;
              if (isMounted) onScanSuccess(decodedText);
            }
          },
          (errorMessage) => {
            // Quietly handle scan errors
          }
        );
        if (isMounted) setIsInitializing(false);
      } catch (err: any) {
        console.error("Unable to start scanning", err);
        if (isMounted) {
          setError(err.message || "Failed to access camera. Please ensure permissions are granted.");
          setIsInitializing(false);
        }
      }
    };

    startScanning();

    return () => {
      isMounted = false;
      if (scannerRef.current && scannerRef.current.isScanning) {
        scannerRef.current.stop().catch(err => console.error("Failed to stop scanner on unmount", err));
      }
    };
  }, [onScanSuccess]);

  return (
    <div className="w-full max-w-sm mx-auto overflow-hidden rounded-[2.5rem] bg-slate-900 shadow-2xl relative aspect-square group border-4 border-slate-800 dark:border-slate-800 transition-all hover:border-violet-500/30">
      <div id={readerId.current} className="w-full h-full"></div>
      
      {/* Scanning Overlay UI */}
      {!isInitializing && !error && (
        <div className="absolute inset-0 pointer-events-none z-10">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[250px] h-[250px] border-2 border-violet-500 rounded-3xl shadow-[0_0_0_1000px_rgba(15,23,42,0.6)]">
            <motion.div 
              animate={{ top: ['0%', '100%', '0%'] }}
              transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
              className="absolute left-0 right-0 h-1 bg-gradient-to-r from-transparent via-violet-400 to-transparent shadow-[0_0_15px_rgba(167,139,250,0.8)]"
            />
            {/* Corner Accents */}
            <div className="absolute -top-1 -left-1 w-6 h-6 border-t-4 border-l-4 border-violet-400 rounded-tl-xl"></div>
            <div className="absolute -top-1 -right-1 w-6 h-6 border-t-4 border-r-4 border-violet-400 rounded-tr-xl"></div>
            <div className="absolute -bottom-1 -left-1 w-6 h-6 border-b-4 border-l-4 border-violet-400 rounded-bl-xl"></div>
            <div className="absolute -bottom-1 -right-1 w-6 h-6 border-b-4 border-r-4 border-violet-400 rounded-br-xl"></div>
          </div>
          
          <div className="absolute bottom-8 left-0 right-0 text-center">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-slate-900/80 backdrop-blur-md rounded-full border border-white/10 text-white text-[10px] font-black uppercase tracking-widest">
              <Sparkles size={12} className="text-violet-400" />
              Align QR within frame
            </div>
          </div>
        </div>
      )}

      <AnimatePresence>
        {(isInitializing || error) && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 flex flex-col items-center justify-center bg-slate-900/95 text-white p-8 text-center z-20"
          >
            {isInitializing && !error ? (
              <>
                <div className="relative mb-6">
                  <RefreshCw className="animate-spin text-violet-500" size={48} />
                  <div className="absolute inset-0 blur-xl bg-violet-500/20 animate-pulse"></div>
                </div>
                <p className="text-xs font-black tracking-[0.2em] uppercase text-slate-400">Initializing Secure Lens</p>
                <div className="mt-4 flex gap-1">
                  {[0, 1, 2].map(i => (
                    <motion.div 
                      key={i}
                      animate={{ opacity: [0.3, 1, 0.3] }}
                      transition={{ duration: 1, repeat: Infinity, delay: i * 0.2 }}
                      className="w-1.5 h-1.5 bg-violet-500 rounded-full"
                    />
                  ))}
                </div>
              </>
            ) : error ? (
              <>
                <div className="p-4 bg-rose-500/10 rounded-3xl mb-6 border border-rose-500/20">
                  <AlertCircle className="text-rose-500" size={40} />
                </div>
                <p className="text-sm font-black mb-3 uppercase tracking-wider">Access Protocol Failed</p>
                <p className="text-xs text-slate-400 leading-relaxed max-w-[200px]">{error}</p>
                <button 
                  onClick={() => window.location.reload()}
                  className="mt-8 px-8 py-3 bg-violet-600 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-violet-700 transition-all shadow-xl shadow-violet-500/20 active:scale-95"
                >
                  Re-initialize
                </button>
              </>
            ) : null}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default QRScanner;
