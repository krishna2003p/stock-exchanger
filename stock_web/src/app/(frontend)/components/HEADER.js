"use client";

import { useState } from "react";
import { FaRegUser } from "react-icons/fa";
import { IoIosArrowDown, IoMdMenu, IoMdClose } from "react-icons/io";
import { BiLogIn } from "react-icons/bi";
import { BsBuildingAdd } from "react-icons/bs";
import Image from "next/image";
import Link from "next/link";

export default function Header() {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <header className="sticky top-0 bg-transparent backdrop-blur-sm z-50 flex items-center justify-between py-4 px-4 sm:px-8">
      {/* Logo */}
      <div className="flex items-center gap-2">
        <Image src="/home/logo.png" height={32} width={32} alt="Logo" className="h-8 w-8" />
        <span className="text-white text-xl sm:text-2xl font-bold">Bitrader</span>
      </div>

      {/* Desktop Nav */}
      <nav className="hidden md:flex gap-6 xl:gap-8">
        <a href="#" className="text-white hover:text-green-400">Home</a>
        <a href="#" className="text-white hover:text-green-400">Services</a>
        <a href="#" className="text-white hover:text-green-400">About Us</a>
        <a href="#" className="text-white hover:text-green-400">Pages</a>
        <a href="#" className="text-white hover:text-green-400">Shop</a>
        <a href="#" className="text-white hover:text-green-400">Contact Us</a>
      </nav>

      {/* User Dropdown (works everywhere) */}
      <div className="relative group flex items-center cursor-pointer ms-2 font-bold">
        <FaRegUser className="group-hover:text-green-400 text-white" size={22} />
        <span className="group-hover:text-white mx-2 text-green-400 text-sm sm:text-base whitespace-nowrap">User Portal</span>
        <IoIosArrowDown className="group-hover:text-green-400 text-white" size={16} />
        {/* Dropdown Menu */}
        <div className="absolute right-0 top-full p-4 pr-12 mt-2 min-w-[140px] bg-white rounded-lg shadow-lg opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto transition flex flex-col z-50">
          <div className="mb-2">
            <Link href="/join-with-us?mode=login" className="flex items-center px-4 py-2 hover:bg-green-100 text-green-900 rounded-t-lg transition">
              <BiLogIn className="inline mr-2" size={20} />
              <span className="font-bold">Login</span>
            </Link>
            <span className="px-4 py-2 text-xs text-gray-500 whitespace-nowrap">Enter to Trade</span>
          </div>
          <div className="border-t my-2"></div>
          <div>
            <Link href="/join-with-us?mode=register" className="flex items-center px-4 py-2 hover:bg-green-100 text-green-900 rounded-b-lg transition">
              <BsBuildingAdd className="inline mr-2" size={20} />
              <span className="font-bold">Register</span>
            </Link>
            <span className="px-4 py-2 text-xs text-gray-500 whitespace-nowrap">Start Your Journey</span>
          </div>
        </div>
      </div>

      {/* Mobile Hamburger */}
      <button
        className="md:hidden ml-3 z-50 text-2xl text-white"
        onClick={() => setMenuOpen((v) => !v)}
        aria-label="Open Menu"
      >
        {menuOpen ? <IoMdClose /> : <IoMdMenu />}
      </button>

      {/* Mobile Nav Drawer */}
      {menuOpen && (
        <nav className="fixed inset-0 bg-[#00150fcc] backdrop-blur z-40 flex flex-col items-center justify-center gap-4 text-xl mb-100">
          <a href="#" className="text-white hover:text-green-400" onClick={() => setMenuOpen(false)}>Home</a>
          <a href="#" className="text-white hover:text-green-400" onClick={() => setMenuOpen(false)}>Services</a>
          <a href="#" className="text-white hover:text-green-400" onClick={() => setMenuOpen(false)}>About Us</a>
          <a href="#" className="text-white hover:text-green-400" onClick={() => setMenuOpen(false)}>Pages</a>
          <a href="#" className="text-white hover:text-green-400" onClick={() => setMenuOpen(false)}>Shop</a>
          <a href="#" className="text-white hover:text-green-400" onClick={() => setMenuOpen(false)}>Contact Us</a>
        </nav>
      )}
    </header>
  );
}
