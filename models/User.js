const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  nom: { type: String, required: true },
  prenom: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  number: { type: String, required: true },
  role: { type: String, enum: ['chef_de_bloc', 'manager', 'chef_d_equipe'], required: true },
  bloc: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Bloc', 
    required: function() { return this.role === 'chef_de_bloc'; } 
  }
});

module.exports = mongoose.model('User', userSchema);