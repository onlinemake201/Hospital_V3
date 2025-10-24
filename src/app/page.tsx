'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { authHelpers } from '@/lib/appwrite'
import { 
  ArrowRight, 
  Shield, 
  Users, 
  Calendar, 
  Pill, 
  FileText, 
  BarChart3, 
  Smartphone,
  Clock,
  CheckCircle,
  Star,
  Heart,
  Zap,
  Globe,
  Lock,
  Award,
  TrendingUp,
  Activity,
  Database,
  Cloud,
  Smartphone as Mobile,
  Monitor,
  Tablet,
  Play,
  Phone,
  Mail,
  MapPin,
  Sparkles,
  Rocket,
  Target,
  Lightbulb,
  MousePointer,
  Eye,
  Layers,
  Cpu,
  Wifi,
  Battery,
  Wrench,
  Settings,
  ChevronDown,
  Menu,
  X,
  Brain,
  Stethoscope,
  Microscope,
  Syringe,
  Clipboard,
  AlertCircle,
  CheckCircle2,
  ArrowUp,
  ArrowDown,
  RotateCcw,
  RefreshCw,
  DollarSign
} from 'lucide-react'

export default function HomePage() {
  const [isScrolled, setIsScrolled] = useState(false)
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 })
  const [isLoaded, setIsLoaded] = useState(false)
  const [activeFeature, setActiveFeature] = useState(0)
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const router = useRouter()

  useEffect(() => {
    setIsLoaded(true)
    
    // Check authentication status
    const checkAuth = async () => {
      try {
        const user = await authHelpers.getCurrentUser()
        setIsAuthenticated(!!user)
      } catch (error) {
        setIsAuthenticated(false)
      }
    }
    
    checkAuth()
    
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50)
    }

    const handleMouseMove = (e: MouseEvent) => {
      setMousePosition({ x: e.clientX, y: e.clientY })
    }

    window.addEventListener('scroll', handleScroll)
    window.addEventListener('mousemove', handleMouseMove)

    return () => {
      window.removeEventListener('scroll', handleScroll)
      window.removeEventListener('mousemove', handleMouseMove)
    }
  }, [])

  useEffect(() => {
    const interval = setInterval(() => {
      setActiveFeature((prev) => (prev + 1) % 6)
    }, 3000)
    return () => clearInterval(interval)
  }, [])

  const handleLogout = async () => {
    try {
      await authHelpers.logout()
      setIsAuthenticated(false)
      router.push('/login')
    } catch (error) {
      console.error('Logout error:', error)
    }
  }

  const features = [
    { icon: Users, title: "Patient Management", color: "from-blue-500 to-blue-600" },
    { icon: Calendar, title: "Smart Scheduling", color: "from-green-500 to-green-600" },
    { icon: Pill, title: "Medication Tracking", color: "from-purple-500 to-purple-600" },
    { icon: BarChart3, title: "Analytics Dashboard", color: "from-orange-500 to-orange-600" },
    { icon: Shield, title: "Security & Compliance", color: "from-red-500 to-red-600" },
    { icon: Brain, title: "AI-Powered Insights", color: "from-pink-500 to-pink-600" }
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900 relative overflow-hidden">
      {/* Animated Background Elements */}
      <div className="fixed inset-0 pointer-events-none">
        {/* Floating Orbs */}
        <div className="absolute top-20 left-10 w-32 h-32 bg-blue-400/20 rounded-full blur-xl animate-pulse"></div>
        <div className="absolute top-40 right-20 w-24 h-24 bg-purple-400/20 rounded-full blur-xl animate-pulse delay-1000"></div>
        <div className="absolute bottom-20 left-1/4 w-40 h-40 bg-pink-400/20 rounded-full blur-xl animate-pulse delay-2000"></div>
        <div className="absolute bottom-40 right-1/3 w-28 h-28 bg-green-400/20 rounded-full blur-xl animate-pulse delay-500"></div>
        
        {/* Mouse Follower */}
        <div 
          className="absolute w-96 h-96 bg-gradient-to-r from-blue-500/5 to-purple-500/5 rounded-full blur-3xl transition-all duration-300 ease-out"
          style={{
            left: mousePosition.x - 192,
            top: mousePosition.y - 192,
            transform: 'translateZ(0)'
          }}
        ></div>

        {/* Grid Pattern */}
        <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.1)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.1)_1px,transparent_1px)] bg-[size:50px_50px] [mask-image:radial-gradient(ellipse_80%_50%_at_50%_0%,#000_70%,transparent_110%)]"></div>
      </div>

      {/* Navigation */}
      <nav className={`fixed top-0 w-full z-50 transition-all duration-300 ${
        isScrolled 
          ? 'bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl shadow-lg border-b border-slate-200/50' 
          : 'bg-transparent'
      }`}>
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-3 sm:py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 sm:gap-3">
              <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl flex items-center justify-center flex-shrink-0 animate-pulse">
                <Heart className="w-4 h-4 sm:w-6 sm:h-6 text-white" />
              </div>
              <span className="text-lg sm:text-xl lg:text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent truncate">
                <span className="hidden xs:inline">Hospital Management System</span>
                <span className="xs:hidden">Hospital System</span>
              </span>
            </div>
            <div className="flex items-center gap-2 sm:gap-4">
              {isAuthenticated ? (
                <>
                  <Link
                    href="/dashboard"
                    className="hidden sm:flex items-center gap-2 px-4 py-2 rounded-xl border-2 border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300 font-semibold text-sm hover:bg-slate-50 dark:hover:bg-slate-800 transition-all duration-200 hover:scale-105"
                  >
                    <BarChart3 className="w-4 h-4" />
                    Dashboard
                  </Link>
                  <button
                    onClick={handleLogout}
                    className="px-4 sm:px-6 py-2 sm:py-3 rounded-xl bg-gradient-to-r from-red-600 to-red-700 text-white font-semibold text-sm sm:text-base hover:from-red-700 hover:to-red-800 transition-all duration-200 shadow-lg hover:shadow-xl hover:scale-105 flex items-center gap-2"
                  >
                    Abmelden
                  </button>
                </>
              ) : (
                <>
                  <Link
                    href="/demo"
                    className="hidden sm:flex items-center gap-2 px-4 py-2 rounded-xl border-2 border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300 font-semibold text-sm hover:bg-slate-50 dark:hover:bg-slate-800 transition-all duration-200 hover:scale-105"
                  >
                    <Play className="w-4 h-4" />
                    Watch Demo
                  </Link>
                  <Link
                    href="/login"
                    className="px-4 sm:px-6 py-2 sm:py-3 rounded-xl bg-gradient-to-r from-blue-600 to-purple-600 text-white font-semibold text-sm sm:text-base hover:from-blue-700 hover:to-purple-700 transition-all duration-200 shadow-lg hover:shadow-xl hover:scale-105 flex items-center gap-2"
                  >
                    Anmelden
                    <ArrowRight className="w-4 h-4" />
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative pt-20 sm:pt-24 lg:pt-32 pb-16 sm:pb-20 lg:pb-24 px-4 sm:px-6 lg:px-8">
        <div className="container mx-auto">
          <div className="text-center max-w-6xl mx-auto">
            {/* Animated Badge */}
            <div className={`inline-flex items-center gap-2 px-6 py-3 rounded-full bg-gradient-to-r from-blue-500/10 to-purple-500/10 border border-blue-500/20 text-blue-600 dark:text-blue-400 font-medium text-sm mb-8 transition-all duration-1000 ${
              isLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
            }`}>
              <Sparkles className="w-4 h-4 animate-spin" />
              <span>Next-Generation Healthcare Management</span>
              <Rocket className="w-4 h-4" />
            </div>

            {/* Main Heading */}
            <h1 className={`text-5xl sm:text-6xl lg:text-8xl font-bold mb-6 sm:mb-8 transition-all duration-1000 delay-200 ${
              isLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
            }`}>
              <span className="bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent animate-pulse">
                Transform Your
              </span>
              <br />
              <span className="bg-gradient-to-r from-purple-600 via-pink-600 to-blue-600 bg-clip-text text-transparent">
                Healthcare Experience
              </span>
            </h1>

            {/* Subtitle */}
            <p className={`text-xl sm:text-2xl lg:text-3xl text-slate-600 dark:text-slate-300 mb-8 sm:mb-12 max-w-4xl mx-auto leading-relaxed transition-all duration-1000 delay-400 ${
              isLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
            }`}>
              Experience the future of hospital management with our AI-powered platform. 
              Streamline operations, enhance patient care, and boost efficiency like never before.
            </p>

            {/* CTA Buttons */}
            <div className={`flex flex-col sm:flex-row gap-4 sm:gap-6 justify-center items-center mb-12 sm:mb-16 transition-all duration-1000 delay-600 ${
              isLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
            }`}>
              {isAuthenticated ? (
                <Link
                  href="/dashboard"
                  className="group w-full sm:w-auto px-10 py-5 bg-gradient-to-r from-blue-600 to-purple-600 text-white font-bold text-xl rounded-2xl hover:from-blue-700 hover:to-purple-700 transition-all duration-300 shadow-2xl hover:shadow-3xl hover:scale-105 flex items-center justify-center gap-3"
                >
                  <Rocket className="w-7 h-7 group-hover:animate-bounce" />
                  Dashboard öffnen
                  <ArrowRight className="w-7 h-7 group-hover:translate-x-1 transition-transform" />
                </Link>
              ) : (
                <>
                  <Link
                    href="/login"
                    className="group w-full sm:w-auto px-10 py-5 bg-gradient-to-r from-blue-600 to-purple-600 text-white font-bold text-xl rounded-2xl hover:from-blue-700 hover:to-purple-700 transition-all duration-300 shadow-2xl hover:shadow-3xl hover:scale-105 flex items-center justify-center gap-3"
                  >
                    <Rocket className="w-7 h-7 group-hover:animate-bounce" />
                    Anmelden
                    <ArrowRight className="w-7 h-7 group-hover:translate-x-1 transition-transform" />
                  </Link>
                  <Link
                    href="/demo"
                    className="group w-full sm:w-auto px-10 py-5 rounded-2xl border-2 border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300 font-bold text-xl hover:bg-slate-50 dark:hover:bg-slate-800 transition-all duration-300 hover:scale-105 flex items-center justify-center gap-3"
                  >
                    <Play className="w-7 h-7 group-hover:scale-110 transition-transform" />
                    Watch Interactive Demo
                  </Link>
                </>
              )}
            </div>

            {/* Scroll Indicator */}
            <div className={`flex flex-col items-center gap-2 text-slate-400 transition-all duration-1000 delay-800 ${
              isLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
            }`}>
              <span className="text-sm">Scroll to explore</span>
              <ChevronDown className="w-6 h-6 animate-bounce" />
            </div>
          </div>
        </div>
      </section>

      {/* Interactive Features Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="container mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl sm:text-5xl lg:text-6xl font-bold mb-6 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              Revolutionary Features
            </h2>
            <p className="text-xl text-slate-600 dark:text-slate-300 max-w-3xl mx-auto">
              Discover the cutting-edge capabilities that make our platform the future of healthcare management
            </p>
          </div>

          {/* Interactive Feature Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => {
              const Icon = feature.icon
              return (
                <div
                  key={index}
                  className={`group relative bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm rounded-3xl p-8 shadow-xl hover:shadow-2xl transition-all duration-500 border border-slate-200 dark:border-slate-700 cursor-pointer ${
                    index === activeFeature ? 'scale-105 shadow-2xl' : 'hover:scale-102'
                  }`}
                  onMouseEnter={() => setActiveFeature(index)}
                >
                  {/* Animated Background */}
                  <div className={`absolute inset-0 bg-gradient-to-r ${feature.color} opacity-0 group-hover:opacity-10 rounded-3xl transition-opacity duration-300`}></div>
                  
                  <div className="relative z-10">
                    <div className={`w-16 h-16 bg-gradient-to-r ${feature.color} rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300`}>
                      <Icon className="w-8 h-8 text-white" />
                    </div>
                    <h3 className="text-2xl font-bold mb-4 text-slate-900 dark:text-slate-100 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                      {feature.title}
                    </h3>
                    <p className="text-slate-600 dark:text-slate-300 mb-6 leading-relaxed">
                      Experience next-generation healthcare management with our innovative platform designed for modern hospitals.
                    </p>
                    <div className="flex items-center gap-2 text-blue-600 dark:text-blue-400 font-semibold group-hover:gap-3 transition-all">
                      <span>Learn More</span>
                      <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      {/* Interactive Features Showcase */}
      <section className="py-20 px-4 bg-gradient-to-br from-blue-50/50 via-purple-50/50 to-pink-50/50 dark:from-slate-800/50 dark:via-slate-700/50 dark:to-slate-600/50">
        <div className="container mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold mb-6 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              Live System Preview
            </h2>
            <p className="text-xl text-slate-600 dark:text-slate-300 max-w-3xl mx-auto">
              Experience our platform in action with real-time animations and interactive elements
            </p>
          </div>

          {/* Main Interactive Box */}
          <div className="relative bg-white/90 dark:bg-slate-800/90 backdrop-blur-xl rounded-3xl p-8 shadow-2xl border border-white/20 dark:border-slate-700/50 overflow-hidden">
            {/* Animated Background */}
            <div className="absolute inset-0 bg-gradient-to-r from-blue-500/5 via-purple-500/5 to-pink-500/5 animate-pulse"></div>
            
            {/* Header */}
            <div className="relative z-10 flex items-center justify-between mb-8">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-500 rounded-xl flex items-center justify-center">
                  <Heart className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Hospital Management System</h3>
                  <p className="text-slate-600 dark:text-slate-400">Live Demo Environment</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
                <span className="text-sm text-green-600 dark:text-green-400 font-medium">Online</span>
              </div>
            </div>

            {/* Interactive Dashboard Grid */}
            <div className="relative z-10 grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Left Side - Sliding Medications */}
              <div className="space-y-6">
                <h4 className="text-xl font-bold text-slate-900 dark:text-slate-100 flex items-center gap-3">
                  <Pill className="w-6 h-6 text-purple-500" />
                  Medication Inventory
                </h4>
                
                {/* Sliding Medication Cards */}
                <div className="relative h-64 overflow-hidden rounded-2xl bg-gradient-to-br from-purple-50 to-pink-50 dark:from-slate-700/50 dark:to-slate-600/50 p-4">
                  <div className="absolute inset-0 flex flex-col gap-3 animate-slide-up">
                    {/* Medication Card 1 */}
                    <div className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm rounded-xl p-4 shadow-lg border border-purple-200/50 dark:border-purple-700/50 flex items-center gap-4 hover:scale-105 transition-transform duration-300">
                      <div className="w-10 h-10 bg-gradient-to-r from-purple-500 to-purple-600 rounded-lg flex items-center justify-center">
                        <Pill className="w-5 h-5 text-white" />
                      </div>
                      <div className="flex-1">
                        <h5 className="font-semibold text-slate-900 dark:text-slate-100">Aspirin 100mg</h5>
                        <p className="text-sm text-slate-600 dark:text-slate-400">Stock: 245 units</p>
                      </div>
                      <div className="text-right">
                        <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                        <p className="text-xs text-green-600 dark:text-green-400 mt-1">In Stock</p>
                      </div>
                    </div>

                    {/* Medication Card 2 */}
                    <div className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm rounded-xl p-4 shadow-lg border border-blue-200/50 dark:border-blue-700/50 flex items-center gap-4 hover:scale-105 transition-transform duration-300">
                      <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-blue-600 rounded-lg flex items-center justify-center">
                        <Pill className="w-5 h-5 text-white" />
                      </div>
                      <div className="flex-1">
                        <h5 className="font-semibold text-slate-900 dark:text-slate-100">Insulin Glargine</h5>
                        <p className="text-sm text-slate-600 dark:text-slate-400">Stock: 89 units</p>
                      </div>
                      <div className="text-right">
                        <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
                        <p className="text-xs text-yellow-600 dark:text-yellow-400 mt-1">Low Stock</p>
                      </div>
                    </div>

                    {/* Medication Card 3 */}
                    <div className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm rounded-xl p-4 shadow-lg border border-green-200/50 dark:border-green-700/50 flex items-center gap-4 hover:scale-105 transition-transform duration-300">
                      <div className="w-10 h-10 bg-gradient-to-r from-green-500 to-green-600 rounded-lg flex items-center justify-center">
                        <Pill className="w-5 h-5 text-white" />
                      </div>
                      <div className="flex-1">
                        <h5 className="font-semibold text-slate-900 dark:text-slate-100">Metformin 500mg</h5>
                        <p className="text-sm text-slate-600 dark:text-slate-400">Stock: 156 units</p>
                      </div>
                      <div className="text-right">
                        <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                        <p className="text-xs text-green-600 dark:text-green-400 mt-1">In Stock</p>
                      </div>
                    </div>

                    {/* Medication Card 4 */}
                    <div className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm rounded-xl p-4 shadow-lg border border-red-200/50 dark:border-red-700/50 flex items-center gap-4 hover:scale-105 transition-transform duration-300">
                      <div className="w-10 h-10 bg-gradient-to-r from-red-500 to-red-600 rounded-lg flex items-center justify-center">
                        <Pill className="w-5 h-5 text-white" />
                      </div>
                      <div className="flex-1">
                        <h5 className="font-semibold text-slate-900 dark:text-slate-100">Morphine 10mg</h5>
                        <p className="text-sm text-slate-600 dark:text-slate-400">Stock: 12 units</p>
                      </div>
                      <div className="text-right">
                        <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                        <p className="text-xs text-red-600 dark:text-red-400 mt-1">Critical</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Right Side - Live Stats */}
              <div className="space-y-6">
                <h4 className="text-xl font-bold text-slate-900 dark:text-slate-100 flex items-center gap-3">
                  <BarChart3 className="w-6 h-6 text-blue-500" />
                  Live Statistics
                </h4>

                {/* Animated Stats Cards */}
                <div className="grid grid-cols-2 gap-4">
                  {/* Today's Appointments */}
                  <div className="bg-gradient-to-br from-blue-500/10 to-blue-600/10 backdrop-blur-sm rounded-2xl p-6 border border-blue-200/50 dark:border-blue-700/50 hover:scale-105 transition-transform duration-300">
                    <div className="flex items-center justify-between mb-3">
                      <Calendar className="w-8 h-8 text-blue-500" />
                      <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
                    </div>
                    <h5 className="text-2xl font-bold text-slate-900 dark:text-slate-100">23</h5>
                    <p className="text-sm text-slate-600 dark:text-slate-400">Today's Appointments</p>
                    <div className="mt-2 flex items-center gap-1">
                      <TrendingUp className="w-3 h-3 text-green-500" />
                      <span className="text-xs text-green-600 dark:text-green-400">+12%</span>
                    </div>
                  </div>

                  {/* Active Patients */}
                  <div className="bg-gradient-to-br from-green-500/10 to-green-600/10 backdrop-blur-sm rounded-2xl p-6 border border-green-200/50 dark:border-green-700/50 hover:scale-105 transition-transform duration-300">
                    <div className="flex items-center justify-between mb-3">
                      <Users className="w-8 h-8 text-green-500" />
                      <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                    </div>
                    <h5 className="text-2xl font-bold text-slate-900 dark:text-slate-100">1,247</h5>
                    <p className="text-sm text-slate-600 dark:text-slate-400">Active Patients</p>
                    <div className="mt-2 flex items-center gap-1">
                      <TrendingUp className="w-3 h-3 text-green-500" />
                      <span className="text-xs text-green-600 dark:text-green-400">+8%</span>
                    </div>
                  </div>

                  {/* Revenue */}
                  <div className="bg-gradient-to-br from-purple-500/10 to-purple-600/10 backdrop-blur-sm rounded-2xl p-6 border border-purple-200/50 dark:border-purple-700/50 hover:scale-105 transition-transform duration-300">
                    <div className="flex items-center justify-between mb-3">
                      <DollarSign className="w-8 h-8 text-purple-500" />
                      <div className="w-2 h-2 bg-purple-500 rounded-full animate-pulse"></div>
                    </div>
                    <h5 className="text-2xl font-bold text-slate-900 dark:text-slate-100">$45K</h5>
                    <p className="text-sm text-slate-600 dark:text-slate-400">Monthly Revenue</p>
                    <div className="mt-2 flex items-center gap-1">
                      <TrendingUp className="w-3 h-3 text-green-500" />
                      <span className="text-xs text-green-600 dark:text-green-400">+15%</span>
                    </div>
                  </div>

                  {/* Inventory Alerts */}
                  <div className="bg-gradient-to-br from-orange-500/10 to-orange-600/10 backdrop-blur-sm rounded-2xl p-6 border border-orange-200/50 dark:border-orange-700/50 hover:scale-105 transition-transform duration-300">
                    <div className="flex items-center justify-between mb-3">
                      <AlertCircle className="w-8 h-8 text-orange-500" />
                      <div className="w-2 h-2 bg-orange-500 rounded-full animate-pulse"></div>
                    </div>
                    <h5 className="text-2xl font-bold text-slate-900 dark:text-slate-100">5</h5>
                    <p className="text-sm text-slate-600 dark:text-slate-400">Low Stock Alerts</p>
                    <div className="mt-2 flex items-center gap-1">
                      <AlertCircle className="w-3 h-3 text-orange-500" />
                      <span className="text-xs text-orange-600 dark:text-orange-400">Action Needed</span>
                    </div>
                  </div>
                </div>

                {/* Real-time Activity Feed */}
                <div className="bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-700/50 dark:to-slate-600/50 rounded-2xl p-6 border border-slate-200/50 dark:border-slate-600/50">
                  <h5 className="font-semibold text-slate-900 dark:text-slate-100 mb-4 flex items-center gap-2">
                    <Activity className="w-5 h-5 text-blue-500" />
                    Recent Activity
                  </h5>
                  <div className="space-y-3">
                    <div className="flex items-center gap-3 p-3 bg-white/50 dark:bg-slate-800/50 rounded-xl">
                      <div className="w-8 h-8 bg-blue-500/20 rounded-full flex items-center justify-center">
                        <Users className="w-4 h-4 text-blue-500" />
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-medium text-slate-900 dark:text-slate-100">New patient registered</p>
                        <p className="text-xs text-slate-600 dark:text-slate-400">2 minutes ago</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 p-3 bg-white/50 dark:bg-slate-800/50 rounded-xl">
                      <div className="w-8 h-8 bg-green-500/20 rounded-full flex items-center justify-center">
                        <CheckCircle className="w-4 h-4 text-green-500" />
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-medium text-slate-900 dark:text-slate-100">Appointment completed</p>
                        <p className="text-xs text-slate-600 dark:text-slate-400">5 minutes ago</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 p-3 bg-white/50 dark:bg-slate-800/50 rounded-xl">
                      <div className="w-8 h-8 bg-orange-500/20 rounded-full flex items-center justify-center">
                        <AlertCircle className="w-4 h-4 text-orange-500" />
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-medium text-slate-900 dark:text-slate-100">Low stock alert</p>
                        <p className="text-xs text-slate-600 dark:text-slate-400">8 minutes ago</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Bottom Action Bar */}
            <div className="relative z-10 mt-8 flex items-center justify-between p-4 bg-gradient-to-r from-blue-500/5 to-purple-500/5 rounded-2xl border border-blue-200/20 dark:border-blue-700/20">
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
                  <span className="text-sm text-slate-600 dark:text-slate-400">System Status: Online</span>
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-slate-500" />
                  <span className="text-sm text-slate-600 dark:text-slate-400">Last updated: Just now</span>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <button className="px-4 py-2 bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-xl hover:from-blue-600 hover:to-purple-600 transition-all duration-200 text-sm font-medium">
                  View Full Dashboard
                </button>
                <button className="px-4 py-2 border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 transition-all duration-200 text-sm font-medium">
                  Export Data
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Call to Action */}
      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="container mx-auto">
          <div className="text-center">
            <div className="bg-gradient-to-r from-blue-500/10 to-purple-500/10 backdrop-blur-md rounded-3xl p-12 border border-blue-500/20">
              <h2 className="text-4xl sm:text-5xl font-bold mb-6 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                Ready to Transform Your Hospital?
              </h2>
              <p className="text-xl text-slate-600 dark:text-slate-300 mb-8 max-w-3xl mx-auto">
                Join thousands of healthcare professionals who have already revolutionized their operations with our platform.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                {isAuthenticated ? (
                  <Link
                    href="/dashboard"
                    className="px-10 py-5 bg-gradient-to-r from-blue-600 to-purple-600 text-white font-bold text-xl rounded-2xl hover:from-blue-700 hover:to-purple-700 transition-all duration-200 shadow-2xl hover:shadow-3xl hover:scale-105 flex items-center justify-center gap-3"
                  >
                    <Rocket className="w-6 h-6" />
                    Dashboard öffnen
                    <ArrowRight className="w-6 h-6" />
                  </Link>
                ) : (
                  <>
                    <Link
                      href="/login"
                      className="px-10 py-5 bg-gradient-to-r from-blue-600 to-purple-600 text-white font-bold text-xl rounded-2xl hover:from-blue-700 hover:to-purple-700 transition-all duration-200 shadow-2xl hover:shadow-3xl hover:scale-105 flex items-center justify-center gap-3"
                    >
                      <Rocket className="w-6 h-6" />
                      Anmelden
                      <ArrowRight className="w-6 h-6" />
                    </Link>
                    <Link
                      href="/demo"
                      className="px-10 py-5 border-2 border-white/30 text-white font-bold text-xl rounded-2xl hover:bg-white/10 transition-all duration-200 flex items-center justify-center gap-3"
                    >
                      <Play className="w-6 h-6" />
                      Watch Demo
                    </Link>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-slate-900 text-white py-12 px-4 sm:px-6 lg:px-8">
        <div className="container mx-auto">
          <div className="text-center">
            <div className="flex items-center justify-center gap-3 mb-6">
              <div className="w-10 h-10 bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl flex items-center justify-center">
                <Heart className="w-6 h-6 text-white" />
              </div>
              <span className="text-2xl font-bold">Hospital Management System</span>
            </div>
            <p className="text-slate-400 mb-6">
              Transforming healthcare through innovative technology
            </p>
            <div className="flex justify-center gap-6">
              {isAuthenticated ? (
                <Link href="/dashboard" className="text-slate-400 hover:text-white transition-colors">
                  Dashboard öffnen
                </Link>
              ) : (
                <>
                  <Link href="/login" className="text-slate-400 hover:text-white transition-colors">
                    Anmelden
                  </Link>
                  <Link href="/demo" className="text-slate-400 hover:text-white transition-colors">
                    Watch Demo
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}