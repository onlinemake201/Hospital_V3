# Appwrite Cloud Umgebungsvariablen Konfiguration

## Problem
Die App läuft auf Appwrite Cloud, aber die Umgebungsvariablen sind nicht korrekt konfiguriert, was zu `UntrustedHost` Fehlern führt.

## Lösung

### 1. Appwrite Cloud Console öffnen
- Gehen Sie zu: https://cloud.appwrite.io/
- Melden Sie sich an
- Wählen Sie Ihr Projekt: `Hospital_V1`

### 2. Umgebungsvariablen hinzufügen
Gehen Sie zu: `Functions` → `Hospital_V1` → `Settings` → `Environment Variables`

Fügen Sie diese Variablen hinzu:

```bash
NEXTAUTH_URL=https://hospital-v1.appwrite.network
NEXTAUTH_SECRET=your-secret-key-change-this-in-production
NODE_ENV=production
```

### 3. Function neu deployen
- Gehen Sie zu: `Functions` → `Hospital_V1` → `Deployments`
- Klicken Sie auf: `Create Deployment`
- Warten Sie bis das Deployment abgeschlossen ist

### 4. Code-Änderungen
Die hardcoded URLs wurden bereits entfernt und durch dynamische URLs ersetzt:
- ✅ `src/app/(protected)/prescriptions/page.tsx`
- ✅ `src/app/(protected)/billing/page.tsx`
- ✅ `src/app/(protected)/admin/page.tsx`
- ✅ `src/lib/url-utils.ts` (neue Helper-Funktion)

### 5. Testen
Nach dem Deployment sollte die App korrekt funktionieren:
- ✅ Keine `UntrustedHost` Fehler mehr
- ✅ Korrekte URL-Auflösung für alle API-Calls
- ✅ Funktionsfähige Authentifizierung

## Alternative: Lokale Entwicklung
Falls Sie lokal entwickeln möchten:
```bash
npm run dev
# Öffnen Sie: http://localhost:3000
```
