# Datenbank-Schema-Fixes für Appwrite

## Fehlende Felder in Appwrite-Collections

### 1. Patients Collection
**Fehlendes Feld**: `dbStatus`
- **Typ**: String (Enum)
- **Werte**: 'active', 'inactive', 'archived', 'pending'
- **Standard**: 'active'
- **Beschreibung**: Status des Patienten für Filterung und Verwaltung

### 2. Invoices Collection  
**Fehlendes Feld**: `notes`
- **Typ**: String (Text)
- **Optional**: Ja
- **Beschreibung**: Zusätzliche Notizen zur Rechnung

### 3. Encounters Collection
**Status**: Collection existiert möglicherweise nicht
- **Aktion**: Collection erstellen oder Referenzen entfernen
- **Felder**: patientId, startAt, endAt, type, notes

## Appwrite-Konfiguration

### Collections die erstellt/aktualisiert werden müssen:

```javascript
// Patients Collection - dbStatus hinzufügen
{
  "key": "dbStatus",
  "type": "string",
  "size": 20,
  "required": false,
  "default": "active"
}

// Invoices Collection - notes hinzufügen  
{
  "key": "notes",
  "type": "string", 
  "size": 1000,
  "required": false
}

// Encounters Collection - komplett erstellen
{
  "collectionId": "encounters",
  "name": "Encounters",
  "permissions": ["read", "write"],
  "attributes": [
    {
      "key": "patientId",
      "type": "string",
      "size": 36,
      "required": true
    },
    {
      "key": "startAt", 
      "type": "datetime",
      "required": true
    },
    {
      "key": "endAt",
      "type": "datetime", 
      "required": false
    },
    {
      "key": "type",
      "type": "string",
      "size": 50,
      "required": true
    },
    {
      "key": "notes",
      "type": "string",
      "size": 1000,
      "required": false
    }
  ]
}
```

## API-Anpassungen

### Temporäre Workarounds entfernen:
1. `dbStatus` Feld in POST-Route aktivieren
2. `notes` Feld in Invoice-Erstellung hinzufügen
3. Encounters-Referenzen validieren

### Fehlerbehandlung verbessern:
1. Graceful Fallbacks für fehlende Collections
2. Bessere Validierung für optionale Beziehungen
3. Konsistente Fehlermeldungen

