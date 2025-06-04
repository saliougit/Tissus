// Attendre que jspdf soit chargé
if (typeof window.jspdf === "undefined") {
    console.error("jsPDF n'est pas chargé correctement");
} else {
    window.jsPDF = window.jspdf.jsPDF;
}

// Fonction pour obtenir les données depuis l'API
async function getDonnees() {
    try {
        const response = await fetch('http://localhost:3000/api/clients');
        const clients = await response.json();
        
        // Convertir en format compatible
        const donnees = {
            "4m": clients.filter(c => c.section === "4m"),
            "5m": clients.filter(c => c.section === "5m"),
            "6m": clients.filter(c => c.section === "6m"),
            "8m": clients.filter(c => c.section === "8m")
        };
        return donnees;
    } catch (error) {
        console.error('Erreur lors de la récupération des données:', error);
        return null;
    }
}

// Fonction pour sauvegarder les données via l'API
async function saveDonnees(donnees) {
    try {
        // Pour chaque client, faire une requête à l'API
        Object.entries(donnees).forEach(([section, clients]) => {
            clients.forEach(async (client) => {
                await fetch(`http://localhost:3000/api/clients/${client.id}/paiement`, {
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({ paye: client.paye })
                });
            });
        });
    } catch (error) {
        console.error('Erreur lors de la sauvegarde des données:', error);
    }
}

// Fonction pour calculer les totaux
async function calculerTotaux() {
    const donnees = await getDonnees();
    if (!donnees) return;

    let totalMontant = 0;
    let totalTissus = 0;
    let montantPaye = 0;
    let totalPersonnes = 0;
    let nombrePersonnesPaye = 0;

    Object.values(donnees).forEach(section => {
        section.forEach(client => {
            totalMontant += parseFloat(client.cout);
            totalTissus += client.longueur;
            totalPersonnes++;
            if (client.paye) {
                montantPaye += parseFloat(client.cout);
                nombrePersonnesPaye++;
            }
        });
    });    document.getElementById('montantTotal').textContent = totalMontant.toLocaleString();
    document.getElementById('totalTissus').textContent = totalTissus;
    document.getElementById('montantPaye').textContent = montantPaye.toLocaleString();
    document.getElementById('resteAPayer').textContent = (totalMontant - montantPaye).toLocaleString();
    document.getElementById('totalPersonnes').textContent = totalPersonnes;
    document.getElementById('totalPersonnes2').textContent = totalPersonnes;
    document.getElementById('personnesPaye').textContent = nombrePersonnesPaye;
}

// Fonction pour mettre à jour l'affichage de la liste
async function afficherListe(section = 'all', searchTerm = '') {
    try {
        const donnees = await getDonnees();
        if (!donnees) return;
        
        // Récupérer la liste des réceptions
        const receptionResponse = await fetch('http://localhost:3000/api/receptions');
        const receptions = await receptionResponse.json();
        
        const tbodyPaye = document.getElementById('clientsPayeList');
        const tbodyNonPaye = document.getElementById('clientsNonPayeList');
        tbodyPaye.innerHTML = '';
        tbodyNonPaye.innerHTML = '';

        // Compter le nombre total de clients payés et non payés (qui n'ont pas reçu)
        let totalPaye = 0;
        let totalNonPaye = 0;
        Object.values(donnees).forEach(clients => {
            clients.forEach(client => {
                const aRecu = receptions.some(r => r.client_id === client.id);
                if (!aRecu) {
                    if (client.paye) totalPaye++;
                    else totalNonPaye++;
                }
            });
        });

        // Afficher un message si toutes les sections sont vides
        if (totalPaye === 0) {
            tbodyPaye.innerHTML = `<tr><td colspan="4" class="empty-message">Pas encore de paiements validés</td></tr>`;
        }
        if (totalNonPaye === 0) {
            tbodyNonPaye.innerHTML = `<tr><td colspan="4" class="empty-message">Bravo ! Tous les paiements sont validés</td></tr>`;
        }

        Object.entries(donnees).forEach(([key, clients]) => {
            if (section === 'all' || key === section) {
                clients.forEach(client => {
                    if (searchTerm === '' || client.nom.toLowerCase().includes(searchTerm.toLowerCase())) {
                        // Vérifier si le client a déjà reçu son tissu
                        const aRecu = receptions.some(r => r.client_id === client.id);
                        
                        // Ne pas afficher le client s'il a déjà reçu son tissu
                        if (!aRecu) {
                            const tr = document.createElement('tr');
                            tr.innerHTML = `
                                <td>${client.nom}</td>
                                <td>${client.longueur}</td>
                                <td>${parseFloat(client.cout).toLocaleString()}</td>
                                <td>
                                    <button class="btn ${client.paye ? 'btn-annuler' : 'btn-payer'}"
                                            onclick="togglePaiement('${key}', '${client.nom}')">
                                        ${client.paye ? 'Annuler' : 'Payer'}
                                    </button>
                                    ${client.paye ? `
                                        <button class="btn btn-success btn-recu"
                                            onclick="marquerCommeRecu('${key}', '${client.nom}', ${client.id})">
                                            Reçu
                                        </button>
                                    ` : ''}
                                </td>
                            `;
                            if (client.paye) {
                                tbodyPaye.appendChild(tr);
                            } else {
                                tbodyNonPaye.appendChild(tr);
                            }
                        }
                    }
                });
            }
        });
    } catch (error) {
        console.error('Erreur lors de l\'affichage de la liste:', error);
    }
}

