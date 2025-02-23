const mongoose = require('mongoose');

const blocSchema = new mongoose.Schema({
  name: { type: String, required: true, unique: true }, // e.g., "Bloc A"
  leaderId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User', 
    required: true, 
    unique: true // Un seul chef par bloc
  }
});

module.exports = mongoose.model('Bloc', blocSchema);