"use client";

import Navbar from "../components/account/NavBar";
import Sidebar from "../components/account/SideBar";
import DashboardCards from "./DashboardCards";
import MarketDashboard from "./MarketDashboard";
import { useState } from "react";

export default function UserDashboardApp() {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [darkMode, setDarkMode] = useState(false);

  return (
    <div className={darkMode ? "dark" : ""}>
      <div className="min-h-screen flex bg-gray-100 dark:bg-[#00150f]">
        
        <div className="flex-1 flex flex-col">
          <Sidebar sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />
          <Navbar darkMode={darkMode} setDarkMode={setDarkMode} />
          {/* <DashboardCards /> */}
          <MarketDashboard />
        </div>
      </div>
    </div>
  );
}