'use client'

import { useState } from 'react'
import Link from 'next/link'
import { 
  ArrowLeft, Calendar, Users, Pill, FileText, BarChart3, Activity, Heart,
  ArrowRight, Search, Plus, Edit, Trash2, Eye, Clock, CheckCircle, AlertCircle,
  TrendingUp, DollarSign, Package, Stethoscope, Phone, Mail, MapPin,
  ChevronRight, ChevronLeft, Home, Settings, Bell, User, LogOut, Menu, X
} from 'lucide-react'
import {
  DashboardView,
  PatientsView,
  PatientDetailView,
  AppointmentsView,
  MedicationsView,
  MedicationDetailView,
  InventoryView,
  BillingView
} from './components'

export default function DemoPage() {
  const [currentView, setCurrentView] = useState('dashboard')
  const [selectedPatient, setSelectedPatient] = useState(null)
  const [selectedMedication, setSelectedMedication] = useState(null)
  const [isTransitioning, setIsTransitioning] = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  // Demo Data
  const patients = [
    {
      id: 1, name: "Sarah Johnson", age: 34, gender: "Female",
      phone: "+1 (555) 123-4567", email: "sarah.johnson@email.com",
      address: "123 Main St, New York, NY", medicalHistory: ["Hypertension", "Diabetes Type 2"],
      lastVisit: "2024-01-15", nextAppointment: "2024-02-15", status: "Active"
    },
    {
      id: 2, name: "Michael Chen", age: 28, gender: "Male",
      phone: "+1 (555) 234-5678", email: "michael.chen@email.com",
      address: "456 Oak Ave, Los Angeles, CA", medicalHistory: ["Asthma", "Allergies"],
      lastVisit: "2024-01-10", nextAppointment: "2024-02-20", status: "Active"
    },
    {
      id: 3, name: "Emily Rodriguez", age: 45, gender: "Female",
      phone: "+1 (555) 345-6789", email: "emily.rodriguez@email.com",
      address: "789 Pine St, Chicago, IL", medicalHistory: ["Arthritis", "High Cholesterol"],
      lastVisit: "2024-01-08", nextAppointment: "2024-02-18", status: "Active"
    }
  ]

  const medications = [
    {
      id: 1, name: "Metformin", dosage: "500mg", type: "Tablet",
      stock: 150, minStock: 50, expiryDate: "2025-06-15",
      supplier: "MedSupply Inc", price: 25.99, status: "In Stock"
    },
    {
      id: 2, name: "Lisinopril", dosage: "10mg", type: "Tablet",
      stock: 89, minStock: 30, expiryDate: "2024-12-20",
      supplier: "PharmaCorp", price: 18.50, status: "In Stock"
    },
    {
      id: 3, name: "Albuterol", dosage: "90mcg", type: "Inhaler",
      stock: 12, minStock: 20, expiryDate: "2024-08-10",
      supplier: "Respiratory Meds", price: 45.00, status: "Low Stock"
    }
  ]

  const appointments = [
    {
      id: 1, patient: "Sarah Johnson", doctor: "Dr. Smith",
      date: "2024-02-15", time: "10:00 AM", type: "Follow-up",
      room: "Room 101", status: "Scheduled"
    },
    {
      id: 2, patient: "Michael Chen", doctor: "Dr. Johnson",
      date: "2024-02-20", time: "2:30 PM", type: "Consultation",
      room: "Room 205", status: "Scheduled"
    },
    {
      id: 3, patient: "Emily Rodriguez", doctor: "Dr. Williams",
      date: "2024-02-18", time: "11:15 AM", type: "Check-up",
      room: "Room 103", status: "Scheduled"
    }
  ]

  const handleViewChange = (view) => {
    setIsTransitioning(true)
    setTimeout(() => {
      setCurrentView(view)
      setIsTransitioning(false)
    }, 300)
  }

  const handlePatientSelect = (patient) => {
    setSelectedPatient(patient)
    handleViewChange('patient-detail')
  }

  const handleMedicationSelect = (medication) => {
    setSelectedMedication(medication)
    handleViewChange('medication-detail')
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 text-white overflow-hidden">
      {/* Mobile Navigation */}
      <nav className="fixed top-0 w-full z-50 bg-black/20 backdrop-blur-md border-b border-white/10">
        <div className="container mx-auto px-3 sm:px-4 py-3 sm:py-4">
          <div className="flex items-center justify-between">
            <Link href="/" className="flex items-center gap-2 sm:gap-3 text-white hover:text-blue-400 transition-colors">
              <ArrowLeft className="w-4 h-4 sm:w-5 sm:h-5" />
              <span className="font-semibold text-sm sm:text-base">Back to Home</span>
            </Link>
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 sm:w-8 sm:h-8 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg flex items-center justify-center">
                <Heart className="w-3 h-3 sm:w-5 sm:h-5 text-white" />
              </div>
              <span className="text-sm sm:text-xl font-bold hidden xs:block">Hospital Management Demo</span>
              <span className="text-sm font-bold xs:hidden">Demo</span>
            </div>
          </div>
        </div>
      </nav>

      {/* Mobile Menu Button */}
      <div className="fixed top-16 left-4 z-40 lg:hidden">
        <button 
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="w-12 h-12 bg-black/30 backdrop-blur-md rounded-xl border border-white/20 flex items-center justify-center text-white hover:bg-white/10 transition-all"
        >
          <Menu className="w-6 h-6" />
        </button>
      </div>

      {/* Mobile Sidebar Overlay */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-30 lg:hidden">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setMobileMenuOpen(false)}></div>
          <div className="absolute top-0 left-0 w-80 max-w-[85vw] h-full bg-black/40 backdrop-blur-md border-r border-white/20 p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-bold text-white">Navigation</h2>
              <button 
                onClick={() => setMobileMenuOpen(false)}
                className="w-8 h-8 bg-white/10 rounded-lg flex items-center justify-center text-white hover:bg-white/20 transition-all"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="space-y-3">
              <button 
                onClick={() => { handleViewChange('dashboard'); setMobileMenuOpen(false); }} 
                className={`w-full flex items-center gap-3 p-3 rounded-xl transition-all ${currentView === 'dashboard' ? 'bg-blue-500/20 text-blue-400' : 'hover:bg-white/10'}`}
              >
                <Home className="w-5 h-5" />
                Dashboard
              </button>
              <button 
                onClick={() => { handleViewChange('patients'); setMobileMenuOpen(false); }} 
                className={`w-full flex items-center gap-3 p-3 rounded-xl transition-all ${currentView === 'patients' || currentView === 'patient-detail' ? 'bg-blue-500/20 text-blue-400' : 'hover:bg-white/10'}`}
              >
                <Users className="w-5 h-5" />
                Patients
              </button>
              <button 
                onClick={() => { handleViewChange('appointments'); setMobileMenuOpen(false); }} 
                className={`w-full flex items-center gap-3 p-3 rounded-xl transition-all ${currentView === 'appointments' ? 'bg-blue-500/20 text-blue-400' : 'hover:bg-white/10'}`}
              >
                <Calendar className="w-5 h-5" />
                Appointments
              </button>
              <button 
                onClick={() => { handleViewChange('medications'); setMobileMenuOpen(false); }} 
                className={`w-full flex items-center gap-3 p-3 rounded-xl transition-all ${currentView === 'medications' || currentView === 'medication-detail' ? 'bg-blue-500/20 text-blue-400' : 'hover:bg-white/10'}`}
              >
                <Pill className="w-5 h-5" />
                Medications
              </button>
              <button 
                onClick={() => { handleViewChange('inventory'); setMobileMenuOpen(false); }} 
                className={`w-full flex items-center gap-3 p-3 rounded-xl transition-all ${currentView === 'inventory' ? 'bg-blue-500/20 text-blue-400' : 'hover:bg-white/10'}`}
              >
                <Package className="w-5 h-5" />
                Inventory
              </button>
              <button 
                onClick={() => { handleViewChange('billing'); setMobileMenuOpen(false); }} 
                className={`w-full flex items-center gap-3 p-3 rounded-xl transition-all ${currentView === 'billing' ? 'bg-blue-500/20 text-blue-400' : 'hover:bg-white/10'}`}
              >
                <DollarSign className="w-5 h-5" />
                Billing
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="pt-16 sm:pt-20 flex h-screen">
        {/* Desktop Sidebar Navigation */}
        <div className="hidden lg:block w-64 bg-black/30 backdrop-blur-md border-r border-white/20 p-6">
          <div className="space-y-4">
            <button
              onClick={() => handleViewChange('dashboard')}
              className={`w-full flex items-center gap-3 p-3 rounded-xl transition-all ${
                currentView === 'dashboard' ? 'bg-blue-500/20 text-blue-400' : 'hover:bg-white/10'
              }`}
            >
              <Home className="w-5 h-5" />
              Dashboard
            </button>
            <button
              onClick={() => handleViewChange('patients')}
              className={`w-full flex items-center gap-3 p-3 rounded-xl transition-all ${
                currentView === 'patients' ? 'bg-green-500/20 text-green-400' : 'hover:bg-white/10'
              }`}
            >
              <Users className="w-5 h-5" />
              Patients
            </button>
            <button
              onClick={() => handleViewChange('appointments')}
              className={`w-full flex items-center gap-3 p-3 rounded-xl transition-all ${
                currentView === 'appointments' ? 'bg-purple-500/20 text-purple-400' : 'hover:bg-white/10'
              }`}
            >
              <Calendar className="w-5 h-5" />
              Appointments
            </button>
            <button
              onClick={() => handleViewChange('medications')}
              className={`w-full flex items-center gap-3 p-3 rounded-xl transition-all ${
                currentView === 'medications' ? 'bg-orange-500/20 text-orange-400' : 'hover:bg-white/10'
              }`}
            >
              <Pill className="w-5 h-5" />
              Medications
            </button>
            <button
              onClick={() => handleViewChange('inventory')}
              className={`w-full flex items-center gap-3 p-3 rounded-xl transition-all ${
                currentView === 'inventory' ? 'bg-indigo-500/20 text-indigo-400' : 'hover:bg-white/10'
              }`}
            >
              <Package className="w-5 h-5" />
              Inventory
            </button>
            <button
              onClick={() => handleViewChange('billing')}
              className={`w-full flex items-center gap-3 p-3 rounded-xl transition-all ${
                currentView === 'billing' ? 'bg-pink-500/20 text-pink-400' : 'hover:bg-white/10'
              }`}
            >
              <DollarSign className="w-5 h-5" />
              Billing
            </button>
          </div>
        </div>

        {/* Main Content Area */}
        <div className="flex-1 p-3 sm:p-6 overflow-auto">
          <div className={`transition-all duration-300 ${isTransitioning ? 'opacity-0 scale-95' : 'opacity-100 scale-100'}`}>
            {currentView === 'dashboard' && <DashboardView />}
            {currentView === 'patients' && <PatientsView patients={patients} onPatientSelect={handlePatientSelect} />}
            {currentView === 'patient-detail' && <PatientDetailView patient={selectedPatient} onBack={() => handleViewChange('patients')} />}
            {currentView === 'appointments' && <AppointmentsView appointments={appointments} />}
            {currentView === 'medications' && <MedicationsView medications={medications} onMedicationSelect={handleMedicationSelect} />}
            {currentView === 'medication-detail' && <MedicationDetailView medication={selectedMedication} onBack={() => handleViewChange('medications')} />}
            {currentView === 'inventory' && <InventoryView medications={medications} />}
            {currentView === 'billing' && <BillingView />}
          </div>
        </div>
      </div>

      {/* Background Effects */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-32 h-32 sm:w-64 sm:h-64 bg-blue-500/10 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-1/4 right-1/4 w-48 h-48 sm:w-96 sm:h-96 bg-purple-500/10 rounded-full blur-3xl animate-pulse"></div>
      </div>
    </div>
  )
}
