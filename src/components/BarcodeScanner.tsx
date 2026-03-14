'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import { Html5Qrcode, Html5QrcodeSupportedFormats } from 'html5-qrcode'

interface BarcodeScannerProps {
  onScan: (decodedText: string) => void
  onClose: () => void
}

const FORMAT_OPTIONS = [
  { label: 'Tất cả', formats: undefined },
  {
    label: 'EAN / UPC (hàng tiêu dùng)',
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
    label: 'Code 128 / 39 (công nghiệp)',
    formats: [
      Html5QrcodeSupportedFormats.CODE_128,
      Html5QrcodeSupportedFormats.CODE_39,
      Html5QrcodeSupportedFormats.CODE_93,
    ],
  },
  {
    label: 'Data Matrix / PDF417',
    formats: [
      Html5QrcodeSupportedFormats.DATA_MATRIX,
      Html5QrcodeSupportedFormats.PDF_417,
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
  const [isRunning, setIsRunning] = useState(false)
  const scannerRef = useRef<Html5Qrcode | null>(null)
  const trackRef = useRef<MediaStreamTrack | null>(null)

  const startScanner = useCallback(async (formatIdx: number) => {
    if (scannerRef.current?.isScanning) {
      await scannerRef.current.stop()
    }

    const selected = FORMAT_OPTIONS[formatIdx]
    const config: any = {
      fps: 30,
      qrbox: { width: 280, height: 180 },
      aspectRatio: 1.7,
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
          scanner.stop().then(() => {
            onScan(decodedText)
          }).catch(console.error)
        },
        () => {}
      )
      setIsRunning(true)
      setError('')

      // Kiểm tra hỗ trợ đèn flash
      const stream = (scanner as any).getRunningTrackCameraCapabilities
        ? undefined
        : (document.getElementById('reader')?.querySelector('video') as HTMLVideoElement)?.srcObject as MediaStream
      if (stream) {
        const [track] = stream.getVideoTracks()
        trackRef.current = track
        const caps = track.getCapabilities() as any
        setTorchSupported(!!caps?.torch)
      }
    } catch (err: any) {
      const msg = String(err)
      if (msg.includes('supported') || msg.includes('NotAllowed') || msg.includes('getUserMedia')) {
        setError('Camera bị chặn qua kết nối HTTP. Hãy dùng https:// hoặc nhập mã thủ công.')
      } else {
        setError('Không thể mở Camera. Vui lòng cấp quyền hoặc nhập mã thủ công.')
      }
      setShowManual(true)
    }
  }, [onScan])

  // Toggle đèn flash qua MediaStreamTrack (Web API chuẩn)
  const toggleTorch = async () => {
    // Thử lấy track trực tiếp từ video element
    const video = document.getElementById('reader')?.querySelector('video') as HTMLVideoElement
    if (video?.srcObject) {
      const stream = video.srcObject as MediaStream
      const [track] = stream.getVideoTracks()
      trackRef.current = track
      const caps = track.getCapabilities() as any
      setTorchSupported(!!caps?.torch)
    }

    if (!trackRef.current) return
    const newState = !torchOn
    try {
      await (trackRef.current as any).applyConstraints({ advanced: [{ torch: newState }] })
      setTorchOn(newState)
    } catch (e) {
      console.error('Torch not supported:', e)
    }
  }

  const checkTorchAndCapture = async () => {
    // Sau 1 giây camera khởi động, tìm video element để lấy track
    setTimeout(() => {
      const video = document.getElementById('reader')?.querySelector('video') as HTMLVideoElement
      if (video?.srcObject) {
        const stream = video.srcObject as MediaStream
        const [track] = stream.getVideoTracks()
        if (track) {
          trackRef.current = track
          const caps = track.getCapabilities() as any
          setTorchSupported(!!caps?.torch)
        }
      }
    }, 1500)
  }

  useEffect(() => {
    startScanner(selectedFormatIdx).then(checkTorchAndCapture)
    return () => {
      scannerRef.current?.stop().catch(console.error)
    }
  }, [])

  const handleFormatChange = async (idx: number) => {
    setSelectedFormatIdx(idx)
    setTorchOn(false)
    trackRef.current = null
    await startScanner(idx)
    checkTorchAndCapture()
  }

  const handleManualSubmit = () => {
    if (manualCode.trim()) {
      onScan(manualCode.trim())
    }
  }

  return (
    <div className="fixed inset-0 z-[100] flex flex-col items-center justify-start bg-black/95 p-4 overflow-y-auto">
      <div className="w-full max-w-sm pt-4">

        {/* Header */}
        <div className="mb-3 text-center">
          <h3 className="text-xl font-bold text-white">📷 Quét mã vạch</h3>
          <p className="text-xs text-gray-400 mt-1">Giữ mã vạch trong khung và giữ yên</p>
        </div>

        {/* Format selector */}
        <div className="mb-3">
          <label className="text-xs text-gray-400 mb-1 block">Loại mã vạch:</label>
          <select
            value={selectedFormatIdx}
            onChange={(e) => handleFormatChange(Number(e.target.value))}
            className="w-full px-3 py-2 rounded-xl text-sm bg-white/10 text-white border border-white/20 focus:outline-none"
          >
            {FORMAT_OPTIONS.map((opt, idx) => (
              <option key={idx} value={idx} className="text-black">
                {opt.label}
              </option>
            ))}
          </select>
        </div>

        {/* Camera view */}
        {error ? (
          <div className="p-3 mb-3 text-sm text-amber-800 bg-amber-100 rounded-xl">
            ⚠️ {error}
          </div>
        ) : (
          <div className="relative">
            <div id="reader" className="w-full rounded-2xl overflow-hidden border-2 border-white/20 bg-black" />
            {/* Overlay guide corners */}
            <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
              <div className="w-64 h-40 border-2 border-blue-400/70 rounded-lg shadow-[0_0_0_9999px_rgba(0,0,0,0.3)]" />
            </div>
          </div>
        )}

        {/* Flash toggle */}
        {!error && (
          <div className="flex items-center justify-center gap-3 mt-3">
            <button
              onClick={toggleTorch}
              className={`flex items-center gap-2 px-5 py-2 rounded-full text-sm font-semibold transition-all ${
                torchOn
                  ? 'bg-yellow-400 text-black'
                  : 'bg-white/10 text-white'
              }`}
            >
              {torchOn ? '🔦 Tắt đèn' : '🔦 Bật đèn Flash'}
            </button>
          </div>
        )}

        {/* Manual input */}
        <div className="mt-4 bg-white/10 rounded-2xl p-4">
          <div className="flex items-center justify-between mb-2">
            <p className="text-white text-sm font-semibold">📝 Nhập mã thủ công</p>
            <button
              onClick={() => setShowManual(!showManual)}
              className="text-xs text-blue-300 underline"
            >
              {showManual ? 'Thu gọn' : 'Mở rộng'}
            </button>
          </div>
          {showManual && (
            <>
              <input
                type="text"
                value={manualCode}
                onChange={(e) => setManualCode(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleManualSubmit()}
                placeholder="Nhập hoặc dán mã vạch..."
                className="w-full px-4 py-3 rounded-xl text-gray-900 text-sm focus:outline-none mb-2"
                autoFocus
              />
              <button
                onClick={handleManualSubmit}
                disabled={!manualCode.trim()}
                className="w-full py-2.5 text-sm font-semibold bg-blue-500 text-white rounded-xl active:scale-95 transition-all disabled:opacity-40"
              >
                Xác nhận mã
              </button>
            </>
          )}
        </div>

        {/* Close */}
        <button
          onClick={onClose}
          className="w-full py-3 mt-3 mb-6 text-sm font-semibold text-gray-900 bg-white rounded-xl active:scale-95 transition-all"
        >
          Đóng Camera
        </button>
      </div>
    </div>
  )
}
