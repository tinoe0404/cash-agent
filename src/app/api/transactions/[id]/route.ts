import { NextResponse } from 'next/server';
import { db } from '@/src/db';
import { transactions } from '@/src/db/schema';
import { eq } from 'drizzle-orm';

async function getBalanceStats() {
  const allTxs = await db.select().from(transactions);
  let total_deposited = 0;
  let total_withdrawn = 0;
  let total_owing = 0;
  
  for (const t of allTxs) {
    if (!t.is_voided) {
      if (t.type === 'deposit') {
        total_deposited += Number(t.amount);
      } else if (t.type === 'withdraw') {
        total_withdrawn += Number(t.amount);
        if (t.is_owing) {
          total_owing += Number(t.amount);
        }
      }
    }
  }
  
  const current_balance = total_deposited - total_withdrawn;
  const potential_balance = current_balance + total_owing;
  return { total_deposited, total_withdrawn, total_owing, current_balance, potential_balance };
}

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const txId = parseInt(id, 10);
    if (isNaN(txId)) {
      return NextResponse.json({ error: 'Invalid transaction ID' }, { status: 400 });
    }

    const body = await req.json();
    const { type, amount, description, category, is_owing } = body;
    
    if (type !== 'deposit' && type !== 'withdraw') {
      return NextResponse.json({ error: 'Invalid transaction type' }, { status: 400 });
    }
    
    if (!amount || Number(amount) <= 0) {
      return NextResponse.json({ error: 'Amount must be greater than 0' }, { status: 400 });
    }
    
    if (!description || typeof description !== 'string' || description.trim() === '') {
      return NextResponse.json({ error: 'Description is required' }, { status: 400 });
    }

    const [updatedTx] = await db.update(transactions)
      .set({
        type,
        amount: amount.toString(),
        description: description.trim(),
        category: (category || 'Other').trim(),
        is_owing: type === 'withdraw' ? (is_owing || false) : false,
      })
      .where(eq(transactions.id, txId))
      .returning();

    if (!updatedTx) {
      return NextResponse.json({ error: 'Transaction not found' }, { status: 404 });
    }

    const stats = await getBalanceStats();

    return NextResponse.json({
      success: true,
      transaction: updatedTx,
      ...stats
    });
  } catch (error) {
    console.error('PUT /api/transactions/[id] error:', error);
    return NextResponse.json({ error: 'Failed to update transaction' }, { status: 500 });
  }
}
