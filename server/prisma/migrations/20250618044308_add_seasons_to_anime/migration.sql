/*
  Warnings:

  - You are about to drop the column `anime_id` on the `Episode` table. All the data in the column will be lost.
  - Added the required column `seasonId` to the `Episode` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "Episode" DROP CONSTRAINT "Episode_anime_id_fkey";

-- 1. Crear la columna seasonId como NULL temporalmente
ALTER TABLE "Episode" ADD COLUMN "seasonId" INTEGER;

-- 2. Crear la tabla Season
CREATE TABLE "Season" (
    "id" SERIAL NOT NULL,
    "animeId" INTEGER NOT NULL,
    "number" INTEGER NOT NULL,
    CONSTRAINT "Season_pkey" PRIMARY KEY ("id")
);

-- 3. Crear una temporada para cada anime existente (número = 1)
INSERT INTO "Season" ("animeId", "number")
SELECT "id", 1 FROM "Anime";

-- 4. Asignar los episodios existentes a la temporada creada de su anime
UPDATE "Episode" e
SET "seasonId" = (
  SELECT s."id" FROM "Season" s WHERE s."animeId" = e."anime_id" AND s."number" = 1
);

-- 5. Hacer la columna seasonId NOT NULL
ALTER TABLE "Episode" ALTER COLUMN "seasonId" SET NOT NULL;

-- 6. Eliminar la columna anime_id
ALTER TABLE "Episode" DROP COLUMN "anime_id";

-- AddForeignKey
ALTER TABLE "Season" ADD CONSTRAINT "Season_animeId_fkey" FOREIGN KEY ("animeId") REFERENCES "Anime"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Episode" ADD CONSTRAINT "Episode_seasonId_fkey" FOREIGN KEY ("seasonId") REFERENCES "Season"("id") ON DELETE CASCADE ON UPDATE CASCADE;

