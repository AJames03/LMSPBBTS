'use client'

import { useState, useRef } from 'react'
import { QRCodeCanvas } from 'qrcode.react'

export default function QRCanvas() {
  const [name, setName] = useState('')
  const canvasRef = useRef<HTMLCanvasElement | null>(null) // type as HTMLCanvasElement

  const handleDownload = () => {
    const canvas = canvasRef.current
    if (!canvas) return
    const url = canvas.toDataURL('image/png')
    const a = document.createElement('a')
    a.href = url
    a.download = `${name || 'qrcode'}.png`
    a.click()
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen gap-4 bg-gray-100">
      <h1 className="text-2xl font-semibold">QR Code Generator</h1>

      <input
        type="text"
        placeholder="Enter your name"
        value={name}
        onChange={(e) => setName(e.target.value)}
        className="p-2 border border-gray-400 rounded-md w-64 text-center"
      />

      {name && (
        <div className="bg-white p-4 rounded-md shadow-md">
          <QRCodeCanvas value={name} size={256} ref={canvasRef} />
        </div>
      )}

      {name && (
        <button
          onClick={handleDownload}
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition"
        >
          Download PNG
        </button>
      )}
    </div>
  )
}
