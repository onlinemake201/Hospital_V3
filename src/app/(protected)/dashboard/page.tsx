'use client'

import Link from 'next/link'
import { useState, useEffect } from 'react'
import { 
  Users, 
  Calendar, 
  AlertTriangle, 
  Package, 
  FileText, 
  Clock,
  Activity,
  TrendingUp,
  Heart,
  Stethoscope,
  Pill,
  DollarSign,
  BarChart3,
  Zap,
  Eye,
  Plus,
  ArrowRight,
  CheckCircle,
  XCircle,
  PauseCircle
} from 'lucide-react'

function useDashboardData() {
  const [data, setData] = useState({
    totalPatients: 0,
    todayAppointments: 0,
    waitingPatients: 0,
    activePrescriptions: 0,
    recentPrescriptions: [],
    loading: true
  })

  useEffect(() => {
    async function fetchDashboardData() {
      try {
        const response = await fetch('/api/dashboard', {
          cache: 'force-cache',
          next: { revalidate: 300 }, // 5 Minuten Cache
          headers: {
            'Cache-Control': 'max-age=300, stale-while-revalidate=600'
          }
        })
        if (response.ok) {
          const dashboardData = await response.json()
          setData({
            ...dashboardData,
            loading: false
          })
        } else {
          setData(prev => ({ ...prev, loading: false }))
        }
      } catch (error) {
        console.error('Error fetching dashboard data:', error)
        setData(prev => ({ ...prev, loading: false }))
      }
    }

    fetchDashboardData()
    
    // Auto-refresh every 5 minutes (reduced frequency for better performance)
    const interval = setInterval(fetchDashboardData, 300000)
    
    return () => clearInterval(interval)
  }, [])

  return data
}

