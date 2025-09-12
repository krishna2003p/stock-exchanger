export default function Dashboard() {
  return (
    <main className="flex-1 ml-16 md:ml-56 transition-all duration-300">
      {/* Info cards */}
      <div className="p-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
        {/* Card example */}
        <div className="bg-white rounded-xl shadow p-5 text-sm">
          <div className="font-bold text-gray-700 text-xl">$45,231.89</div>
          <div className="text-green-500 text-xs mt-1">+20.1% from last month</div>
          <div className="mt-2 text-gray-500 text-sm">Total Balance</div>
        </div>
        {/* ...add other cards as in screenshot */}
      </div>
      {/* Chart row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 px-6">
        <div className="bg-white rounded-xl shadow p-5 text-sm lg:col-span-2">
          <div className="font-semibold mb-2 text-base">Profit Chart</div>
          {/* Chart placeholder */}
          <div className="mt-3 h-44 bg-gradient-to-t from-green-400 to-green-300 rounded flex items-end">
            {/* ...chart bars as shown in screenshot */}
          </div>
        </div>
        <div className="bg-white rounded-xl shadow p-5 text-sm">
          <div className="font-semibold mb-2 text-base">Recent Trades</div>
          {/* ...recent trades */}
        </div>
      </div>
      {/* Lower Stats Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 px-6 mt-4">
        {/* Top Performing Bots */}
        <div className="bg-white rounded-xl shadow p-5 text-sm">
          <div className="font-semibold mb-2 text-base">Top Performing Bots</div>
          {/* ...table as per screenshot */}
        </div>
        <div className="bg-white rounded-xl shadow p-5 text-sm">
          <div className="font-semibold mb-2 text-base">Wallet Overview</div>
          {/* ...assets table as per screenshot */}
        </div>
      </div>
    </main>
  );
}
