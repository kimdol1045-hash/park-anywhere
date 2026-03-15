import { useState } from 'react';
import { ChevronDown, ChevronUp, Lightbulb } from 'lucide-react';
import tipsData from '../../../free-parking-tips-data.json';
import type { TipsData, TipItem } from '../types/parking';

const data = tipsData as TipsData;
const CATEGORY_ICONS: Record<string, string> = {
  cart: '🛒',
  building: '🏬',
  landmark: '🏛️',
  hospital: '🏥',
  sparkles: '✨',
};

// 일반 꿀팁을 별도 탭으로 추가
const GENERAL_TAB_ID = '__general__';
const generalTips = data.generalTips ?? [];

function Tips() {
  const [activeCategory, setActiveCategory] = useState(generalTips.length > 0 ? GENERAL_TAB_ID : (data.categories[0]?.id ?? ''));
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const currentCategory = data.categories.find(c => c.id === activeCategory);
  const isGeneralTab = activeCategory === GENERAL_TAB_ID;

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#FFFFFF' }}>
      {/* 헤더 */}
      <div style={{ padding: '20px 20px 8px' }}>
        <h1 style={{ fontSize: 22, fontWeight: 700, color: '#191F28' }}>
          무료 주차 꿀팁
        </h1>
        <p style={{ fontSize: 14, color: '#6B7684', marginTop: 4 }}>
          {data.disclaimer}
        </p>
      </div>

      {/* 카테고리 탭 - 스크롤바 숨김 */}
      <div
        className="hide-scrollbar"
        style={{
          display: 'flex',
          gap: 6,
          padding: '12px 20px',
          overflowX: 'auto',
        }}
      >
        {/* 꿀팁 모음 탭 (맨 처음) */}
        {generalTips.length > 0 && (
          <button
            onClick={() => {
              setActiveCategory(GENERAL_TAB_ID);
              setExpandedId(null);
            }}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 4,
              padding: '8px 14px',
              borderRadius: 20,
              border: 'none',
              fontSize: 14,
              fontWeight: isGeneralTab ? 600 : 400,
              backgroundColor: isGeneralTab ? '#191F28' : '#F2F4F6',
              color: isGeneralTab ? '#FFFFFF' : '#6B7684',
              cursor: 'pointer',
              whiteSpace: 'nowrap',
              flexShrink: 0,
            }}
          >
            <span>💡</span>
            꿀팁 모음
          </button>
        )}
        {data.categories.map(cat => (
          <button
            key={cat.id}
            onClick={() => {
              setActiveCategory(cat.id);
              setExpandedId(null);
            }}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 4,
              padding: '8px 14px',
              borderRadius: 20,
              border: 'none',
              fontSize: 14,
              fontWeight: activeCategory === cat.id ? 600 : 400,
              backgroundColor: activeCategory === cat.id ? '#191F28' : '#F2F4F6',
              color: activeCategory === cat.id ? '#FFFFFF' : '#6B7684',
              cursor: 'pointer',
              whiteSpace: 'nowrap',
              flexShrink: 0,
            }}
          >
            <span>{CATEGORY_ICONS[cat.icon] ?? '📌'}</span>
            {cat.name}
          </button>
        ))}
      </div>

      {/* 일반 꿀팁 탭 내용 */}
      {isGeneralTab ? (
        <div style={{ padding: '8px 20px 24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 16 }}>
            <Lightbulb size={18} color="#3182F6" />
            <h2 style={{ fontSize: 17, fontWeight: 700, color: '#191F28' }}>
              알아두면 좋은 주차 꿀팁
            </h2>
          </div>
          {generalTips.map((tip, i) => (
            <div key={i} style={{
              padding: '14px 16px',
              backgroundColor: '#F9FAFB',
              borderRadius: 10,
              marginBottom: 8,
            }}>
              <p style={{ fontSize: 14, fontWeight: 600, color: '#191F28', marginBottom: 4 }}>
                {tip.title}
              </p>
              <p style={{ fontSize: 13, color: '#6B7684', lineHeight: 1.6 }}>
                {tip.description}
              </p>
            </div>
          ))}
        </div>
      ) : (
        /* 팁 카드 리스트 */
        <div style={{ padding: '8px 20px 24px' }}>
          {currentCategory?.items.map(item => (
            <TipCard
              key={item.id}
              item={item}
              expanded={expandedId === item.id}
              onToggle={() => setExpandedId(expandedId === item.id ? null : item.id)}
            />
          ))}
        </div>
      )}

      <div style={{ height: 40 }} />
    </div>
  );
}

