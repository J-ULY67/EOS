const API_BASE_URL = 'http://localhost:5432/api'; // Update if your backend is hosted elsewhere

// Helper function for API calls
async function fetchAPI(endpoint, method = 'GET', body = null, requiresAuth = true) {
  const headers = {
    'Content-Type': 'application/json'
  };
  
  if (requiresAuth) {
    const token = localStorage.getItem('token');
    if (!token) throw new Error('Authentication required');
    headers['Authorization'] = `Bearer ${token}`;
  }
  
  const config = {
    method,
    headers
  };
  
  if (body) config.body = JSON.stringify(body);
  
  const response = await fetch(`${API_BASE_URL}${endpoint}`, config);
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Something went wrong');
  }
  
  return response.json();
}

// Auth functions
export const authAPI = {
  register: (userData) => fetchAPI('/auth/register', 'POST', userData, false),
  login: (credentials) => fetchAPI('/auth/login', 'POST', credentials, false),
  getCurrentUser: () => fetchAPI('/auth/me')
};

// Application functions
export const applicationAPI = {
  submit: (roomId) => fetchAPI('/applications', 'POST', { roomId }),
  getMyApplication: () => fetchAPI('/applications/my-application'),
  getAll: () => fetchAPI('/applications'),
  updateStatus: (id, status) => fetchAPI(`/applications/${id}`, 'PUT', { status }),
  delete: (id) => fetchAPI(`/applications/${id}`, 'DELETE')
};

// Room functions
export const roomAPI = {
  getAll: () => fetchAPI('/rooms'),
  create: (roomData) => fetchAPI('/rooms', 'POST', roomData),
  delete: (id) => fetchAPI(`/rooms/${id}`, 'DELETE')
};