# Reglas del proyecto — Marcadores App

## Arquitectura

### Separación de capas
- **renderer/**: solo UI, hooks de presentación y `apiClient`. Sin acceso a DB, providers ni processors.
- **main/ipc/**: adaptadores delgados. Delegar en use cases, no en servicios directamente.
- **core/use-cases/**: punto de entrada para operaciones de negocio desde IPC.
- **core/services/**: lógica de aplicación. Un servicio = una responsabilidad.
- **core/domain/**: lógica pura sin side effects (queries SQL, parsers HTML).
- **core/repositories/**: acceso a datos. Sin lógica de negocio.
- **core/events/**: sistema de eventos de actividad.
- **core/processors/**: pipeline de enriquecimiento (tags, folders, live).

### Reglas obligatorias

1. **UI no contiene lógica de negocio**
   - No filtrar bookmarks en cliente si el filtro existe en SQL.
   - No resolver tags/folders manualmente en componentes.
   - Usar `apiClient` para toda comunicación con el backend.

2. **Todo bookmark pasa por el sistema de ingestion**
   - Crear siempre vía `CreateBookmarkUseCase` → `BookmarkService.create()`.
   - Metadata siempre desde `ProviderManager`.
   - No insertar directamente en repositorio desde IPC.

3. **Tags y folders se calculan vía processors**
   - Auto-tagging: `TagSuggestionService` → `TagProcessor`.
   - Carpeta sugerida: `FolderService` → `FolderProcessor`.
   - Sugerencias en editor: `OrganizationSuggestionService` → pipeline completo.

4. **No duplicar lógica en frontend**
   - Filtros, ordenación y paginación: server-side (`bookmarks:query`).
   - Labels de status/type: únicos en `renderer/utils/bookmarks.js`.

5. **IPC es la única comunicación renderer ↔ main**
   - Nuevos canales: definir en `shared/ipcChannels.js`, registrar en `main/ipc/`, exponer en preload y `api.client.js`.
   - Naming: `dominio:accion` en camelCase (ej. `bookmarks:create`).

6. **Services no deben depender de UI**
   - Sin imports de React, Electron renderer ni `window`.
   - `context.js` es el único lugar que instancia servicios con dependencias de Electron.

## Servicios de bookmarks

| Servicio | Responsabilidad |
|----------|-----------------|
| BookmarkService | CRUD, import/export |
| BookmarkQueryService | Queries, listados, eventos enriquecidos |
| BookmarkInteractionService | Aperturas, rescan manual |

No crear un `BookmarkService` monolítico. Extender el servicio correspondiente.

## Use cases

- Cada operación expuesta por IPC de bookmarks debe tener un use case.
- Use cases son thin wrappers: validan entrada mínima y delegan en servicios.
- Factory: `createBookmarkUseCases()` en `core/use-cases/bookmarks/index.js`.

## Código muerto

- Eliminar solo código sin referencias reales.
- No eliminar IPC expuesto en preload aunque la UI actual no lo use (API pública).
- No eliminar código detrás de flags de configuración (`autoTagging`, `enabledProcessors`, etc.).

## Convenciones

- Archivos: `kebab-case.js` para servicios, use cases y utilidades.
- Clases: `PascalCase` con sufijo (`BookmarkService`, `CreateBookmarkUseCase`).
- Imports: rutas relativas ESM con extensión `.js`.
- Re-exports legacy en `core/bookmarks/` apuntan a la nueva ubicación — no añadir lógica ahí.

## Al añadir features (futuro)

1. Definir use case en `core/use-cases/`.
2. Implementar o extender servicio en `core/services/`.
3. Registrar IPC en el módulo de dominio correspondiente.
4. Exponer en preload + `apiClient`.
5. Consumir desde componente/página en renderer.
6. Actualizar `.cursor/context.md` si cambia el flujo.
