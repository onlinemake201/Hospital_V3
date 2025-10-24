# Appwrite Integration Setup

## 🚀 Appwrite-Konfiguration

Dein Krankenhaus-Management-System wurde erfolgreich mit Appwrite integriert! Hier sind die nächsten Schritte:

### 1. Appwrite-Projekt einrichten

1. Gehe zu [Appwrite Cloud](https://cloud.appwrite.io)
2. Erstelle ein neues Projekt
3. Notiere deine **Project ID**

### 2. Umgebungsvariablen konfigurieren

Erstelle eine `.env` Datei im Projektverzeichnis mit folgenden Werten:

```env
# Appwrite Configuration
APPWRITE_ENDPOINT="https://cloud.appwrite.io/v1"
APPWRITE_PROJECT_ID="deine-project-id"
APPWRITE_DATABASE_ID="hospital_main"
APPWRITE_API_KEY="dein-api-key"

# Appwrite Collections (bereits konfiguriert)
APPWRITE_COLLECTION_USERS="users"
APPWRITE_COLLECTION_ROLES="roles"
APPWRITE_COLLECTION_PATIENTS="patients"
APPWRITE_COLLECTION_APPOINTMENTS="appointments"
APPWRITE_COLLECTION_MEDICATIONS="medications"
APPWRITE_COLLECTION_BATCHES="batches"
APPWRITE_COLLECTION_PRESCRIPTIONS="prescriptions"
APPWRITE_COLLECTION_PRESCRIPTION_ITEMS="prescription_items"
APPWRITE_COLLECTION_ADMINISTRATIONS="administrations"
APPWRITE_COLLECTION_INVOICES="invoices"
APPWRITE_COLLECTION_PAYMENTS="payments"
APPWRITE_COLLECTION_CONTACTS="contacts"
APPWRITE_COLLECTION_SUPPLIERS="suppliers"
APPWRITE_COLLECTION_AUDIT_LOGS="audit_logs"
APPWRITE_COLLECTION_CUSTOM_FIELDS="custom_fields"
APPWRITE_COLLECTION_SYSTEM_SETTINGS="system_settings"
APPWRITE_COLLECTION_ENCOUNTERS="encounters"
APPWRITE_COLLECTION_STOCK_MOVEMENTS="stock_movements"

# Next.js
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="change-me"
```

### 3. API-Key erstellen

1. Gehe zu deinem Appwrite-Projekt
2. Navigiere zu **Settings** → **API Keys**
3. Erstelle einen neuen API-Key mit folgenden Berechtigungen:
   - **Databases**: Read, Write, Delete
   - **Users**: Read, Write, Delete
4. Kopiere den API-Key in deine `.env` Datei

### 4. Datenbank und Collections

Die folgenden Collections wurden bereits in deiner Appwrite-Datenbank erstellt:

- ✅ **users** - Benutzer mit Rollen
- ✅ **roles** - RBAC-Rollen mit Berechtigungen
- ✅ **patients** - Patientendaten
- ✅ **appointments** - Termine
- ✅ **medications** - Medikamente
- ✅ **batches** - Medikamenten-Chargen
- ✅ **prescriptions** - Rezepte
- ✅ **prescription_items** - Rezept-Items
- ✅ **administrations** - Medikamenten-Verabreichungen
- ✅ **invoices** - Rechnungen
- ✅ **payments** - Zahlungen
- ✅ **contacts** - Kontakte
- ✅ **suppliers** - Lieferanten
- ✅ **audit_logs** - Audit-Logs
- ✅ **custom_fields** - Benutzerdefinierte Felder
- ✅ **system_settings** - System-Einstellungen
- ✅ **encounters** - Patientenaufenthalte
- ✅ **stock_movements** - Lagerbewegungen

### 5. Standard-Benutzer

Ein Admin-Benutzer wurde bereits erstellt:
- **Email**: `admin@hospital.com`
- **Passwort**: `admin123`
- **Rolle**: Admin (Vollzugriff)

### 6. Standard-Rollen

Die folgenden Rollen wurden erstellt:

- **Admin**: Vollzugriff auf alle Bereiche
- **Doctor**: Patienten, Termine, Rezepte (Lesen/Schreiben)
- **Nurse**: Patienten (Lesen), Termine (Lesen/Schreiben)
- **Pharmacy**: Medikamente, Rezepte, Chargen
- **Billing**: Rechnungen und Zahlungen

### 7. Anwendung starten

```bash
npm run dev
```

Die Anwendung läuft dann auf `http://localhost:3000`

### 8. Login testen

1. Gehe zu `http://localhost:3000/sign-in`
2. Logge dich mit `admin@hospital.com` / `admin123` ein
3. Du solltest das Dashboard mit echten Daten sehen

## 🔧 Technische Details

### Was wurde geändert:

1. **Appwrite SDK** installiert
2. **Auth-System** auf Appwrite umgestellt (NextAuth bleibt, aber Backend ist Appwrite)
3. **API-Routen** auf Appwrite Database umgestellt
4. **RBAC-System** mit Appwrite implementiert
5. **Dashboard** zeigt echte Daten von Appwrite

### Neue Dateien:

- `src/lib/appwrite.ts` - Appwrite-Client-Konfiguration
- `src/lib/rbac.ts` - RBAC-System für Appwrite
- Aktualisierte API-Routen für Patienten und Benutzer
- Aktualisierte Dashboard-Seite mit echten Daten

### Features die funktionieren:

- ✅ Login/Logout mit Appwrite
- ✅ RBAC-Berechtigungen
- ✅ Patienten-Verwaltung
- ✅ Benutzer-Verwaltung
- ✅ Dashboard mit echten Daten
- ✅ Rollen-basierte Zugriffskontrolle

## 🚨 Wichtige Hinweise

1. **Sicherheit**: Ändere das `NEXTAUTH_SECRET` in der `.env` Datei
2. **API-Key**: Bewahre deinen Appwrite API-Key sicher auf
3. **Backup**: Regelmäßige Backups der Appwrite-Datenbank empfohlen
4. **Updates**: Halte die Appwrite SDK aktuell

## 📞 Support

Bei Problemen:
1. Überprüfe die Browser-Konsole auf Fehler
2. Überprüfe die Server-Logs
3. Stelle sicher, dass alle Umgebungsvariablen korrekt gesetzt sind
4. Überprüfe die Appwrite-Projekt-Konfiguration

Viel Erfolg mit deinem Krankenhaus-Management-System! 🏥
