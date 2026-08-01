-- CreateTable
CREATE TABLE "ClotureCaisse" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "date" DATETIME NOT NULL,
    "totalEncaisse" REAL NOT NULL,
    "nombreVentes" INTEGER NOT NULL,
    "cloturePar" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateIndex
CREATE UNIQUE INDEX "ClotureCaisse_date_key" ON "ClotureCaisse"("date");
