-- CreateTable
CREATE TABLE "Match" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "workspaceId" TEXT NOT NULL,
    "bankTransactionId" TEXT NOT NULL,
    "qboTransactionId" TEXT NOT NULL,
    "matchType" TEXT NOT NULL,
    "confidence" REAL NOT NULL,
    "reasoning" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Match_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "Workspace" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Match_bankTransactionId_fkey" FOREIGN KEY ("bankTransactionId") REFERENCES "Transaction" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Match_qboTransactionId_fkey" FOREIGN KEY ("qboTransactionId") REFERENCES "Transaction" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "Match_bankTransactionId_qboTransactionId_key" ON "Match"("bankTransactionId", "qboTransactionId");
