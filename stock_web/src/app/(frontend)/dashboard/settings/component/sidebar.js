import { FaUser as UserIcon } from "react-icons/fa";
import { FaLock as LockIcon } from "react-icons/fa";
import { FaBell as BellIcon } from "react-icons/fa";
import { FaPaintBrush as AppearanceIcon } from "react-icons/fa";
import { FaChartLine as TradingIcon } from "react-icons/fa";
import { FaRobot as BotsIcon } from "react-icons/fa";
import { FaShieldAlt as PrivacyIcon } from "react-icons/fa";
import { FaDatabase as DataIcon } from "react-icons/fa";
import { FaPlug as ConnectionsIcon } from "react-icons/fa";

const SIDEBAR_ITEMS = [
  {
    title: "Profile",
    items: [
      {
        icon: <UserIcon />,
        label: "Profile",
        key: "profile",
        desc: "Manage your personal information and profile settings"
      }
    ]
  },
  {
    title: "Security",
    items: [
      {
        icon: <LockIcon />,
        label: "Security",
        key: "security",
        desc: "Password, 2FA, API keys, and security settings"
      }
    ]
  },
  {
    title: "Notifications",
    items: [
      {
        icon: <BellIcon />,
        label: "Notifications",
        key: "notifications",
        desc: "Configure email, push, and SMS notifications"
      }
    ]
  },
  {
    title: "Appearance",
    items: [
      {
        icon: <AppearanceIcon />,
        label: "Appearance",
        key: "appearance",
        desc: "Theme, layout, language, and accessibility settings"
      }
    ]
  },
  {
    title: "Trading",
    items: [
      {
        icon: <TradingIcon />,
        label: "Trading",
        key: "trading",
        desc: "Default trading settings and risk management"
      }
    ]
  },
  {
    title: "Bots",
    items: [
      {
        icon: <BotsIcon />,
        label: "Bots",
        key: "bots",
        desc: "Bot parameters, behavior, and monitoring settings"
      }
    ]
  },
  {
    title: "Privacy",
    items: [
      {
        icon: <PrivacyIcon />,
        label: "Privacy",
        key: "privacy",
        desc: "Data sharing, profile privacy, and tracking settings"
      }
    ]
  },
  {
    title: "Data",
    items: [
      {
        icon: <DataIcon />,
        label: "Data",
        key: "data",
        desc: "Data export, retention, and account management"
      }
    ]
  },
  {
    title: "Connections",
    items: [
      {
        icon: <ConnectionsIcon />,
        label: "Connections",
        key: "connections",
        desc: "Connected exchanges, wallets, and third-party services"
      }
    ]
  },
];


const SettingSidebar = ({ activeSection, onSelect }) => (
  <aside className="col-span-12 md:col-span-3">
    <div className="bg-white border rounded-xl p-3">
      <h2 className="px-3 pt-2 pb-3 text-[15px] font-semibold">Settings</h2>
      {SIDEBAR_ITEMS.map(group => (
        <SidebarGroup
          key={group.title}
          title={group.title}
          items={group.items}
          activeSection={activeSection}
          onSelect={onSelect}
        />
      ))}
    </div>
  </aside>
);


function SidebarGroup({ title, items, activeSection, onSelect }) {
  return (
    <div className="mb-2">
      <div className="px-3 pt-3 pb-1 text-xs font-semibold text-gray-500 uppercase tracking-wider">
        {title}
      </div>
      <div className="flex flex-col">
        {items.map((it) => (
          <button
            key={it.label}
            onClick={() => onSelect(it.key)}
            className={`text-left rounded-lg px-3 py-2 mb-1 cursor-pointer border hover:bg-gray-50 ${
              activeSection === it.key ? "bg-gray-100 border-gray-200" : "border-transparent"
            }`}
          >
            <div className="flex items-center gap-3 mb-1">
              {it.icon}
              <div className="text-sm">{it.label}</div>
            </div>
            {it.desc && <div className="text-[12px] text-gray-500 mt-1 ml-6">{it.desc}</div>}
          </button>
        ))}
      </div>
    </div>
  );
}

export default SettingSidebar;