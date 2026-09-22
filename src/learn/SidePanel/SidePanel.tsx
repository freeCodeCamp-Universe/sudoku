import { useEffect, useState, type MouseEvent, type ReactNode } from 'react';
import { Drawer } from '@/learn/Drawer/Drawer';
import styles from '@/learn/SidePanel/SidePanel.module.css';

export interface SidePanelProps {
  /** Consumer-controlled display mode. */
  mode: 'sidebar' | 'drawer';
  /** Whether the panel is visible. */
  open: boolean;
  /** Called when the panel should close. */
  onClose: () => void;
  /**
   * Drawer header title. Also used as the sidebar nav's aria-label when
   * ariaLabel is not provided.
   */
  title: string;
  /** Applied to the sidebar nav element for aria-controls on the trigger. */
  id: string;
  /** Accessible label for the sidebar nav. Falls back to title. */
  ariaLabel?: string;
  /** Element to restore focus to when the Drawer closes. */
  triggerElement?: HTMLElement | null;
  /** Optional class applied to the visible panel. */
  className?: string;
  children: ReactNode;
}

export function SidePanel({
  mode,
  open,
  onClose,
  title,
  id,
  ariaLabel,
  triggerElement,
  className,
  children,
}: SidePanelProps) {
  // Drawer (via Modal) calls document.createElement in a useState initializer
  // which crashes during SSR. Guard it so the Drawer is never in the tree
  // until after the component has mounted on the client.
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (mode === 'sidebar') {
    return (
      <nav
        id={id}
        className={`${styles.sidebar}${open ? ` ${styles['sidebar-open']}` : ''}${className ? ` ${className}` : ''}`}
        aria-label={ariaLabel ?? title}
      >
        {children}
      </nav>
    );
  }

  if (!mounted) {
    return null;
  }

  function handleAnchorClick(event: MouseEvent<HTMLDivElement>) {
    if ((event.target as Element).closest('a')) {
      onClose();
    }
  }

  return (
    <Drawer
      open={open}
      onClose={onClose}
      title={title}
      triggerElement={triggerElement}
      className={className}
    >
      <Drawer.Body>
        <div onClick={handleAnchorClick}>{children}</div>
      </Drawer.Body>
    </Drawer>
  );
}
