/*
  Warnings:

  - You are about to drop the column `effort` on the `BacklogItem` table. All the data in the column will be lost.
  - Added the required column `originalEffort` to the `BacklogItem` table without a default value. This is not possible if the table is not empty.
  - Added the required column `remainingEffort` to the `BacklogItem` table without a default value. This is not possible if the table is not empty.

*/
-- CreateTable
CREATE TABLE "Sprint" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT NOT NULL,
    "capacity" INTEGER NOT NULL,
    "duration" INTEGER NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'planning'
);

-- CreateTable
CREATE TABLE "DailySprintLog" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "sprintId" INTEGER NOT NULL,
    "date" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "remainingEffort" INTEGER NOT NULL
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_BacklogItem" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "description" TEXT NOT NULL,
    "priority" TEXT NOT NULL,
    "originalEffort" INTEGER NOT NULL,
    "remainingEffort" INTEGER NOT NULL,
    "risk" TEXT,
    "status" TEXT NOT NULL DEFAULT 'product_backlog',
    "sprintId" INTEGER,
    CONSTRAINT "BacklogItem_sprintId_fkey" FOREIGN KEY ("sprintId") REFERENCES "Sprint" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_BacklogItem" ("description", "id", "priority", "status") SELECT "description", "id", "priority", "status" FROM "BacklogItem";
DROP TABLE "BacklogItem";
ALTER TABLE "new_BacklogItem" RENAME TO "BacklogItem";
CREATE TABLE "new_Task" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "description" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'todo',
    "loggedHours" INTEGER NOT NULL DEFAULT 0,
    "backlogItemId" INTEGER NOT NULL,
    CONSTRAINT "Task_backlogItemId_fkey" FOREIGN KEY ("backlogItemId") REFERENCES "BacklogItem" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_Task" ("backlogItemId", "description", "id", "status") SELECT "backlogItemId", "description", "id", "status" FROM "Task";
DROP TABLE "Task";
ALTER TABLE "new_Task" RENAME TO "Task";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
