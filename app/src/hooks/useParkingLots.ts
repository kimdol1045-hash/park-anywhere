import { useQuery } from '@tanstack/react-query';
import { fetchParkingLots, loadParkingData } from '../utils/api';
import { calculateDistance } from '../utils/geolocation';
import type { ParkingLot } from '../types/parking';

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
