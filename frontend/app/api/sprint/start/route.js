// src/app/api/sprint/start/route.js
import { PrismaClient } from '@prisma/client';
import { NextResponse } from 'next/server';

const prisma = new PrismaClient();

export async function POST(request) {
  try {
    const { ids } = await request.json(); // Array of Item IDs to lock

    // Bulk update all items in the list
    const updated = await prisma.backlogItem.updateMany({
      where: {
        id: { in: ids } // "WHERE id IN (1, 2, 3...)"
      },
      data: {
        status: 'sprint_locked' // The "Lock"
      }
    });

    return NextResponse.json({ message: "Sprint Started", count: updated.count });
  } catch (error) {
    return NextResponse.json({ error: "Failed to start sprint" }, { status: 500 });
  }
}