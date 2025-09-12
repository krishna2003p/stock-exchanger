import Image from "next/image";

const Section1 = () => {
  return (
    <div className="relative flex flex-col items-center w-full pt-20 pb-12">
      {/* Top left floating coin (decorative, positioned with Tailwind for safety) */}
      <div className="absolute top-10 left-120 md:-translate-x-1/2 md:-translate-y-1/2 z-10 hidden md:block">
        <Image src="/home/bitcoin.png" alt="Bitrader Logo" width={80} height={80} />
      </div>

      {/* Subscribe Banner */}
      <div className="w-full flex justify-center px-4 md:px-0">
        <div className="bg-[#11E898] rounded-2xl p-6 md:p-10 flex flex-col md:flex-row items-center w-full max-w-3xl mx-auto shadow-2xl relative z-20">
          {/* Subscribe image */}
          <div className="hidden md:block mr-6">
            <Image src="/home/subscribe.png" alt="Subscribe" width={140} height={140} />
          </div>
          {/* Message and Form */}
          <div className="flex flex-col flex-1 min-w-[200px] md:ms-10">
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-2">
              <span className="text-blue-600">Subscribe</span>{" "}
              <span className="text-white">Our News</span>
            </h2>
            <p className="text-[#2D3573] text-sm md:text-base mb-3">
              Hey! Are you tired of missing out on our updates?<br />
              Subscribe to our news now and stay in the loop!
            </p>
            <form className="flex w-full flex-col sm:flex-row gap-2">
              <input
                type="email"
                placeholder="Enter your email"
                className="rounded-md px-4 py-3 flex-1 text-black bg-white focus:outline-none"
              />
              <button className="bg-blue-700 text-white rounded-md px-6 py-3 font-semibold hover:bg-blue-800 transition">Submit</button>
            </form>
          </div>
        </div>
      </div>

      {/* Bottom right floating coin (decorative, positioned with Tailwind for safety) */}
      <div className="absolute bottom-0 right-110 md:translate-x-1/3 md:translate-y-1/3 z-10 hidden md:block">
        <Image src="/home/bitcoin-02.png" alt="Bitrader Logo" width={80} height={80} />
      </div>
    </div>
  );
};

export default Section1;
