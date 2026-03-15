import { useNavigate } from 'react-router-dom';
import type { ParkingLot } from '../types/parking';
import { formatDistance } from '../utils/geolocation';
import { formatFee } from '../utils/api';

interface ParkingRowProps {
  lot: ParkingLot;
}

function ParkingRow({ lot }: ParkingRowProps) {
  const navigate = useNavigate();

  return (
    <div
      onClick={() => navigate(`/detail/${lot.id}`)}
      style={{
        padding: '16px 20px',
        cursor: 'pointer',
        borderBottom: '1px solid #F2F4F6',
        textAlign: 'left',
      }}
    >
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
  );
}

export default ParkingRow;
