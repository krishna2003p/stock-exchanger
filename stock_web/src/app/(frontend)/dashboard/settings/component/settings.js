"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { IoCameraOutline } from "react-icons/io5";
import { FaUser as UserIcon } from "react-icons/fa";
import { FaLock as LockIcon } from "react-icons/fa";
import { FaBell as BellIcon } from "react-icons/fa";
import { FaPalette as AppearanceIcon } from "react-icons/fa";
import { FaChartLine as TradingIcon } from "react-icons/fa";
import { FaRobot as BotsIcon } from "react-icons/fa";
import { FaUserSecret as PrivacyIcon } from "react-icons/fa";
import { FaDatabase as DataIcon } from "react-icons/fa";
import { FaPlug as ConnectionsIcon } from "react-icons/fa";
import Sidebar from "@/app/(frontend)/components/account/SideBar";
import Navbar from "@/app/(frontend)/components/account/NavBar";
import SettingSidebar from "./sidebar";
// import { cookies } from "next/headers";

function getCookie(name) {
  if (typeof window === "undefined") return "";
  const cookies = document.cookie;
  console.log("Current cookies:", cookies);
  const value = `; ${cookies}`;
  const parts = value.split(`; ${name}=`);
  if (parts.length === 2) {
    const result = parts.pop().split(";").shift();
    console.log(`Cookie ${name} found:`, result);
    return result;
  }
  console.log(`Cookie ${name} not found`);
  return "";
}

