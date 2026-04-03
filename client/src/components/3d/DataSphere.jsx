import React, { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import { MeshTransmissionMaterial, Wireframe } from '@react-three/drei';
import * as THREE from 'three';

export default function DataSphere() {
  const meshRef = useRef();
  const materialRef = useRef();

  // Basic uniform rotation
  useFrame((state, delta) => {
    if (meshRef.current) {
      meshRef.current.rotation.y += delta * 0.2;
      meshRef.current.rotation.x += delta * 0.1;
    }
    
    // Animate shader effect if using custom material, else we map mouse to position
    if (meshRef.current) {
       // Subtle mouse follow
       const targetX = (state.pointer.x * Math.PI) / 4;
       const targetY = (state.pointer.y * Math.PI) / 4;
       
       meshRef.current.rotation.y += (targetX - meshRef.current.rotation.y) * 0.05;
       meshRef.current.rotation.x += (-targetY - meshRef.current.rotation.x) * 0.05;
    }
  });

  return (
    <group>
      <mesh ref={meshRef}>
        <sphereGeometry args={[2, 64, 64]} />
        {/* Glassmorphic material */}
        <MeshTransmissionMaterial 
          ref={materialRef}
          backside={true}
          samples={16}
          thickness={0.5}
          anisotropicBlur={0.2}
          ior={1.5}
          chromaticAberration={0.05}
          color="#a855f7"
          distortion={0.2}
          distortionScale={0.5}
          temporalDistortion={0.1}
        />
        
        {/* Inner wireframe "Data nodes" */}
        <mesh>
          <sphereGeometry args={[1.8, 24, 24]} />
          <meshBasicMaterial color="#3b82f6" wireframe={true} transparent opacity={0.3} />
        </mesh>
      </mesh>
    </group>
  );
}
