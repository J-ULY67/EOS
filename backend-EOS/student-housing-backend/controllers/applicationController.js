const { Application, User, Room } = require('../models');

// Submit an application
exports.submitApplication = async (req, res) => {
  try {
    const { roomId } = req.body;
    const userId = req.user.id;
    
    // Check if room exists and has capacity
    const room = await Room.findByPk(roomId);
    if (!room) {
      return res.status(404).json({ message: 'Room not found' });
    }
    
    if (room.currentOccupancy >= room.capacity) {
      return res.status(400).json({ message: 'Room is full' });
    }
    
    // Check if user already has an application
    const existingApplication = await Application.findOne({ 
      where: { userId },
      include: [Room]
    });
    
    if (existingApplication) {
      return res.status(400).json({ 
        message: 'You already have an application',
        application: existingApplication
      });
    }
    
    // Create new application
    const application = await Application.create({
      userId,
      roomId,
      status: 'Pending'
    });
    
    res.status(201).json(application);
  } catch (error) {
    res.status(500).json({ message: 'Error submitting application', error: error.message });
  }
};

// Get user's application status
exports.getUserApplication = async (req, res) => {
  try {
    const application = await Application.findOne({ 
      where: { userId: req.user.id },
      include: [Room]
    });
    
    if (!application) {
      return res.status(404).json({ message: 'No application found' });
    }
    
    res.json(application);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching application', error: error.message });
  }
};

// Admin: Get all applications
exports.getAllApplications = async (req, res) => {
  try {
    const applications = await Application.findAll({
      include: [
        { model: User, attributes: ['id', 'name', 'email', 'studentId'] },
        { model: Room, attributes: ['id', 'name', 'type'] }
      ]
    });
    
    res.json(applications);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching applications', error: error.message });
  }
};

// Admin: Update application status
exports.updateApplicationStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, roomNumber } = req.body;
    
    const application = await Application.findByPk(id, {
      include: [Room]
    });
    
    if (!application) {
      return res.status(404).json({ message: 'Application not found' });
    }
    
    // If approving, check room capacity
    if (status === 'Approved') {
      const room = await Room.findByPk(application.roomId);
      if (room.currentOccupancy >= room.capacity) {
        return res.status(400).json({ message: 'Room is full' });
      }
      
      // Increment room occupancy
      await room.increment('currentOccupancy');
    }
    
    // If changing from approved to something else, decrement occupancy
    if (application.status === 'Approved' && status !== 'Approved') {
      const room = await Room.findByPk(application.roomId);
      await room.decrement('currentOccupancy');
    }
    
    application.status = status;
    if (roomNumber) application.roomNumber = roomNumber;
    await application.save();
    
    res.json(application);
  } catch (error) {
    res.status(500).json({ message: 'Error updating application', error: error.message });
  }
};

// Admin: Delete application
exports.deleteApplication = async (req, res) => {
  try {
    const { id } = req.params;
    
    const application = await Application.findByPk(id);
    if (!application) {
      return res.status(404).json({ message: 'Application not found' });
    }
    
    // If application was approved, decrement room occupancy
    if (application.status === 'Approved') {
      const room = await Room.findByPk(application.roomId);
      await room.decrement('currentOccupancy');
    }
    
    await application.destroy();
    
    res.json({ message: 'Application deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Error deleting application', error: error.message });
  }
};