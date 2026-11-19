const nodemailer = require("nodemailer");
const { MailtrapTransport } = require("mailtrap");

// On utilise le Token depuis le .env
const TOKEN = process.env.MAILTRAP_TOKEN;

const transport = nodemailer.createTransport(
    MailtrapTransport({
        token: TOKEN,
    })
);

// Configuration de l'expéditeur
const sender = {
    address: "hello@demomailtrap.co",
    name: "CoreLab LMS",
};

function escapeHtml(str) {
    return String(str ?? '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}

async function sendWelcomeEmail(email, firstName, password) {
    if (!process.env.MAILTRAP_TOKEN) {
        return;
    }
    try {
        await transport.sendMail({
            from: sender,
            to: [email],
            subject: 'Bienvenue sur CoreLab - Vos identifiants',
            html: `
                <h1>Bonjour ${escapeHtml(firstName)} !</h1>
                <p>Ton compte étudiant a été créé.</p>
                <p>Voici tes identifiants de connexion :</p>
                <ul>
                    <li><strong>Email :</strong> ${escapeHtml(email)}</li>
                    <li><strong>Mot de passe temporaire :</strong> ${escapeHtml(password)}</li>
                </ul>
                <p>Il te sera demandé de changer ce mot de passe lors de ta première connexion.</p>
            `,
            category: "Welcome Email",
        });
    } catch (error) {
        console.error("Erreur lors de l'envoi via Mailtrap SDK :", error.message);
    }
}

module.exports = { sendWelcomeEmail };