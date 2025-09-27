"use client";
import { useState } from "react";
import Sidebar from "@/app/(frontend)/components/account/SideBar";
import Navbar from "@/app/(frontend)/components/account/NavBar";
import SettingSidebar from "./component/sidebar";
import Profile from "./component/profile";
import Bots from "./component/bot/bot-configuration";
import BotPage from "./component/bot/bot-page";


export default function Settings() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [darkMode, setDarkMode] = useState(false);
  const [activeSection, setActiveSection] = useState("profile");

  return (
    <div className={darkMode ? "dark" : ""}>
      <div className="min-h-screen flex bg-gray-100 dark:bg-[#00150f]">
        
        <div className="flex-1 flex flex-col">
          <Sidebar sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />
          <Navbar darkMode={darkMode} setDarkMode={setDarkMode} />
          <div className="min-h-screen bg-[#fafafa]">
          <div className="mx-18 p-6">
          <div className="grid grid-cols-12 gap-6">
          <SettingSidebar
            activeSection={activeSection}
            onSelect={setActiveSection}
          />
          <section className="col-span-12 md:col-span-9">
            {activeSection === "profile" && <Profile />}
            {activeSection === "bots" && <BotPage />}
            {/* add more for other sections */}
            {/* <Profile /> */}
          </section>
          </div>
          </div>
          </div>
        </div>
      </div>
    </div>
  );
}
