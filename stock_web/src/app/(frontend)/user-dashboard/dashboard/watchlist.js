import { useState } from "react";
import Image from "next/image";

// Dummy data for demonstration
const watchlists = [
  { label: "Watchlist 1", key: 1 }, { label: "Watchlist 2", key: 2 },
  { label: "Watchlist 3", key: 3 }, { label: "Watchlist 4", key: 4 },
];

const stocks = [
  {
    logo: "/logos/tesla.png", name: "TSLA", qty: 29, price: 387, invested: 2023, current: 9343, returns: 21.73, trend: "up", miniChart: "/charts/mini-up.svg"
  },
  {
    logo: "/logos/nvidia.png", name: "NVDA", qty: 20, price: 345, invested: 7230, current: 7576, returns: -1.85, trend: "down", miniChart: "/charts/mini-down.svg"
  },
  {
    logo: "/logos/apple.png", name: "APPL", qty: 11, price: 710, invested: 5849, current: 1682, returns: 45.47, trend: "up", miniChart: "/charts/mini-up.svg"
  },
  {
    logo: "/logos/amd.png", name: "AMD", qty: 4, price: 660, invested: 7569, current: 3603, returns: -49.81, trend: "down", miniChart: "/charts/mini-down.svg"
  },
  // ... (rest of stocks)
];

