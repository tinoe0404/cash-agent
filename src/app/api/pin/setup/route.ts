import { NextResponse } from 'next/server';
import { db } from '@/src/db';
import { settings } from '@/src/db/schema';
import bcrypt from 'bcryptjs';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { pin } = body;
    
    if (!pin || typeof pin !== 'string' || pin.trim() === '') {
      return NextResponse.json({ error: 'Password is required' }, { status: 400 });
    }

    const salt = await bcrypt.genSalt(10);
    const hash = await bcrypt.hash(pin, salt);

    await db.insert(settings).values({
      key: 'pin_hash',
      value: hash,
    }).onConflictDoUpdate({
      target: settings.key,
      set: { value: hash }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('POST /api/pin/setup error:', error);
    return NextResponse.json({ error: 'Failed to set up PIN' }, { status: 500 });
  }
}
