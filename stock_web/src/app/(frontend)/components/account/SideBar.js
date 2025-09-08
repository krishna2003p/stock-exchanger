"use client";
import {
  FaChartBar,
  FaWallet,
  FaRobot,
  FaBalanceScale,
  FaChevronLeft,
  FaChevronDown,
  FaCog,
  FaSignOutAlt,
} from "react-icons/fa";
import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { FaBoxesStacked } from "react-icons/fa6";
import { FaFirstOrder } from "react-icons/fa";
import { FaGoogleWallet } from "react-icons/fa6";
import { TbWalletOff } from "react-icons/tb";
import { FaList } from "react-icons/fa6";
import { useRouter } from 'next/navigation';
import { TbMoneybag } from "react-icons/tb";
import { TbBrandGoogleAnalytics } from "react-icons/tb";


// Submenu items (shared for Stocks, F&O, Commodity)
const subMenus = [
    {icon: <FaList />, label: "Watchlist"},
  {icon: <TbWalletOff />, label: "Portfolio"},
  {icon: <FaFirstOrder />, label: "Place Order"},
  {icon: <FaGoogleWallet />, label: "Open Position"},
  {icon: <FaBoxesStacked />, label: "Order book"},
  {icon: <FaChartBar />, label: "Trade book"}
];

export default function Sidebar({ sidebarOpen, setSidebarOpen }) {
  const [openSub, setOpenSub] = useState(""); // Track open submenu
   const router = useRouter();

  // Each menu has a section title (null disables)
  const sections = [
    {
      title: "Main",
      menus: [
        { icon: <FaChartBar />, label: "Dashboard", sub: false },
        { icon: <TbMoneybag />, label: "My Assets", sub: false },
        { icon: <TbBrandGoogleAnalytics />, label: "My Analytics", sub: false },
      ]
    },
    {
      title: "Portfolio",
      menus: [
        { icon: <FaGoogleWallet />, label: "Portfolio", sub: true },
      ]
    },
    {
      title: "Stocks",
      menus: [
        { icon: <FaRobot />, label: "Stocks", sub: true },
      ]
    },
    {
      title: "F&O",
      menus: [
        { icon: <FaBalanceScale />, label: "F&O", sub: true },
      ]
    },
    {
      title: "Commodity",
      menus: [
        { icon: <FaBoxesStacked />, label: "Commodity", sub: true },
      ]
    },
  ];

  //   Handle logout
async function handleLogout() {
  try {
    await fetch('/api/signOut', { method: 'POST' }); // same-origin; includes will auto-apply Set-Cookie
    router.push('/');
    // router.refresh(); // optional to revalidate client state
  } catch (e) {
    router.push('/');
  }
}

  return (
    <aside
      className={`transition-all duration-300 fixed top-0 left-0 h-screen z-30 bg-white border-r flex flex-col ${
        sidebarOpen ? "w-60" : "w-16"
      }`}
    >
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b">
        <button
          className="text-gray-900"
          onClick={() => setSidebarOpen((prev) => !prev)}
          aria-label={sidebarOpen ? "Collapse" : "Expand"}
        >
          {sidebarOpen ? (
            <FaChevronLeft size={28} />
          ) : (
            <Image src="/home/logo.png" alt="logo" width={36} height={28} />
          )}
        </button>
        {sidebarOpen && (
          <div className="flex items-center">
            <Image src="/home/logo.png" alt="logo" width={36} height={28} />
            <span className="ml-2 font-bold text-gray-900 text-lg tracking-tight">
              Bitrader
            </span>
          </div>
        )}
      </div>
      {/* Main navigation */}
      <nav className="flex-1 flex flex-col mt-2 gap-2 overflow-y-auto">
        {sections.map((section) => (
          <div key={section.title} className="mb-2">
            {sidebarOpen && section.title && (
              <span className="pl-4 pt-3 pb-1 text-xs font-semibold text-gray-400 uppercase tracking-wider select-none">{section.title}</span>
            )}
            {section.menus.map((menu, idx) => {
              const isActive = openSub === menu.label || (section.title === "Main" && idx === 0);
              return (
                <div key={menu.label}>
                  {/* Main menu */}
                  <div
                    className={`flex items-center cursor-pointer transition
                      rounded-lg mx-2
                      ${sidebarOpen ? "justify-start px-3 py-2.5" : "justify-center py-3"}
                      ${isActive ? "bg-gray-100 font-semibold text-gray-900" : "hover:bg-gray-50 text-gray-800"}
                      ${menu.sub && openSub === menu.label && "border-l-4 border-blue-500"}`
                    }
                    style={isActive && menu.sub ? { boxShadow: '0 0 0 2px #3B82F622, 0 1px 2px 0 #0001' } : {}}
                    tabIndex={0}
                    onClick={() => {
                      if (menu.sub) setOpenSub(openSub === menu.label ? "" : menu.label);
                    }}
                  >
                    <span className={`flex-none ${sidebarOpen ? "mr-3" : ""} text-lg`}>
                      {menu.icon}
                    </span>
                    {sidebarOpen && (
                      <>
                        <span className="text-sm">{menu.label}</span>
                        {menu.sub ? (
                          <FaChevronDown
                            className={`ml-auto transition-transform duration-200 ${
                              openSub === menu.label ? "rotate-180" : ""
                            }`}
                            size={15}
                          />
                        ) : null}
                      </>
                    )}
                  </div>
                  {/* Submenu */}
                  {sidebarOpen && menu.sub && openSub === menu.label && (
                    <div className="m-2 mt-0 rounded-xl bg-blue-50/[0.9] px-3 py-1.5 ">
                      {subMenus.map((sub) => (
                        <div key={sub.label} className="flex items-center mb-1 pl-2 last:mb-0 text-gray-700 hover:bg-blue-100 hover:text-green-400 rounded-lg text-sm cursor-pointer">
                            {sub.icon}
                          <div className="pl-4 pr-3 py-2 ">
                            {sub.label}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        ))}
        {/* Spacer to push profile to bottom */}
        <div className="flex-1"></div>
        {/* Settings/Logout */}
        <div className="mb-3 pt-1 border-t">
          <div className={`flex items-center mx-2 px-3 py-2 rounded-lg cursor-pointer hover:bg-gray-50 text-gray-700 gap-3`}>
            <FaCog />{sidebarOpen && <span className="text-sm">Settings</span>}
          </div>
          <div className={`flex items-center mx-2 px-3 py-2 rounded-lg hover:bg-gray-50 text-gray-700 gap-3`}>
            <button onClick={handleLogout} className="flex items-center gap-3 w-full cursor-pointer">
              <FaSignOutAlt />{sidebarOpen && <span className="text-sm">Logout</span>}
            </button>
          </div>
        </div>
        {/* User Profile block */}
        <div className="flex items-center px-3 py-3 mt-2 mb-2 bg-gray-50 rounded-2xl mx-2">
          <Image
            src="/account/avatar.png"
            width={36}
            height={36}
            alt="User"
            className="rounded-full ring-1 ring-blue-200"
          />
          {sidebarOpen && (
            <div className="ml-3 flex flex-col">
              <span className="font-semibold text-[15px] text-gray-900">Krishna Prajapati</span>
              <span className="text-xs text-blue-600 font-semibold">Pro Plan</span>
            </div>
          )}
        </div>
      </nav>
    </aside>
  );
}
