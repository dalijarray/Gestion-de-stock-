const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const Product = require('../models/Product');

// CREATE - Ajouter un produit (chef de bloc uniquement)
router.post('/', auth(['chef_de_bloc']), async (req, res) => {
    const { name, stock, description, quantite } = req.body;
  
    try {
      const user = req.user;
      const blocId = user.bloc; // Le bloc du chef de bloc
      // Vérifier si blocId existe
      if (!blocId) {
        return res.status(400).json({ message: 'Aucun bloc associé au chef de bloc' });
      }
  
      const product = new Product({
        name,
        blocId,
        stock: stock || 0,
        description,
        history: quantite ? [{ quantite }] : []
      });
  
      await product.save();
      res.status(201).json(product);
    } catch (error) {
      res.status(500).json({ message: 'Erreur serveur', error });
    }
  });

// UPDATE - Mettre à jour un produit (chef de bloc uniquement)
router.put('/:id', auth(['chef_de_bloc']), async (req, res) => {
  const { name, stock, description, quantite } = req.body;

  try {
    const product = await Product.findById(req.params.id);
    if (!product) {
      return res.status(404).json({ message: 'Produit non trouvé' });
    }

    // Vérifier si le produit appartient au bloc du chef
    if (product.blocId.toString() !== req.user.bloc.toString()) {
      return res.status(403).json({ message: 'Accès interdit à ce produit' });
    }

    product.name = name || product.name;
    product.stock = stock !== undefined ? stock : product.stock;
    product.description = description || product.description;
    if (quantite) {
      product.history.push({ quantite });
      product.stock += quantite; // Mettre à jour le stock
    }

    await product.save();
    res.json(product);
  } catch (error) {
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

// DELETE - Supprimer un produit (chef de bloc uniquement)
router.delete('/:id', auth(['chef_de_bloc']), async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) {
      return res.status(404).json({ message: 'Produit non trouvé' });
    }

    // Vérifier si le produit appartient au bloc du chef
    if (product.blocId.toString() !== req.user.bloc.toString()) {
      return res.status(403).json({ message: 'Accès interdit à ce produit' });
    }

    await product.remove();
    res.json({ message: 'Produit supprimé' });
  } catch (error) {
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

// GET - Récupérer tous les produits (accessible à tous les utilisateurs authentifiés)
router.get('/', auth(), async (_req, res) => {
  try {
    const products = await Product.find().populate('name');
    res.json(products);
  } catch (error) {
    res.status(500).json({ message: 'Erreur serveur',error });
  }
});

module.exports = router;