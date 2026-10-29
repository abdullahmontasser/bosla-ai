'use client'

import * as React from 'react'
import { trackEvent } from '@/lib/telemetry/client'

export interface HealthAuditViewedTrackerProps {
  locale: 'en' | 'ar'
}

/**
 * Fires the anonymous `health_audit_viewed` event once per panel mount
 * (spec 0014): no resume text and no profile data, event name only. The
 * ref guard keeps React strict mode remounts from double sending.
 */
export function HealthAuditViewedTracker({ locale }: HealthAuditViewedTrackerProps) {
  const firedRef = React.useRef(false)

  React.useEffect(() => {
    if (firedRef.current) return
    firedRef.current = true
    void trackEvent('health_audit_viewed', { locale })
  }, [locale])

  return null
}
