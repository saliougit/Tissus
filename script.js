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
    const donnees = await getDonnees();
    if (!donnees) return;

    const tbodyPaye = document.getElementById('clientsPayeList');
    const tbodyNonPaye = document.getElementById('clientsNonPayeList');
    tbodyPaye.innerHTML = '';
    tbodyNonPaye.innerHTML = '';

    Object.entries(donnees).forEach(([key, clients]) => {
        if (section === 'all' || key === section) {
            clients.forEach(client => {
                // Vérifier si le nom correspond à la recherche
                if (searchTerm === '' || client.nom.toLowerCase().includes(searchTerm.toLowerCase())) {
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
                        </td>
                    `;
                    if (client.paye) {
                        tbodyPaye.appendChild(tr);
                    } else {
                        tbodyNonPaye.appendChild(tr);
                    }
                }
            });
        }
    });
}

// Fonction pour basculer l'état de paiement
async function togglePaiement(section, nom) {
    const donnees = await getDonnees();
    if (!donnees) return;

    const client = donnees[section].find(c => c.nom === nom);
    if (client) {
        client.paye = !client.paye;
        await saveDonnees(donnees);
        await afficherListe(document.getElementById('sectionFilter').value);
        await calculerTotaux();
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
