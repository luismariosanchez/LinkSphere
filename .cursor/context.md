# Contexto del proyecto — Marcadores App

Memoria corta para Cursor. Aplicación desktop **Electron + React + SQLite** para gestión de marcadores con metadata enriquecida.

## Arquitectura actual

```
src/
├── main/           # Proceso Electron: bootstrap, ventanas, IPC, DI (context.js)
├── preload/        # contextBridge → window.api
├── renderer/       # UI React (sin lógica de negocio)
├── core/           # Dominio e infraestructura
│   ├── use-cases/      # Casos de uso (orquestan servicios)
│   ├── services/       # Lógica de aplicación (bookmarks, eventos legacy)
│   ├── domain/         # Lógica pura de dominio (queries SQL, HTML import/export)
│   ├── repositories/   # Re-export de repositorios SQLite
│   ├── events/         # EventService + detector de cambios
│   ├── processors/     # Pipeline tag/folder/live
│   ├── database/       # Conexión SQLite, migraciones, repos físicos
│   ├── folders/        # FolderService + sugerencias
│   ├── tags/           # TagSuggestionService
│   ├── providers/      # YouTube, Twitch, Generic
│   ├── scheduler/      # SchedulerService + WatcherService
│   ├── config/         # SettingsService
│   └── suggestions/    # OrganizationSuggestionService
└── shared/         # IPC channels, constantes, utils
```

### Capas y responsabilidades

| Capa | Ubicación | Responsabilidad |
|------|-----------|-----------------|
| UI | `renderer/` | Presentación, estado visual, **una llamada use-case por vista** |
| IPC | `main/ipc/` | Adaptadores thin → use cases / servicios |
| Use Cases | `core/use-cases/` | Orquestación de operaciones de negocio |
| Services | `core/services/` | CRUD, queries, interacciones |
| Domain | `core/domain/` | Lógica pura sin I/O |
| Repositories | `core/database/repositories/` | Persistencia SQLite |
| Processors | `core/processors/` | Reglas tag/folder/live |

## Flujo de un bookmark

### Crear
1. UI → `apiClient.bookmarks.create({ url })`
2. IPC `bookmarks:create` → `CreateBookmarkUseCase`
3. `BookmarkService.create()`:
   - `ProviderManager.resolveMetadata(url)` → metadata
   - `TagSuggestionService` → tagIds (si autoTagging activo)
   - `FolderService.resolveSuggestedFolderId()` → folderId
   - `BookmarkRepository.create()` → persistencia
   - `detectBookmarkEvents({ isNew: true })` → `EventService.createEvents()`

### Listar / filtrar (vistas)
1. **Dashboard** → `apiClient.dashboard.getData()` → `GetDashboardDataUseCase` → `DashboardService`
   - Agrega tags, folders, news, grid, bookmarks paginados
   - Enriquece cards en core (`enrichBookmarkCard`)
2. **FoldersView** → `apiClient.folders.getViewData()` → `GetFoldersViewDataUseCase` → `FoldersViewService`
   - Filtra/ordena carpetas, pinned, detalle de carpeta con bookmarks
3. Operaciones atómicas siguen en `bookmarks:*` (create, update, open, etc.)

### Abrir URL
1. `apiClient.bookmarks.open({ url, bookmarkId })` → `OpenBookmarkUseCase` → abre navegador + tracking

### Rescan automático
1. `SchedulerService` (si `autoRefresh`) → `WatcherService.watch(id)` por bookmark
2. Re-fetch metadata, detecta cambios, crea eventos, actualiza state

### Import / Export
- Export: `ExportBookmarksUseCase` → HTML Netscape
- Import: `ImportBookmarksUseCase` → loop `create()` con progress IPC push

## Processor pipeline

Sistema de reglas para enriquecer bookmarks sin lógica en UI.

```
OrganizationSuggestionService.suggest(context)
  → ProcessorsRegistry.getActiveProcessors()
  → ProcessorPipeline.run(processors, context)
  → TagProcessor / FolderProcessor / LiveProcessor
  → ProcessorOutput normalizado
```

