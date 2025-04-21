require('dotenv').config();
const express = require('express');
const cors = require('cors');
const sequelize = require('./config/db');
const authRoutes = require('./routes/authRoutes');
const applicationRoutes = require('./routes/applicationRoutes');
const roomRoutes = require('./routes/roomRoutes');

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/applications', applicationRoutes);
app.use('/api/rooms', roomRoutes);

// Database connection and server start
const PORT = process.env.PORT || 5432;

sequelize.sync({ force: false }).then(() => {
  console.log('Database connected');
  
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
    
    // Create admin user if not exists
    const { User } = require('./models');
    User.findOrCreate({
      where: { email: 'admin@admin.com' },
      defaults: {
        name: 'Admin',
        studentId: '0000',
        email: 'admin@admin.com',
        password: 'admin123',
        role: 'admin'
      }
    });
  });
}).catch(err => {
  console.error('Unable to connect to the database:', err);
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ message: 'Something went wrong!' });
});