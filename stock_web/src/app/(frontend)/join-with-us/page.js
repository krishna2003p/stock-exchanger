"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { FaArrowLeft, FaGoogle, FaFacebookF, FaTwitter, FaLinkedinIn } from "react-icons/fa";
import { IoLogoInstagram } from "react-icons/io5";
import { useSearchParams } from "next/navigation";

export default function AuthPage() {
  const [isSignUp, setIsSignUp] = useState(true);
  const searchParams = useSearchParams();
  const router = useRouter();

  // Sign Up form state
  const [suName, setSuName] = useState("");
  const [suEmail, setSuEmail] = useState("");
  const [suMobile, setSuMobile] = useState("");
  const [suUsername, setSuUsername] = useState("");
  const [suPassword, setSuPassword] = useState("");

  // Sign In form state
  const [siUsername, setSiUsername] = useState("");
  const [siPassword, setSiPassword] = useState("");

  // UI state
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [message, setMessage] = useState(null);

  useEffect(() => {
    const mode = searchParams.get("mode");
    if (mode === "register") setIsSignUp(true);
    if (mode === "login") setIsSignUp(false);
  }, [searchParams]);

  async function handleSignUpSubmit(e) {
    e.preventDefault();
    setError(null);
    setMessage(null);
    setLoading(true);
    try {
      // Correct endpoint for signup
      const res = await fetch("/api/signUp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        // match your payload
        body: JSON.stringify({
          name: suName,
          email: suEmail,
          mobile: suMobile,
          password: suPassword,
          username: suUsername,
        }),
        credentials: "include", // if API sets a cookie (token) on success
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data?.message || data?.error || "Sign up failed");
      }

      setMessage("Sign up successful. Please sign in.");
      setIsSignUp(false);
      router.push("/dashboard");
    } catch (err) {
      setError(err?.message || "Sign up error");
    } finally {
      setLoading(false);
    }
  }

  async function handleSignInSubmit(e) {
    e.preventDefault();
    setError(null);
    setMessage(null);
    setLoading(true);
    try {
      const res = await fetch("/api/signIn", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username: siUsername,
          password: siPassword,
        }),
        credentials: "include", // receive/set auth cookie if server returns Set-Cookie
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data?.message || data?.error || "Sign in failed");
      }

      // If the API returns a token in JSON instead of cookie, optionally store it:
      // document.cookie = `token=${data.token}; Path=/; Secure; SameSite=Lax`;

      // Navigate; middleware can also redirect based on token verification
      router.push("/dashboard");
    } catch (err) {
      setError(err?.message || "Sign in error");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen w-full flex items-center justify-center relative overflow-hidden bg-[#00150f]">
      {/* Decorative animated wallpaper */}
      <div className="fixed inset-0 z-0">
        <div className="absolute w-full h-full bg-gradient-to-br from-green-900 via-[#001a12] to-black opacity-70 blur-0 animate-[pulse_8s_ease-in-out_infinite]"></div>
        <div className="absolute -top-40 -left-40 w-[32rem] h-[32rem] rounded-full opacity-20 bg-gradient-to-tr from-green-400 to-blue-400 animate-pulse"></div>
        <div className="absolute -bottom-20 right-0 w-[24rem] h-[24rem] rounded-full opacity-20 bg-gradient-to-bl from-green-400 to-green-500"></div>
      </div>

      <div className="w-full max-w-4xl bg-white rounded-3xl shadow-2xl overflow-hidden flex flex-col md:flex-row relative z-10">
        {/* Back arrow */}
        <Link href="/" className="absolute top-4 left-4 z-20 flex items-center gap-2 text-[#0F2D23] font-semibold hover:text-green-500 transition">
          <FaArrowLeft size={22} />
        </Link>

        {/* Left Illustration section */}
        <div className="relative flex-1 flex flex-col items-center justify-center bg-gradient-to-b from-green-400 to-[#00150f] p-8 text-white">
          <svg
            className="hidden md:block absolute right-0 top-0 h-full"
            width="70"
            height="100%"
            viewBox="0 0 70 600"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            preserveAspectRatio="none"
            style={{ minHeight: "100%" }}
          >
            <path
              d="M0,0 Q60,120 0,180 Q60,240 0,300 Q60,360 0,420 Q60,480 0,600 L70,600 L70,0 Z"
              fill="#fff"
            />
          </svg>
          <div className="mb-5 z-10">
            <Image src="/signin/wal-01.png" alt="Brand" width={180} height={180} className="mx-auto" />
          </div>
          <h1 className="text-2xl font-bold mb-0 z-10">Welcome to</h1>
          <div className="text-3xl font-black tracking-wide mb-2 z-10">
            <span className="text-white">Bitrader</span>
          </div>
          <p className="mb-4 text-base opacity-80 z-10 px-4 text-center">
            Investing. Trading. Growing together.<br />
            Join us and power-up your earnings.
          </p>
        </div>

        {/* Right: Auth Form */}
        <div className="flex-1 px-4 sm:px-10 py-10 flex flex-col justify-center relative">

          {/* Messages */}
          {error && <div className="mb-4 text-red-600 text-sm">{error}</div>}
          {message && <div className="mb-4 text-green-600 text-sm">{message}</div>}

          {/* Tab Switcher */}
          <div className="flex mb-8 gap-6 justify-center">
            <button
              className={`pb-2 text-lg font-bold border-b-2 transition cursor-pointer hover:text-green-700 ${
                isSignUp ? "border-green-400 text-green-700" : "border-transparent text-gray-400"
              }`}
              onClick={() => setIsSignUp(true)}
              disabled={loading}
            >
              Sign Up
            </button>
            <button
              className={`pb-2 text-lg font-bold border-b-2 transition cursor-pointer hover:text-green-700 ${
                !isSignUp ? "border-green-400 text-green-700" : "border-transparent text-gray-400"
              }`}
              onClick={() => setIsSignUp(false)}
              disabled={loading}
            >
              Sign In
            </button>
          </div>

          {isSignUp ? (
            <form className="space-y-4" onSubmit={handleSignUpSubmit}>
              <div>
                <label className="font-semibold text-[#222]">Name</label>
                <input
                  type="text"
                  placeholder="Enter your name"
                  className="w-full mt-1 px-4 py-2 border-b-2 border-green-400 bg-transparent text-black outline-none focus:border-green-600 rounded transition"
                  autoComplete="name"
                  value={suName}
                  onChange={(e) => setSuName(e.target.value)}
                  required
                />
              </div>
              <div>
                <label className="font-semibold text-[#222]">E-mail Address</label>
                <input
                  type="email"
                  placeholder="Enter your mail"
                  className="w-full mt-1 px-4 py-2 border-b-2 border-green-400 bg-transparent text-black outline-none focus:border-green-600 rounded transition"
                  autoComplete="email"
                  value={suEmail}
                  onChange={(e) => setSuEmail(e.target.value)}
                  required
                />
              </div>
              <div>
                <label className="font-semibold text-[#222]">Mobile</label>
                <input
                  type="tel"
                  placeholder="Enter mobile"
                  className="w-full mt-1 px-4 py-2 border-b-2 border-green-400 bg-transparent text-black outline-none focus:border-green-600 rounded transition"
                  autoComplete="tel"
                  value={suMobile}
                  onChange={(e) => setSuMobile(e.target.value)}
                />
              </div>
              <div>
                <label className="font-semibold text-[#222]">Username</label>
                <input
                  type="text"
                  placeholder="Choose a username"
                  className="w-full mt-1 px-4 py-2 border-b-2 border-green-400 bg-transparent text-black outline-none focus:border-green-600 rounded transition"
                  autoComplete="username"
                  value={suUsername}
                  onChange={(e) => setSuUsername(e.target.value)}
                  required
                />
              </div>
              <div>
                <label className="font-semibold text-[#222]">Password</label>
                <input
                  type="password"
                  placeholder="Enter your password"
                  className="w-full mt-1 px-4 py-2 border-b-2 border-green-400 bg-transparent text-black outline-none focus:border-green-600 rounded transition"
                  autoComplete="new-password"
                  value={suPassword}
                  onChange={(e) => setSuPassword(e.target.value)}
                  required
                />
              </div>
              <div className="flex items-center gap-2">
                <input type="checkbox" id="terms" className="accent-green-400" required />
                <label htmlFor="terms" className="text-gray-700 text-xs">
                  By Signing Up, I Agree with <Link href="#" className="text-green-500 underline">Terms & Conditions</Link>
                </label>
              </div>

              <div className="flex gap-4 mt-5">
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 py-2 rounded-full bg-gradient-to-r from-green-400 to-[#27664b] text-white cursor-pointer font-bold text-lg shadow-lg hover:from-green-500 hover:to-[#1b5939] transition"
                >
                  {loading ? "Signing Up..." : "Sign Up"}
                </button>
              </div>
            </form>
          ) : (
            <form className="space-y-4" onSubmit={handleSignInSubmit}>
              <div>
                <label className="font-semibold text-[#222]">E-mail or Username</label>
                <input
                  type="text"
                  placeholder="Enter email or username"
                  className="w-full mt-1 px-4 py-2 border-b-2 border-green-400 bg-transparent text-black outline-none focus:border-green-600 rounded transition"
                  autoComplete="username"
                  value={siUsername}
                  onChange={(e) => setSiUsername(e.target.value)}
                  required
                />
              </div>
              <div>
                <label className="font-semibold text-[#222]">Password</label>
                <input
                  type="password"
                  placeholder="Enter your password"
                  className="w-full mt-1 px-4 py-2 border-b-2 border-green-400 bg-transparent text-black outline-none focus:border-green-600 rounded transition"
                  autoComplete="current-password"
                  value={siPassword}
                  onChange={(e) => setSiPassword(e.target.value)}
                  required
                />
              </div>
              <div className="flex justify-between items-center text-xs text-gray-600 mt-1">
                <label className="flex gap-1 items-center">
                  <input type="checkbox" className="accent-green-400" />
                  Remember me
                </label>
                <Link href="#" className="text-green-500 underline">Forgot Password?</Link>
              </div>

              <div className="flex gap-4 mt-4">
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 py-2 rounded-full bg-gradient-to-r from-green-400 to-[#27664b] text-white cursor-pointer font-bold text-lg shadow-lg hover:from-green-500 hover:to-[#1b5939] transition"
                >
                  {loading ? "Signing In..." : "Sign In"}
                </button>
                <button
                  type="button"
                  className="flex-1 py-2 rounded-full border-2 border-green-400 text-green-600 font-bold cursor-pointer text-lg bg-white hover:bg-green-50 transition"
                  onClick={() => setIsSignUp(true)}
                  disabled={loading}
                >
                  Sign Up
                </button>
              </div>
            </form>
          )}

          {/* Social buttons (no-op) */}
          <div className="flex gap-3 sm:gap-4 justify-center md:justify-start mt-6">
            <button className="bg-white border border-gray-200 text-[#ea4335] hover:bg-green-50 transition rounded-full p-2 shadow-sm" aria-label="Google">
              <FaGoogle size={23} />
            </button>
            <button className="bg-[#1877f3] hover:bg-green-400 transition rounded-full p-2 text-white shadow-sm" aria-label="Facebook">
              <FaFacebookF size={23} />
            </button>
            <button className="bg-[#1da1f2] hover:bg-green-400 transition rounded-full p-2 text-white shadow-sm" aria-label="Twitter">
              <FaTwitter size={23} />
            </button>
            <button className="bg-[#0077b5] hover:bg-green-400 transition rounded-full p-2 text-white shadow-sm" aria-label="LinkedIn">
              <FaLinkedinIn size={23} />
            </button>
            <button className="bg-gradient-to-br from-[#F58529] via-[#DD2A7B] to-[#833AB4] hover:bg-green-400 transition rounded-full p-2 text-white shadow-sm" aria-label="Instagram">
              <IoLogoInstagram size={23} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
