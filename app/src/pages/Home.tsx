import { useState, useCallback, useRef, useMemo } from 'react';
import { flushSync } from 'react-dom';
import { useNavigate } from 'react-router-dom';
import { Button } from '@toss/tds-mobile';
import { MapPin, Search, Heart, ChevronRight, ArrowLeft } from 'lucide-react';
import { useGeolocation } from '../hooks/useGeolocation';
import { useReverseGeocode } from '../hooks/useReverseGeocode';
import { useParkingLots, useRealtimeBatch } from '../hooks/useParkingLots';
import { storage } from '../utils/storage';
import ParkingRow from '../components/ParkingRow';
import type { FilterType, SortType, ParkingLot } from '../types/parking';

const FILTERS: FilterType[] = ['전체', '공영', '유료', '무료'];

function filterAndSort(lots: ParkingLot[] | undefined, filter: FilterType, sort: SortType, showFavorites: boolean): ParkingLot[] {
  if (!lots || lots.length === 0) return [];

  let filtered: ParkingLot[];

  if (showFavorites) {
    const favIds = storage.getFavorites();
    filtered = lots.filter(l => favIds.includes(l.id));
  } else {
    switch (filter) {
      case '무료':
        filtered = lots.filter(l => l.feeType === '무료');
        break;
      case '공영':
        filtered = lots.filter(l => l.type === '노외' || l.type === '노상');
        break;
      case '유료':
        filtered = lots.filter(l => l.feeType === '유료');
        break;
      default:
        filtered = lots;
        break;
    }
  }

  const sorted = [...filtered];
  if (sort === 'fee') {
    sorted.sort((a, b) => a.baseFee - b.baseFee);
  } else {
    sorted.sort((a, b) => (a.distance ?? Infinity) - (b.distance ?? Infinity));
  }
  return sorted;
}

