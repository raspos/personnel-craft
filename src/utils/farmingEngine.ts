import {
  WishSelection,
  FarmingState,
  FarmingActionType,
  FarmingLogEntry,
  WishDeptConfig,
  BossRecruitIntent,
  CurrentBossIntent
} from '../types/game';

export interface ActionExecutionResult {
  nextState: FarmingState;
  updatedWishes: WishSelection;
  log: FarmingLogEntry;
  popupDialogue?: {
    speaker: string;
    text: string;
    note?: string;
  };
}

export function executeFarmingAction(
  currentState: FarmingState,
  currentWishes: WishSelection,
  actionType: FarmingActionType,
  targetWishIndex: 1 | 2 | 3 = 1,
  currentHalf: '상반기' | '하반기' = '하반기',
  currentDeptName: string = '사회부',
  currentDeptMonths: number = 24
): ActionExecutionResult {
  const weekName = currentHalf === '하반기'
    ? `추석 이후 ${currentState.currentTurn}주 차`
    : `상반기 인사 준비 ${currentState.currentTurn}주 차`;

  const updatedState: FarmingState = JSON.parse(JSON.stringify(currentState));
  const updatedWishes: WishSelection = JSON.parse(JSON.stringify(currentWishes));

  const targetKey: 'first' | 'second' | 'third' = targetWishIndex === 1
    ? 'first'
    : targetWishIndex === 2
    ? 'second'
    : 'third';

  // metrics 호환성 방어 (구버전 숫자형 객체 안전 변환)
  if (typeof updatedState.metrics.bossInterest === 'number') {
    const v = updatedState.metrics.bossInterest;
    updatedState.metrics.bossInterest = { first: v, second: 0, third: 0 };
  }
  if (typeof updatedState.metrics.deptAwareness === 'number') {
    const v = updatedState.metrics.deptAwareness;
    updatedState.metrics.deptAwareness = { first: v, second: 0, third: 0 };
  }

  let targetWish: WishDeptConfig = targetWishIndex === 1
    ? updatedWishes.first
    : targetWishIndex === 2
    ? updatedWishes.second
    : updatedWishes.third;

  let actionTitle = '';
  let targetDept = targetWish.deptName;
  let dialogueText = '';
  let outcomeText = '';
  let impactText = '';
  let popupDialogue: { speaker: string; text: string; note?: string } | undefined;

  switch (actionType) {
    case 'meet_boss': {
      actionTitle = `${targetWish.deptName} 부서장 면담 (${targetWishIndex}지망)`;
      const visits = (updatedState.bossVisitCount[targetWish.deptName] || 0) + 1;
      updatedState.bossVisitCount[targetWish.deptName] = visits;

      if (visits === 1) {
        if (targetWish.bossRelation === '과거 직속 부장·데스크') {
          dialogueText = '자네가 어떤 기자인지 내가 가장 잘 알지. 우리 부서에 오고 싶다면 국장단 회의 때 적극적으로 이야기해보겠네.';
        } else if (targetWish.bossRelation === '대학 선후배' || targetWish.bossRelation === '술자리 친구·사적 친분') {
          dialogueText = '자네가 오면 일이야 재밌겠지만, 인사는 또 다른 문제라… 그래도 뜻이 있다면 내가 관심 있게 지켜볼게.';
        } else if (targetWish.bossRelation === '안면이 전혀 없는 사이') {
          dialogueText = '어떤 기사를 주로 쓰셨는지 포트폴리오를 한번 훑어봤습니다. 우리 부서에서도 충분히 역량을 발휘할 수 있겠네요.';
        } else {
          dialogueText = '우리 부서에 지원하고 싶다고? 자네 경력이면 충분히 경쟁력이 있지. 고민해보겠네.';
        }

        // 오직 해당 지망 부서의 관심도 및 인지도만 상승!
        updatedState.metrics.bossInterest[targetKey] = Math.min(100, updatedState.metrics.bossInterest[targetKey] + 25);
        updatedState.metrics.deptAwareness[targetKey] = Math.min(100, updatedState.metrics.deptAwareness[targetKey] + 15);
        outcomeText = `${targetWish.deptName} 부서장이 긍정적인 관심을 표명했습니다.`;
        impactText = `[${targetWishIndex}지망] 부서장 관심도 +25P, 영입 의사 신호 강화`;

        if (targetWish.recruitIntent === '특별한 의사 표현 없음' || targetWish.recruitIntent === '전혀 모름') {
          targetWish.recruitIntent = '관심은 있어 보임';
        } else if (targetWish.recruitIntent === '관심은 있어 보임') {
          targetWish.recruitIntent = '긍정적 의사 표현';
        }

        if (targetWishIndex === 1) updatedState.metrics.sproutStage.first = Math.min(3, updatedState.metrics.sproutStage.first + 1);
        else if (targetWishIndex === 2) updatedState.metrics.sproutStage.second = Math.min(3, updatedState.metrics.sproutStage.second + 1);
        else updatedState.metrics.sproutStage.third = Math.min(3, updatedState.metrics.sproutStage.third + 1);

      } else if (visits === 2) {
        dialogueText = '자네 뜻은 확실히 알았으니 너무 보채진 말게. 편집국 전체 순환 판을 봐야 하니까.';
        updatedState.metrics.bossInterest[targetKey] = Math.min(100, updatedState.metrics.bossInterest[targetKey] + 15);
        // 연속 방문 부작용: 소문이 돌아 현재 부서장의 잔류 압박 발생
        updatedState.metrics.stayPressure = Math.min(100, updatedState.metrics.stayPressure + 10);
        outcomeText = `${targetWish.deptName} 부서장에게 확실한 인상을 남겼으나, 잦은 접촉이 현 부서장 귀에 들어갔습니다.`;
        impactText = `[${targetWishIndex}지망] 부서장 관심도 +15P (직접 영입 확보), 현 부서 잔류 압력 +10P`;

        if (targetWish.recruitIntent === '긍정적 의사 표현' || targetWish.recruitIntent === '관심은 있어 보임') {
          targetWish.recruitIntent = '직접 함께 일하자고 제안';
        }
      } else {
        dialogueText = '자네 열정은 알겠는데, 자꾸 찾아오면 다른 데스크들 눈치도 보이고 오히려 곤란해져.';
        updatedState.metrics.bossInterest[targetKey] = Math.max(0, updatedState.metrics.bossInterest[targetKey] - 20);
        updatedState.metrics.stayPressure = Math.min(100, updatedState.metrics.stayPressure + 20);
        outcomeText = '지나치게 잦은 방문으로 부서장이 부담을 느끼며, 현 부서장의 잔류 압박이 커졌습니다.';
        impactText = `[${targetWishIndex}지망] 부서장 관심도 -20P, 현 부서 잔류 압력 +20P (역풍 발생)`;
      }

      popupDialogue = {
        speaker: `${targetWish.deptName} 부서장`,
        text: dialogueText,
        note: '가상 인사 면담 대화'
      };
      break;
    }

    case 'meet_peer': {
      actionTitle = `${targetWish.deptName} 동료 기자 티타임 (${targetWishIndex}지망)`;
      dialogueText = '우리 부서에 2~3년 넘게 근무한 선배가 있어서 이번에 움직일 가능성이 높아 보여. 부장님한테 자네 이야기 좋게 귀띔해둘게!';
      // 해당 지망의 인지도 대폭 상승 & 부서장 관심도 연계
      updatedState.metrics.deptAwareness[targetKey] = Math.min(100, updatedState.metrics.deptAwareness[targetKey] + 30);
      updatedState.metrics.bossInterest[targetKey] = Math.min(100, updatedState.metrics.bossInterest[targetKey] + 10);
      updatedState.metrics.infoConfidence = Math.min(100, updatedState.metrics.infoConfidence + 20);
      outcomeText = `${targetWish.deptName} 내부 분위기와 고급 이동 정보를 획득하고 내부 추천을 확보했습니다.`;
      impactText = `[${targetWishIndex}지망] 부서 내 인지도 +30P, 부서장 관심도 +10P, 정보 신뢰도 +20P`;

      popupDialogue = {
        speaker: `${targetWish.deptName} 출입 동료 기자`,
        text: dialogueText,
        note: '편집국 카페테리아 대화'
      };
      break;
    }

    case 'spread_rumor': {
      actionTitle = `${targetWish.deptName} 지망 소문 흘리기 (${targetWishIndex}지망)`;
      // 정보 신뢰도(infoConfidence)가 높을수록 소문 성공 확률 증가!
      const successChance = 0.55 + ((updatedState.metrics.infoConfidence / 100) * 0.35);
      const isSuccess = Math.random() < successChance;

      if (isSuccess) {
        dialogueText = `김기자가 이번에 ${targetWish.deptName} 가고 싶어 한다는 얘기가 데스크 라인까지 돌던데? 부장님도 귀담아듣는 눈치야.`;
        updatedState.metrics.rumorSpread = Math.min(100, updatedState.metrics.rumorSpread + 20);
        updatedState.metrics.deptAwareness[targetKey] = Math.min(100, updatedState.metrics.deptAwareness[targetKey] + 25);
        outcomeText = `이동 희망 소문이 편집국에 성공적으로 퍼져 영입 의사가 강화되었습니다.`;
        impactText = `소문 확산도 +20P, [${targetWishIndex}지망] 인지도 +25P 및 영입 의사 상향!`;

        // 영입 의사 실질적 상향 (확률에 직접 반영!)
        if (targetWish.recruitIntent === '특별한 의사 표현 없음' || targetWish.recruitIntent === '전혀 모름') {
          targetWish.recruitIntent = '관심은 있어 보임';
        } else if (targetWish.recruitIntent === '관심은 있어 보임') {
          targetWish.recruitIntent = '긍정적 의사 표현';
        } else if (targetWish.recruitIntent === '긍정적 의사 표현') {
          targetWish.recruitIntent = '직접 함께 일하자고 제안';
        }
      } else {
        dialogueText = '자네… 요즘 밖에서 우리 부서 일 소홀히 한다는 말이 돌던데, 맡은 출입처 마감에 더 신경 쓰게.';
        updatedState.metrics.rumorSpread = Math.min(100, updatedState.metrics.rumorSpread + 15);
        // 실패 시 패널티를 현실적 수준(+8P)으로 대폭 완화! (무조건 손해나는 덫 제거)
        updatedState.metrics.stayPressure = Math.min(100, updatedState.metrics.stayPressure + 8);
        outcomeText = '소문이 헛돌아 현재 부서장에게 주의를 받았습니다 (경미한 잔류 압력 증가).';
        impactText = '소문 확산도 +15P, 현 부서 잔류 압력 +8P';
      }

      popupDialogue = {
        speaker: isSuccess ? '동기 기자' : `현재 ${currentDeptName} 부서장`,
        text: dialogueText,
        note: '편집국 복도 소문 확산'
      };
      break;
    }

    case 'explore_board': {
      actionTitle = '휴게실 인사판 탐색 & 정세 분석';
      dialogueText = '이번 인사는 국장단 교체설이 있어서 몇몇 부서에서 연쇄 도미노가 생길 거라더군. 각 부서별 결원 사정을 꼼꼼히 파악해두게.';
      updatedState.metrics.infoConfidence = Math.min(100, updatedState.metrics.infoConfidence + 30);
      // 휴게실 정보 수집으로 모든 희망 부서의 판세를 읽어 골고루 관심도/인지도 상승!
      updatedState.metrics.bossInterest.first = Math.min(100, updatedState.metrics.bossInterest.first + 8);
      updatedState.metrics.bossInterest.second = Math.min(100, updatedState.metrics.bossInterest.second + 8);
      updatedState.metrics.bossInterest.third = Math.min(100, updatedState.metrics.bossInterest.third + 8);
      outcomeText = '편집국 전반의 인사 도미노 및 각 부서별 정세를 꿰뚫어 모든 희망 부서에 대한 전략을 확보했습니다.';
      impactText = '인사 정보 신뢰도 +30P, 모든 희망 부서 관심도 +8P 동시 상승!';

      popupDialogue = {
        speaker: '편집국 휴게실 선배 기자',
        text: dialogueText,
        note: '휴게실 커피 머신 앞'
      };
      break;
    }

    case 'meet_cur_boss': {
      actionTitle = `현재 ${currentDeptName} 부서장과 속내 탐색 및 면담`;

      // 무조건 '보내준다'로 바뀌는 치트키 제거!
      // 3단계의 기존 부장 의사 및 근속 기간에 따라 확률적으로 본심을 확인하고 설득을 시도
      const curIntent = updatedWishes.currentBossIntent;
      const randVal = Math.random();

      if (currentDeptMonths <= 12) {
        // 근속 1년 미만: 현실적으로 거의 무조건 만류
        dialogueText = '자네 우리 부서 온 지 아직 1년도 안 됐잖아. 지금 가면 일 배우다 마는 거야. 이번엔 잔류해서 팀 중심을 잡아주게.';
        updatedState.metrics.stayPressure = Math.min(100, updatedState.metrics.stayPressure + 10);
        outcomeText = '근속 기간이 짧아 현재 부서장이 완강하게 잔류를 요청합니다.';
        impactText = '현 부서 잔류 압력 +10P (현재 부서장의 잔류 의지 확인)';
      } else if (curIntent === '반드시 남기려고 한다') {
        if (randVal < 0.20) {
          dialogueText = '자네 뜻이 정 그렇다면… 국장한테 사정은 이야기해보겠지만 큰 기대는 말게.';
          updatedState.metrics.stayPressure = Math.max(0, updatedState.metrics.stayPressure - 8);
          updatedWishes.currentBossIntent = '잔류를 원하는 분위기다';
          outcomeText = '간곡한 설득 끝에 부서장의 태도가 아주 조금 누그러졌습니다.';
          impactText = '현 부서 잔류 압력 -8P, 방출 의사 소폭 개선';
        } else {
          dialogueText = '자네가 빠지면 우리 팀 기획이 올스톱이야. 이번엔 절대 못 보내주니 그렇게 알게.';
          updatedState.metrics.stayPressure = Math.min(100, updatedState.metrics.stayPressure + 10);
          outcomeText = '부서장의 철통 방어 의지를 재확인했습니다.';
          impactText = '현 부서 잔류 압력 +10P (강경한 잔류 의지 유지)';
        }
      } else if (curIntent === '잔류를 원하는 분위기다') {
        if (randVal < 0.45) {
          dialogueText = '고생한 건 아는데… 그래도 후배 길을 마냥 막을 순 없지. 국장단 회의 때 눈치껏 이야기해보겠네.';
          updatedState.metrics.stayPressure = Math.max(0, updatedState.metrics.stayPressure - 10);
          updatedWishes.currentBossIntent = '이동을 허용할 가능성이 높다';
          outcomeText = '진솔한 면담 끝에 부서장이 이동을 허용하는 쪽으로 마음을 돌렸습니다.';
          impactText = '현 부서 잔류 압력 -10P, 이동 허용 분위기 전환!';
        } else {
          dialogueText = '이번엔 인력 수급이 워낙 빠듯해서 자네가 한 번만 더 뛰어줘야겠어. 다음엔 꼭 길 열어줄게.';
          updatedState.metrics.stayPressure = Math.min(100, updatedState.metrics.stayPressure + 5);
          outcomeText = '부서 사정으로 인해 현재 부서장이 이번 인사는 잔류해줄 것을 당부했습니다.';
          impactText = '현 부서 잔류 압력 +5P';
        }
      } else if (curIntent === '잘 모르겠다') {
        if (randVal < 0.60) {
          dialogueText = '자네가 다른 부서 지원하고 싶다고? 2년 넘었으니 이동할 때가 되긴 했지. 적극 밀어주겠네.';
          updatedState.metrics.stayPressure = Math.max(0, updatedState.metrics.stayPressure - 12);
          updatedWishes.currentBossIntent = '이동을 허용할 가능성이 높다';
          outcomeText = '부서장의 본심을 확인한 결과, 호의적으로 길을 터주겠다는 약속을 받았습니다.';
          impactText = '현 부서 잔류 압력 -12P, 이동 허용 확보';
        } else {
          dialogueText = '글쎄, 편집국 전체 판이 어떻게 돌아갈지 나도 아직 몰라. 일단 인사위원회 결과를 지켜보자고.';
          updatedState.metrics.stayPressure = Math.max(0, updatedState.metrics.stayPressure - 4);
          outcomeText = '부서장이 신중한 태도를 유지하며 중립적 의사를 표명했습니다.';
          impactText = '현 부서 잔류 압력 -4P (완만한 완화)';
        }
      } else {
        // 이미 긍정적 / 적극적 상태: 훈훈한 격려
        dialogueText = '자네는 어디 가서도 잘할 기자야. 국장한테 내가 힘닿는 데까지 강력하게 추천해둘게.';
        updatedState.metrics.stayPressure = Math.max(0, updatedState.metrics.stayPressure - 10);
        updatedWishes.currentBossIntent = '적극적으로 보내주려 한다';
        outcomeText = '현재 부서장의 든든한 지지와 추천을 재확인했습니다.';
        impactText = '현 부서 잔류 압력 -10P, 적극 이동 추천 유지';
      }

      popupDialogue = {
        speaker: `현재 ${currentDeptName} 부서장`,
        text: dialogueText,
        note: '부장실 1:1 속내 면담'
      };
      break;
    }

    case 'write_article': {
      actionTitle = '인사 농사 대신 묵묵히 특종 기사 집필';
      updatedState.metrics.articleScore = Math.min(100, updatedState.metrics.articleScore + 25);
      // 실력파 기자 스토리 연계: 1지망 부서장의 관심도 함께 상승!
      updatedState.metrics.bossInterest.first = Math.min(100, updatedState.metrics.bossInterest.first + 10);

      const score = updatedState.metrics.articleScore;
      if (score >= 50) {
        dialogueText = '[데스크 단체방 공지] 이번 심층 기획 단독기사가 포털 메인에 대서특필되었습니다! 1지망 부서장도 "우리 쪽에 이런 실력자가 꼭 필요하다"며 적극적인 호감을 표시했습니다.';
      } else {
        dialogueText = '[데스크 단체방 공지] 정기인사 앞두고 다들 어수선한데, 묵묵히 취재에 집중하여 굵직한 기사를 완성했습니다. 간부진의 신망이 두터워졌습니다.';
      }

      outcomeText = '정치적 줄대기 대신 고품질 특종을 완성하여 편집국 간부진과 1지망 부서장의 강력한 신뢰를 획득했습니다.';
      impactText = '기사 작성 성과 +25P (실무 적합도 보너스 최대 +26P), 1지망 부서장 관심도 +10P 연계!';

      popupDialogue = {
        speaker: '편집국 데스크 단체 메신저',
        text: dialogueText,
        note: '특종 보도 성과 인정'
      };
      break;
    }

    case 'do_nothing':
    default: {
      actionTitle = '인사에 연연하지 않고 평소처럼 근무';
      dialogueText = '인사 농사는 사람이 짓지만 결과는 하늘(편집국장)이 정하는 법. 평정심을 유지합니다.';
      outcomeText = '어떠한 소문이나 인위적 개입 없이 담담하게 정기인사를 기다립니다.';
      impactText = '상태 변화 없음 (기존 경력과 TO 중심 유지)';

      popupDialogue = {
        speaker: '나의 다짐',
        text: dialogueText,
        note: '평정심 유지'
      };
      break;
    }
  }

  // 행동 포인트 차감 (8 -> 0)
  updatedState.remainingPoints = Math.max(0, updatedState.remainingPoints - 1);

  // 2포인트마다 턴(주차) 증가 (총 4턴)
  const pointsUsed = 8 - updatedState.remainingPoints;
  updatedState.currentTurn = Math.min(4, Math.floor(pointsUsed / 2) + 1);

  // 일지 기록
  const log: FarmingLogEntry = {
    turn: currentState.currentTurn,
    weekName,
    actionType,
    actionTitle,
    targetDept,
    dialogueText,
    outcomeText,
    impactText
  };
  updatedState.logs.unshift(log);

  return {
    nextState: updatedState,
    updatedWishes,
    log,
    popupDialogue
  };
}
