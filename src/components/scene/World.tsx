import { useMemo, useRef, useEffect } from 'react'
import * as THREE from 'three'
import { RigidBody, CylinderCollider, BallCollider } from '@react-three/rapier'
import { useGLTF } from '@react-three/drei'
import { TREE_COUNT, ROCK_COUNT, BUSH_COUNT, WORLD_SIZE } from '@/utils/constants'
import { scatterPositions } from '@/utils/math'

import { Bone } from '@/components/environment/Bone'
import { InteractableZone } from '@/components/environment/InteractableZone'

/**
 * Open Natural Meadow & Forest Environment
 * Features:
 * - 3D Pine Tree model by Quaternius (tree.glb) with textured bark & pine needles
 * - Natural rock clusters and bushes
 * - Rapier physics colliders for all tree trunks and rocks
 * - Collectible glowing golden bones
 * - Markable trees for territory marking & sniffing
 */
export function World(): JSX.Element {
  // Scatter positions across the natural field
  const treePositions = useMemo(() => scatterPositions(45, WORLD_SIZE * 0.85, 4), [])
  const rockPositions = useMemo(() => scatterPositions(30, WORLD_SIZE * 0.8, 3), [])
  const bushPositions = useMemo(() => scatterPositions(25, WORLD_SIZE * 0.75, 2.5), [])

  // Collectible bones hidden across the meadow
  const bones: [string, [number, number, number]][] = [
    ['bone-1', [3, 0, -4]],
    ['bone-2', [-7, 0, -5]],
    ['bone-3', [8, 0, 10]],
    ['bone-4', [-12, 0, 9]],
    ['bone-5', [14, 0, -14]],
    ['bone-6', [-9, 0, -18]],
    ['bone-7', [16, 0, 22]],
    ['bone-8', [-15, 0, 26]],
  ]

  // Designated markable landmark trees
  const markableTrees: [string, [number, number, number]][] = useMemo(() => {
    return treePositions.slice(0, 6).map((pos, idx) => [`mark-tree-${idx}`, [pos.x, 0, pos.z]])
  }, [treePositions])

  return (
    <group>
      {/* ── 1. Quaternius Pine Trees ── */}
      <PineForest positions={treePositions} />

      {/* ── 2. Natural Rocks and Bushes ── */}
      <PlaceholderRocks positions={rockPositions} />
      <PlaceholderBushes positions={bushPositions} />

      {/* ── 3. Physics Colliders for Trees & Rocks ── */}
      <RigidBody type="fixed" colliders={false}>
        {treePositions.map((pos, i) => (
          <CylinderCollider
            key={`tree-col-${i}`}
            args={[3.5, 0.45]}
            position={[pos.x, 3.5, pos.z]}
          />
        ))}
        {rockPositions.map((pos, i) => (
          <BallCollider
            key={`rock-col-${i}`}
            args={[0.42]}
            position={[pos.x, 0.25, pos.z]}
          />
        ))}
      </RigidBody>

      {/* ── 4. Markable Landmark Trees (Pee & Sniff Target Zones) ── */}
      {markableTrees.map(([id, pos]) => (
        <InteractableZone key={id} id={id} type="tree" position={pos} radius={2.5} />
      ))}

      {/* ── 5. Collectible Golden Bones ── */}
      {bones.map(([id, pos]) => (
        <Bone key={id} id={id} position={pos} />
      ))}
    </group>
  )
}

// ─── Quaternius Pine Trees Component ─────────────────────────────────────────

