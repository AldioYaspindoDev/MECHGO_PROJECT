-- CreateTable
CREATE TABLE "mechanics" (
    "id" SERIAL NOT NULL,
    "user_id" INTEGER NOT NULL,
    "specialization" VARCHAR(100) NOT NULL,
    "experience_years" INTEGER NOT NULL,
    "rating_avg" DECIMAL(3,2) NOT NULL DEFAULT 0,
    "is_available" BOOLEAN NOT NULL DEFAULT true,
    "current_lat" DOUBLE PRECISION,
    "current_lng" DOUBLE PRECISION,

    CONSTRAINT "mechanics_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "mechanics" ADD CONSTRAINT "mechanics_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
