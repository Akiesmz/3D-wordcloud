import { useRef, useMemo, useState, useEffect } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { OrbitControls, Text, Sphere } from '@react-three/drei'
import * as THREE from 'three'

function Word({ text, position, fontSize, color }) {
  const meshRef = useRef()
  const [hovered, setHovered] = useState(false)
  const [scale, setScale] = useState(1)
  
  useFrame((state, delta) => {
    if (meshRef.current) {
      meshRef.current.lookAt(state.camera.position)
      
      // 添加呼吸效果
      const pulse = 0.02 * Math.sin(Date.now() * 0.002)
      meshRef.current.scale.setScalar(scale + pulse)
    }
  })

  useEffect(() => {
    if (hovered) {
      setScale(1.2)
    } else {
      setScale(1)
    }
  }, [hovered])

  const finalColor = hovered ? '#00ff88' : color
  const glowColor = hovered ? '#00ff88' : color

  return (
    <>
      <Text
        ref={meshRef}
        position={position}
        fontSize={fontSize}
        color={finalColor}
        anchorX="center"
        anchorY="middle"
        outlineWidth={0.02}
        outlineColor="#000000"
        onPointerOver={() => setHovered(true)}
        onPointerOut={() => setHovered(false)}
        castShadow
      >
        {text}
      </Text>
      {/* 发光效果 */}
      {hovered && (
        <Text
          position={position}
          fontSize={fontSize * 1.1}
          color={glowColor}
          anchorX="center"
          anchorY="middle"
          opacity={0.4}
        >
          {text}
        </Text>
      )}
    </>
  )
}

function WordCloud({ words }) {
  const groupRef = useRef()

  useFrame((state, delta) => {
    if (groupRef.current) {
      groupRef.current.rotation.y += delta * 0.2
    }
  })

  const colors = useMemo(() => [
    '#00d9ff', '#00ff88', '#ff6b6b', '#ffd93d',
    '#6bcb77', '#4d96ff', '#ff8b94', '#845ec2'
  ], [])

  return (
    <group ref={groupRef}>
      {words.map((word, index) => (
        <Word
          key={index}
          text={word.text}
          position={word.position}
          fontSize={word.fontSize}
          color={colors[index % colors.length]}
        />
      ))}
    </group>
  )
}

function ParticleSphere() {
  const particlesRef = useRef()
  const [time, setTime] = useState(0)
  
  const particlePositions = useMemo(() => {
    const positions = []
    const count = 800
    
    for (let i = 0; i < count; i++) {
      const phi = Math.acos(-1 + (2 * i) / count)
      const theta = Math.sqrt(count * Math.PI) * phi
      
      const x = 5 * Math.cos(theta) * Math.sin(phi)
      const y = 5 * Math.sin(theta) * Math.sin(phi)
      const z = 5 * Math.cos(phi)
      
      positions.push(x, y, z)
    }
    
    return new Float32Array(positions)
  }, [])

  useFrame((state, delta) => {
    if (particlesRef.current) {
      particlesRef.current.rotation.y += delta * 0.05
      setTime(prev => prev + delta)
    }
  })

  return (
    <>
      {/* 外层粒子 */}
      <points ref={particlesRef}>
        <bufferGeometry>
          <bufferAttribute
            attach="attributes-position"
            count={particlePositions.length / 3}
            array={particlePositions}
            itemSize={3}
          />
        </bufferGeometry>
        <pointsMaterial
          size={0.08}
          color="#00d9ff"
          transparent
          opacity={0.6}
          sizeAttenuation
          // 脉冲效果
          onBeforeCompile={(shader) => {
            shader.uniforms.time = { value: 0 }
            shader.fragmentShader = `
              uniform float time;
              ${shader.fragmentShader}
            `.replace(
              '#include <color_fragment>',
              `#include <color_fragment>
              float pulse = 0.5 + 0.5 * sin(time * 2.0 + length(gl_PointCoord - 0.5) * 10.0);
              diffuseColor.a *= pulse;
              `
            )
            shader.onBeforeRender = (_, __, material) => {
              material.uniforms.time.value = time
            }
          }}
        />
      </points>
      
      {/* 内层粒子 */}
      <points>
        <bufferGeometry>
          <bufferAttribute
            attach="attributes-position"
            count={particlePositions.length / 6}
            array={new Float32Array(particlePositions.slice(0, particlePositions.length / 2))}
            itemSize={3}
          />
        </bufferGeometry>
        <pointsMaterial
          size={0.05}
          color="#00ff88"
          transparent
          opacity={0.4}
          sizeAttenuation
        />
      </points>
      
      {/* 中心发光效果 */}
      <sphereGeometry args={[1, 32, 32]} />
      <meshStandardMaterial
        color="#00d9ff"
        transparent
        opacity={0.1}
        emissive="#00d9ff"
        emissiveIntensity={0.5}
      />
    </>
  )
}

function WordCloud3D({ words }) {
  return (
    <>
      <Canvas
        camera={{ position: [0, 0, 10], fov: 60 }}
        style={{ background: 'transparent' }}
        shadows
      >
        <ambientLight intensity={0.5} />
        <pointLight position={[10, 10, 10]} intensity={1} castShadow />
        <pointLight position={[-10, -10, -10]} intensity={0.5} color="#00d9ff" />
        <pointLight position={[0, 10, 0]} intensity={0.3} color="#00ff88" />
        
        <WordCloud words={words} />
        <ParticleSphere />
        
        <OrbitControls
          enableZoom={true}
          enablePan={false}
          minDistance={5}
          maxDistance={20}
          autoRotate={false}
        />
      </Canvas>
      <div className="hint">
        🖱️ 拖拽旋转 | 滚轮缩放 | 悬停查看
      </div>
    </>
  )
}

export default WordCloud3D
