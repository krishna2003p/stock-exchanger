// src/components/BotList.js
'use client';
import React, { useState, Fragment } from 'react';
import ChangePasswordModal from './change-password.js';
import { Disclosure, Transition } from '@headlessui/react';
import { RiInformation2Fill } from "react-icons/ri";
import { FaCog } from "react-icons/fa";
import { FaKey } from "react-icons/fa";
import { SiSemanticscholar } from "react-icons/si";
import { FaArrowTrendUp } from "react-icons/fa6";
import { FaArrowTrendDown } from "react-icons/fa6";

export default function BotList( { bots, onSelectBot, loading, error, setBotPasswordChanged } ) {

  const [changePwdBot, setChangePwdBot] = useState(null);

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="animate-spin h-12 w-12 border-4 border-blue-600 border-t-transparent rounded-full"></div>
    </div>
  );
  if (error) return (
    <div className="text-center text-red-600 py-8">{error}</div>
  );

  return (
    <div className='max-w-6xl mx-auto py-6 border text-black border-gray-300 rounded-md'>
        <div className="max-w-5xl mx-auto my-4 px-6 py-6 bg-gray-50 mb-6 rounded-lg border border-gray-300">
        <h4 className="text-xl font-bold text-gray-800 mb-2">🤖 Grow Your Wealth on Autopilot with Smarter Trading Automation</h4>
        <p className="text-gray-600">Explore our curated selection of trading bots, each designed with unique strategies to help you maximize returns while managing risk effectively. Whether you&apos;re looking for steady growth or aggressive gains, our bots offer diverse approaches to suit your investment style. Dive in and find the perfect bot to elevate your trading game!</p>
        </div>


    <div className="max-w-5xl mx-auto mt-8 py-4 px-4 rounded-xl border border-gray-300 shadow-sm">
        <div className="flex items-center justify-between px-4 py-5 mb-2 font-semibold text-gray-700 text-sm bg-gray-50 rounded-t-xl">
        <div className=''>Sr No.</div>
        <div className=''>Status</div>
        <div className='w-50 pl-15'>Name</div>
        <div className='pl-15'>Price</div>
        <div> Return (Year)</div>
        <div>Risk</div>
        <div className='w-40 '></div>
        </div>
      {bots.map((bot, idx) => (

        <div 
          key={bot.id}
          className="flex items-center justify-between p-4 bg-white rounded-xl hover:bg-gray-50 transition group shadow "
        >
            {/* Sr No. */}
            <div className="w-10 text-xl text-blue-500"><SiSemanticscholar /></div>

          {/* Status */}
          <div className="w-20 flex text-left items-center space-x-3">
            <span className={`h-3 w-3 rounded-full ${bot.status == 'Active' ? 'bg-green-500' : 'bg-gray-300'}`}></span>
            <span className={`text-sm font-medium ${bot.status == 'Active' ? 'text-green-600' : 'text-gray-500'}`}>
              {bot.status || 'Inactive'}
            </span>
          </div>

          {/* Name & domain */}
          <div className="w-50">
            <div className="text-sm font-semibold">{bot.name || 'Unnamed Bot'}</div>
          </div>

          {/* Price */}
          <div className="">
            <div className="text-sm font-medium">₹{bot.price || 1500}</div>
            <div className="text-xs text-gray-500">Yearly</div>
          </div>

           {/* Return */}
        <div className="text-center">
          <span className="text-base font-semibold text-green-600">{bot.returns || '30'}% <FaArrowTrendUp className="inline-block text-green-600" /></span>
        </div>

         {/* Strategy type */}
        <div className="text-right">
          <span className="text-red-700 font-semibold ">{bot.risk || '20'}% <FaArrowTrendDown className="inline-block text-red-700" /></span>
        </div>

          {/* Actions */}
          <div className="w-32 flex items-center space-x-4 pl-4">
            {/* Info Tooltip */}
            <Disclosure>
              {({ open }) => (
                <div className="relative">
                  <Disclosure.Button className="p-1 hover:bg-gray-200 rounded-full">
                    <RiInformation2Fill className="h-5 w-5 text-gray-600" />
                  </Disclosure.Button>
                  <Transition
                    as={Fragment}
                    enter="transition ease-out duration-200"
                    enterFrom="opacity-0 -translate-y-2"
                    enterTo="opacity-100 translate-y-0"
                    leave="transition ease-in duration-150"
                    leaveFrom="opacity-100 translate-y-0"
                    leaveTo="opacity-0 -translate-y-2"
                  >
                    <Disclosure.Panel className="absolute right-0 mt-2 w-64 bg-white border rounded shadow-lg p-3 text-xs text-gray-700 z-10">
                      {bot.intro || 'No additional information available.'}
                    </Disclosure.Panel>
                  </Transition>
                </div>
              )}
            </Disclosure>

            {/* Change Password */}
            <button
              onClick={() => setChangePwdBot(bot)}
              className="p-1 hover:bg-gray-200 rounded-full"
            >
              <FaKey className="h-5 w-5 text-gray-600" />
            </button>

            {/* Settings */}
            <button
              onClick={() => onSelectBot(bot.id)}
              className="p-1 hover:bg-gray-200 rounded-full"
            >
              <FaCog className="h-5 w-5 text-gray-600" />
            </button>
          </div>
        </div>
      ))}
      {/* Change Password Modal */}
      {changePwdBot && (
        <ChangePasswordModal 
          bot={changePwdBot}
          setBotPasswordChanged={setBotPasswordChanged}
          onClose={() => setChangePwdBot(null)}
        />
      )}
    </div>
    </div>

  );
}
