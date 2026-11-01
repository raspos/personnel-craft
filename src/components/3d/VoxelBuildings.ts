import * as THREE from 'three';
import { DepartmentDef, getDepartmentByName } from '../../data/departments';
import { CareerRecord } from '../../types/game';

// 텍스처 캔버스 헬퍼 (레트로 픽셀 질감)
export function createPixelPatternTexture(baseColorHex: string, noiseStrength: number = 0.15): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 16;
  canvas.height = 16;
  const ctx = canvas.getContext('2d')!;

  ctx.fillStyle = baseColorHex;
  ctx.fillRect(0, 0, 16, 16);

  ctx.strokeStyle = 'rgba(0, 0, 0, 0.15)';
  ctx.strokeRect(0, 0, 16, 16);

  for (let x = 0; x < 16; x += 4) {
    for (let y = 0; y < 16; y += 4) {
      if (Math.random() > 0.5) {
        ctx.fillStyle = `rgba(255, 255, 255, ${Math.random() * noiseStrength})`;
      } else {
        ctx.fillStyle = `rgba(0, 0, 0, ${Math.random() * noiseStrength})`;
      }
      ctx.fillRect(x, y, 4, 4);
    }
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.magFilter = THREE.NearestFilter;
  texture.minFilter = THREE.NearestFilter;
  return texture;
}

// 부서명 선명한 3D 픽셀 간판 텍스처 생성기
export function createDepartmentSignTexture(rankLabel: string, deptName: string, colorHex: string): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 96;
  const ctx = canvas.getContext('2d')!;

  // 짙은 흑연/스톤 픽셀 배경
  ctx.fillStyle = '#0f172a';
  ctx.fillRect(0, 0, 256, 96);

  // 부서 대표 색상 굵은 픽셀 테두리
  ctx.strokeStyle = colorHex || '#38bdf8';
  ctx.lineWidth = 6;
  ctx.strokeRect(4, 4, 248, 88);

  // 내부 하이라이트 라인
  ctx.strokeStyle = '#ffffff';
  ctx.lineWidth = 2;
  ctx.strokeRect(10, 10, 236, 76);

  // 지망 배지 (예: [1지망] / [2지망] / [3지망])
  ctx.fillStyle = colorHex || '#fbbf24';
  ctx.font = 'bold 18px "Pretendard", sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'top';
  ctx.fillText(rankLabel, 128, 14);

  // 부서명 한글 텍스트 (예: "정치부")
  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 32px "Pretendard", sans-serif';
  ctx.fillText(deptName, 128, 42);

  const texture = new THREE.CanvasTexture(canvas);
  texture.magFilter = THREE.NearestFilter;
  texture.minFilter = THREE.NearestFilter;
  return texture;
}

