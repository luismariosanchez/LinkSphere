import { useCallback, useRef } from 'react';

const DRAG_THRESHOLD_PX = 5;

export function useDragScroll() {
  const ref = useRef(null);
  const dragState = useRef({
    isActive: false,
    hasDragged: false,
    startX: 0,
    scrollLeft: 0,
  });
  const cleanupListeners = useRef(() => {});

  const endDrag = useCallback(() => {
    const element = ref.current;
    dragState.current.isActive = false;

    if (element) {
      element.classList.remove('is-dragging');
    }

    cleanupListeners.current();
    cleanupListeners.current = () => {};
  }, []);

  const onMouseDown = useCallback((event) => {
    const element = ref.current;

    if (!element || event.button !== 0) {
      return;
    }

    dragState.current = {
      isActive: true,
      hasDragged: false,
      startX: event.pageX,
      scrollLeft: element.scrollLeft,
    };

    function onMouseMove(moveEvent) {
      const state = dragState.current;

      if (!state.isActive) {
        return;
      }

      const deltaX = moveEvent.pageX - state.startX;

      if (!state.hasDragged) {
        if (Math.abs(deltaX) < DRAG_THRESHOLD_PX) {
          return;
        }

        state.hasDragged = true;
        element.classList.add('is-dragging');
      }

      moveEvent.preventDefault();
      element.scrollLeft = state.scrollLeft - deltaX;
    }

    function onMouseUp() {
      const hadDragged = dragState.current.hasDragged;
      endDrag();

      if (hadDragged) {
        function suppressClick(clickEvent) {
          clickEvent.preventDefault();
          clickEvent.stopPropagation();
          element.removeEventListener('click', suppressClick, true);
        }

        element.addEventListener('click', suppressClick, true);
      }
    }

    cleanupListeners.current = () => {
      document.removeEventListener('mousemove', onMouseMove);
      document.removeEventListener('mouseup', onMouseUp);
    };

    document.addEventListener('mousemove', onMouseMove);
    document.addEventListener('mouseup', onMouseUp);
  }, [endDrag]);

  return {
    ref,
    dragHandlers: {
      onMouseDown,
    },
  };
}
