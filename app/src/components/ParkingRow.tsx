import { useNavigate } from 'react-router-dom';
import type { ParkingLot } from '../types/parking';
import type { RealtimeInfo } from '../utils/api';
import { formatDistance } from '../utils/geolocation';
import { formatFee } from '../utils/api';

interface ParkingRowProps {
  lot: ParkingLot;
  realtime?: RealtimeInfo;
}

function getAvailabilityStatus(info: RealtimeInfo) {
  const ratio = info.capacity > 0 ? info.available / info.capacity : 0;
  if (ratio > 0.3) return { label: '여유', color: '#1B9C3E', bg: '#E8F9EE' };
  if (ratio > 0.1) return { label: '보통', color: '#F59F00', bg: '#FFF8E6' };
  return { label: '혼잡', color: '#E53935', bg: '#FFF0F0' };
}

function ParkingRow({ lot, realtime }: ParkingRowProps) {
  const navigate = useNavigate();

  return (
    <div
      onClick={() => navigate(`/detail/${lot.id}`)}
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '16px 20px',
        cursor: 'pointer',
        borderBottom: '1px solid #F2F4F6',
        textAlign: 'left',
      }}
    >
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6 }}>
          <span
            style={{
              display: 'inline-block',
              fontSize: 11,
              fontWeight: 600,
              padding: '2px 6px',
              borderRadius: 4,
              backgroundColor: lot.feeType === '무료' ? '#E8F3FF' : lot.feeType === '유료' ? '#FFF0F0' : '#FFF8E6',
              color: lot.feeType === '무료' ? '#3182F6' : lot.feeType === '유료' ? '#E53935' : '#F59F00',
              lineHeight: '16px',
            }}
          >
            {lot.feeType}
          </span>
          <span
            style={{
              display: 'inline-block',
              fontSize: 11,
              color: '#8B95A1',
              padding: '2px 6px',
              borderRadius: 4,
              backgroundColor: '#F2F4F6',
              lineHeight: '16px',
            }}
          >
            {lot.type}
          </span>
        </div>

        <p style={{ fontSize: 16, fontWeight: 600, color: '#191F28', marginBottom: 4, lineHeight: '22px' }}>
          {lot.name}
        </p>

        <p style={{ fontSize: 13, color: '#6B7684', marginBottom: 8, lineHeight: '18px' }}>
          {lot.address}
        </p>

        <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
          {lot.distance != null && (
            <span style={{ fontSize: 13, fontWeight: 600, color: '#3182F6', lineHeight: '18px' }}>
              {formatDistance(lot.distance)}
            </span>
          )}
          <span style={{ fontSize: 13, color: '#8B95A1', lineHeight: '18px' }}>
            {lot.baseFee > 0
              ? `${lot.baseTime}분 ${formatFee(lot.baseFee)}`
              : '무료'}
          </span>
          {lot.capacity > 0 && (
            <span style={{ fontSize: 13, color: '#8B95A1', lineHeight: '18px' }}>
              총 {lot.capacity}면
            </span>
          )}
        </div>
      </div>

      {/* 실시간 잔여석 */}
      {realtime && realtime.capacity > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 4, marginLeft: 12, flexShrink: 0 }}>
          <span
            style={{
              fontSize: 11,
              fontWeight: 600,
              padding: '3px 8px',
              borderRadius: 10,
              backgroundColor: getAvailabilityStatus(realtime).bg,
              color: getAvailabilityStatus(realtime).color,
            }}
          >
            {getAvailabilityStatus(realtime).label}
          </span>
          <span style={{ fontSize: 11, fontWeight: 500, color: '#8B95A1' }}>
            {realtime.available}/{realtime.capacity}
          </span>
        </div>
      )}
    </div>
  );
}

export default ParkingRow;
