/*
 * CommonService.js
 * This file contains common service functions for the ICICI integration.
 */

// app/(backend)/ICICI/services/CommonService.js
import axios from 'axios';
import crypto from 'crypto';

// Environment variables
const API_BASE_URL  = process.env.VENDOR_API_URL;           // e.g. https://api.icicidirect.com/breezeapi/api/v1
const APP_KEY       = process.env.VENDOR_API_KEY;
const SECRET_KEY    = process.env.VENDOR_API_SECRET;
// This is the short-lived login "session_key" used only to fetch a session_token via customerdetails
const LOGIN_SESSION_KEY = process.env.VENDOR_SESSION_TOKEN;

// Axios instance
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: { 'Content-Type': 'application/json' },
  timeout: 15000,
});

// Breeze timestamp: YYYY-MM-DDTHH:mm:ss.000Z (UTC)
function breezeTimestamp() {
  const iso = new Date().toISOString();
  return iso.slice(0, 19) + '.000Z';
}

// Compute SHA256(TimeStamp + JSON + SecretKey) => hex
function computeChecksum(timestamp, jsonString) {
  return crypto.createHash('sha256')
    .update(timestamp + jsonString + SECRET_KEY, 'utf8')
    .digest('hex');
}

// Build signed headers for Breeze
function buildSignedHeaders(payloadString, timestamp, sessionToken) {
  const checksum = computeChecksum(timestamp, payloadString);
  return {
    'Content-Type': 'application/json',
    'X-Checksum': 'token ' + checksum,
    'X-Timestamp': timestamp,
    'X-AppKey': APP_KEY,
    'X-SessionToken': sessionToken,
  };
}

// Step 1: fetch session_token using customerdetails (UNSIGNED, GET with JSON body)
export async function fetchSessionToken(loginSessionKey = LOGIN_SESSION_KEY) {
  const url = '/customerdetails';
  const body = { SessionToken: loginSessionKey, AppKey: APP_KEY };
  const payload = JSON.stringify(body);
  const headers = { 'Content-Type': 'application/json' };

  const res = await api.request({
    method: 'get',
    url,
    headers,
    data: payload, // Breeze GET expects JSON body here
  });

  const sessionToken = res?.data?.Success?.session_token;
  if (!sessionToken) {
    throw new Error('Failed to obtain Breeze session_token from customerdetails');
  }
  return sessionToken;
}

// Signed GET with JSON body
export async function breezeGet(endpoint, body = {}, opts = {}) {
  const { sessionToken: externalSessionToken } = opts || {};
  const sessionToken = externalSessionToken || await fetchSessionToken();

  const url = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
  const payload = JSON.stringify(body); // hash exactly what is sent
  const ts = breezeTimestamp();
  const headers = buildSignedHeaders(payload, ts, sessionToken);

  const res = await api.request({ method: 'get', url, headers, data: payload });
  return res.data;
}

// Signed POST with JSON body
export async function breezePost(endpoint, body = {}, opts = {}) {
  const { sessionToken: externalSessionToken } = opts || {};
  const sessionToken = externalSessionToken || await fetchSessionToken();

  const url = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
  const payload = JSON.stringify(body);
  const ts = breezeTimestamp();
  const headers = buildSignedHeaders(payload, ts, sessionToken);

  const res = await api.request({ method: 'post', url, headers, data: payload });
  return res.data;
}

// Optional: expose low-level helpers if needed elsewhere
export const BreezeHelpers = {
  api,
  breezeTimestamp,
  computeChecksum,
  buildSignedHeaders,
};
