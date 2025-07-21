"use client";

import { useEffect, useState } from 'react';

interface PerformanceMetrics {
  loadTime: number;
  renderTime: number;
  memoryUsage: number;
  connectionType: string;
  deviceType: 'mobile' | 'tablet' | 'desktop';
}

export function PerformanceMonitor() {
  const [metrics, setMetrics] = useState<PerformanceMetrics | null>(null);

  useEffect(() => {
    const measurePerformance = () => {
      const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
      const memory = (performance as any).memory;
      
      const loadTime = navigation.loadEventEnd - navigation.fetchStart;
      const renderTime = navigation.domContentLoadedEventEnd - navigation.domContentLoadedEventStart;
      
      // Detect connection type
      const connection = (navigator as any).connection || (navigator as any).mozConnection || (navigator as any).webkitConnection;
      const connectionType = connection ? connection.effectiveType || 'unknown' : 'unknown';
      
      // Detect device type
      const deviceType = window.innerWidth < 768 ? 'mobile' : 
                        window.innerWidth < 1024 ? 'tablet' : 'desktop';
      
      const performanceMetrics: PerformanceMetrics = {
        loadTime: Math.round(loadTime),
        renderTime: Math.round(renderTime),
        memoryUsage: memory ? Math.round(memory.usedJSHeapSize / 1024 / 1024) : 0,
        connectionType,
        deviceType
      };
      
      setMetrics(performanceMetrics);
      
      // Log performance data for monitoring
      console.log('Performance Metrics:', performanceMetrics);
      
      // Send to analytics (in production)
      if (process.env.NODE_ENV === 'production') {
        // Analytics integration would go here
        // Example: gtag('event', 'performance', performanceMetrics);
      }
    };

    // Measure after page load
    if (document.readyState === 'complete') {
      measurePerformance();
    } else {
      window.addEventListener('load', measurePerformance);
    }

    // Monitor Core Web Vitals
    const observer = new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        if (entry.entryType === 'largest-contentful-paint') {
          console.log('LCP:', entry.startTime);
        }
        if (entry.entryType === 'first-input') {
          console.log('FID:', (entry as any).processingStart - entry.startTime);
        }
        if (entry.entryType === 'layout-shift') {
          console.log('CLS:', (entry as any).value);
        }
      }
    });

    observer.observe({ entryTypes: ['largest-contentful-paint', 'first-input', 'layout-shift'] });

    return () => {
      window.removeEventListener('load', measurePerformance);
      observer.disconnect();
    };
  }, []);

  // Performance warnings for development
  useEffect(() => {
    if (metrics && process.env.NODE_ENV === 'development') {
      if (metrics.loadTime > 3000) {
        console.warn('⚠️ Slow page load detected:', metrics.loadTime + 'ms');
      }
      if (metrics.memoryUsage > 50) {
        console.warn('⚠️ High memory usage detected:', metrics.memoryUsage + 'MB');
      }
    }
  }, [metrics]);

  // Don't render anything in production
  if (process.env.NODE_ENV === 'production') {
    return null;
  }

  // Development performance display
  return (
    <div className="fixed bottom-4 right-4 bg-black bg-opacity-75 text-white text-xs p-2 rounded z-50">
      {metrics ? (
        <div>
          <div>Load: {metrics.loadTime}ms</div>
          <div>Render: {metrics.renderTime}ms</div>
          <div>Memory: {metrics.memoryUsage}MB</div>
          <div>Connection: {metrics.connectionType}</div>
          <div>Device: {metrics.deviceType}</div>
        </div>
      ) : (
        <div>Measuring...</div>
      )}
    </div>
  );
}