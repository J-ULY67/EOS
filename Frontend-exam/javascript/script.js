let users = JSON.parse(localStorage.getItem("users")) || [];
let applications = JSON.parse(localStorage.getItem("applications")) || [];
let assignedRooms = JSON.parse(localStorage.getItem("assignedRooms")) || {};
let hostelRooms = JSON.parse(localStorage.getItem("hostelRooms")) || [];

// Seed admin
if (!users.find(u => u.email === "admin")) {
  users.push({ name: "Administrator", studentId: "0000", email: "admin", password: "admin", role: "admin" });
  localStorage.setItem("users", JSON.stringify(users));
}

// Register user
function register() {
  const name = document.getElementById('name').value;
  const studentId = document.getElementById('studentId').value;
  const email = document.getElementById('regEmail').value;
  const password = document.getElementById('regPassword').value;

  const newUser = { name, studentId, email, password };
  users.push(newUser);
  localStorage.setItem("users", JSON.stringify(users));
  localStorage.setItem("currentUser", JSON.stringify(newUser));
  alert("Registered successfully!");
  window.location.href = "apply.html";
}

// Login
function login() {
  const email = document.getElementById('email').value;
  const pass = document.getElementById('password').value;

  const user = users.find(u => u.email === email && u.password === pass);
  if (user) {
    localStorage.setItem("currentUser", JSON.stringify(user));
    alert("Login successful!");
    if (user.email === "admin") {
      window.location.href = "admin-applications.html";
    } else {
      const hasApplied = applications.some(app => app.userEmail === user.email);
      window.location.href = hasApplied ? "dashboard.html" : "apply.html";
    }
  } else {
    alert("Invalid credentials.");
  }
}

// Logout
function logout() {
  localStorage.removeItem("currentUser");
  window.location.href = "index.html";
}

// Room selection on apply.html
const container = document.getElementById("hostelContainer");
if (container) {
  container.innerHTML = "";
  hostelRooms.forEach((room, index) => {
    const used = applications.filter(app => app.hostel === room.name && app.status === "Approved").length;
    const isFull = used >= room.capacity;

    const card = document.createElement("div");
    card.className = "room-card";
    card.innerHTML = `
      <img src="${room.image}" alt="${room.name}" />
      <h3>${room.name}</h3>
      <p>${room.description}</p>
      <p><strong>Type:</strong> ${room.type}</p>
      <p><strong>Occupancy:</strong> ${used} / ${room.capacity}</p>
      <button ${isFull ? "disabled" : ""} onclick="applyForRoom(${index})">
        ${isFull ? "Full" : "Apply for this Room"}
      </button>
    `;
    container.appendChild(card);
  });
}

// Apply by selecting a room
function applyForRoom(index) {
  const user = JSON.parse(localStorage.getItem("currentUser"));
  const selectedRoom = hostelRooms[index];

  const used = applications.filter(app => app.hostel === selectedRoom.name && app.status === "Approved").length;
  if (used >= selectedRoom.capacity) {
    alert("Sorry, this room is full.");
    return;
  }

  applications = applications.filter(app => app.userEmail !== user.email);

  const newApp = {
    userEmail: user.email,
    hostel: selectedRoom.name,
    type: selectedRoom.type,
    status: "Pending"
  };

  applications.push(newApp);
  localStorage.setItem("applications", JSON.stringify(applications));

  alert(`Application submitted for ${selectedRoom.name}`);
  window.location.href = "dashboard.html";
}

// Student dashboard rendering
function renderStudentDashboard() {
  const dashboardName = document.getElementById("dashboardName");
  const dashboardContent = document.getElementById("dashboardContent");
  const user = JSON.parse(localStorage.getItem("currentUser"));

  if (!dashboardContent || !user) return;

  dashboardName.textContent = user.email;

  const userApp = applications.find(app => app.userEmail === user.email);

  if (!userApp) {
    dashboardContent.innerHTML = `
      <p>You have not applied for housing yet.</p>
      <a href="apply.html"><button>Apply Now</button></a>
    `;
    return;
  }

  let badgeClass = "";
  if (userApp.status === "Pending") badgeClass = "pending";
  else if (userApp.status === "Approved") badgeClass = "approved";
  else badgeClass = "rejected";

  let html = `
    <h3>Application Status</h3>
    <span class="badge ${badgeClass}">${userApp.status}</span>
  `;

  if (userApp.status === "Approved") {
    html += `
      <h4>Room Assignment</h4>
      <p><strong>Hostel:</strong> ${userApp.hostel}</p>
      <p><strong>Room Type:</strong> ${userApp.type}</p>
    `;
  } else if (userApp.status === "Rejected") {
    html += `
      <p>Your application was rejected. You may reapply.</p>
      <a href="apply.html"><button>Reapply</button></a>
    `;
  }

  dashboardContent.innerHTML = html;
}

