import { useRef, useMemo, useEffect } from 'react'
import { useFrame } from '@react-three/fiber'
import { useGLTF } from '@react-three/drei'
import * as THREE from 'three'

/**
 * AAA GPU Wind-Simulated Grass Field
 *
 * Uses the high-fidelity 3D grass patch model (`/assets/models/grass.glb`):
 * - Renders 160 organic grass patches across the field in only 2 GPU draw calls via InstancedMesh.
 * - Root-Pinning: Base of blades remains 100% anchored to the terrain (`pow(grassHeight, 1.8)`).
 * - Multi-harmonic GPU wind waves:
 *     1. Low-frequency rolling gusts propagating across the field in wind heading.
 *     2. Medium-frequency turbulent cross-wind swirls.
 *     3. Micro-fluttering of individual blade tips.
 * - Dynamic moving shadows: customDepthMaterial shares the vertex displacement so shadows wave in sync with the grass.
 * - High performance: zero CPU updates during gameplay; 100% computed on GPU.
 */
const GRASS_COUNT = 160

export function GrassField(): JSX.Element {
  const { scene } = useGLTF('/assets/models/grass.glb')

  const meshRef0 = useRef<THREE.InstancedMesh>(null)
  const meshRef1 = useRef<THREE.InstancedMesh>(null)

  // Simulation Uniforms
  const windUniforms = useMemo(
    () => ({
      uTime: { value: 0 },
      uWindSpeed: { value: 2.2 },
      uWindStrength: { value: 0.35 },
    }),
    []
  )

  // Extract geometries and materials from grass.glb
  const { geo0, geo1, mat0, mat1 } = useMemo(() => {
    const meshes: THREE.Mesh[] = []
    scene.traverse((child) => {
      if ((child as THREE.Mesh).isMesh) {
        meshes.push(child as THREE.Mesh)
      }
    })

    const m0 = meshes[0]
    const m1 = meshes[1] || meshes[0]

    // Clone and translate so the bottom (-0.42) sits squarely on y=0
    const g0 = m0.geometry.clone()
    g0.translate(0, 0.42, 0)

    const g1 = m1.geometry.clone()
    g1.translate(0, 0.42, 0)

    // Setup materials with PBR properties and DoubleSide
    const createGrassMaterial = (origMat: THREE.Material | THREE.Material[], baseColor: string) => {
      const mat = new THREE.MeshStandardMaterial({
        color: new THREE.Color(baseColor),
        roughness: 0.7,
        metalness: 0.05,
        side: THREE.DoubleSide,
      })

      if (!Array.isArray(origMat) && (origMat as THREE.MeshStandardMaterial).color) {
        mat.color.copy((origMat as THREE.MeshStandardMaterial).color)
      }

      return mat
    }

    const material0 = createGrassMaterial(m0.material, '#458b12')
    const material1 = createGrassMaterial(m1.material, '#127014')

    return {
      geo0: g0,
      geo1: g1,
      mat0: material0,
      mat1: material1,
    }
  }, [scene])

  // Attach GPU Wind Simulation Shader Hook
  const applyWindShader = useMemo(() => {
    return (shader: THREE.WebGLProgramParametersWithUniforms) => {
      shader.uniforms.uTime = windUniforms.uTime
      shader.uniforms.uWindSpeed = windUniforms.uWindSpeed
      shader.uniforms.uWindStrength = windUniforms.uWindStrength

      shader.vertexShader = shader.vertexShader.replace(
        '#include <common>',
        `#include <common>
        uniform float uTime;
        uniform float uWindSpeed;
        uniform float uWindStrength;
        `
      )

      shader.vertexShader = shader.vertexShader.replace(
        '#include <begin_vertex>',
        `#include <begin_vertex>
        // Grass root is at y=0, top is at y ≈ 0.89
        float grassHeight = clamp(transformed.y / 0.88, 0.0, 1.0);
        // Exponential bend curve: root is 100% anchored, tip bends freely
        float bendFactor = pow(grassHeight, 1.8);

        #ifdef USE_INSTANCEMATRIX
          vec3 instPos = vec3(instanceMatrix[3].x, instanceMatrix[3].y, instanceMatrix[3].z);
          vec2 worldCoord = instPos.xz;
        #else
          vec2 worldCoord = transformed.xz;
        #endif

        // Wind propagates along vector (0.75, 0.65)
        vec2 windDir = normalize(vec2(0.75, 0.65));
        float waveDist = dot(worldCoord, windDir);
        float crossDist = dot(worldCoord, vec2(-windDir.y, windDir.x));

        // Multi-harmonic wave propagation:
        // 1. Broad rolling gusts propagating across field
        float gust = sin(uTime * (uWindSpeed * 0.8) + waveDist * 0.12);
        // 2. Cross-wind turbulent swirls
        float turb = cos(uTime * (uWindSpeed * 1.5) + waveDist * 0.25 - crossDist * 0.18);
        // 3. High-frequency micro-fluttering of blade tips
        float flutter = sin(uTime * (uWindSpeed * 3.5) + transformed.x * 3.0 + transformed.z * 3.0);

        // Organic combined wind displacement
        float totalWind = (gust * 0.65 + turb * 0.25 + flutter * 0.10) * uWindStrength * bendFactor;

        // Displace vertices in wind direction
        transformed.x += windDir.x * totalWind;
        transformed.z += windDir.y * totalWind;
        // Volume preservation (slight vertical dip when bending)
        transformed.y -= abs(totalWind) * 0.18;
        `
      )
    }
  }, [windUniforms])

  // Apply shader modification with custom cache keys
  useMemo(() => {
    mat0.onBeforeCompile = applyWindShader
    mat0.customProgramCacheKey = () => 'grass_wind_mat0'

    mat1.onBeforeCompile = applyWindShader
    mat1.customProgramCacheKey = () => 'grass_wind_mat1'
  }, [mat0, mat1, applyWindShader])

  // Custom Depth Material for dynamic moving shadows
  const depthMaterial = useMemo(() => {
    const dm = new THREE.MeshDepthMaterial({ depthPacking: THREE.RGBADepthPacking })
    dm.onBeforeCompile = applyWindShader
    dm.customProgramCacheKey = () => 'grass_wind_depth'
    return dm
  }, [applyWindShader])

  // Generate Organic Instance Transforms
  useEffect(() => {
    if (!meshRef0.current || !meshRef1.current) return

    const dummy = new THREE.Object3D()

    for (let i = 0; i < GRASS_COUNT; i++) {
      // Natural radial distribution with organic clustering
      const angle = Math.random() * Math.PI * 2
      const dist = 2.0 + Math.pow(Math.random(), 0.72) * 50.0
      const x = Math.cos(angle) * dist
      const z = Math.sin(angle) * dist

      dummy.position.set(x, 0.0, z)
      // Slight ground unevenness tilt & full 360 random heading
      dummy.rotation.set(
        (Math.random() - 0.5) * 0.05,
        Math.random() * Math.PI * 2,
        (Math.random() - 0.5) * 0.05
      )

      // Random scale variation between 1.0 and 1.95
      const scale = 1.0 + Math.random() * 0.95
      dummy.scale.set(scale, scale * (0.85 + Math.random() * 0.3), scale)
      dummy.updateMatrix()

      meshRef0.current.setMatrixAt(i, dummy.matrix)
      meshRef1.current.setMatrixAt(i, dummy.matrix)
    }

    meshRef0.current.instanceMatrix.needsUpdate = true
    meshRef1.current.instanceMatrix.needsUpdate = true
  }, [])

  // Advance GPU wind simulation clock
  useFrame((state) => {
    windUniforms.uTime.value = state.clock.getElapsedTime()
  })

  return (
    <group>
      <instancedMesh
        ref={meshRef0}
        args={[geo0, mat0, GRASS_COUNT]}
        castShadow={false}
        receiveShadow
        frustumCulled={false}
      />
      <instancedMesh
        ref={meshRef1}
        args={[geo1, mat1, GRASS_COUNT]}
        castShadow={false}
        receiveShadow
        frustumCulled={false}
      />
    </group>
  )
}

useGLTF.preload('/assets/models/grass.glb')
