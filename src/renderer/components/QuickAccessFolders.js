import folderIcon from '../assets/icons/folder_icon.svg';

export function QuickAccessFolders({ bookmarks, onOpen }) {
  if (bookmarks.length === 0) {
    return null;
  }

  return (
    <section className="dashboard-section">
      <h2 className="dashboard-section__title">Acceso rápido</h2>
      <div className="quick-access">
        {bookmarks.map((bookmark) => (
          <button
            key={bookmark.id}
            type="button"
            className="quick-access__item"
            onClick={() => onOpen?.(bookmark.url)}
          >
            <img src={folderIcon} alt="" className="quick-access__folder-icon" />
            <span className="quick-access__name">{bookmark.title}</span>
          </button>
        ))}
      </div>
    </section>
  );
}