- **TagProcessor**: reglas en `userData/processors/tag.rules.json`
- **FolderProcessor**: reglas en `userData/processors/folder.rules.json`
- **LiveProcessor**: detección de estado live/offline
- Habilitación vía `settings.enabledProcessors`
- Reglas editables en UI Settings → `ProcessorRulesService`

Los tags y carpetas sugeridas en create/update pasan por processors (vía `TagSuggestionService` y `FolderService`).

## Servicios existentes

### Bookmarks (divididos)
- **BookmarkService** — CRUD, import/export HTML
- **BookmarkQueryService** — query, recientes, favoritos, eventos enriquecidos
- **BookmarkInteractionService** — recordOpen, recordOpenByUrl, rescan

### Otros
- **FolderService** — CRUD carpetas, stats, pin, sugerencias
- **FolderSuggestionService** — sugerencias de carpeta vía FolderProcessor
- **TagSuggestionService** — auto-tags vía TagProcessor
- **EventService** — crear/listar/prune eventos
- **WatcherService** — rescan individual con detección de cambios
- **SchedulerService** — ciclo periódico de rescan
- **OrganizationSuggestionService** — sugerencias vía pipeline completo
- **ProcessorRulesService** — CRUD reglas tag/folder
- **SettingsService** — settings.json en userData
- **ProviderManager** — resuelve YouTube/Twitch/Generic por URL

## Use cases de bookmarks

| Use Case | Servicio subyacente |
|----------|---------------------|
| CreateBookmarkUseCase | BookmarkService |
| UpdateBookmarkUseCase | BookmarkService |
| DeleteBookmarkUseCase | BookmarkService |
| GetBookmarksUseCase | BookmarkService + BookmarkQueryService |
| GetFolderBookmarksUseCase | BookmarkQueryService |
| RescanBookmarkUseCase | BookmarkInteractionService |
| ImportBookmarksUseCase | BookmarkService |
| ExportBookmarksUseCase | BookmarkService |
| GetLatestBookmarkEventsUseCase | BookmarkQueryService |
| OpenBookmarkUseCase | BookmarkInteractionService + shell |
| GetDashboardDataUseCase | DashboardService |
| GetFoldersViewDataUseCase | FoldersViewService |
| GetFoldersUseCase | FolderService |
| GetRecentBookmarksUseCase | BookmarkQueryService |
| GetFavoriteBookmarksUseCase | BookmarkQueryService |

## IPC por vista (regla)

- `dashboard:getData` — datos completos del dashboard/bookmarks view
- `folders:getViewData` — listado + detalle de carpetas
- `bookmarks:open` — abrir URL con tracking
- No combinar múltiples IPC en la UI para armar una vista

## IPC (dominios)

- `app:*` — ping, openExternal, wipeData
- `settings:*` — get, update
- `bookmarks:*` — CRUD, query, import/export
- `events:*` — getAll, getByBookmarkId, getLatest
- `tags:*` — getAll, create, delete, getByBookmarkId
- `folders:*` — CRUD, stats, suggest
- `suggestions:*` — get (pipeline)
- `rules:*` — CRUD reglas processors

Fuente única de nombres: `src/shared/ipcChannels.js`

## DI / Composition root

`src/main/database/context.js` — singletons lazy para todos los servicios, processors y use cases.

## Reglas de desarrollo

1. **UI no contiene lógica de negocio** — solo presentación y llamadas a `apiClient`
2. **IPC handlers delegan en use cases** — no llamar servicios directamente desde IPC
3. **Todo bookmark nuevo pasa por ingestion** — ProviderManager + processors en create
4. **Tags y folders se calculan vía processors** — no hardcodear en renderer
5. **No duplicar lógica de filtrado** — queries server-side en `bookmark-query.js`
6. **IPC es la única comunicación renderer ↔ main**
7. **Services no dependen de UI ni de Electron** (excepto context.js en main)
