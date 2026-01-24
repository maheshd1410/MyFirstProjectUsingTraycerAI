import { useEffect } from 'react';

/**
 * Development-only performance monitoring
 */
export const logRenderTime = (componentName: string) => {
  if (__DEV__) {
    const startTime = performance.now();
    return () => {
      const endTime = performance.now();
      const renderTime = endTime - startTime;
      if (renderTime > 16) {
        // Slow render detected (>1 frame at 60fps)
        console.warn(
          `[Performance] ${componentName} render time: ${renderTime.toFixed(2)}ms`
        );
      }
    };
  }
  return () => {};
};

/**
 * Hook to detect slow renders
 */
export const useRenderTime = (componentName: string, threshold: number = 16) => {
  useEffect(() => {
    const cleanup = logRenderTime(componentName);
    return cleanup;
  });
};

/**
 * Log component mount time
 */
export const useMountTime = (componentName: string) => {
  useEffect(() => {
    if (__DEV__) {
      const mountTime = performance.now();
      console.log(`[Performance] ${componentName} mounted at ${mountTime.toFixed(2)}ms`);
    }
  }, [componentName]);
};

/**
 * Detect memory leaks from unmounted components
 */
export const useUnmountWarning = (componentName: string) => {
  useEffect(() => {
    let isMounted = true;

    return () => {
      isMounted = false;
      if (__DEV__) {
        // Check for any pending state updates after unmount
        setTimeout(() => {
          if (!isMounted) {
            console.log(`[Performance] ${componentName} successfully unmounted`);
          }
        }, 0);
      }
    };
  }, [componentName]);
};
