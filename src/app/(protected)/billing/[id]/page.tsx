import InvoiceDetailClient from './invoice-detail-client'

export default function InvoiceDetailPage({ params }: { params: { id: string } }) {
  return <InvoiceDetailClient invoiceId={params.id} />
}