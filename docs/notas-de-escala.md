# Notas de escala — decisiones que hoy son correctas y en qué número dejan de serlo

> Registro de "esto está bien ASÍ HASTA X" para no redescubrirlo en producción.
> Cada entrada dice el diseño actual, el número aproximado donde empieza a doler
> y cuál es la evolución ya pensada. Agregar entradas nuevas al final.

## 1. Polling de status del import de IG (browser → backend)

**Diseño actual** (`use-instagram-import-status.ts` + `GET /instagram-import/status`):
cada dashboard abierto consulta el status cada 2.5s mientras hay un import corriendo
y cada 30s en reposo. Es una lectura liviana e indexada por storeId.

**Cuándo empieza a doler**: el costo es `paneles abiertos simultáneos × 2 req/min`
en idle. Con ~500–1.000 vendedores con el panel abierto a la vez (~17–33 req/s solo
de este endpoint) conviene revisarlo — no porque tumbe nada, sino porque es tráfico
tonto evitable. Muy por debajo de eso (los primeros miles de tiendas registradas,
que NO están todas con el panel abierto) no es tema.

**Evolución pensada**: SSE (no WebSocket — el canal es unidireccional) desde el
backend, o simplemente dejar de pollear en idle cuando el último import terminó
hace >24h. Documentado en la conversación 2026-07-17: si aparece una feature de
push real (ej. pedidos en vivo en el panel), montar SSE ahí y migrar este status
de paso.

## 2. Loop backend → Apify por import (`PollInstagramImportUseCase`)

**Diseño actual**: cada import RUNNING mantiene un loop fire-and-forget EN EL MISMO
proceso Node que consulta Apify y escribe progreso en DB. Si el proceso muere, el
próximo request de status hace `tryResume` del import huérfano (lazy, sin cron).

**Cuándo empieza a doler**: imports SIMULTÁNEOS. Decenas a la vez está bien;
con ~100+ imports corriendo al mismo tiempo (ej. campaña de marketing con ola de
signups importando su IG a la vez) se acumulan loops en memoria en un solo proceso
y se puede chocar el rate limit de Apify. El número que importa acá NO es tiendas
totales sino imports concurrentes — y como el import corre una vez por tienda,
solo una ola de registros lo produce.

**Evolución pensada**: cola con concurrencia acotada (BullMQ + Redis) que procese
N imports a la vez y encole el resto con posición visible ("tu import está en cola").
Opcional: webhook de Apify como acelerador del "terminó", manteniendo el poll como
red de seguridad.

## 3. Lock de procesamiento en memoria (`import-processing-lock.service`)

**Diseño actual**: el lock que evita doble-procesar un import vive en memoria del
proceso.

**Cuándo empieza a doler**: NO es un número de registros sino de RÉPLICAS — el día
que el backend corra con más de 1 instancia (scale horizontal en Dokploy), dos
réplicas pueden resumir el mismo import huérfano a la vez. Mientras el deploy sea
1 VPS / 1 proceso (plan actual), es correcto.

**Evolución pensada**: lock distribuido (Redis `SET NX` con TTL) o mover el
procesamiento a la cola del punto 2, que resuelve ambos a la vez.
