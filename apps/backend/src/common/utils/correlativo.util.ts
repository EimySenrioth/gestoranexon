import { Prisma } from '@prisma/client';

/** Atómico en un solo statement: sin carrera en la creación del año y sin abortar la transacción. */
export async function siguienteCorrelativo(
  tx: Prisma.TransactionClient,
  clave: string,
): Promise<number> {
  const [fila] = await tx.$queryRaw<{ ultimo: number }[]>`
    INSERT INTO "secuencias" ("clave", "ultimo") VALUES (${clave}, 1)
    ON CONFLICT ("clave") DO UPDATE SET "ultimo" = "secuencias"."ultimo" + 1
    RETURNING "ultimo"`;
  return Number(fila.ultimo);
}

export const formatearCorrelativo = (
  prefijo: 'TCK' | 'EXP',
  anio: number,
  n: number,
): string => `${prefijo}-${anio}-${String(n).padStart(4, '0')}`;
