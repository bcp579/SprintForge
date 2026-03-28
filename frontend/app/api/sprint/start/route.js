import { PrismaClient } from '@prisma/client';
import { NextResponse } from 'next/server';

const prisma = new PrismaClient();

export async function POST(request) {
  try {
    const { name, capacity, duration, itemIds } = await request.json();

    // 1. Validation
    if (!name || !capacity || !itemIds || itemIds.length === 0) {
      return NextResponse.json({ error: "Missing required sprint details" }, { status: 400 });
    }

    // 2. Database Transaction: Create Sprint AND Update Items safely
    const result = await prisma.$transaction(async (tx) => {
      // A. Create the Sprint record
      const newSprint = await tx.sprint.create({
        data: {
          name: name,
          capacity: parseInt(capacity),
          duration: parseInt(duration),
          status: 'active'
        }
      });

      // B. Update the items to lock them and link to the new sprint
      await tx.backlogItem.updateMany({
        where: { id: { in: itemIds } },
        data: {
          status: 'sprint_locked',
          sprintId: newSprint.id
        }
      });

      return newSprint;
    });

    return NextResponse.json({ message: "Sprint Started", sprint: result });
  } catch (error) {
    console.error("Sprint Start Error:", error);
    return NextResponse.json({ error: "Failed to start sprint" }, { status: 500 });
  }
}