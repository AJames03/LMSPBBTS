'use client'
import React, { useState } from 'react'
import { Poppins } from 'next/font/google'
import QRGen from '@/app/dashboard/pages/qrgenerator'
import QRScanner from '@/app/dashboard/pages/qrscanner'

const poppins = Poppins({
  weight: ['100','200','300','400','500','600','700','800','900'],
  subsets: ['latin'],
});

export default function Page() {
  const [isTab, setIsTab] = useState(0);
  const [sidebarOpen, setSidebarOpen] = useState(false); // mobile toggle

  const dashboardTabs = () => {
    switch(isTab){
      case 0: return <QRGen />;
      case 1: return <QRScanner />;
      case 2: return <div>Tab 3</div>;
      default: return <div>Tab 1</div>;
    }
  }

  return (
    <div className='bg-white w-screen h-screen text-black grid grid-rows-[auto_1fr]'>
      {/* Header */}
      <header className='sticky top-0 z-1 w-full bg-blue-900 p-2 flex items-center gap-3'>
        <img src="/favicon.ico" alt="logo" className='w-10 h-10 sm:w-14 sm:h-14' />
        <h1 className={`${poppins.className} sm:text-2xl font-bold text-white flex-1`}>PBBTS ADMINISTRATION</h1>
        
        {/* Mobile Sidebar Toggle */}
        <button
          className='md:hidden text-white text-2xl'
          onClick={() => setSidebarOpen(!sidebarOpen)}
        >
          ☰
        </button>
      </header>

      <div className='grid grid-cols-[250px_1fr] relative'>
        {/* Sidebar */}
        <div className={`fixed md:relative top-0 left-0 h-full bg-white z-50 shadow-[4px_0_8px_-2px_rgba(0,0,0,0.1)] transform transition-transform duration-300
                        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} md:translate-x-0 md:flex flex-col items-center p-2`}>
          <span className={`${poppins.className} p-2 w-full flex flex-row gap-2 hover:bg-gray-500/25 cursor-pointer rounded-md`}
            onClick={() => { setIsTab(0); setSidebarOpen(false); }}
          >
            <i className="bi bi-qr-code"></i>
            <label className='text-[16px] text-black'>Student QR Generator</label>
          </span>

          <span className={`${poppins.className} p-2 w-full flex flex-row gap-2 hover:bg-gray-500/25 cursor-pointer rounded-md`}
            onClick={() => { setIsTab(1); setSidebarOpen(false); }}
          >
            <i className="bi bi-qr-code-scan"></i>
            <label className='text-[16px] text-black'>QR Scanner</label>
          </span>
        </div>

        {/* Overlay for mobile when sidebar is open */}
        {sidebarOpen && (
          <div 
            className='fixed inset-0 bg-black/30 z-40 md:hidden'
            onClick={() => setSidebarOpen(false)}
          />
        )}

        {/* Content */}
        <div className='flex justify-center items-center absolute  sm:relative w-full h-full'>
          {dashboardTabs()}
        </div>
      </div>
    </div>
  )
}
