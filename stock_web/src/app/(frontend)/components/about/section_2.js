"use client";

import Image from "next/image";
import { useState } from "react";

const columnImages = [
  { chart: "/home/about01-1.png", percent: "/home/about_percent01.png", amount: "10M" },
  { chart: "/home/about01-2.png", percent: "/home/about_percent02.png", amount: "20M" },
  { chart: "/home/about01-3.png", percent: "/home/about_percent03.png", amount: "30M" },
  { chart: "/home/about01-1.png", percent: "/home/about_percent04.png", amount: "40M" },
];

const columnTitles = [
  "Lending Money For Investment Of Your New Projects",
  "Lending Money For Investment Of Your New Projects",
  "Mobile Payment Is More Flexible And Easy For All Investors",
  "All Transaction Is Kept Free For The Member Of Pro Traders"
];

const StatBadge = ({ value, label, className }) => (
  <div className={`absolute px-4 md:px-6 py-2 bg-gray-700 bg-opacity-80 text-white flex items-center gap-2 shadow-lg text-sm md:text-base ${className}`}>
    {typeof value === "string" ? (
      <span className="font-bold text-green-400 text-base md:text-xl">{value}</span>
    ) : (
      value
    )}
    <span className="font-semibold">{label}</span>
  </div>
);

const Section2 = () => {
  const [selected, setSelected] = useState(0);

  return (
    <section className="relative py-10 md:py-16 min-h-[550px] bg-[#00150f]">
      {/* Wallpaper Overlay */}
      <div
        className="absolute inset-0 z-0"
        style={{
          backgroundImage: "url('/home/banner_bg.png')",
          backgroundSize: "cover",
          backgroundPosition: "center",
          opacity: 0.3,
        }}
      />
      <div className="container mx-auto px-4 sm:px-8 lg:px-20 xl:px-40 grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-16 xl:gap-48 items-center relative z-10">
        {/* Left column: benefits */}
        <div>
          <h2 className="text-3xl md:text-4xl font-bold mb-3 text-white">
            <span className="text-green-400">Benefits</span> We Offer
          </h2>
          <p className="text-gray-300 mb-8 text-sm md:text-base">
            Unlock the full potential of our product with our amazing features and top-notch.
          </p>
          <div className="flex flex-col gap-4 md:gap-6">
            {columnTitles.map((title, i) => (
              <button
                key={i}
                onClick={() => setSelected(i)}
                className={
                  `border border-gray-600 rounded-lg px-4 md:px-6 py-3 md:py-4 text-sm md:text-base text-white font-semibold shadow-lg transition-all duration-200 cursor-pointer
                  ${selected === i ? "bg-[#1B2D29] shadow-2xl scale-105" : "bg-opacity-70 hover:bg-[#1B2D29] hover:scale-105"}`
                }
              >
                {title}
              </button>
            ))}
          </div>
        </div>
        {/* Right column: Chart/Overlays */}
        <div className="relative flex justify-center items-center min-h-[330px] md:min-h-[400px] mt-6 md:mt-0">
          <div className="absolute z-20 -top-6 left-1/2 -translate-x-1/2 hidden md:block">
            <Image
              src="/home/about_trend.png"
              alt="Trend"
              width={64}
              height={64}
              className="h-14 w-14 animate-cube-spin animate-bounce"
            />
          </div>
          <Image
            src={columnImages[selected].chart}
            alt="Chart with Dollar"
            width={280}
            height={260}
            className="rounded-xl md:w-[360px] md:h-[320px] lg:w-[480px] lg:h-[420px]"
          />
          <StatBadge
            value={<Image src={columnImages[selected].percent} alt="Percent Badge" width={32} height={32} className="rounded-full" />}
            label="Interest Rate For Loan"
            className="right-4 md:right-8 top-2 pt-2 md:pt-5 pb-2 md:pb-5 rounded-br-2xl md:rounded-br-4xl rounded-tl-lg rounded-bl-lg rounded-tr-lg"
          />
          <StatBadge
            value={columnImages[selected].amount}
            label="Available for loan"
            className="bottom-4 md:bottom-8 left-6 md:left-10 pt-2 md:pt-5 pb-2 md:pb-5 rounded-tr-2xl md:rounded-tr-4xl rounded-tl-xl rounded-bl-xl rounded-br-xl"
          />
        </div>
      </div>
    </section>
  );
};

export default Section2;
