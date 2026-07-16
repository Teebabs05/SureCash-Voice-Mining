-- CreateTable
CREATE TABLE "IntegrationCredential" (
    "key" TEXT NOT NULL,
    "encryptedValue" TEXT NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "updatedById" TEXT,

    CONSTRAINT "IntegrationCredential_pkey" PRIMARY KEY ("key")
);
