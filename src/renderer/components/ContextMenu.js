import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';

export function ContextMenu({ x, y, items, onClose }) {
  const menuRef = useRef(null);
  const [position, setPosition] = useState({ top: y, left: x });

  useLayoutEffect(() => {
    const menu = menuRef.current;

    if (!menu) {
      return;
    }

    const rect = menu.getBoundingClientRect();
    const padding = 8;
    let top = y;
    let left = x;

    if (left + rect.width > window.innerWidth - padding) {
      left = Math.max(padding, window.innerWidth - rect.width - padding);
    }

    if (top + rect.height > window.innerHeight - padding) {
      top = Math.max(padding, window.innerHeight - rect.height - padding);
    }

    setPosition({ top, left });
  }, [x, y, items]);

  useEffect(() => {
    function handlePointerDown(event) {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        event.preventDefault();
        onClose();
      }
    }

    function handleKeyDown(event) {
      if (event.key === 'Escape') {
        onClose();
      }
    }

    document.addEventListener('pointerdown', handlePointerDown);
    document.addEventListener('keydown', handleKeyDown);
    window.addEventListener('scroll', onClose, true);

    return () => {
      document.removeEventListener('pointerdown', handlePointerDown);
      document.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('scroll', onClose, true);
    };
  }, [onClose]);

  function handleItemAction(event, item) {
    event.preventDefault();
    event.stopPropagation();
    onClose();
    void item.onClick();
  }

  return createPortal(
    <div
      ref={menuRef}
      className="context-menu"
      style={{ top: position.top, left: position.left }}
      role="menu"
      onContextMenu={(event) => event.preventDefault()}
    >
      {items.map((item) => (
        <button
          key={item.id}
          type="button"
          className={`context-menu__item${item.danger ? ' context-menu__item--danger' : ''}`}
          role="menuitem"
          onPointerDown={(event) => handleItemAction(event, item)}
        >
          {item.label}
        </button>
      ))}
    </div>,
    document.body,
  );
}
