import PrescriptionsClient from './prescriptions-client'

// Disable static generation to prevent caching
export const dynamic = 'force-dynamic'
export const revalidate = 0

export default async function PrescriptionsPage() {
  // Pass empty arrays initially - the client component will fetch data
  return (
    <PrescriptionsClient 
      initialPrescriptions={[]}
      patients={[]}
      medications={[]}
      userRole="admin"
    />
  )
}