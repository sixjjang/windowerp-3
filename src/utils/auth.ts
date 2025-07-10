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

export const API_BASE =
  process.env.NODE_ENV === 'development'
    ? 'http://localhost:4000'
    : process.env.REACT_APP_API_BASE || 'http://sixjjang.synology.me:4000';
export const WS_BASE =
  process.env.NODE_ENV === 'development'
    ? 'ws://localhost:4001'
    : process.env.REACT_APP_WS_BASE || 'ws://sixjjang.synology.me:4001';
