import { NextResponse } from 'next/server'
import { databases, QueryHelpers, handleAppwriteError } from '@/lib/appwrite'
import { COLLECTIONS } from '@/lib/appwrite'
// Force dynamic rendering
export const dynamic = 'force-dynamic'
import puppeteer from 'puppeteer'
import { getCompanyInfo } from '@/lib/company-info'
// Force dynamic rendering

export async function GET(request: Request, { params }: { params: { id: string } }) {
  try {
    const { id } = params

    if (!id || id === 'undefined') {
      return NextResponse.json({ error: 'Invalid invoice ID' }, { status: 400 })
    }

    // Check if Appwrite is configured
    if (!process.env.APPWRITE_PROJECT_ID) {
      return NextResponse.json({ error: 'Appwrite not configured' }, { status: 503 })
    }

    // Get invoice data
    const invoice = await databases.getDocument(
      process.env.APPWRITE_DATABASE_ID || 'hospital_main',
      COLLECTIONS.INVOICES,
      id
    )

    // Get patient data
    let patient = null
    if (invoice.patientId) {
      try {
        if (invoice.patientId.startsWith('P')) {
          const patientsQuery = await databases.listDocuments(
            process.env.APPWRITE_DATABASE_ID || 'hospital_main',
            COLLECTIONS.PATIENTS,
            [QueryHelpers.equal('patientNo', invoice.patientId)]
          )

          if (patientsQuery.documents.length > 0) {
            const patientDoc = patientsQuery.documents[0]
            patient = {
              id: patientDoc.$id,
              firstName: patientDoc.firstName,
              lastName: patientDoc.lastName,
              patientNo: patientDoc.patientNo,
              address: patientDoc.address || ''
            }
          }
        } else {
          const patientDoc = await databases.getDocument(
            process.env.APPWRITE_DATABASE_ID || 'hospital_main',
            COLLECTIONS.PATIENTS,
            invoice.patientId
          )
          patient = {
            id: patientDoc.$id,
            firstName: patientDoc.firstName,
            lastName: patientDoc.lastName,
            patientNo: patientDoc.patientNo,
            address: patientDoc.address || ''
          }
        }
      } catch (error) {
        console.error('Error fetching patient for invoice:', invoice.$id, error)
        patient = {
          id: invoice.patientId,
          firstName: 'Unknown',
          lastName: 'Patient',
          patientNo: invoice.patientId.startsWith('P') ? invoice.patientId : 'N/A',
          address: ''
        }
      }
    }

    // Get payments
    let payments: any[] = []
    try {
      const paymentsQuery = await databases.listDocuments(
        process.env.APPWRITE_DATABASE_ID || 'hospital_main',
        COLLECTIONS.PAYMENTS,
        [QueryHelpers.equal('invoiceId', invoice.$id)]
      )
      payments = paymentsQuery.documents.map(payment => ({
        id: payment.$id,
        amount: payment.amount,
        method: payment.method,
        paidAt: payment.paymentDate,
        reference: payment.notes || ''
      }))
    } catch (error) {
      console.error('Error fetching payments for invoice:', invoice.$id, error)
    }

    // Parse items
    const items = Array.isArray(invoice.items) ? invoice.items : JSON.parse(invoice.items || '[]')

    // Get company information
    const companyInfo = await getCompanyInfo()

    // Generate HTML for PDF
    const html = generateInvoiceHTML(invoice, patient, items, payments, companyInfo)

    // Generate PDF using Puppeteer
    const browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    })
    
    const page = await browser.newPage()
    await page.setContent(html, { waitUntil: 'networkidle0' })
    
    const pdf = await page.pdf({
      format: 'A4',
      printBackground: true,
      margin: {
        top: '20mm',
        right: '20mm',
        bottom: '20mm',
        left: '20mm'
      }
    })
    
    await browser.close()

    // Return PDF as response
    return new NextResponse(pdf as any, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="invoice-${invoice.invoiceNo}.pdf"`
      }
    })

  } catch (error: any) {
    console.error('Error generating PDF:', error)
    const appwriteError = handleAppwriteError(error)
    return NextResponse.json({
      error: appwriteError.message || 'Failed to generate PDF'
    }, { status: 500 })
  }
}

function generateInvoiceHTML(invoice: any, patient: any, items: any[], payments: any[], companyInfo: any) {
  const totalPaid = payments.reduce((sum, payment) => sum + Number(payment.amount), 0)
  const remainingBalance = invoice.balance

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>Invoice ${invoice.invoiceNo}</title>
      <style>
        body {
          font-family: Arial, sans-serif;
          margin: 0;
          padding: 20px;
          color: #333;
        }
        .header {
          display: flex;
          justify-content: space-between;
          margin-bottom: 30px;
          border-bottom: 2px solid #333;
          padding-bottom: 20px;
        }
        .company-info h1 {
          margin: 0;
          font-size: 24px;
          color: #2563eb;
        }
        .company-info p {
          margin: 5px 0;
          color: #666;
        }
        .invoice-info {
          text-align: right;
        }
        .invoice-info h2 {
          margin: 0;
          font-size: 20px;
          color: #333;
        }
        .invoice-info p {
          margin: 5px 0;
          color: #666;
        }
        .customer-info {
          margin-bottom: 30px;
        }
        .customer-info h3 {
          margin: 0 0 10px 0;
          color: #333;
        }
        .customer-info p {
          margin: 2px 0;
          color: #666;
        }
        .items-table {
          width: 100%;
          border-collapse: collapse;
          margin-bottom: 30px;
        }
        .items-table th,
        .items-table td {
          border: 1px solid #ddd;
          padding: 12px;
          text-align: left;
        }
        .items-table th {
          background-color: #f8f9fa;
          font-weight: bold;
        }
        .items-table .text-right {
          text-align: right;
        }
        .totals {
          display: flex;
          justify-content: flex-end;
          margin-bottom: 30px;
        }
        .totals-table {
          width: 300px;
        }
        .totals-table td {
          padding: 8px 12px;
          border-bottom: 1px solid #ddd;
        }
        .totals-table .total-row {
          font-weight: bold;
          background-color: #f8f9fa;
        }
        .payments {
          margin-bottom: 30px;
        }
        .payments h3 {
          margin: 0 0 15px 0;
          color: #333;
        }
        .payments-table {
          width: 100%;
          border-collapse: collapse;
        }
        .payments-table th,
        .payments-table td {
          border: 1px solid #ddd;
          padding: 8px 12px;
          text-align: left;
        }
        .payments-table th {
          background-color: #f8f9fa;
          font-weight: bold;
        }
        .payments-table .text-right {
          text-align: right;
        }
        .footer {
          margin-top: 50px;
          padding-top: 20px;
          border-top: 1px solid #ddd;
          text-align: center;
          color: #666;
          font-size: 12px;
        }
        .status {
          display: inline-block;
          padding: 4px 8px;
          border-radius: 4px;
          font-size: 12px;
          font-weight: bold;
          text-transform: uppercase;
        }
        .status.paid {
          background-color: #d4edda;
          color: #155724;
        }
        .status.partial {
          background-color: #fff3cd;
          color: #856404;
        }
        .status.pending {
          background-color: #f8d7da;
          color: #721c24;
        }
        .status.overdue {
          background-color: #f8d7da;
          color: #721c24;
        }
      </style>
    </head>
    <body>
      <div class="header">
        <div class="company-info">
          <h1>${companyInfo?.name || 'Hospital Management System'}</h1>
          <p>${companyInfo?.description || 'Modern Healthcare Management'}</p>
          <p>${companyInfo?.address || '123 Hospital Street'}, ${companyInfo?.postalCode || '12345'} ${companyInfo?.city || 'Medical City'}</p>
          ${companyInfo?.phone ? `<p>Phone: ${companyInfo.phone}</p>` : ''}
          ${companyInfo?.email ? `<p>Email: ${companyInfo.email}</p>` : ''}
          ${companyInfo?.website ? `<p>Website: ${companyInfo.website}</p>` : ''}
          ${companyInfo?.taxId ? `<p>Tax ID: ${companyInfo.taxId}</p>` : ''}
        </div>
        <div class="invoice-info">
          <h2>INVOICE</h2>
          <p><strong>Invoice No:</strong> ${invoice.invoiceNo}</p>
          <p><strong>Issue Date:</strong> ${new Date(invoice.issueDate).toLocaleDateString()}</p>
          <p><strong>Due Date:</strong> ${new Date(invoice.dueDate).toLocaleDateString()}</p>
          <p><strong>Status:</strong> <span class="status ${invoice.status}">${invoice.status}</span></p>
        </div>
      </div>

      <div class="customer-info">
        <h3>Bill To:</h3>
        <p><strong>${patient?.firstName} ${patient?.lastName}</strong></p>
        <p>Patient No: ${patient?.patientNo}</p>
        ${patient?.address ? `<p>${patient.address}</p>` : ''}
      </div>

      <table class="items-table">
        <thead>
          <tr>
            <th>Description</th>
            <th class="text-right">Quantity</th>
            <th class="text-right">Unit Price</th>
            <th class="text-right">Total</th>
          </tr>
        </thead>
        <tbody>
          ${items.map(item => `
            <tr>
              <td>${item.description}</td>
              <td class="text-right">${item.quantity}</td>
              <td class="text-right">${invoice.currency} ${Number(item.unitPrice || item.total / item.quantity).toFixed(2)}</td>
              <td class="text-right">${invoice.currency} ${Number(item.total).toFixed(2)}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>

      <div class="totals">
        <table class="totals-table">
          <tr>
            <td>Subtotal:</td>
            <td class="text-right">${invoice.currency} ${Number(invoice.amount).toFixed(2)}</td>
          </tr>
          <tr>
            <td>Total Paid:</td>
            <td class="text-right">${invoice.currency} ${totalPaid.toFixed(2)}</td>
          </tr>
          <tr class="total-row">
            <td>Balance Due:</td>
            <td class="text-right">${invoice.currency} ${remainingBalance.toFixed(2)}</td>
          </tr>
        </table>
      </div>

      ${payments.length > 0 ? `
        <div class="payments">
          <h3>Payment History</h3>
          <table class="payments-table">
            <thead>
              <tr>
                <th>Date</th>
                <th>Method</th>
                <th class="text-right">Amount</th>
                <th>Reference</th>
              </tr>
            </thead>
            <tbody>
              ${payments.map(payment => `
                <tr>
                  <td>${new Date(payment.paidAt).toLocaleDateString()}</td>
                  <td>${payment.method}</td>
                  <td class="text-right">${invoice.currency} ${Number(payment.amount).toFixed(2)}</td>
                  <td>${payment.reference}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      ` : ''}

      <div class="footer">
        <p>Thank you for your business!</p>
        <p>Generated on ${new Date().toLocaleDateString()} at ${new Date().toLocaleTimeString()}</p>
      </div>
    </body>
    </html>
  `
}

