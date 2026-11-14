import * as THREE from "three";

/** Original educational geometry in arbitrary units. No manufacturer CAD, scale,
 * sizing, compatibility, fixation specification or surgical planning is implied. */
export const kneePartNames = [
  "Femoral component",
  "Bearing insert",
  "Tibial baseplate",
];

function footprint() {
  const s = new THREE.Shape();
  s.moveTo(0, -0.48);
  s.bezierCurveTo(-0.35, -0.78, -1.12, -0.73, -1.22, -0.16);
  s.bezierCurveTo(-1.4, 0.63, -0.8, 0.86, 0, 0.68);
  s.bezierCurveTo(0.8, 0.86, 1.4, 0.63, 1.22, -0.16);
  s.bezierCurveTo(1.12, -0.73, 0.35, -0.78, 0, -0.48);
  return s;
}

function plate(depth: number) {
  const g = new THREE.ExtrudeGeometry(footprint(), {
    depth,
    bevelEnabled: true,
    bevelSegments: 3,
    steps: 1,
    bevelSize: 0.045,
    bevelThickness: 0.035,
    curveSegments: 32,
  });
  g.rotateX(-Math.PI / 2);
  return g;
}

export function createKneeParts() {
  const metal = new THREE.MeshStandardMaterial({
    color: 0x99b6ad,
    metalness: 0.62,
    roughness: 0.28,
  });
  const polymer = new THREE.MeshStandardMaterial({
    color: 0xf0e6cd,
    metalness: 0,
    roughness: 0.42,
  });
  const femur = new THREE.Group();
  const bearing = new THREE.Group();
  const tibia = new THREE.Group();
  const groups = [femur, bearing, tibia];
  groups.forEach((group, index) => {
    group.name = kneePartNames[index];
    group.userData = {
      educationalIllustration: true,
      units: "arbitrary; not to scale",
      manufacturerGeometry: false,
    };
  });

  // Two open curved condylar shells; their interiors remain visible on rotation.
  const shell = new THREE.Shape();
  const start = -0.25,
    end = Math.PI * 1.08;
  shell.absarc(0, 0, 0.9, start, end, false);
  shell.lineTo(0.72 * Math.cos(end), 0.72 * Math.sin(end));
  shell.absarc(0, 0, 0.72, end, start, true);
  shell.closePath();
  const shellGeometry = new THREE.ExtrudeGeometry(shell, {
    depth: 0.68,
    bevelEnabled: true,
    bevelSize: 0.04,
    bevelThickness: 0.04,
    bevelSegments: 3,
    curveSegments: 48,
  });
  shellGeometry.rotateY(Math.PI / 2);
  shellGeometry.rotateX(Math.PI);
  for (const x of [-1.04, 0.36]) {
    const mesh = new THREE.Mesh(shellGeometry, metal);
    mesh.position.x = x;
    femur.add(mesh);
  }
  const shield = new THREE.Shape();
  shield.moveTo(-1.04, -0.12);
  shield.quadraticCurveTo(0, -0.48, 1.04, -0.12);
  shield.lineTo(0.86, 0.8);
  shield.quadraticCurveTo(0.54, 1.07, 0.24, 0.75);
  shield.quadraticCurveTo(0, 0.48, -0.24, 0.75);
  shield.quadraticCurveTo(-0.54, 1.07, -0.86, 0.8);
  shield.closePath();
  const shieldMesh = new THREE.Mesh(
    new THREE.ExtrudeGeometry(shield, {
      depth: 0.16,
      bevelEnabled: true,
      bevelSize: 0.06,
      bevelThickness: 0.04,
      bevelSegments: 3,
      curveSegments: 32,
    }),
    metal,
  );
  shieldMesh.position.z = 0.68;
  femur.add(shieldMesh);

  bearing.add(new THREE.Mesh(plate(0.19), polymer));
  // Shallow bowls illustrate the bearing surfaces, without a constraint design.
  for (const offset of [-0.65, 0.65]) {
    const vertices: number[] = [],
      indices: number[] = [];
    const rings = 12,
      segments = 48;
    for (let r = 0; r <= rings; r++)
      for (let a = 0; a <= segments; a++) {
        const t = (a / segments) * Math.PI * 2,
          radius = r / rings;
        vertices.push(
          offset + 0.47 * radius * Math.cos(t),
          0.21 + 0.16 * radius ** 2,
          0.52 * radius * Math.sin(t),
        );
      }
    for (let r = 0; r < rings; r++)
      for (let a = 0; a < segments; a++) {
        const i = r * (segments + 1) + a,
          j = i + segments + 1;
        indices.push(i, i + 1, j, i + 1, j + 1, j);
      }
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.Float32BufferAttribute(vertices, 3));
    g.setIndex(indices);
    g.computeVertexNormals();
    bearing.add(new THREE.Mesh(g, polymer));
  }
  tibia.add(new THREE.Mesh(plate(0.12), metal));
  const stem = new THREE.Mesh(
    new THREE.CylinderGeometry(0.16, 0.1, 1.1, 32),
    metal,
  );
  stem.position.y = -0.55;
  tibia.add(stem);
  const keel = new THREE.Mesh(new THREE.BoxGeometry(0.75, 0.46, 0.1), metal);
  keel.position.y = -0.22;
  tibia.add(keel);
  return groups;
}

export function disposeKneeParts(parts: THREE.Group[]) {
  const geometries = new Set<THREE.BufferGeometry>();
  const materials = new Set<THREE.Material>();
  parts.forEach((group) =>
    group.traverse((object) => {
      if (object instanceof THREE.Mesh) {
        geometries.add(object.geometry);
        const items = Array.isArray(object.material)
          ? object.material
          : [object.material];
        items.forEach((m) => materials.add(m));
      }
    }),
  );
  geometries.forEach((g) => g.dispose());
  materials.forEach((m) => m.dispose());
}
