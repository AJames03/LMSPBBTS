'use client'

import { useState, useRef, useEffect } from 'react'
import { QRCodeCanvas } from 'qrcode.react'
import { db } from '@/app/lib/firebase'
import { collection, getDocs } from 'firebase/firestore'

export default function QRCanvas() {
  const [nameList, setNameList] = useState<string[]>([])
  const [selectedName, setSelectedName] = useState<string>('') // name for QR
  const [isMobileModalOpen, setIsMobileModalOpen] = useState(false)
  const canvasRef = useRef<HTMLCanvasElement | null>(null)

  // Fetch names from Firestore
  const fetchNames = async () => {
    try {
      const querySnapshot = await getDocs(collection(db, 'students')) 
      const names: string[] = []
      querySnapshot.forEach((doc) => {
        const data = doc.data()
        if (data.name) names.push(data.name)
      })
      setNameList(names)
    } catch (error) {
      console.error("Error fetching names: ", error)
    }
  }

  useEffect(() => {
    fetchNames()
  }, [])

  const handleDownload = () => {
    const canvas = canvasRef.current
    if (!canvas) return
    const url = canvas.toDataURL('image/png')
    const a = document.createElement('a')
    a.href = url
    a.download = `${selectedName || 'qrcode'}.png`
    a.click()
  }

  const handleGenerate = (name: string) => {
    setSelectedName(name)
    if (window.innerWidth < 640) { // Tailwind sm breakpoint
      setIsMobileModalOpen(true)
    }
  }

  return (
    <div className="flex flex-col w-full h-full gap-4">
      <div className='grid grid-rows-[1fr_auto] sm:grid-cols-[auto_auto] h-full gap-8'>
        {/* Name List */}
        <div className="bg-gray-100 p-4 rounded-md w-full overflow-y-auto">
          <h2 className="text-lg font-semibold mb-2">Name List</h2>
          <ul className="space-y-1">
            {nameList.map((n, index) => (
              <li key={index} className="flex justify-between items-center p-2 bg-white rounded shadow-sm">
                <span className="flex-1 text-[14px] sm:text-[16px]">{n}</span>
                <button
                  onClick={() => handleGenerate(n)}
                  className="px-2 py-1 text-sm bg-blue-500 text-white rounded hover:bg-blue-600"
                >
                  Generate
                </button>
              </li>
            ))}
          </ul>
        </div>

        {/* Desktop QR Code Display */}
        <span className="hidden sm:flex flex-col items-center justify-center gap-4">
          <h1 className="text-2xl font-semibold">QR Code Generator</h1>

          {selectedName ? (
            <>
              <div className="bg-white p-4 rounded-md shadow-md">
                <QRCodeCanvas value={selectedName} size={256} ref={canvasRef} />
              </div>
              <button
                onClick={handleDownload}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition"
              >
                Download PNG
              </button>
            </>
          ) : (
            <p className="text-gray-500">Select a student to generate QR code</p>
          )}
        </span>
      </div>

      {/* Mobile Modal */}
      {isMobileModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-md p-4 w-full max-w-xs max-h-[90vh] overflow-auto flex flex-col items-center gap-4">
            <h2 className="text-xl font-semibold">{selectedName}</h2>
            <QRCodeCanvas value={selectedName} size={256} ref={canvasRef}   />
            <button
              onClick={handleDownload}
              className="w-full px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition"
            >
              Download PNG
            </button>
            <button
              onClick={() => setIsMobileModalOpen(false)}
              className="w-full px-4 py-2 bg-gray-300 text-black rounded-md hover:bg-gray-400 transition"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
