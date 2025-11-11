'use client'

import { useEffect, useRef, useState } from 'react'
import { Html5Qrcode, Html5QrcodeScannerState } from 'html5-qrcode'
import { db } from '@/app/lib/firebase'
import { doc, getDoc, updateDoc, setDoc } from 'firebase/firestore'

type CameraDevice = {
  id: string
  label?: string
}

export default function QRScanner() {
  const scannerRef = useRef<HTMLDivElement | null>(null)
  const html5QrCodeRef = useRef<Html5Qrcode | null>(null)

  const [studentID, setStudentID] = useState('')
  const [studentName, setStudentName] = useState('')
  const [date, setDate] = useState('')
  const [time, setTime] = useState('')
  const [status, setStatus] = useState('')

  const [cameras, setCameras] = useState<CameraDevice[]>([])
  const [selectedCamera, setSelectedCamera] = useState<string>('')

  // 🔹 Get available cameras
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

  // 🔹 Stop QR scanner
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

  // 🔹 Start QR scanner when camera changes
  useEffect(() => {
    if (!selectedCamera) return

    const startScanner = async () => {
      await stopScanner()

      const html5QrCode = new Html5Qrcode('qr-scanner')
      html5QrCodeRef.current = html5QrCode

      html5QrCode
        .start(
          { deviceId: { exact: selectedCamera } },
          { fps: 10, qrbox: 250 },
          decodedText => handleScan(decodedText),
          err => console.warn('QR decode error:', err)
        )
        .catch(err => console.error('Cannot start QR scanner:', err))
    }

    startScanner()
    return () => {
      stopScanner()
    }
  }, [selectedCamera])

  // 🔹 When QR is scanned
  const handleScan = async (decodedText: string) => {
    const studentDocRef = doc(db, 'students', decodedText)
    try {
      const docSnap = await getDoc(studentDocRef)

      if (docSnap.exists()) {
        const data = docSnap.data()
        setStudentID(decodedText) // Document ID as Student ID
        setStudentName(data.name || 'Unknown Student')
        const current = new Date()
        setDate(current.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }))
        setTime(current.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }))
        setStatus('Present')
      } else {
        setStudentID(decodedText)
        setStudentName('Unknown Student')
        setDate('')
        setTime('')
        setStatus('Not Found')
      }
    } catch (err) {
      console.error('Error fetching student:', err)
      setStudentID(decodedText)
      setStudentName('Error loading name')
      setDate('')
      setTime('')
      setStatus('Error')
    }
  }

  // 🔹 Save attendance to Firestore
  const handleSave = async () => {
    if (!studentID) return alert('Please scan a QR code first.')

    const docRef = doc(db, 'students', studentID)
    try {
      await updateDoc(docRef, {
        attendance: {
          date,
          time,
          status
        }
      }).catch(async () => {
        await setDoc(docRef, {
          name: studentName || 'Unknown',
          attendance: {
            date,
            time,
            status
          }
        })
      })

      alert('✅ Attendance saved successfully!')
    } catch (err) {
      console.error('Error saving attendance:', err)
      alert('❌ Failed to save attendance.')
    }
  }

  return (
    <div className="flex flex-col items-center gap-4 p-4">
      <h1 className="text-xl font-bold">QR Attendance Scanner</h1>

      <div
        id="qr-scanner"
        ref={scannerRef}
        style={{ width: '300px', marginTop: '10px' }}
      ></div>

      {/* Camera selector */}
      <label className="flex flex-col items-center">
        <span className="text-sm font-medium mb-1">Choose Camera:</span>
        <select
          value={selectedCamera}
          onChange={e => setSelectedCamera(e.target.value)}
          className="border p-1 rounded"
        >
          {cameras.map(cam => (
            <option key={cam.id} value={cam.id}>
              {cam.label || cam.id}
            </option>
          ))}
        </select>
      </label>

      {/* Display scanned info */}
      {studentID && (
        <div className="border p-3 rounded w-full max-w-sm bg-gray-100 mt-3 text-center">
          <p><strong>Student ID:</strong> {studentID}</p>
          <p><strong>Name:</strong> {studentName}</p>
          <p><strong>Date:</strong> {date}</p>
          <p><strong>Time:</strong> {time}</p>
          <p><strong>Status:</strong> {status}</p>

          <button
            onClick={handleSave}
            className="mt-3 bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
          >
            Save Attendance
          </button>
        </div>
      )}
    </div>
  )
}
