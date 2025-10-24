'use client'

import { 
  Users, Calendar, Pill, Package, DollarSign, TrendingUp, 
  Clock, CheckCircle, AlertCircle, Plus, Search, Eye, Edit,
  Phone, Mail, MapPin, Stethoscope, ChevronLeft, BarChart3,
  Activity, Heart, Bell, User, ArrowRight, FileText
} from 'lucide-react'

// Dashboard View
export function DashboardView() {
  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
          Dashboard
        </h1>
        <div className="flex items-center gap-2 sm:gap-4">
          <Bell className="w-5 h-5 sm:w-6 sm:h-6 text-gray-400" />
          <User className="w-5 h-5 sm:w-6 sm:h-6 text-gray-400" />
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        <div className="bg-gradient-to-br from-blue-500/20 to-blue-600/20 backdrop-blur-md rounded-2xl p-4 sm:p-6 border border-blue-500/30">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-blue-300 text-xs sm:text-sm">Total Patients</p>
              <p className="text-2xl sm:text-3xl font-bold text-white">1,247</p>
            </div>
            <Users className="w-8 h-8 sm:w-12 sm:h-12 text-blue-400" />
          </div>
          <div className="flex items-center gap-2 mt-3 sm:mt-4">
            <TrendingUp className="w-3 h-3 sm:w-4 sm:h-4 text-green-400" />
            <span className="text-green-400 text-xs sm:text-sm">+12% this month</span>
          </div>
        </div>

        <div className="bg-gradient-to-br from-green-500/20 to-green-600/20 backdrop-blur-md rounded-2xl p-4 sm:p-6 border border-green-500/30">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-green-300 text-xs sm:text-sm">Today's Appointments</p>
              <p className="text-2xl sm:text-3xl font-bold text-white">23</p>
            </div>
            <Calendar className="w-8 h-8 sm:w-12 sm:h-12 text-green-400" />
          </div>
          <div className="flex items-center gap-2 mt-3 sm:mt-4">
            <Clock className="w-3 h-3 sm:w-4 sm:h-4 text-yellow-400" />
            <span className="text-yellow-400 text-xs sm:text-sm">3 pending</span>
          </div>
        </div>

        <div className="bg-gradient-to-br from-purple-500/20 to-purple-600/20 backdrop-blur-md rounded-2xl p-4 sm:p-6 border border-purple-500/30">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-purple-300 text-xs sm:text-sm">Medications</p>
              <p className="text-2xl sm:text-3xl font-bold text-white">156</p>
            </div>
            <Pill className="w-8 h-8 sm:w-12 sm:h-12 text-purple-400" />
          </div>
          <div className="flex items-center gap-2 mt-3 sm:mt-4">
            <AlertCircle className="w-3 h-3 sm:w-4 sm:h-4 text-red-400" />
            <span className="text-red-400 text-xs sm:text-sm">5 low stock</span>
          </div>
        </div>

        <div className="bg-gradient-to-br from-orange-500/20 to-orange-600/20 backdrop-blur-md rounded-2xl p-4 sm:p-6 border border-orange-500/30">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-orange-300 text-xs sm:text-sm">Monthly Revenue</p>
              <p className="text-2xl sm:text-3xl font-bold text-white">$45,230</p>
            </div>
            <DollarSign className="w-8 h-8 sm:w-12 sm:h-12 text-orange-400" />
          </div>
          <div className="flex items-center gap-2 mt-3 sm:mt-4">
            <TrendingUp className="w-3 h-3 sm:w-4 sm:h-4 text-green-400" />
            <span className="text-green-400 text-xs sm:text-sm">+8% this month</span>
          </div>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="bg-black/40 backdrop-blur-md rounded-2xl p-6 border border-white/20">
        <h2 className="text-xl font-bold mb-4 text-white">Recent Activity</h2>
        <div className="space-y-4">
          <div className="flex items-center gap-4 p-4 bg-white/5 rounded-xl">
            <div className="w-10 h-10 bg-blue-500/20 rounded-full flex items-center justify-center">
              <Users className="w-5 h-5 text-blue-400" />
            </div>
            <div className="flex-1">
              <p className="text-white font-medium">New patient registered</p>
              <p className="text-gray-400 text-sm">Sarah Johnson - 2 hours ago</p>
            </div>
            <CheckCircle className="w-5 h-5 text-green-400" />
          </div>
          
          <div className="flex items-center gap-4 p-4 bg-white/5 rounded-xl">
            <div className="w-10 h-10 bg-green-500/20 rounded-full flex items-center justify-center">
              <Calendar className="w-5 h-5 text-green-400" />
            </div>
            <div className="flex-1">
              <p className="text-white font-medium">Appointment completed</p>
              <p className="text-gray-400 text-sm">Michael Chen - Dr. Smith - 4 hours ago</p>
            </div>
            <CheckCircle className="w-5 h-5 text-green-400" />
          </div>

          <div className="flex items-center gap-4 p-4 bg-white/5 rounded-xl">
            <div className="w-10 h-10 bg-red-500/20 rounded-full flex items-center justify-center">
              <AlertCircle className="w-5 h-5 text-red-400" />
            </div>
            <div className="flex-1">
              <p className="text-white font-medium">Low stock alert</p>
              <p className="text-gray-400 text-sm">Albuterol inhaler - 6 hours ago</p>
            </div>
            <AlertCircle className="w-5 h-5 text-red-400" />
          </div>
        </div>
      </div>
    </div>
  )
}

