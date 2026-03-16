import type { ParkingLot } from '../types/parking';
import { calculateDistance } from './geolocation';

const API_KEY = import.meta.env.VITE_PARKING_API_KEY as string;

// ── 공공 API 응답 타입 ──

interface ApiResponse {
  response: {
    header: { resultCode: string; resultMsg: string };
    body: {
      items: ApiItem[];
      totalCount: number;
      numOfRows: number;
      pageNo: number;
    };
  };
}

interface ApiItem {
  prkplceNo: string;       // 주차장관리번호
  prkplceNm: string;       // 주차장명
  prkplceSe: string;       // 주차장구분 (노외/노상/부설)
  prkplceType: string;     // 주차장유형
  rdnmadr: string;         // 도로명주소
  lnmadr: string;          // 지번주소
  prkcmprt: number;        // 주차구획수
  feedingSe: string;       // 요금정보 (무료/유료/혼합)
  basicTime: number;       // 기본시간(분)
  basicCharge: number;     // 기본요금
  addUnitTime: number;     // 추가단위시간
  addUnitCharge: number;   // 추가단위요금
  dayCmmtktAdjTime: number; // 1일주차권요금
  operDay: string;         // 운영요일
  weekdayOperOpenHhmm: string;  // 평일시작
  weekdayOperColseHhmm: string; // 평일종료
  satOperOperOpenHhmm: string;  // 토요일시작
  satOperCloseHhmm: string;     // 토요일종료
  holidayOperOpenHhmm: string;  // 공휴일시작
  holidayCloseOpenHhmm: string; // 공휴일종료
  phoneNumber: string;     // 전화번호
  latitude: number;        // 위도
  longitude: number;       // 경도
}

// ── 정적 데이터 원본 타입 ──

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

// ── 캐시 ──

let cachedLots: ParkingLot[] | null = null;

// ── 매핑 함수 ──

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

function buildOperatingHours(wOpen: string, wClose: string, sOpen: string, sClose: string, hOpen: string, hClose: string): string {
  if (!wOpen || !wClose) return '정보 없음';
  if (wOpen === '00:00' && wClose === '23:59') return '24시간';

  const parts: string[] = [`평일 ${wOpen}~${wClose}`];
  if (sOpen && sClose) parts.push(`토 ${sOpen}~${sClose}`);
  if (hOpen && hClose) parts.push(`공휴일 ${hOpen}~${hClose}`);
  return parts.join(' / ');
}

function mapApiItem(item: ApiItem): ParkingLot | null {
  const lat = Number(item.latitude);
  const lng = Number(item.longitude);
  if (!lat || !lng) return null;

  return {
    id: item.prkplceNo || `p-${Math.random().toString(36).slice(2)}`,
    name: item.prkplceNm || '',
    address: item.rdnmadr || item.lnmadr || '',
    lat,
    lng,
    type: mapParkingType(item.prkplceSe || '', item.prkplceType || ''),
    feeType: mapFeeType(item.feedingSe || ''),
    capacity: Number(item.prkcmprt) || 0,
    baseTime: Number(item.basicTime) || 0,
    baseFee: Number(item.basicCharge) || 0,
    additionalTime: Number(item.addUnitTime) || 0,
    additionalFee: Number(item.addUnitCharge) || 0,
    dayMaxFee: Number(item.dayCmmtktAdjTime) || 0,
    operatingHours: buildOperatingHours(
      item.weekdayOperOpenHhmm || '', item.weekdayOperColseHhmm || '',
      item.satOperOperOpenHhmm || '', item.satOperCloseHhmm || '',
      item.holidayOperOpenHhmm || '', item.holidayCloseOpenHhmm || '',
    ),
    tel: item.phoneNumber || '',
  };
}

function mapRawRecord(r: RawRecord): ParkingLot | null {
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
    operatingHours: buildOperatingHours(
      r.평일운영시작시각, r.평일운영종료시각,
      r.토요일운영시작시각, r.토요일운영종료시각,
      r.공휴일운영시작시각, r.공휴일운영종료시각,
    ),
    tel: r.전화번호 || '',
  };
}

// ── 공공 API 호출 ──

