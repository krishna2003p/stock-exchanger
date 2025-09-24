// src/app/layout.js
'use client';

// import { Provider } from 'react-redux';
// import { store } from '../store/index.js';
// import { WebSocketConnectionManager } from '../components/websocket-connection-manager.js';
import { useEffect } from 'react';
import './globals.css';

export default function RootLayout({ children }) {
  // Initialize theme on client side
  useEffect(() => {
    // Check for saved theme or default to light
    const savedTheme = localStorage.getItem('theme') || 'light';
    document.documentElement.classList.toggle('dark', savedTheme === 'dark');
  }, []);

  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <title>Trading Platform</title>
        <meta name="description" content="Real-time trading platform with WebSocket integration" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
      </head>
      <body className="bg-gray-100 text-gray-900 antialiased">
        {/* <Provider store={store}>
          <WebSocketConnectionManager> */}
            <main className="min-h-screen">
              {children}
            </main>
          {/* </WebSocketConnectionManager>
        </Provider> */}
      </body>
    </html>
  );
}
