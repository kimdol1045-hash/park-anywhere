import type { ParkingLot } from '../types/parking';
import { calculateDistance } from './geolocation';

// ── 표준데이터 JSON 원본 레코드 타입 ──

interface RawRecord {
  주차장관리번호: string;
  주차장명: string;
  주차장구분: string;
  주차장유형: string;
  소재지도로명주소: string;
  소재지지번주소: string;
  주차구획수: number | string;
  요금정보: string;
  주차기본시간: number | string;
  주차기본요금: number | string;
  추가단위시간: number | string;
  추가단위요금: number | string;
  '1일주차권요금': number | string;
  운영요일: string;
  평일운영시작시각: string;
  평일운영종료시각: string;
  토요일운영시작시각: string;
  토요일운영종료시각: string;
  공휴일운영시작시각: string;
  공휴일운영종료시각: string;
  전화번호: string;
  위도: number | string;
  경도: number | string;
}

interface RawData {
  records: RawRecord[];
}

// ── 파싱된 데이터 캐시 ──

let cachedLots: ParkingLot[] | null = null;

function mapFeeType(info: string): ParkingLot['feeType'] {
  if (info === '무료') return '무료';
  if (info === '유료') return '유료';
  return '혼합';
}

function mapParkingType(구분: string, 유형: string): ParkingLot['type'] {
  const combined = `${구분} ${유형}`;
  if (combined.includes('노외')) return '노외';
  if (combined.includes('노상')) return '노상';
  if (combined.includes('기계')) return '기계';
  return '부설';
}

function buildOperatingHours(r: RawRecord): string {
  const wOpen = r.평일운영시작시각;
  const wClose = r.평일운영종료시각;
  if (!wOpen || !wClose) return '정보 없음';

  if (wOpen === '00:00' && wClose === '23:59') return '24시간';

  const parts: string[] = [`평일 ${wOpen}~${wClose}`];
  if (r.토요일운영시작시각 && r.토요일운영종료시각) {
    parts.push(`토 ${r.토요일운영시작시각}~${r.토요일운영종료시각}`);
  }
  if (r.공휴일운영시작시각 && r.공휴일운영종료시각) {
    parts.push(`공휴일 ${r.공휴일운영시작시각}~${r.공휴일운영종료시각}`);
  }
  return parts.join(' / ');
}

function mapRecord(r: RawRecord): ParkingLot | null {
  const lat = parseFloat(String(r.위도));
  const lng = parseFloat(String(r.경도));
  if (!lat || !lng) return null;

  return {
    id: r.주차장관리번호 || `p-${Math.random().toString(36).slice(2)}`,
    name: r.주차장명 || '',
    address: r.소재지도로명주소 || r.소재지지번주소 || '',
    lat,
    lng,
    type: mapParkingType(r.주차장구분 || '', r.주차장유형 || ''),
    feeType: mapFeeType(r.요금정보 || ''),
    capacity: Number(r.주차구획수) || 0,
    baseTime: Number(r.주차기본시간) || 0,
    baseFee: Number(r.주차기본요금) || 0,
    additionalTime: Number(r.추가단위시간) || 0,
    additionalFee: Number(r.추가단위요금) || 0,
    dayMaxFee: Number(r['1일주차권요금']) || 0,
    operatingHours: buildOperatingHours(r),
    tel: r.전화번호 || '',
  };
}

export async function loadParkingData(): Promise<ParkingLot[]> {
  if (cachedLots) return cachedLots;

  const res = await fetch('/parking-data.json');
  if (!res.ok) throw new Error('주차장 데이터 로드 실패');

  const data: RawData = await res.json();
  const records = data.records ?? [];

  cachedLots = records
    .map(mapRecord)
    .filter((lot): lot is ParkingLot => lot !== null);

  return cachedLots;
}

// ── 공개 API ──

export async function fetchParkingLots(lat: number, lng: number): Promise<ParkingLot[]> {
  const allLots = await loadParkingData();

  // 거리 계산
  const withDistance = allLots.map(lot => ({
    ...lot,
    distance: calculateDistance(lat, lng, lot.lat, lot.lng),
  }));

  // 3km → 5km → 10km 순으로 넓혀가며 최소 30개 확보
  for (const radius of [3, 5, 10]) {
    const nearby = withDistance
      .filter(lot => lot.distance <= radius)
      .sort((a, b) => a.distance - b.distance);

    if (nearby.length >= 30 || radius === 10) {
      return nearby.slice(0, 150);
    }
  }

  // fallback: 가장 가까운 150개
  return withDistance
    .sort((a, b) => a.distance - b.distance)
    .slice(0, 150);
}

export function searchParkingLots(lots: ParkingLot[], keyword: string): ParkingLot[] {
  const q = keyword.trim().toLowerCase();
  if (!q) return lots;
  return lots.filter(
    lot => lot.name.toLowerCase().includes(q) || lot.address.toLowerCase().includes(q),
  );
}

export async function searchAllParkingLots(keyword: string): Promise<ParkingLot[]> {
  const allLots = await loadParkingData();
  return searchParkingLots(allLots, keyword).slice(0, 50);
}

export function formatFee(fee: number): string {
  if (fee === 0) return '무료';
  return `${fee.toLocaleString()}원`;
}
