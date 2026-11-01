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
      actionTitle = `${targetWish.deptName} 부서장 면담`;
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

        updatedState.metrics.bossInterest = Math.min(100, updatedState.metrics.bossInterest + 20);
        updatedState.metrics.deptAwareness = Math.min(100, updatedState.metrics.deptAwareness + 15);
        outcomeText = `${targetWish.deptName} 부서장이 긍정적인 관심을 표명했습니다.`;
        impactText = '부서장 관심도 +20P, 영입 의사 신호 강화';

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
        updatedState.metrics.bossInterest = Math.min(100, updatedState.metrics.bossInterest + 10);
        outcomeText = `${targetWish.deptName} 부서장에게 확실한 인상을 남겼습니다.`;
        impactText = '부서장 관심도 +10P, 직접 영입 제안 확보';

        if (targetWish.recruitIntent === '긍정적 의사 표현' || targetWish.recruitIntent === '관심은 있어 보임') {
          targetWish.recruitIntent = '직접 함께 일하자고 제안';
        }
      } else {
        dialogueText = '자네 열정은 알겠는데, 자꾸 찾아오면 다른 데스크들 눈치도 보이고 오히려 곤란해져.';
        updatedState.metrics.bossInterest = Math.max(10, updatedState.metrics.bossInterest - 15);
        outcomeText = '지나치게 잦은 방문으로 부서장이 다소 부담스러워합니다.';
        impactText = '부서장 관심도 -15P (체감 효과 발생)';
      }

      popupDialogue = {
        speaker: `${targetWish.deptName} 부서장`,
        text: dialogueText,
        note: '가상 인사 면담 대화'
      };
      break;
    }

    case 'meet_peer': {
      actionTitle = `${targetWish.deptName} 동료 기자 티타임`;
      dialogueText = '우리 부서에 2~3년 넘게 근무한 선배가 있어서 이번에 움직일 가능성이 높아 보여. 부장님은 요즘 데이터나 현장 감각 있는 후배를 데려오고 싶어 하시더라.';
      updatedState.metrics.deptAwareness = Math.min(100, updatedState.metrics.deptAwareness + 20);
      updatedState.metrics.infoConfidence = Math.min(100, updatedState.metrics.infoConfidence + 25);
      outcomeText = `${targetWish.deptName} 내부 분위기와 잠재적 이동 수요에 대한 고급 정보를 수집했습니다.`;
      impactText = '부서 내 인지도 +20P, 정보 신뢰도 +25P (소문 성공률 증가)';

      popupDialogue = {
        speaker: `${targetWish.deptName} 출입 동료 기자`,
        text: dialogueText,
        note: '편집국 카페테리아 대화'
      };
      break;
    }

    case 'spread_rumor': {
      actionTitle = `${targetWish.deptName} 지망 소문 흘리기`;
      // 정보 신뢰도(infoConfidence)가 높을수록 소문 성공 확률 증가!
      // 기본 50% + (신뢰도/100 * 35%) -> 최대 85% 성공!
      const successChance = 0.50 + ((updatedState.metrics.infoConfidence / 100) * 0.35);
      const isSuccess = Math.random() < successChance;

      if (isSuccess) {
        dialogueText = `김기자가 이번에 ${targetWish.deptName} 가고 싶어 한다는 얘기가 데스크 라인까지 돌던데? 부장님도 귀담아듣는 눈치야.`;
        updatedState.metrics.rumorSpread = Math.min(100, updatedState.metrics.rumorSpread + 25);
        updatedState.metrics.deptAwareness = Math.min(100, updatedState.metrics.deptAwareness + 20);
        outcomeText = `이동 희망 소문이 편집국에 성공적으로 퍼져 영입 의사가 강화되었습니다.`;
        impactText = '소문 확산도 +25P, 영입 의사 1단계 상향!';

        // 영입 의사 실질적 상향 (확률에 직접 반영!)
        if (targetWish.recruitIntent === '특별한 의사 표현 없음' || targetWish.recruitIntent === '전혀 모름') {
          targetWish.recruitIntent = '관심은 있어 보임';
        } else if (targetWish.recruitIntent === '관심은 있어 보임') {
          targetWish.recruitIntent = '긍정적 의사 표현';
        } else if (targetWish.recruitIntent === '긍정적 의사 표현') {
          targetWish.recruitIntent = '직접 함께 일하자고 제안';
        }
      } else {
        dialogueText = '자네… 요즘 다른 부서 간다고 소문내고 다닌다며? 우리 부서 일은 뒷전인 텐가?';
        updatedState.metrics.rumorSpread = Math.min(100, updatedState.metrics.rumorSpread + 35);
        updatedState.metrics.stayPressure = Math.min(100, updatedState.metrics.stayPressure + 25);
        outcomeText = '소문이 현재 부서장의 귀에 들어가 잔류 압박이 커졌습니다.';
        impactText = '소문 확산도 +35P, 현 부서 잔류 압력 +25P';

        if (updatedWishes.currentBossIntent === '적극적으로 보내주려 한다') {
          updatedWishes.currentBossIntent = '이동을 허용할 가능성이 높다';
        } else if (updatedWishes.currentBossIntent === '이동을 허용할 가능성이 높다') {
          updatedWishes.currentBossIntent = '잔류를 원하는 분위기다';
        }
      }

      popupDialogue = {
        speaker: isSuccess ? '동기 기자' : `현재 ${currentDeptName} 부서장`,
        text: dialogueText,
        note: '편집국 복도 소문 확산'
      };
      break;
    }

    case 'explore_board': {
      actionTitle = '휴게실 인사판 탐색 & 정보 수집';
      dialogueText = '이번 인사는 국장단 교체설이 있어서 몇몇 부서에서 연쇄 도미노가 생길 거라더군. 확실한 건 뚜껑을 열어봐야 알겠지만 말이야.';
      updatedState.metrics.infoConfidence = Math.min(100, updatedState.metrics.infoConfidence + 25);
      outcomeText = '편집국 전반의 인사 도미노 및 정세 소문을 파악했습니다.';
      impactText = '인사 정보 신뢰도 +25P (전략적 소문 성공 확률 대폭 상승)';

      popupDialogue = {
        speaker: '편집국 휴게실 선배 기자',
        text: dialogueText,
        note: '휴게실 커피 머신 앞'
      };
      break;
    }

    case 'meet_cur_boss': {
      actionTitle = `현재 ${currentDeptName} 부서장과 솔직한 면담`;

      // 근속 연수와 잔류 압력에 따른 현실적 부서장 반응
      if (currentDeptMonths <= 12) {
        // 1년 미만: 부서장이 거의 무조건 붙잡음
        dialogueText = '자네 우리 부서 온 지 아직 1년도 안 됐잖아. 지금 가면 일 배우다 마는 거야. 이번엔 잔류해서 팀 중심을 잡아주게.';
        updatedState.metrics.stayPressure = Math.min(100, updatedState.metrics.stayPressure + 20);
        outcomeText = '근속 기간이 짧아 현재 부서장이 완강하게 잔류를 요청합니다.';
        impactText = '현 부서 잔류 압력 +20P, 잔류 의사 강화';
        updatedWishes.currentBossIntent = '잔류를 원하는 분위기다';
      } else if (updatedState.metrics.stayPressure > 60) {
        dialogueText = '자네가 나가면 우리 팀 핵심 라인이 무너져. 이번엔 어렵고 다음 인사에 길을 열어주겠네.';
        outcomeText = '부서 사정으로 인해 현재 부서장이 완강하게 잔류를 요청합니다.';
        impactText = '현 부서 잔류 압력 유지, 이동 보류';
        updatedWishes.currentBossIntent = '반드시 남기려고 한다';
      } else {
        dialogueText = '자네가 그동안 고생 많이 했지. 2년 넘게 뛰었으니 이제 다른 부서 가서 큰 물에서 놀 때가 됐어. 국장한테 좋게 이야기해 주겠네.';
        updatedState.metrics.stayPressure = Math.max(0, updatedState.metrics.stayPressure - 30);
        outcomeText = '충분한 근속 기간을 인정받아 현재 부서장이 훈훈하게 길을 열어주기로 약속했습니다.';
        impactText = '현 부서 잔류 압력 -30P, 적극 이동 허용 전환!';
        updatedWishes.currentBossIntent = '적극적으로 보내주려 한다';
      }

      popupDialogue = {
        speaker: `현재 ${currentDeptName} 부서장`,
        text: dialogueText,
        note: '부장실 1:1 티타임 면담'
      };
      break;
    }

    case 'write_article': {
      actionTitle = '인사 농사 대신 묵묵히 특종 기사 집필';
      dialogueText = '[데스크 단체방 공지] 정기인사 앞두고 다들 어수선한데, 이번 기획기사처럼 묵묵히 취재에 집중하는 자세가 모범적입니다.';
      updatedState.metrics.articleScore = Math.min(100, updatedState.metrics.articleScore + 30);
      updatedState.metrics.bossInterest = Math.min(100, updatedState.metrics.bossInterest + 10);
      outcomeText = '정치적 행동 대신 고품질 기사를 완성하여 편집국 간부진의 호평을 받았습니다.';
      impactText = '기사 작성 성과 +30P (모든 지망 부서의 실무 적합도 보너스 가산!)';

      popupDialogue = {
        speaker: '편집국 데스크 단체 메신저',
        text: dialogueText,
        note: '취재 성과 인정'
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
