import React, { useRef, useEffect } from "react";
import { useFrame } from "@react-three/fiber";

export default function Beaker({ length, restX, collectX, collecting, onClick }) {
  const groupRef = useRef();

  // Table is at y = 0
  const beakerH = 2.6; // Increased height to intersect falling stream at the table
  const beakerY = beakerH / 2; // Rests on table
  const beakerR = 0.4;

  useFrame((state, delta) => {
    if (!groupRef.current) return;

    const targetX = collecting ? collectX : restX;
    // Smoothly interpolate position towards target
    // The lerp factor (4.0 * delta) controls slide speed
    groupRef.current.position.x += (targetX - groupRef.current.position.x) * (4.0 * delta);
  });

  // If the user stretches the pipe length, the table extends and restX shifts.
  // We want to physically snap the beaker instantly to the new restX instead of slowly sliding it across the table.
  useEffect(() => {
    if (groupRef.current && !collecting) {
      groupRef.current.position.x = restX;
    }
  }, [restX, collecting]);

  return (
    <group ref={groupRef} position={[restX, 0, 0]} onClick={(e) => { if (onClick) { e.stopPropagation(); onClick(); } }}>
      {/* Beaker Glass */}
      <mesh position={[0, beakerY, 0]}>
        <cylinderGeometry args={[beakerR, beakerR, beakerH, 32, 1, true]} />
        <meshPhysicalMaterial color={0xffffff} transparent opacity={0.3} transmission={1.0} roughness={0.0} ior={1.5} side={2} />
      </mesh>
      {/* Beaker Base */}
      <mesh position={[0, 0.05, 0]}>
        <cylinderGeometry args={[beakerR + 0.05, beakerR + 0.05, 0.1, 32]} />
        <meshStandardMaterial color={0x222233} metalness={0.8} roughness={0.2} />
      </mesh>

      {/* Beaker Handle (Torus) */}
      <mesh position={[beakerR + 0.05, beakerH * 0.6, 0]} rotation={[0, 0, -Math.PI / 2]}>
        {/* arc length of Math.PI creates a half-circle C-handle */}
        <torusGeometry args={[0.3, 0.06, 16, 32, Math.PI]} />
        <meshStandardMaterial color={0x222233} roughness={0.4} metalness={0.1} />
      </mesh>

      {/* Volume Marks */}
      {[0.25, 0.5, 0.75].map((pct, i) => (
        <mesh key={i} position={[0, beakerH * pct, 0]}>
          <torusGeometry args={[beakerR, 0.005, 8, 32]} />
          <meshBasicMaterial color={0x000000} opacity={0.4} transparent />
        </mesh>
      ))}
    </group>
  );
}
