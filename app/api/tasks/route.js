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
  const hoursInt = parseInt(hours, 10);
  if (!hoursInt || hoursInt <= 0) {
    return NextResponse.json({ error: "Invalid hours value." }, { status: 400 });
  }

  // We use a transaction so both the Task AND the BacklogItem update together safely
  const result = await prisma.$transaction(async (tx) => {
    const item = await tx.backlogItem.findUnique({
      where: { id: parseInt(backlogItemId) },
      include: { sprint: true }
    });

    if (!item) {
      throw new Error("Backlog item not found");
    }

    if (item.sprintId && item.sprint?.status === 'active') {
      const totalLogged = await tx.task.aggregate({
        _sum: { loggedHours: true },
        where: {
          backlogItem: { sprintId: item.sprintId }
        }
      });

      const currentLogged = totalLogged._sum.loggedHours || 0;
      if (currentLogged + hoursInt > item.sprint.capacity) {
        throw new Error(`Sprint capacity exceeded: only ${item.sprint.capacity - currentLogged}h remaining.`);
      }
    }

    // 1. Add the logged hours to the task
    const updatedTask = await tx.task.update({
      where: { id: parseInt(taskId) },
      data: { loggedHours: { increment: hoursInt } }
    });

    // We do not change backlog item remaining effort here, because logging hours
    // should not automatically complete a story or task.
    return updatedTask;
  });

  return NextResponse.json(result);
}

export async function PATCH(request) {
  const { taskId } = await request.json();
  if (!taskId) {
    return NextResponse.json({ error: "Missing taskId." }, { status: 400 });
  }

  try {
    const updatedTask = await prisma.task.update({
      where: { id: parseInt(taskId) },
      data: { status: 'done' }
    });
    return NextResponse.json(updatedTask);
  } catch (error) {
    return NextResponse.json({ error: "Failed to complete task." }, { status: 500 });
  }
}