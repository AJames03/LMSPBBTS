'use client'
import React, { useState, useEffect } from 'react'
import { Poppins } from 'next/font/google'
import { auth } from "@/app/lib/firebase";
import { signInWithEmailAndPassword, onAuthStateChanged } from "firebase/auth";
import { useRouter } from 'next/navigation';

const poppins = Poppins({
    weight: ['100', '200', '300', '400', '500', '600', '700', '800', '900'], 
    subsets: ['latin'],
})

export default function page() {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const router = useRouter();

    useEffect(() => {
        onAuthStateChanged(auth, (user) => {
            if (user) {
                router.push('/dashboard');
            }
        });
    }, []);

    const handleLogin = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        try {
            await signInWithEmailAndPassword(auth, username, password);
            router.push('/dashboard');
        } catch (error) {
            console.error(error);
        }
    };

  return (
    <div className='bg-amber-50 w-screen h-screen text-black p-2 flex justify-center items-center'>
        <div className='flex flex-col justify-center items-center gap-5 sm:bg-white sm:shadow-xl sm:p-10 sm:rounded-md'>
            <span className='flex flex-col justify-center items-center gap-2'>
                <img className='w-16 h-16 sm:w-20 sm:h-20' src="/favicon.ico" alt="logo" />
                <header className={`${poppins.className} text-lg sm:text-2xl font-black`}>PBBTS Administration</header>
            </span>
        
            <form className='flex flex-col gap-5 w-full' onSubmit={handleLogin}>
                <div className='flex flex-col gap-2 '>
                    <span className={`relative flex gap-2 justify-center items-center
                                    w-full p-2 bg-gray-100
                                    ${username 
                                        ? 'border-b-2 border-blue-700 bg-white' 
                                        : `border-transparent bg-amber-50
                                        before:content-[''] before:absolute before:bottom-0 before:left-1/2 
                                        before:w-full before:h-[2px] before:bg-blue-700 
                                        before:transform before:-translate-x-1/2 before:scale-x-0 
                                        before:origin-center before:transition-transform before:duration-300 
                                        focus-within:before:scale-x-100` 
                                    }`}
                    >
                        <i className="bi bi-person-fill"></i>
                        <input 
                            className='w-full outline-none bg-transparent' 
                            placeholder='Enter Username' 
                            type="text" 
                            name="username" 
                            id="username"
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}/>
                    </span>

                    <span className={`relative flex gap-2 justify-center items-center
                                    w-full p-2 bg-gray-100
                                    ${password 
                                        ? 'border-b-2 border-blue-700 bg-white' 
                                        : `border-transparent bg-amber-50
                                        before:content-[''] before:absolute before:bottom-0 before:left-1/2 
                                        before:w-full before:h-[2px] before:bg-blue-700 
                                        before:transform before:-translate-x-1/2 before:scale-x-0 
                                        before:origin-center before:transition-transform before:duration-300 
                                        focus-within:before:scale-x-100` 
                                    }`}
                    >
                        <i className="bi bi-lock-fill"></i>
                        <input 
                            className='w-full outline-none bg-transparent' 
                            placeholder='Enter Password' 
                            type="password" 
                            name="password" 
                            id="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}/>
                    </span>
                </div>
                <button type='submit' className='bg-blue-700 text-white p-2 rounded-md cursor-pointer hover:bg-blue-900'>Login</button>
                <label className='text-center text-[14px] p-2 text-blue-500 cursor-pointer hover:text-blue-900'>Forget Password</label>
            </form>
        </div>
    </div>
  )
}
