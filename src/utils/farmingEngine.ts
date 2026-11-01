import {
  WishSelection,
  FarmingState,
  FarmingActionType,
  FarmingLogEntry,
  WishDeptConfig,
  BossRecruitIntent,
  CurrentBossIntent
} from '../types/game';
import { getDepartmentByName } from '../data/departments';

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
  currentDeptMonths: number = 24,
  isEn: boolean = false
): ActionExecutionResult {
  const getDeptName = (name: string) => isEn ? (getDepartmentByName(name)?.nameEn || name) : name;

  const weekName = isEn
    ? `${currentHalf === '하반기' ? 'Post-Chuseok' : 'Reshuffle'} Week ${currentState.currentTurn}`
    : (currentHalf === '하반기'
      ? `추석 이후 ${currentState.currentTurn}주 차`
      : `상반기 인사 준비 ${currentState.currentTurn}주 차`);

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
        actionTitle = isEn
          ? `1-on-1 Meeting with Current Chief (${getDeptName(currentDeptName)})`
          : `${currentDeptName} 직속 부서장 면담 (잔류 굳히기)`;
        if (visits === 1) {
          dialogueText = isEn
            ? "“You want to stay on our beat instead of jumping ship? Fantastic! Lead our investigative series to the finish line. I will personally defend your desk in the Managing Editor's council.”"
            : '자네가 다른 데 안 가고 우리 부서에 더 남아주겠다고? 정말 든든하네! 지금 진행 중인 기획 취재 자네가 중심 잡고 이끌어주게. 내가 국장단 회의 때 자네는 무조건 지켜낼 테니 걱정 말게.';
          updatedState.metrics.bossInterest[targetKey] = Math.min(100, updatedState.metrics.bossInterest[targetKey] + 25);
          updatedState.metrics.stayPressure = Math.min(100, updatedState.metrics.stayPressure + 18);
          updatedState.metrics.sproutStage.first = Math.min(3, updatedState.metrics.sproutStage.first + 1);
          outcomeText = isEn
            ? `Section Chief of ${getDeptName(currentDeptName)} welcomed your retention and pledged ironclad defense at the Council.`
            : `${currentDeptName} 부서장이 잔류 의사를 적극 환영하며 국장단 회의에서 철통 방어하겠다고 약속했습니다.`;
          impactText = isEn
            ? `[Stay Desk] Chief Trust +25P, Retention Defense +18P`
            : `[현 부서 잔류] 부서장 신임도 +25P, 현 부서 잔류 압력 +18P (잔류 성사율 대폭 상승)`;
        } else if (visits === 2) {
          dialogueText = isEn
            ? '“I made your intention clear and already locked your desk with the Managing Editor. Focus on your reporting.”'
            : '자네 뜻은 확실히 알았고 내가 국장한테도 이미 자네 잔류를 강력히 못 박아뒀네. 부서 일에만 전념하게.';
          updatedState.metrics.stayPressure = Math.min(100, updatedState.metrics.stayPressure + 12);
          updatedState.metrics.bossInterest[targetKey] = Math.min(100, updatedState.metrics.bossInterest[targetKey] + 10);
          outcomeText = isEn
            ? 'Reconfirmed the Chief commitment to defend your desk.'
            : `부서장의 결재 방어 의지를 재확인하고 잔류 기반을 한층 더 공고히 했습니다.`;
          impactText = isEn
            ? `Retention Defense +12P (Chief Retention Commitment Stamped)`
            : `현 부서 잔류 압력 +12P (부서장의 잔류 결재 확약)`;
        } else {
          dialogueText = isEn
            ? '“Your retention is basically set in stone. Too many visits will make other editors suspicious. Focus on filing stories.”'
            : '자네를 남기는 건 확정적이지만, 자꾸 찾아오면 딴 팀 부장들이 왜 저렇게 단속하나 눈치채네. 현장 취재에 집중하게나.';
          updatedState.metrics.stayPressure = Math.min(100, updatedState.metrics.stayPressure + 5);
          outcomeText = isEn
            ? 'Chief assured retention and urged you to focus on the news beat.'
            : '부서장이 확신을 주며 현장 취재에 집중할 것을 당부했습니다.';
          impactText = isEn ? 'Retention Defense +5P (Stable Retention)' : '현 부서 잔류 압력 +5P (안정적 잔류 유지)';
        }

        popupDialogue = {
          speaker: isEn ? `Current Chief of ${getDeptName(currentDeptName)}` : `현재 ${currentDeptName} 직속 부서장`,
          text: dialogueText,
          note: isEn ? '1-on-1 Retention Meeting' : '부장실 1:1 잔류 면담'
        };
        break;
      }

      actionTitle = isEn
        ? `Meeting with Chief of ${getDeptName(targetWish.deptName)} (${targetWishIndex} Wish)`
        : `${targetWish.deptName} 부서장 면담 (${targetWishIndex}지망)`;

      if (visits === 1) {
        if (targetWish.bossRelation === '과거 직속 부장·데스크') {
          dialogueText = isEn
            ? '“I know your caliber better than anyone. If you want to transfer over, I will actively push for you in the Council.”'
            : '자네가 어떤 기자인지 내가 가장 잘 알지. 우리 부서에 오고 싶다면 국장단 회의 때 적극적으로 이야기해보겠네.';
        } else if (targetWish.bossRelation === '대학 선후배' || targetWish.bossRelation === '술자리 친구·사적 친분') {
          dialogueText = isEn
            ? '“Having you on our desk would be a blast, but personnel reshuffles are complicated... Still, I will keep an eye on you.”'
            : '자네가 오면 일이야 재밌겠지만, 인사는 또 다른 문제라… 그래도 뜻이 있다면 내가 관심 있게 지켜볼게.';
        } else if (targetWish.bossRelation === '안면이 전혀 없는 사이') {
          dialogueText = isEn
            ? '“I had a chance to skim your latest scoops. You could certainly bring good investigative firepower to our team.”'
            : '어떤 기사를 주로 쓰셨는지 포트폴리오를 한번 훑어봤습니다. 우리 부서에서도 충분히 역량을 발휘할 수 있겠네요.';
        } else {
          dialogueText = isEn
            ? '“You want to apply to our desk? Your background is plenty competitive. I will give it serious thought.”'
            : '우리 부서에 지원하고 싶다고? 자네 경력이면 충분히 경쟁력이 있지. 고민해보겠네.';
        }

        updatedState.metrics.bossInterest[targetKey] = Math.min(100, updatedState.metrics.bossInterest[targetKey] + 25);
        updatedState.metrics.deptAwareness[targetKey] = Math.min(100, updatedState.metrics.deptAwareness[targetKey] + 15);
        outcomeText = isEn
          ? `Chief of ${getDeptName(targetWish.deptName)} expressed warm positive interest.`
          : `${targetWish.deptName} 부서장이 긍정적인 관심을 표명했습니다.`;
        impactText = isEn
          ? `[${targetWishIndex} Wish] Chief Warmth +25P, Recruitment Signal Boosted`
          : `[${targetWishIndex}지망] 부서장 관심도 +25P, 영입 의사 신호 강화`;

        if (targetWish.recruitIntent === '특별한 의사 표현 없음' || targetWish.recruitIntent === '전혀 모름') {
          targetWish.recruitIntent = '관심은 있어 보임';
        } else if (targetWish.recruitIntent === '관심은 있어 보임') {
          targetWish.recruitIntent = '긍정적 의사 표현';
        }

        if (targetWishIndex === 1) updatedState.metrics.sproutStage.first = Math.min(3, updatedState.metrics.sproutStage.first + 1);
        else if (targetWishIndex === 2) updatedState.metrics.sproutStage.second = Math.min(3, updatedState.metrics.sproutStage.second + 1);
        else updatedState.metrics.sproutStage.third = Math.min(3, updatedState.metrics.sproutStage.third + 1);

      } else if (visits === 2) {
        dialogueText = isEn
          ? '“I know where your heart is, so do not rush me. We have to consider newsroom-wide circulation dominoes.”'
          : '자네 뜻은 확실히 알았으니 너무 보채진 말게. 편집국 전체 순환 판을 봐야 하니까.';
        updatedState.metrics.bossInterest[targetKey] = Math.min(100, updatedState.metrics.bossInterest[targetKey] + 15);
        updatedState.metrics.stayPressure = Math.min(100, updatedState.metrics.stayPressure + 10);
        outcomeText = isEn
          ? `Solidified impression with ${getDeptName(targetWish.deptName)} Chief, but word leaked to your current boss.`
          : `${targetWish.deptName} 부서장에게 확실한 인상을 남겼으나, 잦은 접촉이 현 부서장 귀에 들어갔습니다.`;
        impactText = isEn
          ? `[${targetWishIndex} Wish] Chief Warmth +15P (Direct Recruitment Pitch), Current Desk Retention Pressure +10P`
          : `[${targetWishIndex}지망] 부서장 관심도 +15P (직접 영입 확보), 현 부서 잔류 압력 +10P`;

        if (targetWish.recruitIntent === '긍정적 의사 표현' || targetWish.recruitIntent === '관심은 있어 보임') {
          targetWish.recruitIntent = '직접 함께 일하자고 제안';
        }
      } else {
        dialogueText = isEn
          ? '“I respect your hustle, but hanging around my desk too often puts other editors in an uncomfortable spot.”'
          : '자네 열정은 알겠는데, 자꾸 찾아오면 다른 데스크들 눈치도 보이고 오히려 곤란해져.';
        updatedState.metrics.bossInterest[targetKey] = Math.max(0, updatedState.metrics.bossInterest[targetKey] - 20);
        updatedState.metrics.stayPressure = Math.min(100, updatedState.metrics.stayPressure + 20);
        outcomeText = isEn
          ? 'Excessive lobbying overwhelmed the Chief, while current boss tightened retention grip.'
          : '지나치게 잦은 방문으로 부서장이 부담을 느끼며, 현 부서장의 잔류 압박이 커졌습니다.';
        impactText = isEn
          ? `[${targetWishIndex} Wish] Chief Warmth -20P, Current Desk Retention Pressure +20P (Backfire)`
          : `[${targetWishIndex}지망] 부서장 관심도 -20P, 현 부서 잔류 압력 +20P (역풍 발생)`;
      }

      popupDialogue = {
        speaker: isEn ? `Chief of ${getDeptName(targetWish.deptName)}` : `${targetWish.deptName} 부서장`,
        text: dialogueText,
        note: isEn ? 'Virtual Reshuffle Interview' : '가상 인사 면담 대화'
      };
      break;
    }

    case 'meet_peer': {
      if (isStayMode) {
        actionTitle = isEn
          ? `Coffee with Peers & Juniors in ${getDeptName(currentDeptName)}`
          : `${currentDeptName} 후배·동료 기자와 티타임 (결속 다지기)`;
        dialogueText = isEn
          ? '“Senior! You cannot leave our desk this cycle. If you go, our major series will collapse. We will all plead with the Chief to keep you!”'
          : '선배! 이번에 절대 다른 부서 가지 마세요. 선배 빠지면 저희 팀 진짜 기획 엎어져요. 부장님한테도 선배 꼭 남겨달라고 저희가 다 같이 말할게요!';
        updatedState.metrics.deptAwareness[targetKey] = Math.min(100, updatedState.metrics.deptAwareness[targetKey] + 30);
        updatedState.metrics.stayPressure = Math.min(100, updatedState.metrics.stayPressure + 15);
        updatedState.metrics.infoConfidence = Math.min(100, updatedState.metrics.infoConfidence + 20);
        outcomeText = isEn
          ? `Bonded tightly with colleagues in ${getDeptName(currentDeptName)}, building newsroom consensus that you are indispensable.`
          : `${currentDeptName} 동료들과 끈끈한 결속을 다지고, 부서 내 대체 불가 필수 인력이라는 사내 여론을 형성했습니다.`;
        impactText = isEn
          ? `Desk Rapport +30P, Retention Defense +15P, Intel Trust +20P`
          : `부서 내 신임도 +30P, 현 부서 잔류 압력 +15P, 정보 신뢰도 +20P (팀 사수 여론 결집)`;

        popupDialogue = {
          speaker: isEn ? `Junior Colleague in ${getDeptName(currentDeptName)}` : `${currentDeptName} 후배 동료 기자`,
          text: dialogueText,
          note: isEn ? 'Newsroom Cafeteria Chat' : '사내 카페테리아 티타임'
        };
        break;
      }

      actionTitle = isEn
        ? `Coffee with Reporter in ${getDeptName(targetWish.deptName)} (${targetWishIndex} Wish)`
        : `${targetWish.deptName} 동료 기자 티타임 (${targetWishIndex}지망)`;
      dialogueText = isEn
        ? '“There is a 2~3 year veteran on our desk likely rotating out this round. I will put in a good word with the Chief for you!”'
        : '우리 부서에 2~3년 넘게 근무한 선배가 있어서 이번에 움직일 가능성이 높아 보여. 부장님한테 자네 이야기 좋게 귀띔해둘게!';
      updatedState.metrics.deptAwareness[targetKey] = Math.min(100, updatedState.metrics.deptAwareness[targetKey] + 30);
      updatedState.metrics.bossInterest[targetKey] = Math.min(100, updatedState.metrics.bossInterest[targetKey] + 10);
      updatedState.metrics.infoConfidence = Math.min(100, updatedState.metrics.infoConfidence + 20);
      outcomeText = isEn
        ? `Gained inside intel and internal peer endorsement within ${getDeptName(targetWish.deptName)}.`
        : `${targetWish.deptName} 내부 분위기와 고급 이동 정보를 획득하고 내부 추천을 확보했습니다.`;
      impactText = isEn
        ? `[${targetWishIndex} Wish] Desk Awareness +30P, Chief Warmth +10P, Intel Trust +20P`
        : `[${targetWishIndex}지망] 부서 내 인지도 +30P, 부서장 관심도 +10P, 정보 신뢰도 +20P`;

      popupDialogue = {
        speaker: isEn ? `Reporter in ${getDeptName(targetWish.deptName)}` : `${targetWish.deptName} 출입 동료 기자`,
        text: dialogueText,
        note: isEn ? 'Cafeteria Intel Chat' : '편집국 카페테리아 대화'
      };
      break;
    }

    case 'spread_rumor': {
      if (isStayMode) {
        actionTitle = isEn ? 'Stake Claim: "I Am NOT Leaving This Beat"' : `"나 딴 데 안 간다" 잔류 소문 못 박기`;
        const successChance = 0.60 + ((updatedState.metrics.infoConfidence / 100) * 0.30);
        const isSuccess = Math.random() < successChance;

        if (isSuccess) {
          dialogueText = isEn
            ? `“Word on the floor is Kim declared total commitment to ${getDeptName(currentDeptName)}. Other editors backed off because they had no leverage.”`
            : `김 기자가 이번에 ${currentDeptName}에 완전히 뼈를 묻는다고 선언했다더라고. 다른 부서 데스크들이 영입하려다 명분이 없어서 포기했대.`;
          updatedState.metrics.rumorSpread = Math.min(100, updatedState.metrics.rumorSpread + 20);
          updatedState.metrics.stayPressure = Math.min(100, updatedState.metrics.stayPressure + 18);
          updatedState.metrics.deptAwareness[targetKey] = Math.min(100, updatedState.metrics.deptAwareness[targetKey] + 20);
          outcomeText = isEn
            ? 'Retention intention established across newsroom, preempting forced draft attempts.'
            : `잔류 희망 의사가 편집국에 확실히 알려져 타 부서의 강제 차출 시도를 사전에 차단했습니다.`;
          impactText = isEn
            ? 'Rumor Spread +20P, Retention Defense +18P (Protected from forced transfer)'
            : `소문 확산도 +20P, 현 부서 잔류 압력 +18P (타 부서 강제 차출 방어 성공)`;
        } else {
          dialogueText = isEn
            ? '“You boast you will not budge? Remember the Managing Editor signs the orders. Let your guard down and you might be cast away to a ghost beat.”'
            : '자네 딴 데 안 간다고 큰소리치고 다닌다며? 인사는 국장이 내는 건데 너무 방심하다 엉뚱한 데로 튕겨나갈 수도 있어.';
          updatedState.metrics.rumorSpread = Math.min(100, updatedState.metrics.rumorSpread + 15);
          updatedState.metrics.stayPressure = Math.max(0, updatedState.metrics.stayPressure - 5);
          outcomeText = isEn
            ? 'Rumor misfired, signaling complacency to newsroom leadership.'
            : '소문이 헛돌아 편집국 간부진에게 방심한다는 인상을 주었습니다.';
          impactText = isEn ? 'Rumor Spread +15P, Retention Defense -5P' : '소문 확산도 +15P, 현 부서 잔류 압력 -5P';
        }

        popupDialogue = {
          speaker: isSuccess ? (isEn ? 'Peer Reporter' : '동기 기자') : (isEn ? 'Senior Editor' : '편집국 타 데스크'),
          text: dialogueText,
          note: isEn ? 'Corridor Rumor Spread' : '편집국 복도 소문 확산'
        };
        break;
      }

      actionTitle = isEn
        ? `Leak Reshuffle Transfer Rumor (${targetWishIndex} Wish: ${getDeptName(targetWish.deptName)})`
        : `${targetWish.deptName} 지망 소문 흘리기 (${targetWishIndex}지망)`;
      const successChance = 0.55 + ((updatedState.metrics.infoConfidence / 100) * 0.35);
      const isSuccess = Math.random() < successChance;

      if (isSuccess) {
        dialogueText = isEn
          ? `“Word on the desk circuit is Kim wants ${getDeptName(targetWish.deptName)} this round. Sounds like the Chief is paying serious attention.”`
          : `김기자가 이번에 ${targetWish.deptName} 가고 싶어 한다는 얘기가 데스크 라인까지 돌던데? 부장님도 귀담아듣는 눈치야.`;
        updatedState.metrics.rumorSpread = Math.min(100, updatedState.metrics.rumorSpread + 20);
        updatedState.metrics.deptAwareness[targetKey] = Math.min(100, updatedState.metrics.deptAwareness[targetKey] + 25);
        outcomeText = isEn
          ? 'Transfer rumor spread successfully, upgrading recruitment sentiment.'
          : `이동 희망 소문이 편집국에 성공적으로 퍼져 영입 의사가 강화되었습니다.`;
        impactText = isEn
          ? `Rumor Spread +20P, [${targetWishIndex} Wish] Awareness +25P & Signal Upgraded!`
          : `소문 확산도 +20P, [${targetWishIndex}지망] 인지도 +25P 및 영입 의사 상향!`;

        if (targetWish.recruitIntent === '특별한 의사 표현 없음' || targetWish.recruitIntent === '전혀 모름') {
          targetWish.recruitIntent = '관심은 있어 보임';
        } else if (targetWish.recruitIntent === '관심은 있어 보임') {
          targetWish.recruitIntent = '긍정적 의사 표현';
        } else if (targetWish.recruitIntent === '긍정적 의사 표현') {
          targetWish.recruitIntent = '직접 함께 일하자고 제안';
        }
      } else {
        dialogueText = isEn
          ? '“You... rumors say you have been neglecting your beat duties lately. Pay closer attention to deadlines.”'
          : '자네… 요즘 밖에서 우리 부서 일 소홀히 한다는 말이 돌던데, 맡은 출입처 마감에 더 신경 쓰게.';
        updatedState.metrics.rumorSpread = Math.min(100, updatedState.metrics.rumorSpread + 15);
        updatedState.metrics.stayPressure = Math.min(100, updatedState.metrics.stayPressure + 8);
        outcomeText = isEn
          ? 'Rumor misfired and your current boss gave a stern warning.'
          : '소문이 헛돌아 현재 부서장에게 주의를 받았습니다 (경미한 잔류 압력 증가).';
        impactText = isEn
          ? 'Rumor Spread +15P, Current Desk Retention Pressure +8P'
          : '소문 확산도 +15P, 현 부서 잔류 압력 +8P';
      }

      popupDialogue = {
        speaker: isSuccess ? (isEn ? 'Peer Reporter' : '동기 기자') : (isEn ? `Current Chief of ${getDeptName(currentDeptName)}` : `현재 ${currentDeptName} 부서장`),
        text: dialogueText,
        note: isEn ? 'Corridor Rumor Spread' : '편집국 복도 소문 확산'
      };
      break;
    }

    case 'explore_board': {
      if (isStayMode) {
        actionTitle = isEn
          ? `Lounge Espionage (Scout Poachers Eyeing ${getDeptName(currentDeptName)})`
          : '휴게실 정세 탐색 (우리 부서 노리는 외부 침입자 파악)';
        dialogueText = isEn
          ? `“There are a few reporters aiming to push into ${getDeptName(currentDeptName)}. But if you anchor down with your project, no one can dislodge you.”`
          : `이번에 ${currentDeptName} 쪽으로 밀고 들어오려는 타 부서 기자들이 몇몇 있더군. 하지만 자네가 기획을 쥐고 버티고 있으면 국장도 함부로 못 건드릴 걸세.`;
        updatedState.metrics.infoConfidence = Math.min(100, updatedState.metrics.infoConfidence + 30);
        updatedState.metrics.stayPressure = Math.min(100, updatedState.metrics.stayPressure + 12);
        updatedState.metrics.bossInterest.first = Math.min(100, updatedState.metrics.bossInterest.first + 10);
        outcomeText = isEn
          ? 'Discovered external rival transfer schemes and secured defensive justifications.'
          : `외부 경쟁자들의 진입 시도를 사전에 파악하고, 부서 내 자리를 지키기 위한 방어 논리를 확보했습니다.`;
        impactText = isEn
          ? 'Intel Trust +30P, Retention Defense +12P (Defensive Intel Secured)'
          : `인사 정보 신뢰도 +30P, 현 부서 잔류 압력 +12P (방어 정보 획득)`;

        popupDialogue = {
          speaker: isEn ? 'Senior Correspondent in Lounge' : '편집국 휴게실 선배 기자',
          text: dialogueText,
          note: isEn ? 'Coffee Machine Intel' : '휴게실 커피 머신 앞'
        };
        break;
      }

      actionTitle = isEn ? 'Lounge Espionage & Domino Dynamics' : '휴게실 인사판 탐색 & 정세 분석';
      dialogueText = isEn
        ? '“Managing editor shifts are rumored, which will cause a domino cascade. Keep your eyes on vacancies across every section.”'
        : '이번 인사는 국장단 교체설이 있어서 몇몇 부서에서 연쇄 도미노가 생길 거라더군. 각 부서별 결원 사정을 꼼꼼히 파악해두게.';
      updatedState.metrics.infoConfidence = Math.min(100, updatedState.metrics.infoConfidence + 30);
      updatedState.metrics.bossInterest.first = Math.min(100, updatedState.metrics.bossInterest.first + 8);
      updatedState.metrics.bossInterest.second = Math.min(100, updatedState.metrics.bossInterest.second + 8);
      updatedState.metrics.bossInterest.third = Math.min(100, updatedState.metrics.bossInterest.third + 8);
      outcomeText = isEn
        ? 'Deciphered macro reshuffle board and secured intel for all wishlist options.'
        : '편집국 전반의 인사 도미노 및 각 부서별 정세를 꿰뚫어 모든 희망 부서에 대한 전략을 확보했습니다.';
      impactText = isEn
        ? 'Intel Trust +30P, Warmth +8P across all wishlist options!'
        : '인사 정보 신뢰도 +30P, 모든 희망 부서 관심도 +8P 동시 상승!';

      popupDialogue = {
        speaker: isEn ? 'Senior Correspondent in Lounge' : '편집국 휴게실 선배 기자',
        text: dialogueText,
        note: isEn ? 'Coffee Machine Intel' : '휴게실 커피 머신 앞'
      };
      break;
    }

    case 'meet_cur_boss': {
      if (isStayMode) {
        actionTitle = isEn
          ? 'Submit Long-Term Investigation Pitch (Anchoring)'
          : '중장기 심층 기획안 제출 (부서 잔류 알박기)';
        dialogueText = isEn
          ? '“This pitch of yours is magnificent! A massive project running through next year. With this on the table, no one can dare move you elsewhere. I will sign off immediately!”'
          : `자네가 가져온 기획안 정말 대단하군! 내년까지 이어질 대형 프로젝트야. 이 기획안을 국장한테 들이밀면 자네는 감히 아무도 다른 데로 못 빼가겠네. 내가 무조건 결재 받아오지!`;
        updatedState.metrics.stayPressure = Math.min(100, updatedState.metrics.stayPressure + 22);
        updatedState.metrics.articleScore = Math.min(100, updatedState.metrics.articleScore + 15);
        updatedWishes.currentBossIntent = '반드시 남기려고 한다';
        outcomeText = isEn
          ? 'Formally submitted a major year-long investigative pitch, cementing an unshakeable case for retention.'
          : `내년까지 이어지는 대형 심층 기획안을 공식 제출하여 부서에 남아야만 하는 불가피한 명분을 완벽히 구축했습니다.`;
        impactText = isEn
          ? 'Retention Defense +22P, Scoop Score +15P, Chief Stance [Adamantly Defends Retention] (Anchoring Complete)'
          : `현 부서 잔류 압력 +22P, 기사 성과 +15P, 부서장 결재 의사 [반드시 남기려고 한다] 전환! (완벽한 잔류 알박기)`;

        popupDialogue = {
          speaker: isEn ? `Current Chief of ${getDeptName(currentDeptName)}` : `현재 ${currentDeptName} 직속 부서장`,
          text: dialogueText,
          note: isEn ? 'Investigation Pitch Presentation' : '부장실 심층 기획안 대면 보고'
        };
        break;
      }

      actionTitle = isEn
        ? `Frank Talk with Current Chief (${getDeptName(currentDeptName)})`
        : `현재 ${currentDeptName} 부서장과 속내 탐색 및 면담`;

      const curIntent = updatedWishes.currentBossIntent;
      const randVal = Math.random();

      if (currentDeptMonths <= 12) {
        dialogueText = isEn
          ? '“You have not even spent a full year on our desk yet. Moving now disrupts your training. Anchor our team this cycle.”'
          : '자네 우리 부서 온 지 아직 1년도 안 됐잖아. 지금 가면 일 배우다 마는 거야. 이번엔 잔류해서 팀 중심을 잡아주게.';
        updatedState.metrics.stayPressure = Math.min(100, updatedState.metrics.stayPressure + 10);
        outcomeText = isEn ? 'Short tenure led the Chief to firmly request retention.' : '근속 기간이 짧아 현재 부서장이 완강하게 잔류를 요청합니다.';
        impactText = isEn ? 'Current Desk Retention Pressure +10P' : '현 부서 잔류 압력 +10P (현재 부서장의 잔류 의지 확인)';
      } else if (curIntent === '반드시 남기려고 한다') {
        if (randVal < 0.20) {
          dialogueText = isEn
            ? '“If you feel so strongly... I will mention it to the Editor, but do not get your hopes too high.”'
            : '자네 뜻이 정 그렇다면… 국장한테 사정은 이야기해보겠지만 큰 기대는 말게.';
          updatedState.metrics.stayPressure = Math.max(0, updatedState.metrics.stayPressure - 8);
          updatedWishes.currentBossIntent = '잔류를 원하는 분위기다';
          outcomeText = isEn ? 'After earnest persuasion, the Chief softened slightly.' : '간곡한 설득 끝에 부서장의 태도가 아주 조금 누그러졌습니다.';
          impactText = isEn ? 'Retention Pressure -8P, Release intent improved slightly' : '현 부서 잔류 압력 -8P, 방출 의사 소폭 개선';
        } else {
          dialogueText = isEn
            ? '“If you leave, our desk projects come to a dead halt. I cannot let you go this time.”'
            : '자네가 빠지면 우리 팀 기획이 올스톱이야. 이번엔 절대 못 보내주니 그렇게 알게.';
          updatedState.metrics.stayPressure = Math.min(100, updatedState.metrics.stayPressure + 10);
          outcomeText = isEn ? 'Reconfirmed Chief unwavering defense against your transfer.' : '부서장의 철통 방어 의지를 재확인했습니다.';
          impactText = isEn ? 'Retention Pressure +10P (Stubborn retention maintained)' : '현 부서 잔류 압력 +10P (강경한 잔류 의지 유지)';
        }
      } else if (curIntent === '잔류를 원하는 분위기다') {
        if (randVal < 0.45) {
          dialogueText = isEn
            ? '“I know you worked hard... We cannot block a junior career forever. I will speak for you discreetly at the Council.”'
            : '고생한 건 아는데… 그래도 후배 길을 마냥 막을 순 없지. 국장단 회의 때 눈치껏 이야기해보겠네.';
          updatedState.metrics.stayPressure = Math.max(0, updatedState.metrics.stayPressure - 10);
          updatedWishes.currentBossIntent = '이동을 허용할 가능성이 높다';
          outcomeText = isEn ? 'After an honest talk, the Chief leaned toward allowing transfer.' : '진솔한 면담 끝에 부서장이 이동을 허용하는 쪽으로 마음을 돌렸습니다.';
          impactText = isEn ? 'Retention Pressure -10P, Path to transfer opened!' : '현 부서 잔류 압력 -10P, 이동 허용 분위기 전환!';
        } else {
          dialogueText = isEn
            ? '“Our desk is painfully short-staffed right now. Give me one more cycle, and I will open doors next time.”'
            : '이번엔 인력 수급이 워낙 빠듯해서 자네가 한 번만 더 뛰어줘야겠어. 다음엔 꼭 길 열어줄게.';
          updatedState.metrics.stayPressure = Math.min(100, updatedState.metrics.stayPressure + 5);
          outcomeText = isEn ? 'Due to desk constraints, Chief pleaded for you to stay one more cycle.' : '부서 사정으로 인해 현재 부서장이 이번 인사는 잔류해줄 것을 당부했습니다.';
          impactText = isEn ? 'Retention Pressure +5P' : '현 부서 잔류 압력 +5P';
        }
      } else if (curIntent === '잘 모르겠다') {
        if (randVal < 0.60) {
          dialogueText = isEn
            ? '“You want another beat? You have been here over 2 years, so it is high time. I will support your bid.”'
            : '자네가 다른 부서 지원하고 싶다고? 2년 넘었으니 이동할 때가 되긴 했지. 적극 밀어주겠네.';
          updatedState.metrics.stayPressure = Math.max(0, updatedState.metrics.stayPressure - 12);
          updatedWishes.currentBossIntent = '이동을 허용할 가능성이 높다';
          outcomeText = isEn ? 'Chief agreed favorably to support your transfer.' : '부서장의 본심을 확인한 결과, 호의적으로 길을 터주겠다는 약속을 받았습니다.';
          impactText = isEn ? 'Retention Pressure -12P, Transfer support confirmed' : '현 부서 잔류 압력 -12P, 이동 허용 확보';
        } else {
          dialogueText = isEn
            ? '“Frankly, I do not know which way the newsroom wind will blow. Let us await the Committee verdict.”'
            : '글쎄, 편집국 전체 판이 어떻게 돌아갈지 나도 아직 몰라. 일단 인사위원회 결과를 지켜보자고.';
          updatedState.metrics.stayPressure = Math.max(0, updatedState.metrics.stayPressure - 4);
          outcomeText = isEn ? 'Chief maintained a prudent, neutral stance.' : '부서장이 신중한 태도를 유지하며 중립적 의사를 표명했습니다.';
          impactText = isEn ? 'Retention Pressure -4P (Modest ease)' : '현 부서 잔류 압력 -4P (완만한 완화)';
        }
      } else {
        dialogueText = isEn
          ? '“You will thrive anywhere. I will strongly endorse you to the Managing Editor.”'
          : '자네는 어디 가서도 잘할 기자야. 국장한테 내가 힘닿는 데까지 강력하게 추천해둘게.';
        updatedState.metrics.stayPressure = Math.max(0, updatedState.metrics.stayPressure - 10);
        updatedWishes.currentBossIntent = '적극적으로 보내주려 한다';
        outcomeText = isEn ? 'Reaffirmed warm support and endorsement from current boss.' : '현재 부서장의 든든한 지지와 추천을 재확인했습니다.';
        impactText = isEn ? 'Retention Pressure -10P, Active endorsement maintained' : '현 부서 잔류 압력 -10P, 적극 이동 추천 유지';
      }

      popupDialogue = {
        speaker: isEn ? `Current Chief of ${getDeptName(currentDeptName)}` : `현재 ${currentDeptName} 부서장`,
        text: dialogueText,
        note: isEn ? '1-on-1 Frank Conversation' : '부장실 1:1 속내 면담'
      };
      break;
    }

    case 'write_article': {
      if (isStayMode) {
        actionTitle = isEn
          ? `Publish Exclusive Scoop on Current Beat (Irreplaceable)`
          : '현 출입처 단독 특종 보도 (대체 불가 입증)';
        updatedState.metrics.articleScore = Math.min(100, updatedState.metrics.articleScore + 25);
        updatedState.metrics.stayPressure = Math.min(100, updatedState.metrics.stayPressure + 15);
        updatedState.metrics.bossInterest.first = Math.min(100, updatedState.metrics.bossInterest.first + 10);

        dialogueText = isEn
          ? `[Desk Broadcast] Reporter Kim exclusive scoop made the front page lead! The Editor ordered: "Kim owns this beat, do NOT move them."`
          : `[데스크 단체방 공지] 우리 부서 김 기자의 단독 기사가 1면 톱에 걸렸습니다! 국장도 "이 출입처는 김 기자가 꽉 쥐고 있으니 절대 건드리지 마라"고 지시했습니다.`;
        outcomeText = isEn
          ? 'Breaking an exclusive scoop proved to the Managing Editor that you are irreplaceable on this beat.'
          : '출입처 단독 특종을 터뜨려 편집국장과 간부진에게 대체 불가능한 핵심 기자임을 확실히 각인시켰습니다.';
        impactText = isEn
          ? 'Scoop Score +25P, Retention Defense +15P (Command of beat secures retention)'
          : '기사 작성 성과 +25P, 현 부서 잔류 압력 +15P (출입처 장악력 인정으로 잔류 성사율 상승)';

        popupDialogue = {
          speaker: isEn ? 'Newsroom Desk Messenger' : '편집국 데스크 단체 메신저',
          text: dialogueText,
          note: isEn ? 'Exclusive Scoop Commendation' : '현 출입처 특종 성과 인정'
        };
        break;
      }

      actionTitle = isEn
        ? 'Write Major Investigative Scoops (Pure Merit)'
        : '인사 농사 대신 묵묵히 특종 기사 집필';
      updatedState.metrics.articleScore = Math.min(100, updatedState.metrics.articleScore + 25);
      updatedState.metrics.bossInterest.first = Math.min(100, updatedState.metrics.bossInterest.first + 10);

      const score = updatedState.metrics.articleScore;
      if (score >= 50) {
        dialogueText = isEn
          ? '[Desk Broadcast] Our major investigative scoop is headlining portal frontpages! Target 1st wish Chief noted: "We desperately need talent like this."'
          : '[데스크 단체방 공지] 이번 심층 기획 단독기사가 포털 메인에 대서특필되었습니다! 1지망 부서장도 "우리 쪽에 이런 실력자가 꼭 필요하다"며 적극적인 호감을 표시했습니다.';
      } else {
        dialogueText = isEn
          ? '[Desk Broadcast] While others fuss over reshuffles, Kim quietly delivered impactful reporting. Senior editors took notice.'
          : '[데스크 단체방 공지] 정기인사 앞두고 다들 어수선한데, 묵묵히 취재에 집중하여 굵직한 기사를 완성했습니다. 간부진의 신망이 두터워졌습니다.';
      }

      outcomeText = isEn
        ? 'Achieved pure journalistic impact, winning solid trust from newsroom leadership and 1st wish Chief.'
        : '정치적 줄대기 대신 고품질 특종을 완성하여 편집국 간부진과 1지망 부서장의 강력한 신뢰를 획득했습니다.';
      impactText = isEn
        ? 'Scoop Score +25P, 1st Wish Chief Warmth +10P!'
        : '기사 작성 성과 +25P (실무 적합도 보너스 최대 +26P), 1지망 부서장 관심도 +10P 연계!';

      popupDialogue = {
        speaker: isEn ? 'Newsroom Desk Messenger' : '편집국 데스크 단체 메신저',
        text: dialogueText,
        note: isEn ? 'Scoop Commendation' : '특종 보도 성과 인정'
      };
      break;
    }

    case 'do_nothing':
    default: {
      actionTitle = isStayMode
        ? (isEn ? 'Unmoved by Reshuffle Winds (Guard Desk Quietly)' : '인사 풍파에 흔들리지 않고 묵묵히 마감 대기')
        : (isEn ? 'Ignore Reshuffle Rumors (Business as Usual)' : '인사에 연연하지 않고 평소처럼 근무');
      dialogueText = isStayMode
        ? (isEn ? 'Remaining calm and guarding your beat is the most dignified path to retention.' : '인사철 바람에 일희일비하지 않고 제자리를 굳건히 지키는 것이 가장 강력한 잔류의 길입니다.')
        : (isEn ? 'Reporters lobby, but the Managing Editor decides. Maintain composure.' : '인사 농사는 사람이 짓지만 결과는 하늘(편집국장)이 정하는 법. 평정심을 유지합니다.');
      outcomeText = isStayMode
        ? (isEn ? 'Maintained an unshakeable presence on the beat as usual.' : '평소처럼 출입처를 단단히 지키며 흔들림 없는 존재감을 보여주었습니다.')
        : (isEn ? 'Awaiting the Committee orders calmly without artificial politicking.' : '어떠한 소문이나 인위적 개입 없이 담담하게 정기인사를 기다립니다.');
      impactText = isEn ? 'No Metric Change (Status Quo)' : '상태 변화 없음 (기존 경력과 부서 기반 유지)';

      popupDialogue = {
        speaker: isEn ? 'Inner Monologue' : '나의 다짐',
        text: dialogueText,
        note: isEn ? 'Inner Composure' : '평정심 유지'
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
