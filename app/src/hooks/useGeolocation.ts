import { useState, useEffect, useCallback } from 'react';
import { getCurrentPosition, type Position } from '../utils/geolocation';
import { storage } from '../utils/storage';

interface GeolocationState {
  position: Position | null;
  loading: boolean;
  error: string | null;
  permissionDenied: boolean;
  consentNeeded: boolean;
}

export function useGeolocation() {
  const hasConsent = storage.getLocationConsent();

  const [state, setState] = useState<GeolocationState>({
    position: null,
    loading: hasConsent,
    error: null,
    permissionDenied: false,
    consentNeeded: !hasConsent,
  });

  const fetchLocation = useCallback(async () => {
    setState(prev => ({ ...prev, loading: true, error: null }));
    try {
      const pos = await getCurrentPosition();
      setState({
        position: pos,
        loading: false,
        error: null,
        permissionDenied: false,
        consentNeeded: false,
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : '위치를 확인하지 못했어요';
      const denied = message.includes('권한');
      setState(prev => ({
        ...prev,
        loading: false,
        error: message,
        permissionDenied: denied,
        consentNeeded: false,
      }));
    }
  }, []);

  const grantConsent = useCallback(() => {
    storage.setLocationConsent(true);
    setState(prev => ({ ...prev, consentNeeded: false }));
    fetchLocation();
  }, [fetchLocation]);

  const skipConsent = useCallback(() => {
    storage.setLocationConsent(true);
    setState(prev => ({ ...prev, consentNeeded: false, loading: false }));
  }, []);

  useEffect(() => {
    if (hasConsent) {
      fetchLocation();
    }
  }, [hasConsent, fetchLocation]);

  return { ...state, refresh: fetchLocation, grantConsent, skipConsent };
}
