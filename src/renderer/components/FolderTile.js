import folderIcon from '../assets/icons/folder_icon.svg';
import pinnedIcon from '../assets/icons/pinned_icon.svg';

export function FolderTile({ folder, showPin = false, onClick }) {
  return (
    <button
      type="button"
      className="folder-tile"
      onClick={() => onClick?.(folder)}
      title={folder.name}
    >
      <div className="folder-tile__icon-wrap">
        <img src={folderIcon} alt="" className="folder-tile__icon" />
        {showPin && (
          <img src={pinnedIcon} alt="" className="folder-tile__pin" aria-hidden="true" />
        )}
      </div>
      <span className="folder-tile__name">{folder.name}</span>
    </button>
  );
}
