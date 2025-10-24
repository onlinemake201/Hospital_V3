'use client'

import { useEffect, useState } from 'react'
import { Clock, Activity } from 'lucide-react'

interface LiveDashboardProps {
  initialData: {
    todaysAppointments: number
    upcomingAppointments: number
    waitingPatients: number
    todaysRevenue: number
  }
}

export default function LiveDashboard({ initialData }: LiveDashboardProps) {
  const [data, setData] = useState(initialData)
  const [lastUpdate, setLastUpdate] = useState(new Date())

  useEffect(() => {
    const interval = setInterval(async () => {
      try {
        const response = await fetch('/api/dashboard/live')
        if (response.ok) {
          const newData = await response.json()
          setData(newData)
          setLastUpdate(new Date())
        }
      } catch (error) {
        console.error('Failed to fetch live data:', error)
      }
    }, 30000) // Update every 30 seconds

    return () => clearInterval(interval)
  }, [])

  return (
    <div className="mb-8 bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-lg border border-slate-200 dark:border-slate-700">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-6">
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
        <div className="text-right">
          <p className="text-xs text-slate-500 dark:text-slate-400">Last updated</p>
          <p className="text-sm font-medium text-slate-900 dark:text-slate-100">
            {lastUpdate.toLocaleTimeString()}
          </p>
        </div>
      </div>
    </div>
  )
}