function TipCard({ item, expanded, onToggle }: {
  item: TipItem;
  expanded: boolean;
  onToggle: () => void;
}) {
  return (
    <div style={{
      border: '1px solid #E5E8EB',
      borderRadius: 12,
      marginBottom: 12,
      overflow: 'hidden',
    }}>
      {/* 요약 */}
      <div
        onClick={onToggle}
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '16px',
          cursor: 'pointer',
        }}
      >
        <div style={{ flex: 1 }}>
          <p style={{ fontSize: 16, fontWeight: 600, color: '#191F28', marginBottom: 2 }}>
            {item.name}
          </p>
          <p style={{ fontSize: 13, color: '#6B7684' }}>
            {item.summary}
          </p>
        </div>
        {expanded ? (
          <ChevronUp size={20} color="#8B95A1" />
        ) : (
          <ChevronDown size={20} color="#8B95A1" />
        )}
      </div>

      {/* 상세 */}
      {expanded && (
        <div style={{
          padding: '0 16px 16px',
          borderTop: '1px solid #F2F4F6',
        }}>
          {/* 무료 조건 */}
          <div style={{ padding: '12px 0' }}>
            <p style={{ fontSize: 13, fontWeight: 600, color: '#3182F6', marginBottom: 4 }}>
              무료 조건
            </p>
            <p style={{ fontSize: 14, color: '#333D4B' }}>
              {item.freeCondition}
            </p>
          </div>

          {/* 기본 요금 */}
          <DetailRow label="기본 주차비" value={item.details.baseFee} />
          <DetailRow label="회차 무료" value={item.details.gracePeriod} />

          {/* 구매 금액별 무료 */}
          {item.details.tiers && item.details.tiers.length > 0 && (
            <div style={{ padding: '8px 0' }}>
              <p style={{ fontSize: 13, fontWeight: 600, color: '#191F28', marginBottom: 6 }}>
                구매 금액별 무료 시간
              </p>
              {item.details.tiers.map((tier, i) => (
                <div key={i} style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  padding: '4px 0',
                }}>
                  <span style={{ fontSize: 13, color: '#6B7684' }}>{tier.amountLabel}</span>
                  <span style={{ fontSize: 13, fontWeight: 600, color: '#191F28' }}>{tier.freeHours}시간 무료</span>
                </div>
              ))}
            </div>
          )}

          {/* 지점별 정보 - 전체 표시 */}
          {item.details.branches && item.details.branches.length > 0 && (
            <div style={{ padding: '8px 0' }}>
              <p style={{ fontSize: 13, fontWeight: 600, color: '#191F28', marginBottom: 6 }}>
                지점별 정보
              </p>
              {item.details.branches.map((branch, i) => (
                <div key={i} style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  padding: '4px 0',
                  gap: 8,
                }}>
                  <span style={{ fontSize: 13, color: '#6B7684', flexShrink: 0 }}>{branch.name}</span>
                  <span style={{ fontSize: 13, color: '#191F28', textAlign: 'right' }}>{branch.condition}</span>
                </div>
              ))}
            </div>
          )}

          {/* 멤버 혜택 */}
          {item.details.memberBenefit && (
            <DetailRow label="멤버 혜택" value={item.details.memberBenefit} />
          )}

          {/* 꿀팁 */}
          <div style={{
            padding: '12px',
            backgroundColor: '#E8F3FF',
            borderRadius: 8,
            marginTop: 8,
          }}>
            <p style={{ fontSize: 13, fontWeight: 600, color: '#3182F6', marginBottom: 4 }}>
              💡 꿀팁
            </p>
            <p style={{ fontSize: 13, color: '#333D4B', lineHeight: 1.6 }}>
              {item.tip}
            </p>
          </div>

          {/* 참고사항 */}
          {item.notes.length > 0 && (
            <div style={{ marginTop: 12 }}>
              <p style={{ fontSize: 12, fontWeight: 600, color: '#8B95A1', marginBottom: 4 }}>
                참고사항
              </p>
              {item.notes.map((note, i) => (
                <p key={i} style={{ fontSize: 12, color: '#8B95A1', lineHeight: 1.6 }}>
                  · {note}
                </p>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function DetailRow({ label, value }: { label: string; value: string }) {
  if (!value || value === '해당 없음') return null;
  return (
    <div style={{
      display: 'flex',
      justifyContent: 'space-between',
      padding: '6px 0',
    }}>
      <span style={{ fontSize: 13, color: '#6B7684' }}>{label}</span>
      <span style={{ fontSize: 13, color: '#191F28' }}>{value}</span>
    </div>
  );
}

export default Tips;
