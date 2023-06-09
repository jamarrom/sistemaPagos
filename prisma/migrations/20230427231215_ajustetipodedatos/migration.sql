/*
  Warnings:

  - Changed the type of `cliente_id` on the `ordenespagos` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.

*/
-- AlterTable
ALTER TABLE "ordenespagos" DROP COLUMN "cliente_id",
ADD COLUMN     "cliente_id" INTEGER NOT NULL;

-- AddForeignKey
ALTER TABLE "ordenespagos" ADD CONSTRAINT "fk_cliente_pagos_id" FOREIGN KEY ("cliente_id") REFERENCES "clientes"("cliente_id") ON DELETE NO ACTION ON UPDATE NO ACTION;
