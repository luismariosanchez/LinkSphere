import { useCallback, useRef } from 'react';

export function useDragScroll() {
  const ref = useRef(null);
  const dragState = useRef({
    isActive: false,
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
      startX: event.pageX,
      scrollLeft: element.scrollLeft,
    };

    element.classList.add('is-dragging');

    function onMouseMove(moveEvent) {
      const { isActive, startX, scrollLeft } = dragState.current;

      if (!isActive) {
        return;
      }

      moveEvent.preventDefault();
      element.scrollLeft = scrollLeft - (moveEvent.pageX - startX);
    }

    function onMouseUp() {
      endDrag();
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
