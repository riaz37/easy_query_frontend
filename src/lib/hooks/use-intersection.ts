import { useEffect, useState, RefObject } from 'react';
import { useInView } from 'react-intersection-observer';

/**
 * Hook for intersection observer with custom options
 */
export function useIntersection(
  options?: IntersectionObserverInit
): [RefObject<HTMLElement>, boolean] {
  const [ref, inView] = useInView({
    threshold: 0.1,
    ...options,
  });

  return [ref as RefObject<HTMLElement>, inView];
}

/**
 * Hook for animating elements when they come into view
 */
export function useAnimateOnIntersection(
  animationFn: (element: HTMLElement) => void,
  options?: IntersectionObserverInit
) {
  const [ref, inView] = useInView({
    threshold: 0.1,
    triggerOnce: true,
    ...options,
  });

  useEffect(() => {
    if (inView && ref.current) {
      animationFn(ref.current);
    }
  }, [inView, ref, animationFn]);

  return ref;
}

