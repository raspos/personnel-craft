import {
  CareerRecord,
  WishSelection,
  SimulationProbabilities,
  FinalAppointmentResult,
  SuddenEvent,
  WishDeptConfig,
  FarmingState
} from '../types/game';
import { DEFAULT_DEPARTMENTS, getDepartmentByName } from '../data/departments';

export interface DeptScoreBreakdown {
  careerFit: number;          // 경력/전문성 적합도 (0 ~ 40)
  subFieldFit: number;        // 세부 취재 분야 매칭 보너스 (0 ~ 15)
  tenureFactor: number;       // 현 부서 근속에 따른 이동 압력 (0 ~ 20)
  toScore: number;            // 확정 TO 및 이동 가능성 (0 or 10 ~ 40)
  relationScore: number;      // 부서장 관계 & 온도 & 영입의사 (-20 ~ +40)
  farmingBonus: number;       // 인사 농사 (기사 성과, 밭 가꾸기, 인지도) 반영치 (-5 ~ +30)
  totalWeight: number;        // 합산 가중치
  isZeroTO: boolean;          // 확정 0명 여부 (긴급 결원 이벤트 시 해제)
  competitorPenalty: number;  // 경쟁률에 따른 감쇄 비율 (0.6 ~ 1.2)
}

// 연속된 동일 부서 블록들의 실질 근속 기간(개월) 계산
export function getConsecutiveTenureMonths(careers: CareerRecord[], targetDept: string): number {
  if (careers.length === 0) return 24;
  let months = 0;
  for (let i = careers.length - 1; i >= 0; i--) {
    if (careers[i].deptName === targetDept) {
      months += careers[i].periodMonths;
    } else {
      break; // 연속성이 끊기면 중단
    }
  }
  return months > 0 ? months : (careers[careers.length - 1]?.periodMonths || 24);
}

// 희망 부서와 내 과거 세부 분야(subFields)의 전문성 일치도 계산 (최대 15점)
function calculateSubFieldFit(careers: CareerRecord[], wishDeptName: string): number {
  const targetDef = getDepartmentByName(wishDeptName);
  if (!targetDef) return 0;

  const mySubFields = new Set<string>();
  careers.forEach(c => {
    c.subFields?.forEach(sf => mySubFields.add(sf.name));
  });

  let matchCount = 0;
  targetDef.subFields.forEach(tf => {
    if (mySubFields.has(tf)) matchCount++;
  });

  return Math.min(15, matchCount * 5); // 일치하는 세부 분야당 5점, 최대 15점
}

