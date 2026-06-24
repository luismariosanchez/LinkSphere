# Marcadores

A desktop bookmark manager built with **Electron**, **React**, and **SQLite**. Save URLs, enrich them with metadata from specialized providers, organize them with folders and tags, and keep them up to date with automatic background rescans.

## Features

- **Smart bookmark ingestion** — URLs are enriched on create via provider-specific metadata (YouTube, Twitch, and a generic fallback for any site).
- **Dashboard & grid views** — Browse bookmarks with search, filters (folder, tag, type, favorites, pinned), sorting, and pagination.
- **Folders** — Organize bookmarks into folders with pinning, stats, and automatic folder suggestions via rules.
- **Tags** — Manual tags plus optional auto-tagging driven by configurable processor rules.
- **Activity feed** — Track changes and events (new content, live status, metadata updates).
- **Background watcher** — Periodic rescans detect changes and update bookmark state automatically.
- **Import / export** — Netscape HTML bookmark format with progress feedback during import.
- **Processor pipeline** — Rule-based tag, folder, and live-status processors editable from Settings.
- **Local-first** — All data stored locally in SQLite; no account or cloud required.

## Tech stack

| Layer | Technology |
|-------|------------|
| Desktop shell | Electron 36 |
| UI | React 19 + Vite 6 |
| Database | SQLite (`better-sqlite3`) |
| Metadata | Cheerio, custom providers |
| IPC | `contextBridge` preload + typed channels |

## Prerequisites

- **Node.js** 18 or later (LTS recommended)
- **npm** 9+
- A C++ build toolchain for native modules (`better-sqlite3`). On Windows, [Visual Studio Build Tools](https://visualstudio.microsoft.com/visual-cpp-build-tools/) with the "Desktop development with C++" workload is typically required.

## Getting started

### Install dependencies

```bash
npm install
```

If `better-sqlite3` fails to compile, rebuild it for Electron:

```bash
npm run rebuild
```

### Development

Starts Vite (renderer), the preload watcher, and Electron together:

```bash
npm run dev
```

The renderer dev server runs on `http://localhost:5173`. Electron loads it automatically in development.

### Production build

```bash
npm run build
npm start
```

`build` compiles the preload script and bundles the React renderer into `dist/`.

## Project structure

```
src/
├── main/           # Electron main process — bootstrap, windows, IPC, DI
├── preload/        # contextBridge → window.api
├── renderer/       # React UI (presentation only)
├── core/           # Domain and infrastructure
│   ├── use-cases/      # Business operation orchestration
│   ├── services/       # Application logic (bookmarks, events, dashboard)
│   ├── domain/         # Pure domain logic (queries, HTML import/export)
│   ├── database/       # SQLite connection, migrations, repositories
│   ├── processors/     # Tag, folder, and live-status rule pipeline
│   ├── providers/      # YouTube, Twitch, Generic metadata providers
│   ├── scheduler/      # Periodic rescan scheduler + watcher
│   ├── config/         # User settings (settings.json)
│   └── ...
└── shared/         # IPC channel names, constants, utilities
```

## Architecture

The app follows a layered architecture with clear separation of concerns:

1. **Renderer** — React components call a single `apiClient` method per view. No business logic in the UI.
2. **IPC** (`main/ipc/`) — Thin adapters that delegate to use cases.
3. **Use cases** (`core/use-cases/`) — Orchestrate services for each user-facing operation.
4. **Services** (`core/services/`) — CRUD, queries, interactions, and view-specific aggregation.
5. **Domain** (`core/domain/`) — Pure logic without I/O (SQL query builders, HTML parsers).
6. **Repositories** (`core/database/repositories/`) — SQLite persistence.

### Bookmark lifecycle

**Create:** UI → IPC → `CreateBookmarkUseCase` → resolve metadata via `ProviderManager` → suggest tags/folders via processors → persist → emit change events.

**List / filter:** Dashboard and folder views fetch pre-aggregated data from dedicated use cases (`GetDashboardDataUseCase`, `GetFoldersViewDataUseCase`) with server-side filtering.

**Open:** Opens the URL in the system browser and records the interaction for recency tracking.

**Rescan:** The scheduler periodically re-fetches metadata, detects changes, and creates activity events.

### Processor pipeline

Configurable rules enrich bookmarks without UI logic:

```
OrganizationSuggestionService
  → TagProcessor / FolderProcessor / LiveProcessor
  → Normalized suggestions (tags, folders, live status)
```

Rules are stored in the app user data directory and can be edited from **Settings**.

## Data storage

Application data is stored in Electron's `userData` directory:

| File | Purpose |
|------|---------|
| `marcadores.db` | SQLite database (bookmarks, folders, tags, events) |
| `settings.json` | App settings (auto-refresh, auto-tagging, processor toggles) |
| `processors/` | Tag and folder processor rule files |

Use **Settings → Wipe data** to reset all local data.

## Available scripts

| Script | Description |
|--------|-------------|
| `npm run dev` | Start development (Vite + preload watch + Electron) |
| `npm run build` | Build preload and renderer for production |
| `npm start` | Run the packaged app |
| `npm run rebuild` | Rebuild native `better-sqlite3` bindings for Electron |

## License

Private project — not published to npm.
