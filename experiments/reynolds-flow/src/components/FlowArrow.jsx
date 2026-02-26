import React, { useRef } from "react";
import { useFrame } from "@react-three/fiber";

export default function FlowArrow({
    position = [0, 0, 0],
    rotation = [0, 0, 0],
    active = true,
    color = "#ff2222",
    scale = 1
}) {
    const groupRef = useRef();

    // Bobbing animation along the local Z axis (which points "forward" after rotation)
    useFrame((state) => {
        if (!groupRef.current) return;

        if (active) {
            // Animate moving forward and resetting quickly (like a flow pulse)
            // Time multiplier controls speed. Modulo keeps it looping 0-1.
            const t = (state.clock.elapsedTime * 2.5) % 1;

            // Move along the local Y axis (since cones point UP by default on Y)
            groupRef.current.position.y = t * 0.4;
        } else {
            // Reset position if inactive
            groupRef.current.position.y = 0;
        }
    });

    if (!active) return null;

    return (
        <group position={position} rotation={rotation} scale={scale}>
            {/* Inner group handles the animation offset on the Y axis */}
            <group ref={groupRef}>
                {/* Arrow Head (Cone) */}
                <mesh position={[0, 0.2, 0]}>
                    <coneGeometry args={[0.08, 0.2, 16]} />
                    <meshStandardMaterial color={color} emissive={color} emissiveIntensity={0.6} roughness={0.2} metalness={0.1} />
                </mesh>

                {/* Arrow Tail (Cylinder) */}
                <mesh position={[0, 0, 0]}>
                    <cylinderGeometry args={[0.03, 0.03, 0.2, 16]} />
                    <meshStandardMaterial color={color} emissive={color} emissiveIntensity={0.6} roughness={0.2} metalness={0.1} />
                </mesh>
            </group>
        </group>
    );
}
