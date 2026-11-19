const jsonwebtoken = require('jsonwebtoken');

// Middleware pour vérifier le token
function verifyToken(req, res, next) {
    const autorisation = req.headers.authorization;
    if (!autorisation || !autorisation.startsWith('Bearer ')) {
        return res.status(401).json({ message: 'Token manquant' });
    }
    const token = autorisation.split(' ')[1];
    try {
        const decoded = jsonwebtoken.verify(token, process.env.JWT_SECRET);
        req.user = decoded;
        return next();
    } catch {
        return res.status(401).json({ message: 'Jeton invalide ou expiré' });
    }
}

// Middleware pour vérifier que l'utilisateur est admin
function isAdmin(req, res, next) {
    //on verifie que l'utilisateur est admin
    if(req.user && req.user.role == 'admin') {
        next();
    }else {
        res.status(403).json({ message: "Accès refusé. Droits d'administrateur requis." });
    }
}

function isStudent(req, res, next) {
    if(req.user && req.user.role === 'student') {
        next();
    } else {
        res.status(403).json({ message: "Accès refusé. Droits d'étudiant requis." });
    }
}

module.exports = { verifyToken, isAdmin, isStudent };