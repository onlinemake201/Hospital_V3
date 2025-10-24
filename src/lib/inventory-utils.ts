import { databases, COLLECTIONS, QueryHelpers, handleAppwriteError, ID } from './appwrite'

export async function generateMedicationCode(): Promise<string> {
  try {
    // Get all medications - use a higher limit to ensure we get all
    const medications = await databases.listDocuments(
      process.env.APPWRITE_DATABASE_ID || 'hospital_main',
      COLLECTIONS.MEDICATIONS,
      [
        QueryHelpers.orderAsc('$createdAt'),
        QueryHelpers.limit(100) // Get up to 100 medications
      ]
    )

    // Filter medications that start with 'MED' on the client side
    const medMedications = medications.documents.filter(med => 
      med.code && med.code.startsWith('MED')
    )

    // Extract all numbers and find the highest
    const numbers = medMedications
      .map(med => {
        const match = med.code.match(/MED(\d+)/)
        return match ? parseInt(match[1]) : 0
      })
      .filter(num => num > 0)

    const nextNumber = numbers.length > 0 ? Math.max(...numbers) + 1 : 1

    // Format as MED001, MED002, etc.
    return `MED${nextNumber.toString().padStart(3, '0')}`
  } catch (error) {
    console.error('Error generating medication code:', error)
    return `MED${Date.now().toString().slice(-3)}` // Fallback
  }
}

export async function reorderMedicationCodes(): Promise<void> {
  try {
    // Get all medications ordered by creation date
    const medications = await databases.listDocuments(
      process.env.APPWRITE_DATABASE_ID || 'hospital_main',
      COLLECTIONS.MEDICATIONS,
      [QueryHelpers.orderAsc('$createdAt')]
    )

    // Update codes sequentially
    for (let i = 0; i < medications.documents.length; i++) {
      const newCode = `MED${(i + 1).toString().padStart(3, '0')}`
      if (medications.documents[i].code !== newCode) {
        await databases.updateDocument(
          process.env.APPWRITE_DATABASE_ID || 'hospital_main',
          COLLECTIONS.MEDICATIONS,
          medications.documents[i].$id,
          { code: newCode }
        )
      }
    }
  } catch (error) {
    console.error('Error reordering medication codes:', error)
    handleAppwriteError(error)
  }
}

export async function calculateCurrentStock(medicationId: string): Promise<number> {
  try {
    const movements = await databases.listDocuments(
      process.env.APPWRITE_DATABASE_ID || 'hospital_main',
      COLLECTIONS.STOCK_MOVEMENTS,
      [
        QueryHelpers.equal('medicationId', medicationId),
        QueryHelpers.orderAsc('$createdAt')
      ]
    )

    let stock = 0
    for (const movement of movements.documents) {
      if (movement.type === 'in') {
        stock += movement.quantity
      } else if (movement.type === 'out') {
        stock -= movement.quantity
      } else if (movement.type === 'adjustment') {
        stock = movement.quantity // Set absolute value
      }
    }

    return Math.max(0, stock) // Never go below 0
  } catch (error) {
    console.error('Error calculating current stock:', error)
    handleAppwriteError(error)
    return 0
  }
}

export async function recordStockMovement(
  medicationId: string,
  type: 'in' | 'out' | 'adjustment',
  quantity: number,
  reason?: string,
  referenceId?: string,
  referenceType?: string
): Promise<void> {
  try {
    const stockMovementData = {
      medicationId,
      type,
      quantity,
      reason: reason || null,
      referenceId: referenceId || null,
      referenceType: referenceType || null
    }

    await databases.createDocument(
      process.env.APPWRITE_DATABASE_ID || 'hospital_main',
      COLLECTIONS.STOCK_MOVEMENTS,
      ID.unique(),
      stockMovementData
    )
  } catch (error) {
    console.error('Error recording stock movement:', error)
    handleAppwriteError(error)
  }
}