import { NextResponse } from 'next/server';
import { db } from '@/src/db';
import { transactions } from '@/src/db/schema';
import { desc } from 'drizzle-orm';

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
  
  const current_balance = total_deposited - total_withdrawn;
  return { total_deposited, total_withdrawn, current_balance };
}

export async function GET() {
  try {
    const list = await db.select().from(transactions).orderBy(desc(transactions.created_at));
    const stats = await getBalanceStats();
    
    return NextResponse.json({
      ...stats,
      transactions: list
    });
  } catch (error) {
    console.error('GET /api/transactions error:', error);
    return NextResponse.json({ error: 'Failed to fetch transactions' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { type, amount, description, category } = body;
    
    if (type !== 'deposit' && type !== 'withdraw') {
      return NextResponse.json({ error: 'Invalid transaction type' }, { status: 400 });
    }
    
    if (!amount || Number(amount) <= 0) {
      return NextResponse.json({ error: 'Amount must be greater than 0' }, { status: 400 });
    }
    
    if (!description || typeof description !== 'string' || description.trim() === '') {
      return NextResponse.json({ error: 'Description is required' }, { status: 400 });
    }
    
    if (!category || typeof category !== 'string' || category.trim() === '') {
      return NextResponse.json({ error: 'Category is required' }, { status: 400 });
    }

    if (type === 'withdraw') {
      const { current_balance } = await getBalanceStats();
      if (Number(amount) > current_balance) {
        return NextResponse.json({ error: 'Insufficient funds' }, { status: 400 });
      }
    }

    const [newTransaction] = await db.insert(transactions).values({
      type,
      amount: amount.toString(),
      description: description.trim(),
      category: category.trim(),
      is_voided: false
    }).returning();
    
    const { current_balance } = await getBalanceStats();

    return NextResponse.json({
      transaction: newTransaction,
      current_balance
    });

  } catch (error) {
    console.error('POST /api/transactions error:', error);
    return NextResponse.json({ error: 'Failed to create transaction' }, { status: 500 });
  }
}
