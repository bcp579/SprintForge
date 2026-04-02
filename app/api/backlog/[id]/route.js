import { PrismaClient } from '@prisma/client';
import { NextResponse } from 'next/server';

const prisma = new PrismaClient();

// PUT: Modify existing item
export async function PUT(request, { params }) {
  try {
    // FIX: Next.js 15 requires awaiting params
    const resolvedParams = await params; 
    const id = resolvedParams.id;
    
    const body = await request.json();

    const updatedItem = await prisma.backlogItem.update({
      where: { id: parseInt(id) },
      data: {
        description: body.description,
        priority: body.priority,
        originalEffort: parseInt(body.originalEffort),
        risk: body.risk,
      },
    });
    return NextResponse.json(updatedItem);
  } catch (error) {
    console.error("PUT Error:", error);
    return NextResponse.json({ error: "Failed to update item" }, { status: 500 });
  }
}

export async function PATCH(request, { params }) {
  try {
    const resolvedParams = await params;
    const id = resolvedParams.id;
    const body = await request.json();

    if (!body.status) {
      return NextResponse.json({ error: "Missing status." }, { status: 400 });
    }

    const updatedItem = await prisma.backlogItem.update({
      where: { id: parseInt(id) },
      data: {
        status: body.status,
        remainingEffort: body.status === 'completed' ? 0 : undefined
      }
    });
    return NextResponse.json(updatedItem);
  } catch (error) {
    console.error("PATCH Error:", error);
    return NextResponse.json({ error: "Failed to update item" }, { status: 500 });
  }
}

// DELETE: Remove an item
export async function DELETE(request, { params }) {
  try {
    // FIX: Next.js 15 requires awaiting params
    const resolvedParams = await params;
    const id = resolvedParams.id;
    
    const existing = await prisma.backlogItem.findUnique({ where: { id: parseInt(id) } });
    if (!existing) {
      return NextResponse.json({ error: "Item not found" }, { status: 404 });
    }

    await prisma.backlogItem.delete({
      where: { id: parseInt(id) },
    });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("DELETE Error:", error);
    return NextResponse.json({ error: "Failed to delete item" }, { status: 500 });
  }
}