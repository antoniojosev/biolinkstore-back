-- Store.instagramImportRequestedAt: seteado cuando el owner elige "importar de
-- Instagram" en el onboarding. No dispara ningun scraping (eso es otra sesion) -
-- solo marca el pedido para que el dashboard muestre el aviso de "importando"
-- y, cuando el scraping real exista, para saber que stores tienen un pedido pendiente.

ALTER TABLE "stores" ADD COLUMN "instagramImportRequestedAt" TIMESTAMP(3);
