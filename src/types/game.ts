export type Stage = 1 | 2 | 3 | 3.5 | 4 | 5;

export interface CharacterAppearance {
  hairStyle: 'neat' | 'short' | 'messy' | 'parted';
  hairColor: string; // hex
  skinTone: string;  // hex
  shirtColor: string;// hex
  pantsColor: string;// hex
  glasses: boolean;
  pressCardColor: string;
  expression: 'normal' | 'nervous' | 'happy' | 'exhausted';
}

export interface CharacterProfile {
  nickname: string;
  hireYear: number;
  currentHalf: '상반기' | '하반기';
  currentDept: string;
  appearance: CharacterAppearance;
}

export interface SubFieldExperience {
  name: string;
  months: number; // 6개월 단위
}

export interface CareerRecord {
  id: string;
  deptName: string;
  periodMonths: number; // 총 근무 개월수 (6개월 단위: 6, 12, 18, 24...)
  subFields: SubFieldExperience[];
}

export type DeptTO = '모름' | '0명' | '1명' | '2명' | '3명' | '4명 이상';
export type LongTermWorkers = '모름' | '없음' | '1명' | '2명' | '3명 이상';

export type DeptBossRelation = 
  | '과거 직속 부장·데스크'
  | '과거 같은 부서에서 근무한 동료'
  | '다른 부서에서 업무상 협업'
  | '대학 선후배'
  | '술자리 친구·사적 친분'
  | '인사만 하는 사이'
  | '얼굴만 아는 사이'
  | '안면이 전혀 없는 사이'
  | '잘 모름';

export type RelationTemp = 
  | '매우 좋은 관계'
  | '좋은 관계'
  | '보통'
  | '다소 껄끄러움'
  | '좋지 않은 관계'
  | '잘 모름';

export type BossRecruitIntent = 
  | '직접 함께 일하자고 제안'
  | '긍정적 의사 표현'
  | '관심은 있어 보임'
  | '특별한 의사 표현 없음'
  | '부정적 반응'
  | '전혀 모름';

export type CurrentBossIntent = 
  | '적극적으로 보내주려 한다'
  | '이동을 허용할 가능성이 높다'
  | '잘 모르겠다'
  | '잔류를 원하는 분위기다'
  | '반드시 남기려고 한다';

export interface WishDeptConfig {
  deptName: string;
  expectedTO: DeptTO;
  longTermWorkers: LongTermWorkers;
  bossRelation: DeptBossRelation;
  relationTemp: RelationTemp;
  recruitIntent: BossRecruitIntent;
}

export interface WishSelection {
  first: WishDeptConfig;
  second: WishDeptConfig;
  third: WishDeptConfig;
  avoidDept: string; // 기피 부서 (1곳)
  currentBossIntent: CurrentBossIntent;
  applyBossRelation: boolean; // 관계 변수 ON/OFF 토글
}

export interface SimulationProbabilities {
  firstWish: number;
  secondWish: number;
  thirdWish: number;
  avoidDept: number;
  stayCurrent: number;
  otherDept: number;
  totalWish: number;
}

export interface CareerPathRecommendation {
  type: 'A' | 'B' | 'C';
  title: string;
  routeName: string;
  description: string;
  steps: string[];
}

export interface CareerAnalysisResult {
  totalMonths: number;
  totalYearsText: string;
  reporterType: string;
  detailedSpecialty: string;
  description: string;
  topFields: { field: string; months: number; ratio: number }[];
  skillTree: Record<string, number>; // 0 ~ 100
  careerPaths: CareerPathRecommendation[];
}

export interface SuddenEvent {
  id: string;
  title: string;
  type: 'scenario' | 'flavor';
  description: string;
  effectDescription: string;
  affectedWish?: 1 | 2 | 3;
  toBonus?: number;
  intentBonus?: number;
}

export interface FinalAppointmentResult {
  assignedDept: string;
  resultType: 'first' | 'second' | 'third' | 'avoid' | 'stay' | 'other';
  messageHeadline: string;
  messageSubtitle: string;
  flavorQuote: string;
  probabilities: SimulationProbabilities;
  animationAction: 'celebrate' | 'frustrated' | 'stay_desk';
}

/* ========================================================
   [신규] STAGE 3.5 — 추석 이후 인사 농사 시스템 타입 정의
   ======================================================== */

export interface PersonnelFarmingMetrics {
  bossInterest: number;        // ① 희망 부서장 관심도 (0 ~ 100)
  deptAwareness: number;       // ② 희망 부서 내 인지도 (0 ~ 100)
  rumorSpread: number;         // ③ 소문 확산도 (0 ~ 100)
  stayPressure: number;        // ④ 현재 부서 잔류 압력 (0 ~ 100)
  infoConfidence: number;      // ⑤ 인사 정보 신뢰도 (0 ~ 100)
  articleScore: number;        // 기사 작성 성과 점수 (0 ~ 100)
  sproutStage: {               // 블록 밭 새싹 단계 (0 ~ 3)
    first: number;
    second: number;
    third: number;
  };
}

export type FarmingActionType =
  | 'meet_boss'      // A. 희망 부서장 만나기
  | 'meet_peer'      // B. 희망 부서 동료 만나기
  | 'spread_rumor'   // C. 팀 안에 소문 내기 ("인사 소문 흘리기")
  | 'explore_board'  // D. 인사판 탐색 (휴게실)
  | 'meet_cur_boss'  // E. 현재 부서장과 면담하기
  | 'write_article'  // F. 인사 농사 대신 기사 쓰기
  | 'do_nothing';    // G. 아무것도 하지 않기

export interface FarmingLogEntry {
  turn: number;
  weekName: string;
  actionType: FarmingActionType;
  actionTitle: string;
  targetDept?: string;
  dialogueText: string;
  outcomeText: string;
  impactText: string;
}

export interface FarmingState {
  currentTurn: number; // 1 ~ 4턴
  remainingPoints: number; // 8 -> 0 (턴당 2포인트)
  metrics: PersonnelFarmingMetrics;
  logs: FarmingLogEntry[];
  bossVisitCount: Record<string, number>;
  initialProbabilities: SimulationProbabilities | null; // 인사 농사 전 확률
  backupWishes?: WishSelection; // 인사 농사 시작 직전의 희망 부서 원본 설정 (리셋 복원용)
}
