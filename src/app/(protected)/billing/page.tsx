import BillingPageClientV2 from './billing-page-client-v2'
import { getCurrency } from '@/lib/system-settings'

export default async function BillingPage() {
  const currency = await getCurrency()

  return (
    <BillingPageClientV2 
      initialInvoices={[]} 
      currency={currency} 
    />
  )
}