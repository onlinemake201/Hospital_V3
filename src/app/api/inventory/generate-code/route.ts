import { NextResponse } from 'next/server'
import { generateMedicationCode } from '@/lib/inventory-utils'

// Force dynamic rendering
export const dynamic = 'force-dynamic'
// Force dynamic rendering

export async function GET() {
  try {
    const code = await generateMedicationCode()
    return NextResponse.json({ code })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
