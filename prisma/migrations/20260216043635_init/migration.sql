-- CreateTable
CREATE TABLE "BacklogItem" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "description" TEXT NOT NULL,
    "priority" TEXT NOT NULL,
    "effort" INTEGER NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'product_backlog'
);

-- CreateTable
CREATE TABLE "Task" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "description" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'todo',
    "backlogItemId" INTEGER NOT NULL,
    CONSTRAINT "Task_backlogItemId_fkey" FOREIGN KEY ("backlogItemId") REFERENCES "BacklogItem" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