// Patients View
export function PatientsView({ patients, onPatientSelect }) {
  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <h1 className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-green-400 to-blue-400 bg-clip-text text-transparent">
          Patients
        </h1>
        <button className="w-full sm:w-auto flex items-center justify-center gap-2 px-4 py-2 bg-green-500 hover:bg-green-600 rounded-xl transition-colors">
          <Plus className="w-4 h-4 sm:w-5 sm:h-5" />
          <span className="text-sm sm:text-base">Add Patient</span>
        </button>
      </div>

      {/* Search Bar */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
        <input
          type="text"
          placeholder="Search patients..."
          className="w-full pl-10 pr-4 py-3 bg-black/40 backdrop-blur-md border border-white/20 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:border-green-400"
        />
      </div>

      {/* Patients Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
        {patients.map((patient) => (
          <div
            key={patient.id}
            onClick={() => onPatientSelect(patient)}
            className="bg-black/40 backdrop-blur-md rounded-2xl p-4 sm:p-6 border border-white/20 hover:border-green-400/50 transition-all cursor-pointer group hover:scale-105"
          >
            <div className="flex items-center gap-3 sm:gap-4 mb-3 sm:mb-4">
              <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-r from-green-500 to-blue-500 rounded-full flex items-center justify-center">
                <User className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-base sm:text-lg font-bold text-white truncate">{patient.name}</h3>
                <p className="text-gray-400 text-xs sm:text-sm">{patient.age} years old • {patient.gender}</p>
              </div>
            </div>
            
            <div className="space-y-2 mb-3 sm:mb-4">
              <div className="flex items-center gap-2 text-xs sm:text-sm text-gray-300">
                <Phone className="w-3 h-3 sm:w-4 sm:h-4 flex-shrink-0" />
                <span className="truncate">{patient.phone}</span>
              </div>
              <div className="flex items-center gap-2 text-xs sm:text-sm text-gray-300">
                <Mail className="w-3 h-3 sm:w-4 sm:h-4 flex-shrink-0" />
                <span className="truncate">{patient.email}</span>
              </div>
              <div className="flex items-center gap-2 text-xs sm:text-sm text-gray-300">
                <MapPin className="w-3 h-3 sm:w-4 sm:h-4 flex-shrink-0" />
                <span className="truncate">{patient.address}</span>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className={`w-2 h-2 rounded-full ${patient.status === 'Active' ? 'bg-green-400' : 'bg-gray-400'}`}></div>
                <span className="text-sm text-gray-300">{patient.status}</span>
              </div>
              <ArrowRight className="w-5 h-5 text-gray-400 group-hover:text-green-400 transition-colors" />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

// Patient Detail View
export function PatientDetailView({ patient, onBack }) {
  if (!patient) return null

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <button
          onClick={onBack}
          className="flex items-center gap-2 px-4 py-2 bg-gray-600 hover:bg-gray-500 rounded-xl transition-colors"
        >
          <ChevronLeft className="w-5 h-5" />
          Back
        </button>
        <h1 className="text-3xl font-bold bg-gradient-to-r from-green-400 to-blue-400 bg-clip-text text-transparent">
          {patient.name}
        </h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Patient Info */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-black/40 backdrop-blur-md rounded-2xl p-6 border border-white/20">
            <h2 className="text-xl font-bold mb-4 text-white">Patient Information</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-gray-400 text-sm">Full Name</label>
                <p className="text-white font-medium">{patient.name}</p>
              </div>
              <div>
                <label className="text-gray-400 text-sm">Age</label>
                <p className="text-white font-medium">{patient.age} years old</p>
              </div>
              <div>
                <label className="text-gray-400 text-sm">Gender</label>
                <p className="text-white font-medium">{patient.gender}</p>
              </div>
              <div>
                <label className="text-gray-400 text-sm">Status</label>
                <p className="text-white font-medium">{patient.status}</p>
              </div>
              <div>
                <label className="text-gray-400 text-sm">Phone</label>
                <p className="text-white font-medium">{patient.phone}</p>
              </div>
              <div>
                <label className="text-gray-400 text-sm">Email</label>
                <p className="text-white font-medium">{patient.email}</p>
              </div>
              <div className="md:col-span-2">
                <label className="text-gray-400 text-sm">Address</label>
                <p className="text-white font-medium">{patient.address}</p>
              </div>
            </div>
          </div>

          <div className="bg-black/40 backdrop-blur-md rounded-2xl p-6 border border-white/20">
            <h2 className="text-xl font-bold mb-4 text-white">Medical History</h2>
            <div className="space-y-2">
              {patient.medicalHistory.map((condition, index) => (
                <div key={index} className="flex items-center gap-2 p-3 bg-white/5 rounded-xl">
                  <Stethoscope className="w-5 h-5 text-blue-400" />
                  <span className="text-white">{condition}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="space-y-6">
          <div className="bg-black/40 backdrop-blur-md rounded-2xl p-6 border border-white/20">
            <h2 className="text-xl font-bold mb-4 text-white">Quick Actions</h2>
            <div className="space-y-3">
              <button className="w-full flex items-center gap-3 p-3 bg-blue-500/20 hover:bg-blue-500/30 rounded-xl transition-colors">
                <Calendar className="w-5 h-5 text-blue-400" />
                <span className="text-white">Schedule Appointment</span>
              </button>
              <button className="w-full flex items-center gap-3 p-3 bg-purple-500/20 hover:bg-purple-500/30 rounded-xl transition-colors">
                <Pill className="w-5 h-5 text-purple-400" />
                <span className="text-white">Create Prescription</span>
              </button>
              <button className="w-full flex items-center gap-3 p-3 bg-green-500/20 hover:bg-green-500/30 rounded-xl transition-colors">
                <Edit className="w-5 h-5 text-green-400" />
                <span className="text-white">Edit Patient</span>
              </button>
            </div>
          </div>

          <div className="bg-black/40 backdrop-blur-md rounded-2xl p-6 border border-white/20">
            <h2 className="text-xl font-bold mb-4 text-white">Appointments</h2>
            <div className="space-y-3">
              <div className="p-3 bg-white/5 rounded-xl">
                <p className="text-white font-medium">Last Visit</p>
                <p className="text-gray-400 text-sm">{patient.lastVisit}</p>
              </div>
              <div className="p-3 bg-white/5 rounded-xl">
                <p className="text-white font-medium">Next Appointment</p>
                <p className="text-gray-400 text-sm">{patient.nextAppointment}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

// Appointments View
export function AppointmentsView({ appointments }) {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
          Appointments
        </h1>
        <button className="flex items-center gap-2 px-4 py-2 bg-purple-500 hover:bg-purple-600 rounded-xl transition-colors">
          <Plus className="w-5 h-5" />
          Schedule Appointment
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
        {appointments.map((appointment) => (
          <div key={appointment.id} className="bg-black/40 backdrop-blur-md rounded-2xl p-6 border border-white/20 hover:border-purple-400/50 transition-all">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center">
                  <Calendar className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white">{appointment.patient}</h3>
                  <p className="text-gray-400 text-sm">{appointment.doctor}</p>
                </div>
              </div>
              <div className={`px-3 py-1 rounded-full text-xs font-medium ${
                appointment.status === 'Scheduled' ? 'bg-green-500/20 text-green-400' : 'bg-gray-500/20 text-gray-400'
              }`}>
                {appointment.status}
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex items-center gap-2 text-sm text-gray-300">
                <Clock className="w-4 h-4" />
                {appointment.date} at {appointment.time}
              </div>
              <div className="flex items-center gap-2 text-sm text-gray-300">
                <Stethoscope className="w-4 h-4" />
                {appointment.type}
              </div>
              <div className="flex items-center gap-2 text-sm text-gray-300">
                <MapPin className="w-4 h-4" />
                {appointment.room}
              </div>
            </div>

            <div className="flex gap-2 mt-4">
              <button className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-blue-500/20 hover:bg-blue-500/30 rounded-lg transition-colors">
                <Eye className="w-4 h-4 text-blue-400" />
                <span className="text-blue-400 text-sm">View</span>
              </button>
              <button className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-green-500/20 hover:bg-green-500/30 rounded-lg transition-colors">
                <Edit className="w-4 h-4 text-green-400" />
                <span className="text-green-400 text-sm">Edit</span>
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

// Medications View
export function MedicationsView({ medications, onMedicationSelect }) {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold bg-gradient-to-r from-orange-400 to-red-400 bg-clip-text text-transparent">
          Medications
        </h1>
        <button className="flex items-center gap-2 px-4 py-2 bg-orange-500 hover:bg-orange-600 rounded-xl transition-colors">
          <Plus className="w-5 h-5" />
          Add Medication
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {medications.map((medication) => (
          <div
            key={medication.id}
            onClick={() => onMedicationSelect(medication)}
            className="bg-black/40 backdrop-blur-md rounded-2xl p-6 border border-white/20 hover:border-orange-400/50 transition-all cursor-pointer group hover:scale-105"
          >
            <div className="flex items-center gap-4 mb-4">
              <div className="w-12 h-12 bg-gradient-to-r from-orange-500 to-red-500 rounded-full flex items-center justify-center">
                <Pill className="w-6 h-6 text-white" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-white">{medication.name}</h3>
                <p className="text-gray-400 text-sm">{medication.dosage} • {medication.type}</p>
              </div>
            </div>

            <div className="space-y-2 mb-4">
              <div className="flex items-center justify-between">
                <span className="text-gray-400 text-sm">Stock</span>
                <span className="text-white font-medium">{medication.stock} units</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-400 text-sm">Min Stock</span>
                <span className="text-white font-medium">{medication.minStock} units</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-400 text-sm">Price</span>
                <span className="text-white font-medium">${medication.price}</span>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div className={`px-3 py-1 rounded-full text-xs font-medium ${
                medication.status === 'In Stock' ? 'bg-green-500/20 text-green-400' : 
                medication.status === 'Low Stock' ? 'bg-yellow-500/20 text-yellow-400' : 
                'bg-red-500/20 text-red-400'
              }`}>
                {medication.status}
              </div>
              <ArrowRight className="w-5 h-5 text-gray-400 group-hover:text-orange-400 transition-colors" />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

// Medication Detail View
export function MedicationDetailView({ medication, onBack }) {
  if (!medication) return null

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <button
          onClick={onBack}
          className="flex items-center gap-2 px-4 py-2 bg-gray-600 hover:bg-gray-500 rounded-xl transition-colors"
        >
          <ChevronLeft className="w-5 h-5" />
          Back
        </button>
        <h1 className="text-3xl font-bold bg-gradient-to-r from-orange-400 to-red-400 bg-clip-text text-transparent">
          {medication.name}
        </h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-black/40 backdrop-blur-md rounded-2xl p-6 border border-white/20">
            <h2 className="text-xl font-bold mb-4 text-white">Medication Details</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-gray-400 text-sm">Name</label>
                <p className="text-white font-medium">{medication.name}</p>
              </div>
              <div>
                <label className="text-gray-400 text-sm">Dosage</label>
                <p className="text-white font-medium">{medication.dosage}</p>
              </div>
              <div>
                <label className="text-gray-400 text-sm">Type</label>
                <p className="text-white font-medium">{medication.type}</p>
              </div>
              <div>
                <label className="text-gray-400 text-sm">Current Stock</label>
                <p className="text-white font-medium">{medication.stock} units</p>
              </div>
              <div>
                <label className="text-gray-400 text-sm">Minimum Stock</label>
                <p className="text-white font-medium">{medication.minStock} units</p>
              </div>
              <div>
                <label className="text-gray-400 text-sm">Price per Unit</label>
                <p className="text-white font-medium">${medication.price}</p>
              </div>
              <div>
                <label className="text-gray-400 text-sm">Expiry Date</label>
                <p className="text-white font-medium">{medication.expiryDate}</p>
              </div>
              <div>
                <label className="text-gray-400 text-sm">Supplier</label>
                <p className="text-white font-medium">{medication.supplier}</p>
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-black/40 backdrop-blur-md rounded-2xl p-6 border border-white/20">
            <h2 className="text-xl font-bold mb-4 text-white">Quick Actions</h2>
            <div className="space-y-3">
              <button className="w-full flex items-center gap-3 p-3 bg-blue-500/20 hover:bg-blue-500/30 rounded-xl transition-colors">
                <Package className="w-5 h-5 text-blue-400" />
                <span className="text-white">Update Stock</span>
              </button>
              <button className="w-full flex items-center gap-3 p-3 bg-green-500/20 hover:bg-green-500/30 rounded-xl transition-colors">
                <Edit className="w-5 h-5 text-green-400" />
                <span className="text-white">Edit Medication</span>
              </button>
              <button className="w-full flex items-center gap-3 p-3 bg-purple-500/20 hover:bg-purple-500/30 rounded-xl transition-colors">
                <Pill className="w-5 h-5 text-purple-400" />
                <span className="text-white">Create Prescription</span>
              </button>
            </div>
          </div>

          <div className="bg-black/40 backdrop-blur-md rounded-2xl p-6 border border-white/20">
            <h2 className="text-xl font-bold mb-4 text-white">Stock Status</h2>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-gray-400">Current Stock</span>
                <span className="text-white font-bold">{medication.stock}</span>
              </div>
              <div className="w-full bg-gray-700 rounded-full h-2">
                <div 
                  className={`h-2 rounded-full ${
                    medication.stock > medication.minStock * 2 ? 'bg-green-500' :
                    medication.stock > medication.minStock ? 'bg-yellow-500' : 'bg-red-500'
                  }`}
                  style={{ width: `${Math.min((medication.stock / (medication.minStock * 3)) * 100, 100)}%` }}
                ></div>
              </div>
              <div className={`px-3 py-1 rounded-full text-xs font-medium text-center ${
                medication.status === 'In Stock' ? 'bg-green-500/20 text-green-400' : 
                medication.status === 'Low Stock' ? 'bg-yellow-500/20 text-yellow-400' : 
                'bg-red-500/20 text-red-400'
              }`}>
                {medication.status}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

// Inventory View
export function InventoryView({ medications }) {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent">
          Inventory Management
        </h1>
        <button className="flex items-center gap-2 px-4 py-2 bg-indigo-500 hover:bg-indigo-600 rounded-xl transition-colors">
          <Plus className="w-5 h-5" />
          Add Item
        </button>
      </div>

      {/* Inventory Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-gradient-to-br from-green-500/20 to-green-600/20 backdrop-blur-md rounded-2xl p-6 border border-green-500/30">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-green-300 text-sm">In Stock</p>
              <p className="text-3xl font-bold text-white">
                {medications.filter(m => m.status === 'In Stock').length}
              </p>
            </div>
            <CheckCircle className="w-12 h-12 text-green-400" />
          </div>
        </div>

        <div className="bg-gradient-to-br from-yellow-500/20 to-yellow-600/20 backdrop-blur-md rounded-2xl p-6 border border-yellow-500/30">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-yellow-300 text-sm">Low Stock</p>
              <p className="text-3xl font-bold text-white">
                {medications.filter(m => m.status === 'Low Stock').length}
              </p>
            </div>
            <AlertCircle className="w-12 h-12 text-yellow-400" />
          </div>
        </div>

        <div className="bg-gradient-to-br from-red-500/20 to-red-600/20 backdrop-blur-md rounded-2xl p-6 border border-red-500/30">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-red-300 text-sm">Out of Stock</p>
              <p className="text-3xl font-bold text-white">
                {medications.filter(m => m.status === 'Out of Stock').length}
              </p>
            </div>
            <AlertCircle className="w-12 h-12 text-red-400" />
          </div>
        </div>
      </div>

      {/* Inventory Table */}
      <div className="bg-black/40 backdrop-blur-md rounded-2xl border border-white/20 overflow-hidden">
        <div className="p-6 border-b border-white/20">
          <h2 className="text-xl font-bold text-white">Inventory Overview</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-white/5">
              <tr>
                <th className="px-6 py-4 text-left text-gray-400 font-medium">Medication</th>
                <th className="px-6 py-4 text-left text-gray-400 font-medium">Stock</th>
                <th className="px-6 py-4 text-left text-gray-400 font-medium">Min Stock</th>
                <th className="px-6 py-4 text-left text-gray-400 font-medium">Status</th>
                <th className="px-6 py-4 text-left text-gray-400 font-medium">Expiry</th>
                <th className="px-6 py-4 text-left text-gray-400 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {medications.map((medication) => (
                <tr key={medication.id} className="border-b border-white/10 hover:bg-white/5">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-gradient-to-r from-orange-500 to-red-500 rounded-full flex items-center justify-center">
                        <Pill className="w-4 h-4 text-white" />
                      </div>
                      <div>
                        <p className="text-white font-medium">{medication.name}</p>
                        <p className="text-gray-400 text-sm">{medication.dosage}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-white">{medication.stock}</td>
                  <td className="px-6 py-4 text-white">{medication.minStock}</td>
                  <td className="px-6 py-4">
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                      medication.status === 'In Stock' ? 'bg-green-500/20 text-green-400' : 
                      medication.status === 'Low Stock' ? 'bg-yellow-500/20 text-yellow-400' : 
                      'bg-red-500/20 text-red-400'
                    }`}>
                      {medication.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-white">{medication.expiryDate}</td>
                  <td className="px-6 py-4">
                    <div className="flex gap-2">
                      <button className="p-2 bg-blue-500/20 hover:bg-blue-500/30 rounded-lg transition-colors">
                        <Eye className="w-4 h-4 text-blue-400" />
                      </button>
                      <button className="p-2 bg-green-500/20 hover:bg-green-500/30 rounded-lg transition-colors">
                        <Edit className="w-4 h-4 text-green-400" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

// Billing View
export function BillingView() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold bg-gradient-to-r from-pink-400 to-purple-400 bg-clip-text text-transparent">
          Billing & Analytics
        </h1>
        <button className="flex items-center gap-2 px-4 py-2 bg-pink-500 hover:bg-pink-600 rounded-xl transition-colors">
          <Plus className="w-5 h-5" />
          Create Invoice
        </button>
      </div>

      {/* Revenue Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-gradient-to-br from-green-500/20 to-green-600/20 backdrop-blur-md rounded-2xl p-6 border border-green-500/30">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-green-300 text-sm">Total Revenue</p>
              <p className="text-3xl font-bold text-white">$125,430</p>
            </div>
            <DollarSign className="w-12 h-12 text-green-400" />
          </div>
          <div className="flex items-center gap-2 mt-4">
            <TrendingUp className="w-4 h-4 text-green-400" />
            <span className="text-green-400 text-sm">+15% this month</span>
          </div>
        </div>

        <div className="bg-gradient-to-br from-blue-500/20 to-blue-600/20 backdrop-blur-md rounded-2xl p-6 border border-blue-500/30">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-blue-300 text-sm">Pending Payments</p>
              <p className="text-3xl font-bold text-white">$8,240</p>
            </div>
            <Clock className="w-12 h-12 text-blue-400" />
          </div>
          <div className="flex items-center gap-2 mt-4">
            <AlertCircle className="w-4 h-4 text-yellow-400" />
            <span className="text-yellow-400 text-sm">12 invoices</span>
          </div>
        </div>

        <div className="bg-gradient-to-br from-purple-500/20 to-purple-600/20 backdrop-blur-md rounded-2xl p-6 border border-purple-500/30">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-purple-300 text-sm">This Month</p>
              <p className="text-3xl font-bold text-white">$45,230</p>
            </div>
            <BarChart3 className="w-12 h-12 text-purple-400" />
          </div>
          <div className="flex items-center gap-2 mt-4">
            <TrendingUp className="w-4 h-4 text-green-400" />
            <span className="text-green-400 text-sm">+8% vs last month</span>
          </div>
        </div>

        <div className="bg-gradient-to-br from-orange-500/20 to-orange-600/20 backdrop-blur-md rounded-2xl p-6 border border-orange-500/30">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-orange-300 text-sm">Avg. Invoice</p>
              <p className="text-3xl font-bold text-white">$245</p>
            </div>
            <FileText className="w-12 h-12 text-orange-400" />
          </div>
          <div className="flex items-center gap-2 mt-4">
            <TrendingUp className="w-4 h-4 text-green-400" />
            <span className="text-green-400 text-sm">+5% this month</span>
          </div>
        </div>
      </div>

      {/* Recent Invoices */}
      <div className="bg-black/40 backdrop-blur-md rounded-2xl p-6 border border-white/20">
        <h2 className="text-xl font-bold mb-4 text-white">Recent Invoices</h2>
        <div className="space-y-4">
          <div className="flex items-center justify-between p-4 bg-white/5 rounded-xl">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 bg-green-500/20 rounded-full flex items-center justify-center">
                <FileText className="w-5 h-5 text-green-400" />
              </div>
              <div>
                <p className="text-white font-medium">Invoice #INV-2024-001</p>
                <p className="text-gray-400 text-sm">Sarah Johnson • Feb 15, 2024</p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-white font-bold">$320.00</p>
              <p className="text-green-400 text-sm">Paid</p>
            </div>
          </div>

          <div className="flex items-center justify-between p-4 bg-white/5 rounded-xl">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 bg-yellow-500/20 rounded-full flex items-center justify-center">
                <FileText className="w-5 h-5 text-yellow-400" />
              </div>
              <div>
                <p className="text-white font-medium">Invoice #INV-2024-002</p>
                <p className="text-gray-400 text-sm">Michael Chen • Feb 20, 2024</p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-white font-bold">$180.00</p>
              <p className="text-yellow-400 text-sm">Pending</p>
            </div>
          </div>

          <div className="flex items-center justify-between p-4 bg-white/5 rounded-xl">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 bg-green-500/20 rounded-full flex items-center justify-center">
                <FileText className="w-5 h-5 text-green-400" />
              </div>
              <div>
                <p className="text-white font-medium">Invoice #INV-2024-003</p>
                <p className="text-gray-400 text-sm">Emily Rodriguez • Feb 18, 2024</p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-white font-bold">$450.00</p>
              <p className="text-green-400 text-sm">Paid</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
