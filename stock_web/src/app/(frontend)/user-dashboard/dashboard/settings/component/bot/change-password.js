import React, { useState } from 'react';
import { FaLock, FaEye, FaEyeSlash, FaTimes } from "react-icons/fa";
import { FiLock } from "react-icons/fi";
import { apiCall } from '@/lib/api.js';
import { BsHouseLock } from "react-icons/bs";
import CryptoJS from 'crypto-js';

export default function ChangePasswordModal({ bot, setBotPasswordChanged, onClose, bannerImg }) {
  const [oldPwd, setOld] = useState('');
  const [newPwd, setNew] = useState('');
  const [confirmPwd, setConfirm] = useState('');
  const [showOld, setShowOld] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handle = async e => {
    e.preventDefault();
    setError('');
    if (CryptoJS.SHA256(oldPwd).toString() !== bot.password) {
      setError('Old password incorrect');
      return;
    }
    if (newPwd.length < 8 ||
      !/[A-Z]/.test(newPwd) ||
      !/[a-z]/.test(newPwd) ||
      !/[0-9]/.test(newPwd) ||
      !/[!@#$%^&*]/.test(newPwd)
    ) {
      setError('New password must be at least 8 characters, with upper/lower/digit/special.');
      return;
    }
    if (newPwd !== confirmPwd) {
      setError('Password confirmation does not match.');
      return;
    }
    setLoading(true);
    try {
      await apiCall('/api/updateBotPassword', 'POST', { bot_id: bot.id, newPassword: newPwd });
      setBotPasswordChanged(true);
      alert('Password changed successfully');
      onClose();
    } catch (err) {
      setError('Failed to change password');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Modal Glass Backdrop */}
      <div className="absolute inset-0 backdrop-blur-lg bg-white/30"></div>
      {/* Modal Box */}
      <div className="relative bg-white rounded-2xl shadow-2xl flex flex-col md:flex-row w-full max-w-4xl">
        {/* Left: Form */}
        <div className="flex-1 p-8">
            <div className="flex items-center mb-6 bg-blue-50 w-15 h-15 px-3 py-3 rounded-full">
                <BsHouseLock size={32} className="text-blue-600 mr-2" />
            </div>
          <div className="items-center mb-5">
            <h2 className="text-xl font-semibold">Change Password</h2>
          </div>
          <p className="text-gray-500 text-sm mb-6">To change your password, please fill in the fields below. <br/>
            Your password must contain at least 8 characters, including an uppercase letter, lowercase letter, a number, and a special character.
          </p>
          <form onSubmit={handle}>
            {/* Field 1 */}
            <div className="relative mb-8">
             <span
                className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-600 cursor-pointer"
                onClick={() => setShowOld(s => !s)}
              >
                <FiLock />
              </span>
              <input
                type={showOld ? "text" : "password"}
                value={oldPwd}
                onChange={e => setOld(e.target.value)}
                className="w-full px-10 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 pr-10"
                placeholder="Current Password"
                required
              />
              <span
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 cursor-pointer"
                onClick={() => setShowOld(s => !s)}
              >
                {showOld ? <FaEye /> : <FaEyeSlash />}
              </span>
            </div>
            {/* Field 2 */}
            <div className="relative mb-8">
                <span
                className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-600 cursor-pointer"
                onClick={() => setShowOld(s => !s)}
              >
                <FiLock />
              </span>
              <input
                type={showNew ? "text" : "password"}
                value={newPwd}
                onChange={e => setNew(e.target.value)}
                className="w-full px-10 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 pr-10"
                placeholder="New Password"
                required
              />
              <span
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 cursor-pointer"
                onClick={() => setShowNew(s => !s)}
              >
                {showNew ? <FaEye /> : <FaEyeSlash />}
              </span>
            </div>
            {/* Field 3 */}
            <div className="relative mb-4">
                <span
                className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-600 cursor-pointer"
                onClick={() => setShowOld(s => !s)}
              >
                <FiLock />
              </span>
              <input
                type={showConfirm ? "text" : "password"}
                value={confirmPwd}
                onChange={e => setConfirm(e.target.value)}
                className="w-full px-10 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 pr-10"
                placeholder="Confirm Password"
                required
              />
              <span
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 cursor-pointer"
                onClick={() => setShowConfirm(s => !s)}
              >
                {showConfirm ? <FaEye /> : <FaEyeSlash />}
              </span>
            </div>
            {error && <div className="text-red-600 text-sm my-2">{error}</div>}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 cursor-pointer mt-6 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg shadow transition"
            >
              {loading ? "Updating..." : "Change Password"}
            </button>
          </form>
        </div>
        {/* Right: Banner/Side Image */}
        <div className="flex-1 bg-gradient-to-tl from-blue-50 via-white to-blue-100 hidden md:flex items-center justify-center rounded-r-2xl relative">
          <img
            src={bannerImg || "/bot/bot-password.png"}
            alt="Trading Bot Banner"
            className="max-h-120 object-contain"
          />
        </div>
        {/* Close Button */}
        <button
          className="absolute top-3 right-3 text-gray-400 hover:text-gray-700 transition"
          onClick={onClose}
        >
          <FaTimes size={22} />
        </button>
      </div>
    </div>
  );
}
