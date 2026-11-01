import * as THREE from 'three';
import { CharacterAppearance } from '../../types/game';

export type CharacterAction = 'idle' | 'walk' | 'nervous' | 'celebrate' | 'frustrated' | 'stay_desk';

export class VoxelCharacter {
  public group: THREE.Group;
  public headGroup: THREE.Group;
  public bodyGroup: THREE.Group;
  public leftArm: THREE.Group;
  public rightArm: THREE.Group;
  public leftLeg: THREE.Group;
  public rightLeg: THREE.Group;
  public notebookMesh?: THREE.Mesh;
  public glassesMesh?: THREE.Group;
  public pressCardMesh?: THREE.Mesh;
  private currentAction: CharacterAction = 'idle';

  constructor(appearance: CharacterAppearance, scale: number = 1.0) {
    this.group = new THREE.Group();
    this.group.scale.set(scale, scale, scale);

    // 머리 그룹 (피벗: 목)
    this.headGroup = new THREE.Group();
    this.headGroup.position.y = 1.4;

    // 몸통 그룹
    this.bodyGroup = new THREE.Group();
    this.bodyGroup.position.y = 0.9;

    // 왼팔/오른팔 (피벗: 어깨)
    this.leftArm = new THREE.Group();
    this.leftArm.position.set(-0.48, 1.25, 0);

    this.rightArm = new THREE.Group();
    this.rightArm.position.set(0.48, 1.25, 0);

    // 왼다리/오른다리 (피벗: 골반)
    this.leftLeg = new THREE.Group();
    this.leftLeg.position.set(-0.2, 0.6, 0);

    this.rightLeg = new THREE.Group();
    this.rightLeg.position.set(0.2, 0.6, 0);

    this.group.add(this.headGroup);
    this.group.add(this.bodyGroup);
    this.group.add(this.leftArm);
    this.group.add(this.rightArm);
    this.group.add(this.leftLeg);
    this.group.add(this.rightLeg);

    this.buildMeshes(appearance);
  }

  public updateAppearance(appearance: CharacterAppearance) {
    // 기존 메시 정리 후 재구축
    while (this.headGroup.children.length > 0) this.headGroup.remove(this.headGroup.children[0]);
    while (this.bodyGroup.children.length > 0) this.bodyGroup.remove(this.bodyGroup.children[0]);
    while (this.leftArm.children.length > 0) this.leftArm.remove(this.leftArm.children[0]);
    while (this.rightArm.children.length > 0) this.rightArm.remove(this.rightArm.children[0]);
    while (this.leftLeg.children.length > 0) this.leftLeg.remove(this.leftLeg.children[0]);
    while (this.rightLeg.children.length > 0) this.rightLeg.remove(this.rightLeg.children[0]);

    this.buildMeshes(appearance);
  }

