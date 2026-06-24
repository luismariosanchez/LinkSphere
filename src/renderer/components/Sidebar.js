import createIcon from '../assets/icons/create_icon.svg';
import dashboardIcon from '../assets/icons/dashboard_icon.svg';
import folderIcon from '../assets/icons/folder_dash_icon.svg';
import bookmarkIcon from '../assets/icons/bookmark_dash_icon.svg';
import configIcon from '../assets/icons/config_dash_icon.svg';

const NAV_ITEMS = [
  { id: 'dashboard', icon: dashboardIcon, label: 'Dashboard' },
  { id: 'folders', icon: folderIcon, label: 'Carpetas' },
  { id: 'bookmarks', icon: bookmarkIcon, label: 'Bookmarks' },
  // Favoritos: oculto hasta implementar API bookmarks.favorite
];

export function Sidebar({
  activeView,
  dashboardMode,
  onNavigate,
  onOpenSettings,
  onCreateBookmark,
}) {
  return (
    <aside className="sidebar">
      <button
        type="button"
        className="sidebar__create"
        onClick={onCreateBookmark}
        title="Añadir bookmark"
      >
        <img src={createIcon} alt="" className="sidebar__icon" />
      </button>

      <nav className="sidebar__nav scrollbar-hidden" aria-label="Navegación principal">
        {NAV_ITEMS.map((item) => {
          const isActive = activeView === 'dashboard' && dashboardMode === item.id;

          return (
            <button
              key={item.id}
              type="button"
              className={isActive ? 'sidebar__btn sidebar__btn--active' : 'sidebar__btn'}
              onClick={() => onNavigate(item.id)}
              title={item.label}
            >
              <img src={item.icon} alt="" className="sidebar__icon" />
            </button>
          );
        })}
      </nav>

      <button
        type="button"
        className={`sidebar__footer-btn${activeView === 'settings' ? ' sidebar__btn--active' : ''}`}
        onClick={onOpenSettings}
        title="Configuración"
      >
        <img src={configIcon} alt="" className="sidebar__icon" />
      </button>
    </aside>
  );
}