// Fonction pour afficher les réceptions
async function afficherReceptions() {
    try {
        const response = await fetch('http://localhost:3000/api/receptions');
        const receptions = await response.json();
        
        const tbody = document.getElementById('receptionsListeTissus');
        tbody.innerHTML = '';

        if (receptions.length === 0) {
            tbody.innerHTML = `<tr><td colspan="3" class="empty-message">Pas encore de réceptions enregistrées</td></tr>`;
            return;
        }

        // Compteurs par section
        let count4m = 0, count5m = 0, count6m = 0, count8m = 0;
        
        // Récupérer les totaux depuis getDonnees()
        const donnees = await getDonnees();
        const total4m = donnees['4m'] ? donnees['4m'].length : 0;
        const total5m = donnees['5m'] ? donnees['5m'].length : 0;
        const total6m = donnees['6m'] ? donnees['6m'].length : 0;
        const total8m = donnees['8m'] ? donnees['8m'].length : 0;
        
        receptions.forEach(reception => {
            const tr = document.createElement('tr');
            const date = new Date(reception.date_reception).toLocaleString('fr-FR');
            
            tr.innerHTML = `
                <td>${reception.nom}</td>
                <td>${reception.section}</td>
                <td>${date}</td>
            `;
            tbody.appendChild(tr);

            // Incrémenter les compteurs
            switch(reception.section) {
                case '4m': count4m++; break;
                case '5m': count5m++; break;
                case '6m': count6m++; break;
                case '8m': count8m++; break;
            }
        });

        // Mettre à jour les compteurs et totaux
        document.getElementById('count4m').textContent = count4m;
        document.getElementById('count5m').textContent = count5m;
        document.getElementById('count6m').textContent = count6m;
        document.getElementById('count8m').textContent = count8m;
          document.getElementById('total4m').textContent = total4m;
        document.getElementById('total5m').textContent = total5m;
        document.getElementById('total6m').textContent = total6m;
        document.getElementById('total8m').textContent = total8m;

        // Calculer et afficher les restants
        document.getElementById('restant4m').textContent = total4m - count4m;
        document.getElementById('restant5m').textContent = total5m - count5m;
        document.getElementById('restant6m').textContent = total6m - count6m;
        document.getElementById('restant8m').textContent = total8m - count8m;

    } catch (error) {
        console.error('Erreur lors de la récupération des réceptions:', error);
    }
}

// Fonction pour basculer l'état de paiement
async function togglePaiement(section, nom) {
    const donnees = await getDonnees();
    if (!donnees) return;

    const client = donnees[section].find(c => c.nom === nom);
    if (client) {
        // Mettre à jour le statut de paiement sans demander de confirmation
        const nouveauStatut = !client.paye;
        client.paye = nouveauStatut;
        await saveDonnees(donnees);

        // Rafraîchir les listes et les totaux
        await Promise.all([
            afficherListe(document.getElementById('sectionFilter').value),
            afficherReceptions(),
            calculerTotaux()
        ]);
    }
}