// Render on dashboard page load
if (document.getElementById("dashboardContent")) {
  renderStudentDashboard();
}

// Admin dashboard: application list
function renderAdminApplications() {
  const tableBody = document.getElementById('adminApplications');
  const search = document.getElementById('searchInput')?.value.toLowerCase() || '';
  if (!tableBody) return;

  tableBody.innerHTML = "";
  applications
    .filter(app => app.userEmail.toLowerCase().includes(search))
    .forEach((app, index) => {
      const row = document.createElement('tr');

      const statusClass = app.status === 'Pending' ? 'pending' :
                          app.status === 'Approved' ? 'approved' : 'rejected';

      row.innerHTML = `
        <td>${app.userEmail}</td>
        <td>${app.hostel}</td>
        <td>${app.type}</td>
        <td><span class="badge ${statusClass}">${app.status}</span></td>
        <td>
          <button onclick="approveApp(${index})">Approve</button>
          <button onclick="rejectApp(${index})">Reject</button>
          <button onclick="confirmDelete(${index})">Delete</button>
        </td>
      `;
      tableBody.appendChild(row);
    });
}

// Add confirm on delete
function confirmDelete(index) {
  const sure = confirm("Are you sure you want to delete this application?");
  if (sure) deleteApp(index);
}

// Filter applications on input
function filterApplications() {
  renderAdminApplications();
}

// Re-render on page load if on admin-applications.html
if (document.getElementById('adminApplications')) {
  renderAdminApplications();
}

// Approve application
function approveApp(index) {
  applications[index].status = "Approved";
  assignedRooms[applications[index].userEmail] = `${applications[index].hostel} - Room 101`;
  localStorage.setItem("applications", JSON.stringify(applications));
  localStorage.setItem("assignedRooms", JSON.stringify(assignedRooms));
  alert("Application approved.");
  location.reload();
}

// Reject application
function rejectApp(index) {
  applications[index].status = "Rejected";
  localStorage.setItem("applications", JSON.stringify(applications));
  alert("Application rejected.");
  location.reload();
}

// Delete application
function deleteApp(index) {
  applications.splice(index, 1);
  localStorage.setItem("applications", JSON.stringify(applications));
  alert("Application removed.");
  location.reload();
}

// Admin hostel management
const hostelForm = document.getElementById('hostelForm');
if (hostelForm) {
  hostelForm.addEventListener('submit', (e) => {
    e.preventDefault();

    const newHostel = {
      id: Date.now(),
      name: document.getElementById('hostelName').value,
      description: document.getElementById('hostelDesc').value,
      image: document.getElementById('hostelImage').value,
      type: document.getElementById('hostelType').value,
      capacity: parseInt(document.getElementById('hostelCap').value)
    };

    hostelRooms.push(newHostel);
    localStorage.setItem("hostelRooms", JSON.stringify(hostelRooms));
    alert("Hostel added!");
    renderHostels();
    hostelForm.reset();
  });
}

// Render hostels on admin page
function renderHostels() {
  const container = document.getElementById("hostelList");
  if (!container) return;
  container.innerHTML = "";

  hostelRooms.forEach(room => {
    const used = applications.filter(app => app.hostel === room.name && app.status === "Approved").length;
    const card = document.createElement("div");
    card.className = "room-card";
    card.innerHTML = `
      <img src="${room.image}" alt="${room.name}" />
      <h3>${room.name}</h3>
      <p>${room.description}</p>
      <p><strong>Type:</strong> ${room.type}</p>
      <p><strong>Capacity:</strong> ${used} / ${room.capacity}</p>
      <button onclick="deleteHostel(${room.id})">Delete</button>
    `;
    container.appendChild(card);
  });
}

// Delete hostel
function deleteHostel(id) {
  hostelRooms = hostelRooms.filter(h => h.id !== id);
  localStorage.setItem("hostelRooms", JSON.stringify(hostelRooms));
  renderHostels();
}

// Auto render hostels on admin page load
if (document.getElementById("hostelList")) {
  renderHostels();
}
// Display current user in nav
const userInfoSpan = document.getElementById("currentUserInfo");
const user = JSON.parse(localStorage.getItem("currentUser"));
if (userInfoSpan && user) {
  userInfoSpan.textContent = `Logged in as: ${user.email === "admin" ? "Admin" : user.email}`;
}