// 캐릭터/부서장 머리 위 3D 말풍선 스프라이트 생성기
export function createSpeechBubbleSprite(text: string, speakerName?: string): THREE.Sprite {
  const canvas = document.createElement('canvas');
  canvas.width = 320;
  canvas.height = 140;
  const ctx = canvas.getContext('2d')!;

  // 말풍선 본체 (마인크래프트 양털/종이 느낌의 크림 아이보리)
  ctx.fillStyle = '#fffbeb';
  ctx.fillRect(10, 10, 300, 100);

  // 굵은 픽셀 테두리
  ctx.strokeStyle = '#1e293b';
  ctx.lineWidth = 6;
  ctx.strokeRect(10, 10, 300, 100);

  // 말풍선 아래 꼬리 삼각형
  ctx.fillStyle = '#fffbeb';
  ctx.beginPath();
  ctx.moveTo(150, 110);
  ctx.lineTo(170, 110);
  ctx.lineTo(150, 132);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  // 화자 이름
  if (speakerName) {
    ctx.fillStyle = '#b45309';
    ctx.font = 'bold 16px sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText(`[${speakerName}]`, 24, 34);
  }

  // 대사 본문 (두 줄 자동 래핑)
  ctx.fillStyle = '#0f172a';
  ctx.font = 'bold 18px sans-serif';
  ctx.textAlign = 'left';

  const maxLen = 14;
  if (text.length > maxLen) {
    ctx.fillText(text.slice(0, maxLen), 24, speakerName ? 62 : 46);
    ctx.fillText(text.slice(maxLen, maxLen * 2) + (text.length > maxLen * 2 ? '...' : ''), 24, speakerName ? 90 : 76);
  } else {
    ctx.fillText(text, 24, speakerName ? 74 : 60);
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.magFilter = THREE.NearestFilter;
  texture.minFilter = THREE.NearestFilter;

  const spriteMaterial = new THREE.SpriteMaterial({ map: texture, transparent: true });
  const sprite = new THREE.Sprite(spriteMaterial);
  sprite.scale.set(3.0, 1.3, 1.0);
  return sprite;
}

// 1. 뉴스룸 본관 빌딩
export function createNewsroomBuilding(): THREE.Group {
  const group = new THREE.Group();

  const wallMat = new THREE.MeshLambertMaterial({ color: 0x475569 });
  const darkWallMat = new THREE.MeshLambertMaterial({ color: 0x1e293b });
  const glassMat = new THREE.MeshLambertMaterial({ color: 0x38bdf8, transparent: true, opacity: 0.85 });
  const roofMat = new THREE.MeshLambertMaterial({ color: 0x0f172a });
  const signMat = new THREE.MeshLambertMaterial({ color: 0x3b82f6 });
  const textMat = new THREE.MeshLambertMaterial({ color: 0xffffff });

  // 본관 메인 타워 (폭 8, 높이 10, 깊이 5)
  const towerGeo = new THREE.BoxGeometry(8, 10, 5);
  const tower = new THREE.Mesh(towerGeo, wallMat);
  tower.position.set(0, 5, -3);
  tower.castShadow = true;
  tower.receiveShadow = true;
  group.add(tower);

  // 창문 블록들
  for (let row = 2; row <= 4; row++) {
    for (let col = -3; col <= 3; col += 2) {
      const winGeo = new THREE.BoxGeometry(1.2, 1.2, 0.2);
      const win = new THREE.Mesh(winGeo, glassMat);
      win.position.set(col, row * 1.8, -0.4);
      group.add(win);
    }
  }

  // 1층 출입문
  const doorFrameGeo = new THREE.BoxGeometry(2.4, 2.8, 0.4);
  const doorFrame = new THREE.Mesh(doorFrameGeo, darkWallMat);
  doorFrame.position.set(0, 1.4, -0.4);
  const doorGlassGeo = new THREE.BoxGeometry(1.8, 2.2, 0.2);
  const doorGlass = new THREE.Mesh(doorGlassGeo, glassMat);
  doorGlass.position.set(0, 1.3, -0.3);
  group.add(doorFrame, doorGlass);

  // 상단 지붕 데크
  const roofGeo = new THREE.BoxGeometry(8.6, 0.6, 5.6);
  const roof = new THREE.Mesh(roofGeo, roofMat);
  roof.position.set(0, 10.3, -3);
  group.add(roof);

  // 'NEWSROOM' 3D 간판
  const signBoardGeo = new THREE.BoxGeometry(5.8, 1.3, 0.4);
  const signBoard = new THREE.Mesh(signBoardGeo, signMat);
  signBoard.position.set(0, 8.8, -0.3);
  group.add(signBoard);

  const letterBlocks = [-2.0, -1.3, -0.6, 0.1, 0.8, 1.5, 2.1];
  letterBlocks.forEach((xPos) => {
    const letterGeo = new THREE.BoxGeometry(0.42, 0.65, 0.2);
    const letterMesh = new THREE.Mesh(letterGeo, textMat);
    letterMesh.position.set(xPos, 8.8, -0.05);
    group.add(letterMesh);
  });

  // 옥상 통신 안테나 타워
  const antGeo = new THREE.CylinderGeometry(0.08, 0.15, 2.5, 4);
  const ant = new THREE.Mesh(antGeo, new THREE.MeshLambertMaterial({ color: 0x94a3b8 }));
  ant.position.set(0, 11.6, -3);
  const beacon = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.3, 0.3), new THREE.MeshBasicMaterial({ color: 0xef4444 }));
  beacon.position.set(0, 12.9, -3);
  group.add(ant, beacon);

  // 인사발령 게시판 (Bulletin board)
  const boardPostGeo = new THREE.BoxGeometry(0.15, 2.2, 0.15);
  const woodMat = new THREE.MeshLambertMaterial({ color: 0x78350f });
  const postL = new THREE.Mesh(boardPostGeo, woodMat);
  postL.position.set(2.8, 1.1, 0.5);
  const postR = new THREE.Mesh(boardPostGeo, woodMat);
  postR.position.set(4.2, 1.1, 0.5);

  const boardPanelGeo = new THREE.BoxGeometry(1.6, 1.2, 0.1);
  const panelMat = new THREE.MeshLambertMaterial({ color: 0x9a3412 });
  const panel = new THREE.Mesh(boardPanelGeo, panelMat);
  panel.position.set(3.5, 1.6, 0.5);

  const paperGeo = new THREE.BoxGeometry(1.2, 0.8, 0.05);
  const paper = new THREE.Mesh(paperGeo, textMat);
  paper.position.set(3.5, 1.6, 0.56);

  group.add(postL, postR, panel, paper);
  return group;
}

