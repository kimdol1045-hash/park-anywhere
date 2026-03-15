import { BottomSheet } from '@toss/tds-mobile';
import { openNavApp, NAV_APPS } from '../utils/navigation';
import '../styles/NavigationActionSheet.css';

interface NavigationActionSheetProps {
  open: boolean;
  onClose: () => void;
  name: string;
  lat: number;
  lng: number;
}

function NavigationActionSheet({ open, onClose, name, lat, lng }: NavigationActionSheetProps) {
  return (
    <BottomSheet open={open} onClose={onClose}>
      <div className="nav-sheet-inner">
        <h3 className="nav-sheet-title">길찾기</h3>
        <div className="nav-sheet-list">
          {NAV_APPS.map(app => (
            <button
              key={app.id}
              className="nav-sheet-item"
              onClick={() => {
                openNavApp(app.id, { name, lat, lng });
                onClose();
              }}
            >
              <span className="nav-sheet-icon" style={{ background: app.color }}>
                {app.initial}
              </span>
              <span className="nav-sheet-label">{app.label}</span>
            </button>
          ))}
        </div>
        <button className="nav-sheet-cancel" onClick={onClose}>
          닫기
        </button>
      </div>
    </BottomSheet>
  );
}

export default NavigationActionSheet;
