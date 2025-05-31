const express = require('express');
const mysql = require('mysql2');
const cors = require('cors');
const app = express();

// Configuration pour le déploiement
const PORT = process.env.PORT || 3000;
const MYSQL_HOST = process.env.MYSQL_HOST || 'localhost';
const MYSQL_USER = process.env.MYSQL_USER || 'root';
const MYSQL_PASSWORD = process.env.MYSQL_PASSWORD || 'P@sser123';
const MYSQL_DATABASE = process.env.MYSQL_DATABASE || 'tissus_db';

app.use(cors());
app.use(express.json());
app.use(express.static(__dirname));

// Route pour déboguer - afficher tous les fichiers disponibles
app.get('/debug', (req, res) => {
    const fs = require('fs');
    const files = fs.readdirSync(__dirname);
    res.json({ 
        message: 'Files in directory',
        directory: __dirname,
        files: files
    });
});

// Configuration de la connexion MySQL
const connection = mysql.createConnection({
    host: MYSQL_HOST,
    user: MYSQL_USER,
    password: MYSQL_PASSWORD
});

// Connexion à MySQL et initialisation de la base de données
connection.connect(error => {
    if (error) {
        console.error('Erreur de connexion à MySQL:', error);
        return;
    }
    console.log('Connecté à MySQL');
    
    // Créer la base de données si elle n'existe pas
    connection.query(`CREATE DATABASE IF NOT EXISTS ${MYSQL_DATABASE}`);
    connection.query(`USE ${MYSQL_DATABASE}`);
    
    // Créer la table clients si elle n'existe pas
    connection.query(`
        CREATE TABLE IF NOT EXISTS clients (
            id INT AUTO_INCREMENT PRIMARY KEY,
            nom VARCHAR(255) NOT NULL,
            longueur INT NOT NULL,
            cout DECIMAL(10,2) NOT NULL,
            paye BOOLEAN DEFAULT false,
            section VARCHAR(5) NOT NULL
        )
    `);
});

// Routes API
app.get('/api/clients', (req, res) => {
    connection.query('SELECT * FROM clients', (error, results) => {
        if (error) {
            console.error('Erreur lors de la récupération des clients:', error);
            res.status(500).json({ error: 'Erreur serveur' });
            return;
        }
        res.json(results);
    });
});

app.post('/api/clients', (req, res) => {
    const { nom, longueur, cout, section } = req.body;
    connection.query(
        'INSERT INTO clients (nom, longueur, cout, section) VALUES (?, ?, ?, ?)',
        [nom, longueur, cout, section],
        (error, results) => {
            if (error) {
                console.error('Erreur lors de l\'ajout du client:', error);
                res.status(500).json({ error: 'Erreur serveur' });
                return;
            }
            res.json({ id: results.insertId });
        }
    );
});

app.put('/api/clients/:id/paiement', (req, res) => {
    const { id } = req.params;
    const { paye } = req.body;
    connection.query(
        'UPDATE clients SET paye = ? WHERE id = ?',
        [paye, id],
        (error) => {
            if (error) {
                console.error('Erreur lors de la mise à jour du paiement:', error);
                res.status(500).json({ error: 'Erreur serveur' });
                return;
            }
            res.json({ success: true });
        }
    );
});

app.listen(PORT, () => {
    console.log(`Serveur démarré sur http://localhost:${PORT}`);
});
