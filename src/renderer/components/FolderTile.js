import { useState } from 'react';
import folderIcon from '../assets/icons/folder_icon.svg';
import pinnedIcon from '../assets/icons/pinned_icon.svg';
import { ContextMenu } from './ContextMenu.js';

export function FolderTile({ folder, showPin = false, onClick, menuActions = null }) {
  const [menuPosition, setMenuPosition] = useState(null);
  const isPinned = folder.pinOrder != null;

  function handleClick() {
    onClick?.(folder);
  }

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
        className="folder-tile"
        onClick={handleClick}
        onContextMenu={handleContextMenu}
        title={folder.name}
      >
        <div className="folder-tile__icon-wrap">
          <img src={folderIcon} alt="" className="folder-tile__icon" />
          {(showPin || isPinned) && (
            <img src={pinnedIcon} alt="" className="folder-tile__pin" aria-hidden="true" />
          )}
        </div>
        <span className="folder-tile__name">{folder.name}</span>
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
