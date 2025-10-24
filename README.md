# Hospital Management System

A modern, comprehensive hospital management system built with Next.js 14, TypeScript, and Appwrite. Features real-time updates, responsive design, and complete hospital workflow management.

## ✨ Key Features

- **🏥 Patient Management**: Complete patient records with medical history and prescriptions
- **📅 Appointment Scheduling**: Manage appointments with providers and room assignments
- **💊 Prescription Management**: Digital prescriptions with medication tracking and invoice conversion
- **📦 Inventory Management**: Medication stock tracking with batch management and alerts
- **💰 Billing System**: Invoice generation, payment tracking, and PDF export
- **👥 User Management**: Role-based access control with admin panel
- **📊 Real-time Dashboard**: Live system overview with statistics and monitoring
- **🎨 Modern UI**: Responsive design with dark/light theme support
- **⚡ Real-time Updates**: Instant company name updates and live data synchronization

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

## 🚀 Quick Start

1. **Clone the repository**
```bash
git clone <repository-url>
cd hospital-management-system
```

2. **Install dependencies**
```bash
npm install
```

3. **Set up environment variables**
   ```bash
   cp ENV.sample .env.local
   ```
   
   The `.env.local` file contains pre-configured Appwrite settings. The application uses a pre-configured Appwrite instance.

4. **Run the development server**
```bash
npm run dev
```

5. **Open your browser**
   Navigate to [http://localhost:3000](http://localhost:3000)

## 🔐 Default Login

The application comes with a pre-configured admin user:
- **Email**: `admin@hospital.ch`
- **Password**: `password`

## 🎯 System Status

✅ **Ready to use!**

The application uses a pre-configured Appwrite instance with all necessary databases and collections. All dependencies are installed and environment variables are configured.

### Available Roles

The system includes the following standard roles:
- **Admin**: Full system access
- **Doctor**: Medical staff with patient and prescription access
- **Nurse**: Nursing staff with limited patient access
- **Receptionist**: Front desk staff for appointments and patients

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