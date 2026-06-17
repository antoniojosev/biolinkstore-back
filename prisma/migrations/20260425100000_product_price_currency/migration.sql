-- Product.priceCurrency: vendedor elige la moneda con la que define el basePrice (USD | EUR | VES).
-- Default USD para nuevos productos. Backfill USD para productos legacy (asuncion historica del MVP).

ALTER TABLE "products" ADD COLUMN "priceCurrency" TEXT NOT NULL DEFAULT 'USD';
