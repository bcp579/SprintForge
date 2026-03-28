import { PrismaClient } from '@prisma/client';
import { NextResponse } from 'next/server';

const prisma = new PrismaClient();

export async function GET() {
  try {
    // Find the sprint that is currently "active" and include all its items and nested tasks
    const activeSprint = await prisma.sprint.findFirst({
      where: { status: 'active' },
      include: {
        items: {
          include: { tasks: true } // Fetch the nested tasks too!
        }
      }
    });

    if (!activeSprint) {
      return NextResponse.json({ error: "No active sprint found" }, { status: 404 });
    }

    return NextResponse.json(activeSprint);
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch active sprint" }, { status: 500 });
  }
}