import { CharacterProfile, CareerRecord, WishSelection, FarmingState } from '../types/game';

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
    expectedTO: '2명',
    longTermWorkers: '2명',
    bossRelation: '과거 같은 부서에서 근무한 동료',
    relationTemp: '좋은 관계',
    recruitIntent: '관심은 있어 보임'
  },
  second: {
    deptName: '국제부',
    expectedTO: '1명',
    longTermWorkers: '1명',
    bossRelation: '인사만 하는 사이',
    relationTemp: '보통',
    recruitIntent: '특별한 의사 표현 없음'
  },
  third: {
    deptName: '증권부',
    expectedTO: '1명',
    longTermWorkers: '없음',
    bossRelation: '대학 선후배',
    relationTemp: '좋은 관계',
    recruitIntent: '긍정적 의사 표현'
  },
  avoidDept: '편집부',
  currentBossIntent: '이동을 허용할 가능성이 높다',
  applyBossRelation: true
};

export const DEFAULT_FARMING_STATE: FarmingState = {
  currentTurn: 1,
  remainingPoints: 8,
  metrics: {
    bossInterest: 30,
    deptAwareness: 25,
    rumorSpread: 15,
    stayPressure: 35,
    infoConfidence: 40,
    articleScore: 20,
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
    if (raw) return JSON.parse(raw);
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

export function resetAllData() {
  localStorage.removeItem(STORAGE_KEY_PROFILE);
  localStorage.removeItem(STORAGE_KEY_CAREERS);
  localStorage.removeItem(STORAGE_KEY_WISHES);
  localStorage.removeItem(STORAGE_KEY_FARMING);
}
