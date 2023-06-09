-- CreateTable
CREATE TABLE "status" (
    "status_id" SMALLSERIAL NOT NULL,
    "status" VARCHAR(100),

    CONSTRAINT "status_pkey" PRIMARY KEY ("status_id")
);

-- CreateTable
CREATE TABLE "ordenespagos" (
    "orden_pago_id" SERIAL NOT NULL,
    "cliente_id" VARCHAR(80) NOT NULL,
    "monto" REAL NOT NULL,
    "codigo_web" VARCHAR(255),
    "status_id" SMALLINT,
    "customer" VARCHAR(150),
    "order_id" VARCHAR(150),
    "openpay_id" VARCHAR(150),

    CONSTRAINT "ordenespagos_pkey" PRIMARY KEY ("orden_pago_id")
);

-- AddForeignKey
ALTER TABLE "ordenespagos" ADD CONSTRAINT "fk_status_id" FOREIGN KEY ("status_id") REFERENCES "status"("status_id") ON DELETE NO ACTION ON UPDATE NO ACTION;
