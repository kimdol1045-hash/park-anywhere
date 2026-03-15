export interface ParkingLot {
  id: string;
  name: string;
  address: string;
  lat: number;
  lng: number;
  type: ParkingType;
  feeType: FeeType;
  capacity: number;
  currentCount?: number;
  baseTime: number;
  baseFee: number;
  additionalTime: number;
  additionalFee: number;
  dayMaxFee: number;
  operatingHours: string;
  tel: string;
  distance?: number;
}

export type ParkingType = '노외' | '노상' | '부설' | '기계';
export type FeeType = '무료' | '유료' | '혼합';
export type FilterType = '전체' | '무료' | '공영' | '유료';
export type SortType = 'distance' | 'fee';

export interface ParkingFilter {
  type: FilterType;
  sort: SortType;
}

export interface TipTier {
  amount: number;
  amountLabel: string;
  freeHours: number;
}

export interface TipBranch {
  name: string;
  condition: string;
  note: string;
}

export interface TipItem {
  id: string;
  name: string;
  logo: string;
  summary: string;
  freeCondition: string;
  details: {
    baseFee: string;
    gracePeriod: string;
    tiers?: TipTier[];
    branches?: TipBranch[];
    maxFreeHours: number | null;
    memberBenefit: string;
    autoSettlement: boolean;
    autoSettlementCondition?: string;
  };
  notes: string[];
  tip: string;
}

export interface TipCategory {
  id: string;
  name: string;
  icon: string;
  items: TipItem[];
}

export interface GeneralTip {
  title: string;
  description: string;
}

export interface TipsData {
  version: string;
  lastUpdated: string;
  disclaimer: string;
  categories: TipCategory[];
  generalTips?: GeneralTip[];
}
