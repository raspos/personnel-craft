import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { CharacterProfile, Stage, CareerRecord, WishSelection } from '../../types/game';
import { VoxelCharacter, CharacterAction } from './VoxelCharacter';
import {
  createNewsroomBuilding,
  createVoxelTree,
  createStreetLamp,
  createCareerVoxelMap,
  createBossNPC,
  createCommitteeRoom,
  createVoxelFarmField,
  createDistinctDeptBuilding,
  createSpeechBubbleSprite
} from './VoxelBuildings';
import { getDepartmentByName } from '../../data/departments';

interface VoxelWorldCanvasProps {
  stage: Stage;
  profile: CharacterProfile;
  careers: CareerRecord[];
  wishes: WishSelection;
  action: CharacterAction;
  farmingSprouts?: { first: number; second: number; third: number };
  activeSpeech?: { text: string; speaker?: string };
}

export const VoxelWorldCanvas: React.FC<VoxelWorldCanvasProps> = ({
  stage,
  profile,
  careers,
  wishes,
  action,
  farmingSprouts,
  activeSpeech
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [webGLFailed, setWebGLFailed] = useState(false);

  const characterRef = useRef<VoxelCharacter | null>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const worldGroupRef = useRef<THREE.Group | null>(null);
  const bossAnimateListRef = useRef<((t: number) => void)[]>([]);
  const speechBubbleRef = useRef<THREE.Sprite | null>(null);

  // 캐릭터 이동 목표 위치 (Lerp interpolation)
  const targetPosRef = useRef<{ x: number; y: number; z: number }>({ x: 0, y: 0, z: 2.8 });
  const targetRotYRef = useRef<number>(Math.PI);

  // 회전 드래그 상호작용
  const isDraggingRef = useRef(false);
  const prevMousePosRef = useRef({ x: 0, y: 0 });
  const rotationOffsetRef = useRef({ x: 0, y: 0 });

  // 1. Scene 초기화 (따뜻하고 화사한 마인크래프트 감성)
  useEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({
        canvas,
        antialias: true,
        alpha: false,
        powerPreference: 'high-performance'
      });
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
      renderer.shadowMap.enabled = true;
      renderer.shadowMap.type = THREE.PCFShadowMap;
      rendererRef.current = renderer;
    } catch (err) {
      console.warn('WebGL is not supported or failed, falling back to 2D view', err);
      setWebGLFailed(true);
      return;
    }

    const scene = new THREE.Scene();
    // 쾌청하고 따뜻한 마인크래프트 스카이블루 배경 & 포그
    scene.background = new THREE.Color(0x7dd3fc); // 화사한 하늘색
    scene.fog = new THREE.FogExp2(0xbae6fd, 0.015);
    sceneRef.current = scene;

    const camera = new THREE.PerspectiveCamera(42, container.clientWidth / container.clientHeight, 0.1, 100);
    camera.position.set(0, 4.2, 10.5);
    cameraRef.current = camera;

    // 조명 세팅 (따뜻한 햇살 + 풍부한 환경광)
    const hemiLight = new THREE.HemisphereLight(0xfffbeb, 0x5b8c32, 0.95);
    scene.add(hemiLight);

    const ambientLight = new THREE.AmbientLight(0xffffff, 0.45);
    scene.add(ambientLight);

    const sunLight = new THREE.DirectionalLight(0xfffbeb, 1.45);
    sunLight.position.set(8, 16, 10);
    sunLight.castShadow = true;
    sunLight.shadow.mapSize.width = 1024;
    sunLight.shadow.mapSize.height = 1024;
    sunLight.shadow.camera.near = 0.5;
    sunLight.shadow.camera.far = 35;
    sunLight.shadow.camera.left = -12;
    sunLight.shadow.camera.right = 12;
    sunLight.shadow.camera.top = 12;
    sunLight.shadow.camera.bottom = -12;
    sunLight.shadow.bias = -0.0005;
    scene.add(sunLight);

    // 공통 바닥 (마인크래프트 잔디 블록 베이스)
    const floorGeo = new THREE.PlaneGeometry(36, 36);
    const floorMat = new THREE.MeshLambertMaterial({ color: 0x5b8c32 }); // 싱그러운 잔디 녹색
    const floor = new THREE.Mesh(floorGeo, floorMat);
    floor.rotation.x = -Math.PI / 2;
    floor.receiveShadow = true;
    scene.add(floor);

    // 인도 보도블록 / 자갈길 (Cobblestone Path)
    const pathGeo = new THREE.PlaneGeometry(3.6, 20);
    const pathMat = new THREE.MeshLambertMaterial({ color: 0x94a3b8 });
    const path = new THREE.Mesh(pathGeo, pathMat);
    path.rotation.x = -Math.PI / 2;
    path.position.set(0, 0.015, 2);
    path.receiveShadow = true;
    scene.add(path);

    // 복셀 블록 그리드
    const gridHelper = new THREE.GridHelper(30, 30, 0x4d7c0f, 0x65a30d);
    gridHelper.position.y = 0.02;
    scene.add(gridHelper);

    // 캐릭터 생성
    const character = new VoxelCharacter(profile.appearance, 1.05);
    character.group.position.set(0, 0, 2.5);
    scene.add(character.group);
    characterRef.current = character;

    // 월드 오브젝트 그룹
    const worldGroup = new THREE.Group();
    scene.add(worldGroup);
    worldGroupRef.current = worldGroup;

    // 반응형 리사이즈 핸들러
    const handleResize = () => {
      if (!container || !renderer || !camera) return;
      const width = container.clientWidth;
      const height = container.clientHeight;
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
      renderer.setSize(width, height);
    };
    handleResize();
    window.addEventListener('resize', handleResize);

    // 애니메이션 렌더 루프 (캐릭터 스무스 이동 포함)
    let animationFrameId: number;
    const startTime = performance.now();

    const renderLoop = () => {
      const elapsedTime = performance.now() - startTime;

      if (characterRef.current) {
        characterRef.current.animate(elapsedTime);

        // 목표 위치로 부드럽게 걸어가는 Lerp 애니메이션
        const curPos = characterRef.current.group.position;
        const target = targetPosRef.current;
        curPos.x = THREE.MathUtils.lerp(curPos.x, target.x, 0.08);
        curPos.y = THREE.MathUtils.lerp(curPos.y, target.y, 0.08);
        curPos.z = THREE.MathUtils.lerp(curPos.z, target.z, 0.08);

        // 회전 각도 Lerp
        characterRef.current.group.rotation.y = THREE.MathUtils.lerp(
          characterRef.current.group.rotation.y,
          targetRotYRef.current,
          0.1
        );
      }

      // NPC들 유휴 애니메이션
      bossAnimateListRef.current.forEach(anim => anim(elapsedTime * 0.002));

      // 드래그 회전 완만하게 적용
      if (sceneRef.current) {
        scene.rotation.y = THREE.MathUtils.lerp(scene.rotation.y, rotationOffsetRef.current.x, 0.1);
      }

      renderer.render(scene, camera);
      animationFrameId = requestAnimationFrame(renderLoop);
    };
    renderLoop();

    return () => {
      window.removeEventListener('resize', handleResize);
      cancelAnimationFrame(animationFrameId);
      renderer.dispose();
    };
  }, []);

  // 2. 외형 및 액션 업데이트 & 위치 이동 타겟팅
  useEffect(() => {
    if (!characterRef.current) return;
    characterRef.current.updateAppearance(profile.appearance);
    characterRef.current.setAction(action);

    // 행동(Action)에 따른 캐릭터의 3D 공간 내 실제 위치 이동!
    if (stage === 3 || stage === 3.5) {
      if (action === 'walk') {
        // 1지망 부서장 앞으로 이동
        targetPosRef.current = { x: -3.4, y: 0, z: 0.5 };
        targetRotYRef.current = Math.PI; // 부서장을 마주봄
      } else if (action === 'stay_desk') {
        // 기사 작성 책상 앞
        targetPosRef.current = { x: 0, y: 0, z: 2.0 };
        targetRotYRef.current = Math.PI;
      } else if (action === 'nervous' || action === 'frustrated') {
        // 현 부서 고민 (오른쪽 뒤편)
        targetPosRef.current = { x: 1.8, y: 0, z: 2.2 };
        targetRotYRef.current = Math.PI * 0.8;
      } else {
        // 중앙 마당
        targetPosRef.current = { x: 0, y: 0, z: 2.8 };
        targetRotYRef.current = Math.PI;
      }
    } else if (stage === 1) {
      targetPosRef.current = { x: 0, y: 0, z: 1.8 };
      targetRotYRef.current = 0;
    } else if (stage === 4) {
      targetPosRef.current = { x: 0, y: 0, z: 2.0 };
      targetRotYRef.current = 0;
    } else if (stage === 5) {
      targetPosRef.current = { x: 0, y: 0.5, z: 0.3 };
      targetRotYRef.current = 0;
    }
  }, [profile.appearance, action, stage]);

  // 3. 3D 공간 상의 말풍선 연출
  useEffect(() => {
    const scene = sceneRef.current;
    if (!scene) return;

    if (speechBubbleRef.current) {
      scene.remove(speechBubbleRef.current);
      speechBubbleRef.current = null;
    }

    if (activeSpeech && activeSpeech.text) {
      const bubble = createSpeechBubbleSprite(activeSpeech.text, activeSpeech.speaker);
      const targetPos = targetPosRef.current;
      bubble.position.set(targetPos.x, targetPos.y + 2.7, targetPos.z);
      scene.add(bubble);
      speechBubbleRef.current = bubble;

      // 4초 후 자연스럽게 사라짐
      const timer = setTimeout(() => {
        if (speechBubbleRef.current && scene) {
          scene.remove(speechBubbleRef.current);
          speechBubbleRef.current = null;
        }
      }, 4000);

      return () => clearTimeout(timer);
    }
  }, [activeSpeech]);

  // 4. Stage 변경 시 3D 환경 구축
  useEffect(() => {
    const worldGroup = worldGroupRef.current;
    const camera = cameraRef.current;
    if (!worldGroup || !camera) return;

    while (worldGroup.children.length > 0) {
      worldGroup.remove(worldGroup.children[0]);
    }
    bossAnimateListRef.current = [];
    rotationOffsetRef.current = { x: 0, y: 0 };

    if (stage === 1) {
      // 메인 화면: 화사한 신문사 본관 타워와 푸른 공원
      camera.position.set(0, 3.4, 9.2);
      camera.lookAt(0, 1.8, 0);

      const newsroom = createNewsroomBuilding();
      worldGroup.add(newsroom);

      const tree1 = createVoxelTree(-5.0, -0.5, 1.15);
      const tree2 = createVoxelTree(5.0, -1.0, 1.0);
      const tree3 = createVoxelTree(-6.2, 2.0, 0.85);
      worldGroup.add(tree1, tree2, tree3);

      const lamp1 = createStreetLamp(-3.0, 2.0);
      const lamp2 = createStreetLamp(3.0, 2.0);
      worldGroup.add(lamp1, lamp2);

    } else if (stage === 2) {
      // 커리어 지도: 알록달록한 부서 복셀 계단 로드
      camera.position.set(3.8, 4.8, 8.2);
      camera.lookAt(0, 1.6, 0);

      const careerMap = createCareerVoxelMap(careers);
      careerMap.position.set(0, 0, -2);
      worldGroup.add(careerMap);

      const latestHeight = careers.length > 0 ? (careers[careers.length - 1].periodMonths / 12) * 1.0 : 0.8;
      targetPosRef.current = { x: 0, y: latestHeight, z: 0.5 };
      targetRotYRef.current = -0.3;

    } else if (stage === 3 || stage === 3.5) {
      // 희망 부서 3곳의 개성 넘치는 시그니처 랜드마크 건물 & 부서장 NPC
      camera.position.set(0, 4.0, 9.8);
      camera.lookAt(0, 1.6, 0);

      const deptList = [wishes.first.deptName, wishes.second.deptName, wishes.third.deptName];
      const rankLabels = ['[1지망]', '[2지망]', '[3지망]'];
      const xPositions = [-3.8, 0, 3.8];
      const sproutList = [
        farmingSprouts?.first ?? 0,
        farmingSprouts?.second ?? 0,
        farmingSprouts?.third ?? 0
      ];

      deptList.forEach((deptName, idx) => {
        const deptDef = getDepartmentByName(deptName);
        if (!deptDef) return;

        // 1. 부서별 고유 시그니처 건물 (국회의사당 돔, 은행 페디먼트, 공장 굴뚝, 사이버 안테나 등)
        const bldg = createDistinctDeptBuilding(deptDef, rankLabels[idx]);
        bldg.position.set(xPositions[idx], 0, -1.8);
        worldGroup.add(bldg);

        // 2. 부서장 복셀 NPC
        const boss = createBossNPC(deptDef);
        boss.group.position.set(xPositions[idx], 0, -0.2);
        boss.group.scale.set(0.9, 0.9, 0.9);
        worldGroup.add(boss.group);
        bossAnimateListRef.current.push(boss.animate);

        // 3. Stage 3.5 인사 농사 밭 & 작물 (마인크래프트 울타리 + 황금빛 수확물)
        if (stage === 3.5) {
          const farm = createVoxelFarmField(sproutList[idx]);
          farm.position.set(xPositions[idx], 0, 1.2);
          worldGroup.add(farm);
        }
      });

      // 기사 작성 책상 복셀 소품 (Stage 3.5에 상시 비치)
      if (stage === 3.5) {
        const deskGeo = new THREE.BoxGeometry(1.2, 0.7, 0.8);
        const deskMat = new THREE.MeshLambertMaterial({ color: 0x854d0e });
        const desk = new THREE.Mesh(deskGeo, deskMat);
        desk.position.set(0, 0.35, 2.5);

        const typeGeo = new THREE.BoxGeometry(0.5, 0.15, 0.4);
        const typeMat = new THREE.MeshLambertMaterial({ color: 0x334155 });
        const typewriter = new THREE.Mesh(typeGeo, typeMat);
        typewriter.position.set(0, 0.78, 2.5);

        worldGroup.add(desk, typewriter);
      }

    } else if (stage === 4) {
      // 인사위원회 세트
      camera.position.set(0, 4.0, 7.8);
      camera.lookAt(0, 1.5, 0);

      const committee = createCommitteeRoom();
      worldGroup.add(committee);

    } else if (stage === 5) {
      // 최종 결과 발표 단상
      camera.position.set(0, 3.2, 7.2);
      camera.lookAt(0, 1.4, 0);

      const podiumGeo = new THREE.BoxGeometry(2.6, 0.5, 2.6);
      const podiumMat = new THREE.MeshLambertMaterial({ color: 0x2563eb });
      const podium = new THREE.Mesh(podiumGeo, podiumMat);
      podium.position.set(0, 0.25, 0);
      podium.receiveShadow = true;
      worldGroup.add(podium);

      const tableGeo = new THREE.BoxGeometry(1.2, 0.9, 0.8);
      const tableMat = new THREE.MeshLambertMaterial({ color: 0x1e293b });
      const table = new THREE.Mesh(tableGeo, tableMat);
      table.position.set(0, 0.45, -0.6);

      const envelopeGeo = new THREE.BoxGeometry(0.5, 0.05, 0.35);
      const envMat = new THREE.MeshLambertMaterial({ color: 0xfacc15 });
      const envelope = new THREE.Mesh(envelopeGeo, envMat);
      envelope.position.set(0, 0.93, -0.6);

      worldGroup.add(table, envelope);
    }
  }, [stage, careers, wishes, farmingSprouts]);

  // 마우스 드래그 시점 둘러보기
  const handlePointerDown = (e: React.PointerEvent) => {
    if (e.pointerType === 'touch') return;
    isDraggingRef.current = true;
    prevMousePosRef.current = { x: e.clientX, y: e.clientY };
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!isDraggingRef.current) return;
    const deltaX = e.clientX - prevMousePosRef.current.x;
    rotationOffsetRef.current.x += deltaX * 0.005;
    prevMousePosRef.current = { x: e.clientX, y: e.clientY };
  };

  const handlePointerUp = () => {
    isDraggingRef.current = false;
  };

  if (webGLFailed) {
    return (
      <div className="w-full h-full flex flex-col items-center justify-center bg-slate-900 rounded-2xl border-4 border-slate-800 text-slate-300 font-pixel p-6 text-center shadow-[4px_4px_0_#000]">
        <div className="text-3xl mb-2">🎮</div>
        <p className="font-bold text-amber-300">3D 복셀 편집국</p>
        <p className="text-xs text-slate-400 mt-2">
          (브라우저 WebGL 가속 제한으로 인해 심플 모드로 실행 중입니다)
        </p>
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className="w-full h-full relative cursor-grab active:cursor-grabbing select-none rounded-2xl overflow-hidden border-4 border-slate-900 shadow-[6px_6px_0px_#000000] bg-sky-200"
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerLeave={handlePointerUp}
    >
      <canvas ref={canvasRef} className="w-full h-full block" />

      {/* 조작 힌트 뱃지 (마인크래프트 스타일) */}
      <div className="absolute top-3 left-3 bg-slate-950/85 px-3 py-1.5 rounded-lg border-2 border-slate-800 text-[11px] font-pixel text-slate-300 shadow flex items-center gap-1.5 backdrop-blur-sm pointer-events-none">
        <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
        <span>화면 드래그로 360° 둘러보기</span>
      </div>
    </div>
  );
};

export default VoxelWorldCanvas;
