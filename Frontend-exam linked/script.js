// API Service Module (api.js)
const API_BASE_URL = 'http://localhost:5432/api';

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
const authAPI = {
  register: (userData) => fetchAPI('/auth/register', 'POST', userData, false),
  login: (credentials) => fetchAPI('/auth/login', 'POST', credentials, false),
  getCurrentUser: () => fetchAPI('/auth/me')
};

// Application functions
const applicationAPI = {
  submit: (roomId) => fetchAPI('/applications', 'POST', { roomId }),
  getMyApplication: () => fetchAPI('/applications/my-application'),
  getAll: () => fetchAPI('/applications'),
  updateStatus: (id, status) => fetchAPI(`/applications/${id}`, 'PUT', { status }),
  delete: (id) => fetchAPI(`/applications/${id}`, 'DELETE')
};

// Room functions
const roomAPI = {
  getAll: () => fetchAPI('/rooms'),
  create: (roomData) => fetchAPI('/rooms', 'POST', roomData),
  delete: (id) => fetchAPI(`/rooms/${id}`, 'DELETE')
};

// Current user reference
let currentUser = null;

// Authentication Functions
async function register() {
  try {
    const name = document.getElementById('name').value;
    const studentId = document.getElementById('studentId').value;
    const email = document.getElementById('regEmail').value;
    const password = document.getElementById('regPassword').value;

    if (!name || !studentId || !email || !password) {
      alert("Please fill in all fields.");
      return;
    }

    const { token, user } = await authAPI.register({ name, studentId, email, password });
    
    localStorage.setItem('token', token);
    currentUser = user;
    alert("Registered successfully!");
    window.location.href = "dashboard.html";
  } catch (error) {
    alert(error.message);
  }
}

async function login() {
  try {
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;

    const { token, user } = await authAPI.login({ email, password });
    
    localStorage.setItem('token', token);
    currentUser = user;
    alert("Login successful!");
    
    if (user.role === 'admin') {
      window.location.href = "admin-applications.html";
    } else {
      try {
        await applicationAPI.getMyApplication();
        window.location.href = "dashboard.html";
      } catch {
        window.location.href = "apply.html";
      }
    }
  } catch (error) {
    alert(error.message);
  }
}

function logout() {
  localStorage.removeItem('token');
  currentUser = null;
  window.location.href = "index.html";
}

function showRegister() {
  document.querySelector('.form-container').style.display = 'none';
  document.getElementById('register-form').classList.remove('hidden');
}

// Room Application System
async function applyForRoom(roomId) {
  try {
    await applicationAPI.submit(roomId);
    alert('Application submitted successfully!');
    window.location.href = "dashboard.html";
  } catch (error) {
    alert(error.message);
  }
}

async function renderRooms() {
  const container = document.getElementById('hostelContainer');
  if (!container) return;
  
  try {
    const rooms = await roomAPI.getAll();
    container.innerHTML = '';
    
    rooms.forEach(room => {
      const card = document.createElement('div');
      card.className = 'room-card';
      card.innerHTML = `
        <img src="${room.imageUrl}" alt="${room.name}" />
        <h3>${room.name}</h3>
        <p>${room.description}</p>
        <p><strong>Type:</strong> ${room.type}</p>
        <p><strong>Occupancy:</strong> ${room.currentOccupancy} / ${room.capacity}</p>
        <button ${room.currentOccupancy >= room.capacity ? 'disabled' : ''} 
                onclick="applyForRoom(${room.id})">
          ${room.currentOccupancy >= room.capacity ? 'Full' : 'Apply for this Room'}
        </button>
      `;
      container.appendChild(card);
    });
  } catch (error) {
    console.error('Error loading rooms:', error);
    container.innerHTML = '<p>Error loading rooms. Please try again later.</p>';
  }
}

// Dashboard Functions
async function renderStudentDashboard() {
  const dashboardName = document.getElementById('dashboardName');
  const dashboardContent = document.getElementById('dashboardContent');
  
  if (!dashboardContent) return;
  
  try {
    const user = await authAPI.getCurrentUser();
    currentUser = user;
    dashboardName.textContent = user.name || user.email;
    
    const application = await applicationAPI.getMyApplication();
    
    let badgeClass = '';
    if (application.status === 'Pending') badgeClass = 'pending';
    else if (application.status === 'Approved') badgeClass = 'approved';
    else badgeClass = 'rejected';
    
    let html = `
      <h3>Application Status</h3>
      <span class="badge ${badgeClass}">${application.status}</span>
    `;
    
    if (application.status === 'Approved') {
      html += `
        <h4>Room Assignment</h4>
        <p><strong>Hostel:</strong> ${application.Room.name}</p>
        <p><strong>Room Type:</strong> ${application.Room.type}</p>
        ${application.roomNumber ? `<p><strong>Room Number:</strong> ${application.roomNumber}</p>` : ''}
      `;
    } else if (application.status === 'Rejected') {
      html += `
        <p>Your application was rejected. You may reapply.</p>
        <a href="apply.html"><button>Reapply</button></a>
      `;
    }
    
    dashboardContent.innerHTML = html;
  } catch (error) {
    dashboardContent.innerHTML = `
      <p>You have not applied for housing yet.</p>
      <a href="apply.html"><button>Apply Now</button></a>
    `;
  }
}

