import * as THREE from 'three';
import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';

export default function DyeGeometry({ dyeActive, onClickRes, onClickInj }) {
    const pipeJoinX = -3.6;
    const pipeY = 3.0;

    const tubeX = -3.8;
    const resY = 6.7; // Raised parallel to new pipeY
    const resW = 0.8;
    const valveHandleRef = useRef();

    useFrame((state, delta) => {
        if (!valveHandleRef.current) return;
        const targetRot = dyeActive ? Math.PI * 4 : 0;
        valveHandleRef.current.rotation.y = THREE.MathUtils.lerp(
            valveHandleRef.current.rotation.y,
            targetRot,
            delta * 5
        );
    });

    const valveColor = dyeActive ? 0x00ff88 : 0xff4444;

    return (
        <group>
            {/* Elegant Dye Reservoir on top of Tank - Glass Shell */}
            <mesh position={[tubeX, resY, 0]} onClick={(e) => { if (onClickRes) { e.stopPropagation(); onClickRes(); } }}>
                <cylinderGeometry args={[0.25, 0.25, 0.6, 32]} />
                <meshPhysicalMaterial color={0xffffff} transparent opacity={0.3} metalness={0.1} roughness={0.1} transmission={0.9} thickness={0.1} />
            </mesh>
            <mesh position={[tubeX, resY + 0.3, 0]} onClick={(e) => { if (onClickRes) { e.stopPropagation(); onClickRes(); } }}>
                <sphereGeometry args={[0.25, 32, 32]} />
                <meshPhysicalMaterial color={0xffffff} transparent opacity={0.3} metalness={0.1} roughness={0.1} transmission={0.9} thickness={0.1} />
            </mesh>

            {/* Inner Dye Fluid */}
            <mesh position={[tubeX, resY, 0]}>
                <cylinderGeometry args={[0.24, 0.24, 0.58, 32]} />
                <meshStandardMaterial color={dyeActive ? 0x00ff88 : 0xaa2200} roughness={0.4} />
            </mesh>
            <mesh position={[tubeX, resY + 0.29, 0]}>
                <sphereGeometry args={[0.24, 32, 32]} />
                <meshStandardMaterial color={dyeActive ? 0x00ff88 : 0xaa2200} roughness={0.4} />
            </mesh>

            {/* Vertical Drop Tube for Dye */}
            <mesh position={[tubeX, (resY + pipeY + 0.2) / 2, 0]} onClick={(e) => { if (onClickInj) { e.stopPropagation(); onClickInj(); } }}>
                <cylinderGeometry args={[0.012, 0.012, resY - (pipeY + 0.2), 16]} />
                <meshStandardMaterial color={0x88ccff} metalness={0.9} roughness={0.2} />
            </mesh>

            {/* 90-Degree Curved Glass Elbow (Down to Right) */}
            {/* Center of the bend curve explicitly positioned */}
            <mesh position={[tubeX + 0.2, pipeY + 0.2, 0]} rotation={[0, 0, Math.PI]} onClick={(e) => { if (onClickInj) { e.stopPropagation(); onClickInj(); } }}>
                {/* Torus: radius (0.2), tube_radius, radialSegments, tubularSegments, arc (Math.PI/2) */}
                <torusGeometry args={[0.2, 0.012, 16, 32, Math.PI / 2]} />
                <meshStandardMaterial color={0x88ccff} metalness={0.9} roughness={0.2} />
            </mesh>

            {/* Horizontal Injector Tip entering bell mouth */}
            {(() => {
                const curvedEndX = tubeX + 0.2; // End of the torus curve x-coord
                const tipLength = pipeJoinX - curvedEndX; // distance from curve to pipe opening

                return (
                    <mesh position={[curvedEndX + tipLength / 2, pipeY, 0]} rotation={[0, 0, Math.PI / 2]} onClick={(e) => { if (onClickInj) { e.stopPropagation(); onClickInj(); } }}>
                        <cylinderGeometry args={[0.012, 0.012, tipLength, 16]} />
                        <meshStandardMaterial color={0x88ccff} metalness={0.9} roughness={0.2} />
                    </mesh>
                );
            })()}
            <mesh position={[pipeJoinX, pipeY, 0]} onClick={(e) => { if (onClickInj) { e.stopPropagation(); onClickInj(); } }}>
                <sphereGeometry args={[0.04, 16, 16]} />
                <meshStandardMaterial color={0x88ccff} metalness={0.9} roughness={0.2} />
            </mesh>

            {/* Valve Mechanism */}
            <group position={[tubeX + 0.04, resY - 0.6, 0]}>
                <mesh rotation={[0, 0, -Math.PI / 2]}>
                    <cylinderGeometry args={[0.06, 0.06, 0.15, 16]} />
                    <meshStandardMaterial color={0x88ccff} metalness={0.9} roughness={0.2} />
                </mesh>
                <group ref={valveHandleRef} position={[0.1, 0, 0]} rotation={[Math.PI / 2, 0, Math.PI / 2]}>
                    <torusGeometry args={[0.12, 0.02, 16, 32]} />
                    <meshStandardMaterial color={valveColor} roughness={0.2} emissive={valveColor} emissiveIntensity={0.4} />
                </group>
                <mesh position={[0.1, 0, 0]} rotation={[Math.PI / 2, 0, Math.PI / 2]}>
                    <cylinderGeometry args={[0.015, 0.015, 0.24, 16]} />
                    <meshStandardMaterial color={0x88ccff} />
                </mesh>
                <mesh position={[0.1, 0, 0]} rotation={[Math.PI / 2, 0, 0]}>
                    <cylinderGeometry args={[0.015, 0.015, 0.24, 16]} />
                    <meshStandardMaterial color={0x88ccff} />
                </mesh>
            </group>
        </group>
    );
}
