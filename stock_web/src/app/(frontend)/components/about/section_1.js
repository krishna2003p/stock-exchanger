import Image from "next/image";

// Example statistic overlays
const StatCard = ({ value, label, className }) => (
  <div
    className={`absolute rounded-xl shadow-lg bg-gray-700 bg-opacity-80 px-6 py-4 text-left text-white ${className}`}
  >
    <div className="font-bold text-green-400 text-2xl mb-1">{value}</div>
    <div className="font-semibold text-lg">{label}</div>
  </div>
);

const Section1 = () => {
  return (
    <section className="pb-8 bg-[#00150f] min-h-[600px] mt-0">
      <div className="container mx-auto px-4 grid grid-cols-1 md:grid-cols-2 gap-8 items-center relative">
        {/* Right: Text first on mobile (order-1), second on md+ (order-2) */}
        <div className="order-1 md:order-2">
          <h2 className="text-white text-4xl font-bold leading-tight mb-5">
            Meet <span className="text-green-400">Our Company</span> Unless <br />Miss The Opportunity
          </h2>
          <p className="text-gray-300 mb-8">
            Hey there! So glad you stopped by to Meet Our Company. Don&apos;t miss out on this opportunity to learn about what we do and the amazing team that makes it all happen! Our company is all about creating innovative solutions and providing top-notch services to our clients. From start to finish, we&apos;re dedicated to delivering results that exceed expectations.
          </p>
          <button className="bg-green-400 px-8 py-3 rounded-lg text-white font-bold text-lg shadow-lg hover:bg-green-500 transition">
            Explore More
          </button>
        </div>

        {/* Left: Image first on desktop (order-1), second on mobile (order-2) */}
        <div className="relative flex justify-center items-center min-h-[350px] order-2 md:order-1">
          <Image
            src="/home/about01-2.png"
            alt="About Us"
            width={520}
            height={520}
            className="rounded-lg shadow-xl"
          />
          <StatCard
            value="10 Years"
            label="Consulting Experience"
            className="top-8 left-0 md:top-22 md:left-15"
          />
          <StatCard
            value="25K+"
            label="Satisfied Customers"
            className="bottom-4 left-24 md:bottom-15 md:left-90"
          />
        </div>
      </div>
    </section>
  );
};

export default Section1;
