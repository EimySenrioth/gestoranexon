"use client";

import { useState, useEffect } from "react";

/**
 * useDebounce — Hook global para diferir la actualización de un valor
 * hasta que haya transcurrido un tiempo de espera especificado (útil para inputs de búsqueda).
 */
export function useDebounce<T>(value: T, delayMs: number = 300): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delayMs);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delayMs]);

  return debouncedValue;
}