// 2. 가로등 및 블록 나무 환경
export function createVoxelTree(x: number, z: number, scale: number = 1.0): THREE.Group {
  const tree = new THREE.Group();
  tree.position.set(x, 0, z);
  tree.scale.set(scale, scale, scale);

  const trunkMat = new THREE.MeshLambertMaterial({ color: 0x5b3a29 });
  const trunkGeo = new THREE.BoxGeometry(0.5, 2.0, 0.5);
  const trunk = new THREE.Mesh(trunkGeo, trunkMat);
  trunk.position.y = 1.0;
  trunk.castShadow = true;
  tree.add(trunk);

  const leavesMat = new THREE.MeshLambertMaterial({ color: 0x22c55e });
  const leavesMat2 = new THREE.MeshLambertMaterial({ color: 0x16a34a });

  const leafBottomGeo = new THREE.BoxGeometry(2.0, 1.0, 2.0);
  const leafBottom = new THREE.Mesh(leafBottomGeo, leavesMat);
  leafBottom.position.y = 2.4;
  leafBottom.castShadow = true;

  const leafTopGeo = new THREE.BoxGeometry(1.4, 0.9, 1.4);
  const leafTop = new THREE.Mesh(leafTopGeo, leavesMat2);
  leafTop.position.y = 3.3;
  leafTop.castShadow = true;

  tree.add(leafBottom, leafTop);
  return tree;
}

export function createStreetLamp(x: number, z: number): THREE.Group {
  const lamp = new THREE.Group();
  lamp.position.set(x, 0, z);

  const metalMat = new THREE.MeshLambertMaterial({ color: 0x334155 });
  const lightMat = new THREE.MeshBasicMaterial({ color: 0xfef08a });

  const poleGeo = new THREE.BoxGeometry(0.14, 3.2, 0.14);
  const pole = new THREE.Mesh(poleGeo, metalMat);
  pole.position.y = 1.6;

  const headGeo = new THREE.BoxGeometry(0.45, 0.45, 0.45);
  const head = new THREE.Mesh(headGeo, lightMat);
  head.position.set(0, 3.2, 0);

  lamp.add(pole, head);
  return lamp;
}

// 3. 커리어 블록 지도 (Stage 2)
export function createCareerVoxelMap(careers: CareerRecord[]): THREE.Group {
  const mapGroup = new THREE.Group();

  let currentZ = 0;
  const blockWidth = 2.6;

  careers.forEach((career, idx) => {
    const height = Math.max(0.8, (career.periodMonths / 12) * 1.0);
    const length = 2.0;

    const dept = getDepartmentByName(career.deptName);
    const colorHex = dept ? dept.color : '#3b82f6';
    const mat = new THREE.MeshLambertMaterial({ color: colorHex });

    const blockGeo = new THREE.BoxGeometry(blockWidth, height, length);
    const mesh = new THREE.Mesh(blockGeo, mat);
    mesh.position.set(0, height / 2, currentZ);
    mesh.castShadow = true;
    mesh.receiveShadow = true;

    // 상단 테두리 장식 블록
    const trimGeo = new THREE.BoxGeometry(blockWidth + 0.1, 0.15, length + 0.1);
    const trimMat = new THREE.MeshLambertMaterial({ color: 0xffffff });
    const trim = new THREE.Mesh(trimGeo, trimMat);
    trim.position.set(0, height, currentZ);

    mapGroup.add(mesh, trim);

    // 계단/연결 징검다리
    if (idx < careers.length - 1) {
      const stepGeo = new THREE.BoxGeometry(0.8, 0.3, 0.8);
      const stepMat = new THREE.MeshLambertMaterial({ color: 0x94a3b8 });
      const step = new THREE.Mesh(stepGeo, stepMat);
      step.position.set(0, 0.15, currentZ + length / 2 + 0.5);
      mapGroup.add(step);
    }

    currentZ += length + 1.2;
  });

  return mapGroup;
}

