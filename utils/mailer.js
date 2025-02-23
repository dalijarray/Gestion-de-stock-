const nodemailer = require('nodemailer');
require('dotenv').config();

// Configurer le transporteur d'emails
const transporter = nodemailer.createTransport({
  service: 'gmail', // Vous pouvez utiliser un autre service (Outlook, SendGrid, etc.)
  auth: {
    user: process.env.EMAIL_USER, // Votre adresse email
    pass: process.env.EMAIL_PASS  // Votre mot de passe d'application (voir ci-dessous)
  }
});

// Fonction pour envoyer un email
const sendMail = async (to, subject, text) => {
  const mailOptions = {
    from: process.env.EMAIL_USER,
    to,
    subject,
    text
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log(`Email envoyé à ${to}`);
  } catch (error) {
    console.error('Erreur lors de l’envoi de l’email :', error);
  }
};

module.exports = sendMail;