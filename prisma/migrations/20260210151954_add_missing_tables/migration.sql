-- CreateTable
CREATE TABLE "RelationColumn" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "workspaceId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "sourceTable" TEXT NOT NULL,
    "targetTable" TEXT NOT NULL,
    "inverseColumnId" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "RelationColumn_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "Workspace" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "RelationLink" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "relationColumnId" TEXT NOT NULL,
    "sourceRecordId" TEXT NOT NULL,
    "targetRecordId" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "RelationLink_relationColumnId_fkey" FOREIGN KEY ("relationColumnId") REFERENCES "RelationColumn" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "RelationLink_relationColumnId_sourceRecordId_targetRecordId_key" ON "RelationLink"("relationColumnId", "sourceRecordId", "targetRecordId");
