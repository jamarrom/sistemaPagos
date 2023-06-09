-- CreateTable
CREATE TABLE "typesusers" (
    "typeuser_id" SMALLSERIAL NOT NULL,
    "typeuser" VARCHAR(100),

    CONSTRAINT "typesusers_pkey" PRIMARY KEY ("typeuser_id")
);

-- CreateTable
CREATE TABLE "users" (
    "user_id" SERIAL NOT NULL,
    "name" VARCHAR(100),
    "password" VARCHAR(120),
    "typeuser_id" SMALLINT,
    "email" VARCHAR(255),
    "active" SMALLINT,

    CONSTRAINT "users_pkey" PRIMARY KEY ("user_id")
);

-- AddForeignKey
ALTER TABLE "users" ADD CONSTRAINT "fk_typeuser_id" FOREIGN KEY ("typeuser_id") REFERENCES "typesusers"("typeuser_id") ON DELETE NO ACTION ON UPDATE NO ACTION;