// Admin Application Management
async function renderAdminApplications() {
  const tableBody = document.getElementById('adminApplications');
  const searchInput = document.getElementById('searchInput');
  
  if (!tableBody) return;
  
  try {
    const applications = await applicationAPI.getAll();
    
    tableBody.innerHTML = '';
    applications
      .filter(app => 
        searchInput ? 
        app.User.email.toLowerCase().includes(searchInput.value.toLowerCase()) : 
        true
      )
      .forEach(app => {
        const statusClass = app.status === 'Pending' ? 'pending' :
                          app.status === 'Approved' ? 'approved' : 'rejected';
        
        const row = document.createElement('tr');
        row.innerHTML = `
          <td>${app.User.email}</td>
          <td>${app.Room.name}</td>
          <td>${app.Room.type}</td>
          <td><span class="badge ${statusClass}">${app.status}</span></td>
          <td>
            <button onclick="updateApplicationStatus(${app.id}, 'Approved')">Approve</button>
            <button onclick="updateApplicationStatus(${app.id}, 'Rejected')">Reject</button>
            <button onclick="deleteApplication(${app.id})">Delete</button>
          </td>
        `;
        tableBody.appendChild(row);
      });
  } catch (error) {
    console.error('Error loading applications:', error);
    tableBody.innerHTML = '<tr><td colspan="5">Error loading applications</td></tr>';
  }
}

async function updateApplicationStatus(id, status) {
  try {
    await applicationAPI.updateStatus(id, status);
    alert(`Application ${status.toLowerCase()}`);
    await renderAdminApplications();
  } catch (error) {
    alert(error.message);
  }
}

async function deleteApplication(id) {
  if (!confirm('Are you sure you want to delete this application?')) return;
  
  try {
    await applicationAPI.delete(id);
    alert('Application deleted');
    await renderAdminApplications();
  } catch (error) {
    alert(error.message);
  }
}

// Admin Room Management
async function renderAdminRooms() {
  const container = document.getElementById('hostelList');
  if (!container) return;
  
  try {
    const rooms = await roomAPI.getAll();
    container.innerHTML = '';
    
    rooms.forEach(room => {
      const card = document.createElement('div');
      card.className = 'room-card';
      card.innerHTML = `
        <img src="${room.imageUrl}" alt="${room.name}" />
        <h3>${room.name}</h3>
        <p>${room.description}</p>
        <p><strong>Type:</strong> ${room.type}</p>
        <p><strong>Capacity:</strong> ${room.currentOccupancy} / ${room.capacity}</p>
        <button onclick="deleteRoom(${room.id})">Delete</button>
      `;
      container.appendChild(card);
    });
  } catch (error) {
    console.error('Error loading rooms:', error);
    container.innerHTML = '<p>Error loading rooms. Please try again later.</p>';
  }
}

async function addNewRoom(event) {
  event.preventDefault();
  
  try {
    const name = document.getElementById('hostelName').value;
    const description = document.getElementById('hostelDesc').value;
    const imageUrl = document.getElementById('hostelImage').value;
    const type = document.getElementById('hostelType').value;
    const capacity = parseInt(document.getElementById('hostelCap').value);
    
    await roomAPI.create({ name, description, imageUrl, type, capacity });
    alert('Room added successfully!');
    event.target.reset();
    await renderAdminRooms();
  } catch (error) {
    alert(error.message);
  }
}

async function deleteRoom(id) {
  if (!confirm('Are you sure you want to delete this room?')) return;
  
  try {
    await roomAPI.delete(id);
    alert('Room deleted');
    await renderAdminRooms();
  } catch (error) {
    alert(error.message);
  }
}

// Initialize the application
document.addEventListener('DOMContentLoaded', async () => {
  try {
    // Load current user if token exists
    if (localStorage.getItem('token')) {
      try {
        currentUser = await authAPI.getCurrentUser();
        updateUserInfo();
      } catch (error) {
        console.log('Session expired, logging out');
        logout();
      }
    }
    
    // Initialize appropriate page
    if (document.getElementById('hostelContainer')) {
      await renderRooms();
    }
    
    if (document.getElementById('dashboardContent')) {
      await renderStudentDashboard();
    }
    
    if (document.getElementById('adminApplications')) {
      await renderAdminApplications();
    }
    
    if (document.getElementById('hostelList')) {
      await renderAdminRooms();
    }
    
    // Setup form handlers
    const hostelForm = document.getElementById('hostelForm');
    if (hostelForm) {
      hostelForm.addEventListener('submit', addNewRoom);
    }
    
    const searchInput = document.getElementById('searchInput');
    if (searchInput) {
      searchInput.addEventListener('input', renderAdminApplications);
    }
    
    // Hide register form by default
    const regForm = document.getElementById('register-form');
    if (regForm) {
      regForm.classList.add('hidden');
    }
  } catch (error) {
    console.error('Initialization error:', error);
  }
});

function updateUserInfo() {
  const userInfoSpan = document.getElementById('currentUserInfo');
  if (userInfoSpan && currentUser) {
    userInfoSpan.textContent = `Logged in as: ${currentUser.role === 'admin' ? 'Admin' : currentUser.email}`;
  }
}

// Expose functions to global scope
window.logout = logout;
window.register = register;
window.login = login;
window.showRegister = showRegister;
window.applyForRoom = applyForRoom;
window.updateApplicationStatus = updateApplicationStatus;
window.deleteApplication = deleteApplication;
window.deleteRoom = deleteRoom;