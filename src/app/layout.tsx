import type { Metadata, Viewport } from 'next'
import { Inter } from 'next/font/google'
import '../styles/globals.css'
import { ThemeProvider } from 'next-themes'
import { getCompanyName, getFavicon } from '@/lib/system-settings'
import ClientProviders from '@/components/client-providers'

const inter = Inter({ subsets: ['latin'] })

export async function generateMetadata(): Promise<Metadata> {
  let companyName = 'Hospital Management System'
  let favicon = '/favicon.ico'
  
  try {
    companyName = await getCompanyName()
    favicon = await getFavicon()
  } catch (error) {
    console.warn('Error loading metadata, using defaults:', error)
  }
  
  return {
    title: `${companyName} - Modern Healthcare Management`,
    description: 'Modern, calm Apple-style hospital management platform',
    keywords: ['hospital', 'healthcare', 'management', 'patients', 'appointments'],
    authors: [{ name: `${companyName} Team` }],
    robots: 'noindex, nofollow', // Healthcare data should not be indexed
    icons: {
      icon: favicon,
    },
  }
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <meta name="theme-color" content="#ffffff" />
      </head>
      <body className={`${inter.className} antialiased`}>
        <ClientProviders>
          {children}
        </ClientProviders>
      </body>
    </html>
  )
}