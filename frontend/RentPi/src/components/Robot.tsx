import React, { useRef, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import { Float } from '@react-three/drei';
import * as THREE from 'three';

interface RobotProps {
  onClick: () => void;
}

const Robot: React.FC<RobotProps> = ({ onClick }) => {
  const [hovered, setHovered] = useState(false);
  const headRef = useRef<THREE.Mesh>(null);

  useFrame((state) => {
    if (headRef.current) {
      headRef.current.rotation.y = Math.sin(state.clock.elapsedTime * 0.5) * 0.2;
    }
  });

  return (
    <Float
      speed={2.5}
      rotationIntensity={0.5}
      floatIntensity={1.5}
      floatingRange={[-0.1, 0.1]}
    >
      <group
        onClick={(e) => {
          e.stopPropagation();
          onClick();
        }}
        onPointerOver={(e) => {
          e.stopPropagation();
          setHovered(true);
          document.body.style.cursor = 'pointer';
        }}
        onPointerOut={(e) => {
          e.stopPropagation();
          setHovered(false);
          document.body.style.cursor = 'auto';
        }}
      >
        {/* Head */}
        <mesh ref={headRef} position={[0, 0.5, 0]}>
          <boxGeometry args={[0.8, 0.6, 0.6]} />
          <meshStandardMaterial
            color={hovered ? '#4ade80' : '#22c55e'}
            roughness={0.3}
            metalness={0.8}
          />
          {/* Left Eye */}
          <mesh position={[-0.2, 0.1, 0.31]}>
            <boxGeometry args={[0.15, 0.15, 0.05]} />
            <meshStandardMaterial
              color={hovered ? '#ffffff' : '#000000'}
              emissive={hovered ? '#ffffff' : '#000000'}
              emissiveIntensity={2}
            />
          </mesh>
          {/* Right Eye */}
          <mesh position={[0.2, 0.1, 0.31]}>
            <boxGeometry args={[0.15, 0.15, 0.05]} />
            <meshStandardMaterial
              color={hovered ? '#ffffff' : '#000000'}
              emissive={hovered ? '#ffffff' : '#000000'}
              emissiveIntensity={2}
            />
          </mesh>
          {/* Antenna */}
          <mesh position={[0, 0.4, 0]}>
            <cylinderGeometry args={[0.02, 0.02, 0.2]} />
            <meshStandardMaterial color="#94a3b8" />
          </mesh>
          {/* Antenna Tip */}
          <mesh position={[0, 0.5, 0]}>
            <sphereGeometry args={[0.06]} />
            <meshStandardMaterial
              color="#3b82f6"
              emissive="#3b82f6"
              emissiveIntensity={1}
            />
          </mesh>
        </mesh>

        {/* Body */}
        <mesh position={[0, -0.1, 0]}>
          <boxGeometry args={[0.6, 0.5, 0.5]} />
          <meshStandardMaterial color="#e2e8f0" roughness={0.5} metalness={0.2} />
        </mesh>
      </group>
    </Float>
  );
};

export default Robot;
