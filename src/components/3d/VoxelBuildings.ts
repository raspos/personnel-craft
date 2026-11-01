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

  // 픽셀 노이즈 및 그리드 테두리
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

// 1. 뉴스룸 본관 빌딩
export function createNewsroomBuilding(): THREE.Group {
  const group = new THREE.Group();

  const wallMat = new THREE.MeshLambertMaterial({ color: 0x334155 });
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

  // 1층 출입문 (자동문/유리 게이트)
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

  // 'NEWSROOM' 간판 블록
  const signBoardGeo = new THREE.BoxGeometry(5.5, 1.2, 0.4);
  const signBoard = new THREE.Mesh(signBoardGeo, signMat);
  signBoard.position.set(0, 8.8, -0.3);
  group.add(signBoard);

  // 3D 픽셀 글자 느낌의 복셀 블록들
  const letterBlocks = [
    [-2.0, 'N'], [-1.3, 'E'], [-0.6, 'W'], [0.1, 'S'], [0.8, 'R'], [1.5, 'O'], [2.1, 'M']
  ];
  letterBlocks.forEach(([xPos]) => {
    const letterGeo = new THREE.BoxGeometry(0.4, 0.6, 0.2);
    const letterMesh = new THREE.Mesh(letterGeo, textMat);
    letterMesh.position.set(xPos as number, 8.8, -0.05);
    group.add(letterMesh);
  });

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
  const trunkGeo = new THREE.BoxGeometry(0.4, 2.0, 0.4);
  const trunk = new THREE.Mesh(trunkGeo, trunkMat);
  trunk.position.y = 1.0;
  trunk.castShadow = true;
  tree.add(trunk);

  const leavesMat = new THREE.MeshLambertMaterial({ color: 0x22c55e });
  const leafBottomGeo = new THREE.BoxGeometry(1.8, 1.0, 1.8);
  const leafBottom = new THREE.Mesh(leafBottomGeo, leavesMat);
  leafBottom.position.y = 2.4;
  leafBottom.castShadow = true;

  const leafTopGeo = new THREE.BoxGeometry(1.2, 0.8, 1.2);
  const leafTop = new THREE.Mesh(leafTopGeo, leavesMat);
  leafTop.position.y = 3.2;
  leafTop.castShadow = true;

  tree.add(leafBottom, leafTop);
  return tree;
}

export function createStreetLamp(x: number, z: number): THREE.Group {
  const lamp = new THREE.Group();
  lamp.position.set(x, 0, z);

  const metalMat = new THREE.MeshLambertMaterial({ color: 0x334155 });
  const lightMat = new THREE.MeshBasicMaterial({ color: 0xfef08a });

  const poleGeo = new THREE.BoxGeometry(0.12, 3.2, 0.12);
  const pole = new THREE.Mesh(poleGeo, metalMat);
  pole.position.y = 1.6;

  const headGeo = new THREE.BoxGeometry(0.4, 0.4, 0.4);
  const head = new THREE.Mesh(headGeo, lightMat);
  head.position.set(0, 3.2, 0);

  lamp.add(pole, head);
  return lamp;
}

