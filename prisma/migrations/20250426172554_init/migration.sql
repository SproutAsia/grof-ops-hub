-- CreateTable
CREATE TABLE "FollowUp" (
    "id" TEXT NOT NULL,
    "saleId" TEXT NOT NULL,
    "channels" TEXT[],
    "notes" TEXT NOT NULL,
    "createDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "userId" TEXT NOT NULL,
    "userEmail" TEXT NOT NULL,

    CONSTRAINT "FollowUp_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OdooDataCache" (
    "id" TEXT NOT NULL,
    "month" TEXT NOT NULL,
    "data" JSONB NOT NULL,
    "lastUpdated" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "version" INTEGER NOT NULL DEFAULT 1,

    CONSTRAINT "OdooDataCache_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "OdooDataCache_month_key" ON "OdooDataCache"("month");

-- CreateIndex
CREATE INDEX "OdooDataCache_month_idx" ON "OdooDataCache"("month");

-- CreateIndex
CREATE INDEX "OdooDataCache_expiresAt_idx" ON "OdooDataCache"("expiresAt");
