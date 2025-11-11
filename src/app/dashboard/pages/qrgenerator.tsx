'use client'

import { useState, useRef, useEffect } from 'react'
import { QRCodeCanvas } from 'qrcode.react'
import { db } from '@/app/lib/firebase'
import { collection, getDocs } from 'firebase/firestore'

export default function QRCanvas() {
  const [nameList, setNameList] = useState<{name: string, id: string}[]>([])
  const [selectedItem, setSelectedItem] = useState<{name: string, id: string} | null>(null)
  const [isMobileModalOpen, setIsMobileModalOpen] = useState(false)
  const canvasRef = useRef<HTMLCanvasElement | null>(null)

  // Fetch names from Firestore
  const fetchNames = async () => {
    try {
      const querySnapshot = await getDocs(collection(db, 'students'))
      const names: {name: string, id: string}[] = []
      querySnapshot.forEach((doc) => {
        const data = doc.data()
        if (data.name) names.push({name: data.name, id: doc.id})
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
    a.download = `${selectedItem?.name || 'qrcode'}.png`
    a.click()
  }

  const handleGenerate = (item: {name: string, id: string}) => {
    setSelectedItem(item)
    if (window.innerWidth < 640) { // Tailwind sm breakpoint
      setIsMobileModalOpen(true)
    }
  }

  return (
    <div className="flex flex-col w-full h-full gap-4 sm:p-4 ">
      <div className='grid sm:grid-cols-[auto_auto] h-full gap-8'>
        {/* Name List */}
        <div className="relative p-4 sm:rounded-md sm:bg-gray-100 sm:w-full sm:h-full overflow-y-auto">
          <h2 className="text-lg font-semibold mb-2">Name List</h2>
          <ul className="space-y-1">
            {nameList.map((item, index) => (
              <li key={index} className="grid grid-cols-[auto_1fr_auto] items-center justify-center gap-2 sm:gap-5 p-2 bg-white rounded shadow-sm">
                <span className="flex-1 text-[14px] sm:text-[16px] flex items-center justify-center sm:w-[40px]">{item.id}</span>
                <span className="flex-1 text-[14px] sm:text-[16px] flex items-center justify-center border-r border-l border-gray-300">{item.name}</span>
                <button
                  onClick={() => handleGenerate(item)}
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

          {selectedItem ? (
            <>
              <div className="bg-white p-4 rounded-md shadow-md">
                <QRCodeCanvas value={selectedItem.id} size={256} ref={canvasRef} />
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
            <h2 className="text-xl font-semibold">{selectedItem?.name}</h2>
            <QRCodeCanvas value={selectedItem?.id || ''} size={256} ref={canvasRef}   />
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
