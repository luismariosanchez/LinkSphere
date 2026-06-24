import folderIcon from '../assets/icons/folder_icon.svg';

export function QuickAccessFolders({ folders, onSelect }) {
  if (folders.length === 0) {
    return null;
  }

  return (
    <section className="dashboard-section">
      <h2 className="dashboard-section__title">Acceso rápido</h2>
      <div className="quick-access">
        {folders.map((folder) => (
          <button
            key={folder.id}
            type="button"
            className="quick-access__item"
            onClick={() => onSelect?.(folder.id)}
          >
            <img src={folderIcon} alt="" className="quick-access__folder-icon" />
            <span className="quick-access__name">{folder.name}</span>
          </button>
        ))}
      </div>
    </section>
  );
}