// 4. [특화] 부서별 개성 있는 복셀 건축물 생성기 (Stage 3 & Stage 3.5)
export function createDistinctDeptBuilding(deptDef: DepartmentDef, rankLabel: string): THREE.Group {
  const group = new THREE.Group();
  const baseColor = new THREE.Color(deptDef.color);

  // 기본 본체 벽면 (부서 고유 컬러의 톤다운된 복셀 벽)
  const wallMat = new THREE.MeshLambertMaterial({ color: baseColor.clone().multiplyScalar(0.75) });
  const trimMat = new THREE.MeshLambertMaterial({ color: 0xffffff });
  const doorMat = new THREE.MeshLambertMaterial({ color: 0x334155 });
  const glassMat = new THREE.MeshLambertMaterial({ color: 0x7dd3fc, transparent: true, opacity: 0.85 });

  // 1층 메인 건물 본체 (폭 2.8, 높이 3.6, 깊이 2.2)
  const mainGeo = new THREE.BoxGeometry(2.8, 3.6, 2.2);
  const main = new THREE.Mesh(mainGeo, wallMat);
  main.position.y = 1.8;
  main.castShadow = true;
  main.receiveShadow = true;
  group.add(main);

  // 1층 출입문
  const doorGeo = new THREE.BoxGeometry(0.9, 1.5, 0.1);
  const door = new THREE.Mesh(doorGeo, doorMat);
  door.position.set(0, 0.75, 1.11);
  group.add(door);

  // 창문 2개
  const winGeo = new THREE.BoxGeometry(0.7, 0.7, 0.1);
  const winL = new THREE.Mesh(winGeo, glassMat);
  winL.position.set(-0.8, 2.3, 1.11);
  const winR = new THREE.Mesh(winGeo, glassMat);
  winR.position.set(0.8, 2.3, 1.11);
  group.add(winL, winR);

  // 지붕 테두리 처마 블록
  const roofRimGeo = new THREE.BoxGeometry(3.0, 0.3, 2.4);
  const roofRim = new THREE.Mesh(roofRimGeo, trimMat);
  roofRim.position.set(0, 3.75, 0);
  group.add(roofRim);

  // === 부서별 랜드마크 복셀 조형물 ===
  const deptName = deptDef.name;

  if (deptName.includes('정치')) {
    // [정치부] 국회의사당 스타일: 백색 4대 열주 기둥 + 청록색 돔 + 게양 깃발
    const pillarMat = new THREE.MeshLambertMaterial({ color: 0xf8fafc });
    [-1.0, -0.33, 0.33, 1.0].forEach(x => {
      const pillar = new THREE.Mesh(new THREE.BoxGeometry(0.2, 1.8, 0.2), pillarMat);
      pillar.position.set(x, 2.5, 1.15);
      group.add(pillar);
    });

    const domeMat = new THREE.MeshLambertMaterial({ color: 0x0d9488 });
    const domeGeo = new THREE.CylinderGeometry(0.9, 1.15, 0.8, 8);
    const dome = new THREE.Mesh(domeGeo, domeMat);
    dome.position.set(0, 4.3, 0);
    dome.castShadow = true;

    const flagPole = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 0.9, 4), new THREE.MeshLambertMaterial({ color: 0xffffff }));
    flagPole.position.set(0, 5.15, 0);
    const flag = new THREE.Mesh(new THREE.BoxGeometry(0.45, 0.28, 0.04), new THREE.MeshLambertMaterial({ color: 0xef4444 }));
    flag.position.set(0.25, 5.3, 0);
    group.add(dome, flagPole, flag);

  } else if (deptName.includes('경제') || deptName.includes('증권')) {
    // [경제/증권부] 고전 은행 스타일: 삼각 페디먼트 지붕 + 금괴(골드 블록) + 주가 전광판
    const pedimentGeo = new THREE.ConeGeometry(1.6, 0.9, 4);
    const pedimentMat = new THREE.MeshLambertMaterial({ color: 0xd97706 });
    const pediment = new THREE.Mesh(pedimentGeo, pedimentMat);
    pediment.position.set(0, 4.3, 0);
    pediment.rotation.y = Math.PI / 4;
    group.add(pediment);

    const goldMat = new THREE.MeshLambertMaterial({ color: 0xfacc15 });
    const bar1 = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.2, 0.25), goldMat);
    bar1.position.set(-0.8, 0.1, 1.3);
    const bar2 = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.2, 0.25), goldMat);
    bar2.position.set(-0.75, 0.3, 1.3);
    group.add(bar1, bar2);

    const tickerMat = new THREE.MeshBasicMaterial({ color: 0x22c55e });
    const ticker = new THREE.Mesh(new THREE.BoxGeometry(1.6, 0.25, 0.1), tickerMat);
    ticker.position.set(0, 3.3, 1.12);
    group.add(ticker);

  } else if (deptName.includes('산업') && !deptName.includes('IT')) {
    // [산업부] 공장 벽돌 + 트윈 굴뚝 + 연기 구름 복셀
    const chimneyMat = new THREE.MeshLambertMaterial({ color: 0x78350f });
    [-0.6, 0.6].forEach(x => {
      const chimney = new THREE.Mesh(new THREE.BoxGeometry(0.4, 1.2, 0.4), chimneyMat);
      chimney.position.set(x, 4.5, -0.3);
      chimney.castShadow = true;

      const smoke1 = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.3, 0.3), new THREE.MeshLambertMaterial({ color: 0xe2e8f0 }));
      smoke1.position.set(x + 0.1, 5.3, -0.3);
      const smoke2 = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.35, 0.4), new THREE.MeshLambertMaterial({ color: 0xcfd8dc }));
      smoke2.position.set(x + 0.2, 5.75, -0.2);
      group.add(chimney, smoke1, smoke2);
    });

  } else if (deptName.includes('IT') || deptName.includes('디지털')) {
    // [IT산업부 / 디지털뉴스부] 사이버 큐브 타워 + 네온 안테나 + 서버 비콘
    const cyberTower = new THREE.Mesh(new THREE.BoxGeometry(1.2, 1.2, 1.2), new THREE.MeshLambertMaterial({ color: 0x0284c7 }));
    cyberTower.position.set(0, 4.5, 0);

    const antGeo = new THREE.CylinderGeometry(0.04, 0.04, 1.0, 4);
    const ant = new THREE.Mesh(antGeo, new THREE.MeshLambertMaterial({ color: 0x38bdf8 }));
    ant.position.set(0, 5.5, 0);

    const beacon = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.3, 0.3), new THREE.MeshBasicMaterial({ color: 0x38bdf8 }));
    beacon.position.set(0, 6.0, 0);
    group.add(cyberTower, ant, beacon);

  } else if (deptName.includes('사회') || deptName.includes('전국')) {
    // [사회부] 경찰서 스타일 적/청 복셀 경광등
    const beaconR = new THREE.Mesh(new THREE.BoxGeometry(0.45, 0.35, 0.35), new THREE.MeshBasicMaterial({ color: 0xef4444 }));
    beaconR.position.set(-0.45, 4.1, 0.3);
    const beaconB = new THREE.Mesh(new THREE.BoxGeometry(0.45, 0.35, 0.35), new THREE.MeshBasicMaterial({ color: 0x3b82f6 }));
    beaconB.position.set(0.45, 4.1, 0.3);
    group.add(beaconR, beaconB);

  } else if (deptName.includes('국제') || deptName.includes('외교')) {
    // [국제부] 옥상 복셀 지구본
    const globeMat = new THREE.MeshLambertMaterial({ color: 0x0284c7 });
    const globeGeo = new THREE.BoxGeometry(0.95, 0.95, 0.95);
    const globe = new THREE.Mesh(globeGeo, globeMat);
    globe.position.set(0, 4.5, 0);

    const landMat = new THREE.MeshLambertMaterial({ color: 0x22c55e });
    const land1 = new THREE.Mesh(new THREE.BoxGeometry(0.45, 0.45, 0.1), landMat);
    land1.position.set(0, 4.5, 0.48);
    const land2 = new THREE.Mesh(new THREE.BoxGeometry(0.35, 0.35, 0.1), landMat);
    land2.position.set(0.48, 4.5, 0);
    land2.rotation.y = Math.PI / 2;
    group.add(globe, land1, land2);

  } else if (deptName.includes('스포츠')) {
    // [스포츠부] 경기장 골대 아치 + 전광판
    const archMat = new THREE.MeshLambertMaterial({ color: 0xf97316 });
    const arch = new THREE.Mesh(new THREE.BoxGeometry(2.0, 0.6, 0.4), archMat);
    arch.position.set(0, 4.2, 0);
    const ball = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.5, 0.5), new THREE.MeshLambertMaterial({ color: 0xffffff }));
    ball.position.set(0, 4.8, 0);
    group.add(arch, ball);

  } else if (deptName.includes('문화')) {
    // [문화부] 영화 슬레이트 + 스포트라이트
    const slate = new THREE.Mesh(new THREE.BoxGeometry(1.0, 0.8, 0.1), new THREE.MeshLambertMaterial({ color: 0x18181b }));
    slate.position.set(0, 4.3, 0.3);
    const spot = new THREE.Mesh(new THREE.ConeGeometry(0.3, 0.6, 4), new THREE.MeshBasicMaterial({ color: 0xfef08a }));
    spot.position.set(0.7, 4.5, 0);
    spot.rotation.z = -Math.PI / 4;
    group.add(slate, spot);

  } else {
    // 기본 모던 타워 첨탑
    const spire = new THREE.Mesh(new THREE.ConeGeometry(0.6, 1.2, 4), new THREE.MeshLambertMaterial({ color: 0x64748b }));
    spire.position.set(0, 4.5, 0);
    spire.rotation.y = Math.PI / 4;
    group.add(spire);
  }

  // 선명한 2D 캔버스 한글 픽셀 간판 부착
  const signTexture = createDepartmentSignTexture(rankLabel, deptName, deptDef.color);
  const signMat = new THREE.MeshBasicMaterial({ map: signTexture, transparent: false });
  const signGeo = new THREE.BoxGeometry(2.5, 0.8, 0.15);
  const signMesh = new THREE.Mesh(signGeo, signMat);
  signMesh.position.set(0, 3.4, 1.15);
  group.add(signMesh);

  return group;
}