async function fetchFromApi(endpoint: string, params: Record<string, string | number>): Promise<ApiItem[]> {
  const query = new URLSearchParams({
    serviceKey: API_KEY,
    type: 'json',
    numOfRows: String(params.numOfRows ?? 1000),
    pageNo: String(params.pageNo ?? 1),
    ...Object.fromEntries(
      Object.entries(params).map(([k, v]) => [k, String(v)])
    ),
  });

  const res = await fetch(`/api/parking/${endpoint}?${query}`);
  if (!res.ok) throw new Error(`API 호출 실패: ${res.status}`);

  const data: ApiResponse = await res.json();
  if (data.response?.header?.resultCode !== '00') {
    throw new Error(data.response?.header?.resultMsg || 'API 오류');
  }

  return data.response?.body?.items ?? [];
}

// ── 데이터 로드 (API 우선, 정적 JSON fallback) ──

export async function loadParkingData(): Promise<ParkingLot[]> {
  if (cachedLots) return cachedLots;

  // 1. 공공 API 시도
  if (API_KEY) {
    try {
      const allItems: ApiItem[] = [];
      const firstPage = await fetchFromApi('PrkSttusInfo', { numOfRows: 1000, pageNo: 1 });
      allItems.push(...firstPage);

      // 총 건수가 1000 이상이면 추가 페이지 로드 (최대 10페이지)
      if (firstPage.length >= 1000) {
        const pages = Array.from({ length: 9 }, (_, i) => i + 2);
        const results = await Promise.allSettled(
          pages.map(p => fetchFromApi('PrkSttusInfo', { numOfRows: 1000, pageNo: p }))
        );
        for (const result of results) {
          if (result.status === 'fulfilled' && result.value.length > 0) {
            allItems.push(...result.value);
          }
        }
      }

      const lots = allItems
        .map(mapApiItem)
        .filter((lot): lot is ParkingLot => lot !== null);

      if (lots.length > 0) {
        cachedLots = lots;
        return cachedLots;
      }
    } catch {
      // API 실패 → 정적 JSON fallback
    }
  }

  // 2. 정적 JSON fallback
  const res = await fetch('/parking-data.json');
  if (!res.ok) throw new Error('주차장 데이터를 불러오지 못했어요');

  const data: RawData = await res.json();
  cachedLots = (data.records ?? [])
    .map(mapRawRecord)
    .filter((lot): lot is ParkingLot => lot !== null);

  return cachedLots;
}

// ── 실시간 주차 정보 ──

export interface RealtimeInfo {
  parkingId: string;
  currentCount: number; // 현재 주차 차량수
  capacity: number;     // 총 주차면수
  available: number;    // 잔여석
  updatedAt: string;    // 갱신 시각
}

export async function fetchRealtimeInfo(parkingId: string): Promise<RealtimeInfo | null> {
  if (!API_KEY) return null;

  try {
    const items = await fetchFromApi('PrkRealtimeInfo', {
      numOfRows: 1,
      pageNo: 1,
      prkplceNo: parkingId,
    });
    if (items.length > 0) {
      const item = items[0] as Record<string, unknown>;
      const capacity = Number(item.pkfc ?? item.prkcmprt ?? 0);
      const currentCount = Number(item.nowPrkVhclCnt ?? 0);
      const available = Math.max(0, capacity - currentCount);
      const syncTime = String(item.syncTime ?? item.lsttRfrhDt ?? '');

      return { parkingId, currentCount, capacity, available, updatedAt: syncTime };
    }
  } catch {
    // 실시간 정보 실패는 무시
  }
  return null;
}

export async function fetchRealtimeBatch(parkingIds: string[]): Promise<Map<string, RealtimeInfo>> {
  const map = new Map<string, RealtimeInfo>();
  if (!API_KEY || parkingIds.length === 0) return map;

  try {
    const items = await fetchFromApi('PrkRealtimeInfo', { numOfRows: 1000, pageNo: 1 });
    const idSet = new Set(parkingIds);

    for (const raw of items) {
      const item = raw as Record<string, unknown>;
      const id = String(item.prkplceNo ?? '');
      if (!id || !idSet.has(id)) continue;

      const capacity = Number(item.pkfc ?? item.prkcmprt ?? 0);
      const currentCount = Number(item.nowPrkVhclCnt ?? 0);
      const available = Math.max(0, capacity - currentCount);
      const syncTime = String(item.syncTime ?? item.lsttRfrhDt ?? '');

      map.set(id, { parkingId: id, currentCount, capacity, available, updatedAt: syncTime });
    }
  } catch {
    // 일괄 조회 실패는 무시
  }
  return map;
}

// ── 공개 API ──

export async function fetchParkingLots(lat: number, lng: number): Promise<ParkingLot[]> {
  const allLots = await loadParkingData();

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