function PineForest({ positions }: { positions: THREE.Vector3[] }): JSX.Element {
  const { scene } = useGLTF('/assets/models/tree.glb')
  const meshRef1 = useRef<THREE.InstancedMesh>(null)
  const meshRef2 = useRef<THREE.InstancedMesh>(null)

  const { geo1, mat1, geo2, mat2 } = useMemo(() => {
    const meshes: THREE.Mesh[] = []
    scene.traverse((child) => {
      if ((child as THREE.Mesh).isMesh) meshes.push(child as THREE.Mesh)
    })
    return {
      geo1: meshes[0]?.geometry,
      mat1: meshes[0]?.material,
      geo2: meshes[1]?.geometry || meshes[0]?.geometry,
      mat2: meshes[1]?.material || meshes[0]?.material,
    }
  }, [scene])

  useEffect(() => {
    if (!meshRef1.current || !meshRef2.current || !geo1) return
    const dummy = new THREE.Object3D()
    positions.forEach((pos, i) => {
      const scale = 0.8 + ((i % 5) * 0.1)
      dummy.position.set(pos.x, 0, pos.z)
      dummy.rotation.set(0, (i * 1.6) % (Math.PI * 2), 0)
      dummy.scale.set(scale, scale, scale)
      dummy.updateMatrix()

      meshRef1.current?.setMatrixAt(i, dummy.matrix)
      meshRef2.current?.setMatrixAt(i, dummy.matrix)
    })
    meshRef1.current.instanceMatrix.needsUpdate = true
    meshRef2.current.instanceMatrix.needsUpdate = true
    meshRef1.current.computeBoundingSphere()
    meshRef2.current.computeBoundingSphere()
  }, [positions, geo1])

  if (!geo1 || !mat1) return <group />

  return (
    <group>
      <instancedMesh
        ref={meshRef1}
        args={[geo1, mat1, positions.length]}
        frustumCulled={false}
        castShadow
        receiveShadow
      />
      <instancedMesh
        ref={meshRef2}
        args={[geo2, mat2, positions.length]}
        frustumCulled={false}
        castShadow
        receiveShadow
      />
    </group>
  )
}

useGLTF.preload('/assets/models/tree.glb')

// ─── Natural Rocks ───────────────────────────────────────────────────────────

const DUMMY_OBJ = new THREE.Object3D()

function PlaceholderRocks({ positions }: { positions: THREE.Vector3[] }): JSX.Element {
  const rocksRef = useMemo(() => {
    const mesh = new THREE.InstancedMesh(
      new THREE.DodecahedronGeometry(0.5, 1),
      new THREE.MeshStandardMaterial({ color: '#57606f', roughness: 0.95, flatShading: true }),
      positions.length
    )
    positions.forEach((pos, i) => {
      DUMMY_OBJ.position.set(pos.x, 0.25, pos.z)
      DUMMY_OBJ.rotation.set(
        Math.sin(i * 3.7) * 0.4,
        Math.sin(i * 2.1) * Math.PI,
        Math.sin(i * 4.3) * 0.3
      )
      DUMMY_OBJ.scale.setScalar(0.6 + Math.sin(i * 1.7) * 0.4)
      DUMMY_OBJ.updateMatrix()
      mesh.setMatrixAt(i, DUMMY_OBJ.matrix)
    })
    mesh.instanceMatrix.needsUpdate = true
    mesh.frustumCulled = false
    mesh.castShadow = true
    mesh.receiveShadow = true
    return mesh
  }, [positions])

  return <primitive object={rocksRef} />
}

// ─── Natural Bushes ──────────────────────────────────────────────────────────

function PlaceholderBushes({ positions }: { positions: THREE.Vector3[] }): JSX.Element {
  const bushesRef = useMemo(() => {
    const mesh = new THREE.InstancedMesh(
      new THREE.SphereGeometry(0.6, 7, 6),
      new THREE.MeshStandardMaterial({ color: '#2ed573', roughness: 0.85, flatShading: true }),
      positions.length
    )
    positions.forEach((pos, i) => {
      DUMMY_OBJ.position.set(pos.x, 0.38, pos.z)
      DUMMY_OBJ.scale.set(
        0.85 + Math.sin(i * 2.3) * 0.3,
        0.75 + Math.sin(i * 1.9) * 0.2,
        0.95 + Math.sin(i * 3.1) * 0.25
      )
      DUMMY_OBJ.updateMatrix()
      mesh.setMatrixAt(i, DUMMY_OBJ.matrix)
    })
    mesh.instanceMatrix.needsUpdate = true
    mesh.frustumCulled = false
    mesh.castShadow = true
    mesh.receiveShadow = true
    return mesh
  }, [positions])

  return <primitive object={bushesRef} />
}
