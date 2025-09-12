import Image from "next/image";
import { FaFacebookF, FaInstagram, FaLinkedinIn, FaYoutube, FaTwitter } from "react-icons/fa";

const Section2 = () => {
  return (
    <div className="container mx-auto flex flex-col items-center mt-20">
            {/* Footer grid: Centered, two columns */}
            <div className="w-full max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-10 items-start">
              {/* Left: Logo + Description + App Buttons */}
              <div className="flex flex-col item-start sm:items-center md:items-start ml-5">
                <div className="flex items-center mb-4">
                  <Image src="/home/logo.png" alt="Bitrader Logo" width={38} height={38} />
                  <span className="text-2xl font-bold ml-2 mr-2 text-white">Bitrader</span>
                  <Image src="/home/about_trend2.png" alt="Bitrader Logo" width={70} height={70} className="ml-3 animate-bounce" />
                </div>
                <p className="text-gray-300 mb-3 text-sm max-w-xs text-left sm:text-center md:text-left">
                  Welcome to our trading site! We offer the best, most affordable products and services around. Shop now and start finding great deals!
                </p>
                <div className="flex gap-2 mt-1">
                  <Image src="/home/app.png" alt="App Store" width={120} height={50} />
                  <Image src="/home/google-store.png" alt="Google Play" width={120} height={50} />
                </div>
              </div>
              {/* Right: Three columns for links */}
              <div className="grid grid-cols-3 gap-8 ml-10">
                {/* Quick Links */}
                <div>
                  <div className="font-semibold mb-3 text-lg">Quick links</div>
                  <ul className="space-y-2 text-gray-400 text-sm">
                    <li className="cursor-pointer">About Us</li>
                    <li className="cursor-pointer">Teams</li>
                    <li className="cursor-pointer">Services</li>
                    <li className="cursor-pointer">Features</li>
                  </ul>
                </div>
                {/* Support */}
                <div>
                  <div className="font-semibold mb-3 text-lg">Support</div>
                  <ul className="space-y-2 text-gray-400 text-sm">
                    <li className="cursor-pointer">Terms & Conditions</li>
                    <li className="cursor-pointer">Privacy Policy</li>
                    <li className="cursor-pointer">FAQs</li>
                    <li className="cursor-pointer">Support Center</li>
                  </ul>
                </div>
                {/* Company */}
                <div>
                  <div className="font-semibold mb-3 text-lg">Company</div>
                  <ul className="space-y-2 text-gray-400 text-sm">
                    <li className="cursor-pointer">Careers</li>
                    <li className="cursor-pointer">Updates</li>
                    <li className="cursor-pointer">Job</li>
                    <li className="cursor-pointer">Announce</li>
                  </ul>
                </div>
              </div>
            </div>
            {/* Copyright + Social */}
            <div className="w-full max-w-6xl mx-auto mt-8 flex flex-col md:flex-row justify-between items-center border-t border-gray-800 pt-6">
              <span className="text-gray-400 text-sm mb-3 md:mb-0">
                © {new Date().getFullYear()} All Rights Reserved By Thetork
              </span>
              <div className="flex space-x-5">
                <a href="#" className="hover:text-green-400"><FaFacebookF size={23} /></a>
                <a href="#" className="hover:text-green-400"><FaInstagram size={23} /></a>
                <a href="#" className="hover:text-green-400"><FaLinkedinIn size={23} /></a>
                <a href="#" className="hover:text-green-400"><FaYoutube size={23} /></a>
                <a href="#" className="hover:text-green-400"><FaTwitter size={23} /></a>
              </div>
            </div>
          </div>
//   </div>
  );
};

export default Section2;
