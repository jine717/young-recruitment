import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface VideoUrlCache {
  signedUrl: string;
  expiresAt: number;
}

// Global cache to persist across component re-renders
const videoUrlCache = new Map<string, VideoUrlCache>();

// Buffer time before expiration to refresh (5 minutes)
const REFRESH_BUFFER_MS = 5 * 60 * 1000;

/**
 * Extract video path from a full URL or return as-is if already a path
 */
export function extractVideoPath(videoUrl: string | null | undefined): string | null {
  if (!videoUrl) return null;
  
  // If it's already just a path (no http)
  if (!videoUrl.startsWith('http')) {
    return videoUrl;
  }
  
  // Extract path from full Supabase storage URL
  // Format: https://{project}.supabase.co/storage/v1/object/public/business-case-videos/{path}
  const match = videoUrl.match(/\/business-case-videos\/(.+)$/);
  if (match) {
    return match[1];
  }
  
  // Fallback: try to get everything after the last bucket name
  const bucketMatch = videoUrl.match(/business-case-videos\/(.+?)(?:\?|$)/);
  if (bucketMatch) {
    return bucketMatch[1];
  }
  
  return null;
}

interface UseVideoUrlOptions {
  applicationId?: string;
  bcqAccessToken?: string | null;
}

interface UseVideoUrlResult {
  url: string | null;
  isLoading: boolean;
  error: string | null;
  refetch: () => void;
}

export function useVideoUrl(
  videoPath: string | null | undefined,
  options: UseVideoUrlOptions = {}
): UseVideoUrlResult {
  const { applicationId, bcqAccessToken } = options;
  const [url, setUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fetchingRef = useRef(false);

  const fetchSignedUrl = useCallback(async () => {
    if (!videoPath || fetchingRef.current) return;
    
    // Extract path if full URL was passed
    const path = extractVideoPath(videoPath) || videoPath;
    
    // Check cache first
    const cached = videoUrlCache.get(path);
    if (cached && cached.expiresAt > Date.now() + REFRESH_BUFFER_MS) {
      setUrl(cached.signedUrl);
      setIsLoading(false);
      return;
    }

    fetchingRef.current = true;
    setIsLoading(true);
    setError(null);

    try {
      const { data: { session } } = await supabase.auth.getSession();

      const body: Record<string, string | null | undefined> = {
        videoPath: path,
      };

      // Add BCQ token for anonymous candidate access
      if (applicationId && bcqAccessToken) {
        body.applicationId = applicationId;
        body.bcqAccessToken = bcqAccessToken;
      }

      // Ensure the backend receives the access token when the user is logged in
      const headers: Record<string, string> | undefined = session?.access_token
        ? { Authorization: `Bearer ${session.access_token}` }
        : undefined;

      const response = await supabase.functions.invoke('get-video-url', {
        body,
        ...(headers ? { headers } : {}),
      });

      if (response.error) {
        throw new Error(response.error.message || 'Failed to get video URL');
      }

      const { signedUrl, expiresAt } = response.data;

      // Cache the result
      videoUrlCache.set(path, { signedUrl, expiresAt });
      setUrl(signedUrl);
    } catch (err) {
      console.error('Error fetching signed URL:', err);
      setError(err instanceof Error ? err.message : 'Failed to load video');
      
      // Fallback: if it was a full URL, try using it directly (for backwards compatibility)
      if (videoPath?.startsWith('http')) {
        console.log('Falling back to original URL');
        setUrl(videoPath);
      }
    } finally {
      setIsLoading(false);
      fetchingRef.current = false;
    }
  }, [videoPath, applicationId, bcqAccessToken]);

  useEffect(() => {
    if (videoPath) {
      fetchSignedUrl();
    } else {
      setUrl(null);
      setIsLoading(false);
    }
  }, [videoPath, fetchSignedUrl]);

  // Set up auto-refresh before expiration
  useEffect(() => {
    if (!videoPath) return;

    const path = extractVideoPath(videoPath) || videoPath;
    const cached = videoUrlCache.get(path);
    
    if (!cached) return;

    const timeUntilRefresh = cached.expiresAt - Date.now() - REFRESH_BUFFER_MS;
    
    if (timeUntilRefresh <= 0) {
      // Already needs refresh
      fetchSignedUrl();
      return;
    }

    const timer = setTimeout(() => {
      console.log('Auto-refreshing signed URL for:', path);
      fetchSignedUrl();
    }, timeUntilRefresh);

    return () => clearTimeout(timer);
  }, [videoPath, url, fetchSignedUrl]);

  const refetch = useCallback(() => {
    if (videoPath) {
      const path = extractVideoPath(videoPath) || videoPath;
      videoUrlCache.delete(path);
      fetchSignedUrl();
    }
  }, [videoPath, fetchSignedUrl]);

  return { url, isLoading, error, refetch };
}

/**
 * Clear all cached video URLs
 */
export function clearVideoUrlCache() {
  videoUrlCache.clear();
}