export default function SettingsPage() {
  // Avatar and form states
  const [avatarUrl, setAvatarUrl] = useState("");
  const fileRef = useRef(null);
  const [loading, setLoading] = useState(false);
  // const Cookies =  cookies();
  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    location: "",
    website: "",
    bio: "",
    company: "",
    position: "",
    facebook: "",
    twitter: "",
    linkedin: "",
    instagram: "",
    github: "",
    telegram: "",
  });
  const [errors, setErrors] = useState({ phone: "" });

  const token = getCookie("token"); // Adjust cookie name if needed
  console.log("Token:", token);

  useEffect(() => {
    // Fetch user details on load
    async function fetchDetails() {
      if (!token) return;
      try {
        const res = await fetch("/api/getUserDetails", {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!res.ok) throw new Error("Failed to fetch user details");
        const data = await res.json();
        // Map API response to form fields here
        setForm({
          firstName: data.firstName || "",
          lastName: data.lastName || "",
          email: data.email || "",
          phone: data.mobile || "",
          location: data.location || "",
          website: data.website || "",
          bio: data.bio || "",
          company: data.company || "",
          position: data.position || "",
          facebook: data.facebook || "",
          twitter: data.twitter || "",
          linkedin: data.linkedin || "",
          instagram: data.instagram || "",
          github: data.github || "",
          telegram: data.telegram || "",
        });
        if (data.profile_img) {
          setAvatarUrl(data.profile_img); // Assume this is full URL or public path
        }
      } catch (err) {
        console.error(err);
      }
    }
    fetchDetails();
  }, [token]);

  const onPickFile = () => fileRef.current?.click();

  const onFileChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setLoading(true);
    try {
      const formData = new FormData();
      formData.append("profile_img", file);

      const res = await fetch("/api/updateProfileImage", {
        method: "POST",
        body: formData,
        headers: { Authorization: `Bearer ${token}` },
      });

      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Upload failed");

      setAvatarUrl(json.user?.profile_img || URL.createObjectURL(file));
      alert("Profile image updated");
    } catch (err) {
      alert("Image upload error: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  const removeAvatar = () => {
    setAvatarUrl("");
    if (fileRef.current) fileRef.current.value = "";
  };

  const onChange = (e) => {
    const { name, value } = e.target;
    setForm((p) => ({ ...p, [name]: value }));
  };

  const validate = () => {
    const phoneOk = /^\+?[0-9()\-\s]+$/.test(form.phone);
    setErrors({ phone: phoneOk ? "" : "Please enter a valid phone number" });
    return phoneOk;
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;
    try {
      const res = await fetch("/api/updateUserDetails", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          name: `${form.firstName} ${form.lastName}`,
          email: form.email,
          mobile: form.phone,
          location: form.location,
          bio: form.bio,
          company: form.company,
          website: form.website,
          facebook: form.facebook,
          twitter: form.twitter,
          linkedin: form.linkedin,
          instagram: form.instagram,
          github: form.github,
          telegram: form.telegram,
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Update failed");
      alert("Profile updated successfully");
    } catch (err) {
      alert("Update error: " + err.message);
    }
  };

  return (
    <div className="min-h-screen bg-[#fafafa]">
      <div className="mx-18 p-6">
        <div className="grid grid-cols-12 gap-6">
          {/* Sidebar omitted for brevity */}
          <SettingSidebar />

          {/* Content */}
          <section className="col-span-12 md:col-span-9">
            {/* Profile Picture */}
            <div className="bg-white border rounded-xl p-6 mb-6">
              <h3 className="text-lg font-semibold mb-1">Profile Picture</h3>
              <p className="text-sm text-gray-500 mb-5">
                Upload a profile picture to personalize your account
              </p>

              <div className="flex items-center gap-6">
                <div
                  className="w-20 h-20 rounded-full bg-gray-100 border flex items-center justify-center overflow-hidden cursor-pointer"
                  onClick={onPickFile}
                >
                  {loading ? (
                    <span className="text-gray-400">Uploading...</span>
                  ) : avatarUrl ? (
                    <img src={avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
                  ) : (
                    <IoCameraOutline className="text-gray-400" size={26} />
                  )}
                </div>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={onPickFile}
                    className="px-3 py-2 text-sm bg-gray-100 border rounded-lg hover:bg-gray-200"
                    disabled={loading}
                  >
                    Change
                  </button>
                  <button
                    type="button"
                    onClick={removeAvatar}
                    className="px-3 py-2 text-sm bg-gray-100 border rounded-lg hover:bg-gray-200"
                    disabled={loading || !avatarUrl}
                  >
                    Remove
                  </button>
                  <input
                    ref={fileRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={onFileChange}
                    aria-label="Upload profile picture"
                  />
                </div>
              </div>
              <p className="mt-3 text-xs text-gray-500">JPG, PNG or GIF, Max size 5MB.</p>
            </div>

            {/* Personal Information */}
            <div className="bg-white border rounded-xl p-6 mb-6">
              <h3 className="text-lg font-semibold mb-1">Personal Information</h3>
              <p className="text-sm text-gray-500 mb-5">
                Update your personal details and contact information
              </p>

              <form onSubmit={onSubmit} className="space-y-5">
                {/* Personal info grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Field id="firstName" label="First Name" value={form.firstName} onChange={onChange} name="firstName" />
                  <Field id="phone" label="Phone Number" value={form.phone} onChange={onChange} name="phone" error={errors.phone} describedBy="phoneHelp phoneError" help="Use international format when possible" />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Field id="email" label="Email Address" type="email" value={form.email} onChange={onChange} name="email" />
                  <Field id="location" label="Location" value={form.location} onChange={onChange} name="location" />
                </div>

                <div>
                  <label htmlFor="bio" className="block text-sm font-medium mb-1">Bio</label>
                  <textarea id="bio" name="bio" rows={3} value={form.bio} onChange={onChange} className="w-full rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </div>

                {/* Professional Information */}
                <div className="bg-[#fafafa] -mx-6 h-px my-2" />
                <h3 className="text-lg font-semibold">Professional Information</h3>
                <p className="text-sm text-gray-500 mb-2">Add your professional background and trading experience</p>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Field id="company" label="Company" value={form.company} onChange={onChange} name="company" />
                  <Field id="position" label="Position" value={form.position} onChange={onChange} name="position" />
                </div>

                {/* Social Media Section */}
                <div className="bg-[#fafafa] -mx-6 h-px my-2" />
                <h3 className="text-lg font-semibold">Social Media</h3>
                <p className="text-sm text-gray-500 mb-2">Add your social media links</p>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Field id="facebook" label="Facebook" type="url" value={form.facebook} onChange={onChange} name="facebook" />
                  <Field id="twitter" label="Twitter" type="url" value={form.twitter} onChange={onChange} name="twitter" />
                  <Field id="linkedin" label="LinkedIn" type="url" value={form.linkedin} onChange={onChange} name="linkedin" />
                  <Field id="instagram" label="Instagram" type="url" value={form.instagram} onChange={onChange} name="instagram" />
                  <Field id="github" label="Github" type="url" value={form.github} onChange={onChange} name="github" />
                  <Field id="telegram" label="Telegram" type="url" value={form.telegram} onChange={onChange} name="telegram" />
                </div>

                <div className="flex justify-end pt-2">
                  <button type="submit" className="px-4 py-2 rounded-lg bg-black text-white text-sm hover:bg-gray-800">
                    Save Changes
                  </button>
                </div>
              </form>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}

function Field({ id, label, type = "text", value, onChange, name, error, help, describedBy }) {
  const helpId = help ? `${id}-help` : undefined;
  const errorId = error ? `${id}-error` : undefined;
  const ariaDescribedBy = describedBy || [helpId, errorId].filter(Boolean).join(" ") || undefined;

  return (
    <div>
      <label htmlFor={id} className="block text-sm font-medium mb-1">
        {label}
      </label>
      <input
        id={id}
        name={name}
        type={type}
        value={value}
        onChange={onChange}
        aria-describedby={ariaDescribedBy}
        className={`w-full rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-2 ${
          error ? "border-red-300 focus:ring-red-500" : "focus:ring-blue-500"
        }`}
      />
      {help && (
        <p id={`${id}-help`} className="mt-1 text-xs text-gray-500">
          {help}
        </p>
      )}
      {error && (
        <p id={`${id}-error`} className="mt-1 text-xs text-red-600">
          {error}
        </p>
      )}
    </div>
  );
}
