import { useState, useRef, useEffect, useCallback } from "react";
import { FaSearch, FaMoon, FaSun, FaWallet } from "react-icons/fa";
import { IoMdNotificationsOutline } from "react-icons/io";
import { IoIosArrowDown } from "react-icons/io";
import Image from "next/image";
import { IoSettingsOutline } from "react-icons/io5";
import { IoMdLogOut } from "react-icons/io";
import { useGoTo } from "../../hooks/RenderHook";
import { ImProfile } from "react-icons/im";

export default function Navbar({ darkMode, setDarkMode, sidebarOpen }) {
  const [profileOpen, setProfileOpen] = useState(false);
  const [walletOpen, setWalletOpen] = useState(false);
  const profileRef = useRef();
  const walletRef = useRef();
  const goTo = useGoTo();

  // Push to path
  const handleSettings = useCallback(() => goTo("/user-dashboard/dashboard/settings/"), [goTo]);

  // Close dropdowns on click outside
  useEffect(() => {
    function handle(e) {
      if (profileRef.current && !profileRef.current.contains(e.target)) {
        setProfileOpen(false);
      }
      if (walletRef.current && !walletRef.current.contains(e.target)) {
        setWalletOpen(false);
      }
    }
    document.addEventListener("mousedown", handle);
    return () => document.removeEventListener("mousedown", handle);
  }, []);

// Handle logout
async function handleLogout() {
  try {
    await fetch('/api/signOut', { method: 'POST' }); 
    goTo('/')
  } catch (e) {
    goTo('/')
  }
}


  return (
    <header
      className={`bg-white border-b flex items-center justify-between px-8 py-2 sticky top-0 z-10 transition-all duration-300`}
      style={{
        marginLeft: sidebarOpen ? "16rem" : "4rem",
        width: `calc(100vw - ${sidebarOpen ? "16rem" : "4rem"})`,
      }}
    >
      <div className="flex items-center gap-3">
        <div className="flex items-center px-3 py-2 rounded bg-gray-100 text-gray-700">
          <FaSearch className="mr-2 text-gray-400" />
          <input
            className="bg-transparent outline-none text-sm w-32 sm:w-60"
            placeholder="Search markets, assets..."
          />
        </div>
        <div className="hidden sm:flex items-center lg:ml-25 xl:ml-50">
          <span className="ml-3 text-xs sm:text-sm text-gray-700 border-gray-300 border rounded p-2">
            <b>NIFTY</b> 68,245.32 <span className="text-green-500">+2.4%</span>
          </span>
          <span className="ml-2 text-xs sm:text-sm text-gray-700 border-gray-300 border rounded p-2">
            <b>SENSEX</b> 3,892.17 <span className="text-red-500">-0.8%</span>
          </span>
        </div>
      </div>
      <div className="flex items-center gap-2">
        <button
          className={`p-2 rounded ${!darkMode ? "bg-gray-800 text-white" : "bg-gray-200 text-gray-800"}`}
          onClick={() => setDarkMode((v) => !v)}
          aria-label="Toggle theme"
        >
          {darkMode ? <FaSun size={16} /> : <FaMoon size={16} />}
        </button>
        <button className="relative p-2 rounded bg-gray-100 text-gray-600 hover:bg-gray-200 transition" aria-label="Notifications">
          <IoMdNotificationsOutline className="text-gray-600" size={20} />
        </button>
        {/* Wallet button and dropdown */}
        <div className="relative" ref={walletRef}>
          <button
            className="bg-blue-100 hover:bg-blue-200 text-blue-600 font-semibold text-xs px-2 py-2 rounded transition flex items-center cursor-pointer"
            onClick={() => setWalletOpen((prev) => !prev)}
          >
            <FaWallet className="inline mr-3" />
            <span>Connect Wallet</span>
          </button>
          {walletOpen && (
            <div className="absolute right-0 mt-2 w-40 bg-white rounded shadow-lg py-2 z-30">
              <div className="px-4 py-2 text-sm hover:bg-green-50 cursor-pointer">Zerodha</div>
              <div className="px-4 py-2 text-sm hover:bg-green-50 cursor-pointer">ICICI Bank</div>
              <div className="px-4 py-2 text-sm hover:bg-green-50 cursor-pointer">UpStock</div>
            </div>
          )}
        </div>
        {/* Profile and dropdown */}
        <div className="relative ml-4" ref={profileRef}>
          <div
            className="flex items-center gap-2 cursor-pointer hover:opacity-80 transition"
            onClick={() => setProfileOpen((prev) => !prev)}
          >
            <Image
              src="/account/avatar.png"
              width={32}
              height={32}
              alt="Profile"
              className="rounded-full border border-gray-300"
            />
            <span className="text-sm font-medium text-gray-700 ">Krishna Prajapati</span>
            <IoIosArrowDown className="group-hover:text-green-400" size={16} />
          </div>
          {profileOpen && (
            <div className="absolute right-0 mt-2 mb-2 w-35 bg-white shadow rounded-lg z-30 overflow-hidden">
              <div className="px-4 py-3 text-xs font-bold text-gray-900 bg-gray-50 border-b">My Account</div>
              <button
                className="w-full text-left px-4 py-2 mt-2 text-sm hover:bg-green-50 text-gray-700"
                tabIndex={0}
              >
                <div className="inline-block mr-2 mt-1 cursor-pointer">
                  <ImProfile className="inline mr-2" size={16} />
                  <span>Profile</span>
                </div>
              </button>
              <button
                className="w-full text-left px-4 py-2 text-sm hover:bg-green-50 text-gray-700"
                tabIndex={0}
                onClick={handleSettings}
              >
                <div className="inline-block mr-2 mt-1 cursor-pointer">
                  <IoSettingsOutline className="inline mr-2" size={16} />
                  <span>Settings</span>
                </div>
              </button>
              <button
                className="w-full text-left px-4 py-3 text-sm hover:bg-green-50 text-gray-700"
                tabIndex={0}
                onClick={handleLogout}
              >
                <div className="inline-block mr-2 cursor-pointer">
                  <IoMdLogOut className="inline mr-2" size={16} />
                  <span>Logout</span>
                </div>
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
