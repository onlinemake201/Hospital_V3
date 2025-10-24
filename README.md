# Hospital Management System

A comprehensive hospital management system built with Next.js 14, TypeScript, and Appwrite.

## Features

- **Patient Management**: Complete patient records with medical history
- **Appointment Scheduling**: Manage appointments and room assignments
- **Prescription Management**: Digital prescriptions with medication tracking
- **Inventory Management**: Medication stock tracking with batch management
- **Billing System**: Invoice generation and payment tracking
- **Contact Management**: Supplier and contact information
- **Role-Based Access Control**: Secure user management with permissions
- **Dashboard**: Real-time system overview and statistics

## Tech Stack

- **Frontend**: Next.js 14, React, TypeScript, Tailwind CSS
- **Backend**: Appwrite (Database, Authentication, Storage)
- **Authentication**: NextAuth.js with Appwrite integration
- **UI Components**: Custom components with accessibility features
- **State Management**: React hooks and context
- **Form Handling**: React Hook Form with Zod validation

## Prerequisites

- Node.js 18+ 
- Appwrite account and project
- Git

## Installation

1. **Clone the repository**
```bash
git clone <repository-url>
cd Hospital_V1
```

2. **Install dependencies**
```bash
npm install
```

3. **Set up environment variables**
   ```bash
   cp ENV.sample .env.local
   ```
   
   Die `.env.local` Datei ist bereits mit den notwendigen Appwrite-Konfigurationen vorbereitet. Die Anwendung verwendet eine vorkonfigurierte Appwrite-Instanz.

4. **Database seeding (optional)**
   ```bash
   npx tsx prisma/seed.ts
   ```
   
   Dies erstellt Standard-Rollen, System-Einstellungen und einen Admin-Benutzer.

5. **Run the development server**
```bash
npm run dev
```

6. **Open your browser**
   Navigate to [http://localhost:3000](http://localhost:3000)

## Standard-Login

Die Anwendung ist bereits mit einem Standard-Admin-Benutzer konfiguriert:
- **Email**: `admin@hospital.ch`
- **Password**: `password`

## System-Status

✅ **Die Anwendung ist startbereit!**

Die Anwendung verwendet eine vorkonfigurierte Appwrite-Instanz mit allen notwendigen Datenbanken und Sammlungen. Alle Abhängigkeiten sind installiert und die Umgebungsvariablen sind konfiguriert.

### Verfügbare Rollen

Das System enthält folgende Standard-Rollen:
- **Admin**: Vollzugriff auf das System
- **Doctor**: Medizinisches Personal mit Patienten- und Rezeptzugriff
- **Nurse**: Pflegepersonal mit eingeschränktem Patienten-Zugriff
- **Receptionist**: Empfangspersonal für Termine und Patienten

## Project Structure

```
src/
├── app/                    # Next.js app directory
│   ├── (auth)/            # Authentication pages
│   ├── (protected)/       # Protected application pages
│   │   ├── admin/        # Admin management
│   │   ├── appointments/ # Appointment management
│   │   ├── billing/      # Billing and invoicing
│   │   ├── contacts/     # Contact management
│   │   ├── dashboard/    # System dashboard
│   │   ├── inventory/   # Medication inventory
│   │   ├── patients/    # Patient management
│   │   └── prescriptions/ # Prescription management
│   └── api/              # API routes
├── components/            # Reusable UI components
├── lib/                   # Utility functions and configurations
│   ├── appwrite.ts       # Appwrite client configuration
│   ├── appwrite-users.ts  # User management utilities
│   ├── auth-guards.ts    # Authentication guards
│   ├── rbac.ts          # Role-based access control
│   └── system-settings.ts # System settings management
└── styles/               # Global styles
```

## Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint
- `npm run type-check` - Run TypeScript type checking

## Key Features

### Patient Management
- Complete patient profiles with medical history
- Patient search and filtering
- Medical record tracking
- Contact information management

### Appointment System
- Schedule appointments with providers
- Room assignment and management
- Appointment status tracking
- Calendar integration

### Prescription Management
- Digital prescription creation
- Medication tracking and dosage
- Prescription history
- Integration with inventory system

### Inventory Management
- Medication stock tracking
- Batch and expiry date management
- Low stock alerts
- Supplier management

### Billing System
- Invoice generation
- Payment tracking
- Financial reporting
- Currency support

### Security
- Role-based access control
- Secure authentication
- Audit logging
- Data encryption

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

This project is licensed under the MIT License.

## Support

For support and questions, please open an issue in the repository.