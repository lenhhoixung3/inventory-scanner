'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import { Html5Qrcode, Html5QrcodeSupportedFormats } from 'html5-qrcode'
import { X, Zap, Scan, Keyboard, Monitor } from 'lucide-react'

interface BarcodeScannerProps {
  onScan: (decodedText: string) => void
  onClose: () => void
}

const FORMAT_OPTIONS = [
  { label: 'Tất cả (Khuyên dùng)', formats: undefined },
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
    label: 'QR Code',
    formats: [Html5QrcodeSupportedFormats.QR_CODE],
  },
  {
    label: 'Máy quét Công nghiệp (128/39)',
    formats: [
      Html5QrcodeSupportedFormats.CODE_128,
      Html5QrcodeSupportedFormats.CODE_39,
      Html5QrcodeSupportedFormats.CODE_93,
    ],
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

  // Hàm tạo tiếng Beep bằng Web Audio API
  const playBeep = useCallback(() => {
    try {
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)()
      const oscillator = audioCtx.createOscillator()
      const gainNode = audioCtx.createGain()

      oscillator.connect(gainNode)
      gainNode.connect(audioCtx.destination)

      oscillator.type = 'sine'
      oscillator.frequency.setValueAtTime(800, audioCtx.currentTime) // Tần số 800Hz
      gainNode.gain.setValueAtTime(0, audioCtx.currentTime)
      gainNode.gain.linearRampToValueAtTime(0.5, audioCtx.currentTime + 0.01)
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.1)

      oscillator.start(audioCtx.currentTime)
      oscillator.stop(audioCtx.currentTime + 0.1)
    } catch (e) {
      console.error('Audio beep failed:', e)
    }
  }, [])

  // Hàm Rung điện thoại
  const vibrate = useCallback(() => {
    if (typeof navigator !== 'undefined' && navigator.vibrate) {
      navigator.vibrate(100) // Rung 100ms
    }
  }, [])

  const startScanner = useCallback(async (formatIdx: number) => {
    // Luôn dừng scanner cũ trước khi tạo mới để tránh lỗi Client-side exception
    if (scannerRef.current) {
      try {
        if (scannerRef.current.isScanning) {
          await scannerRef.current.stop()
        }
      } catch (e) {
        console.warn('Scanner stop warning:', e)
      }
    }

    const selected = FORMAT_OPTIONS[formatIdx]
    const config: any = {
      fps: 60, // Tăng fps để quét mượt hơn
      qrbox: (viewfinderWidth: number, viewfinderHeight: number) => {
        const minEdge = Math.min(viewfinderWidth, viewfinderHeight)
        const qrboxSize = Math.floor(minEdge * 0.7)
        return { width: qrboxSize * 1.5, height: qrboxSize * 0.8 } // Chữ nhật ngang cho mã vạch
      },
      aspectRatio: 1.0,
      experimentalFeatures: { useBarCodeDetectorIfSupported: true },
    }
    if (selected.formats) {
      config.formatsToSupport = selected.formats
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
          scanner.stop().then(() => {
            onScan(decodedText)
          }).catch(console.error)
        },
        () => {}
      )
      setError('')
      
      // Kiểm tra Torch sau khi camera đã chạy
      setTimeout(() => {
        const video = document.getElementById('reader')?.querySelector('video') as HTMLVideoElement
        if (video?.srcObject) {
          const stream = video.srcObject as MediaStream
          const [track] = stream.getVideoTracks()
          trackRef.current = track
          const caps = track.getCapabilities() as any
          setTorchSupported(!!caps?.torch)
        }
      }, 2000)
    } catch (err: any) {
      console.error('Scanner error:', err)
      setError('Không thể khởi động camera. Vui lòng cấp quyền hoặc sử dụng HTTPS.')
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
    }
  }

  useEffect(() => {
    startScanner(selectedFormatIdx)
    return () => {
      if (scannerRef.current) {
        scannerRef.current.stop().catch(console.warn)
      }
    }
  }, [])

  return (
    <div className="fixed inset-0 z-[100] flex flex-col bg-black/98 backdrop-blur-xl transition-all animate-in fade-in">
      {/* Laser UI Layer */}
      <style jsx global>{`
        @keyframes laser-move {
          0% { top: 0%; opacity: 0; }
          10% { opacity: 1; }
          90% { opacity: 1; }
          100% { top: 100%; opacity: 0; }
        }
        .laser-line {
          position: absolute;
          left: 0;
          right: 0;
          height: 2px;
          background: linear-gradient(to right, transparent, #3b82f6, #3b82f6, transparent);
          box-shadow: 0 0 15px #3b82f6;
          animation: laser-move 2.5s infinite linear;
          z-index: 10;
        }
        .scanner-frame {
            box-shadow: 0 0 0 9999px rgba(0, 0, 0, 0.6);
        }
      `}</style>

      {/* Header */}
      <div className="p-4 flex items-center justify-between text-white z-20">
        <button onClick={onClose} className="p-2 bg-white/10 rounded-full active:scale-90 transition">
          <X size={24} />
        </button>
        <div className="text-center">
            <h2 className="font-bold text-lg flex items-center gap-2">
                <Scan size={20} className="text-blue-400" />
                BAO CODE PRO
            </h2>
            <p className="text-[10px] text-blue-400 font-mono tracking-widest uppercase opacity-70">Scanner Active</p>
        </div>
        {torchSupported ? (
          <button 
            onClick={toggleTorch}
            className={`p-2 rounded-full transition active:scale-90 ${torchOn ? 'bg-yellow-400 text-black' : 'bg-white/10 text-white'}`}
          >
            <Zap size={24} fill={torchOn ? 'currentColor' : 'none'} />
          </button>
        ) : <div className="w-10" />}
      </div>

      {/* Camera Full Screen */}
      <div className="relative flex-1 flex flex-col items-center justify-center -mt-12">
        <div className="w-full max-w-sm px-6">
          <div className="relative aspect-square rounded-[2rem] overflow-hidden border border-white/10 bg-black/20 shadow-2xl">
            <div id="reader" className="w-full h-full scale-125 md:scale-100" />
            
            {/* Overlay Grid & Scanning Line */}
            <div className="absolute inset-0 pointer-events-none flex items-center justify-center p-8">
              <div className="relative w-full h-[60%] border-2 border-blue-500/30 rounded-xl scanner-frame transition-all duration-500 overflow-hidden">
                <div className="laser-line" />
                {/* 4 Corners */}
                <div className="absolute top-0 left-0 w-6 h-6 border-t-4 border-l-4 border-blue-500 rounded-tl-lg" />
                <div className="absolute top-0 right-0 w-6 h-6 border-t-4 border-r-4 border-blue-500 rounded-tr-lg" />
                <div className="absolute bottom-0 left-0 w-6 h-6 border-b-4 border-l-4 border-blue-500 rounded-bl-lg" />
                <div className="absolute bottom-0 right-0 w-6 h-6 border-b-4 border-r-4 border-blue-500 rounded-br-lg" />
                
                {/* Center scan text */}
                <div className="absolute bottom-4 left-0 right-0 text-center animate-pulse">
                    <span className="text-[10px] text-blue-400 font-bold tracking-widest bg-blue-900/40 px-3 py-1 rounded-full border border-blue-500/30">
                        ALIGN BARCODE
                    </span>
                </div>
              </div>
            </div>
          </div>
          
          {error && (
            <div className="mt-4 p-3 bg-red-500/20 border border-red-500/50 text-red-200 text-xs text-center rounded-xl backdrop-blur-md">
                {error}
            </div>
          )}
        </div>
      </div>

      {/* Bottom Controls */}
      <div className="p-6 pb-12 space-y-4 z-20">
        <div className="flex gap-2">
            <div className="flex-1 bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl p-1 overflow-hidden">
                <select
                    value={selectedFormatIdx}
                    onChange={(e) => {
                        const idx = Number(e.target.value)
                        setSelectedFormatIdx(idx)
                        startScanner(idx)
                    }}
                    className="w-full py-3 bg-transparent text-white text-sm px-4 focus:outline-none appearance-none"
                >
                    {FORMAT_OPTIONS.map((opt, i) => (
                        <option key={i} value={i} className="text-black">{opt.label}</option>
                    ))}
                </select>
            </div>
            <button 
                onClick={() => setShowManual(!showManual)}
                className={`p-4 rounded-2xl border transition active:scale-95 ${showManual ? 'bg-blue-500 border-blue-400 text-white' : 'bg-white/5 border-white/10 text-white/70'}`}
            >
                <Keyboard size={24} />
            </button>
        </div>

        {showManual && (
            <div className="flex gap-2 animate-in slide-in-from-bottom-4">
                <input 
                    type="text"
                    value={manualCode}
                    onChange={(e) => setManualCode(e.target.value)}
                    placeholder="Nhập mã thủ công..."
                    className="flex-1 bg-white/10 text-white border border-white/20 rounded-2xl px-4 py-3 placeholder:text-white/30 focus:border-blue-500 outline-none"
                    autoFocus
                />
                <button 
                    disabled={!manualCode.trim()}
                    onClick={() => onScan(manualCode)}
                    className="bg-blue-600 font-bold px-6 rounded-2xl text-white active:scale-90 transition disabled:opacity-50"
                >
                    OK
                </button>
            </div>
        )}

        <div className="grid grid-cols-2 gap-4">
            <div className="p-3 bg-white/5 rounded-2xl flex items-center gap-3">
                <Monitor size={20} className="text-gray-400" />
                <div>
                    <p className="text-[10px] text-gray-500 font-bold uppercase">Mode</p>
                    <p className="text-xs text-white">Live Stream</p>
                </div>
            </div>
            <div className="p-3 bg-white/5 rounded-2xl flex items-center gap-3">
                <div className="w-2 h-2 bg-emerald-500 rounded-full animate-ping" />
                <div>
                    <p className="text-[10px] text-gray-500 font-bold uppercase">Status</p>
                    <p className="text-xs text-white">Detecting...</p>
                </div>
            </div>
        </div>
      </div>
    </div>
  )
}