// 5. 부서장 NPC 생성 (고유 복장, 소품, 표정)
export function createBossNPC(deptDef: DepartmentDef): { group: THREE.Group; animate: (t: number) => void } {
  const group = new THREE.Group();

  const skinMat = new THREE.MeshLambertMaterial({ color: 0xfed7aa });
  const hairMat = new THREE.MeshLambertMaterial({ color: deptDef.bossCostume.hairColor });
  const shirtMat = new THREE.MeshLambertMaterial({ color: deptDef.bossCostume.shirtColor });
  const pantsMat = new THREE.MeshLambertMaterial({ color: 0x1e293b });
  const eyeMat = new THREE.MeshLambertMaterial({ color: 0x0f172a });

  // 머리 그룹
  const headGroup = new THREE.Group();
  headGroup.position.y = 1.4;

  const headGeo = new THREE.BoxGeometry(0.58, 0.58, 0.58);
  const head = new THREE.Mesh(headGeo, skinMat);
  head.position.y = 0.29;

  // 헤어
  const hairGeo = new THREE.BoxGeometry(0.62, 0.22, 0.62);
  const hair = new THREE.Mesh(hairGeo, hairMat);
  hair.position.y = 0.52;

  // 눈
  const eyeGeo = new THREE.BoxGeometry(0.08, 0.08, 0.04);
  const eyeL = new THREE.Mesh(eyeGeo, eyeMat);
  eyeL.position.set(-0.14, 0.3, 0.31);
  const eyeR = new THREE.Mesh(eyeGeo, eyeMat);
  eyeR.position.set(0.14, 0.3, 0.31);

  // 미소/입
  const mouthGeo = new THREE.BoxGeometry(0.16, 0.04, 0.04);
  const mouth = new THREE.Mesh(mouthGeo, new THREE.MeshLambertMaterial({ color: 0x9a3412 }));
  mouth.position.set(0, 0.16, 0.31);

  headGroup.add(head, hair, eyeL, eyeR, mouth);

  // 안경 부서장
  if (deptDef.bossCostume.accessory === 'glasses' || deptDef.name.includes('경제') || deptDef.name.includes('문화')) {
    const frameMat = new THREE.MeshLambertMaterial({ color: 0xb45309 });
    const rimGeo = new THREE.BoxGeometry(0.18, 0.14, 0.04);
    const rL = new THREE.Mesh(rimGeo, frameMat);
    rL.position.set(-0.14, 0.3, 0.33);
    const rR = new THREE.Mesh(rimGeo, frameMat);
    rR.position.set(0.14, 0.3, 0.33);
    headGroup.add(rL, rR);
  }

  // 산업부장 안전모
  if (deptDef.bossCostume.accessory === 'helmet') {
    const helmetMat = new THREE.MeshLambertMaterial({ color: 0xfacc15 });
    const helmetGeo = new THREE.BoxGeometry(0.68, 0.28, 0.68);
    const helmet = new THREE.Mesh(helmetGeo, helmetMat);
    helmet.position.y = 0.6;
    headGroup.add(helmet);
  }

  // 몸통
  const bodyGeo = new THREE.BoxGeometry(0.58, 0.68, 0.32);
  const body = new THREE.Mesh(bodyGeo, shirtMat);
  body.position.y = 0.95;

  // 다리
  const legGeo = new THREE.BoxGeometry(0.22, 0.65, 0.24);
  const legL = new THREE.Mesh(legGeo, pantsMat);
  legL.position.set(-0.19, 0.32, 0);
  const legR = new THREE.Mesh(legGeo, pantsMat);
  legR.position.set(0.19, 0.32, 0);

  // 팔 및 소품
  const armGeo = new THREE.BoxGeometry(0.18, 0.65, 0.2);
  const armL = new THREE.Mesh(armGeo, shirtMat);
  armL.position.set(-0.45, 0.95, 0);

  const armR = new THREE.Group();
  armR.position.set(0.45, 1.2, 0);
  const armRMesh = new THREE.Mesh(armGeo, shirtMat);
  armRMesh.position.y = -0.27;
  armR.add(armRMesh);

  // 소품: 서류가방 / 노트북 / 마이크
  if (deptDef.bossCostume.accessory === 'briefcase') {
    const caseGeo = new THREE.BoxGeometry(0.12, 0.38, 0.44);
    const caseMat = new THREE.MeshLambertMaterial({ color: 0x451a03 });
    const bCase = new THREE.Mesh(caseGeo, caseMat);
    bCase.position.set(0, -0.48, 0.1);
    armR.add(bCase);
  } else if (deptDef.bossCostume.accessory === 'laptop') {
    const lapGeo = new THREE.BoxGeometry(0.08, 0.32, 0.38);
    const lapMat = new THREE.MeshLambertMaterial({ color: 0x94a3b8 });
    const lap = new THREE.Mesh(lapGeo, lapMat);
    lap.position.set(0, -0.4, 0.1);
    armR.add(lap);
  } else if (deptDef.bossCostume.accessory === 'mic') {
    const micGeo = new THREE.CylinderGeometry(0.04, 0.04, 0.26, 8);
    const micMat = new THREE.MeshLambertMaterial({ color: 0x111827 });
    const mic = new THREE.Mesh(micGeo, micMat);
    mic.rotation.x = Math.PI / 4;
    mic.position.set(0, -0.38, 0.15);
    armR.add(mic);
  }

  group.add(headGroup, body, legL, legR, armL, armR);

  const animate = (t: number) => {
    headGroup.rotation.y = Math.sin(t * 1.5) * 0.2;
    armR.rotation.x = -0.15 + Math.sin(t * 2) * 0.15;
  };

  return { group, animate };
}

