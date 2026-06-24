import { useState } from 'react';
import folderIcon from '../assets/icons/folder_icon.svg';
import { ContextMenu } from './ContextMenu.js';

export function QuickAccessFolders({ folders, onSelect, menuActions = null }) {
  if (folders.length === 0) {
    return null;
  }

  return (
    <section className="dashboard-section">
      <h2 className="dashboard-section__title">Acceso rápido</h2>
      <div className="quick-access">
        {folders.map((folder) => (
          <QuickAccessFolderItem
            key={folder.id}
            folder={folder}
            onSelect={onSelect}
            menuActions={menuActions}
          />
        ))}
      </div>
    </section>
  );
}

function QuickAccessFolderItem({ folder, onSelect, menuActions }) {
  const [menuPosition, setMenuPosition] = useState(null);
  const isPinned = folder.pinOrder != null;

  function handleContextMenu(event) {
    if (!menuActions) {
      return;
    }

    event.preventDefault();
    event.stopPropagation();
    setMenuPosition({ x: event.clientX, y: event.clientY });
  }

  const contextMenuItems = menuActions ? [
    {
      id: 'rename',
      label: 'Editar nombre',
      onClick: () => menuActions.rename(folder),
    },
    {
      id: 'pin',
      label: isPinned ? 'Quitar de acceso rápido' : 'Añadir a acceso rápido',
      onClick: () => menuActions.togglePin(folder),
    },
    {
      id: 'delete',
      label: 'Eliminar carpeta',
      danger: true,
      onClick: () => menuActions.delete(folder),
    },
  ] : [];

  return (
    <>
      <button
        type="button"
        className="quick-access__item"
        onClick={() => onSelect?.(folder.id)}
        onContextMenu={handleContextMenu}
        title={folder.name}
      >
        <img src={folderIcon} alt="" className="quick-access__folder-icon" />
        <span className="quick-access__name">{folder.name}</span>
      </button>

      {menuPosition && (
        <ContextMenu
          x={menuPosition.x}
          y={menuPosition.y}
          items={contextMenuItems}
          onClose={() => setMenuPosition(null)}
        />
      )}
    </>
  );
}
