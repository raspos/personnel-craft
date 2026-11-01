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

  const isStayMode = targetWishIndex === 1 && targetWish.deptName === currentDeptName;

  let actionTitle = '';
  let targetDept = targetWish.deptName;
  let dialogueText = '';
  let outcomeText = '';
  let impactText = '';
  let popupDialogue: { speaker: string; text: string; note?: string } | undefined;

  switch (actionType) {
    case 'meet_boss': {
      const visits = (updatedState.bossVisitCount[targetWish.deptName] || 0) + 1;
      updatedState.bossVisitCount[targetWish.deptName] = visits;

      if (isStayMode) {
        actionTitle = `${currentDeptName} 직속 부서장 면담 (잔류 굳히기)`;
        if (visits === 1) {
          dialogueText = '자네가 다른 데 안 가고 우리 부서에 더 남아주겠다고? 정말 든든하네! 지금 진행 중인 기획 취재 자네가 중심 잡고 이끌어주게. 내가 국장단 회의 때 자네는 무조건 지켜낼 테니 걱정 말게.';
          updatedState.metrics.bossInterest[targetKey] = Math.min(100, updatedState.metrics.bossInterest[targetKey] + 25);
          updatedState.metrics.stayPressure = Math.min(100, updatedState.metrics.stayPressure + 18);
          updatedState.metrics.sproutStage.first = Math.min(3, updatedState.metrics.sproutStage.first + 1);
          outcomeText = `${currentDeptName} 부서장이 잔류 의사를 적극 환영하며 국장단 회의에서 철통 방어하겠다고 약속했습니다.`;
          impactText = `[현 부서 잔류] 부서장 신임도 +25P, 현 부서 잔류 압력 +18P (잔류 성사율 대폭 상승)`;
        } else if (visits === 2) {
          dialogueText = '자네 뜻은 확실히 알았고 내가 국장한테도 이미 자네 잔류를 강력히 못 박아뒀네. 부서 일에만 전념하게.';
          updatedState.metrics.stayPressure = Math.min(100, updatedState.metrics.stayPressure + 12);
          updatedState.metrics.bossInterest[targetKey] = Math.min(100, updatedState.metrics.bossInterest[targetKey] + 10);
          outcomeText = `부서장의 결재 방어 의지를 재확인하고 잔류 기반을 한층 더 공고히 했습니다.`;
          impactText = `현 부서 잔류 압력 +12P (부서장의 잔류 결재 확약)`;
        } else {
          dialogueText = '자네를 남기는 건 확정적이지만, 자꾸 찾아오면 딴 팀 부장들이 왜 저렇게 단속하나 눈치채네. 현장 취재에 집중하게나.';
          updatedState.metrics.stayPressure = Math.min(100, updatedState.metrics.stayPressure + 5);
          outcomeText = '부서장이 확신을 주며 현장 취재에 집중할 것을 당부했습니다.';
          impactText = '현 부서 잔류 압력 +5P (안정적 잔류 유지)';
        }

        popupDialogue = {
          speaker: `현재 ${currentDeptName} 직속 부서장`,
          text: dialogueText,
          note: '부장실 1:1 잔류 면담'
        };
        break;
      }

      actionTitle = `${targetWish.deptName} 부서장 면담 (${targetWishIndex}지망)`;

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
      if (isStayMode) {
        actionTitle = `${currentDeptName} 후배·동료 기자와 티타임 (결속 다지기)`;
        dialogueText = '선배! 이번에 절대 다른 부서 가지 마세요. 선배 빠지면 저희 팀 진짜 기획 엎어져요. 부장님한테도 선배 꼭 남겨달라고 저희가 다 같이 말할게요!';
        updatedState.metrics.deptAwareness[targetKey] = Math.min(100, updatedState.metrics.deptAwareness[targetKey] + 30);
        updatedState.metrics.stayPressure = Math.min(100, updatedState.metrics.stayPressure + 15);
        updatedState.metrics.infoConfidence = Math.min(100, updatedState.metrics.infoConfidence + 20);
        outcomeText = `${currentDeptName} 동료들과 끈끈한 결속을 다지고, 부서 내 대체 불가 필수 인력이라는 사내 여론을 형성했습니다.`;
        impactText = `부서 내 신임도 +30P, 현 부서 잔류 압력 +15P, 정보 신뢰도 +20P (팀 사수 여론 결집)`;

        popupDialogue = {
          speaker: `${currentDeptName} 후배 동료 기자`,
          text: dialogueText,
          note: '사내 카페테리아 티타임'
        };
        break;
      }

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
      if (isStayMode) {
        actionTitle = `"나 딴 데 안 간다" 잔류 소문 못 박기`;
        const successChance = 0.60 + ((updatedState.metrics.infoConfidence / 100) * 0.30);
        const isSuccess = Math.random() < successChance;

        if (isSuccess) {
          dialogueText = `김 기자가 이번에 ${currentDeptName}에 완전히 뼈를 묻는다고 선언했다더라고. 다른 부서 데스크들이 영입하려다 명분이 없어서 포기했대.`;
          updatedState.metrics.rumorSpread = Math.min(100, updatedState.metrics.rumorSpread + 20);
          updatedState.metrics.stayPressure = Math.min(100, updatedState.metrics.stayPressure + 18);
          updatedState.metrics.deptAwareness[targetKey] = Math.min(100, updatedState.metrics.deptAwareness[targetKey] + 20);
          outcomeText = `잔류 희망 의사가 편집국에 확실히 알려져 타 부서의 강제 차출 시도를 사전에 차단했습니다.`;
          impactText = `소문 확산도 +20P, 현 부서 잔류 압력 +18P (타 부서 강제 차출 방어 성공)`;
        } else {
          dialogueText = '자네 딴 데 안 간다고 큰소리치고 다닌다며? 인사는 국장이 내는 건데 너무 방심하다 엉뚱한 데로 튕겨나갈 수도 있어.';
          updatedState.metrics.rumorSpread = Math.min(100, updatedState.metrics.rumorSpread + 15);
          updatedState.metrics.stayPressure = Math.max(0, updatedState.metrics.stayPressure - 5);
          outcomeText = '소문이 헛돌아 편집국 간부진에게 방심한다는 인상을 주었습니다.';
          impactText = '소문 확산도 +15P, 현 부서 잔류 압력 -5P';
        }

        popupDialogue = {
          speaker: isSuccess ? '동기 기자' : '편집국 타 데스크',
          text: dialogueText,
          note: '편집국 복도 소문 확산'
        };
        break;
      }

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
      if (isStayMode) {
        actionTitle = '휴게실 정세 탐색 (우리 부서 노리는 외부 침입자 파악)';
        dialogueText = `이번에 ${currentDeptName} 쪽으로 밀고 들어오려는 타 부서 기자들이 몇몇 있더군. 하지만 자네가 기획을 쥐고 버티고 있으면 국장도 함부로 못 건드릴 걸세.`;
        updatedState.metrics.infoConfidence = Math.min(100, updatedState.metrics.infoConfidence + 30);
        updatedState.metrics.stayPressure = Math.min(100, updatedState.metrics.stayPressure + 12);
        updatedState.metrics.bossInterest.first = Math.min(100, updatedState.metrics.bossInterest.first + 10);
        outcomeText = `외부 경쟁자들의 진입 시도를 사전에 파악하고, 부서 내 자리를 지키기 위한 방어 논리를 확보했습니다.`;
        impactText = `인사 정보 신뢰도 +30P, 현 부서 잔류 압력 +12P (방어 정보 획득)`;

        popupDialogue = {
          speaker: '편집국 휴게실 선배 기자',
          text: dialogueText,
          note: '휴게실 커피 머신 앞'
        };
        break;
      }

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
      if (isStayMode) {
        actionTitle = '중장기 심층 기획안 제출 (부서 잔류 알박기)';
        dialogueText = `자네가 가져온 기획안 정말 대단하군! 내년까지 이어질 대형 프로젝트야. 이 기획안을 국장한테 들이밀면 자네는 감히 아무도 다른 데로 못 빼가겠네. 내가 무조건 결재 받아오지!`;
        updatedState.metrics.stayPressure = Math.min(100, updatedState.metrics.stayPressure + 22);
        updatedState.metrics.articleScore = Math.min(100, updatedState.metrics.articleScore + 15);
        updatedWishes.currentBossIntent = '반드시 남기려고 한다';
        outcomeText = `내년까지 이어지는 대형 심층 기획안을 공식 제출하여 부서에 남아야만 하는 불가피한 명분을 완벽히 구축했습니다.`;
        impactText = `현 부서 잔류 압력 +22P, 기사 성과 +15P, 부서장 결재 의사 [반드시 남기려고 한다] 전환! (완벽한 잔류 알박기)`;

        popupDialogue = {
          speaker: `현재 ${currentDeptName} 직속 부서장`,
          text: dialogueText,
          note: '부장실 심층 기획안 대면 보고'
        };
        break;
      }

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
      if (isStayMode) {
        actionTitle = '현 출입처 단독 특종 보도 (대체 불가 입증)';
        updatedState.metrics.articleScore = Math.min(100, updatedState.metrics.articleScore + 25);
        updatedState.metrics.stayPressure = Math.min(100, updatedState.metrics.stayPressure + 15);
        updatedState.metrics.bossInterest.first = Math.min(100, updatedState.metrics.bossInterest.first + 10);

        dialogueText = `[데스크 단체방 공지] 우리 부서 김 기자의 단독 기사가 1면 톱에 걸렸습니다! 국장도 "이 출입처는 김 기자가 꽉 쥐고 있으니 절대 건드리지 마라"고 지시했습니다.`;
        outcomeText = '출입처 단독 특종을 터뜨려 편집국장과 간부진에게 대체 불가능한 핵심 기자임을 확실히 각인시켰습니다.';
        impactText = '기사 작성 성과 +25P, 현 부서 잔류 압력 +15P (출입처 장악력 인정으로 잔류 성사율 상승)';

        popupDialogue = {
          speaker: '편집국 데스크 단체 메신저',
          text: dialogueText,
          note: '현 출입처 특종 성과 인정'
        };
        break;
      }

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
      actionTitle = isStayMode
        ? '인사 풍파에 흔들리지 않고 묵묵히 마감 대기'
        : '인사에 연연하지 않고 평소처럼 근무';
      dialogueText = isStayMode
        ? '인사철 바람에 일희일비하지 않고 제자리를 굳건히 지키는 것이 가장 강력한 잔류의 길입니다.'
        : '인사 농사는 사람이 짓지만 결과는 하늘(편집국장)이 정하는 법. 평정심을 유지합니다.';
      outcomeText = isStayMode
        ? '평소처럼 출입처를 단단히 지키며 흔들림 없는 존재감을 보여주었습니다.'
        : '어떠한 소문이나 인위적 개입 없이 담담하게 정기인사를 기다립니다.';
      impactText = '상태 변화 없음 (기존 경력과 부서 기반 유지)';

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