  private buildMeshes(app: CharacterAppearance) {
    const skinMat = new THREE.MeshLambertMaterial({ color: app.skinTone });
    const hairMat = new THREE.MeshLambertMaterial({ color: app.hairColor });
    const shirtMat = new THREE.MeshLambertMaterial({ color: app.shirtColor });
    const pantsMat = new THREE.MeshLambertMaterial({ color: app.pantsColor });
    const darkMat = new THREE.MeshLambertMaterial({ color: 0x111827 });
    const cardMat = new THREE.MeshLambertMaterial({ color: app.pressCardColor });
    const whiteMat = new THREE.MeshLambertMaterial({ color: 0xffffff });

    // 1. 머리 (0.6 x 0.6 x 0.6)
    const headGeo = new THREE.BoxGeometry(0.6, 0.6, 0.6);
    const headMesh = new THREE.Mesh(headGeo, skinMat);
    headMesh.position.y = 0.3;
    headMesh.castShadow = true;
    this.headGroup.add(headMesh);

    // 얼굴 픽셀 눈 (복셀 형태)
    const eyeGeo = new THREE.BoxGeometry(0.08, 0.08, 0.04);
    const eyeL = new THREE.Mesh(eyeGeo, darkMat);
    eyeL.position.set(-0.14, 0.32, 0.31);
    const eyeR = new THREE.Mesh(eyeGeo, darkMat);
    eyeR.position.set(0.14, 0.32, 0.31);
    this.headGroup.add(eyeL);
    this.headGroup.add(eyeR);

    // 입 (표정에 따라)
    const mouthGeo = new THREE.BoxGeometry(0.12, 0.04, 0.04);
    const mouth = new THREE.Mesh(mouthGeo, app.expression === 'happy' ? new THREE.MeshLambertMaterial({ color: 0xe11d48 }) : darkMat);
    mouth.position.set(0, 0.18, 0.31);
    this.headGroup.add(mouth);

    // 헤어스타일
    if (app.hairStyle === 'neat' || app.hairStyle === 'parted') {
      const hairTopGeo = new THREE.BoxGeometry(0.64, 0.16, 0.64);
      const hairTop = new THREE.Mesh(hairTopGeo, hairMat);
      hairTop.position.set(0, 0.58, 0);
      const hairBackGeo = new THREE.BoxGeometry(0.64, 0.35, 0.15);
      const hairBack = new THREE.Mesh(hairBackGeo, hairMat);
      hairBack.position.set(0, 0.38, -0.27);
      this.headGroup.add(hairTop);
      this.headGroup.add(hairBack);

      if (app.hairStyle === 'parted') {
        const fringeGeo = new THREE.BoxGeometry(0.35, 0.12, 0.1);
        const fringe = new THREE.Mesh(fringeGeo, hairMat);
        fringe.position.set(-0.1, 0.52, 0.3);
        this.headGroup.add(fringe);
      }
    } else {
      // short / messy
      const hairTopGeo = new THREE.BoxGeometry(0.66, 0.22, 0.66);
      const hairTop = new THREE.Mesh(hairTopGeo, hairMat);
      hairTop.position.set(0, 0.55, 0);
      this.headGroup.add(hairTop);
    }

    // 안경
    if (app.glasses) {
      const gGroup = new THREE.Group();
      const frameMat = new THREE.MeshLambertMaterial({ color: 0x0f172a });
      const rimGeo = new THREE.BoxGeometry(0.18, 0.14, 0.05);
      const bridgeGeo = new THREE.BoxGeometry(0.12, 0.04, 0.05);

      const rimL = new THREE.Mesh(rimGeo, frameMat);
      rimL.position.set(-0.15, 0.32, 0.33);
      const rimR = new THREE.Mesh(rimGeo, frameMat);
      rimR.position.set(0.15, 0.32, 0.33);
      const bridge = new THREE.Mesh(bridgeGeo, frameMat);
      bridge.position.set(0, 0.34, 0.33);

      gGroup.add(rimL, rimR, bridge);
      this.headGroup.add(gGroup);
      this.glassesMesh = gGroup;
    }

    // 2. 몸통 (0.55 x 0.65 x 0.3)
    const bodyGeo = new THREE.BoxGeometry(0.55, 0.65, 0.3);
    const bodyMesh = new THREE.Mesh(bodyGeo, shirtMat);
    bodyMesh.castShadow = true;
    this.bodyGroup.add(bodyMesh);

    // 기자증 (목걸이 + 카드)
    const cardGeo = new THREE.BoxGeometry(0.14, 0.18, 0.04);
    const card = new THREE.Mesh(cardGeo, cardMat);
    card.position.set(0, -0.05, 0.17);
    const strapGeo = new THREE.BoxGeometry(0.04, 0.25, 0.02);
    const strapL = new THREE.Mesh(strapGeo, darkMat);
    strapL.rotation.z = -0.3;
    strapL.position.set(-0.08, 0.18, 0.16);
    const strapR = new THREE.Mesh(strapGeo, darkMat);
    strapR.rotation.z = 0.3;
    strapR.position.set(0.08, 0.18, 0.16);
    this.bodyGroup.add(card, strapL, strapR);
    this.pressCardMesh = card;

    // 3. 왼팔 (0.18 x 0.6 x 0.2)
    const armGeo = new THREE.BoxGeometry(0.18, 0.6, 0.2);
    const armLMesh = new THREE.Mesh(armGeo, shirtMat);
    armLMesh.position.y = -0.25;
    armLMesh.castShadow = true;
    this.leftArm.add(armLMesh);

    // 4. 오른팔 & 취재수첩
    const armRMesh = new THREE.Mesh(armGeo, shirtMat);
    armRMesh.position.y = -0.25;
    armRMesh.castShadow = true;
    this.rightArm.add(armRMesh);

    // 취재수첩 소품
    const noteGeo = new THREE.BoxGeometry(0.14, 0.22, 0.2);
    const noteMat = new THREE.MeshLambertMaterial({ color: 0x1e293b });
    const notebook = new THREE.Mesh(noteGeo, noteMat);
    notebook.position.set(0, -0.4, 0.12);
    const paperGeo = new THREE.BoxGeometry(0.12, 0.2, 0.02);
    const paper = new THREE.Mesh(paperGeo, whiteMat);
    paper.position.set(0, -0.4, 0.22);
    this.rightArm.add(notebook, paper);
    this.notebookMesh = notebook;

    // 5. 다리 (0.22 x 0.6 x 0.24)
    const legGeo = new THREE.BoxGeometry(0.22, 0.6, 0.24);
    const legLMesh = new THREE.Mesh(legGeo, pantsMat);
    legLMesh.position.y = -0.3;
    legLMesh.castShadow = true;
    this.leftLeg.add(legLMesh);

    const legRMesh = new THREE.Mesh(legGeo, pantsMat);
    legRMesh.position.y = -0.3;
    legRMesh.castShadow = true;
    this.rightLeg.add(legRMesh);
  }

