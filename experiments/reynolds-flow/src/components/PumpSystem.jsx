import React, { useRef, useMemo, useState } from "react";
import * as THREE from "three";
import FlowArrow from "./FlowArrow";
import { useFrame } from "@react-three/fiber";
import { Text } from "@react-three/drei";

export default function PumpSystem({
    onClickPump,
    onClickSwitch,
    pumpOn = false,
    tankX = -3.5,
    tankY = 5.0,
    sumpX = 0,
    sumpY = -4.5
}) {
    // The pump will sit directly on the true floor level (y = -4.5)
    // The pedestal is 1.2 units tall and centered at Y = -0.95 relative to pumpY.
    // So bottom is pumpY - 0.95 - 0.6 = -1.55.
    // To rest on -4.5: pumpY - 1.55 = -4.5 => pumpY = -2.95
    const pumpX = tankX;
    const pumpY = -2.25;
    const pumpZ = 0.0;

    const pipeOuterRadius = 0.08;
    const pipeColor = "#8899aa";

    const metalMaterial = new THREE.MeshStandardMaterial({
        color: "#cc5500", roughness: 0.6, metalness: 0.4
    });

    const pipeMaterial = new THREE.MeshStandardMaterial({
        color: pipeColor, roughness: 0.3, metalness: 0.6,
        transparent: true, opacity: 0.6
    });

    const bubblesRef = useRef();

    // Coordinate mapping for the route
    const leftEdgeX = tankX + 1.5; // Left edge of the new sump tank
    const inletStartX = leftEdgeX + 0.5; // Just inside the sump tank
    const inletStartY = sumpY; // Level of the sump tank connection

    const pumpInletX = pumpX + 0.5; // Right side of the pump
    const pumpOutletX = pumpX - 0.6; // Left side of the pump

    const routeLeftX = pumpX - 2.0; // Extend left from pump
    const routeTopY = tankY + 3.9;  // Go up above scaled tank
    const dropEndY = tankY + (7.2 / 2) - 0.5;   // Bubble drop perfectly into the top water level of scaled tank

    // The physical pipe doesn't go all the way down.
    const pipeDropLen = 0.5; // Short spout over the tank

    // Segment lengths for logic and pipe meshes
    const inletHoriz1 = Math.abs(pumpInletX - inletStartX); // Horizontal from sump to under pump
    const inletVert = pumpY + 0.3 - inletStartY; // Vertical up to pump

    const len1 = inletHoriz1 + inletVert + Math.abs(routeLeftX - pumpOutletX); // Sump -> Pump Inlet, through pump, leftwards
    const len2 = routeTopY - (pumpY + 0.3);         // Up path
    const len3 = Math.abs(tankX - routeLeftX);      // Right path
    const len4 = routeTopY - dropEndY;              // Bubble drop path

    const totalLength = len1 + len2 + len3 + len4;

    // Initialize bubbles
    const bubbleCount = 20;
    const bubblesData = useMemo(() => {
        return Array.from({ length: bubbleCount }).map((_, i) => ({
            progress: (i / bubbleCount) * totalLength
        }));
    }, [bubbleCount, totalLength]);

    useFrame((state, delta) => {
        if (!bubblesRef.current) return;

        // Only move bubbles if pump is ON
        const speed = pumpOn ? 2.0 : 0.0;

        bubblesRef.current.children.forEach((b, i) => {
            let p = bubblesData[i].progress + delta * speed;
            if (p > totalLength) p -= totalLength;
            bubblesData[i].progress = p;

            if (p < inletHoriz1) {
                // Moving left from sump
                b.position.set(inletStartX - p, inletStartY, pumpZ);
            } else if (p < inletHoriz1 + inletVert) {
                // Moving up into pump
                b.position.set(pumpInletX, inletStartY + (p - inletHoriz1), pumpZ);
            } else if (p < len1) {
                // Moving left out of pump
                b.position.set(pumpOutletX - (p - inletHoriz1 - inletVert), pumpY + 0.3, pumpZ);
            } else if (p < len1 + len2) {
                // Moving up
                const vProg = p - len1;
                b.position.set(routeLeftX, pumpY + 0.3 + vProg, pumpZ);
            } else if (p < len1 + len2 + len3) {
                // Moving right
                const hProg = p - (len1 + len2);
                b.position.set(routeLeftX + hProg, routeTopY, pumpZ);
            } else {
                // Moving down
                const dProg = p - (len1 + len2 + len3);
                b.position.set(tankX, routeTopY - dProg, pumpZ);
            }

            b.visible = pumpOn;
        });
    });

    return (
        <group>
            {/* --- THE PUMP --- */}
            <group position={[pumpX, pumpY, pumpZ]}>
                {/* Clickable Switch Box on Pump (Tilted up for visibility) */}
                <group position={[0.0, 0.6, 0.3]} rotation={[-Math.PI / 6, 0, 0]} onClick={(e) => {
                    if (onClickSwitch) { e.stopPropagation(); onClickSwitch(); }
                }}>
                    <mesh>
                        <boxGeometry args={[0.4, 0.4, 0.15]} />
                        <meshStandardMaterial color="#222" />
                    </mesh>


                    {/* Glowing Button */}
                    <mesh position={[0, -0.08, 0.08]} rotation={[Math.PI / 2, 0, 0]}>
                        <cylinderGeometry args={[0.07, 0.07, 0.05, 16]} />
                        <meshStandardMaterial
                            color={pumpOn ? "#00ff00" : "#ff0000"}
                            emissive={pumpOn ? "#00ff00" : "#ff0000"}
                            emissiveIntensity={0.8}
                        />
                    </mesh>

                    {/* Hitbox */}
                    <mesh visible={false}>
                        <boxGeometry args={[0.6, 0.6, 0.6]} />
                        <meshBasicMaterial />
                    </mesh>
                </group>

                {/* Main Pump Body */}
                <group onClick={(e) => {
                    if (onClickPump) { e.stopPropagation(); onClickPump(); }
                }}>
                    {/* Pump Base Pedestal (Platform) */}
                    <mesh position={[0, -0.95, 0]}>
                        <boxGeometry args={[1.5, 1.2, 1.2]} />
                        <meshStandardMaterial color="#333" roughness={0.9} />
                    </mesh>

                    {/* Voltage LED Display on Pedestal */}
                    <group position={[0, -0.95, 0.61]}>
                        {/* Black LED Screen Backing */}
                        <mesh>
                            <boxGeometry args={[1.0, 0.5, 0.05]} />
                            <meshStandardMaterial color="#050505" roughness={0.5} />
                        </mesh>
                        {pumpOn ? (
                            <Text
                                position={[0, 0, 0.03]}
                                fontSize={0.35}
                                color="#00ff00"
                                anchorX="center"
                                anchorY="middle"
                            >
                                220V
                            </Text>
                        ) : (
                            <Text
                                position={[0, 0, 0.03]}
                                fontSize={0.35}
                                color="#ff0000"
                                anchorX="center"
                                anchorY="middle"
                            >
                                0V
                            </Text>
                        )}
                    </group>
                    <mesh position={[0, -0.2, 0]}>
                        <boxGeometry args={[1.2, 0.3, 1.0]} />
                        <primitive object={metalMaterial} attach="material" />
                    </mesh>
                    <mesh position={[0, 0.3, 0]} rotation={[0, 0, Math.PI / 2]}>
                        <cylinderGeometry args={[0.4, 0.4, 1.0, 16]} />
                        <primitive object={metalMaterial} attach="material" />
                    </mesh>
                    {/* Outlet volute moved to LEFT side -> x = -0.6 */}
                    <mesh position={[-0.6, 0.3, 0]} rotation={[Math.PI / 2, 0, 0]}>
                        <cylinderGeometry args={[0.5, 0.5, 0.4, 16]} />
                        <primitive object={metalMaterial} attach="material" />
                    </mesh>

                    <mesh visible={false}>
                        <sphereGeometry args={[1.5]} />
                        <meshBasicMaterial />
                    </mesh>
                </group>
            </group>

            {/* --- PIPELINE --- */}
            {/* Inlet pipe from Sump (Horizontal portion) */}
            <mesh position={[(inletStartX + pumpInletX) / 2, inletStartY, pumpZ]} rotation={[0, 0, Math.PI / 2]}>
                <cylinderGeometry args={[pipeOuterRadius, pipeOuterRadius, inletHoriz1, 16]} />
                <primitive object={pipeMaterial} attach="material" />
            </mesh>

            {/* Inlet pipe riser (Vertical up to pump) */}
            <mesh position={[pumpInletX, (inletStartY + pumpY + 0.3) / 2, pumpZ]}>
                <cylinderGeometry args={[pipeOuterRadius, pipeOuterRadius, inletVert, 16]} />
                <primitive object={pipeMaterial} attach="material" />
            </mesh>

            {/* Outlet horizontal pipe moving LEFT */}
            <mesh position={[(pumpOutletX + routeLeftX) / 2, pumpY + 0.3, pumpZ]} rotation={[0, 0, Math.PI / 2]}>
                <cylinderGeometry args={[pipeOuterRadius, pipeOuterRadius, Math.abs(routeLeftX - pumpOutletX), 16]} />
                <primitive object={pipeMaterial} attach="material" />
            </mesh>

            {/* Vertical riser pipe going UP */}
            <mesh position={[routeLeftX, (pumpY + 0.3 + routeTopY) / 2, pumpZ]} >
                <cylinderGeometry args={[pipeOuterRadius, pipeOuterRadius, len2, 16]} />
                <primitive object={pipeMaterial} attach="material" />
            </mesh>

            {/* Horizontal connecting pipe going RIGHT to the tank */}
            <mesh position={[(routeLeftX + tankX) / 2, routeTopY, pumpZ]} rotation={[0, 0, Math.PI / 2]}>
                <cylinderGeometry args={[pipeOuterRadius, pipeOuterRadius, len3, 16]} />
                <primitive object={pipeMaterial} attach="material" />
            </mesh>

            {/* Downward spout filling the tank. Only extends partially down */}
            <mesh position={[tankX, routeTopY - pipeDropLen / 2, pumpZ]} >
                <cylinderGeometry args={[pipeOuterRadius, pipeOuterRadius, pipeDropLen, 16]} />
                <primitive object={pipeMaterial} attach="material" />
            </mesh>

            {/* Pump Flow Indicator Arrow */}
            <FlowArrow
                position={[tankX, routeTopY - pipeDropLen, pumpZ]}
                rotation={[Math.PI, 0, 0]} // Points straight Down out of the spout
                active={pumpOn}
            />

            {/* --- ANIMATED WATER FLOW --- */}
            <group ref={bubblesRef}>
                {bubblesData.map((_, i) => (
                    <mesh key={i}>
                        <sphereGeometry args={[pipeOuterRadius * 0.7, 8, 8]} />
                        <meshStandardMaterial color="#88ccff" emissive="#3388ff" emissiveIntensity={pumpOn ? 0.8 : 0} roughness={0.1} />
                    </mesh>
                ))}
            </group>
        </group>
    );
}
