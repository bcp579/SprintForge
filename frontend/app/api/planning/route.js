// src/app/api/planning/route.js
import { PrismaClient } from '@prisma/client';
import { NextResponse } from 'next/server';

const prisma = new PrismaClient();

export async function POST(request) {
  const { capacity } = await request.json();

  // 1. Fetch all 'product_backlog' items
  const allItems = await prisma.backlogItem.findMany({
    where: { status: 'product_backlog' },
  });

  // 2. Sort Logic (High -> Medium -> Low)
  const priorityMap = { High: 3, Medium: 2, Low: 1 };
  const sortedItems = allItems.sort((a, b) => priorityMap[b.priority] - priorityMap[a.priority]);

  // 3. Selection Algorithm
  let currentLoad = 0;
  const proposedItems = [];

  for (const item of sortedItems) {
    if (currentLoad + item.effort <= capacity) {
      proposedItems.push(item);
      currentLoad += item.effort;
    }
  }

  return NextResponse.json(proposedItems);
}