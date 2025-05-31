const donneesInitiales = {
    "4m": [
        { nom: "Benjamin Daly Ndiaye", longueur: 4, cout: 7000, paye: false },
        { nom: "Felix Farba Ndao", longueur: 4, cout: 7000, paye: false },
        { nom: "Ismaila Sow", longueur: 4, cout: 7000, paye: false },
        { nom: "Libasse Laye Mbengeu", longueur: 4, cout: 7000, paye: false },
        { nom: "Pape Bouna Bamba Bar", longueur: 4, cout: 7000, paye: false },
        { nom: "Djiby Loum", longueur: 4, cout: 7000, paye: false },
        { nom: "Hamidou Woury Ba", longueur: 4, cout: 7000, paye: false },        
        { nom: "Saliou Samba Diao", longueur: 4, cout: 7000, paye: false },
        { nom: "Elimane Ndiaye", longueur: 4, cout: 7000, paye: false },
        { nom: "Arona Ndiaye", longueur: 4, cout: 7000, paye: false },
        { nom: "Omar Samb", longueur: 4, cout: 7000, paye: false },
        { nom: "Moussa Diallo", longueur: 4, cout: 7000, paye: false },
        { nom: "Daniel Dieme", longueur: 4, cout: 7000, paye: false },
        { nom: "Mor Talla Ba", longueur: 4, cout: 7000, paye: false },
        { nom: "Madaga Diop", longueur: 4, cout: 7000, paye: false },        
        { nom: "Jean Robert Wally Sarr", longueur: 4, cout: 7000, paye: false },
        { nom: "Abdoulaye Makalou", longueur: 4, cout: 7000, paye: false },
        { nom: "Elhadji Ousmane Sow", longueur: 4, cout: 7000, paye: false },
        { nom: "Aliou Thiam", longueur: 4, cout: 7000, paye: false },
        { nom: "Abdoulaye Wade Mane", longueur: 4, cout: 7000, paye: false }
    ],
    "5m": [
        { nom: "Mame Mbaye Kane", longueur: 5, cout: 8750, paye: false },
        { nom: "Pape Diere Bodian", longueur: 5, cout: 8750, paye: false },
        { nom: "Bassirou Kane", longueur: 5, cout: 8750, paye: false },
        { nom: "Moustapha Dione", longueur: 5, cout: 8750, paye: false },
        { nom: "Cheikh Seck", longueur: 5, cout: 8750, paye: false },
        { nom: "Issakha Diouf", longueur: 5, cout: 8750, paye: false },        
        { nom: "Emanuel", longueur: 5, cout: 8750, paye: false },          
        { nom: "Cheikh Gaye", longueur: 5, cout: 8750, paye: false },
        { nom: "Diery Dia", longueur: 5, cout: 8750, paye: false },
        { nom: "Fedior", longueur: 5, cout: 8750, paye: false },
        { nom: "Pape Malick Thioune", longueur: 5, cout: 8750, paye: false }
    ],
    "6m": [
        { nom: "Mourtada Diop", longueur: 6, cout: 10500, paye: false }
    ],
    "8m": [
        { nom: "Saliou Niane", longueur: 8, cout: 14000, paye: false }
    ]
};

async function initializeDatabase() {
    try {
        // For each section
        for (const [section, clients] of Object.entries(donneesInitiales)) {
            // For each client in the section
            for (const client of clients) {
                const response = await fetch('http://localhost:3000/api/clients', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        nom: client.nom,
                        longueur: client.longueur,
                        cout: client.cout,
                        section: section,
                        paye: client.paye
                    })
                });

                if (!response.ok) {
                    throw new Error(`Failed to add client ${client.nom}`);
                }

                console.log(`Added client: ${client.nom}`);
            }
        }
        console.log('Database initialization complete!');
    } catch (error) {
        console.error('Error initializing database:', error);
    }
}

// Run the initialization
initializeDatabase();
