import { Stage, CharacterProfile, CareerRecord, WishSelection, FarmingState } from '../types/game';

const STORAGE_KEY_STAGE = 'personnel_craft_stage_v1';
const STORAGE_KEY_PROFILE = 'personnel_craft_profile_v1';
const STORAGE_KEY_CAREERS = 'personnel_craft_careers_v1';
const STORAGE_KEY_WISHES = 'personnel_craft_wishes_v1';
const STORAGE_KEY_FARMING = 'personnel_craft_farming_v1';

export const DEFAULT_PROFILE: CharacterProfile = {
  nickname: '',
  hireYear: new Date().getFullYear(),
  currentHalf: '하반기',
  currentDept: '',
  appearance: {
    hairStyle: 'neat',
    hairColor: '#1e293b',
    skinTone: '#fed7aa',
    shirtColor: '#3b82f6',
    pantsColor: '#1e293b',
    glasses: false,
    pressCardColor: '#3b82f6',
    expression: 'normal'
  }
};

export const DEFAULT_CAREERS: CareerRecord[] = [];

export const DEFAULT_WISHES: WishSelection = {
  first: {
    deptName: '정치부',
    expectedTO: '모름',
    longTermWorkers: '모름',
    bossRelation: '잘 모름',
    relationTemp: '보통',
    recruitIntent: '전혀 모름',
    competitors: '모름'
  },
  second: {
    deptName: '경제부',
    expectedTO: '모름',
    longTermWorkers: '모름',
    bossRelation: '잘 모름',
    relationTemp: '보통',
    recruitIntent: '전혀 모름',
    competitors: '모름'
  },
  third: {
    deptName: '산업부',
    expectedTO: '모름',
    longTermWorkers: '모름',
    bossRelation: '잘 모름',
    relationTemp: '보통',
    recruitIntent: '전혀 모름',
    competitors: '모름'
  },
  avoidDept: '',
  currentBossIntent: '잘 모르겠다',
  applyBossRelation: false // 기본은 객관적 역량 중심 (OFF)
};

export const DEFAULT_FARMING_STATE: FarmingState = {
  currentTurn: 1,
  remainingPoints: 8,
  metrics: {
    bossInterest: { first: 0, second: 0, third: 0 },
    deptAwareness: { first: 0, second: 0, third: 0 },
    rumorSpread: 0,
    stayPressure: 30,
    infoConfidence: 20,
    articleScore: 0,
    sproutStage: {
      first: 0,
      second: 0,
      third: 0
    }
  },
  logs: [],
  bossVisitCount: {},
  initialProbabilities: null
};

export function loadProfile(): CharacterProfile {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_PROFILE);
    if (raw) {
      return JSON.parse(raw);
    }
  } catch (e) {
    console.error('Failed to load profile', e);
  }
  return DEFAULT_PROFILE;
}

export function saveProfile(profile: CharacterProfile) {
  try {
    localStorage.setItem(STORAGE_KEY_PROFILE, JSON.stringify(profile));
  } catch (e) {
    console.error('Failed to save profile', e);
  }
}

export function loadCareers(): CareerRecord[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_CAREERS);
    if (raw) return JSON.parse(raw);
  } catch (e) {
    console.error('Failed to load careers', e);
  }
  return DEFAULT_CAREERS;
}

export function saveCareers(careers: CareerRecord[]) {
  try {
    localStorage.setItem(STORAGE_KEY_CAREERS, JSON.stringify(careers));
  } catch (e) {
    console.error('Failed to save careers', e);
  }
}

export function loadWishes(): WishSelection {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_WISHES);
    if (raw) return JSON.parse(raw);
  } catch (e) {
    console.error('Failed to load wishes', e);
  }
  return DEFAULT_WISHES;
}

export function saveWishes(wishes: WishSelection) {
  try {
    localStorage.setItem(STORAGE_KEY_WISHES, JSON.stringify(wishes));
  } catch (e) {
    console.error('Failed to save wishes', e);
  }
}

export function loadFarmingState(): FarmingState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_FARMING);
    if (raw) {
      const parsed = JSON.parse(raw);
      // 구버전 단일 숫자 형태의 bossInterest / deptAwareness가 남아있을 경우 객체로 승격
      if (parsed.metrics) {
        if (typeof parsed.metrics.bossInterest === 'number') {
          const val = parsed.metrics.bossInterest;
          parsed.metrics.bossInterest = { first: val, second: Math.round(val * 0.7), third: Math.round(val * 0.5) };
        }
        if (typeof parsed.metrics.deptAwareness === 'number') {
          const val = parsed.metrics.deptAwareness;
          parsed.metrics.deptAwareness = { first: val, second: Math.round(val * 0.7), third: Math.round(val * 0.5) };
        }
      }
      return parsed;
    }
  } catch (e) {
    console.error('Failed to load farming state', e);
  }
  return DEFAULT_FARMING_STATE;
}

export function saveFarmingState(state: FarmingState) {
  try {
    localStorage.setItem(STORAGE_KEY_FARMING, JSON.stringify(state));
  } catch (e) {
    console.error('Failed to save farming state', e);
  }
}

export function createFreshFarmingState(): FarmingState {
  return JSON.parse(JSON.stringify(DEFAULT_FARMING_STATE));
}

export function resetFarmingStorage(): FarmingState {
  try {
    localStorage.removeItem(STORAGE_KEY_FARMING);
  } catch (e) {
    console.error('Failed to remove farming state from storage', e);
  }
  return createFreshFarmingState();
}

export function loadStage(): Stage {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_STAGE);
    if (raw) {
      const parsed = parseFloat(raw);
      if ([1, 2, 3, 3.5, 4, 5].includes(parsed)) {
        return parsed as Stage;
      }
    }
  } catch (e) {
    console.error('Failed to load stage', e);
  }
  return 1;
}

export function saveStage(stage: Stage) {
  try {
    localStorage.setItem(STORAGE_KEY_STAGE, String(stage));
  } catch (e) {
    console.error('Failed to save stage', e);
  }
}

export function resetAllData() {
  localStorage.removeItem(STORAGE_KEY_STAGE);
  localStorage.removeItem(STORAGE_KEY_PROFILE);
  localStorage.removeItem(STORAGE_KEY_CAREERS);
  localStorage.removeItem(STORAGE_KEY_WISHES);
  localStorage.removeItem(STORAGE_KEY_FARMING);
}
