"use client";

import { useState } from "react";
import Image from "next/image";
import { FiPlus, FiMinus } from "react-icons/fi";

const faqs = [
  {
    question: "What Does This Tool Do?",
    answer:
      "Online trading’s primary advantages are that it allows you to manage your trades at your convenience.",
  },
  {
    question: "What Are The Disadvantages Of Online Trading?",
    answer:
      "Online trading involves certain risks such as market volatility, technical glitches, and possible security issues.",
  },
  {
    question: "Is Online Trading Safe?",
    answer:
      "With proper security measures and choosing regulated platforms, online trading can be safe. Always exercise caution.",
  },
  {
    question: "What Is Online Trading, And How Does It Work?",
    answer:
      "Online trading is the act of buying and selling financial products via an internet-based platform. It’s fast, convenient, and accessible.",
  },
  {
    question: "Which App Is Best For Online Trading?",
    answer:
      "The best app depends on your needs; look for features, reliability, and reviews before you choose.",
  },
  {
    question: "How To Create A Trading Account?",
    answer:
      "Select a trading platform, provide required personal documents, and follow their registration process to set up an account.",
  },
];

export default function FAQPage() {
  const [openIndex, setOpenIndex] = useState(0);

  return (
    <div className="min-h-screen flex items-center justify-center px-4 lg:px-20 bg-[#00150f] relative">
      {/* Floating Coin Image */}
      <Image
        src="/home/bitcoin-02.png"
        alt="Coin"
        width={80}
        height={80}
        className="absolute top-[6%] left-[13%] hidden md:block"
      />

      <div className="container mx-auto grid grid-cols-1 md:grid-cols-12 gap-x-2 items-center relative">
        {/* FAQ Left Column (span 7) */}
        <div className="col-span-12 md:col-span-7 py-16 md:py-24 flex flex-col items-start md:ms-40 lg:ml-30 xl:ml-60">
          <h2 className="text-4xl md:text-3xl lg:text-4xl font-bold mb-4 text-white">
            <span className="text-green-400">Frequently</span> Asked Questions
          </h2>
          <p className="text-gray-400 mb-8 text-sm md:text-base lg:text-lg max-w-lg">
            Hey there! Got questions? We've got answers. Check out our FAQ page for all the deets. Still not satisfied? Hit us up.
          </p>
          <div className="w-full max-w-lg">
            {faqs.map((faq, i) => (
              <div key={faq.question}>
                <button
                  className={`w-full flex items-center justify-between py-3 px-0 font-medium text-left text-sm md:text-base transition-all ${
                    openIndex === i
                      ? "text-green-400"
                      : "text-white hover:text-green-400"
                  }`}
                  onClick={() => setOpenIndex(openIndex === i ? null : i)}
                >
                  <span className={openIndex === i ? "font-bold" : ""}>
                    {faq.question}
                  </span>
                  {openIndex === i ? (
                    <FiMinus className="ml-2 text-green-400 cursor-pointer" size={20} />
                  ) : (
                    <FiPlus className="ml-2 text-white cursor-pointer" size={20} />
                  )}
                </button>
                {openIndex === i && (
                  <div className="pl-1 pb-3 text-gray-400 text-xs md:text-sm border-l-2 border-green-400">
                    {faq.answer}
                  </div>
                )}
                {i !== faqs.length - 1 && (
                  <div className="border-b border-gray-700"></div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Right Column: FAQ Banner Image (span 5) */}
        <div className="col-span-12 md:col-span-5 flex justify-center items-center py-12 md:py-24">
          <Image
            src="/home/faq-2.png"
            alt="FAQ Banner"
            width={480}
            height={480}
            className="drop-shadow-2xl w-full sm:max-w-[480px]"
          />
        </div>
      </div>
    </div>
  );
}
