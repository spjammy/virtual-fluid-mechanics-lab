import { useFrame } from "@react-three/fiber";
import { useRef, useEffect, useMemo } from "react";
import * as THREE from "three";

export default function DyeFilament({
    dyeActive, length, velocity, regime, diameter, re = 2000
}) {
    const pipeJoinX = -3.6;
    const pipeLength = length * 5;
    const pipeEndX = pipeJoinX + pipeLength;
    const pipeY = 3.0;

    const dyeTipX = pipeJoinX;

    const maxPoints = 400; // Dense enough for high frequency wave
    const maxInstances = maxPoints - 1;
    const baseFlowSpeed = velocity * 0.06;
    // Laminar dye is injected faster visually — it travels cleanly so the speed is very apparent
    const flowSpeed = regime === "Laminar" ? baseFlowSpeed * 5.0 : baseFlowSpeed;
    const radiusMax = diameter * 15 - 0.05;

    const dyeColHex = 0xff2200;

    // Internal line points
    const positionsRef = useRef(Array.from({ length: maxPoints }, () => new THREE.Vector3()));

    const instancedMeshRef = useRef();
    const activeCountRef = useRef(1); // How many points are "alive" and moving
    // Vertical velocity per-point for projectile fall after pipe exit
    const vysRef = useRef(new Float32Array(maxPoints));

    // Static objects for matrix maths inside useFrame to avoid GC pauses
    const { dummy, vec, up } = useMemo(() => ({
        dummy: new THREE.Object3D(),
        vec: new THREE.Vector3(),
        up: new THREE.Vector3(0, 1, 0)
    }), []);

    // Initialize positions
    useEffect(() => {
        const positions = positionsRef.current;
        for (let i = 0; i < maxPoints; i++) {
            positions[i].set(dyeTipX, pipeY, 0);
        }
    }, [dyeTipX, pipeY]);

    // Reset loop when dye activates
    useEffect(() => {
        if (dyeActive && instancedMeshRef.current) {
            activeCountRef.current = 1;
            const positions = positionsRef.current;
            for (let i = 0; i < maxPoints; i++) {
                positions[i].set(dyeTipX, pipeY, 0);
            }
        }
    }, [dyeActive, dyeTipX, pipeY, maxPoints]);

    useFrame((_, delta) => {
        if (!dyeActive || !instancedMeshRef.current) return;

        const positions = positionsRef.current;
        const vys = vysRef.current;

        // Spawn more points proportionally so they precisely cover the pipe length
        if (activeCountRef.current < maxPoints) {
            activeCountRef.current += (maxPoints * flowSpeed) / pipeLength;
            if (activeCountRef.current > maxPoints) activeCountRef.current = maxPoints;
        }

        const currentCount = Math.floor(activeCountRef.current);

        // Dynamically compute the boundary layers based on Reynolds number
        let laminarLength = pipeLength;
        let wavinessLength = 0;

        if (regime === "Transitional") {
            laminarLength = pipeLength * 0.25;
            wavinessLength = pipeLength * 0.75;
        } else if (regime === "Turbulent") {
            laminarLength = pipeLength * 0.1;
            wavinessLength = pipeLength * 0.4;
        }

        const gravity = 9.8;
        const shootVelocityX = flowSpeed * 18.0; // Horizontal exit speed matching WaterFlow
        const sumpFloor = -3.5;

        // 1. Move all points along X axis and compute physical positions
        for (let i = 0; i < currentCount; i++) {
            const p = positions[i];

            // --- FALLING PHASE: point has exited the pipe ---
            if (p.x >= pipeEndX) {
                // Apply gravity to vertical velocity
                vys[i] -= gravity * delta;
                p.x += shootVelocityX * delta;
                p.y += vys[i] * delta;

                // Reset to tip once it hits the sump floor
                if (p.y < sumpFloor) {
                    p.set(dyeTipX, pipeY, 0);
                    vys[i] = 0;
                }
                continue;
            }

            // --- PIPE PHASE: normal horizontal flow ---
            p.x += flowSpeed;
            const relativeX = p.x - dyeTipX;

            if (relativeX <= laminarLength) {
                // Laminar Lead-in Phase (Straight)
                p.y = pipeY;
                p.z = 0;
            } else if (relativeX <= laminarLength + wavinessLength) {
                // Wavy / Transitional Phase
                let progress = (relativeX - laminarLength) / Math.max(wavinessLength, 0.01);
                progress = Math.min(progress, 1.0);
                const waveAmp = progress * (radiusMax * 0.85);

                const t = Date.now() / 200;
                p.y = pipeY + Math.sin(p.x * 4.0 - t) * waveAmp;
                p.z = Math.cos(p.x * 2.5 - t) * (waveAmp * 0.5);
            } else {
                // Full Turbulence Phase (Vortex breakdown dispersion)
                const baseTurbFactor = regime === "Turbulent" ? 0.3 + (Math.max(re - 4000, 0) / 4000) * 0.3 : 0.15;

                p.y += (Math.random() - 0.5) * baseTurbFactor;
                p.z += (Math.random() - 0.5) * baseTurbFactor;

                const distToCenter = Math.sqrt(Math.pow(p.y - pipeY, 2) + Math.pow(p.z, 2));
                if (distToCenter > radiusMax) {
                    p.y = pipeY;
                    p.z = 0;
                }
            }

            // Point just reached the pipe exit — initialise its fall velocity
            if (p.x >= pipeEndX) {
                vys[i] = 0; // Start falling from rest in Y
            }
        }

        // 2. Keep the un-spawned points anchored at the tip
        for (let i = currentCount; i < maxPoints; i++) {
            positions[i].set(dyeTipX, pipeY, 0);
            vys[i] = 0;
        }

        // 3. Construct the continuous thick line using overlapping Cylinders
        const dyeThickness = 0.03;
        for (let i = 0; i < maxInstances; i++) {
            const p1 = positions[i];
            const p2 = positions[i + 1];

            // Hide segment if it jumps backward (wrap reset) or hasn't spawned yet
            if (p1.x < p2.x || i >= currentCount - 1) {
                dummy.scale.set(0, 0, 0);
                dummy.updateMatrix();
                instancedMeshRef.current.setMatrixAt(i, dummy.matrix);
                continue;
            }

            const dist = p1.distanceTo(p2);
            dummy.position.copy(p1).lerp(p2, 0.5);
            vec.subVectors(p2, p1).normalize();

            if (vec.lengthSq() > 0.00001) {
                dummy.quaternion.setFromUnitVectors(up, vec);
            } else {
                dummy.quaternion.identity();
            }

            dummy.scale.set(dyeThickness, dist * 1.05, dyeThickness);
            dummy.updateMatrix();
            instancedMeshRef.current.setMatrixAt(i, dummy.matrix);
        }

        instancedMeshRef.current.instanceMatrix.needsUpdate = true;
    });


    if (!dyeActive) return null;

    return (
        <instancedMesh
            ref={instancedMeshRef}
            args={[null, null, maxInstances]}
            renderOrder={999}
        >
            <cylinderGeometry args={[1, 1, 1, 8]} />
            <meshStandardMaterial
                color={new THREE.Color(dyeColHex)}
                emissive={new THREE.Color(dyeColHex)}
                emissiveIntensity={0.8}
                roughness={0.1}
                transparent={true}
                opacity={1.0}
                depthTest={false}
                depthWrite={false}
            />
        </instancedMesh>
    );
}
