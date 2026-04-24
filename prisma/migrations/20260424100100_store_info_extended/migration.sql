-- BE-123: structured store info (about + map location)
ALTER TABLE "stores"
  ADD COLUMN "aboutShort" VARCHAR(120),
  ADD COLUMN "aboutLong" TEXT,
  ADD COLUMN "locationLat" DECIMAL(10, 7),
  ADD COLUMN "locationLng" DECIMAL(10, 7),
  ADD COLUMN "locationLabel" VARCHAR(120);
