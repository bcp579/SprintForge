-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_BacklogItem" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "description" TEXT NOT NULL,
    "priority" TEXT NOT NULL,
    "originalEffort" INTEGER NOT NULL DEFAULT 0,
    "remainingEffort" INTEGER NOT NULL DEFAULT 0,
    "risk" TEXT,
    "status" TEXT NOT NULL DEFAULT 'product_backlog',
    "sprintId" INTEGER,
    CONSTRAINT "BacklogItem_sprintId_fkey" FOREIGN KEY ("sprintId") REFERENCES "Sprint" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_BacklogItem" ("description", "id", "originalEffort", "priority", "remainingEffort", "risk", "sprintId", "status") SELECT "description", "id", "originalEffort", "priority", "remainingEffort", "risk", "sprintId", "status" FROM "BacklogItem";
DROP TABLE "BacklogItem";
ALTER TABLE "new_BacklogItem" RENAME TO "BacklogItem";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
