// src/store/index.js
import { configureStore } from '@reduxjs/toolkit';
import { websocketMiddleware } from './middleware/websocket-middleware.js';
import websocketReducer from './slices/websocket-slice.js';
import botsReducer from './slices/bots-slice.js';
import marketDataReducer from './slices/market-data-slice.js';
import notificationsReducer from './slices/notifications-slice.js';
import uiReducer from './slices/ui-slice.js';

export const store = configureStore({
  reducer: {
    websocket: websocketReducer,
    bots: botsReducer,
    marketData: marketDataReducer,
    notifications: notificationsReducer,
    ui: uiReducer
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: [
          'websocket/connectionEstablished',
          'websocket/messageReceived',
          'bots/botUpdated',
          'marketData/priceUpdated',
          'notifications/notificationReceived'
        ],
        ignoredPaths: ['websocket.connections']
      }
    }).concat(websocketMiddleware),
  devTools: process.env.NODE_ENV !== 'production'
});

// For debugging in browser console
// if (typeof window !== 'undefined') {
//   window.store = store;
// }