export default function WatchlistPage() {
  const [activeTab, setActiveTab] = useState(1);
  const [activeStock, setActiveStock] = useState(stocks[3]);

  return (
    <div className="bg-[#fafbfc] min-h-screen p-6">
      <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-[5fr_3fr] gap-6">
        {/* Table & Tabs */}
        <div>
          <div className="flex items-center gap-2 mb-4">
            {watchlists.map((wl) => (
              <button
                key={wl.key}
                className={`px-4 py-1.5 rounded-lg text-sm font-semibold border transition ${
                  activeTab === wl.key
                    ? "bg-blue-50 border-blue-400 text-blue-600"
                    : "border-gray-300 bg-white text-gray-700 hover:bg-gray-50"
                }`}
                onClick={() => setActiveTab(wl.key)}
              >
                {wl.label}
              </button>
            ))}
            <button className="px-3 py-1.5 rounded-lg border border-gray-300 bg-white text-gray-700 font-bold text-lg hover:bg-gray-50 flex items-center">+</button>
            <button className="ml-auto px-4 py-1.5 rounded-md bg-blue-600 hover:bg-blue-700 text-white font-semibold">+ Add new</button>
          </div>
          <div className="bg-white rounded-xl border p-2 overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="text-left text-gray-400">
                  <th className="px-3 py-2 font-medium">Company</th>
                  <th className="px-3 py-2 font-medium">Qty.</th>
                  <th className="px-3 py-2 font-medium">Mkt. Price</th>
                  <th className="px-3 py-2 font-medium">Invested</th>
                  <th className="px-3 py-2 font-medium">Current</th>
                  <th className="px-3 py-2 font-medium">Returns</th>
                </tr>
              </thead>
              <tbody>
                {stocks.map((stock, idx) => (
                  <tr
                    key={stock.name + idx}
                    className={`group cursor-pointer font-medium text-gray-700 ${
                      activeStock.name === stock.name
                        ? "bg-gray-100"
                        : idx % 2 === 1
                        ? "bg-white"
                        : "bg-gray-50"
                    }`}
                    onClick={() => setActiveStock(stock)}
                  >
                    <td className="flex items-center gap-2 px-3 py-2">
                      <Image src={stock.logo} alt={stock.name} width={24} height={24} className="w-6 h-6" />
                      <span>{stock.name}</span>
                      <Image src={stock.miniChart} alt="" width={64} height={28} className="w-16 h-7 ml-2" />
                    </td>
                    <td className="px-3 py-2">{stock.qty}</td>
                    <td className="px-3 py-2">${stock.price}</td>
                    <td className="px-3 py-2">${stock.invested}</td>
                    <td className={`px-3 py-2 font-semibold ${
                      stock.current > stock.invested ? "text-green-600" : "text-red-500"
                    }`}>
                      ${stock.current}
                    </td>
                    <td className="px-3 py-2 flex items-center gap-2 font-medium">
                      {stock.returns >= 0 
                        ? <span className="text-green-600">▲ ${stock.returns.toFixed(2)}</span>
                        : <span className="text-red-500">▼ ${Math.abs(stock.returns).toFixed(2)}</span>
                      }
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div className="flex items-center justify-between mt-2 p-2 text-xs text-gray-400">
              <span>Page 1 of 10</span>
              <div className="flex gap-2">
                <button className="px-3 py-1 rounded-md border bg-white">Previous</button>
                <button className="px-3 py-1 rounded-md border bg-white">Next</button>
              </div>
            </div>
          </div>
        </div>
        {/* Buy/Sell and details panel */}
        <div>
          <div className="bg-white rounded-xl border p-6 mb-6 min-h-[450px] flex flex-col">
            <div className="flex items-center justify-between mb-3">
              <span className="font-semibold text-lg">{activeStock.name}</span>
              <span className="text-gray-400 text-xs">NSE $227.13 · BSE $227.27 (-6.521%)</span>
            </div>
            <div className="flex gap-6 mb-6">
              <button className="font-bold px-4 py-1 border-b-2 border-blue-600 text-blue-600">Buy</button>
              <button className="font-bold px-4 py-1 text-gray-400 border-b-2 border-transparent">Sell</button>
            </div>
            <div className="flex gap-3 flex-wrap mb-4">
              <button className="py-1 px-3 text-xs rounded-full border">Delivery</button>
              <button className="py-1 px-3 text-xs rounded-full border border-blue-500 text-blue-600 font-semibold">MTF</button>
              <button className="py-1 px-3 text-xs rounded-full border text-gray-400">Intraday</button>
            </div>
            <form className="flex flex-col gap-3 mb-2">
              <label className="text-xs text-gray-600">Quantity</label>
              <div className="flex gap-2 items-center">
                <input type="number" value={activeStock.qty} readOnly className="border rounded px-2 py-1 w-24"/>
                <span className="text-xs">BSE</span>
                <button type="button" className="ml-2 px-2 text-lg text-gray-400">-</button>
                <button type="button" className="px-2 text-lg text-gray-400">+</button>
              </div>
              <label className="text-xs text-gray-600">Price</label>
              <div className="flex gap-2 items-center mb-2">
                <input type="number" value={260} className="border rounded px-2 py-1 w-24"/>
                <span className="text-xs">Limit</span>
              </div>
              <div className="rounded-md bg-gradient-to-r from-blue-200 via-pink-100 to-yellow-100 p-2 text-xs flex items-center gap-2 mb-3">
                <span>Stock is under watch by exchange</span>
                <span className="ml-auto text-gray-400 text-base">?</span>
              </div>
              <button className="w-full mt-2 rounded-lg bg-gradient-to-r from-blue-500 via-purple-400 to-yellow-400 font-bold text-white py-2 shadow text-lg flex items-center justify-center gap-2 transition hover:brightness-110">
                BUY <span className="ml-2">⚡</span>
              </button>
            </form>
          </div>

          {/* Similar stocks */}
          <div className="bg-white rounded-xl border p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="font-semibold text-base">Similar stocks</span>
              <button className="text-xs text-blue-500">See more</button>
            </div>
            <div className="flex flex-col gap-3">
              <div className="flex items-center justify-between border rounded-lg p-2 hover:bg-gray-50">
                <div className="flex items-center gap-2">
                  <Image src="/logos/nvidia.png" alt="Nvidia" width={32} height={32} className="w-8 h-8" />
                  <div>
                    <div className="text-sm font-medium">Nvidia</div>
                    <div className="text-xs text-gray-400">Current Value</div>
                  </div>
                </div>
                <div className="flex flex-col items-end">
                  <span className="text-green-600 font-medium">$203.65 <span className="text-xs">+5.63</span></span>
                  <Image src="/charts/mini-up.svg" alt="" width={40} height={20} className="w-10 h-5"/>
                </div>
              </div>
              <div className="flex items-center justify-between border rounded-lg p-2 hover:bg-gray-50">
                <div className="flex items-center gap-2">
                  <Image src="/logos/meta.png" alt="Meta" width={32} height={32} className="w-8 h-8" />
                  <div>
                    <div className="text-sm font-medium">Meta</div>
                    <div className="text-xs text-gray-400">Current Value</div>
                  </div>
                </div>
                <div className="flex flex-col items-end">
                  <span className="text-red-500 font-medium">$151.74</span>
                  <Image src="/charts/mini-down.svg" alt="" width={40} height={20} className="w-10 h-5"/>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