  public setAction(action: CharacterAction) {
    this.currentAction = action;
  }

  public animate(time: number) {
    const t = time * 0.003;

    switch (this.currentAction) {
      case 'walk': {
        const walkCycle = Math.sin(t * 8);
        this.leftArm.rotation.x = walkCycle * 0.6;
        this.rightArm.rotation.x = -walkCycle * 0.6;
        this.leftLeg.rotation.x = -walkCycle * 0.7;
        this.rightLeg.rotation.x = walkCycle * 0.7;
        this.headGroup.rotation.y = Math.sin(t * 2) * 0.1;
        this.headGroup.rotation.x = 0;
        this.group.position.y = Math.abs(Math.sin(t * 8)) * 0.08;
        break;
      }
      case 'nervous': {
        // 심한 떨림 (긴장)
        const jitter = Math.sin(t * 40) * 0.03;
        this.group.position.x = jitter;
        this.headGroup.rotation.y = Math.sin(t * 15) * 0.1;
        this.leftArm.rotation.x = -0.8 + Math.sin(t * 20) * 0.08;
        this.rightArm.rotation.x = -0.8 - Math.sin(t * 20) * 0.08;
        this.leftLeg.rotation.x = 0;
        this.rightLeg.rotation.x = 0;
        this.group.position.y = 0;
        break;
      }
      case 'celebrate': {
        // 환호 점프 & 팔 번쩍
        const jump = Math.max(0, Math.sin(t * 6)) * 0.45;
        this.group.position.y = jump;
        this.leftArm.rotation.x = Math.PI - 0.3;
        this.rightArm.rotation.x = Math.PI - 0.3;
        this.leftArm.rotation.z = -0.4;
        this.rightArm.rotation.z = 0.4;
        this.headGroup.rotation.x = -0.25; // 하늘 올려다보기
        this.headGroup.rotation.y = Math.sin(t * 4) * 0.2;
        this.leftLeg.rotation.x = jump > 0.1 ? 0.3 : 0;
        this.rightLeg.rotation.x = jump > 0.1 ? -0.3 : 0;
        break;
      }
      case 'frustrated': {
        // 주저앉기 & 고개 푹 숙이기
        this.group.position.y = -0.35;
        this.headGroup.rotation.x = 0.45;
        this.headGroup.rotation.y = 0;
        this.leftArm.rotation.x = -0.3;
        this.rightArm.rotation.x = -0.3;
        this.leftLeg.rotation.x = 1.3;
        this.rightLeg.rotation.x = 1.3;
        break;
      }
      case 'stay_desk': {
        // 책상 앉아서 기사 쓰기
        this.group.position.y = -0.15;
        this.headGroup.rotation.x = 0.2;
        this.headGroup.rotation.y = Math.sin(t * 1.5) * 0.1;
        this.leftArm.rotation.x = -1.2;
        this.rightArm.rotation.x = -1.2 + Math.sin(t * 10) * 0.1;
        this.leftLeg.rotation.x = 1.0;
        this.rightLeg.rotation.x = 1.0;
        break;
      }
      case 'idle':
      default: {
        // 호흡 & 천천히 고개 둘러보기
        const breath = Math.sin(t * 2) * 0.02;
        this.group.position.y = breath;
        this.headGroup.rotation.y = Math.sin(t * 1.2) * 0.25;
        this.headGroup.rotation.x = Math.sin(t * 1.8) * 0.05;
        this.leftArm.rotation.x = Math.sin(t * 1.5) * 0.08;
        this.rightArm.rotation.x = -0.4 + Math.sin(t * 1.5) * 0.08;
        this.leftLeg.rotation.x = 0;
        this.rightLeg.rotation.x = 0;
        break;
      }
    }
  }
}
