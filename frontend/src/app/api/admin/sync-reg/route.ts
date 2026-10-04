import { NextResponse } from 'next/server';

export async function POST(request: Request) {
    return NextResponse.json({ success: true, message: "Sync logic migrated to NestJS backend", results: null });
}