export default function DashboardPage() {
  const dashboardData = useDashboardData()

  if (dashboardData.loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-6"></div>
          <p className="text-slate-600 dark:text-slate-400 text-lg font-medium">Loading dashboard...</p>
          <p className="text-slate-500 dark:text-slate-500 mt-2 text-sm">Please wait while we fetch the data</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-6 sm:mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-3xl sm:text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                Dashboard
              </h1>
              <p className="text-slate-600 dark:text-slate-400 mt-1 sm:mt-2 text-sm sm:text-base">
                Welcome back!
              </p>
            </div>
            <div className="flex items-center space-x-3 self-start sm:self-auto">
              <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center">
                <span className="text-white font-semibold text-sm">
                  U
                </span>
              </div>
              <div>
                <p className="font-medium text-slate-900 dark:text-slate-100 text-sm sm:text-base">
                  User
                </p>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  ADMIN
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Live Status Bar */}
        <div className="mb-6 sm:mb-8 bg-white dark:bg-slate-800 rounded-2xl p-4 sm:p-6 shadow-lg border border-slate-200 dark:border-slate-700">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex flex-col sm:flex-row sm:items-center space-y-2 sm:space-y-0 sm:space-x-6">
              <div className="flex items-center space-x-3">
                <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
                <span className="text-sm font-medium text-slate-600 dark:text-slate-300">System Online</span>
              </div>
              <div className="flex items-center space-x-3">
                <Clock className="w-4 h-4 text-blue-500" />
                <span className="text-sm font-medium text-slate-600 dark:text-slate-300">
                  {new Date().toLocaleTimeString()}
                </span>
              </div>
              <div className="flex items-center space-x-3">
                <Activity className="w-4 h-4 text-green-500" />
                <span className="text-sm font-medium text-slate-600 dark:text-slate-300">Live Data</span>
              </div>
            </div>
            <div className="text-left sm:text-right">
              <p className="text-xs text-slate-500 dark:text-slate-400">Last updated</p>
              <p className="text-sm font-medium text-slate-900 dark:text-slate-100">
                {new Date().toLocaleTimeString()}
              </p>
            </div>
          </div>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 lg:gap-6 mb-6 sm:mb-8">
          {/* Total Patients */}
          <div className="bg-white dark:bg-slate-800 rounded-2xl p-4 sm:p-6 shadow-lg border border-slate-200 dark:border-slate-700 hover:shadow-xl transition-all duration-300 group">
            <div className="flex items-center justify-between">
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-slate-600 dark:text-slate-400">Total Patients</p>
                <p className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-slate-100 group-hover:text-blue-600 transition-colors">
                  {dashboardData.totalPatients}
                </p>
                <p className="text-xs text-blue-600 dark:text-blue-400 mt-1">Registered patients</p>
              </div>
              <div className="w-10 h-10 sm:w-12 sm:h-12 bg-blue-100 dark:bg-blue-900 rounded-xl flex items-center justify-center flex-shrink-0 ml-2 group-hover:scale-110 transition-transform">
                <Users className="w-5 h-5 sm:w-6 sm:h-6 text-blue-600 dark:text-blue-400" />
              </div>
            </div>
          </div>

          {/* Today's Appointments */}
          <div className="bg-white dark:bg-slate-800 rounded-2xl p-4 sm:p-6 shadow-lg border border-slate-200 dark:border-slate-700 hover:shadow-xl transition-all duration-300 group relative overflow-hidden">
            <div className="absolute top-0 right-0 w-2 h-full bg-gradient-to-b from-green-400 to-green-600"></div>
            <div className="flex items-center justify-between">
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-slate-600 dark:text-slate-400">Today's Appointments</p>
                <p className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-slate-100 group-hover:text-green-600 transition-colors">
                  {dashboardData.todayAppointments}
                </p>
                <p className="text-xs text-green-600 dark:text-green-400 mt-1 flex items-center">
                  <Clock className="w-3 h-3 mr-1 animate-pulse" />
                  Live • {dashboardData.todayAppointments} upcoming
                </p>
              </div>
              <div className="w-10 h-10 sm:w-12 sm:h-12 bg-green-100 dark:bg-green-900 rounded-xl flex items-center justify-center flex-shrink-0 ml-2 group-hover:scale-110 transition-transform">
                <Calendar className="w-5 h-5 sm:w-6 sm:h-6 text-green-600 dark:text-green-400" />
              </div>
            </div>
          </div>

          {/* Waiting Patients */}
          <div className="bg-white dark:bg-slate-800 rounded-2xl p-4 sm:p-6 shadow-lg border border-slate-200 dark:border-slate-700 hover:shadow-xl transition-all duration-300 group relative overflow-hidden">
            <div className="absolute top-0 right-0 w-2 h-full bg-gradient-to-b from-orange-400 to-orange-600"></div>
            <div className="flex items-center justify-between">
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-slate-600 dark:text-slate-400">Waiting Patients</p>
                <p className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-slate-100 group-hover:text-orange-600 transition-colors">
                  {dashboardData.waitingPatients}
                </p>
                <p className="text-xs text-orange-600 dark:text-orange-400 mt-1 flex items-center">
                  <Activity className="w-3 h-3 mr-1 animate-pulse" />
                  Live • In progress
                </p>
              </div>
              <div className="w-10 h-10 sm:w-12 sm:h-12 bg-orange-100 dark:bg-orange-900 rounded-xl flex items-center justify-center flex-shrink-0 ml-2 group-hover:scale-110 transition-transform">
                <Clock className="w-5 h-5 sm:w-6 sm:h-6 text-orange-600 dark:text-orange-400" />
              </div>
            </div>
          </div>

          {/* Active Prescriptions */}
          <div className="bg-white dark:bg-slate-800 rounded-2xl p-4 sm:p-6 shadow-lg border border-slate-200 dark:border-slate-700 hover:shadow-xl transition-all duration-300 group">
            <div className="flex items-center justify-between">
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-slate-600 dark:text-slate-400">Active Prescriptions</p>
                <p className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-slate-100 group-hover:text-purple-600 transition-colors">
                  {dashboardData.activePrescriptions}
                </p>
                <p className="text-xs text-purple-600 dark:text-purple-400 mt-1">Currently active</p>
              </div>
              <div className="w-10 h-10 sm:w-12 sm:h-12 bg-purple-100 dark:bg-purple-900 rounded-xl flex items-center justify-center flex-shrink-0 ml-2 group-hover:scale-110 transition-transform">
                <Pill className="w-5 h-5 sm:w-6 sm:h-6 text-purple-600 dark:text-purple-400" />
              </div>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-8 mb-8">
          <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 sm:p-8 shadow-lg border border-slate-200 dark:border-slate-700">
            <div className="flex items-center mb-6">
              <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900 rounded-xl flex items-center justify-center mr-4">
                <Zap className="w-5 h-5 text-blue-600 dark:text-blue-400" />
              </div>
              <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100">Quick Actions</h2>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 sm:gap-6">
              <Link href="/patients/new" className="p-3 sm:p-4 rounded-xl bg-blue-50 dark:bg-blue-900/20 hover:bg-blue-100 dark:hover:bg-blue-900/30 transition-colors text-left min-h-[80px] sm:min-h-[100px] group">
                <div className="w-6 h-6 sm:w-8 sm:h-8 bg-blue-100 dark:bg-blue-900 rounded-lg flex items-center justify-center mb-2 sm:mb-3 group-hover:scale-110 transition-transform">
                  <Users className="w-3 h-3 sm:w-4 sm:h-4 text-blue-600 dark:text-blue-400" />
                </div>
                <h3 className="font-semibold text-slate-900 dark:text-slate-100 text-sm sm:text-base">New Patient</h3>
                <p className="text-xs text-slate-600 dark:text-slate-400">Register patient</p>
              </Link>
              <Link href="/appointments/new" className="p-3 sm:p-4 rounded-xl bg-green-50 dark:bg-green-900/20 hover:bg-green-100 dark:hover:bg-green-900/30 transition-colors text-left min-h-[80px] sm:min-h-[100px] group">
                <div className="w-6 h-6 sm:w-8 sm:h-8 bg-green-100 dark:bg-green-900 rounded-lg flex items-center justify-center mb-2 sm:mb-3 group-hover:scale-110 transition-transform">
                  <Calendar className="w-3 h-3 sm:w-4 sm:h-4 text-green-600 dark:text-green-400" />
                </div>
                <h3 className="font-semibold text-slate-900 dark:text-slate-100 text-sm sm:text-base">Schedule</h3>
                <p className="text-xs text-slate-600 dark:text-slate-400">Book appointment</p>
              </Link>
              <Link href="/prescriptions/new" className="p-3 sm:p-4 rounded-xl bg-purple-50 dark:bg-purple-900/20 hover:bg-purple-100 dark:hover:bg-purple-900/30 transition-colors text-left min-h-[80px] sm:min-h-[100px] group">
                <div className="w-6 h-6 sm:w-8 sm:h-8 bg-purple-100 dark:bg-purple-900 rounded-lg flex items-center justify-center mb-2 sm:mb-3 group-hover:scale-110 transition-transform">
                  <Pill className="w-3 h-3 sm:w-4 sm:h-4 text-purple-600 dark:text-purple-400" />
                </div>
                <h3 className="font-semibold text-slate-900 dark:text-slate-100 text-sm sm:text-base">Prescription</h3>
                <p className="text-xs text-slate-600 dark:text-slate-400">Issue medication</p>
              </Link>
            </div>
          </div>

          <div className="bg-white dark:bg-slate-800 rounded-2xl p-8 shadow-lg border border-slate-200 dark:border-slate-700">
            <div className="flex items-center mb-6">
              <div className="w-10 h-10 bg-purple-100 dark:bg-purple-900 rounded-xl flex items-center justify-center mr-4">
                <Activity className="w-5 h-5 text-purple-600 dark:text-purple-400" />
              </div>
              <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100">Recent Activities</h2>
            </div>
            <div className="space-y-4">
              <div className="flex items-center p-4 rounded-xl bg-slate-50 dark:bg-slate-700 hover:bg-slate-100 dark:hover:bg-slate-600 transition-colors">
                <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900 rounded-lg flex items-center justify-center mr-3">
                  <Activity className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-slate-900 dark:text-slate-100">System Started</h3>
                  <p className="text-sm text-slate-600 dark:text-slate-400">System</p>
                </div>
                <div className="text-right">
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    {new Date().toLocaleTimeString()}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Recent Prescriptions */}
        <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 sm:p-8 shadow-lg border border-slate-200 dark:border-slate-700">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center">
              <div className="w-10 h-10 bg-purple-100 dark:bg-purple-900 rounded-xl flex items-center justify-center mr-4">
                <Pill className="w-5 h-5 text-purple-600 dark:text-purple-400" />
              </div>
              <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100">Recent Prescriptions</h2>
            </div>
            <Link
              href="/prescriptions"
              className="text-sm text-purple-600 dark:text-purple-400 hover:text-purple-700 dark:hover:text-purple-300 font-medium flex items-center"
            >
              View All
              <ArrowRight className="w-4 h-4 ml-1" />
            </Link>
          </div>
          <div className="space-y-4">
            {dashboardData.recentPrescriptions.length > 0 ? (
              dashboardData.recentPrescriptions.map((prescription: any) => (
                <div key={prescription.$id} className="flex items-center p-4 rounded-xl bg-slate-50 dark:bg-slate-700 hover:bg-slate-100 dark:hover:bg-slate-600 transition-colors">
                  <div className="w-8 h-8 bg-purple-100 dark:bg-purple-900 rounded-lg flex items-center justify-center mr-3">
                    <Pill className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-slate-900 dark:text-slate-100">
                      Prescription #{prescription.prescriptionNo}
                    </h3>
                    <p className="text-sm text-slate-600 dark:text-slate-400">
                      Status: {prescription.status}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      {new Date(prescription.$createdAt).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-8 text-slate-500 dark:text-slate-400">
                No recent prescriptions found
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}