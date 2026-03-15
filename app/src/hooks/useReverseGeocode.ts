import { useState, useEffect } from 'react';

let cache: Record<string, string> = {};

async function reverseGeocode(lat: number, lng: number): Promise<string> {
  const key = `${lat.toFixed(4)},${lng.toFixed(4)}`;
  if (cache[key]) return cache[key];

  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&accept-language=ko&zoom=16`,
      { headers: { 'User-Agent': 'park-free/1.0' } },
    );
    if (!res.ok) return '';

    const data = await res.json();
    const addr = data.address ?? {};

    // 구 추출: city_district 또는 borough
    const gu = addr.city_district || addr.borough || '';
    // 동 추출: quarter, neighbourhood, suburb 순서
    const dong = addr.quarter || addr.neighbourhood || addr.suburb || '';

    let result = '';
    if (gu && dong) {
      result = `${gu} ${dong}`;
    } else if (gu) {
      result = gu;
    } else if (dong) {
      result = dong;
    } else if (addr.city) {
      result = addr.city;
    }

    cache[key] = result;
    return result;
  } catch {
    return '';
  }
}

export function useReverseGeocode(lat: number | null, lng: number | null) {
  const [address, setAddress] = useState('');

  useEffect(() => {
    if (lat == null || lng == null) return;
    reverseGeocode(lat, lng).then(setAddress);
  }, [lat, lng]);

  return address;
}