// 6. 인사위원회 회의실 세트 (Stage 4)
export function createCommitteeRoom(): THREE.Group {
  const room = new THREE.Group();

  const tableGeo = new THREE.BoxGeometry(5.5, 0.8, 2.8);
  const tableMat = new THREE.MeshLambertMaterial({ color: 0x451a03 });
  const table = new THREE.Mesh(tableGeo, tableMat);
  table.position.set(0, 0.8, 0);
  table.castShadow = true;
  table.receiveShadow = true;
  room.add(table);

  for (let i = -2; i <= 2; i += 1.3) {
    const docGeo = new THREE.BoxGeometry(0.6, 0.08, 0.45);
    const docMat = new THREE.MeshLambertMaterial({ color: 0xffffff });
    const doc = new THREE.Mesh(docGeo, docMat);
    doc.position.set(i, 1.25, 0.4);

    const plateGeo = new THREE.BoxGeometry(0.5, 0.15, 0.12);
    const plateMat = new THREE.MeshLambertMaterial({ color: 0x1e3a8a });
    const plate = new THREE.Mesh(plateGeo, plateMat);
    plate.position.set(i, 1.28, -0.4);

    room.add(doc, plate);
  }

  const committeeColors = [0x1e293b, 0x334155, 0x1e3a8a];
  [-1.6, 0, 1.6].forEach((xPos, idx) => {
    const judge = new THREE.Group();
    judge.position.set(xPos, 0.8, -1.0);

    const jBodyGeo = new THREE.BoxGeometry(0.5, 0.6, 0.3);
    const jBody = new THREE.Mesh(jBodyGeo, new THREE.MeshLambertMaterial({ color: committeeColors[idx] }));
    jBody.position.y = 0.5;

    const jHeadGeo = new THREE.BoxGeometry(0.45, 0.45, 0.45);
    const jHead = new THREE.Mesh(jHeadGeo, new THREE.MeshLambertMaterial({ color: 0xfed7aa }));
    jHead.position.y = 1.05;

    const jHairGeo = new THREE.BoxGeometry(0.48, 0.15, 0.48);
    const jHair = new THREE.Mesh(jHairGeo, new THREE.MeshLambertMaterial({ color: 0x475569 }));
    jHair.position.y = 1.22;

    judge.add(jBody, jHead, jHair);
    room.add(judge);
  });

  return room;
}

