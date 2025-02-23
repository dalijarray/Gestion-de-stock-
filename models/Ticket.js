const mongoose = require('mongoose');

const productSelectionSchema = new mongoose.Schema({
  productId: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
  quantite: { type: Number, required: true }
});

const ticketSchema = new mongoose.Schema({
  selections: [productSelectionSchema],
  startDate: { type: Date, default: Date.now },
  endDate: { type: Date },
  status: { 
    type: String, 
    enum: ['en_attente', 'en_cours', 'accepter', 'rejeter'], 
    default: 'en_attente' 
  },
  comment: { type: String },
  deliveryDate: { type: Date },
  timeSpent: { type: Number }, // En millisecondes, calculé entre startDate et endDate
  senderId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  receiverId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }
});

module.exports = mongoose.model('Ticket', ticketSchema);