const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });
const connectDB = require('../config/db');

if (!process.env.JWT_SECRET) {
    console.error('FATAL: JWT_SECRET environment variable is missing.');
    process.exit(1);
}

// Routes
const authRoutes = require('../routes/authRoutes');
const adminRoutes = require('../routes/adminRoute');
const studentRoutes = require('../routes/studentRoute');
const quizRoutes = require('../routes/quizRoutes');

const app = express();
const allowedOrigins = (process.env.CORS_ORIGIN || 'http://localhost:3000').split(',').map(o => o.trim());
app.use(cors({ origin: allowedOrigins, credentials: true }));
app.use(express.json());

app.get('/', (req, res) => res.send('API CoreLab Opérationnelle'));

app.use('/api/auth', authRoutes);
app.use('/api/quizzes', quizRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/student', studentRoutes);

app.use((err, req, res, next) => {
    if (err && err.name === 'MulterError') {
        return res.status(400).json({ message: `Erreur d'upload : ${err.message}` });
    }
    if (err) {
        return res.status(err.status || 400).json({ message: err.message || 'Erreur serveur.' });
    }
    next();
});

if (require.main === module) {
    connectDB();
    const PORT = process.env.PORT || 4242;
    app.listen(PORT, () => console.log(`Serveur lancé sur le port ${PORT}`));
}

module.exports = app;