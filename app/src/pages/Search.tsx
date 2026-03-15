import { useState, useEffect, useRef, useMemo } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Search as SearchIcon, X, Clock } from 'lucide-react';
import { useParkingLots } from '../hooks/useParkingLots';
import { useGeolocation } from '../hooks/useGeolocation';
import { searchParkingLots, searchAllParkingLots, loadParkingData } from '../utils/api';
import { calculateDistance } from '../utils/geolocation';
import { matchAreaCoords } from '../utils/areas';
import { storage } from '../utils/storage';
import ParkingRow from '../components/ParkingRow';
import type { ParkingLot } from '../types/parking';

const POPULAR_KEYWORDS = ['공영주차장', '무료주차장', '서울역', '강남', '홍대', '여의도'];

function Search() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const inputRef = useRef<HTMLInputElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>();

  // URL 파라미터에서 검색어 복원 (뒤로가기 시 유지)
  const initialKeyword = searchParams.get('q') || '';
  const [keyword, setKeyword] = useState(initialKeyword);
  const [debouncedKeyword, setDebouncedKeyword] = useState(initialKeyword);
  const [globalResults, setGlobalResults] = useState<ParkingLot[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [recentSearches, setRecentSearches] = useState<string[]>(storage.getRecentSearches());

  const { position } = useGeolocation();
  const { data: nearbyLots } = useParkingLots(
    position?.lat ?? null,
    position?.lng ?? null,
  );

  useEffect(() => {
    // 검색어가 없을 때만 자동 포커스 (뒤로가기로 돌아왔을 때는 결과 유지)
    if (!initialKeyword) {
      inputRef.current?.focus();
    }
  }, [initialKeyword]);

  // 디바운스 검색
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      const trimmed = keyword.trim();
      setDebouncedKeyword(trimmed);
      // URL 파라미터 업데이트 (뒤로가기 시 검색어 유지)
      if (trimmed) {
        setSearchParams({ q: trimmed }, { replace: true });
      } else {
        setSearchParams({}, { replace: true });
      }
    }, 300);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [keyword, setSearchParams]);

  // 검색 실행
  useEffect(() => {
    if (!debouncedKeyword) {
      setGlobalResults([]);
      return;
    }

    let cancelled = false;

    async function doSearch() {
      setIsSearching(true);

      // 1. 지역명 매칭 시도 (강남역, 홍대 등)
      const areaCoords = matchAreaCoords(debouncedKeyword);
      if (areaCoords) {
        const allLots = await loadParkingData();
        const nearby = allLots
          .map(lot => ({
            ...lot,
            distance: calculateDistance(areaCoords.lat, areaCoords.lng, lot.lat, lot.lng),
          }))
          .filter(lot => lot.distance <= 3)
          .sort((a, b) => a.distance - b.distance)
          .slice(0, 50);

        if (!cancelled) {
          setGlobalResults(nearby);
          setIsSearching(false);
        }
        return;
      }

      // 2. 주변 데이터에서 이름/주소 검색
      const nearbyMatches = searchParkingLots(nearbyLots ?? [], debouncedKeyword);
      if (nearbyMatches.length >= 5) {
        if (!cancelled) {
          setGlobalResults(nearbyMatches);
          setIsSearching(false);
        }
        return;
      }

      // 3. 전국 검색
      const results = await searchAllParkingLots(debouncedKeyword);
      if (!cancelled) {
        setGlobalResults(results);
        setIsSearching(false);
      }
    }

    doSearch();
    return () => { cancelled = true; };
  }, [debouncedKeyword, nearbyLots]);

  const searchResults = useMemo(() => {
    if (!debouncedKeyword) return [];
    return globalResults;
  }, [debouncedKeyword, globalResults]);

  const handleKeywordClick = (term: string) => {
    setKeyword(term);
    storage.addRecentSearch(term);
    setRecentSearches(storage.getRecentSearches());
  };

  const handleRemoveRecent = (term: string) => {
    storage.removeRecentSearch(term);
    setRecentSearches(storage.getRecentSearches());
  };

  const handleClearRecent = () => {
    storage.clearRecentSearches();
    setRecentSearches([]);
  };

  const showResults = keyword.trim().length > 0;

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#FFFFFF' }}>
      {/* 검색 헤더 */}
      <div style={{ padding: '12px 20px', display: 'flex', gap: 8, alignItems: 'center' }}>
        <div style={{
          flex: 1,
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          padding: '10px 14px',
          backgroundColor: '#F2F4F6',
          borderRadius: 12,
        }}>
          <SearchIcon size={18} color="#8B95A1" />
          <input
            ref={inputRef}
            type="text"
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            placeholder="주차장 이름, 주소, 지역명으로 검색"
            style={{
              flex: 1,
              border: 'none',
              background: 'none',
              outline: 'none',
              fontSize: 15,
              color: '#191F28',
            }}
          />
          {keyword && (
            <button
              type="button"
              onClick={() => { setKeyword(''); setGlobalResults([]); }}
              style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, display: 'flex' }}
            >
              <X size={16} color="#B0B8C1" />
            </button>
          )}
        </div>
        <button
          type="button"
          onClick={() => navigate(-1)}
          style={{
            background: 'none',
            border: 'none',
            fontSize: 15,
            color: '#6B7684',
            cursor: 'pointer',
            whiteSpace: 'nowrap',
          }}
        >
          취소
        </button>
      </div>

      {showResults ? (
        <div>
          <div style={{ padding: '8px 20px' }}>
            <span style={{ fontSize: 13, color: '#8B95A1' }}>
              {isSearching ? '검색 중...' : `검색 결과 ${searchResults.length}개`}
            </span>
          </div>
          {searchResults.length > 0 ? (
            searchResults.map(lot => (
              <ParkingRow key={lot.id} lot={lot} />
            ))
          ) : isSearching ? (
            <div style={{ padding: '40px 20px', textAlign: 'center' }}>
              <p style={{ fontSize: 14, color: '#8B95A1' }}>주차장을 찾고 있어요...</p>
            </div>
          ) : debouncedKeyword ? (
            <div style={{ padding: '40px 20px', textAlign: 'center' }}>
              <p style={{ fontSize: 36, marginBottom: 8 }}>🔍</p>
              <p style={{ fontSize: 15, fontWeight: 600, color: '#191F28', marginBottom: 4 }}>
                일치하는 주차장을 찾지 못했어요
              </p>
              <p style={{ fontSize: 13, color: '#8B95A1' }}>
                다른 키워드로 검색해보세요
              </p>
            </div>
          ) : null}
        </div>
      ) : (
        <div>
          {/* 최근 검색어 */}
          {recentSearches.length > 0 && (
            <div style={{ padding: '16px 20px' }}>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginBottom: 12,
              }}>
                <span style={{ fontSize: 15, fontWeight: 600, color: '#191F28' }}>
                  최근 검색
                </span>
                <button
                  onClick={handleClearRecent}
                  style={{
                    background: 'none',
                    border: 'none',
                    fontSize: 13,
                    color: '#8B95A1',
                    cursor: 'pointer',
                  }}
                >
                  모두 삭제
                </button>
              </div>
              {recentSearches.map(term => (
                <div
                  key={term}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '10px 0',
                  }}
                >
                  <div
                    onClick={() => handleKeywordClick(term)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 8,
                      flex: 1,
                      cursor: 'pointer',
                    }}
                  >
                    <Clock size={14} color="#B0B8C1" />
                    <span style={{ fontSize: 14, color: '#333D4B' }}>{term}</span>
                  </div>
                  <button
                    onClick={() => handleRemoveRecent(term)}
                    style={{
                      background: 'none',
                      border: 'none',
                      cursor: 'pointer',
                      padding: 4,
                      display: 'flex',
                    }}
                  >
                    <X size={14} color="#B0B8C1" />
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* 인기 검색어 */}
          <div style={{ padding: '16px 20px' }}>
            <p style={{ fontSize: 15, fontWeight: 600, color: '#191F28', marginBottom: 12 }}>
              인기 검색어
            </p>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              {POPULAR_KEYWORDS.map(term => (
                <button
                  key={term}
                  onClick={() => handleKeywordClick(term)}
                  style={{
                    padding: '8px 14px',
                    borderRadius: 16,
                    border: '1px solid #E5E8EB',
                    backgroundColor: '#FFFFFF',
                    fontSize: 14,
                    color: '#333D4B',
                    cursor: 'pointer',
                  }}
                >
                  {term}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Search;
