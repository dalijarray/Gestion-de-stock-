const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const auth = require('../middleware/auth');
// Route Signup
router.post('/signup', async (req, res) => {
  const { nom, prenom, email, password, number, role, bloc } = req.body;
  try {
    // Vérifier si l'utilisateur existe déjà
    let user = await User.findOne({ email });
    if (user) {
      return res.status(400).json({ message: 'Utilisateur déjà existant' });
    }

    // Créer un nouvel utilisateur
    user = new User({ nom, prenom, email, password, number, role, bloc });

    // Hasher le mot de passe
    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(password, salt);

    // Sauvegarder l'utilisateur dans la base de données
    await user.save();
    res.status(201).json({ message: 'Utilisateur créé avec succès' });
  } catch (error) {
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

// Route Login
router.post('/login', async (req, res) => {
    const { email, password } = req.body;
    try {
      // Vérifier si l'utilisateur existe
      const user = await User.findOne({ email });
      if (!user) {
        return res.status(400).json({ message: 'Identifiants invalides' });
      }
  
      // Vérifier le mot de passe
      const isMatch = await bcrypt.compare(password, user.password);
      if (!isMatch) {
        return res.status(400).json({ message: 'Identifiants invalides' });
      }
  
      // Générer un token JWT avec l'ID, le rôle et le bloc
      const payload = { 
        user: { 
          id: user.id, 
          role: user.role, 
          bloc: user.bloc // Ajouter le bloc ici
        } 
      };
      jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '1h' }, (err, token) => {
        if (err) throw err;
        res.json({ token });
      });
    } catch (error) {
      res.status(500).json({ message: 'Erreur serveur' });
    }
  });

  router.get('/me', auth(), async (req, res) => {
    try {
      // Récupérer l'utilisateur à partir de l'ID contenu dans le token
      const user = await User.findById(req.user.id).select('-password'); // Exclure le mot de passe
      if (!user) {
        return res.status(404).json({ message: 'Utilisateur non trouvé' });
      }
  
      // Peupler le champ bloc si l'utilisateur est un chef de bloc
      if (user.role === 'chef_de_bloc') {
        await user.populate('bloc', 'name');
      }
  
      res.json(user);
    } catch (error) {
      res.status(500).json({ message: 'Erreur serveur', error });
    }
  });

module.exports = router;