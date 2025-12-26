import { useCallback, useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { track } from '@vercel/analytics';
import type { Json } from '@/integrations/supabase/types';

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
const MAX_RETRIES = 2;
const RETRY_DELAY_MS = 500;

// Generate or retrieve session ID from localStorage with validation
const getSessionId = (): string => {
  if (typeof window === 'undefined') return 'server';
  
  try {
    let sessionId = localStorage.getItem(SESSION_ID_KEY);
    
    // Validate UUID format
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!sessionId || !uuidRegex.test(sessionId)) {
      sessionId = crypto.randomUUID();
      localStorage.setItem(SESSION_ID_KEY, sessionId);
      console.log('[Funnel] Created new session ID:', sessionId);
    }
    return sessionId;
  } catch (error) {
    // localStorage might be blocked - generate a temporary ID
    console.warn('[Funnel] localStorage unavailable, using temporary session ID');
    return crypto.randomUUID();
  }
};

// Helper to insert event with retries
const insertEventWithRetry = async (
  eventData: {
    event_type: string;
    job_id: string | null;
    session_id: string;
    user_agent: string | null;
    referrer: string | null;
    metadata: Json;
  },
  retries: number = MAX_RETRIES
): Promise<boolean> => {
  try {
    const { error } = await supabase
      .from('funnel_events')
      .insert([eventData]);

    if (error) {
      console.error('[Funnel] DB insert error:', error.message, error.code, error.details);
      
      if (retries > 0) {
        console.log(`[Funnel] Retrying insert... (${retries} retries left)`);
        await new Promise(resolve => setTimeout(resolve, RETRY_DELAY_MS));
        return insertEventWithRetry(eventData, retries - 1);
      }
      return false;
    }
    
    console.log('[Funnel] Event inserted successfully:', eventData.event_type);
    return true;
  } catch (error) {
    console.error('[Funnel] DB exception:', error);
    
    if (retries > 0) {
      await new Promise(resolve => setTimeout(resolve, RETRY_DELAY_MS));
      return insertEventWithRetry(eventData, retries - 1);
    }
    return false;
  }
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
  ): Promise<boolean> => {
    const sessionId = sessionIdRef.current || getSessionId();
    
    console.log('[Funnel] Tracking event:', eventType, { jobId, sessionId, metadata });
    
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
      console.warn('[Funnel] Vercel Analytics error:', error);
    }

    // Track in database with retry
    const jsonMetadata = metadata ? JSON.parse(JSON.stringify(metadata)) : {};
    
    const success = await insertEventWithRetry({
      event_type: eventType,
      job_id: jobId || null,
      session_id: sessionId,
      user_agent: typeof navigator !== 'undefined' ? navigator.userAgent : null,
      referrer: typeof document !== 'undefined' ? document.referrer : null,
      metadata: jsonMetadata
    });
    
    return success;
  }, []);

  return { trackEvent };
};

// Standalone function for use outside React components
export const trackFunnelEvent = async (
  eventType: FunnelEventType,
  jobId?: string | null,
  metadata?: FunnelEventMetadata
): Promise<boolean> => {
  const sessionId = getSessionId();
  
  console.log('[Funnel] Tracking event (standalone):', eventType, { jobId, sessionId, metadata });
  
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
    console.warn('[Funnel] Vercel Analytics error:', error);
  }

  // Track in database with retry
  const jsonMetadata = metadata ? JSON.parse(JSON.stringify(metadata)) : {};
  
  const success = await insertEventWithRetry({
    event_type: eventType,
    job_id: jobId || null,
    session_id: sessionId,
    user_agent: typeof navigator !== 'undefined' ? navigator.userAgent : null,
    referrer: typeof document !== 'undefined' ? document.referrer : null,
    metadata: jsonMetadata
  });
  
  return success;
};
