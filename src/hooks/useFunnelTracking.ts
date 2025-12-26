import { useCallback, useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { track } from '@vercel/analytics';

// Event types for the application funnel
export type FunnelEventType =
  | 'jobs_list_viewed'
  | 'job_card_clicked'
  | 'job_detail_viewed'
  | 'apply_button_clicked'
  | 'apply_form_loaded'
  | 'form_validation_failed'
  | 'form_submitted'
  | 'consent_modal_shown'
  | 'consent_authorization_accepted'
  | 'consent_completed'
  | 'consent_cancelled'
  | 'application_completed';

interface FunnelEventMetadata {
  jobId?: string;
  jobTitle?: string;
  jobCount?: number;
  buttonLocation?: string;
  errors?: string[];
  applicationId?: string;
  step?: string;
  [key: string]: unknown;
}

const SESSION_ID_KEY = 'funnel_session_id';

// Generate or retrieve session ID from localStorage
const getSessionId = (): string => {
  if (typeof window === 'undefined') return 'server';
  
  let sessionId = localStorage.getItem(SESSION_ID_KEY);
  if (!sessionId) {
    sessionId = crypto.randomUUID();
    localStorage.setItem(SESSION_ID_KEY, sessionId);
  }
  return sessionId;
};

export const useFunnelTracking = () => {
  const sessionIdRef = useRef<string>('');
  
  useEffect(() => {
    sessionIdRef.current = getSessionId();
  }, []);

  const trackEvent = useCallback(async (
    eventType: FunnelEventType,
    jobId?: string | null,
    metadata?: FunnelEventMetadata
  ) => {
    const sessionId = sessionIdRef.current || getSessionId();
    
    // Prepare Vercel Analytics payload (convert arrays to strings)
    const vercelPayload: Record<string, string | number | boolean | null> = {
      jobId: jobId || null
    };
    
    if (metadata) {
      Object.entries(metadata).forEach(([key, value]) => {
        if (Array.isArray(value)) {
          vercelPayload[key] = value.join(', ');
        } else if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') {
          vercelPayload[key] = value;
        }
      });
    }

    // Track in Vercel Analytics (fire and forget)
    try {
      track(eventType, vercelPayload);
    } catch (error) {
      // Silently fail - don't block UX
      console.debug('[Funnel] Vercel Analytics error:', error);
    }

    // Track in database (fire and forget)
    try {
      // Convert metadata to JSON-compatible format
      const jsonMetadata = metadata ? JSON.parse(JSON.stringify(metadata)) : {};
      
      const { error } = await supabase
        .from('funnel_events')
        .insert([{
          event_type: eventType,
          job_id: jobId || null,
          session_id: sessionId,
          user_agent: typeof navigator !== 'undefined' ? navigator.userAgent : null,
          referrer: typeof document !== 'undefined' ? document.referrer : null,
          metadata: jsonMetadata
        }]);

      if (error) {
        console.debug('[Funnel] DB insert error:', error);
      }
    } catch (error) {
      // Silently fail - don't block UX
      console.debug('[Funnel] DB error:', error);
    }
  }, []);

  return { trackEvent };
};

// Standalone function for use outside React components
export const trackFunnelEvent = async (
  eventType: FunnelEventType,
  jobId?: string | null,
  metadata?: FunnelEventMetadata
) => {
  const sessionId = getSessionId();
  
  // Prepare Vercel Analytics payload (convert arrays to strings)
  const vercelPayload: Record<string, string | number | boolean | null> = {
    jobId: jobId || null
  };
  
  if (metadata) {
    Object.entries(metadata).forEach(([key, value]) => {
      if (Array.isArray(value)) {
        vercelPayload[key] = value.join(', ');
      } else if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') {
        vercelPayload[key] = value;
      }
    });
  }

  // Track in Vercel Analytics
  try {
    track(eventType, vercelPayload);
  } catch (error) {
    console.debug('[Funnel] Vercel Analytics error:', error);
  }

  // Track in database
  try {
    // Convert metadata to JSON-compatible format
    const jsonMetadata = metadata ? JSON.parse(JSON.stringify(metadata)) : {};
    
    await supabase
      .from('funnel_events')
      .insert([{
        event_type: eventType,
        job_id: jobId || null,
        session_id: sessionId,
        user_agent: typeof navigator !== 'undefined' ? navigator.userAgent : null,
        referrer: typeof document !== 'undefined' ? document.referrer : null,
        metadata: jsonMetadata
      }]);
  } catch (error) {
    console.debug('[Funnel] DB error:', error);
  }
};
