export type NavApp = 'kakaomap' | 'navermap';

interface NavTarget {
  name: string;
  lat: number;
  lng: number;
}

export function openNavApp(app: NavApp, target: NavTarget): void {
  const { name, lat, lng } = target;
  let url = '';

  switch (app) {
    case 'kakaomap':
      url = `https://map.kakao.com/link/to/${encodeURIComponent(name)},${lat},${lng}`;
      break;
    case 'navermap':
      url = `https://map.naver.com/v5/directions/-/-/-/transit?c=${lng},${lat},15,0,0,0,dh&destination=${encodeURIComponent(name)},${lng},${lat}`;
      break;
  }

  if (url) {
    import('@apps-in-toss/web-framework')
      .then(({ openURL }) => openURL(url))
      .catch(() => {
        window.open(url, '_blank');
      });
  }
}

export const NAV_APPS: { id: NavApp; label: string; color: string; initial: string }[] = [
  { id: 'kakaomap', label: '카카오맵', color: '#FEE500', initial: 'K' },
  { id: 'navermap', label: '네이버 지도', color: '#03C75A', initial: 'N' },
];
