import Section1 from "./footer/section1";
import Section2 from "./footer/section2";

const Footer = () => {
  return (
    <footer className="bg-[#00150f] text-white pb-4 mt-2 w-full relative">
      {/* Footer */}
      <Section1 />
      <Section2 />
    </footer>
  );
};

export default Footer;
