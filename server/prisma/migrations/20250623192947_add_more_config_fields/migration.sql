-- AlterTable
ALTER TABLE "Config" ADD COLUMN     "calificarOpEd" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "mantenerTopAbierto" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "minimizarSiempre" BOOLEAN NOT NULL DEFAULT false;
