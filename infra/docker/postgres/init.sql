-- Chay mot lan khi container Postgres duoc khoi tao lan dau.
--
-- Chi tao schema o day. Cac extension (pg_trgm, unaccent, vector) do Prisma
-- so huu qua `extensions = [...]` trong datasource, nen chung duoc tao trong
-- migration dau tien. Neu tao chung o day, Prisma se bao drift va doi reset.

-- Moi service so huu mot schema rieng, migration history tach biet (AD-2).
CREATE SCHEMA IF NOT EXISTS catalog;
CREATE SCHEMA IF NOT EXISTS orders;
CREATE SCHEMA IF NOT EXISTS auth;
