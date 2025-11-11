'use client'

import { useEffect, useRef, useState } from 'react'
import { Html5Qrcode } from 'html5-qrcode'
import { db } from '@/app/lib/firebase'
import { doc, getDoc, updateDoc, setDoc } from 'firebase/firestore'
import { motion, AnimatePresence } from "framer-motion";
import { Poppins } from 'next/font/google'

const poppins = Poppins({
  weight: ['100','200','300','400','500','600','700','800','900'],
  subsets: ['latin'],
});

type CameraDevice = {
  id: string
  label?: string
}

export default function QRScanner() {
  const scannerRef = useRef<HTMLDivElement | null>(null)
  const html5QrCodeRef = useRef<Html5Qrcode | null>(null)
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const [notification, setNotification] = useState<{ message: string; type: "error" | "success" } | null>(null);

  const [result, setResult] = useState('')
  const [cameras, setCameras] = useState<CameraDevice[]>([])
  const [selectedCamera, setSelectedCamera] = useState<string>('')
  const [showModal, setShowModal] = useState(false)
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [isScannerActive, setIsScannerActive] = useState(true);

  const [studentName, setStudentName] = useState('')
  const [date, setDate] = useState('')
  const [time, setTime] = useState('')
  const [status, setStatus] = useState('')

  // beep sound
   useEffect(() => {
    audioRef.current = new Audio('/sounds/store-scan-beep.mp3')
    audioRef.current.load()
  }, [])

  // 🔹 Get available cameras
  useEffect(() => {
    Html5Qrcode.getCameras()
      .then((devices: CameraDevice[]) => {
        if (devices.length > 0) {
          setCameras(devices)
          setSelectedCamera(devices[1].id)
        }
      })
      .catch(err => console.error('Error getting cameras:', err))
  }, [])

  // Notification Duration 
  useEffect(() => {
    if (notification) {
      const timer = setTimeout(() => setNotification(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [notification]);

  // 🔹 Stop QR scanner
  const stopScanner = () => {
    if (html5QrCodeRef.current) {
      try {
        html5QrCodeRef.current.stop()
      } catch (err: any) {
        console.warn('Failed to stop scanner:', err)
      }
      try {
        html5QrCodeRef.current.clear()
      } catch (err: any) {
        console.warn('Failed to clear scanner:', err)
      }
    }
  }

  // 🔹 Start QR scanner when camera changes
  useEffect(() => {
    if (!selectedCamera || !isScannerActive) return

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
    return () => stopScanner()
  }, [selectedCamera, isScannerActive])

  // 🔹 When QR is scanned
  const handleScan = async (decodedText: string) => {
    if (audioRef.current) {
      audioRef.current.currentTime = 0
      audioRef.current.play().catch(err => console.warn('Failed to play sound:', err))
    }

    setResult(decodedText)

    const currentDate = new Date()
    const formattedDate = currentDate.toLocaleDateString('en-US', {
      month: 'long',
      day: 'numeric',
      year: 'numeric',
    })
    const formattedTime = currentDate.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
    })

    setDate(formattedDate)
    setTime(formattedTime)
    setStatus('Present')
    setShowModal(true)
    setIsScannerActive(false)

    // 🔹 Fetch student name from Firestore
    try {
      const trimmedID = decodedText.trim()
      console.log('Fetching student with ID:', trimmedID)

      const docRef = doc(db, 'students', trimmedID)
      const docSnap = await getDoc(docRef)

      if (docSnap.exists()) {
        const data = docSnap.data()
        console.log('Document data:', data)
        setStudentName(data.name || 'Unknown Student')
      } else {
        console.log('No such document with ID:', trimmedID)
        setStudentName('Unknown Student')
      }
    } catch (err) {
      console.error('Error fetching student:', err)
      setStudentName('Error loading name')
    }
  }

  const handleSave = async () => {
    if (!result){
      setNotification({
        message: "Please scan a QR code first.", type: "error"
      });
      return
    }

    try {
      const trimmedID = result.trim()
      const docRef = doc(db, 'students', trimmedID)
      const docSnap = await getDoc(docRef)

      const newEntry = {
        time: time,
        status: status,
      }

      if (docSnap.exists()) {
        const data = docSnap.data()
        const existingAttendance = data.attendance || {}

        // 🔸 Check if already has attendance for the current date
        if (existingAttendance[date] && existingAttendance[date].length > 0) {
          setNotification ({
            message: `⚠️ Attendance already recorded for ${date}.`, type: "error"
          });
          return // stop here — do not update
        }

        // 🔹 Add new attendance entry if not existing yet
        await updateDoc(docRef, {
          attendance: {
            ...existingAttendance,
            [date]: [newEntry],
          },
        })
      } else {
        // 🔹 Create new document if student does not exist
        await setDoc(docRef, {
          name: studentName || 'Unknown',
          attendance: {
            [date]: [newEntry],
          },
        })
      }

      setNotification({ message: "✅ Attendance saved successfully!", type: "success" });
    } catch (err) {
      console.error("Error saving attendance:", err);
      setNotification({ message: "❌ Failed to save attendance.", type: "error" });
    }
  }



  return (
    <div className="flex flex-col items-center gap-4 p-4">
      <h1 className="text-xl font-bold">QR Attendance Scanner</h1>

      {/* Notification */}
      <AnimatePresence>
        {notification && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -60 }}
            transition={{ duration: 0.4, type: "spring", bounce: 0.3 }}
            className={`${poppins.className} text-[14px] sm:text-[16px] font-bold fixed top-0 left-[45%] sm:left-1/2 transform -translate-x-1/2 
                        w-[80%] sm:w-1/2 p-4 text-center m-2 z-60 text-white
                        ${notification.type === "error" 
                          ? "bg-gradient-to-bl from-red-500 to-red-500 rounded-xl" 
                          : "bg-green-600 rounded-lg"
                        }`}
          >
            {notification.message}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Scanner container */}
      <div
        id="qr-scanner"
        ref={scannerRef}
        style={{ width: '300px', marginTop: '10px' }}
      ></div>

      {/* Camera selector */}
      <div className="relative w-64">
        {/* Button to toggle dropdown */}
        <button
          onClick={() => setDropdownOpen(!dropdownOpen)}
          className="w-full p-2 border rounded bg-white text-left flex justify-between items-center text-[14px]"
        >
          {cameras.find(cam => cam.id === selectedCamera)?.label || "Select Camera"}
          <i className="bi bi-caret-down-fill"></i>
        </button>

        {/* Dropdown menu */}
        <AnimatePresence>
          {dropdownOpen && (
            <motion.ul
              initial={{ opacity: 0, scale: 0 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0 }}
              transition={{ duration: 0.2, scale: { type: "spring", bounce: 0.2, duration: 0.1 } }}
              className="relative w-full bg-white border rounded shadow-lg z-50 overflow-y-auto"
            >
              {cameras.map(cam => (
                <li
                  key={cam.id}
                  onClick={() => {
                    setSelectedCamera(cam.id);
                    setDropdownOpen(false);
                  }}
                  className="p-2 hover:bg-blue-900 hover:text-white cursor-pointer"
                >
                  {cam.label || cam.id}
                </li>
              ))}
            </motion.ul>
          )}
        </AnimatePresence>
      </div>



      {/* Show scanned info */}
      {result && showModal && (
        <div className="fixed top-0 left-0 w-full h-full flex items-center justify-center z-50">
          <span className="fixed top-0 left-0 w-full h-full bg-black/50 backdrop-blur-md z-50" onClick={() => { setShowModal(false); setIsScannerActive(true); }}></span>
          <span className='bg-red-500 rounded-full w-6 h-6 sm:w-8 sm:h-8 flex items-center justify-center z-70 fixed transform translate-x-[130px] -translate-y-[92px] sm:translate-x-[190px] sm:-translate-y-[92px] cursor-pointer' onClick={() => { setShowModal(false); setIsScannerActive(true); }}>
            <i className="bi bi-x text-white text-xl sm:text-2xl "></i>
          </span>
          <div className="fixed top:1/2 left-1/2 w-[80%] sm:left-1/2 transform -translate-x-1/2  border p-3 rounded sm:w-full max-w-sm bg-gray-100 mt-3 text-center z-60">
            <p><strong>Student ID:</strong> {result}</p>
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
        </div>
      )}
    </div>
  )
}
