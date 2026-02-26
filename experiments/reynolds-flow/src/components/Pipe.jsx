import * as THREE from 'three';
import { useRef, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';

export default function GlassPipe({ length, valveOpen, diameter, onClick }) {
  const pipeJoinX = -3.6;
  const pipeLength = length * 5;
  const pipeY = 3.0;
  const radius = diameter * 15;

  const fillRef = useRef();
  const fillStartRef = useRef(0);

  // Custom Uniform for shader injection
  const uniformsRef = useRef({
    uFillRatio: { value: 0.0 },
    uColorGreen: { value: new THREE.Color(0x44ffcc) },
    uColorBlue: { value: new THREE.Color(0x1166ff) },
    uLength: { value: pipeLength }
  });

  // Initialize start time on first open
  useEffect(() => {
    if (valveOpen && fillStartRef.current === 0) {
      fillStartRef.current = Date.now();
    } else if (!valveOpen) {
      fillStartRef.current = 0;
    }
  }, [valveOpen]);

  // Update dynamic uniform
  useEffect(() => {
    uniformsRef.current.uLength.value = pipeLength;
  }, [pipeLength]);

  useFrame(() => {
    if (!fillRef.current) return;

    if (valveOpen) {
      const elapsed = (Date.now() - fillStartRef.current) / 1000;
      const fillRatio = Math.min(elapsed / 5.0, 1.0);

      // Scale on Z axis since cylinder is rotated Math.PI/2 on X or Z (here Z axis rotation means it lies along X)
      // Actually, standard cylinder is along Y. Rotation [0,0,Math.PI/2] aligns Y to X.
      // So scaling Y stretches it along the pipe's X axis.
      fillRef.current.scale.y = fillRatio;

      // Need to adjust position so it fills from the left (pipeJoinX) instead of center out
      const fillLen = pipeLength * fillRatio;
      // The mesh is currently centered at pipeJoinX + pipeLength/2
      // We want the left edge of the scaled cylinder to always be at pipeJoinX
      // Cylinder center is at Y=0 relative to its local space.
      fillRef.current.position.x = pipeJoinX + fillLen / 2;
      fillRef.current.visible = fillRatio > 0;

      // Pass ratio to Shader
      uniformsRef.current.uFillRatio.value = fillRatio;
    } else {
      fillRef.current.visible = false;
      fillRef.current.scale.y = 0.001; // Avoid 0
      uniformsRef.current.uFillRatio.value = 0.0;
    }
  });

  const onBeforeCompile = (shader) => {
    shader.uniforms.uFillRatio = uniformsRef.current.uFillRatio;
    shader.uniforms.uColorGreen = uniformsRef.current.uColorGreen;
    shader.uniforms.uColorBlue = uniformsRef.current.uColorBlue;
    shader.uniforms.uLength = uniformsRef.current.uLength;

    // We get local Y from cylinder (since it's rotated Z -> X) to blend smoothly
    // Standard cylinder length spans from -length/2 to +length/2 along its original Y axis.
    shader.vertexShader = `
      varying float vOriginalY;
      ${shader.vertexShader}
    `.replace(
      `#include <begin_vertex>`,
      `#include <begin_vertex>
       vOriginalY = position.y;`
    );

    shader.fragmentShader = `
      uniform float uFillRatio;
      uniform vec3 uColorGreen;
      uniform vec3 uColorBlue;
      uniform float uLength;
      varying float vOriginalY;
      ${shader.fragmentShader}
    `.replace(
      `vec4 diffuseColor = vec4( diffuse, opacity );`,
      `
        // Calculate relative position from 0 to 1 along the cylinder length
        // position.y ranges from -uLength/2 to uLength/2, but rotated by PI/2 means +y is -x
        float normalizedLocalX = (-vOriginalY + uLength / 2.0) / uLength;
        
        // If local position is less than the current fill ratio, color it blue. 
        // Add a tiny smoothstep for anti-aliasing the boundary line
        float mixFactor = smoothstep(uFillRatio - 0.01, uFillRatio + 0.01, normalizedLocalX);
        vec3 finalColor = mix(uColorBlue, uColorGreen, mixFactor);
        
        vec4 diffuseColor = vec4( finalColor, opacity );
        `
    );
  };

  return (
    <group>
      <mesh
        position={[pipeJoinX + pipeLength / 2, pipeY, 0]}
        rotation={[0, 0, Math.PI / 2]}
        onClick={(e) => { if (onClick) { e.stopPropagation(); onClick(); } }}
      >
        <cylinderGeometry args={[radius, radius, pipeLength, 32]} />
        <meshPhysicalMaterial
          color={0xffffff}
          transparent
          opacity={0.3}
          transmission={1.0}
          roughness={0.0}
          ior={1.5}
          side={THREE.DoubleSide}
          onBeforeCompile={onBeforeCompile}
        />
      </mesh>

      {/* Liquid Fill Cylinder positioned globally, inside the pipe */}
      <mesh
        ref={fillRef}
        position={[pipeJoinX, pipeY, 0]}
        rotation={[0, 0, Math.PI / 2]}
        visible={false}
      >
        <cylinderGeometry args={[radius - 0.01, radius - 0.01, pipeLength, 32]} />
        <meshStandardMaterial
          color={0x1166ff}
          transparent
          opacity={0.4}
          roughness={0.1}
        />
      </mesh>
    </group>
  );
}
