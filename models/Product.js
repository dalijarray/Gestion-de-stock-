const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
  name: { type: String, required: true },
  blocId: { type: mongoose.Schema.Types.ObjectId, ref: 'Bloc', required: true },
  stock: { type: Number, default: 0 },
  description: { type: String, required: true },
  history: [{
    add_at: { type: Date, default: Date.now },
    quantite: { type: Number, required: true }
  }]
});

module.exports = mongoose.model('Product', productSchema);