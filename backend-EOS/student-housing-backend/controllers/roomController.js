const { Room } = require('../models');

// Get all rooms
exports.getAllRooms = async (req, res) => {
  try {
    const rooms = await Room.findAll();
    res.json(rooms);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching rooms', error: error.message });
  }
};

// Create a new room
exports.createRoom = async (req, res) => {
  try {
    const { name, description, imageUrl, type, capacity } = req.body;
    
    const room = await Room.create({
      name,
      description,
      imageUrl,
      type,
      capacity,
      currentOccupancy: 0
    });
    
    res.status(201).json(room);
  } catch (error) {
    res.status(500).json({ message: 'Error creating room', error: error.message });
  }
};

// Delete a room
exports.deleteRoom = async (req, res) => {
  try {
    const { id } = req.params;
    
    // Check if room has any approved applications
    const room = await Room.findByPk(id, {
      include: [{
        association: 'applications',
        where: { status: 'Approved' },
        required: false
      }]
    });
    
    if (room.applications && room.applications.length > 0) {
      return res.status(400).json({ message: 'Cannot delete room with approved applications' });
    }
    
    await room.destroy();
    
    res.json({ message: 'Room deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Error deleting room', error: error.message });
  }
};