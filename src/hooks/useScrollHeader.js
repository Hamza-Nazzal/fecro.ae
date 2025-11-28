import { useEffect, useRef, useState } from "react";

/**
 * useScrollHeader
 * Uses an IntersectionObserver on a sentinel element near the top of the page
 * to determine when the header should switch from transparent to solid.
 */
export function useScrollHeader() {
  const [isScrolled, setIsScrolled] = useState(false);
  const sentinelRef = useRef(null);

  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        // When the sentinel is NOT visible, user has scrolled down
        setIsScrolled(!entry.isIntersecting);
      },
      {
        root: null,
        threshold: 0.99,
      }
    );

    observer.observe(sentinel);

    return () => {
      observer.disconnect();
    };
  }, []);

  return { isScrolled, sentinelRef };
}