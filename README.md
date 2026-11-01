# 인사 크래프트 (PERSONNEL CRAFT) — 편집국 생존기

> **“경력은 내가 쌓지만, 발령은 내 맘대로 안 된다!”**  
> 3D 복셀 편집국에서 펼쳐지는 한국 언론사 기자들의 가상 정기인사 시뮬레이션 게임

- **라이브 서비스**: [https://raspos.github.io/personnel-craft/](https://raspos.github.io/personnel-craft/)
- **개발 & 기획**: databrew ([https://raspos.github.io/databrew](https://raspos.github.io/databrew))

---

## 🎮 게임 개요
한국 언론사 편집국에서는 매년 정기인사 시즌마다 치열한 물밑 눈치싸움과 인사 농사가 펼쳐집니다.  
**〈인사 크래프트〉**는 기자의 실제 커리어 블록(근무 부서, 세부 취재 분야, 근속 기간)과 부서별 TO, 사내정치 관계망, 그리고 추석 이후 펼쳐지는 4턴의 '인사 농사' 행동을 종합하여 최종 인사발령 가능성을 산출하는 데이터저널리즘 풍자 시뮬레이션 웹 애플리케이션입니다.

---

## 🕹️ 핵심 플레이 단계

1. **STAGE 1. 기자 캐릭터 생성**: 닉네임, 입사 연도, 현재 소속 부서 및 3D 복셀 아바타 외형(복장, 안경, 기자증) 커스텀.
2. **STAGE 2. 나의 커리어 블록**: 순서 드래그 앤 드롭(Drag-and-Drop)으로 과거 근무 부서와 세부 출입처 이력 구성.
3. **STAGE 3. 희망 부서 3곳 선택**: 1·2·3지망 및 기피 부서 설정, 부서별 예상 TO, 부서장과의 사적/공적 관계망 설정.
4. **STAGE 3.5. 추석 이후 인사 농사 (4턴 / 8AP)**:
   - 희망 부서장 면담, 동료 기자 티타임, 인사판 탐색, 소문 흘리기, 묵묵히 특종 기사 쓰기 등 전략적 행동 수행.
   - 정보 신뢰도가 높을수록 소문 성공 확률 증가, 잦은 부서장 면담은 피로감 역효과 등 현실적 트레이드오프 구현.
5. **STAGE 4. 인사위원회 시뮬레이션**: 사내정치 관계 변수 ON/OFF 비교 및 돌발 변수(긴급 결원, 대규모 조직개편 등) 검증.
6. **STAGE 5. 운명의 발령장 개봉**: 실링 왁스 봉투 개봉 및 특별 호외 신문 1면 스타일 결과 발표, 10년 커리어 타임머신 시뮬레이션.

---

## 📐 수학적 확률 모델 (Closed-Form Analytical Model)

본 시뮬레이터는 난수 시뮬레이션의 노이즈와 오차를 완전히 배제하기 위해 **닫힌 해(Closed-form Analytical Solution)** 수학 모델을 적용합니다.

$$\text{P(이동)} = \text{movePressure}(\text{현 부서 근속, 현 부장 이동의사, 잔류압력})$$

$$\text{P}(\text{Wish}_i) = \text{movePressure} \times \frac{W_i}{\sum W_{\text{pool}}}$$

- **부서별 가중치 $W_i$ 구성**:
  - `CareerFit` (경력 적합도 & 세부 출입처 전문성 매칭 보너스: 0 ~ 30)
  - `TO Score` (확정 TO 점수: 0 ~ 42)
  - `Relation Score` (부서장 관계 유형, 친밀도, 영입 의사: -20 ~ +40)
  - `Farming Bonus` (특종 기사 실적, 밭갈기 단계, 평판 인지도: -6 ~ +30)
  - `Competitor Factor` (경쟁률에 따른 자리 쟁탈 패널티)

---

## 🛠️ 기술 스택
- **Core**: React 19, TypeScript, Vite 8
- **3D Graphics**: Three.js (Custom Voxel Newsroom & Procedural Character Animation)
- **Styling**: Tailwind CSS v4, Lucide Icons
- **Effects**: Canvas Confetti, HTML-to-Image (SNS 결과 카드 생성)
- **Deployment**: GitHub Pages (GitHub Actions CI/CD)

---

## 📄 라이선스
Copyright © 2026 **databrew** (All rights reserved).
