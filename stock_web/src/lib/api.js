// src/lib/api.js
export const apiCall = async (endpoint, method = 'GET', data = null) => {
  const config = {
    method,
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' }
  };
  if (data) config.body = JSON.stringify(data);

  const response = await fetch(endpoint, config);
  const result = await response.json();
  if (!response.ok) {
    throw new Error(result.error || `Request failed with status ${response.status}`);
  }
  return result;
};