function Home() {
  const navigate = useNavigate();
  const { position, error: geoError, consentNeeded, grantConsent, skipConsent } = useGeolocation();
  const locationName = useReverseGeocode(position?.lat ?? null, position?.lng ?? null);
  const [filter, setFilter] = useState<FilterType>('전체');
  const [sort, setSort] = useState<SortType>('distance');
  const [showFavorites, setShowFavorites] = useState(false);
  // 매 필터 변경마다 증가하는 카운터 → key로 사용하여 DOM 강제 재생성
  const renderKeyRef = useRef(0);

  const { data: lots, isLoading, error } = useParkingLots(
    position?.lat ?? null,
    position?.lng ?? null,
  );

  // 컴포넌트 외부 순수함수로 계산 (closure 문제 완전 배제)
  const displayLots = filterAndSort(lots, filter, sort, showFavorites);

  // 실시간 잔여석 일괄 조회
  const lotIds = useMemo(() => displayLots.map(l => l.id), [displayLots]);
  const { data: realtimeMap } = useRealtimeBatch(lotIds);

  const handleFilterChange = useCallback((f: FilterType) => {
    renderKeyRef.current += 1;
    flushSync(() => {
      setFilter(f);
    });
    window.scrollTo(0, 0);
  }, []);

  const handleSortChange = useCallback((s: SortType) => {
    renderKeyRef.current += 1;
    flushSync(() => {
      setSort(s);
    });
  }, []);

  const handleToggleFavorites = useCallback(() => {
    renderKeyRef.current += 1;
    flushSync(() => {
      setShowFavorites(v => !v);
    });
  }, []);

  // 즐겨찾기 모드
  if (showFavorites) {
    return (
      <div style={{ minHeight: '100vh', backgroundColor: '#FFFFFF' }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          padding: '16px 20px 8px',
          gap: 12,
        }}>
          <button
            onClick={handleToggleFavorites}
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              padding: 4,
              display: 'flex',
              alignItems: 'center',
            }}
          >
            <ArrowLeft size={24} color="#191F28" />
          </button>
          <h1 style={{ fontSize: 22, fontWeight: 700, color: '#191F28' }}>
            즐겨찾기
          </h1>
        </div>

        {displayLots.length === 0 ? (
          <div style={{ padding: '60px 20px', textAlign: 'center' }}>
            <p style={{ fontSize: 36, marginBottom: 8 }}>💙</p>
            <p style={{ fontSize: 15, fontWeight: 600, color: '#191F28', marginBottom: 4 }}>
              주차장을 즐겨찾기에 추가해보세요
            </p>
            <p style={{ fontSize: 13, color: '#8B95A1' }}>
              주차장 상세에서 하트를 눌러 저장할 수 있어요
            </p>
          </div>
        ) : (
          <>
            <div style={{ padding: '8px 20px' }}>
              <span style={{ fontSize: 13, color: '#8B95A1' }}>
                즐겨찾기 {displayLots.length}개
              </span>
            </div>
            <div>
              {displayLots.map(lot => (
                <ParkingRow key={lot.id} lot={lot} realtime={realtimeMap?.get(lot.id)} />
              ))}
            </div>
          </>
        )}
        <div style={{ height: 40 }} />
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#FFFFFF' }}>
      {/* 헤더 */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '16px 20px 8px',
      }}>
        <h1 style={{ fontSize: 22, fontWeight: 700, color: '#191F28' }}>
          주차해요
        </h1>
        <button
          onClick={handleToggleFavorites}
          style={{
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            padding: 4,
            display: 'flex',
            alignItems: 'center',
          }}
        >
          <Heart size={24} fill="none" color="#6B7684" />
        </button>
      </div>

      {/* 위치 표시 */}
      {consentNeeded ? (
        <div style={{ padding: '8px 20px' }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '12px 16px',
            backgroundColor: '#F2F4F6',
            borderRadius: 12,
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <MapPin size={14} color="#8B95A1" />
              <span style={{ fontSize: 13, color: '#333D4B' }}>
                위치 정보를 사용할까요?
              </span>
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <button
                onClick={skipConsent}
                style={{
                  background: 'none',
                  border: 'none',
                  fontSize: 13,
                  color: '#8B95A1',
                  cursor: 'pointer',
                }}
              >
                건너뛰기
              </button>
              <button
                onClick={grantConsent}
                style={{
                  background: 'none',
                  border: 'none',
                  fontSize: 13,
                  fontWeight: 600,
                  color: '#3182F6',
                  cursor: 'pointer',
                }}
              >
                허용
              </button>
            </div>
          </div>
        </div>
      ) : (
        <div style={{ padding: '4px 20px 8px', display: 'flex', alignItems: 'center', gap: 4 }}>
          <MapPin size={14} color={geoError ? '#8B95A1' : '#3182F6'} />
          <span style={{ fontSize: 13, color: geoError ? '#8B95A1' : '#333D4B' }}>
            {geoError
              ? '기본 위치(서울시청) 기준으로 표시해요'
              : locationName
                ? `${locationName} 근처`
                : '위치를 확인하고 있어요...'}
          </span>
        </div>
      )}

      {/* 검색바 */}
      <div style={{ padding: '8px 20px' }}>
        <div
          onClick={() => navigate('/search')}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            padding: '12px 16px',
            backgroundColor: '#F2F4F6',
            borderRadius: 12,
            cursor: 'pointer',
          }}
        >
          <Search size={18} color="#8B95A1" />
          <span style={{ fontSize: 15, color: '#8B95A1' }}>
            주차장 이름이나 주소로 검색
          </span>
        </div>
      </div>

      {/* 꿀팁 배너 */}
      <div style={{ padding: '8px 20px' }}>
        <div
          onClick={() => navigate('/tips')}
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '14px 16px',
            backgroundColor: '#E8F3FF',
            borderRadius: 12,
            cursor: 'pointer',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontSize: 20 }}>🅿️</span>
            <div>
              <p style={{ fontSize: 14, fontWeight: 600, color: '#191F28' }}>
                무료 주차 꿀팁 모음
              </p>
              <p style={{ fontSize: 12, color: '#6B7684' }}>
                마트, 백화점 무료 주차 조건을 확인해보세요
              </p>
            </div>
          </div>
          <ChevronRight size={18} color="#8B95A1" />
        </div>
      </div>

      {/* 필터 탭 */}
      <div style={{ display: 'flex', gap: 8, padding: '12px 20px' }}>
        {FILTERS.map(f => (
          <button
            key={f}
            onClick={() => handleFilterChange(f)}
            style={{
              padding: '6px 14px',
              borderRadius: 16,
              border: 'none',
              fontSize: 14,
              fontWeight: filter === f ? 600 : 400,
              backgroundColor: filter === f ? '#191F28' : '#F2F4F6',
              color: filter === f ? '#FFFFFF' : '#6B7684',
              cursor: 'pointer',
              whiteSpace: 'nowrap',
            }}
          >
            {f}
          </button>
        ))}
      </div>

      {/* 결과 헤더 */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '8px 20px',
      }}>
        <span style={{ fontSize: 13, color: '#8B95A1' }}>
          주차장 {displayLots.length}개
        </span>
        <div style={{ display: 'flex', gap: 4 }}>
          <button
            onClick={() => handleSortChange('distance')}
            style={{
              background: 'none',
              border: 'none',
              fontSize: 13,
              color: sort === 'distance' ? '#3182F6' : '#8B95A1',
              fontWeight: sort === 'distance' ? 600 : 400,
              cursor: 'pointer',
            }}
          >
            거리순
          </button>
          <span style={{ color: '#D1D6DB', fontSize: 13 }}>|</span>
          <button
            onClick={() => handleSortChange('fee')}
            style={{
              background: 'none',
              border: 'none',
              fontSize: 13,
              color: sort === 'fee' ? '#3182F6' : '#8B95A1',
              fontWeight: sort === 'fee' ? 600 : 400,
              cursor: 'pointer',
            }}
          >
            요금순
          </button>
        </div>
      </div>

      {/* 주차장 목록 */}
      <div key={renderKeyRef.current} style={{ willChange: 'contents' }}>
        {isLoading ? (
          <div style={{ padding: '40px 20px', textAlign: 'center' }}>
            <p style={{ fontSize: 14, color: '#8B95A1' }}>주차장을 찾고 있어요...</p>
          </div>
        ) : error ? (
          <div style={{ padding: '40px 20px', textAlign: 'center' }}>
            <p style={{ fontSize: 14, color: '#8B95A1', marginBottom: 12 }}>
              주차장 정보를 불러오지 못했어요
            </p>
            <Button color="primary" variant="fill" size="small" onClick={() => window.location.reload()}>
              다시 시도
            </Button>
          </div>
        ) : displayLots.length === 0 ? (
          <div style={{ padding: '40px 20px', textAlign: 'center' }}>
            <p style={{ fontSize: 36, marginBottom: 8 }}>🅿️</p>
            <p style={{ fontSize: 15, fontWeight: 600, color: '#191F28', marginBottom: 4 }}>
              조건에 맞는 주차장을 찾지 못했어요
            </p>
            <p style={{ fontSize: 13, color: '#8B95A1' }}>
              다른 필터로 검색해보세요
            </p>
          </div>
        ) : (
          displayLots.map(lot => (
            <ParkingRow key={lot.id} lot={lot} realtime={realtimeMap?.get(lot.id)} />
          ))
        )}
      </div>

      <div style={{ height: 40 }} />
    </div>
  );
}

export default Home;
