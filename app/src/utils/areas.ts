interface AreaCoord {
  name: string;
  lat: number;
  lng: number;
}

const AREAS: AreaCoord[] = [
  // 서울 주요 지역
  { name: '강남역', lat: 37.4980, lng: 127.0276 },
  { name: '강남', lat: 37.4980, lng: 127.0276 },
  { name: '역삼', lat: 37.5007, lng: 127.0365 },
  { name: '삼성', lat: 37.5089, lng: 127.0638 },
  { name: '선릉', lat: 37.5045, lng: 127.0490 },
  { name: '서울역', lat: 37.5547, lng: 126.9707 },
  { name: '용산', lat: 37.5298, lng: 126.9648 },
  { name: '홍대', lat: 37.5571, lng: 126.9248 },
  { name: '합정', lat: 37.5495, lng: 126.9139 },
  { name: '신촌', lat: 37.5553, lng: 126.9368 },
  { name: '이태원', lat: 37.5346, lng: 126.9946 },
  { name: '명동', lat: 37.5636, lng: 126.9853 },
  { name: '종로', lat: 37.5700, lng: 126.9820 },
  { name: '광화문', lat: 37.5759, lng: 126.9769 },
  { name: '시청', lat: 37.5666, lng: 126.9784 },
  { name: '동대문', lat: 37.5711, lng: 127.0095 },
  { name: '을지로', lat: 37.5660, lng: 126.9920 },
  { name: '잠실', lat: 37.5133, lng: 127.1001 },
  { name: '송파', lat: 37.5050, lng: 127.1124 },
  { name: '건대', lat: 37.5404, lng: 127.0688 },
  { name: '왕십리', lat: 37.5614, lng: 127.0381 },
  { name: '성수', lat: 37.5445, lng: 127.0561 },
  { name: '여의도', lat: 37.5219, lng: 126.9245 },
  { name: '마포', lat: 37.5530, lng: 126.9515 },
  { name: '영등포', lat: 37.5159, lng: 126.9073 },
  { name: '구로', lat: 37.4954, lng: 126.8876 },
  { name: '신림', lat: 37.4841, lng: 126.9293 },
  { name: '관악', lat: 37.4784, lng: 126.9516 },
  { name: '사당', lat: 37.4766, lng: 126.9816 },
  { name: '강서', lat: 37.5510, lng: 126.8495 },
  { name: '목동', lat: 37.5244, lng: 126.8750 },
  { name: '노원', lat: 37.6553, lng: 127.0616 },
  { name: '도봉', lat: 37.6688, lng: 127.0470 },
  { name: '강북', lat: 37.6397, lng: 127.0119 },
  { name: '중랑', lat: 37.6063, lng: 127.0928 },
  { name: '성북', lat: 37.5894, lng: 127.0167 },
  { name: '은평', lat: 37.6027, lng: 126.9290 },
  { name: '서대문', lat: 37.5791, lng: 126.9368 },
  { name: '동작', lat: 37.5124, lng: 126.9393 },
  { name: '서초', lat: 37.4837, lng: 127.0324 },
  { name: '강동', lat: 37.5301, lng: 127.1238 },
  { name: '광진', lat: 37.5384, lng: 127.0822 },
  { name: '양천', lat: 37.5170, lng: 126.8665 },
  { name: '금천', lat: 37.4568, lng: 126.8959 },

  // 수도권
  { name: '판교', lat: 37.3948, lng: 127.1112 },
  { name: '분당', lat: 37.3825, lng: 127.1195 },
  { name: '수원', lat: 37.2636, lng: 127.0286 },
  { name: '인천', lat: 37.4563, lng: 126.7052 },
  { name: '일산', lat: 37.6559, lng: 126.7701 },
  { name: '부천', lat: 37.5034, lng: 126.7660 },
  { name: '성남', lat: 37.4200, lng: 127.1267 },
  { name: '용인', lat: 37.2411, lng: 127.1776 },
  { name: '화성', lat: 37.1996, lng: 126.8312 },
  { name: '고양', lat: 37.6584, lng: 126.8321 },
  { name: '안양', lat: 37.3943, lng: 126.9568 },

  // 광역시
  { name: '부산', lat: 35.1796, lng: 129.0756 },
  { name: '대구', lat: 35.8714, lng: 128.6014 },
  { name: '대전', lat: 36.3504, lng: 127.3845 },
  { name: '광주', lat: 35.1595, lng: 126.8526 },
  { name: '울산', lat: 35.5384, lng: 129.3114 },
  { name: '세종', lat: 36.4800, lng: 127.2560 },
  { name: '제주', lat: 33.4996, lng: 126.5312 },
];

export function matchAreaCoords(keyword: string): { lat: number; lng: number } | null {
  const kw = keyword.trim();
  for (const area of AREAS) {
    if (kw.includes(area.name) || area.name.includes(kw)) {
      return { lat: area.lat, lng: area.lng };
    }
  }
  return null;
}

// 좌표 → 가장 가까운 지역명 (역방향 매칭)
// 중복 좌표 없는 구/동 단위만 사용
const REVERSE_AREAS = AREAS.filter(a => !a.name.includes('역') || a.name === '역삼');

export function findNearestAreaName(lat: number, lng: number): string {
  let minDist = Infinity;
  let nearest = '';
  for (const area of REVERSE_AREAS) {
    const dLat = lat - area.lat;
    const dLng = lng - area.lng;
    const dist = dLat * dLat + dLng * dLng;
    if (dist < minDist) {
      minDist = dist;
      nearest = area.name;
    }
  }
  return nearest ? `${nearest} 근처` : '';
}
