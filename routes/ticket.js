const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const Ticket = require('../models/Ticket');
const Product = require('../models/Product');
const User = require('../models/User');
const sendMail = require('../utils/mailer');

// CREATE - Créer un ticket (chef d'équipe uniquement)
// CREATE - Créer un ticket
router.post('/', auth(['chef_d_equipe']), async (req, res) => {
  const { selections, deliveryDate, comment } = req.body;

  try {
    const productIds = selections.map(sel => sel.productId);
    const products = await Product.find({ _id: { $in: productIds } });
    if (products.length !== selections.length) {
      return res.status(400).json({ message: 'Certains produits n’existent pas' });
    }

    const blocIds = [...new Set(products.map(p => p.blocId.toString()))];
    if (blocIds.length > 1) {
      return res.status(400).json({ message: 'Tous les produits doivent appartenir au même bloc' });
    }

    const receiver = await User.findOne({ bloc: blocIds[0], role: 'chef_de_bloc' });
    if (!receiver) {
      return res.status(400).json({ message: 'Aucun chef de bloc trouvé pour ce bloc' });
    }

    const ticket = new Ticket({
      selections,
      senderId: req.user.id,
      receiverId: receiver._id,
      deliveryDate,
      comment
    });

    await ticket.save();

    // Envoyer un email au chef de bloc (non bloquant)
    const sender = await User.findById(req.user.id);
    const productDetails = products.map(p => `${p.name} (Quantité: ${selections.find(s => s.productId.toString() === p._id.toString()).quantite})`).join(', ');
    const emailText = `Un nouveau ticket a été créé par ${sender.nom} ${sender.prenom}.\nProduits demandés : ${productDetails}\nDate de livraison souhaitée : ${deliveryDate || 'Non spécifiée'}\nCommentaire : ${comment || 'Aucun'}`;
    sendMail(receiver.email, 'Nouveau ticket créé', emailText).catch(err => {
      console.error('Échec de l’envoi de l’email au chef de bloc :', err);
    });

    res.status(201).json(ticket);
  } catch (error) {
    res.status(500).json({ message: 'Erreur serveur', error });
  }
});

// UPDATE - Mettre à jour l’état d’un ticket
router.put('/:id', auth(['chef_de_bloc']), async (req, res) => {
  const { status, comment } = req.body;

  try {
    const ticket = await Ticket.findById(req.params.id);
    if (!ticket) {
      return res.status(404).json({ message: 'Ticket non trouvé' });
    }

    if (ticket.receiverId.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Accès interdit à ce ticket' });
    }

    const now = new Date();
    if (ticket.deliveryDate && now > new Date(ticket.deliveryDate) && ticket.status !== 'rejeter') {
      ticket.status = 'rejeter';
      ticket.endDate = now;
      ticket.comment = ticket.comment || 'Délai de livraison dépassé';
      await ticket.save();

      const sender = await User.findById(ticket.senderId);
      sendMail(sender.email, 'Ticket rejeté (délai dépassé)', `Votre ticket (ID: ${ticket._id}) a été automatiquement rejeté car la date de livraison (${ticket.deliveryDate}) est dépassée.`)
        .catch(err => console.error('Échec de l’envoi de l’email au chef d’équipe :', err));

      return res.status(400).json({ message: 'Ticket rejeté : délai dépassé', ticket });
    }

    if (status && ['en_cours', 'accepter', 'rejeter'].includes(status)) {
      const oldStatus = ticket.status;
      ticket.status = status;
      if (status === 'accepter' || status === 'rejeter') {
        ticket.endDate = now;
        ticket.timeSpent = now - new Date(ticket.startDate);

        if (oldStatus === 'en_cours' && (status === 'accepter' || status === 'rejeter')) {
          const sender = await User.findById(ticket.senderId);
          const receiver = await User.findById(req.user.id);
          const productDetails = (await Product.find({ _id: { $in: ticket.selections.map(s => s.productId) } }))
            .map(p => `${p.name} (Quantité: ${ticket.selections.find(s => s.productId.toString() === p._id.toString()).quantite})`)
            .join(', ');
          const emailText = `Votre ticket (ID: ${ticket._id}) a été mis à jour par ${receiver.nom} ${receiver.prenom}.\nNouvel état : ${status}\nProduits : ${productDetails}\nCommentaire : ${comment || 'Aucun'}`;
          sendMail(sender.email, `Mise à jour du ticket : ${status}`, emailText)
            .catch(err => console.error('Échec de l’envoi de l’email au chef d’équipe :', err));
        }
      }
    }
    ticket.comment = comment || ticket.comment;

    await ticket.save();
    res.json(ticket);
  } catch (error) {
    res.status(500).json({ message: 'Erreur serveur', error });
  }
});

// GET - Récupérer tous les tickets (accessible à tous les utilisateurs authentifiés)
router.get('/', auth(), async (req, res) => {
  try {
    const tickets = await Ticket.find()
      .populate('selections.productId', 'name')
      .populate('senderId', 'nom prenom')
      .populate('receiverId', 'nom prenom');
    res.json(tickets);
  } catch (error) {
    res.status(500).json({ message: 'Erreur serveur', error });
  }
});

module.exports = router;