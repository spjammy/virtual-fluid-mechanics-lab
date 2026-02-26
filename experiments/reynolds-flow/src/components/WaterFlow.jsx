import { useFrame } from "@react-three/fiber";
import { useRef, useMemo, useEffect } from "react";
import * as THREE from "three";

export default function WaterFlow({ valveOpen, length, velocity, diameter, sumpY = -3.5, collecting = false }) {
    const pipeJoinX = -3.6;
    const pipeLength = length * 5;
    const pipeEndX = pipeJoinX + pipeLength;
    const pipeY = 3.0;

    // Reduced velocity scaling to look good visually
    // using absolute velocity mapping to a smaller frame delta
    const flowSpeed = velocity * 0.06;
    const radiusMax = diameter * 15 - 0.05;

    // We want to generate an array of water particles initially spread out
    const particles = useMemo(() => {
        const list = [];
        // Increased particle count for broader spread over the falling area
        for (let i = 0; i < 120; i++) {
            const r = Math.random() * radiusMax;
            const theta = Math.random() * Math.PI * 2;
            list.push({
                x: pipeJoinX + Math.random() * pipeLength,
                y: pipeY + r * Math.sin(theta),
                z: r * Math.cos(theta),
                r, theta, phase: Math.random() * Math.PI * 2
            });
        }
        return list;
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [length, diameter]);

    const groupRef = useRef();
    const dropMeshRef = useRef();
    const fillStartRef = useRef(0);

    const streamLen = pipeY - (sumpY + 2.0);

    // Physics for the parabolic curved stream
    // Conditionally crop the stream if the beaker is catching the water (Beaker mouth is at TableY(0) + 2.6)
    const streamDropHeight = collecting ? pipeY - 2.6 : pipeY - (sumpY + 2.0);
    const gravity = 9.8;
    const timeToHit = Math.sqrt((2 * streamDropHeight) / gravity);

    // Scale the virtual flow speed up significantly to look like a pressurized shoot
    const shootVelocity = flowSpeed * 18.0;

    // Generate the path geometry using projectile motion maths
    const curve = useMemo(() => {
        const pts = [];
        const resolution = 20;
        for (let i = 0; i <= resolution; i++) {
            const t = (i / resolution) * timeToHit;
            // X = v * t
            const x = pipeEndX + (shootVelocity * t);
            // Y = -0.5 * g * t^2
            const y = pipeY - (0.5 * gravity * t * t);
            pts.push(new THREE.Vector3(x, y, 0));
        }
        return new THREE.CatmullRomCurve3(pts);
    }, [pipeEndX, pipeY, shootVelocity, timeToHit, collecting]);

    useEffect(() => {
        if (valveOpen && fillStartRef.current === 0) {
            fillStartRef.current = Date.now();
        } else if (!valveOpen) {
            fillStartRef.current = 0;
        }
    }, [valveOpen]);

    useFrame(() => {
        if (!valveOpen) return;

        // Fill progress 0 to 1 over 5.0 seconds
        const elapsed = (Date.now() - fillStartRef.current) / 1000;
        const fillRatio = Math.min(elapsed / 5.0, 1.0);
        const currentFrontX = pipeJoinX + pipeLength * fillRatio;

        // Calculate and apply drop stream visually
        if (dropMeshRef.current) {
            const dropElapsed = Math.max(0, elapsed - 5.0);
            const dropRatio = Math.min(dropElapsed / 1.0, 1.0); // Stream spans over 1s

            if (dropRatio > 0 && fillRatio >= 1.0) {
                // To animate the curve streaming out, we can use the tube geometry's drawRange
                // The geometry has 'tubularSegments' + 1 vertices along its length, 
                // but each segment generates 'radialSegments' + 1 vertices around it.
                // However, drawRange works on indices. Since the tube is static, we just show it
                // all, but we can simulate the "spurt" by scaling it, or better, we just show it fading in 
                // or just leave it visible since the tubeGeometry isn't easily clamped mid-draw without rebuilding.

                // For a simple effect, we just toggle visibility when it "reaches" the end.
                // The user's eye follows the "falling" particles anyway if they were there,
                // but since the stream is continuous we just pop it in smoothly with opacity or scale.
                dropMeshRef.current.visible = true;

                // Optional: we can scale it on the X/Y axes from the start point
                // But since scaling a curve distorts it, we will just use it as is.
                const totalIndices = dropMeshRef.current.geometry.index ? dropMeshRef.current.geometry.index.count : 0;
                if (totalIndices > 0) {
                    dropMeshRef.current.geometry.setDrawRange(0, Math.floor(totalIndices * dropRatio));
                }
            } else {
                dropMeshRef.current.visible = false;
                dropMeshRef.current.geometry.setDrawRange(0, 0); // Hide by setting drawRange to 0
            }
        }

        if (groupRef.current) {
            const children = groupRef.current.children;

            for (let i = 0; i < children.length; i++) {
                const p = children[i];

                // Particle Animation Logic
                // 1. Particle is within the flowing part of the pipe
                if (p.position.x <= currentFrontX) {
                    p.position.x += flowSpeed;
                }
                // 2. Liquid hasn't reached it yet
                else if (fillRatio < 1.0) {
                    p.position.x = currentFrontX;
                }

                // Loop around seamlessly exactly at the end of the pipe
                if (p.position.x > pipeEndX) {
                    const r = Math.random() * radiusMax;
                    const theta = Math.random() * Math.PI * 2;
                    p.position.x = pipeJoinX;
                    p.position.y = pipeY + r * Math.sin(theta);
                    p.position.z = r * Math.cos(theta);
                }

                // Hide particles that haven't physically been reached by the fluid front inside the pipe yet
                p.visible = p.position.x <= currentFrontX;
            }
        }
    });

    if (!valveOpen) return null;

    return (
        <group>
            {/* The looping horizontal flow particles */}
            <group ref={groupRef}>
                {/* The looping horizontal flow particles */}
                {particles.map((p, i) => (
                    <mesh key={i} position={[p.x, p.y, p.z]}>
                        <sphereGeometry args={[0.04, 6, 6]} />
                        <meshStandardMaterial
                            color={0x1166ff}
                            transparent opacity={0.4}
                            emissive={0x003366} emissiveIntensity={0.2}
                            metalness={0.5} roughness={0.0}
                        />
                    </mesh>
                ))}

            </group>

            {/* The continuous curved falling stream from the end of the pipe into the sump tank */}
            <mesh ref={dropMeshRef} visible={false}>
                <tubeGeometry args={[curve, 32, radiusMax * 0.8, 8, false]} />
                <meshPhysicalMaterial
                    color={0x1166ff}
                    transparent opacity={0.6}
                    transmission={0.9}
                    roughness={0.1}
                    ior={1.33}
                    thickness={0.5}
                />
            </mesh>
        </group>
    );
}
