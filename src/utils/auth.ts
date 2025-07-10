export const getAuthHeaders = () => {
  const token = localStorage.getItem('token');
  const headers: { [key: string]: string } = {
    'Content-Type': 'application/json',
  };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  return headers;
};

export const API_BASE = 'https://us-central1-windowerp-3.cloudfunctions.net';
export const WS_BASE = 'wss://us-central1-windowerp-3.cloudfunctions.net';
