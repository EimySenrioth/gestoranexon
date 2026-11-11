"use client";

import { useState, useEffect, useCallback } from "react";
import {
  CategoriaUsuario,
  ConteosCategoriasUsuarios,
  RolDisponibleItem,
  UsuarioItem,
} from "../types/usuarios.types";
import {
  listarRolesDisponiblesAdmin,
  listarUsuariosAdminConCursor,
} from "../services/admin-usuarios.service";

interface EstadoCursorPorTabla {
  cursorActual: string | null;
  historialCursores: Array<string | null>;
}

const ESTADO_INICIAL_CURSORES: Record<CategoriaUsuario, EstadoCursorPorTabla> = {
  EVALUADOR: {
    cursorActual: null,
    historialCursores: [],
  },
  SOLICITANTE: {
    cursorActual: null,
    historialCursores: [],
  },
  ADMINISTRADOR: {
    cursorActual: null,
    historialCursores: [],
  },
};

export function useUsuariosCursorTabla(limitPorLote: number = 8) {
  const [categoriaActiva, setCategoriaActiva] =
    useState<CategoriaUsuario>("EVALUADOR");
  const [busqueda, setBusqueda] = useState<string>("");
  const [busquedaDebounced, setBusquedaDebounced] = useState<string>("");

  // Estado de cursores independiente para cada una de las 2 tablas (sin offset)
  const [cursoresPorTabla, setCursoresPorTabla] = useState<
    Record<CategoriaUsuario, EstadoCursorPorTabla>
  >(ESTADO_INICIAL_CURSORES);

  const [usuarios, setUsuarios] = useState<UsuarioItem[]>([]);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [hasNextPage, setHasNextPage] = useState<boolean>(false);
  const [totalCategoria, setTotalCategoria] = useState<number>(0);

  const [conteos, setConteos] = useState<ConteosCategoriasUsuarios>({
    totalEvaluadores: 0,
    totalSolicitantes: 0,
    totalAdministradores: 0,
  });

  const [rolesDisponibles, setRolesDisponibles] = useState<RolDisponibleItem[]>(
    []
  );
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [reloadTick, setReloadTick] = useState<number>(0);

  // Debounce del texto de búsqueda (250ms) y reinicio del cursor de la tabla activa
  useEffect(() => {
    const timer = setTimeout(() => {
      setBusquedaDebounced((prev) => {
        if (prev !== busqueda) {
          setCursoresPorTabla((curr) => ({
            ...curr,
            [categoriaActiva]: {
              cursorActual: null,
              historialCursores: [],
            },
          }));
        }
        return busqueda;
      });
    }, 250);

    return () => clearTimeout(timer);
  }, [busqueda, categoriaActiva]);

  // Cargar catálogo de roles disponibles al montar
  useEffect(() => {
    let mounted = true;
    listarRolesDisponiblesAdmin()
      .then((roles) => {
        if (mounted && Array.isArray(roles)) {
          setRolesDisponibles(roles);
        }
      })
      .catch(() => {
        // Silencioso si aún no carga
      });
    return () => {
      mounted = false;
    };
  }, []);

  const estadoTablaActual = cursoresPorTabla[categoriaActiva];
  const cursorActual = estadoTablaActual.cursorActual;
  const hasPrevPage = estadoTablaActual.historialCursores.length > 0;
  const numeroLoteActual = estadoTablaActual.historialCursores.length + 1;

  // Consulta al backend mediante cursor
  useEffect(() => {
    let isMounted = true;

    const cargar = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const res = await listarUsuariosAdminConCursor({
          categoria: categoriaActiva,
          cursor: cursorActual,
          limit: limitPorLote,
          search: busquedaDebounced,
        });

        if (!isMounted) return;

        setUsuarios(res.items);
        setNextCursor(res.pageInfo.nextCursor);
        setHasNextPage(res.pageInfo.hasNextPage);
        setTotalCategoria(res.pageInfo.totalCategoria);
        setConteos(res.conteos);
      } catch (err: any) {
        if (!isMounted) return;
        setError(
          err?.message || "No se pudo cargar el directorio de usuarios."
        );
        setUsuarios([]);
        setNextCursor(null);
        setHasNextPage(false);
        setTotalCategoria(0);
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    cargar();

    return () => {
      isMounted = false;
    };
  }, [
    categoriaActiva,
    cursorActual,
    busquedaDebounced,
    limitPorLote,
    reloadTick,
  ]);

  // Cambiar entre las dos tablas (EVALUADOR y SOLICITANTE)
  const cambiarCategoria = useCallback((nuevaCategoria: CategoriaUsuario) => {
    setCategoriaActiva(nuevaCategoria);
    setBusqueda("");
    setBusquedaDebounced("");
    setCursoresPorTabla((prev) => ({
      ...prev,
      [nuevaCategoria]: {
        cursorActual: null,
        historialCursores: [],
      },
    }));
  }, []);

  // Avanzar al siguiente cursor (Keyset Pagination)
  const irSiguienteCursor = useCallback(() => {
    if (!hasNextPage || !nextCursor) return;

    setCursoresPorTabla((prev) => {
      const actual = prev[categoriaActiva];
      return {
        ...prev,
        [categoriaActiva]: {
          cursorActual: nextCursor,
          historialCursores: [...actual.historialCursores, actual.cursorActual],
        },
      };
    });
  }, [hasNextPage, nextCursor, categoriaActiva]);

  // Retroceder al cursor previo almacenado en la pila de la tabla
  const irAnteriorCursor = useCallback(() => {
    setCursoresPorTabla((prev) => {
      const actual = prev[categoriaActiva];
      if (actual.historialCursores.length === 0) return prev;

      const copiaHistorial = [...actual.historialCursores];
      const cursorPrevio = copiaHistorial.pop() ?? null;

      return {
        ...prev,
        [categoriaActiva]: {
          cursorActual: cursorPrevio,
          historialCursores: copiaHistorial,
        },
      };
    });
  }, [categoriaActiva]);

  // Reiniciar al primer lote y recargar desde PostgreSQL
  const refrescarTabla = useCallback((resetCursor: boolean = false) => {
    if (resetCursor) {
      setCursoresPorTabla((prev) => ({
        ...prev,
        [categoriaActiva]: {
          cursorActual: null,
          historialCursores: [],
        },
      }));
    }
    setReloadTick((t) => t + 1);
  }, [categoriaActiva]);

  return {
    categoriaActiva,
    cambiarCategoria,
    busqueda,
    setBusqueda,
    usuarios,
    isLoading,
    error,
    conteos,
    rolesDisponibles,
    pageInfo: {
      limit: limitPorLote,
      cursorActual,
      nextCursor,
      hasNextPage,
      hasPrevPage,
      totalCategoria,
      numeroLoteActual,
    },
    irSiguienteCursor,
    irAnteriorCursor,
    refrescarTabla,
  };
}