export function runSimulation(
  careers: CareerRecord[],
  wishes: WishSelection,
  activeEvent: SuddenEvent | null,
  simCount: number = 10000, // 호환성 유지용 (해석해 계산이므로 즉시 완료)
  farmingState?: FarmingState,
  explicitCurrentDept?: string
): {
  probabilities: SimulationProbabilities;
  breakdown: Record<string, DeptScoreBreakdown>;
  weights: Record<string, number>;
} {
  // 현재 부서 결정
  const currentDept = explicitCurrentDept || (careers.length > 0 ? careers[careers.length - 1].deptName : '사회부');
  // 연속 근무 개월수 계산 (동일 부서가 여러 블록으로 나뉘어 있어도 온전히 합산)
  const currentDeptMonths = getConsecutiveTenureMonths(careers, currentDept);

  // [신규] 1지망이 현 부서 잔류(현재 소속 부서)인 경우 판별
  const isFirstWishStay = wishes.first.deptName === currentDept;

  // 1. 현재 부서 이동 압력 (근속 2년 이상이면 이동 확률 증가, 1년 미만이면 잔류 압력 강함)
  let movePressure = 0.50;
  if (isFirstWishStay) {
    // 1지망으로 현 부서 잔류를 희망한 경우: 이동 압력이 대폭 감소하여 잔류 확률이 극대화됨
    movePressure = currentDeptMonths > 36 ? 0.30 : 0.15;
  } else if (currentDeptMonths <= 6) {
    movePressure = 0.20; // 6개월 이하: 잔류 압력 극대 (80% 잔류)
  } else if (currentDeptMonths <= 12) {
    movePressure = 0.35;
  } else if (currentDeptMonths <= 24) {
    movePressure = 0.55;
  } else if (currentDeptMonths <= 36) {
    movePressure = 0.75;
  } else {
    movePressure = 0.90; // 3년 이상 장기근속: 이동 압력 극대 (90% 이동)
  }

  // 현재 부서장의 이동 의사 반영 (영향력 강화)
  switch (wishes.currentBossIntent) {
    case '적극적으로 보내주려 한다':
      movePressure += 0.25;
      break;
    case '이동을 허용할 가능성이 높다':
      movePressure += 0.12;
      break;
    case '잔류를 원하는 분위기다':
      movePressure -= 0.22;
      break;
    case '반드시 남기려고 한다':
      movePressure -= 0.40;
      break;
    default:
      break;
  }

  // 인사 농사 지표 반영: 현재 부서 잔류 압력(stayPressure) 및 소문 과열
  if (farmingState) {
    const sp = farmingState.metrics.stayPressure;
    if (sp > 50) {
      movePressure -= (sp - 50) * 0.006;
    } else {
      movePressure += (50 - sp) * 0.005;
    }

    // 소문이 70점 이상으로 과열되면 사내 정치적 반발로 이동 압력 감소
    if (farmingState.metrics.rumorSpread >= 70) {
      movePressure -= 0.08;
    }
  }

  // 돌발 이벤트 반영
  if (activeEvent?.id === 'event_reorg') {
    movePressure += 0.25; // 조직개편: 대규모 순환
  } else if (activeEvent?.id === 'event_downsize') {
    movePressure -= 0.30; // 인사 최소화: 잔류 대폭 증가
  } else if (activeEvent?.id === 'event_senior_move') {
    movePressure -= 0.15; // 선배 대거 복귀: 내 자리 좁아짐
  }
  movePressure = Math.max(0.05, Math.min(0.95, movePressure));

  // 2. 부서별 가중치 평가 함수
  const evaluateDept = (
    wish: WishDeptConfig,
    wishRank: 1 | 2 | 3
  ): DeptScoreBreakdown => {
    // 2지망, 3지망이 '없음' (선택 안 함)인 경우: 가중치 0 처리 (완전 제외)
    if (!wish.deptName || wish.deptName === '없음' || wish.deptName === '선택 안 함') {
      return {
        careerFit: 0,
        subFieldFit: 0,
        tenureFactor: 0,
        toScore: 0,
        relationScore: 0,
        farmingBonus: 0,
        totalWeight: 0,
        isZeroTO: true,
        competitorPenalty: 1
      };
    }

    // 이벤트 보너스
    const eventTOBonus = (activeEvent?.affectedWish === wishRank) ? (activeEvent.toBonus || 0) : 0;
    let eventIntentBonus = (activeEvent?.affectedWish === wishRank) ? (activeEvent.intentBonus || 0) : 0;

    // 이벤트: 2지망 부장 교체설(event_boss_change) -> 기존 관계 변수 중립화
    const isBossNeutralized = (activeEvent?.id === 'event_boss_change' && wishRank === 2);

    // 이벤트: 인사 최소화(event_downsize) -> 전 부서 TO 압박
    const globalTODown = activeEvent?.id === 'event_downsize' ? -12 : 0;
    // 이벤트: 선배 대거 복귀(event_senior_move) -> 전 부서 경쟁 심화
    const seniorImpact = activeEvent?.id === 'event_senior_move' ? -8 : 0;

    // A. 확정 TO 및 긴급 결원 이벤트 모순 해결
    const hasEmergencyOpening = (activeEvent?.id === 'event_opening_1st' && wishRank === 1);
    const isZeroTO = wish.expectedTO === '0명' && !hasEmergencyOpening;

    let toScore = 15;
    if (isZeroTO) {
      toScore = 0;
    } else {
      if (hasEmergencyOpening && wish.expectedTO === '0명') {
        toScore = 18; // 긴급 결원으로 신설된 단독 공석
      } else {
        switch (wish.expectedTO) {
          case '1명': toScore = 12; break;
          case '2명': toScore = 22; break;
          case '3명': toScore = 32; break;
          case '4명 이상': toScore = 42; break;
          case '모름':
          default:
            toScore = 14;
            if (wish.longTermWorkers === '1명') toScore += 3;
            else if (wish.longTermWorkers === '2명') toScore += 7;
            else if (wish.longTermWorkers === '3명 이상') toScore += 12;
            break;
        }
      }
      toScore = Math.max(2, toScore + (eventTOBonus * 0.4) + globalTODown + seniorImpact);
    }

    // B. 경력 적합도 (Career Fit) & 세부 분야 전문성 매칭
    const pastWorked = careers.some(c => c.deptName === wish.deptName);
    let careerFit = 12;
    if (pastWorked) {
      careerFit += 8; // 이전 부서 재방문 친숙도
    }
    // 지망 순위 기본 가중치
    if (wishRank === 1) careerFit += 8;
    else if (wishRank === 2) careerFit += 4;
    else if (wishRank === 3) careerFit += 1;

    // 세부 분야 전문성 매칭 보너스 (최대 +15점)
    const subFieldFit = calculateSubFieldFit(careers, wish.deptName);

    // C. 근속 기간 요인
    const tenureFactor = Math.min(15, currentDeptMonths * 0.4);

    // D. 부서장 관계 변수 (영향력 대폭 확대: 사내정치의 현실감 체감)
    let relationScore = 0;
    if (wishes.applyBossRelation && !isBossNeutralized) {
      // 1) 관계 유형 (최대 +12 ~ -4)
      switch (wish.bossRelation) {
        case '과거 직속 부장·데스크': relationScore += 12; break;
        case '과거 같은 부서에서 근무한 동료': relationScore += 8; break;
        case '다른 부서에서 업무상 협업': relationScore += 5; break;
        case '대학 선후배': relationScore += 4; break;
        case '술자리 친구·사적 친분': relationScore += 4; break;
        case '인사만 하는 사이': relationScore += 1; break;
        case '얼굴만 아는 사이': relationScore += 0; break;
        case '안면이 전혀 없는 사이': relationScore -= 4; break;
        default: relationScore += 0; break;
      }

      // 2) 관계 온도 (최대 +10 ~ -12)
      switch (wish.relationTemp) {
        case '매우 좋은 관계': relationScore += 10; break;
        case '좋은 관계': relationScore += 6; break;
        case '보통': relationScore += 0; break;
        case '다소 껄끄러움': relationScore -= 6; break;
        case '좋지 않은 관계': relationScore -= 12; break;
        default: break;
      }

      // 3) 영입 의사 (가장 강력한 결정권: 최대 +20 ~ -15)
      switch (wish.recruitIntent) {
        case '직접 함께 일하자고 제안': relationScore += 20; break;
        case '긍정적 의사 표현': relationScore += 12; break;
        case '관심은 있어 보임': relationScore += 5; break;
        case '특별한 의사 표현 없음': relationScore += 0; break;
        case '부정적 반응': relationScore -= 15; break;
        case '전혀 모름': default: break;
      }

      relationScore = Math.max(-20, Math.min(40, relationScore + eventIntentBonus));
    }

    // E. 인사 농사 성과 및 행동의 실질적 가중치 반영
    let farmingBonus = 0;
    if (farmingState) {
      // 1) 기사 작성 실적 (articleScore: 0 ~ 100) -> careerFit에 직접 실적 가산! (최대 +15점)
      const articleBonus = Math.round((farmingState.metrics.articleScore / 100) * 15);
      farmingBonus += articleBonus;

      // 2) 밭갈기 새싹 단계 (sproutStage: 0 ~ 3) -> 해당 지망 부서에 정성 들인 결실 (단계당 +5점, 최대 +15점)
      const currentSprout = wishRank === 1 
        ? farmingState.metrics.sproutStage.first 
        : wishRank === 2 
        ? farmingState.metrics.sproutStage.second 
        : farmingState.metrics.sproutStage.third;
      farmingBonus += currentSprout * 5;

      // 3) 희망 부서 내 인지도 (지망별 완벽 분리 적용!) -> 해당 부서원들의 환영도 (최대 +10점)
      const rawAw = farmingState.metrics.deptAwareness;
      const targetAwareness = typeof rawAw === 'number'
        ? rawAw
        : (wishRank === 1 ? rawAw.first : wishRank === 2 ? rawAw.second : rawAw.third) || 0;
      const awarenessBonus = Math.round((targetAwareness / 100) * 10);
      farmingBonus += awarenessBonus;

      // 4) 희망 부서장 관심도 (지망별 완벽 분리 적용!) -> 해당 부서장의 영입 추진력 (최대 +10점)
      const rawBi = farmingState.metrics.bossInterest;
      const targetBossInterest = typeof rawBi === 'number'
        ? rawBi
        : (wishRank === 1 ? rawBi.first : wishRank === 2 ? rawBi.second : rawBi.third) || 0;
      const bossInterestBonus = Math.round((targetBossInterest / 100) * 10);
      farmingBonus += bossInterestBonus;

      // 5) 소문 확산도 (rumorSpread: 0 ~ 100)
      const rumor = farmingState.metrics.rumorSpread;
      if (rumor >= 30 && rumor <= 65) {
        farmingBonus += 4; // 적정 공론화 이득
      } else if (rumor > 70) {
        farmingBonus -= 6; // 과열 정치질 역풍
      }
    }

    // F. 실제 경쟁 기자 수 & TO 결합 경쟁 강도 배율 산출 (경쟁자 모델 현실화)
    let competitorPenalty = 1.0;
    const comp = wish.competitors || '모름';

    if (comp === '0명 (단독 지원)') {
      // 경쟁자 없음: TO가 1명이어도 무혈입성 우대
      competitorPenalty = wish.expectedTO === '1명' ? 1.25 : 1.35;
    } else if (comp === '1~2명 (보통)') {
      if (wish.expectedTO === '1명') competitorPenalty = 0.90;
      else if (wish.expectedTO === '2명') competitorPenalty = 1.05;
      else if (wish.expectedTO === '3명' || wish.expectedTO === '4명 이상') competitorPenalty = 1.20;
    } else if (comp === '3~4명 (경쟁 치열)') {
      if (wish.expectedTO === '1명') competitorPenalty = 0.65;
      else if (wish.expectedTO === '2명') competitorPenalty = 0.80;
      else if (wish.expectedTO === '3명' || wish.expectedTO === '4명 이상') competitorPenalty = 0.95;
    } else if (comp === '5명 이상 (바늘구멍)') {
      if (wish.expectedTO === '1명') competitorPenalty = 0.40;
      else if (wish.expectedTO === '2명') competitorPenalty = 0.55;
      else if (wish.expectedTO === '3명' || wish.expectedTO === '4명 이상') competitorPenalty = 0.70;
    } else {
      // '모름' 기본 휴리스틱 모델
      if (wish.expectedTO === '1명') competitorPenalty = 0.85;
      else if (wish.expectedTO === '3명' || wish.expectedTO === '4명 이상') competitorPenalty = 1.15;
    }

    // 최종 합산 가중치
    let totalWeight = 0;
    if (!isZeroTO) {
      const raw = careerFit + subFieldFit + tenureFactor + toScore + (wishes.applyBossRelation ? relationScore : 0) + farmingBonus;
      totalWeight = Math.max(1, Math.round(raw * competitorPenalty));
    }

    return {
      careerFit,
      subFieldFit,
      tenureFactor,
      toScore,
      relationScore,
      farmingBonus,
      totalWeight,
      isZeroTO,
      competitorPenalty
    };
  };

  const eval1 = evaluateDept(wishes.first, 1);
  const eval2 = evaluateDept(wishes.second, 2);
  const eval3 = evaluateDept(wishes.third, 3);

  // 기피 부서(avoid) 및 기타 부서(other) 가중치 (경력 및 상황에 따라 유동적)
  let avoidDeptWeight = 10;
  if (wishes.avoidDept) {
    // 만약 기피 부서에 과거 근무했거나, 선배 복귀 이벤트 발생 시 기피부서 유입 위험 증가
    const avoidWorked = careers.some(c => c.deptName === wishes.avoidDept);
    if (avoidWorked) avoidDeptWeight += 5;
    if (activeEvent?.id === 'event_senior_move') avoidDeptWeight += 6;
  }
  const otherDeptWeight = 16;

  const movePoolWeights = {
    first: eval1.totalWeight,
    second: eval2.totalWeight,
    third: eval3.totalWeight,
    avoid: avoidDeptWeight,
    other: otherDeptWeight
  };
  const totalMoveWeight = movePoolWeights.first + movePoolWeights.second + movePoolWeights.third + movePoolWeights.avoid + movePoolWeights.other;

  // 3. 닫힌 해 (Closed-Form Analytical Solution) 수학적 확률 계산
  // 난수 몬테카를로를 돌리지 않고, 이론적 확률을 오차 0%로 완벽하게 도출!
  let pFirst = 0;
  let pSecond = 0;
  let pThird = 0;
  let pAvoid = 0;
  let pOther = 0;

  if (isFirstWishStay) {
    // 1지망이 현 부서 잔류인 경우:
    // 잔류 확률(1 - movePressure)이 곧 1지망 달성 확률!
    const stayProb = Math.max(0, 1.0 - movePressure);
    pFirst = stayProb;
    const remainingMovePool = movePoolWeights.second + movePoolWeights.third + movePoolWeights.avoid + movePoolWeights.other;
    if (remainingMovePool > 0) {
      pSecond = eval2.isZeroTO ? 0 : movePressure * (movePoolWeights.second / remainingMovePool);
      pThird = eval3.isZeroTO ? 0 : movePressure * (movePoolWeights.third / remainingMovePool);
      pAvoid = movePressure * (movePoolWeights.avoid / remainingMovePool);
      pOther = movePressure * (movePoolWeights.other / remainingMovePool);
    }
  } else if (totalMoveWeight > 0) {
    pFirst = eval1.isZeroTO ? 0 : movePressure * (movePoolWeights.first / totalMoveWeight);
    pSecond = eval2.isZeroTO ? 0 : movePressure * (movePoolWeights.second / totalMoveWeight);
    pThird = eval3.isZeroTO ? 0 : movePressure * (movePoolWeights.third / totalMoveWeight);
    pAvoid = movePressure * (movePoolWeights.avoid / totalMoveWeight);
    pOther = movePressure * (movePoolWeights.other / totalMoveWeight);
  }

  // 잔류 확률: 전체 100%에서 이동 확률의 여사건
  const pStay = isFirstWishStay ? pFirst : Math.max(0, 1.0 - (pFirst + pSecond + pThird + pAvoid + pOther));

  // 퍼센트(%) 환산 및 소수점 첫째 자리 정규화 (합계 100.0% 보장)
  let pctFirst = Math.round(pFirst * 1000) / 10;
  let pctSecond = Math.round(pSecond * 1000) / 10;
  let pctThird = Math.round(pThird * 1000) / 10;
  let pctAvoid = Math.round(pAvoid * 1000) / 10;
  let pctStay = Math.round(pStay * 1000) / 10;
  
  if (eval1.isZeroTO && !isFirstWishStay) pctFirst = 0;
  if (eval2.isZeroTO) pctSecond = 0;
  if (eval3.isZeroTO) pctThird = 0;

  const sumWithoutOther = isFirstWishStay
    ? pctFirst + pctSecond + pctThird + pctAvoid
    : pctFirst + pctSecond + pctThird + pctAvoid + pctStay;
  const pctOther = Math.max(0, Math.round((100.0 - sumWithoutOther) * 10) / 10);
  const totalWish = isFirstWishStay
    ? pctFirst // 1지망 자체가 잔류이므로 1지망만으로도 압도적 희망 충족
    : Math.round((pctFirst + pctSecond + pctThird) * 10) / 10;

  const probabilities: SimulationProbabilities = {
    firstWish: pctFirst,
    secondWish: pctSecond,
    thirdWish: pctThird,
    avoidDept: pctAvoid,
    stayCurrent: pctStay,
    otherDept: pctOther,
    totalWish
  };

  return {
    probabilities,
    breakdown: {
      first: eval1,
      second: eval2,
      third: eval3
    },
    weights: movePoolWeights
  };
}

