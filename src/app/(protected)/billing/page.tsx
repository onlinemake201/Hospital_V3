import BillingPage from './billing-page-client'
import { getApiUrl } from '@/lib/url-utils'

async function getBillingData() {
  try {
    const response = await fetch(getApiUrl('/api/billing'), {
      headers: {
        'Content-Type': 'application/json',
      },
    })

    if (!response.ok) {
      throw new Error('Failed to fetch billing data')
    }

    const data = await response.json()
    return {
      invoices: data.invoices || []
    }
  } catch (error) {
    console.error('Error fetching billing data:', error)
    return {
      invoices: []
    }
  }
}

export default async function BillingPageServer() {
  // Disable server-side data fetching to avoid stale data
  // const billingData = await getBillingData()
  
  return <BillingPage initialInvoices={[]} />
}