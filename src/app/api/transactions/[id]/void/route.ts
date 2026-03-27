import { NextResponse } from 'next/server';
import { db } from '@/src/db';
import { transactions } from '@/src/db/schema';
import { eq } from 'drizzle-orm';

async function getBalanceStats() {
  const allTxs = await db.select().from(transactions);
  let total_deposited = 0;
  let total_withdrawn = 0;
  
  for (const t of allTxs) {
    if (!t.is_voided) {
      if (t.type === 'deposit') {
        total_deposited += Number(t.amount);
      } else if (t.type === 'withdraw') {
        total_withdrawn += Number(t.amount);
      }
    }
  }
  
  return total_deposited - total_withdrawn;
}

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const txId = parseInt(id, 10);
    if (isNaN(txId)) {
      return NextResponse.json({ error: 'Invalid transaction ID' }, { status: 400 });
    }

    const [updatedTx] = await db.update(transactions)
      .set({ is_voided: true })
      .where(eq(transactions.id, txId))
      .returning();

    if (!updatedTx) {
      return NextResponse.json({ error: 'Transaction not found' }, { status: 404 });
    }

    const current_balance = await getBalanceStats();

    return NextResponse.json({
      success: true,
      message: 'Transaction voided',
      current_balance
    });
  } catch (error) {
    console.error('PATCH /api/transactions/[id]/void error:', error);
    return NextResponse.json({ error: 'Failed to void transaction' }, { status: 500 });
  }
}
