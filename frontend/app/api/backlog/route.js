// src/app/api/backlog/route.js
import { PrismaClient } from '@prisma/client';
import { NextResponse } from 'next/server';

const prisma = new PrismaClient();

// GET: Fetch all items (Sorted by Priority)
export async function GET() {
  const items = await prisma.backlogItem.findMany({
    orderBy: { priority: 'asc' }, // Note: You might need custom sorting later
  });
  return NextResponse.json(items);
}

// POST: Add a new item
export async function POST(request) {
  const body = await request.json();
  const newItem = await prisma.backlogItem.create({
    data: {
      description: body.description,
      priority: body.priority,
      effort: parseInt(body.effort),
      status: 'product_backlog'
    },
  });
  return NextResponse.json(newItem);
}