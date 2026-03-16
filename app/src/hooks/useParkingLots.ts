import { useQuery } from '@tanstack/react-query';
import { fetchParkingLots, loadParkingData, fetchRealtimeInfo, fetchRealtimeBatch } from '../utils/api';
import { calculateDistance } from '../utils/geolocation';
import type { ParkingLot } from '../types/parking';
import type { RealtimeInfo } from '../utils/api';

export function useParkingLots(lat: number | null, lng: number | null) {
  return useQuery({
    queryKey: ['parkingLots', lat, lng],
    queryFn: () => fetchParkingLots(lat!, lng!),
    enabled: lat != null && lng != null,
  });
}

export function useParkingLotById(parkingId: string, lat: number | null, lng: number | null) {
  return useQuery({
    queryKey: ['parkingLotAll'],
    queryFn: () => loadParkingData(),
    select: (data): ParkingLot | undefined => {
      const lot = data.find(l => l.id === parkingId);
      if (lot && lat != null && lng != null) {
        return { ...lot, distance: calculateDistance(lat, lng, lot.lat, lot.lng) };
      }
      return lot;
    },
  });
}

export function useRealtimeInfo(parkingId: string | undefined) {
  return useQuery({
    queryKey: ['realtimeInfo', parkingId],
    queryFn: () => fetchRealtimeInfo(parkingId!),
    enabled: !!parkingId,
    refetchInterval: 60_000, // 1분마다 갱신
    staleTime: 30_000,
  });
}

export function useRealtimeBatch(parkingIds: string[]) {
  return useQuery({
    queryKey: ['realtimeBatch', parkingIds.slice(0, 20).join(',')],
    queryFn: () => fetchRealtimeBatch(parkingIds),
    enabled: parkingIds.length > 0,
    refetchInterval: 60_000,
    staleTime: 30_000,
  });
}

export type { RealtimeInfo };
