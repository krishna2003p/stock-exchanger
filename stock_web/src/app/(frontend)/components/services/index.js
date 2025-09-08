import Image from "next/image";

const Services = () => {
  const services = [
    { img: "/home/services01.png", title: "Strategy Consulting", description: "A social assistant that's flexible can accommodate your schedule and needs, making life easier." },
    { img: "/home/services02.png", title: "Financial Advisory", description: "Modules transform smart trading by automating processes and improving decision-making." },
    { img: "/home/services03.png", title: "Risk Management", description: "There, it's me, your friendly neighborhood reporter's news analyst processes and improving" },
    { img: "/home/services04.png", title: "Supply Optimization", description: "Hey, have you checked out that new cryptocurrency platform? It's pretty cool and easy  to use!" },
    { img: "/home/services05.png", title: "HR Consulting", description: "Hey guys, just a quick update on exchange orders. There have been some changes currency!" },
    { img: "/home/services06.png", title: "Market Consulting", description: "Hey! Just wanted to let you know that the price notification module processes is now live!" },
  ];

  return (
    <div className="container mx-auto px-4 sm:px-6 md:px-8 grid grid-cols-12 gap-8 md:gap-12 items-center relative z-10 mt-20">
      {/* Left column */}
      <div className="col-span-12 md:col-span-4 mb-16 md:mb-72 lg:ml-20 xl:ml-40 lg:mb-40 xl:mb-100">
        <h2 className="text-4xl sm:text-4xl font-bold mb-4 text-white">
          <span className="text-green-400">Services</span> For Every Traders
        </h2>
        <p className="text-base sm:text-lg text-gray-300">
          Discover the most competitive prices in the market, updated regularly for your advantage.
        </p>
      </div>

      {/* Right column */}
      <div className="col-span-12 md:col-span-8 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2 -mt-8 md:gap-6 md:mt-8 lg:ml-20 xl:ml-40 ">
        {services.map((service, index) => (
          <div
            key={index}
            className={`group block mb-12 bg-[#0E221E] p-6 shadow-lg text-center flex flex-col items-center cursor-pointer hover:scale-105 transition-transform duration-300 border-b-4 border-green-400 ${
              index % 2 === 0
                ? "rounded-tr-4xl rounded-bl-4xl"
                : "rounded-tl-4xl rounded-br-4xl"
            }`}
          >
            <Image
              src={service.img}
              alt={service.title}
              width={60}
              height={40}
              className="rounded-full mb-4 mx-auto bg-[#002A1E] p-2"
            />
            <h3 className="text-xl sm:text-2xl font-semibold mb-4 text-white group-hover:text-green-400">{service.title}</h3>
            <p className="text-gray-500 text-sm sm:text-base">{service.description}</p>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Services;
