# Fehlerpräventionsstrategien

## 1. Datenbank-Validierung

### Schema-Konsistenz-Checks
```typescript
// Vor jeder Datenbankoperation prüfen
async function validateCollectionExists(collectionId: string) {
  try {
    await databases.getCollection(APPWRITE_DATABASE_ID, collectionId)
    return true
  } catch (error) {
    console.warn(`Collection ${collectionId} does not exist`)
    return false
  }
}

// Felder vor dem Speichern validieren
async function validateDocumentFields(collectionId: string, data: any) {
  const collection = await databases.getCollection(APPWRITE_DATABASE_ID, collectionId)
  const attributes = collection.attributes
  
  // Prüfe ob alle Felder existieren
  for (const key in data) {
    const attribute = attributes.find(attr => attr.key === key)
    if (!attribute) {
      console.warn(`Field ${key} does not exist in collection ${collectionId}`)
      delete data[key] // Entferne nicht-existierende Felder
    }
  }
  
  return data
}
```

## 2. Null-Safe Operations

### Optionale Chaining überall verwenden
```typescript
// Statt: prescription.prescriber.name
// Verwende: prescription.prescriber?.name || 'Unknown'

// Statt: patient.appointments.length
// Verwende: patient.appointments?.length || 0
```

### Fallback-Werte definieren
```typescript
const getPatientStatus = (patient: any) => {
  return patient.dbStatus || 'active'
}

const getPrescriberName = (prescription: any) => {
  return prescription.prescriber?.name || 'Unknown Prescriber'
}
```

## 3. API-Fehlerbehandlung

### Konsistente Fehlerantworten
```typescript
function createErrorResponse(error: any, context: string) {
  console.error(`${context}:`, error)
  
  if (error.code === 400) {
    return NextResponse.json({
      error: 'Invalid request data',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    }, { status: 400 })
  }
  
  if (error.code === 404) {
    return NextResponse.json({
      error: 'Resource not found'
    }, { status: 404 })
  }
  
  return NextResponse.json({
    error: 'Internal server error',
    details: process.env.NODE_ENV === 'development' ? error.message : undefined
  }, { status: 500 })
}
```

## 4. Datenbank-Beziehungen validieren

### Vor dem Löschen prüfen
```typescript
async function checkRelatedData(entityId: string, entityType: string) {
  const relatedCollections = getRelatedCollections(entityType)
  const relatedData = {}
  
  for (const collection of relatedCollections) {
    try {
      const result = await databases.listDocuments(
        APPWRITE_DATABASE_ID,
        collection,
        [queryHelpers.equal(`${entityType}Id`, entityId)]
      )
      relatedData[collection] = result.documents
    } catch (error) {
      console.warn(`Could not check ${collection} for ${entityType}:`, entityId)
      relatedData[collection] = []
    }
  }
  
  return relatedData
}
```

## 5. Frontend-Fehlerbehandlung

### Graceful Degradation
```typescript
// Komponenten sollten auch ohne Daten funktionieren
function PatientCard({ patient }: { patient: Patient | null }) {
  if (!patient) {
    return <div className="p-4 border rounded-lg">Patient not found</div>
  }
  
  return (
    <div className="p-4 border rounded-lg">
      <h3>{patient.firstName} {patient.lastName}</h3>
      <p>Status: {getPatientStatus(patient)}</p>
      {/* Weitere Felder mit Fallbacks */}
    </div>
  )
}
```

## 6. Entwicklung vs. Produktion

### Unterschiedliche Fehlerbehandlung
```typescript
const isDevelopment = process.env.NODE_ENV === 'development'

function logError(error: any, context: string) {
  if (isDevelopment) {
    console.error(`${context}:`, error)
    console.trace() // Stack trace in Entwicklung
  } else {
    console.error(`${context}:`, error.message) // Nur Nachricht in Produktion
  }
}
```

