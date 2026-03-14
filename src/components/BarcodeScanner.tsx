'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import { Html5Qrcode, Html5QrcodeSupportedFormats } from 'html5-qrcode'
import { X, Zap, Scan, Keyboard, Monitor } from 'lucide-react'

interface BarcodeScannerProps {
  onScan: (decodedText: string) => void
  onClose: () => void
}

const FORMAT_OPTIONS = [
  { label: 'Siêu nhạy (Tất cả mã)', formats: undefined },
  {
    label: 'EAN / UPC (Hàng tiêu dùng)',
    formats: [
      Html5QrcodeSupportedFormats.EAN_13,
      Html5QrcodeSupportedFormats.EAN_8,
      Html5QrcodeSupportedFormats.UPC_A,
      Html5QrcodeSupportedFormats.UPC_E,
    ],
  },
  {
    label: 'Mã vạch Công nghiệp (128/39)',
    formats: [
      Html5QrcodeSupportedFormats.CODE_128,
      Html5QrcodeSupportedFormats.CODE_39,
      Html5QrcodeSupportedFormats.CODE_93,
    ],
  },
  {
    label: 'QR Code',
    formats: [Html5QrcodeSupportedFormats.QR_CODE],
  },
]

export function BarcodeScanner({ onScan, onClose }: BarcodeScannerProps) {
  const [error, setError] = useState<string>('')
  const [manualCode, setManualCode] = useState('')
  const [showManual, setShowManual] = useState(false)
  const [torchOn, setTorchOn] = useState(false)
  const [torchSupported, setTorchSupported] = useState(false)
  const [selectedFormatIdx, setSelectedFormatIdx] = useState(0)
  const scannerRef = useRef<Html5Qrcode | null>(null)
  const trackRef = useRef<MediaStreamTrack | null>(null)

  // Âm thanh Bíp chuyên nghiệp
  const playBeep = useCallback(() => {
    try {
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)()
      const oscillator = audioCtx.createOscillator()
      const gainNode = audioCtx.createGain()
      oscillator.connect(gainNode)
      gainNode.connect(audioCtx.destination)
      oscillator.type = 'sine'
      oscillator.frequency.setValueAtTime(1000, audioCtx.currentTime)
      gainNode.gain.setValueAtTime(0, audioCtx.currentTime)
      gainNode.gain.linearRampToValueAtTime(0.3, audioCtx.currentTime + 0.01)
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.1)
      oscillator.start(audioCtx.currentTime)
      oscillator.stop(audioCtx.currentTime + 0.1)
    } catch (e) { console.error(e) }
  }, [])

  // Rung điện thoại
  const vibrate = useCallback(() => {
    if (typeof navigator !== 'undefined' && navigator.vibrate) {
      navigator.vibrate(80)
    }
  }, [])

  const startScanner = useCallback(async (formatIdx: number) => {
    if (scannerRef.current) {
      try {
        if (scannerRef.current.isScanning) await scannerRef.current.stop()
      } catch (e) { console.warn(e) }
    }

    const selected = FORMAT_OPTIONS[formatIdx]
    const config: any = {
      fps: 60, // Tốc độ quét cực cao
      qrbox: (viewfinderWidth: number, viewfinderHeight: number) => {
        // Mở rộng vùng quét khớp hoàn toàn với UI Overlay (Khung cực rộng)
        const width = Math.min(viewfinderWidth * 0.9, 450)
        const height = Math.min(viewfinderHeight * 0.75, 380)
        return { width, height }
      },
      aspectRatio: 1.0,
      experimentalFeatures: { useBarCodeDetectorIfSupported: true },
    }
    if (selected.formats) config.formatsToSupport = selected.formats

    // Đảm bảo element 'reader' tồn tại trong DOM trước khi khởi tạo
    const element = document.getElementById('reader')
    if (!element) {
      console.warn('Waiting for reader element...')
      setTimeout(() => startScanner(formatIdx), 300)
      return
    }

    const scanner = new Html5Qrcode('reader')
    scannerRef.current = scanner

    try {
      await scanner.start(
        { facingMode: 'environment' },
        config,
        (decodedText) => {
          playBeep()
          vibrate()
          scanner.stop().then(() => onScan(decodedText)).catch(console.error)
        },
        () => {}
      )
      setError('')
      
      // Kiểm tra Torch
      setTimeout(() => {
        const video = element.querySelector('video') as HTMLVideoElement
        if (video?.srcObject) {
          const stream = video.srcObject as MediaStream
          const [track] = stream.getVideoTracks()
          trackRef.current = track
          const caps = track.getCapabilities() as any
          setTorchSupported(!!caps?.torch)
        }
      }, 2000)
    } catch (err: any) {
      console.error('Scanner start error:', err)
      setError('Lỗi Camera. Đảm bảo dùng HTTPS và cấp quyền.')
      setShowManual(true)
    }
  }, [onScan, playBeep, vibrate])

  const toggleTorch = async () => {
    if (!trackRef.current) return
    const newState = !torchOn
    try {
      await (trackRef.current as any).applyConstraints({ advanced: [{ torch: newState }] })
      setTorchOn(newState)
    } catch (e) { 
      console.error('Flash failed:', e)
      setTorchSupported(false) 
    }
  }

  useEffect(() => {
    startScanner(selectedFormatIdx)
    return () => {
      const s = scannerRef.current
      if (s && s.isScanning) {
        s.stop().catch(console.warn)
      }
    }
  }, [])

  return (
    <div className="fixed inset-0 z-[100] flex flex-col bg-slate-950/98 backdrop-blur-xl animate-in fade-in transition-all">
      {/* CSS ẩn hoàn toàn UI mặc định của thư viện và thêm hiệu ứng chuẩn */}
      <style jsx global>{`
        #reader__dashboard, #reader__status_span, #reader video + div {
          display: none !important;
        }
        #reader {
          border: none !important;
        }
        @keyframes emerald-pulse {
          0% { box-shadow: 0 0 0 0 rgba(52, 211, 153, 0.4); }
          70% { box-shadow: 0 0 0 15px rgba(52, 211, 153, 0); }
          100% { box-shadow: 0 0 0 0 rgba(52, 211, 153, 0); }
        }
        .pulse-emerald {
          animation: emerald-pulse 2s infinite;
        }
      `}</style>

      {/* Header gọn gàng */}
      <div className="p-4 flex items-center justify-between z-20">
        <button onClick={onClose} className="p-3 bg-white/5 hover:bg-white/10 rounded-2xl active:scale-90 transition">
          <X size={24} className="text-white" />
        </button>
        <div className="text-center">
            <h2 className="font-extrabold text-lg text-white tracking-tight flex items-center gap-2">
                <Scan size={20} className="text-emerald-400" />
                MÁY QUÉT NHẠY
            </h2>
            <div className="flex items-center justify-center gap-1">
                <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-ping" />
                <p className="text-[10px] text-emerald-400 font-bold uppercase tracking-widest opacity-90">60 FPS SENSOR</p>
            </div>
        </div>
        {torchSupported ? (
          <button 
            onClick={toggleTorch}
            className={`p-3 rounded-2xl transition active:scale-90 shadow-lg ${torchOn ? 'bg-yellow-400 text-black shadow-yellow-500/20' : 'bg-white/5 text-white border border-white/10'}`}
          >
            <Zap size={24} fill={torchOn ? 'currentColor' : 'none'} />
          </button>
        ) : <div className="w-12" />}
      </div>

      {/* Viewfinder Siêu rộng - Duy nhất một khung */}
      <div className="relative flex-1 flex flex-col items-center justify-center -mt-10">
        <div className="w-full max-w-sm px-4">
          <div className="relative aspect-square rounded-[3.5rem] overflow-hidden border border-white/10 bg-black shadow-[0_0_100px_rgba(0,0,0,0.9)]">
            <div id="reader" className="w-full h-full scale-110" />
            
            {/* Overlay Độc Bản - Khung cực rộng khớp với ảnh người dùng yêu cầu */}
            <div className="absolute inset-0 pointer-events-none flex items-center justify-center p-4">
              <div className="relative w-full h-[80%] border-[1.5px] border-emerald-500/20 rounded-[3rem] shadow-[0_0_0_9999px_rgba(15,23,42,0.85)] pulse-emerald">
                {/* 4 Corners Focus - Đẳng cấp */}
                <div className="absolute top-0 left-0 w-16 h-16 border-t-[5px] border-l-[5px] border-emerald-400 rounded-tl-[3rem] shadow-[0_0_25px_rgba(52,211,153,0.5)]" />
                <div className="absolute top-0 right-0 w-16 h-16 border-t-[5px] border-r-[5px] border-emerald-400 rounded-tr-[3rem] shadow-[0_0_25px_rgba(52,211,153,0.5)]" />
                <div className="absolute bottom-0 left-0 w-16 h-16 border-b-[5px] border-l-[5px] border-emerald-400 rounded-bl-[3rem] shadow-[0_0_25px_rgba(52,211,153,0.5)]" />
                <div className="absolute bottom-0 right-0 w-16 h-16 border-b-[5px] border-r-[5px] border-emerald-400 rounded-br-[3rem] shadow-[0_0_25px_rgba(52,211,153,0.5)]" />
                
                {/* Visual Guide center */}
                <div className="absolute inset-0 flex items-center justify-center opacity-40">
                    <div className="w-full h-[1px] bg-emerald-400/30" />
                    <div className="h-full w-[1px] bg-emerald-400/30 absolute" />
                    <div className="w-6 h-6 border border-emerald-400/30 rounded-full" />
                </div>

                {/* Status Text */}
                <div className="absolute top-6 left-0 right-0 text-center">
                    <span className="text-[10px] text-emerald-400 font-bold tracking-[0.2em] bg-emerald-950/60 px-4 py-1.5 rounded-full border border-emerald-500/20 uppercase backdrop-blur-md">
                        Aligning Target
                    </span>
                </div>
              </div>
            </div>
          </div>
          
          {error && (
            <div className="mt-6 p-4 bg-red-500/20 border border-red-500/30 text-red-100 text-[11px] text-center rounded-2xl backdrop-blur-sm">
                ⚠️ {error}
            </div>
          )}
        </div>
      </div>

      {/* Controls chuyên nghiệp */}
      <div className="p-6 pb-10 space-y-4 z-20">
        <div className="flex gap-3">
            <div className="flex-1 bg-white/5 backdrop-blur-xl border border-white/10 rounded-[1.25rem] p-1 flex items-center">
                <select
                    value={selectedFormatIdx}
                    onChange={(e) => {
                        const idx = Number(e.target.value)
                        setSelectedFormatIdx(idx)
                        startScanner(idx)
                    }}
                    className="w-full py-3.5 bg-transparent text-white text-[13px] font-semibold px-4 focus:outline-none appearance-none"
                >
                    {FORMAT_OPTIONS.map((opt, i) => (
                        <option key={i} value={i} className="text-slate-900 font-sans">{opt.label}</option>
                    ))}
                </select>
            </div>
            <button 
                onClick={() => setShowManual(!showManual)}
                className={`p-4 rounded-[1.25rem] border transition active:scale-95 shadow-lg ${showManual ? 'bg-emerald-500 border-emerald-400 text-white' : 'bg-white/5 border-white/10 text-white/80'}`}
            >
                <Keyboard size={24} />
            </button>
        </div>

        {showManual && (
            <div className="flex gap-2 animate-in slide-in-from-bottom-2 duration-300">
                <input 
                    type="text"
                    value={manualCode}
                    onChange={(e) => setManualCode(e.target.value)}
                    placeholder="Nhập mã..."
                    className="flex-1 bg-white/10 text-white border border-white/20 rounded-2xl px-5 py-4 text-sm focus:border-emerald-500 outline-none transition-all"
                    autoFocus
                />
                <button 
                    disabled={!manualCode.trim()}
                    onClick={() => onScan(manualCode)}
                    className="bg-emerald-600 font-bold px-8 rounded-2xl text-white active:scale-90 transition shadow-lg shadow-emerald-900/20"
                >
                    OK
                </button>
            </div>
        )}

        <div className="grid grid-cols-2 gap-4">
            <div className="p-3.5 bg-white/5 border border-white/5 rounded-2xl flex items-center gap-3">
                <Monitor size={18} className="text-slate-400" />
                <div>
                    <p className="text-[9px] text-slate-500 font-bold uppercase tracking-wider">Engine</p>
                    <p className="text-[11px] font-bold text-slate-200">Auto-Focus</p>
                </div>
            </div>
            <div className="p-3.5 bg-white/5 border border-white/5 rounded-2xl flex items-center gap-3">
                <div className="w-2 h-2 bg-emerald-500 rounded-full shadow-[0_0_8px_#10b981]" />
                <div>
                    <p className="text-[9px] text-slate-500 font-bold uppercase tracking-wider">Mode</p>
                    <p className="text-[11px] font-bold text-slate-200">Hi-Speed</p>
                </div>
            </div>
        </div>
      </div>
    </div>
  )
}
