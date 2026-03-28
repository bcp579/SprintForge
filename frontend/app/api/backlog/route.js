// src/app/api/backlog/route.js
import { PrismaClient } from '@prisma/client';
import { NextResponse } from 'next/server';

const prisma = new PrismaClient();

// GET: Fetch all items
export async function GET() {
  const items = await prisma.backlogItem.findMany({
    orderBy: { priority: 'asc' }, // Will sort alphabetically for now
  });
  return NextResponse.json(items);
}

// POST: Add a new item (Updated with Risk and OriginalEffort)
export async function POST(request) {
  try {
    const body = await request.json();
    
    // Validation (Matches your test case: add_item_missing_title)
    if (!body.description) {
      return NextResponse.json({ error: "Title is required" }, { status: 400 });
    }

    const effort = parseInt(body.effort);
    if (effort < 0) {
      return NextResponse.json({ error: "Estimate cannot be negative" }, { status: 400 });
    }

    const newItem = await prisma.backlogItem.create({
      data: {
        description: body.description,
        priority: body.priority,
        originalEffort: effort,
        remainingEffort: effort, // Initially, remaining equals original
        risk: body.risk || "Low",
        status: 'product_backlog'
      },
    });
    return NextResponse.json(newItem);
  } catch (error) {
    return NextResponse.json({ error: "Failed to create item" }, { status: 500 });
  }
}