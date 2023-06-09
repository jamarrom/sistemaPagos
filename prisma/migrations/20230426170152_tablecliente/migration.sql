-- CreateTable
CREATE TABLE "clientes" (
    "cliente_id" SERIAL NOT NULL,
    "nombre" VARCHAR(80),
    "apellidos" VARCHAR(120),
    "telefono" VARCHAR(20),
    "user_id" INTEGER,
    "activo" SMALLINT,

    CONSTRAINT "clientes_pkey" PRIMARY KEY ("cliente_id")
);

-- AddForeignKey
ALTER TABLE "clientes" ADD CONSTRAINT "fk_user_id" FOREIGN KEY ("user_id") REFERENCES "users"("user_id") ON DELETE NO ACTION ON UPDATE NO ACTION;
