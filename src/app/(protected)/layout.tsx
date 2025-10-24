import ProtectedLayoutClient from '@/components/protected-layout-client'

export default async function ProtectedLayout({ children }: { children: React.ReactNode }) {
  // Use try-catch to handle any server-side errors gracefully
  let companyName = 'Hospital Management System'
  let companyLogo = ''
  let currency = 'CHF'
  let userRole = 'User'

  try {
    const { getCompanyName, getCompanyLogo, getCurrency } = await import('@/lib/system-settings')
    const { getUserRole } = await import('@/lib/rbac')
    
    companyName = await getCompanyName()
    companyLogo = await getCompanyLogo()
    currency = await getCurrency()
    userRole = await getUserRole() || 'User'
  } catch (error) {
    console.warn('Error loading server-side data, using defaults:', error)
  }

  return (
    <ProtectedLayoutClient 
      companyName={companyName} 
      companyLogo={companyLogo} 
      currency={currency}
      userRole={userRole}
    >
      {children}
    </ProtectedLayoutClient>
  )
}