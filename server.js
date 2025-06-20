const express = require('express');
const mysql = require('mysql2');
const cors = require('cors');
const app = express();

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

// Configuration de la connexion MySQL initiale (sans base de données)
const connection = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: 'P@sser123'
});

// Connexion à MySQL
connection.connect(error => {
    if (error) {
        console.error('Erreur de connexion à MySQL:', error);
        return;
    }
    console.log('Connecté à MySQL');
    
    // Créer la base de données si elle n'existe pas
    connection.query(`CREATE DATABASE IF NOT EXISTS tissus_db`);
    connection.query(`USE tissus_db`);
    
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

    // Créer la table receptions_tissus si elle n'existe pas
    connection.query(`
        CREATE TABLE IF NOT EXISTS receptions_tissus (
            id INT AUTO_INCREMENT PRIMARY KEY,
            client_id INT NOT NULL,
            date_reception DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (client_id) REFERENCES clients(id)
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

// Route pour marquer un tissu comme reçu
app.post('/api/receptions', (req, res) => {
    const { client_id } = req.body;
    connection.query(
        'INSERT INTO receptions_tissus (client_id) VALUES (?)',
        [client_id],
        (error, results) => {
            if (error) {
                console.error('Erreur lors de l\'enregistrement de la réception:', error);
                res.status(500).json({ error: 'Erreur serveur' });
                return;
            }
            res.json({ id: results.insertId });
        }
    );
});

// Route pour obtenir la liste des réceptions
app.get('/api/receptions', (req, res) => {
    connection.query(
        `SELECT r.id, r.client_id, r.date_reception, c.nom, c.section, c.longueur 
         FROM receptions_tissus r 
         INNER JOIN clients c ON r.client_id = c.id 
         ORDER BY r.date_reception DESC`,
        (error, results) => {
            if (error) {
                console.error('Erreur lors de la récupération des réceptions:', error);
                res.status(500).json({ error: 'Erreur serveur' });
                return;
            }
            res.json(results);
        }
    );
});

const port = 3000;
app.listen(port, () => {
    console.log(`Serveur démarré sur http://localhost:${port}`);
});
