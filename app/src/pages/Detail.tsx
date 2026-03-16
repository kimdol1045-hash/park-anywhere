import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button } from '@toss/tds-mobile';
import {
  ChevronLeft, Heart, Share2,
  MapPin, Clock, Banknote, Layers, Phone, PhoneCall, Building2, Copy, Navigation,
} from 'lucide-react';
import { useGeolocation } from '../hooks/useGeolocation';
import { useParkingLotById, useRealtimeInfo } from '../hooks/useParkingLots';
import { formatFee } from '../utils/api';
import { storage } from '../utils/storage';
import NavigationActionSheet from '../components/NavigationActionSheet';

function formatUpdatedAt(timeStr: string): string {
  if (!timeStr) return '';
  try {
    const updated = new Date(timeStr);
    const diff = Math.floor((Date.now() - updated.getTime()) / 60000);
    if (diff < 1) return '방금 갱신';
    if (diff < 60) return `${diff}분 전 갱신`;
    return `${Math.floor(diff / 60)}시간 전 갱신`;
  } catch {
    return '';
  }
}

function Detail() {
  const { parkingId } = useParams<{ parkingId: string }>();
  const navigate = useNavigate();
  const { position } = useGeolocation();
  const { data: lot, isLoading } = useParkingLotById(
    parkingId ?? '',
    position?.lat ?? null,
    position?.lng ?? null,
  );
  const { data: realtime } = useRealtimeInfo(parkingId);
  const [isFavorite, setIsFavorite] = useState(false);
  const [navOpen, setNavOpen] = useState(false);

  useEffect(() => {
    if (parkingId) {
      setIsFavorite(storage.isFavorite(parkingId));
    }
  }, [parkingId]);

  const handleToggleFavorite = () => {
    if (!parkingId) return;
    const nowFav = storage.toggleFavorite(parkingId);
    setIsFavorite(nowFav);
  };

  const handleShare = async () => {
    if (!lot) return;
    try {
      await navigator.share({ title: lot.name, text: `${lot.name} - ${lot.address}`, url: window.location.href });
    } catch { /* 공유 취소 */ }
  };

  const handleCopyAddress = () => {
    if (!lot?.address) return;
    navigator.clipboard.writeText(lot.address).catch(() => {});
  };

  if (isLoading) {
    return (
      <div style={{ padding: '60px 20px', textAlign: 'center' }}>
        <p style={{ fontSize: 14, color: '#8B95A1' }}>정보를 불러오고 있어요...</p>
      </div>
    );
  }

  if (!lot) {
    return (
      <div style={{ padding: '60px 20px', textAlign: 'center' }}>
        <p style={{ fontSize: 15, fontWeight: 600, color: '#191F28', marginBottom: 8 }}>
          주차장 정보를 불러오지 못했어요
        </p>
        <p style={{ fontSize: 13, color: '#8B95A1', marginBottom: 16 }}>
          다시 시도하거나 다른 주차장을 선택해보세요
        </p>
        <Button color="primary" variant="fill" size="medium" onClick={() => navigate('/')}>
          홈으로 돌아가기
        </Button>
      </div>
    );
  }

  // 요금 텍스트
  const feeText = lot.baseFee === 0 ? '무료' : `${lot.baseTime}분 ${formatFee(lot.baseFee)}`;
  const isFree = lot.feeType === '무료';

  // 주차장 구분 텍스트
  const categoryText = (() => {
    if (lot.type === '노외' || lot.type === '노상') return '공영주차장';
    if (lot.type === '부설') return '부설주차장';
    if (lot.type === '기계') return '기계식주차장';
    return lot.type;
  })();

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#FFFFFF', display: 'flex', flexDirection: 'column' }}>
      {/* 네비게이션 바 */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        height: 52,
        padding: '0 20px',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <button
            onClick={() => navigate(-1)}
            style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, display: 'flex' }}
          >
            <ChevronLeft size={24} color="#191F28" />
          </button>
          <span style={{ fontSize: 18, fontWeight: 600, color: '#191F28' }}>
            {lot.name}
          </span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <button
            onClick={handleToggleFavorite}
            style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, display: 'flex' }}
          >
            <Heart
              size={22}
              fill={isFavorite ? '#3182F6' : 'none'}
              color={isFavorite ? '#3182F6' : '#B0B8C1'}
            />
          </button>
          <button
            onClick={handleShare}
            style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, display: 'flex' }}
          >
            <Share2 size={22} color="#B0B8C1" />
          </button>
        </div>
      </div>

      {/* 히어로 섹션 */}
      <div style={{ padding: 20 }}>
        {/* 태그 행 */}
        <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
          {/* 요금 태그 */}
          <span style={{
            fontSize: 12,
            fontWeight: 600,
            padding: '4px 10px',
            borderRadius: 12,
            backgroundColor: isFree ? '#E8F9EE' : '#FFF0F0',
            color: isFree ? '#1B9C3E' : '#E53935',
          }}>
            {lot.feeType}
          </span>
          {/* 카테고리 태그 */}
          <span style={{
            fontSize: 12,
            fontWeight: 600,
            padding: '4px 10px',
            borderRadius: 12,
            backgroundColor: '#E8F3FF',
            color: '#3182F6',
          }}>
            {categoryText}
          </span>
          {/* 운영중 태그 */}
          <span style={{
            fontSize: 12,
            fontWeight: 600,
            padding: '4px 10px',
            borderRadius: 12,
            backgroundColor: '#E8F9EE',
            color: '#1B9C3E',
          }}>
            운영중
          </span>
        </div>

        {/* 주차면수 섹션 */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          backgroundColor: '#F9FAFB',
          borderRadius: 16,
          padding: '16px 20px',
        }}>
          <div>
            <p style={{ fontSize: 13, fontWeight: 500, color: '#8B95A1', marginBottom: 4 }}>
              {realtime && realtime.capacity > 0 ? '실시간 잔여석' : '총 주차면수'}
            </p>
            <div style={{ display: 'flex', alignItems: 'flex-end', gap: 4 }}>
              <span style={{ fontSize: 36, fontWeight: 700, color: '#3182F6' }}>
                {realtime && realtime.capacity > 0
                  ? realtime.available
                  : lot.capacity > 0 ? lot.capacity : '-'}
              </span>
              <span style={{ fontSize: 16, fontWeight: 500, color: '#8B95A1', paddingBottom: 4 }}>
                {realtime && realtime.capacity > 0
                  ? `/ ${realtime.capacity}석`
                  : '면'}
              </span>
            </div>
          </div>
          {realtime && realtime.capacity > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 4 }}>
              {realtime.updatedAt && (
                <span style={{ fontSize: 11, color: '#B0B8C1' }}>
                  {formatUpdatedAt(realtime.updatedAt)}
                </span>
              )}
              <div style={{ width: 80, height: 8, borderRadius: 4, backgroundColor: '#E5E8EB', overflow: 'hidden' }}>
                <div style={{
                  width: `${Math.round((realtime.available / realtime.capacity) * 100)}%`,
                  height: '100%',
                  borderRadius: 4,
                  backgroundColor: realtime.available / realtime.capacity > 0.3 ? '#1B9C3E'
                    : realtime.available / realtime.capacity > 0.1 ? '#F59F00' : '#E53935',
                }} />
              </div>
            </div>
          ) : lot.capacity > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 4 }}>
              <span style={{ fontSize: 12, color: '#8B95A1' }}>총 수용 대수</span>
            </div>
          ) : null}
        </div>
      </div>

      {/* 구분선 */}
      <div style={{ height: 8, backgroundColor: '#F2F4F6' }} />

      {/* 정보 섹션 */}
      <div>
        {/* 주소 */}
        {lot.address && (
          <>
            <InfoRow
              icon={<MapPin size={20} color="#8B95A1" />}
              label="주소"
              value={lot.address}
              rightIcon={
                <button
                  onClick={handleCopyAddress}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, display: 'flex' }}
                >
                  <Copy size={18} color="#B0B8C1" />
                </button>
              }
            />
            <Divider />
          </>
        )}

        {/* 운영시간 */}
        <InfoRow
          icon={<Clock size={20} color="#8B95A1" />}
          label="운영시간"
          value={lot.operatingHours}
        />
        <Divider />

        {/* 요금 정보 */}
        <InfoRow
          icon={<Banknote size={20} color="#8B95A1" />}
          label="요금 정보"
          value={feeText}
          valueColor={isFree ? '#1B9C3E' : '#191F28'}
          valueBold={isFree}
        />
        <Divider />

        {/* 총 주차면수 */}
        <InfoRow
          icon={<Layers size={20} color="#8B95A1" />}
          label="총 주차면수"
          value={lot.capacity > 0 ? `${lot.capacity}면` : '정보 없음'}
        />
        <Divider />

        {/* 전화번호 */}
        {lot.tel ? (
          <>
            <InfoRow
              icon={<Phone size={20} color="#8B95A1" />}
              label="전화번호"
              value={lot.tel}
              valueColor="#3182F6"
              rightIcon={
                <button
                  onClick={() => {
                    import('@apps-in-toss/web-framework')
                      .then(({ openURL }) => openURL(`tel:${lot.tel}`))
                      .catch(() => { window.location.href = `tel:${lot.tel}`; });
                  }}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, display: 'flex' }}
                >
                  <PhoneCall size={18} color="#3182F6" />
                </button>
              }
            />
            <Divider />
          </>
        ) : null}

        {/* 주차장 유형 */}
        <InfoRow
          icon={<Building2 size={20} color="#8B95A1" />}
          label="주차장 유형"
          value={`${lot.type}주차장`}
        />
      </div>

      {/* 하단 여백 (CTA 버튼 공간) */}
      <div style={{ flex: 1 }} />
      <div style={{ height: 100 }} />

      {/* 길찾기 CTA */}
      <div style={{
        position: 'fixed',
        bottom: 0,
        left: '50%',
        transform: 'translateX(-50%)',
        width: '100%',
        maxWidth: 480,
        padding: '12px 20px',
        paddingBottom: 'calc(12px + env(safe-area-inset-bottom))',
        backgroundColor: '#FFFFFF',
        borderTop: '1px solid #F2F4F6',
      }}>
        <button
          onClick={() => setNavOpen(true)}
          style={{
            width: '100%',
            height: 52,
            border: 'none',
            borderRadius: 12,
            backgroundColor: '#3182F6',
            fontSize: 16,
            fontWeight: 600,
            color: '#FFFFFF',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 8,
          }}
        >
          <Navigation size={18} color="#FFFFFF" />
          길찾기
        </button>
      </div>

      {/* 길찾기 앱 선택 바텀시트 */}
      <NavigationActionSheet
        open={navOpen}
        onClose={() => setNavOpen(false)}
        name={lot.name}
        lat={lot.lat}
        lng={lot.lng}
      />
    </div>
  );
}

function InfoRow({ icon, label, value, valueColor, valueBold, rightIcon }: {
  icon: React.ReactNode;
  label: string;
  value: string;
  valueColor?: string;
  valueBold?: boolean;
  rightIcon?: React.ReactNode;
}) {
  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      gap: 14,
      padding: '16px 20px',
    }}>
      {icon}
      <div style={{ flex: 1 }}>
        <p style={{ fontSize: 12, fontWeight: 500, color: '#8B95A1', marginBottom: 2 }}>
          {label}
        </p>
        <p style={{
          fontSize: 15,
          color: valueColor ?? '#191F28',
          fontWeight: valueBold ? 600 : 400,
        }}>
          {value}
        </p>
      </div>
      {rightIcon}
    </div>
  );
}

function Divider() {
  return (
    <div style={{ padding: '0 20px' }}>
      <div style={{ height: 1, backgroundColor: '#F2F4F6' }} />
    </div>
  );
}

export default Detail;
