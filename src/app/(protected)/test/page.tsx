"use client"

import React from 'react'

export default function TestPage() {
  return (
    <main className="container py-8 space-y-6">
      <h1 className="text-3xl font-semibold tracking-tight">Test Page</h1>
      <p className="text-muted-foreground">This is a test page to check if client components are rendering.</p>
      <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded">
        ✅ Client component is working!
      </div>
    </main>
  )
}
