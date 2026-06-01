import { useEffect, useRef, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { SkipLink } from '@/app/SkipLink';
import { variantRegistry } from '@/variants/registry';
import styles from './Layout.module.css';

interface LayoutProps {
  children: React.ReactNode;
}

function pageNameFor(pathname: string): string {
  if (pathname === '/') {
    return 'Puzzle gallery';
  }

  const variantId = pathname.replace(/^\//, '');

  return variantRegistry[variantId]?.name ?? 'Puzzle';
}

export function Layout({ children }: LayoutProps) {
  const { pathname } = useLocation();
  const wrapperRef = useRef<HTMLDivElement>(null);
  const isInitialRender = useRef(true);
  const [announcement, setAnnouncement] = useState('');

  useEffect(() => {
    if (isInitialRender.current) {
      isInitialRender.current = false;
      return;
    }

    // On client-side navigation React Router doesn't reset focus, so the browser
    // leaves the sequential focus starting point at the unmounted link's old DOM
    // position and the next Tab resumes mid-page. Moving focus back to the top
    // wrapper makes the skip link the first tab stop again, and announcing the
    // new page name gives screen-reader users the route-change context they'd
    // otherwise lose on a client-side transition.
    wrapperRef.current?.focus();
    setAnnouncement(pageNameFor(pathname));
  }, [pathname]);

  return (
    <div ref={wrapperRef} tabIndex={-1} className={styles.pageWrapper}>
      <SkipLink />
      {children}
      <div role="status" aria-live="polite" aria-atomic="true" className={styles.srOnly}>
        {announcement}
      </div>
    </div>
  );
}
