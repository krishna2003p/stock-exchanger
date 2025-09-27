import Image from "next/image";
import { FaFacebookF } from "react-icons/fa6";
import { IoLogoInstagram } from "react-icons/io5";
import { IoLogoYoutube } from "react-icons/io";
import { FaLinkedinIn } from "react-icons/fa6";
import { FaTwitter } from "react-icons/fa6";
import { MdSlowMotionVideo } from "react-icons/md";

export default function Home() {
  return (
    <div
      className="relative min-h-screen w-full flex items-center justify-center px-4 md:px-10 mb-0"
      style={{
        backgroundImage: "url('/home/banner_bg.png')",
        backgroundSize: "cover",
        backgroundPosition: "center"
      }}
    >
      {/* Overlay under content */}
      <div className="absolute inset-0 bg-[#00150f] opacity-90 z-0"></div>

      <div className="relative z-10 w-full flex flex-col md:flex-row items-center justify-between gap-y-12 md:gap-x-10 max-w-7xl mx-auto py-10">
        {/* Mobile: Banner image at the top */}
        <div className="block md:hidden w-full flex justify-center">
          <Image
            src="/home/banner_img-2.png"
            alt="Banner"
            className="drop-shadow-xl"
            width={320}
            height={80}
          />
        </div>

        {/* Left Column */}
        <div className="flex-1 flex flex-col items-center md:items-start">
          {/* Coin image: Hide on mobile */}
          <div className="mb-4 hidden md:block">
            <Image src="/home/bitcoin.png" alt="Bitcoin" width={120} height={120} className="animate-spin" />
          </div>
          <h1 className="text-white text-4xl sm:text-4xl md:text-6xl font-bold leading-tight mb-4 text-left sm:text-center md:text-left">
            Invest Your Money <br />
            With <span className="text-green-400">Higher Return</span>
          </h1>
          <p className="text-gray-200 mb-8 text-base sm:text-lg md:text-xl max-w-xl text-center md:text-left">
            Anyone can invest money to different currency to increase their earnings by the help of Bitrader through online.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 mb-10 w-full md:w-auto justify-center md:justify-start">
            <button className="bg-green-400 text-white px-6 py-3 rounded-lg font-semibold shadow-lg hover:bg-green-500 transition cursor-pointer text-base">
              Get Started &rarr;
            </button>
            <button className="group border border-green-400 text-green-400 px-6 py-3 rounded-lg font-semibold bg-transparent hover:bg-green-400 hover:text-white transition flex items-center gap-2 cursor-pointer text-base justify-center">
              <MdSlowMotionVideo className="group-hover:text-white text-green-400 transition" size={20} />
              <span className="group-hover:text-white transition">Watch Video</span>
            </button>
          </div>
          {/* Follow Us: Hide on mobile */}
          <div className="mt-6 sm:mt-8 w-full md:w-auto flex flex-col items-center md:items-start hidden md:block">
            <div className="text-white font-semibold text-lg mb-4">Follow Us</div>
            <div className="flex gap-3 sm:gap-4 justify-center md:justify-start">
              <FaFacebookF className="text-white rounded-full hover:text-green-400 transition border p-2 cursor-pointer" size={30} />
              <FaTwitter className="text-white rounded-full hover:text-green-400 transition border p-2 cursor-pointer" size={30} />
              <FaLinkedinIn className="text-white rounded-full hover:text-green-400 transition border p-2 cursor-pointer" size={30} />
              <IoLogoInstagram className="text-white rounded-full hover:text-green-400 transition border p-2 cursor-pointer" size={30} />
              <IoLogoYoutube className="text-white rounded-full hover:text-green-400 transition border p-2 cursor-pointer" size={30} />
            </div>
          </div>
        </div>

        {/* Right Column: main banner and cube, both hidden on mobile */}
        <div className="flex-1 flex-col items-center md:items-end justify-between hidden md:flex">
          <Image
            src="/home/banner_img-2.png"
            alt="Banner"
            className="sm:h-96 md:h-[32rem] w-auto drop-shadow-xl animate-bounce mb-6"
            width={400} height={160}
          />
          <Image
            src="/home/cube.png"
            alt="Cube"
            className="animate-spin ms-5"
            width={48} height={48}
          />
        </div>
      </div>
    </div>
  );
}
