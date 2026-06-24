import folderIcon from '../assets/icons/folder_icon.svg';

export function QuickAccessFolders({ folders, onSelectFolder }) {
  if (folders.length === 0) {
    return null;
  }

  // TODO: API folders.getPinned() — por ahora primeras carpetas
  const quickFolders = folders.slice(0, 4);

  return (
    <section className="dashboard-section">
      <h2 className="dashboard-section__title">Acceso rápido</h2>
      <div className="quick-access">
        {quickFolders.map((folder) => (
          <button
            key={folder.id}
            type="button"
            className="quick-access__item"
            onClick={() => onSelectFolder?.(folder.id)}
          >
            <img src={folderIcon} alt="" className="quick-access__folder-icon" />
            <span className="quick-access__name">{folder.name}</span>
          </button>
        ))}
      </div>
    </section>
  );
}
