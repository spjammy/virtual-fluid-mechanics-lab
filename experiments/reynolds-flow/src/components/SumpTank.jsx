import React from "react";
import { RoundedBox } from "@react-three/drei";
import * as THREE from "three";

export default function SumpTank({ pipeLength = 5.0, pipeJoinX = -3.6, pumpX = -4.6, sumpY = -3.5, onClick }) {
    // Large rectangular tank sitting on the floor under the table

    // The table rests between X = -6.5 and X = pipeJoinX + pipeLength + 3.0
    // The table legs are placed 0.5 units inward from the table edges.
    const tableRightX = pipeJoinX + pipeLength + 5.0;
    const rightLegX = tableRightX - 0.5;

    // Pump platform extends to around pumpX + 1.1. Sump starts after the pump.
    const leftEdgeX = pumpX + 1.5;
    const rightEdgeX = rightLegX - 0.2; // End before the right leg

    const tankWidth = rightEdgeX - leftEdgeX;
    const tankHeight = 2.0;
    const tankDepth = 3.0;

    // Position it centered perfectly between the edges
    const tankX = (leftEdgeX + rightEdgeX) / 2;
    // Rests on sumpY
    const tankY = sumpY + tankHeight / 2;
    const tankZ = 0;

    const glassMaterial = new THREE.MeshPhysicalMaterial({
        color: 0x90c0ff,
        metalness: 0.1,
        roughness: 0.1,
        transmission: 0.8,
        ior: 1.5,
        thickness: 0.1,
        clearcoat: 1.0,
        clearcoatRoughness: 0.1,
        side: THREE.DoubleSide,
        transparent: true,
        opacity: 0.7
    });

    const waterMaterial = new THREE.MeshPhysicalMaterial({
        color: 0x0066ff,
        transmission: 0.9,
        opacity: 0.8,
        transparent: true,
        roughness: 0.0,
        ior: 1.33
    });

    return (
        <group position={[tankX, tankY, tankZ]} onClick={(e) => {
            if (onClick) {
                e.stopPropagation();
                onClick();
            }
        }}>
            {/* The outer plastic/glass shell */}
            <RoundedBox args={[tankWidth, tankHeight, tankDepth]} radius={0.2} smoothness={4}>
                <primitive object={glassMaterial} attach="material" />
            </RoundedBox>

            {/* The inner body of water */}
            <mesh position={[0, -0.2, 0]}>
                <boxGeometry args={[tankWidth - 0.2, tankHeight - 0.4, tankDepth - 0.2]} />
                <primitive object={waterMaterial} attach="material" />
            </mesh>

            {/* Invisible Hitbox for easier clicking */}
            <mesh visible={false}>
                <boxGeometry args={[tankWidth + 0.5, tankHeight + 0.5, tankDepth + 0.5]} />
                <meshBasicMaterial />
            </mesh>
        </group>
    );
}