// Fonction pour marquer un tissu comme reçu
async function marquerCommeRecu(section, nom, clientId) {
    try {
        // Demander confirmation
        const confirmation = confirm(`Voulez-vous confirmer que ${nom} a reçu son tissu ?`);
        if (!confirmation) return;

        // Enregistrer la réception
        await fetch('http://localhost:3000/api/receptions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ client_id: clientId })
        });

        // Rafraîchir l'affichage
        await Promise.all([
            afficherListe(document.getElementById('sectionFilter').value),
            afficherReceptions(),
            calculerTotaux()
        ]);
    } catch (error) {
        console.error('Erreur lors de l\'enregistrement de la réception:', error);
        alert('Une erreur est survenue lors de l\'enregistrement de la réception.');
    }
}

// Fonction pour exporter les données
function exporterDonnees() {
    const donnees = getDonnees();
    const dataStr = JSON.stringify(donnees, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    
    const maintenant = new Date();
    const dateStr = maintenant.toISOString().split('T')[0];
    
    const a = document.createElement('a');
    a.href = url;
    a.download = `suivi-paiements-tissus-${dateStr}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}

// Fonction pour importer les données
function importerDonnees(fichier) {
    const reader = new FileReader();
    reader.onload = function(e) {
        try {
            const donnees = JSON.parse(e.target.result);
            localStorage.setItem('donneesTissus', JSON.stringify(donnees));
            afficherListe();
            calculerTotaux();
            alert('Données importées avec succès !');
        } catch (err) {
            alert('Erreur lors de l\'importation du fichier. Vérifiez que c\'est un fichier JSON valide.');
        }
    };
    reader.readAsText(fichier);
}

// Ajout de la gestion des erreurs pour les fonctions principales
function handleError(error, message) {
    console.error(message, error);
    alert(message);
}

// Fonction pour copier les données dans le presse-papiers
function copierDonnees() {
    const donnees = getDonnees();
    const dataStr = JSON.stringify(donnees, null, 2);
    
    // Créer un élément textarea temporaire
    const textarea = document.createElement('textarea');
    textarea.value = dataStr;
    document.body.appendChild(textarea);
    textarea.select();
    
    try {
        document.execCommand('copy');
        alert('Les données ont été copiées dans le presse-papiers !');
    } catch (err) {
        console.error('Erreur lors de la copie:', err);
        alert('Erreur lors de la copie des données');
    }
    
    document.body.removeChild(textarea);
}

// Fonction pour formater les montants en FCFA
function formatMontant(montant) {
    return montant.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".") + " FCFA";
}

// Fonction pour générer le PDF des paiements
async function genererPDF() {
    try {
        const donnees = await getDonnees();
        if (!donnees) {
            alert('Erreur: Impossible de récupérer les données');
            return;
        }

        // Créer un nouveau document PDF
        const doc = new jsPDF({
            orientation: 'portrait',
            unit: 'mm',
            format: 'a4'
        });

        // Définir les dimensions et marges
        const largeurPage = doc.internal.pageSize.getWidth();
        const marge = 20;

        // En-tête avec logo ou titre stylisé
        doc.setFillColor(40, 84, 147);
        doc.rect(0, 0, largeurPage, 40, 'F');
        
        doc.setTextColor(255, 255, 255);
        doc.setFontSize(24);
        doc.setFont('helvetica', 'bold');
        doc.text('État des Paiements - Tissus', largeurPage / 2, 25, { align: 'center' });
        
        // Date
        doc.setTextColor(0, 0, 0);
        doc.setFontSize(12);
        doc.setFont('helvetica', 'normal');
        const date = new Date().toLocaleDateString('fr-FR', { 
            day: '2-digit',
            month: '2-digit',
            year: 'numeric'
        });
        doc.text(`Date: ${date}`, marge, 50);

        // Calculer les totaux
        let totalMontantPaye = 0;
        let totalTissusPaye = 0;
        const paiementsValides = [];

        // Collecter les paiements validés
        Object.entries(donnees).forEach(([section, clients]) => {
            clients.forEach(client => {
                if (client.paye === 1) {  // Vérifie si paye est égal à 1 (true dans MySQL)
                    paiementsValides.push([
                        client.nom,
                        `${client.longueur}m`,
                        formatMontant(parseFloat(client.cout)),
                        `${section}`
                    ]);
                    totalMontantPaye += parseFloat(client.cout);
                    totalTissusPaye += client.longueur;
                }
            });
        });

        // Ajouter les totaux avec style
        doc.setFillColor(245, 245, 245);
        doc.rect(marge - 2, 60, 170, 20, 'F');
        doc.setFontSize(12);
        doc.setFont('helvetica', 'bold');
        doc.text(`Total payé: ${formatMontant(totalMontantPaye)}`, marge, 70);
        doc.text(`Total tissus payés: ${totalTissusPaye} mètres`, marge, 75);

        // Tableau des paiements
        if (paiementsValides.length > 0) {
            doc.autoTable({
                startY: 90,
                head: [['Nom', 'Longueur', 'Montant', 'Section']],
                body: paiementsValides,
                theme: 'grid',
                styles: {
                    font: 'helvetica',
                    fontSize: 11,
                    cellPadding: 3,
                    lineColor: [220, 220, 220],
                    lineWidth: 0.1
                },
                headStyles: {
                    fillColor: [40, 84, 147],
                    textColor: [255, 255, 255],
                    fontSize: 12,
                    fontStyle: 'bold',
                    halign: 'left'
                },
                columnStyles: {
                    0: { cellWidth: 70 },
                    1: { cellWidth: 35, halign: 'center' },
                    2: { cellWidth: 45, halign: 'right' },
                    3: { cellWidth: 30, halign: 'center' }
                },
                alternateRowStyles: {
                    fillColor: [250, 250, 250]
                },
                margin: { top: marge, right: marge, bottom: marge, left: marge }
            });
        } else {
            doc.setFontSize(14);
            doc.setTextColor(128, 128, 128);
            doc.text('Aucun paiement validé à afficher', largeurPage / 2, 100, { align: 'center' });
        }

        // Sauvegarder le PDF
        const fileName = `paiements-tissus-${date.replace(/\//g, '-')}.pdf`;
        doc.save(fileName);
    } catch (error) {
        console.error('Erreur lors de la génération du PDF:', error);
        alert('Une erreur est survenue lors de la génération du PDF. Veuillez réessayer.');
    }
}

// Fonction pour rafraîchir automatiquement les données
async function rafraichirDonnees() {
    await afficherListe(document.getElementById('sectionFilter').value);
    await calculerTotaux();
    
    // Mettre à jour l'heure de la dernière mise à jour
    const maintenant = new Date();
    const heureFormattee = maintenant.toLocaleTimeString('fr-FR', { 
        hour: '2-digit', 
        minute: '2-digit', 
        second: '2-digit' 
    });
    document.getElementById('lastUpdate').textContent = heureFormattee;
}

// Configuration du rafraîchissement automatique
const INTERVALLE_RAFRAICHISSEMENT = 5000; // 5 secondes

// Démarrer le rafraîchissement automatique
let intervalId = setInterval(rafraichirDonnees, INTERVALLE_RAFRAICHISSEMENT);

document.addEventListener('DOMContentLoaded', async () => {
    try {
        // Initialisation des données
        await afficherListe();
        await calculerTotaux();
        await afficherReceptions();
        
        // Écouteurs pour les boutons principaux
        const exportBtn = document.getElementById('exportBtn');
        const importBtn = document.getElementById('importBtn');
        const importFile = document.getElementById('importFile');
        const pdfBtn = document.getElementById('pdfBtn');
        const sectionFilter = document.getElementById('sectionFilter');
        const searchInput = document.getElementById('searchInput');
        
        if (exportBtn) exportBtn.addEventListener('click', exporterDonnees);
        
        if (importBtn) {
            importBtn.addEventListener('click', () => {
                importFile.click();
            });
        }
        
        if (importFile) {
            importFile.addEventListener('change', (e) => {
                if (e.target.files.length > 0) {
                    importerDonnees(e.target.files[0]);
                    e.target.value = '';
                }
            });
        }
        
        if (pdfBtn) pdfBtn.addEventListener('click', genererPDF);
        
        if (sectionFilter) {
            sectionFilter.addEventListener('change', (e) => {
                afficherListe(e.target.value, searchInput.value);
            });
        }

        // Écouteur pour la recherche avec debounce
        if (searchInput) {
            let timeoutId;
            searchInput.addEventListener('input', (e) => {
                clearTimeout(timeoutId);
                timeoutId = setTimeout(() => {
                    afficherListe(sectionFilter.value, e.target.value);
                }, 300);
            });
        }
        
    } catch (error) {
        console.error('Erreur lors de l\'initialisation:', error);
    }
});
