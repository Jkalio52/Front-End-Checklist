-- AlterTable: add githubUsername column
ALTER TABLE "User" ADD COLUMN "githubUsername" TEXT;

-- AlterTable: change isProfilePublic default from false to true
ALTER TABLE "User" ALTER COLUMN "isProfilePublic" SET DEFAULT true;
