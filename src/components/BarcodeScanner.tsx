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
        // Tối ưu vùng quét rộng hơn để nhạy hơn
        return { 
          width: Math.min(viewfinderWidth * 0.8, 400), 
          height: Math.min(viewfinderHeight * 0.4, 250) 
        }
      },
      aspectRatio: 1.0,
      experimentalFeatures: { useBarCodeDetectorIfSupported: true },
    }
    if (selected.formats) config.formatsToSupport = selected.formats

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
        const video = document.getElementById('reader')?.querySelector('video') as HTMLVideoElement
        if (video?.srcObject) {
          const stream = video.srcObject as MediaStream
          const [track] = stream.getVideoTracks()
          trackRef.current = track
          const caps = track.getCapabilities() as any
          setTorchSupported(!!caps?.torch)
        }
      }, 1500)
    } catch (err: any) {
      setError('Lỗi Camera. Hãy đảm bảo bạn dùng HTTPS.')
      setShowManual(true)
    }
  }, [onScan, playBeep, vibrate])

  const toggleTorch = async () => {
    if (!trackRef.current) return
    const newState = !torchOn
    try {
      await (trackRef.current as any).applyConstraints({ advanced: [{ torch: newState }] })
      setTorchOn(newState)
    } catch (e) { console.error(e) }
  }

  useEffect(() => {
    startScanner(selectedFormatIdx)
    return () => {
      if (scannerRef.current) scannerRef.current.stop().catch(console.warn)
    }
  }, [])

  return (
    <div className="fixed inset-0 z-[100] flex flex-col bg-slate-950/95 backdrop-blur-md animate-in fade-in transition-all">
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
                <div className="w-1 h-1 bg-emerald-500 rounded-full animate-pulse" />
                <p className="text-[10px] text-emerald-400 font-bold uppercase opacity-80">Siêu tốc 60fps</p>
            </div>
        </div>
        {torchSupported ? (
          <button 
            onClick={toggleTorch}
            className={`p-3 rounded-2xl transition active:scale-90 ${torchOn ? 'bg-yellow-400 text-black' : 'bg-white/5 text-white'}`}
          >
            <Zap size={24} fill={torchOn ? 'currentColor' : 'none'} />
          </button>
        ) : <div className="w-12" />}
      </div>

      {/* Viewfinder tinh gọn */}
      <div className="relative flex-1 flex flex-col items-center justify-center -mt-10">
        <div className="w-full max-w-sm px-6">
          <div className="relative aspect-square rounded-[2.5rem] overflow-hidden border-2 border-white/5 bg-black shadow-[0_0_50px_rgba(0,0,0,0.5)]">
            <div id="reader" className="w-full h-full scale-110" />
            
            {/* Overlay tập trung - Không dòng chạy */}
            <div className="absolute inset-0 pointer-events-none flex items-center justify-center p-8">
              <div className="relative w-full h-[55%] border-2 border-emerald-500/40 rounded-3xl overflow-hidden shadow-[0_0_0_9999px_rgba(15,23,42,0.7)]">
                {/* 4 Corners Focus */}
                <div className="absolute top-0 left-0 w-8 h-8 border-t-4 border-l-4 border-emerald-400 rounded-tl-2xl" />
                <div className="absolute top-0 right-0 w-8 h-8 border-t-4 border-r-4 border-emerald-400 rounded-tr-2xl" />
                <div className="absolute bottom-0 left-0 w-8 h-8 border-b-4 border-l-4 border-emerald-400 rounded-bl-2xl" />
                <div className="absolute bottom-0 right-0 w-8 h-8 border-b-4 border-r-4 border-emerald-400 rounded-br-2xl" />
                
                {/* Center marker */}
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-4 h-0.5 bg-emerald-400/50" />
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-0.5 h-4 bg-emerald-400/50" />
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
