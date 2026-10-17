import { Prisma } from '@prisma/client';

export function esViolacionUnica(e: unknown, ...marcas: string[]): boolean {
  if (!(e instanceof Prisma.PrismaClientKnownRequestError) || e.code !== 'P2002')
    return false;
  const meta = JSON.stringify(e.meta ?? {});
  return marcas.some((m) => meta.includes(m));
}

export function esErrorConexionBD(e: unknown): boolean {
  if (!e || typeof e !== 'object') return false;
  const err = e as any;
  if (
    err.code === 'ECONNREFUSED' ||
    err.code === 'ENOTFOUND' ||
    err.code === 'ETIMEDOUT' ||
    err.code === 'P1001' ||
    err.code === 'P1002' ||
    err.code === 'P1003'
  ) {
    return true;
  }
  if (err.name === 'AggregateError' || err.name === 'PrismaClientInitializationError') {
    return true;
  }
  if (err.name === 'PrismaClientKnownRequestError' && err.code === 'ECONNREFUSED') {
    return true;
  }
  const msg = `${err.message ?? ''} ${err.stack ?? ''}`;
  return (
    msg.includes("Can't reach database server") ||
    msg.includes('ECONNREFUSED') ||
    msg.includes('connection') ||
    msg.includes('connect ECONNREFUSED')
  );
}