// 3. 커리어 블록 지도 (Stage 2)
export function createCareerVoxelMap(careers: CareerRecord[]): THREE.Group {
  const mapGroup = new THREE.Group();

  let currentZ = 0;
  const blockWidth = 2.4;

  careers.forEach((career, idx) => {
    // 근무 기간(개월)에 비례하는 높이 (1년 = 1.2 높이)
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

// 4. 부서장 NPC 생성 (고유 소품과 표정)
export function createBossNPC(deptDef: DepartmentDef): { group: THREE.Group; animate: (t: number) => void } {
  const group = new THREE.Group();

  const skinMat = new THREE.MeshLambertMaterial({ color: 0xfed7aa });
  const hairMat = new THREE.MeshLambertMaterial({ color: deptDef.bossCostume.hairColor });
  const shirtMat = new THREE.MeshLambertMaterial({ color: deptDef.bossCostume.shirtColor });
  const pantsMat = new THREE.MeshLambertMaterial({ color: 0x1e293b });
  const eyeMat = new THREE.MeshLambertMaterial({ color: 0x0f172a });

  // 머리
  const headGroup = new THREE.Group();
  headGroup.position.y = 1.4;

  const headGeo = new THREE.BoxGeometry(0.55, 0.55, 0.55);
  const head = new THREE.Mesh(headGeo, skinMat);
  head.position.y = 0.28;

  // 헤어
  const hairGeo = new THREE.BoxGeometry(0.58, 0.2, 0.58);
  const hair = new THREE.Mesh(hairGeo, hairMat);
  hair.position.y = 0.5;

  // 눈
  const eyeGeo = new THREE.BoxGeometry(0.07, 0.07, 0.04);
  const eyeL = new THREE.Mesh(eyeGeo, eyeMat);
  eyeL.position.set(-0.13, 0.28, 0.29);
  const eyeR = new THREE.Mesh(eyeGeo, eyeMat);
  eyeR.position.set(0.13, 0.28, 0.29);

  headGroup.add(head, hair, eyeL, eyeR);

  // 안경 부서장
  if (deptDef.bossCostume.accessory === 'glasses' || deptDef.name.includes('경제') || deptDef.name.includes('문화')) {
    const frameMat = new THREE.MeshLambertMaterial({ color: 0xb45309 });
    const rimGeo = new THREE.BoxGeometry(0.16, 0.12, 0.04);
    const rL = new THREE.Mesh(rimGeo, frameMat);
    rL.position.set(-0.13, 0.28, 0.31);
    const rR = new THREE.Mesh(rimGeo, frameMat);
    rR.position.set(0.13, 0.28, 0.31);
    headGroup.add(rL, rR);
  }

  // 산업부장 안전모
  if (deptDef.bossCostume.accessory === 'helmet') {
    const helmetMat = new THREE.MeshLambertMaterial({ color: 0xfacc15 }); // 노란 안전모
    const helmetGeo = new THREE.BoxGeometry(0.64, 0.25, 0.64);
    const helmet = new THREE.Mesh(helmetGeo, helmetMat);
    helmet.position.y = 0.58;
    headGroup.add(helmet);
  }

  // 몸통
  const bodyGeo = new THREE.BoxGeometry(0.55, 0.65, 0.3);
  const body = new THREE.Mesh(bodyGeo, shirtMat);
  body.position.y = 0.9;

  // 다리
  const legGeo = new THREE.BoxGeometry(0.2, 0.6, 0.22);
  const legL = new THREE.Mesh(legGeo, pantsMat);
  legL.position.set(-0.18, 0.3, 0);
  const legR = new THREE.Mesh(legGeo, pantsMat);
  legR.position.set(0.18, 0.3, 0);

  // 팔 및 소품
  const armGeo = new THREE.BoxGeometry(0.16, 0.6, 0.18);
  const armL = new THREE.Mesh(armGeo, shirtMat);
  armL.position.set(-0.42, 0.9, 0);

  const armR = new THREE.Group();
  armR.position.set(0.42, 1.15, 0);
  const armRMesh = new THREE.Mesh(armGeo, shirtMat);
  armRMesh.position.y = -0.25;
  armR.add(armRMesh);

  // 소품: 서류가방 / 노트북 / 마이크 / 여권
  if (deptDef.bossCostume.accessory === 'briefcase') {
    const caseGeo = new THREE.BoxGeometry(0.1, 0.35, 0.4);
    const caseMat = new THREE.MeshLambertMaterial({ color: 0x451a03 });
    const bCase = new THREE.Mesh(caseGeo, caseMat);
    bCase.position.set(0, -0.45, 0.1);
    armR.add(bCase);
  } else if (deptDef.bossCostume.accessory === 'laptop') {
    const lapGeo = new THREE.BoxGeometry(0.08, 0.3, 0.35);
    const lapMat = new THREE.MeshLambertMaterial({ color: 0x94a3b8 });
    const lap = new THREE.Mesh(lapGeo, lapMat);
    lap.position.set(0, -0.38, 0.1);
    armR.add(lap);
  } else if (deptDef.bossCostume.accessory === 'mic') {
    const micGeo = new THREE.CylinderGeometry(0.04, 0.04, 0.25, 8);
    const micMat = new THREE.MeshLambertMaterial({ color: 0x111827 });
    const mic = new THREE.Mesh(micGeo, micMat);
    mic.rotation.x = Math.PI / 4;
    mic.position.set(0, -0.35, 0.15);
    armR.add(mic);
  }

  group.add(headGroup, body, legL, legR, armL, armR);

  const animate = (t: number) => {
    headGroup.rotation.y = Math.sin(t * 1.5) * 0.2;
    armR.rotation.x = -0.2 + Math.sin(t * 2) * 0.15;
  };

  return { group, animate };
}

// 5. 인사위원회 회의실 세트 (Stage 4)
export function createCommitteeRoom(): THREE.Group {
  const room = new THREE.Group();

  // 대형 타원형/직사각형 회의 탁자
  const tableGeo = new THREE.BoxGeometry(5.5, 0.8, 2.8);
  const tableMat = new THREE.MeshLambertMaterial({ color: 0x451a03 });
  const table = new THREE.Mesh(tableGeo, tableMat);
  table.position.set(0, 0.8, 0);
  table.castShadow = true;
  table.receiveShadow = true;
  room.add(table);

  // 탁자 위 명패 & 서류뭉치들
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

  // 심사위원 NPC 3명 (반대편에 앉아 심사하는 모습)
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

    // 헤어
    const jHairGeo = new THREE.BoxGeometry(0.48, 0.15, 0.48);
    const jHair = new THREE.Mesh(jHairGeo, new THREE.MeshLambertMaterial({ color: 0x475569 }));
    jHair.position.y = 1.22;

    judge.add(jBody, jHead, jHair);
    room.add(judge);
  });

  return room;
}

// 6. [신규] 인사 농사 블록 밭 및 새싹 연출 (Stage 3.5)
export function createVoxelFarmField(growthStage: number = 0): THREE.Group {
  const farmGroup = new THREE.Group();

  // 갈아놓은 비옥한 흙 밭 베이스 (1.8 x 0.25 x 1.8)
  const soilMat = new THREE.MeshLambertMaterial({ color: 0x5c3a21 });
  const furrowMat = new THREE.MeshLambertMaterial({ color: 0x3d2514 });
  const soilGeo = new THREE.BoxGeometry(1.8, 0.25, 1.8);
  const soil = new THREE.Mesh(soilGeo, soilMat);
  soil.position.y = 0.125;
  soil.receiveShadow = true;
  farmGroup.add(soil);

  // 고랑(Furrow) 라인 3줄
  for (let z = -0.5; z <= 0.5; z += 0.5) {
    const furrowGeo = new THREE.BoxGeometry(1.7, 0.08, 0.2);
    const furrow = new THREE.Mesh(furrowGeo, furrowMat);
    furrow.position.set(0, 0.26, z);
    farmGroup.add(furrow);
  }

  // 새싹(Sprout) 복셀 연출 (성장 단계: 0 = 없음, 1 = 작은 떡잎, 2 = 줄기+잎, 3 = 무성한 싹)
  if (growthStage >= 1) {
    const sproutStemMat = new THREE.MeshLambertMaterial({ color: 0x4ade80 });
    const sproutLeafMat = new THREE.MeshLambertMaterial({ color: 0x22c55e });

    // 중앙 줄기
    const stemHeight = growthStage === 1 ? 0.35 : growthStage === 2 ? 0.65 : 0.95;
    const stemGeo = new THREE.BoxGeometry(0.12, stemHeight, 0.12);
    const stem = new THREE.Mesh(stemGeo, sproutStemMat);
    stem.position.y = 0.25 + stemHeight / 2;
    stem.castShadow = true;
    farmGroup.add(stem);

    // 떡잎 2개 (좌우)
    const leafGeo = new THREE.BoxGeometry(0.25, 0.08, 0.18);
    const leafL = new THREE.Mesh(leafGeo, sproutLeafMat);
    leafL.position.set(-0.16, 0.25 + stemHeight * 0.8, 0);
    leafL.rotation.z = 0.35;

    const leafR = new THREE.Mesh(leafGeo, sproutLeafMat);
    leafR.position.set(0.16, 0.25 + stemHeight * 0.8, 0);
    leafR.rotation.z = -0.35;

    farmGroup.add(leafL, leafR);

    // 3단계 이상 시 풍성한 잎 추가
    if (growthStage >= 3) {
      const topLeaf = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.1, 0.3), sproutLeafMat);
      topLeaf.position.set(0, 0.25 + stemHeight + 0.05, 0);
      farmGroup.add(topLeaf);
    }
  }

  return farmGroup;
}

