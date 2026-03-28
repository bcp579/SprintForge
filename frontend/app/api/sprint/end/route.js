import { PrismaClient } from '@prisma/client';
import { NextResponse } from 'next/server';

const prisma = new PrismaClient();

export async function POST(request) {
  try {
    const { sprintId } = await request.json();

    // 1. Fetch the sprint and all its items
    const sprint = await prisma.sprint.findUnique({
      where: { id: parseInt(sprintId) },
      include: { items: true }
    });

    if (!sprint) return NextResponse.json({ error: "Sprint not found" }, { status: 404 });

    // 2. Separate Completed vs Unfinished items
    const completedItems = sprint.items.filter(item => item.remainingEffort === 0);
    const unfinishedItems = sprint.items.filter(item => item.remainingEffort > 0);

    // 3. Calculate Velocity (Total original effort of perfectly completed items)
    const velocity = completedItems.reduce((sum, item) => sum + item.originalEffort, 0);

    // 4. Database Transaction
    await prisma.$transaction(async (tx) => {
      // A. Move unfinished items back to the Product Backlog
      if (unfinishedItems.length > 0) {
        const unfinishedIds = unfinishedItems.map(item => item.id);
        await tx.backlogItem.updateMany({
          where: { id: { in: unfinishedIds } },
          data: { 
            status: 'product_backlog', 
            sprintId: null // Remove them from this sprint's lock
          }
        });
      }

      // B. Mark Sprint as Completed (You could add a velocity field to your DB later to save this!)
      await tx.sprint.update({
        where: { id: parseInt(sprintId) },
        data: { status: 'completed' }
      });
    });

    return NextResponse.json({ 
      message: "Sprint Closed Successfully", 
      velocity: velocity,
      unfinishedReturned: unfinishedItems.length 
    });

  } catch (error) {
    console.error("End Sprint Error:", error);
    return NextResponse.json({ error: "Failed to end sprint" }, { status: 500 });
  }
}