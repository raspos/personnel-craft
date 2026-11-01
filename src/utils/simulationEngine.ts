import {
  CareerRecord,
  WishSelection,
  SimulationProbabilities,
  FinalAppointmentResult,
  SuddenEvent,
  WishDeptConfig
} from '../types/game';
import { DEFAULT_DEPARTMENTS } from '../data/departments';

interface DeptScoreBreakdown {
  careerFit: number;      // 경력/전문성 적합도 (0 ~ 40)
  tenureFactor: number;   // 현 부서 근속에 따른 이동 압력 (0 ~ 20)
  toScore: number;        // 확정 TO 및 이동 가능성 (0 or 10 ~ 30)
  relationScore: number;  // 부서장 관계 & 온도 & 영입의사 (0 ~ 30)
  totalWeight: number;    // 합산 가중치
  isZeroTO: boolean;      // 확정 0명 여부
}

export function runSimulation(
  careers: CareerRecord[],
  wishes: WishSelection,
  activeEvent: SuddenEvent | null,
  simCount: number = 10000
): {
  probabilities: SimulationProbabilities;
  breakdown: Record<string, DeptScoreBreakdown>;
  weights: Record<string, number>;
} {
  const currentDept = careers.length > 0 ? careers[careers.length - 1].deptName : '사회부';
  const currentDeptMonths = careers.length > 0 ? careers[careers.length - 1].periodMonths : 24;
  const totalMonths = careers.reduce((sum, c) => sum + c.periodMonths, 0);

  // 1. 현재 부서 이동 압력 (근속 2년 이상이면 이동 확률 증가, 1년 미만이면 잔류 압력 강함)
  let movePressure = 0.5; // 기본 50%
  if (currentDeptMonths <= 12) {
    movePressure = 0.25;
  } else if (currentDeptMonths <= 24) {
    movePressure = 0.55;
  } else if (currentDeptMonths <= 36) {
    movePressure = 0.75;
  } else {
    movePressure = 0.88;
  }

  // 현재 부서장의 이동 의사 반영
  switch (wishes.currentBossIntent) {
    case '적극적으로 보내주려 한다':
      movePressure += 0.25;
      break;
    case '이동을 허용할 가능성이 높다':
      movePressure += 0.12;
      break;
    case '잔류를 원하는 분위기다':
      movePressure -= 0.20;
      break;
    case '반드시 남기려고 한다':
      movePressure -= 0.38;
      break;
    default:
      break;
  }
  // 돌발 이벤트 반영 (조직개편 등)
  if (activeEvent?.id === 'event_reorg') {
    movePressure += 0.20;
  } else if (activeEvent?.id === 'event_downsize') {
    movePressure -= 0.25;
  }
  movePressure = Math.max(0.1, Math.min(0.95, movePressure));

  // 2. 부서별 가중치 계산 함수
  const evaluateDept = (
    wish: WishDeptConfig,
    wishRank: 1 | 2 | 3
  ): DeptScoreBreakdown => {
    // A. 확정 TO 확인
    const isZeroTO = wish.expectedTO === '0명';

    // 이벤트 보너스
    const eventTOBonus = (activeEvent?.affectedWish === wishRank) ? (activeEvent.toBonus || 0) : 0;
    const eventIntentBonus = (activeEvent?.affectedWish === wishRank) ? (activeEvent.intentBonus || 0) : 0;

    let toScore = 15;
    if (isZeroTO) {
      toScore = 0;
    } else {
      switch (wish.expectedTO) {
        case '1명': toScore = 15; break;
        case '2명': toScore = 22; break;
        case '3명': toScore = 28; break;
        case '4명 이상': toScore = 32; break;
        case '모름':
        default:
          toScore = 14;
          // TO를 모를 때 장기근무자 유동성 반영 (확정 TO가 아닐 때만 참조)
          if (wish.longTermWorkers === '1명') toScore += 3;
          else if (wish.longTermWorkers === '2명') toScore += 6;
          else if (wish.longTermWorkers === '3명 이상') toScore += 9;
          break;
      }
      toScore = Math.max(0, toScore + (eventTOBonus * 0.3));
    }

    // B. 경력 적합도 (Career Fit)
    // 과거 근무 이력이나 세부 취재 분야와 연관성
    const pastWorked = careers.some(c => c.deptName === wish.deptName);
    let careerFit = 18; // 기본 베이스
    if (pastWorked) {
      careerFit += 8; // 이전 부서 재방문 친숙도
    }
    // 지망 우선순위 베이스
    if (wishRank === 1) careerFit += 8;
    else if (wishRank === 2) careerFit += 4;
    else if (wishRank === 3) careerFit += 1;

    // C. 근속 기간 요인
    const tenureFactor = Math.min(15, currentDeptMonths * 0.4);

    // D. 부서장 관계 변수 (토글 ON 시에만 적용)
    let relationScore = 0;
    if (wishes.applyBossRelation) {
      // 1) 관계 유형
      switch (wish.bossRelation) {
        case '과거 직속 부장·데스크': relationScore += 8; break;
        case '과거 같은 부서에서 근무한 동료': relationScore += 6; break;
        case '다른 부서에서 업무상 협업': relationScore += 4; break;
        case '대학 선후배': relationScore += 3; break; // 사적 요소
        case '술자리 친구·사적 친분': relationScore += 3; break;
        case '인사만 하는 사이': relationScore += 1; break;
        case '얼굴만 아는 사이': relationScore += 0; break;
        case '안면이 전혀 없는 사이': relationScore -= 2; break;
        default: relationScore += 0; break;
      }

      // 2) 관계 온도
      switch (wish.relationTemp) {
        case '매우 좋은 관계': relationScore += 7; break;
        case '좋은 관계': relationScore += 4; break;
        case '보통': relationScore += 1; break;
        case '다소 껄끄러움': relationScore -= 4; break;
        case '좋지 않은 관계': relationScore -= 8; break;
        default: break;
      }

      // 3) 영입 의사 (가장 강력한 관계 변수)
      switch (wish.recruitIntent) {
        case '직접 함께 일하자고 제안': relationScore += 14; break;
        case '긍정적 의사 표현': relationScore += 8; break;
        case '관심은 있어 보임': relationScore += 3; break;
        case '특별한 의사 표현 없음': relationScore += 0; break;
        case '부정적 반응': relationScore -= 10; break;
        case '전혀 모름': default: break;
      }

      relationScore = Math.max(-10, Math.min(30, relationScore + eventIntentBonus));
    }

    // 만약 확정 TO가 0명이라면 전체 가중치는 무조건 0!
    let totalWeight = 0;
    if (!isZeroTO) {
      totalWeight = Math.max(1, careerFit + tenureFactor + toScore + (wishes.applyBossRelation ? relationScore : 0));
    }

    return {
      careerFit,
      tenureFactor,
      toScore,
      relationScore,
      totalWeight,
      isZeroTO
    };
  };

  const eval1 = evaluateDept(wishes.first, 1);
  const eval2 = evaluateDept(wishes.second, 2);
  const eval3 = evaluateDept(wishes.third, 3);

  // 기피 부서 가중치: 기피 부서는 희망 부서가 아니므로 별도 비희망 풀에서 산정
  // 만약 기피 부서가 TO가 많거나 기피 부서 특유의 밀림 현상 반영
  const avoidDeptWeight = 12; // 기피부서 기본 유입 위험도
  const otherDeptWeight = 20; // 기타 일반 부서 이동 가중치

  // 3. 몬테카를로 10,000회 시뮬레이션
  const resultsCount = {
    first: 0,
    second: 0,
    third: 0,
    avoid: 0,
    other: 0,
    stay: 0
  };

  const movePoolWeights = {
    first: eval1.totalWeight,
    second: eval2.totalWeight,
    third: eval3.totalWeight,
    avoid: avoidDeptWeight,
    other: otherDeptWeight
  };
  const totalMoveWeight = movePoolWeights.first + movePoolWeights.second + movePoolWeights.third + movePoolWeights.avoid + movePoolWeights.other;

  for (let i = 0; i < simCount; i++) {
    // 먼저 이동할 것인가, 현 부서에 잔류할 것인가 주사위
    const isMoving = Math.random() < movePressure;

    if (!isMoving) {
      resultsCount.stay++;
    } else {
      // 이동 풀에서 확률 배분
      const pick = Math.random() * totalMoveWeight;
      let acc = 0;

      acc += movePoolWeights.first;
      if (pick <= acc && !eval1.isZeroTO) {
        resultsCount.first++;
        continue;
      }

      acc += movePoolWeights.second;
      if (pick <= acc && !eval2.isZeroTO) {
        resultsCount.second++;
        continue;
      }

      acc += movePoolWeights.third;
      if (pick <= acc && !eval3.isZeroTO) {
        resultsCount.third++;
        continue;
      }

      acc += movePoolWeights.avoid;
      if (pick <= acc) {
        resultsCount.avoid++;
        continue;
      }

      resultsCount.other++;
    }
  }

  // 4. 엄격한 정규화 (합계 100.0%)
  // TO 0명인 부서는 무조건 0% 보장
  if (eval1.isZeroTO) resultsCount.first = 0;
  if (eval2.isZeroTO) resultsCount.second = 0;
  if (eval3.isZeroTO) resultsCount.third = 0;

  const currentTotal = resultsCount.first + resultsCount.second + resultsCount.third + resultsCount.avoid + resultsCount.other + resultsCount.stay;

  const pFirst = Math.round((resultsCount.first / currentTotal) * 1000) / 10;
  const pSecond = Math.round((resultsCount.second / currentTotal) * 1000) / 10;
  const pThird = Math.round((resultsCount.third / currentTotal) * 1000) / 10;
  const pAvoid = Math.round((resultsCount.avoid / currentTotal) * 1000) / 10;
  const pStay = Math.round((resultsCount.stay / currentTotal) * 1000) / 10;
  
  // 반올림 오차 보정으로 완벽한 100.0% 맞춤 (기타 부서에 차액 보정)
  const sumWithoutOther = pFirst + pSecond + pThird + pAvoid + pStay;
  const pOther = Math.max(0, Math.round((100 - sumWithoutOther) * 10) / 10);
  const totalWish = Math.round((pFirst + pSecond + pThird) * 10) / 10;

  const probabilities: SimulationProbabilities = {
    firstWish: pFirst,
    secondWish: pSecond,
    thirdWish: pThird,
    avoidDept: pAvoid,
    stayCurrent: pStay,
    otherDept: pOther,
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
    return {
      assignedDept: wishes.first.deptName,
      resultType: 'first',
      messageHeadline: '대망의 1지망 입성!',
      messageSubtitle: `축하합니다! ${wishes.first.deptName} 발령이 확정되었습니다.`,
      flavorQuote: '가슴 깊이 품어왔던 취재 계획서를 드디어 데스크에 올릴 때가 왔습니다.',
      probabilities,
      animationAction: 'celebrate'
    };
  }

  // 2지망
  acc += probabilities.secondWish;
  if (rand <= acc && probabilities.secondWish > 0) {
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
  if (rand <= acc && probabilities.thirdWish > 0) {
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

  // 기피 부서 (좌절 연출)
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

  // 기타 부서 (1, 2, 3지망, 기피부서, 현재부서를 제외한 부서들 중 무작위 배치)
  const excluded = new Set([
    wishes.first.deptName,
    wishes.second.deptName,
    wishes.third.deptName,
    wishes.avoidDept,
    currentDeptName
  ]);
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
