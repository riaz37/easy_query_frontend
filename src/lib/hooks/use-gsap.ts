import { useEffect, useRef } from 'react';
import { gsap } from 'gsap';
import type { TweenVars } from 'gsap';

/**
 * Hook for GSAP animations with automatic cleanup
 */
export function useGSAP(
  callback: (ctx: gsap.Context) => void | (() => void),
  dependencies?: React.DependencyList
) {
  const context = useRef<gsap.Context | null>(null);

  useEffect(() => {
    context.current = gsap.context(() => {
      const cleanup = callback(context.current!);
      return cleanup;
    });

    return () => {
      context.current?.revert();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, dependencies);
}

/**
 * Hook for animating elements on mount
 */
export function useAnimationOnMount(
  elementRef: React.RefObject<HTMLElement>,
  animationVars: TweenVars
) {
  useEffect(() => {
    if (elementRef.current) {
      const animation = gsap.fromTo(
        elementRef.current,
        { opacity: 0 },
        animationVars
      );

      return () => {
        animation.kill();
      };
    }
  }, [elementRef, animationVars]);
}

/**
 * Hook for scroll-triggered animations
 */
export function useScrollAnimation(
  elementRef: React.RefObject<HTMLElement>,
  animationVars: TweenVars,
  triggerOptions?: {
    start?: string;
    end?: string;
    toggleActions?: string;
  }
) {
  useEffect(() => {
    if (elementRef.current) {
      const animation = gsap.to(elementRef.current, {
        ...animationVars,
        scrollTrigger: {
          trigger: elementRef.current,
          start: triggerOptions?.start || 'top 80%',
          toggleActions: triggerOptions?.toggleActions || 'play none none reverse',
        },
      });

      return () => {
        animation.scrollTrigger?.kill();
        animation.kill();
      };
    }
  }, [elementRef, animationVars, triggerOptions]);
}

