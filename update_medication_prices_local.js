// Script um Medikamente über die lokale API zu aktualisieren
const fetch = require('node-fetch');

// Zufälligen Preis zwischen 10 und 50 generieren
function generateRandomPrice() {
    return Math.round((Math.random() * 40 + 10) * 100) / 100; // 10.00 bis 50.00
}

async function updateMedicationPricesViaAPI() {
    try {
        console.log('🔄 Lade alle Medikamente über lokale API...');
        
        // Medikamente über die lokale API abrufen
        const response = await fetch('http://localhost:3000/api/inventory', {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
            }
        });

        if (!response.ok) {
            throw new Error(`API Error: ${response.status} ${response.statusText}`);
        }

        const data = await response.json();
        const medications = data.medications || [];

        console.log(`📊 Gefunden: ${medications.length} Medikamente`);

        if (medications.length === 0) {
            console.log('❌ Keine Medikamente gefunden');
            return;
        }

        console.log('💰 Aktualisiere Preise...');
        
        let updatedCount = 0;
        let errorCount = 0;

        // Jedes Medikament aktualisieren
        for (const medication of medications) {
            try {
                const newPrice = generateRandomPrice();
                
                // Alle Felder müssen gesendet werden (PUT erfordert vollständiges Update)
                const updateData = {
                    code: medication.code,
                    name: medication.name,
                    form: medication.form || '',
                    strength: medication.strength || '',
                    minStock: medication.minStock || 0,
                    currentStock: medication.currentStock || 0,
                    barcode: medication.barcode || '',
                    imageUrl: medication.imageUrl || '',
                    description: medication.description || '',
                    pricePerUnit: newPrice
                };
                
                const updateResponse = await fetch(`http://localhost:3000/api/inventory/${medication.id}`, {
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify(updateData)
                });

                if (updateResponse.ok) {
                    console.log(`✅ ${medication.name}: CHF ${newPrice}`);
                    updatedCount++;
                } else {
                    const errorData = await updateResponse.json();
                    console.error(`❌ Fehler bei ${medication.name}:`, errorData.error);
                    errorCount++;
                }
                
                // Kleine Pause zwischen Updates
                await new Promise(resolve => setTimeout(resolve, 200));
                
            } catch (error) {
                console.error(`❌ Fehler bei ${medication.name}:`, error.message);
                errorCount++;
            }
        }

        console.log('\n📈 Zusammenfassung:');
        console.log(`✅ Erfolgreich aktualisiert: ${updatedCount}`);
        console.log(`❌ Fehler: ${errorCount}`);
        console.log(`📊 Gesamt: ${medications.length}`);

    } catch (error) {
        console.error('❌ Allgemeiner Fehler:', error);
        console.log('\n💡 Hinweis: Stelle sicher, dass der Next.js Server läuft (npm run dev)');
    }
}

// Script ausführen
updateMedicationPricesViaAPI();
