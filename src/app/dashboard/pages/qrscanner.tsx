'use client'

import { useEffect, useRef, useState } from 'react'
import { Html5Qrcode, Html5QrcodeScannerState } from 'html5-qrcode'

type CameraDevice = {
  id: string
  label?: string
}

export default function QRScanner() {
  const scannerRef = useRef<HTMLDivElement | null>(null)
  const html5QrCodeRef = useRef<Html5Qrcode | null>(null)

  const [result, setResult] = useState('')
  const [cameras, setCameras] = useState<CameraDevice[]>([])
  const [selectedCamera, setSelectedCamera] = useState<string>('')

  // Get available cameras
  useEffect(() => {
    Html5Qrcode.getCameras()
      .then((devices: CameraDevice[]) => {
        if (devices.length > 0) {
          setCameras(devices)
          setSelectedCamera(devices[0].id)
        }
      })
      .catch(err => console.error('Error getting cameras:', err))
  }, [])

  // Stop scanner helper
  const stopScanner = async () => {
    if (html5QrCodeRef.current) {
      try {
        if (html5QrCodeRef.current.getState() === Html5QrcodeScannerState.SCANNING) {
          await html5QrCodeRef.current.stop()
        }
      } catch (err) {
        console.warn('Failed to stop scanner:', err)
      }
      try {
        await html5QrCodeRef.current.clear()
      } catch (err) {
        console.warn('Failed to clear scanner:', err)
      }
    }
  }

  // Start scanner when camera changes
  useEffect(() => {
    if (!scannerRef.current || !selectedCamera) return

    const startScanner = async () => {
      await stopScanner()

      // null-safe reference for scanner div
      const scannerDiv = scannerRef.current
      if (!scannerDiv) return

      const html5QrCode = new Html5Qrcode(scannerDiv.id)
      html5QrCodeRef.current = html5QrCode

      html5QrCode
        .start(
          { deviceId: { exact: selectedCamera } },
          { fps: 10, qrbox: 250 },
          decodedText => setResult(decodedText),
          err => console.warn('QR decode error:', err)
        )
        .catch(err => console.error('Cannot start QR scanner:', err))
    }

    startScanner()

    return () => {
      stopScanner()
    }
  }, [selectedCamera])

  return (
    <div>
      <h1>QR Scanner</h1>

      <label>
        Choose Camera:
        <select
          value={selectedCamera}
          onChange={e => setSelectedCamera(e.target.value)}
        >
          {cameras.map(cam => (
            <option key={cam.id} value={cam.id}>
              {cam.label || cam.id}
            </option>
          ))}
        </select>
      </label>

      <div
        id="qr-scanner"
        ref={scannerRef}
        style={{ width: '300px', marginTop: '10px' }}
      ></div>

      <p>Scanned Value: {result}</p>
    </div>
  )
}
