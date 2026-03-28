import { PrismaClient } from '@prisma/client';
import { NextResponse } from 'next/server';

const prisma = new PrismaClient();

// POST: Add a new engineering task
export async function POST(request) {
  const { description, backlogItemId } = await request.json();
  
  const newTask = await prisma.task.create({
    data: { 
      description: description, 
      backlogItemId: parseInt(backlogItemId) 
    }
  });
  return NextResponse.json(newTask);
}

// PUT: Log Hours & Update Progress
export async function PUT(request) {
  const { taskId, hours, backlogItemId } = await request.json();
  const hoursInt = parseInt(hours);

  // We use a transaction so both the Task AND the BacklogItem update together safely
  const result = await prisma.$transaction(async (tx) => {
    
    // 1. Add the logged hours to the task
    const updatedTask = await tx.task.update({
      where: { id: parseInt(taskId) },
      data: { loggedHours: { increment: hoursInt } }
    });

    // 2. Deduct those hours from the Parent Backlog Item's remaining effort
    const item = await tx.backlogItem.findUnique({ where: { id: parseInt(backlogItemId) }});
    
    let newRemaining = item.remainingEffort - hoursInt;
    if (newRemaining < 0) newRemaining = 0; // Prevent negative hours! (Test Case Pass)

    await tx.backlogItem.update({
      where: { id: parseInt(backlogItemId) },
      data: { remainingEffort: newRemaining }
    });

    return updatedTask;
  });

  return NextResponse.json(result);
}