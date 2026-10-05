# Navigation Module (apps/shell)

Este directorio organiza la navegación, control de acceso y sesión del Shell.

## Estructura

- **registry/**: Fuente única de módulos, rutas y tipos (`types.ts`, `modules.ts`).
- **access/**: Roles del sistema (`roles.ts`), funciones guardianas (`guards.ts`) y hook de acceso (`useAccess.ts`).
- **session/**: ⏳ PENDIENTE de integración con backend (`session.store.ts`, `useSession.ts`).
- **components/**: Componentes de interfaz de navegación (`AppMenu.tsx`, `ModuleShell.tsx`, `ForbiddenView.tsx`).

Todos los elementos que dependen de autenticación y lógica con backend están marcados con `// ⏳ PENDIENTE`.
