-- CreateEnum
CREATE TYPE "PaymentTypeEnum" AS ENUM ('CARD', 'CASH');

-- CreateEnum
CREATE TYPE "CategoryEnum" AS ENUM ('SAVINGS', 'EXPENSE', 'INVESTMENT');

-- CreateEnum
CREATE TYPE "StatusEnum" AS ENUM ('PENDING', 'COMPLETED', 'FAILED', 'INITIATE');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "firstName" TEXT NOT NULL,
    "lastName" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "avatar" TEXT,
    "location" TEXT,
    "dob" TIMESTAMP(3),
    "computedLocation" JSONB,
    "passwordResetToken" TEXT,
    "passwordResetTokenExpiresAt" TIMESTAMP(3),

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Transaction" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "amount" INTEGER NOT NULL,
    "location" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "senderBankId" TEXT,
    "receiverBankId" TEXT,
    "accountId" TEXT,
    "status" "StatusEnum" NOT NULL DEFAULT 'INITIATE',
    "category" "CategoryEnum" NOT NULL DEFAULT 'EXPENSE',
    "paymentType" "PaymentTypeEnum" NOT NULL DEFAULT 'CARD',

    CONSTRAINT "Transaction_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- AddForeignKey
ALTER TABLE "Transaction" ADD CONSTRAINT "Transaction_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
