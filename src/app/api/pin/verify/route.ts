import { NextResponse } from 'next/server';
import { db } from '@/src/db';
import { settings } from '@/src/db/schema';
import { eq } from 'drizzle-orm';
import bcrypt from 'bcryptjs';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { pin } = body;

    if (!pin || typeof pin !== 'string') {
      return NextResponse.json({ error: 'PIN is required' }, { status: 400 });
    }

    const [pinSetting] = await db.select().from(settings).where(eq(settings.key, 'pin_hash'));

    if (!pinSetting) {
      return NextResponse.json({ setup_required: true });
    }

    const isMatch = await bcrypt.compare(pin, pinSetting.value);

    return NextResponse.json({ success: isMatch });
  } catch (error) {
    console.error('POST /api/pin/verify error:', error);
    return NextResponse.json({ error: 'Failed to verify PIN' }, { status: 500 });
  }
}