export function drawFinalAppointment(
  probabilities: SimulationProbabilities,
  wishes: WishSelection,
  currentDeptName: string
): FinalAppointmentResult {
  const rand = Math.random() * 100;
  let acc = 0;

  // 1지망
  acc += probabilities.firstWish;
  if (rand <= acc && probabilities.firstWish > 0) {
    const isFirstWishStay = wishes.first.deptName === currentDeptName;
    return {
      assignedDept: wishes.first.deptName,
      resultType: 'first',
      messageHeadline: isFirstWishStay ? '1지망 달성! 현 부서 잔류 확정' : '대망의 1지망 입성!',
      messageSubtitle: isFirstWishStay
        ? `기자님의 뜻대로 [${wishes.first.deptName}] 잔류가 최종 확정되었습니다.`
        : `축하합니다! ${wishes.first.deptName} 발령이 확정되었습니다.`,
      flavorQuote: isFirstWishStay
        ? '“자네가 남아줘서 천군만마를 얻었네. 지금 진행 중인 기획 취재에 전념해주게!”'
        : '가슴 깊이 품어왔던 취재 계획서를 드디어 데스크에 올릴 때가 왔습니다.',
      probabilities,
      animationAction: 'celebrate'
    };
  }

  // 2지망
  acc += probabilities.secondWish;
  if (rand <= acc && probabilities.secondWish > 0 && wishes.second.deptName && wishes.second.deptName !== '없음' && wishes.second.deptName !== '선택 안 함') {
    return {
      assignedDept: wishes.second.deptName,
      resultType: 'second',
      messageHeadline: '뜻밖의 기회! 2지망 발령',
      messageSubtitle: `${wishes.second.deptName}으로 배속되었습니다.`,
      flavorQuote: '1지망은 아니지만, 새로운 전문성과 취재 네트워크를 구축할 절호의 무대입니다.',
      probabilities,
      animationAction: 'celebrate'
    };
  }

  // 3지망
  acc += probabilities.thirdWish;
  if (rand <= acc && probabilities.thirdWish > 0 && wishes.third.deptName && wishes.third.deptName !== '없음' && wishes.third.deptName !== '선택 안 함') {
    return {
      assignedDept: wishes.third.deptName,
      resultType: 'third',
      messageHeadline: '선방했다! 3지망 안착',
      messageSubtitle: `${wishes.third.deptName} 배속 명단에 이름을 올렸습니다.`,
      flavorQuote: '치열했던 눈치싸움 끝에 희망 부서 턱걸이에 성공했습니다. 이제 실력으로 보여줄 때입니다.',
      probabilities,
      animationAction: 'celebrate'
    };
  }

  // 기피 부서
  acc += probabilities.avoidDept;
  if (rand <= acc && wishes.avoidDept) {
    return {
      assignedDept: wishes.avoidDept,
      resultType: 'avoid',
      messageHeadline: '비상! 기피 부서 전격 발령',
      messageSubtitle: `피하고 싶었던 [${wishes.avoidDept}] 발령 명단에 적혔습니다...`,
      flavorQuote: '편집국의 인사 폭풍은 언제나 예측을 비껴갑니다. 굵고 긴 생존 게임이 시작됩니다.',
      probabilities,
      animationAction: 'frustrated'
    };
  }

  // 현 부서 잔류
  acc += probabilities.stayCurrent;
  if (rand <= acc) {
    return {
      assignedDept: currentDeptName,
      resultType: 'stay',
      messageHeadline: '자리 이동 없음 (현 부서 잔류)',
      messageSubtitle: `이번 인사에서도 [${currentDeptName}]을(를) 굳건히 지킵니다.`,
      flavorQuote: '올해도 같은 책상에서 뵙겠습니다. "선배, 다음 인사 땐 진짜 보내주시는 거죠?"',
      probabilities,
      animationAction: 'stay_desk'
    };
  }

  // 기타 부서
  const excluded = new Set([
    wishes.first.deptName,
    wishes.second.deptName,
    wishes.third.deptName,
    wishes.avoidDept,
    currentDeptName
  ]);
  excluded.delete('없음');
  excluded.delete('선택 안 함');
  const candidates = DEFAULT_DEPARTMENTS.filter(d => !excluded.has(d.name)).map(d => d.name);
  const alternativeDept = candidates.length > 0
    ? candidates[Math.floor(Math.random() * candidates.length)]
    : '문화부';
  return {
    assignedDept: alternativeDept,
    resultType: 'other',
    messageHeadline: '인사위원회의 반전 카드!',
    messageSubtitle: `예상치 못한 [${alternativeDept}]으로 깜짝 전격 배치되었습니다.`,
    flavorQuote: '인생은 기사처럼 계획대로 써지지 않는 법. 새로운 미지의 영역을 개척합니다.',
    probabilities,
    animationAction: 'stay_desk'
  };
}
