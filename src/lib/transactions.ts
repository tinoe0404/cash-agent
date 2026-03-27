import { db } from '../db';
import { transactions } from '../db/schema';
import { eq } from 'drizzle-orm';

export async function calculateBalances() {
  const allTxs = await db.select().from(transactions);
  
  let totalDeposited = 0;
  let totalWithdrawn = 0;
  
  for (const t of allTxs) {
    if (!t.is_voided) {
      if (t.type === 'deposit') totalDeposited += parseFloat(t.amount as string);
      if (t.type === 'withdraw') totalWithdrawn += parseFloat(t.amount as string);
    }
  }
  
  return {
    totalDeposited,
    totalWithdrawn,
    currentBalance: totalDeposited - totalWithdrawn
  };
}
