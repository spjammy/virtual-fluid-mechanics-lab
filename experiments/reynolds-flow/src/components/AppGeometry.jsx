import React, { useRef, useEffect, useMemo } from "react";
import * as THREE from "three";
import { useFrame } from "@react-three/fiber";
import { RoundedBox, MeshTransmissionMaterial } from "@react-three/drei";
import FlowArrow from "./FlowArrow";

export default function AppGeometry({ length, diameter, velocity = 1.0, pumpOn, sumpX = 0, sumpY = -4.5, onClick, onOverflowClick }) {
    const pipeLength = length * 5;
    const pipeJoinX = -3.6;

    // Ground Truth Constants
    const pipeY = 3.0; // Cannot change this, water flow assumes this height
    const tableY = 0;  // Table top at zero

    // Water Tank (Rests perfectly on table, center pipe aligns with pipeY)
    const tankH = 7.2; // 7.2 height, resting on y=0 -> center is y=3.6
    const tankW = 2.4;
    const tankY = 3.6; // y = 3.6
    const tankX = pipeJoinX - tankW / 2 + 0.1; // Extends back from the join point

    // We animate the water scaling up when the pump is turned on
    const waterRef = useRef();
    const fillRatioRef = useRef(pumpOn ? 1.0 : 0.0);

    // Overflow Animation Constants and State
    const overflowBubblesRef = useRef();
    const overflowArrowRef = useRef();
    const pipeInnerRadius = 0.08 * 0.7;

    // Calculate the height of the water at 80% full
    // The tank's center is at 0 in this local coordinate system
    // So bottom is -tankH/2, top is +tankH/2. Height is tankH.
    // 80% height from bottom is: -tankH/2 + (tankH * 0.8)
    const overflowLevelY = -tankH / 2 + (tankH * 0.8);

    // Segment 1: Backwards out of tank
    const s1Start = { x: 0, y: overflowLevelY, z: -tankW / 2 };
    const s1End = { x: 0, y: overflowLevelY, z: -(tankW / 2 + 0.3) }; // Route slightly further back
    const len1 = Math.abs(s1End.z - s1Start.z);

    // Segment 2: Vertical drop down behind table
    const s2End = { x: s1End.x, y: (sumpY - tankY) + 1.0, z: s1End.z }; // Drop cleanly below the table to floor level
    const len2 = Math.abs(s2End.y - s1End.y);

    // Segment 3: Horizontal travel to sumpX
    // NOTE: sumpX is in global coordinates, AppGeometry is centered at tankX
    const localSumpX = sumpX - tankX;
    const s3End = { x: localSumpX, y: s2End.y, z: s2End.z };
    const len3 = Math.abs(s3End.x - s2End.x);

    // Segment 4: Horizontal travel forward to center Z
    const s4End = { x: s3End.x, y: s3End.y, z: 0 };
    const len4 = Math.abs(s4End.z - s3End.z);

    // Segment 5: Vertical drop into sump
    const s5End = { x: s4End.x, y: (sumpY - tankY), z: s4End.z };
    const len5 = Math.abs(s5End.y - s4End.y);

    const overTotalLen = len1 + len2 + len3 + len4 + len5;
    const overBubbleCount = 25;

    const overBubblesData = useMemo(() => {
        return Array.from({ length: overBubbleCount }).map((_, i) => ({
            progress: (i / overBubbleCount) * overTotalLen
        }));
    }, [overBubbleCount, overTotalLen]);

    // If pump isOn, fill to 1. If pump is off, it drains (optional) or stays. 
    // Usually it drains when the valve is open, but to keep it simple: 
    // Pump On = Fills up in 3 seconds. Pump Off = stays (or drops instantly to 0 if resetting).
    useEffect(() => {
        if (!pumpOn) {
            fillRatioRef.current = 0.0;
        }
    }, [pumpOn]);

    useFrame((state, delta) => {
        if (!waterRef.current) return;

        if (pumpOn && fillRatioRef.current < 0.8) {
            // Fill over ~3 seconds
            fillRatioRef.current = Math.min(fillRatioRef.current + delta / 3.0, 0.8);
        }

        // Apply scale. Prevent scale Y = 0 which causes errors
        const displayScale = Math.max(fillRatioRef.current, 0.001);
        waterRef.current.scale.y = displayScale;

        // As scale.y grows, we must shift the position up so the bottom stays anchored
        // Original height is (tankH - 0.1). Bottom is at - (tankH - 0.1)/2.
        const maxWaterH = tankH - 0.1;
        const currentWaterH = maxWaterH * displayScale;
        waterRef.current.position.y = -maxWaterH / 2 + currentWaterH / 2 - 0.05;

        // Animate Overflow Bubbles
        if (overflowBubblesRef.current) {
            // Only overflow if the tank is full (0.8) and the pump is still pushing water in
            const isOverflowing = pumpOn && fillRatioRef.current >= 0.799;
            const flowSpeed = isOverflowing ? 2.0 : 0.0;

            if (overflowArrowRef.current) {
                overflowArrowRef.current.visible = isOverflowing;
            }

            overflowBubblesRef.current.children.forEach((b, i) => {
                let p = overBubblesData[i].progress + delta * flowSpeed;
                if (p > overTotalLen) p -= overTotalLen;
                overBubblesData[i].progress = p;

                if (p < len1) {
                    // Moving backwards out of tank
                    b.position.set(s1Start.x, s1Start.y, s1Start.z - p);
                } else if (p < len1 + len2) {
                    // Moving down behind table
                    const vP = p - len1;
                    b.position.set(s1End.x, s1End.y - vP, s1End.z);
                } else if (p < len1 + len2 + len3) {
                    // Moving sideways to sumpX
                    const hP = p - (len1 + len2);
                    const dir = Math.sign(s3End.x - s2End.x);
                    b.position.set(s2End.x + dir * hP, s2End.y, s2End.z);
                } else if (p < len1 + len2 + len3 + len4) {
                    // Moving forwards to center Z
                    const fP = p - (len1 + len2 + len3);
                    b.position.set(s3End.x, s3End.y, s3End.z + fP); // z increases to 0
                } else {
                    // Moving down into sump
                    const dP = p - (len1 + len2 + len3 + len4);
                    b.position.set(s4End.x, s4End.y - dP, s4End.z);
                }

                b.visible = isOverflowing;
            });
        }
    });

    const radius = diameter * 15;
    const flangeRadius = Math.max(0.4, (diameter / 0.02) * 0.3);

    // Sleek Lab Table
    const tableLeft = -6.5;
    const tableRight = pipeJoinX + pipeLength + 6.0; // Extended further right for beaker standby area
    const tableW = tableRight - tableLeft;
    const tableCentX = (tableLeft + tableRight) / 2;
    const tableThick = 0.2;
    const tableDepth = 3.5;

    // Hole coordinates and dimensions
    const gravity = 9.8;
    // IMPORTANT: must match the flowSpeed multiplier used in WaterFlow.jsx exactly
    const flowSpeed = velocity * 0.06;
    const shootVelocity = flowSpeed * 18.0;

    // Calculate how far the water shoots forward before hitting the table level
    const streamDropHeightToTable = pipeY - tableY;
    const timeToHitTable = Math.sqrt((2 * streamDropHeightToTable) / gravity);
    const streamOffsetX = shootVelocity * timeToHitTable;

    const dropX = pipeJoinX + pipeLength + streamOffsetX; // Center hole where water hits
    const holeSize = 1.0; // 1.0x1.0 square hole to safely catch the arc

    // Four pieces making up the table around the hole
    // Left piece
    const leftW = (dropX - holeSize / 2) - tableLeft;
    const leftCX = tableLeft + leftW / 2;
    // Right piece
    const rightW = tableRight - (dropX + holeSize / 2);
    const rightCX = (dropX + holeSize / 2) + rightW / 2;
    // Front piece (z > 0)
    const frontD = (tableDepth / 2) - (holeSize / 2);
    const frontCZ = (holeSize / 2) + frontD / 2;
    // Back piece (z < 0)
    const backD = (tableDepth / 2) - (holeSize / 2);
    const backCZ = -(holeSize / 2) - backD / 2;

    // Water Tank Bottom position for rendering
    const tankRenderY = tableY + tankH / 2;


    return (
        <group>
            {/* Minimalist Studio Floor */}
            <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -2, 0]} receiveShadow>
                <planeGeometry args={[100, 100]} />
                <shadowMaterial transparent opacity={0.3} />
            </mesh>

            {/* Sleek Lab Table with a drop hole */}
            <group>
                {/* Left Piece */}
                <RoundedBox args={[leftW, tableThick, tableDepth]} position={[leftCX, tableY - 0.1, 0]} radius={0.05} receiveShadow castShadow>
                    <meshStandardMaterial color={0xe8f0f8} roughness={0.1} metalness={0.1} />
                </RoundedBox>
                {/* Right Piece */}
                <RoundedBox args={[rightW, tableThick, tableDepth]} position={[rightCX, tableY - 0.1, 0]} radius={0.05} receiveShadow castShadow>
                    <meshStandardMaterial color={0xe8f0f8} roughness={0.1} metalness={0.1} />
                </RoundedBox>
                {/* Front Piece */}
                <RoundedBox args={[holeSize, tableThick, frontD]} position={[dropX, tableY - 0.1, frontCZ]} radius={0.05} receiveShadow castShadow>
                    <meshStandardMaterial color={0xe8f0f8} roughness={0.1} metalness={0.1} />
                </RoundedBox>
                {/* Back Piece */}
                <RoundedBox args={[holeSize, tableThick, backD]} position={[dropX, tableY - 0.1, backCZ]} radius={0.05} receiveShadow castShadow>
                    <meshStandardMaterial color={0xe8f0f8} roughness={0.1} metalness={0.1} />
                </RoundedBox>
            </group>

            {/* Table Legs */}
            {[-tableW / 2 + 0.5, tableW / 2 - 0.5].map(x =>
                [-1.2, 1.2].map(z => (
                    <mesh key={`leg-${x}-${z}`} position={[tableCentX + x, tableY - 1.05, z]} castShadow receiveShadow>
                        <cylinderGeometry args={[0.08, 0.08, 1.9, 32]} />
                        <meshStandardMaterial color={0x222222} metalness={0.8} roughness={0.2} />
                    </mesh>
                ))
            )}

            {/* Tank Structure */}
            <group
                position={[tankX, tankRenderY, 0]}
                onClick={(e) => {
                    if (onClick) {
                        e.stopPropagation();
                        onClick();
                    }
                }}
            >
                {/* Acrylic Body */}
                <RoundedBox args={[tankW, tankH, tankW]} radius={0.15} smoothness={4} receiveShadow castShadow>
                    <MeshTransmissionMaterial
                        color={0xffffff}
                        transmission={0.95}
                        thickness={0.1}
                        roughness={0}
                        ior={1.5}
                        side={THREE.DoubleSide}
                    />
                </RoundedBox>
                {/* Tank Base Pad (Black rubber) */}
                <mesh position={[0, -tankH / 2 + 0.02, 0]}>
                    <boxGeometry args={[tankW - 0.05, 0.04, tankW - 0.05]} />
                    <meshStandardMaterial color={0x111111} roughness={0.8} />
                </mesh>
                {/* Water Inside */}
                <group ref={waterRef}>
                    <RoundedBox args={[tankW - 0.05, tankH - 0.1, tankW - 0.05]} radius={0.1} position={[0, 0, 0]}>
                        <meshStandardMaterial color={0x1177ff} transparent opacity={0.65} roughness={0.1} metalness={0.1} />
                    </RoundedBox>
                </group>
            </group>

            {/* --- Overflow Pipe System --- */}
            <group
                position={[tankX, tankRenderY, 0]}
                onClick={(e) => {
                    if (onOverflowClick) {
                        e.stopPropagation();
                        onOverflowClick();
                    }
                }}
            >
                {/* Flow Arrow pointing backwards into the overflow drain */}
                <group ref={overflowArrowRef} visible={false}>
                    <FlowArrow
                        position={[s1Start.x, s1Start.y, s1Start.z + 0.25]}
                        rotation={[-Math.PI / 2, 0, 0]}
                        active={true}
                        scale={1.2}
                    />
                </group>

                {/* Back horizontal piece exiting tank */}
                <mesh position={[(s1Start.x + s1End.x) / 2, s1Start.y, (s1Start.z + s1End.z) / 2]} rotation={[Math.PI / 2, 0, 0]}>
                    <cylinderGeometry args={[0.08, 0.08, len1, 16]} />
                    <meshStandardMaterial color="#8899aa" roughness={0.3} metalness={0.6} transparent opacity={0.6} />
                </mesh>
                {/* Vertical drop pipe behind table */}
                <mesh position={[s1End.x, (s1End.y + s2End.y) / 2, s1End.z]}>
                    <cylinderGeometry args={[0.08, 0.08, len2, 16]} />
                    <meshStandardMaterial color="#8899aa" roughness={0.3} metalness={0.6} transparent opacity={0.6} />
                </mesh>
                {/* Horizontal pipe to Sump X */}
                <mesh position={[(s2End.x + s3End.x) / 2, s2End.y, s2End.z]} rotation={[0, 0, Math.PI / 2]}>
                    <cylinderGeometry args={[0.08, 0.08, len3, 16]} />
                    <meshStandardMaterial color="#8899aa" roughness={0.3} metalness={0.6} transparent opacity={0.6} />
                </mesh>
                {/* Horizontal pipe bringing it forward to center Z */}
                <mesh position={[s3End.x, s3End.y, (s3End.z + s4End.z) / 2]} rotation={[Math.PI / 2, 0, 0]}>
                    <cylinderGeometry args={[0.08, 0.08, len4, 16]} />
                    <meshStandardMaterial color="#8899aa" roughness={0.3} metalness={0.6} transparent opacity={0.6} />
                </mesh>
                {/* Vertical drop pipe into Sump */}
                <mesh position={[s4End.x, (s4End.y + s5End.y) / 2, s4End.z]}>
                    <cylinderGeometry args={[0.08, 0.08, len5, 16]} />
                    <meshStandardMaterial color="#8899aa" roughness={0.3} metalness={0.6} transparent opacity={0.6} />
                </mesh>

                {/* Invisible Hitbox for Overflow Pipe */}
                <mesh position={[0, tableY, s1End.z]} visible={false}>
                    <boxGeometry args={[1.5, 8.0, 1.5]} />
                    <meshBasicMaterial />
                </mesh>

                {/* Animated Overflow Bubbles */}
                <group ref={overflowBubblesRef}>
                    {overBubblesData.map((_, i) => (
                        <mesh key={i}>
                            <sphereGeometry args={[pipeInnerRadius, 8, 8]} />
                            <meshStandardMaterial color="#88ccff" emissive="#3388ff" emissiveIntensity={0.6} roughness={0.1} />
                        </mesh>
                    ))}
                </group>
            </group>

            {/* Brass Entry Flange (Outside tank) */}
            <mesh position={[pipeJoinX, pipeY, 0]} rotation={[0, 0, -Math.PI / 2]}>
                <cylinderGeometry args={[flangeRadius, flangeRadius, 0.2, 32]} />
                <meshStandardMaterial color={0xffaa00} metalness={0.9} roughness={0.1} />
            </mesh>
        </group>
    );
}
