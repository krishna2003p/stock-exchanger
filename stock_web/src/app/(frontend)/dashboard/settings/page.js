"use client";
import { useState } from "react";
import Sidebar from "@/app/(frontend)/components/account/SideBar";
import Navbar from "@/app/(frontend)/components/account/NavBar";
import SettingsPage from "./settings";

export default function Settings() {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [darkMode, setDarkMode] = useState(false);

  return (
    <div className={darkMode ? "dark" : ""}>
      <div className="min-h-screen flex bg-gray-100 dark:bg-[#00150f]">
        
        <div className="flex-1 flex flex-col">
          <Sidebar sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />
          <Navbar darkMode={darkMode} setDarkMode={setDarkMode} />
          <SettingsPage />
        </div>
      </div>
    </div>
  );
}
