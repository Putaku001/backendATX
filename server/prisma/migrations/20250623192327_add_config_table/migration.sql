-- CreateTable
CREATE TABLE "Config" (
    "id" SERIAL NOT NULL,
    "user_id" INTEGER NOT NULL,
    "mostrarListas" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "Config_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Config_user_id_key" ON "Config"("user_id");

-- AddForeignKey
ALTER TABLE "Config" ADD CONSTRAINT "Config_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
