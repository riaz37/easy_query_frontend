import { useEffect, useState, RefObject } from 'react';
import { useInView } from 'react-intersection-observer';

/**
 * Hook for lazy loading content
 */
export function useLazyLoad<T = HTMLElement>(
  options?: IntersectionObserverInit
): [RefObject<T>, boolean] {
  const [ref, inView] = useInView({
    threshold: 0.1,
    triggerOnce: true,
    ...options,
  });

  return [ref as RefObject<T>, inView];
}

/**
 * Hook for lazy loading images with blur placeholder
 */
export function useLazyImage(src: string | undefined) {
  const [imageSrc, setImageSrc] = useState<string | undefined>(undefined);
  const [isLoaded, setIsLoaded] = useState(false);
  const [ref, inView] = useInView({
    threshold: 0.1,
    triggerOnce: true,
  });

  useEffect(() => {
    if (inView && src) {
      const img = new Image();
      img.onload = () => {
        setImageSrc(src);
        setIsLoaded(true);
      };
      img.src = src;
    }
  }, [inView, src]);

  return { ref, imageSrc, isLoaded };
}