// 7. [대폭 강화] 마인크래프트 스타일 농사 블록 밭 & 수확물 연출 (Stage 3.5)
export function createVoxelFarmField(growthStage: number = 0): THREE.Group {
  const farmGroup = new THREE.Group();

  // 1. 잔디 블록 베이스 (Grass Base: 2.4 x 0.2 x 2.4)
  const grassMat = new THREE.MeshLambertMaterial({ color: 0x5b8c32 }); // 마인크래프트 잔디 녹색
  const grassGeo = new THREE.BoxGeometry(2.4, 0.2, 2.4);
  const grass = new THREE.Mesh(grassGeo, grassMat);
  grass.position.y = 0.1;
  grass.receiveShadow = true;
  farmGroup.add(grass);

  // 2. 갈아놓은 비옥한 경작지 흙 (Farmland: 2.0 x 0.15 x 2.0)
  const soilMat = new THREE.MeshLambertMaterial({ color: 0x452814 }); // 짙은 습식 경작토
  const soilGeo = new THREE.BoxGeometry(2.0, 0.15, 2.0);
  const soil = new THREE.Mesh(soilGeo, soilMat);
  soil.position.y = 0.22;
  soil.receiveShadow = true;
  farmGroup.add(soil);

  // 3. 나무 울타리(Wood Fence) 4개 모서리 말뚝
  const fenceMat = new THREE.MeshLambertMaterial({ color: 0x854d0e });
  const postPositions = [
    [-1.05, -1.05], [1.05, -1.05],
    [-1.05, 1.05], [1.05, 1.05]
  ];
  postPositions.forEach(([x, z]) => {
    const postGeo = new THREE.BoxGeometry(0.12, 0.7, 0.12);
    const post = new THREE.Mesh(postGeo, fenceMat);
    post.position.set(x, 0.45, z);
    post.castShadow = true;
    farmGroup.add(post);
  });

  // 울타리 가로 바
  const barL = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.08, 2.1), fenceMat);
  barL.position.set(-1.05, 0.55, 0);
  const barR = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.08, 2.1), fenceMat);
  barR.position.set(1.05, 0.55, 0);
  farmGroup.add(barL, barR);

  // 4. 고랑 라인 3줄
  const furrowMat = new THREE.MeshLambertMaterial({ color: 0x2e1a0d });
  for (let z = -0.6; z <= 0.6; z += 0.6) {
    const furrowGeo = new THREE.BoxGeometry(1.8, 0.06, 0.25);
    const furrow = new THREE.Mesh(furrowGeo, furrowMat);
    furrow.position.set(0, 0.3, z);
    farmGroup.add(furrow);
  }

  // 5. 단계별 작물(Crop) 복셀 연출
  if (growthStage === 0) {
    // 0단계: 흙 위에 작은 씨앗 점들
    for (let i = -0.5; i <= 0.5; i += 0.5) {
      const seedGeo = new THREE.BoxGeometry(0.08, 0.04, 0.08);
      const seed = new THREE.Mesh(seedGeo, new THREE.MeshLambertMaterial({ color: 0xa16207 }));
      seed.position.set(i, 0.31, 0);
      farmGroup.add(seed);
    }
  } else if (growthStage === 1) {
    // 1단계: 귀여운 연두빛 아기 떡잎들 (3줄에 3포기)
    const stemMat = new THREE.MeshLambertMaterial({ color: 0x86efac });
    const leafMat = new THREE.MeshLambertMaterial({ color: 0x4ade80 });

    [-0.5, 0, 0.5].forEach(x => {
      const stem = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.3, 0.08), stemMat);
      stem.position.set(x, 0.45, 0);
      const leafL = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.06, 0.12), leafMat);
      leafL.position.set(x - 0.1, 0.55, 0);
      leafL.rotation.z = 0.3;
      const leafR = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.06, 0.12), leafMat);
      leafR.position.set(x + 0.1, 0.55, 0);
      leafR.rotation.z = -0.3;
      farmGroup.add(stem, leafL, leafR);
    });

  } else if (growthStage === 2) {
    // 2단계: 쑥쑥 자라난 푸른 줄기와 풍성한 잎사귀
    const stemMat = new THREE.MeshLambertMaterial({ color: 0x22c55e });
    const leafMat = new THREE.MeshLambertMaterial({ color: 0x16a34a });

    [-0.6, 0, 0.6].forEach(x => {
      const stem = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.65, 0.12), stemMat);
      stem.position.set(x, 0.62, 0);
      stem.castShadow = true;

      const bush = new THREE.Mesh(new THREE.BoxGeometry(0.45, 0.35, 0.45), leafMat);
      bush.position.set(x, 0.85, 0);
      bush.castShadow = true;

      farmGroup.add(stem, bush);
    });

  } else if (growthStage >= 3) {
    // 3단계: 탐스럽게 익은 황금빛 곡물 & 만개한 꽃 (수확 임박!)
    const stemMat = new THREE.MeshLambertMaterial({ color: 0xca8a04 });
    const goldCropMat = new THREE.MeshLambertMaterial({ color: 0xfacc15 }); // 황금빛 벼/밀
    const flowerMat = new THREE.MeshLambertMaterial({ color: 0xef4444 });

    [-0.6, 0, 0.6].forEach((x, idx) => {
      const stem = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.9, 0.14), stemMat);
      stem.position.set(x, 0.75, 0);
      stem.castShadow = true;

      // 황금빛 이삭 블록
      const grain = new THREE.Mesh(new THREE.BoxGeometry(0.55, 0.5, 0.55), goldCropMat);
      grain.position.set(x, 1.15, 0);
      grain.castShadow = true;

      // 중앙 포기에는 활짝 핀 꽃 블록 포인트
      if (idx === 1) {
        const flower = new THREE.Mesh(new THREE.BoxGeometry(0.25, 0.25, 0.25), flowerMat);
        flower.position.set(x, 1.45, 0);
        farmGroup.add(flower);
      }

      farmGroup.add(stem, grain);
    });
  }

  return farmGroup;
}
