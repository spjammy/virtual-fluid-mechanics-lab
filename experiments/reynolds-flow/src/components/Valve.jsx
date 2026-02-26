import * as THREE from 'three';
import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';

export default function Valve({ length, valveOpen, diameter = 0.02, onClick }) {
    const pipeJoinX = -3.6;
    const pipeLength = length * 5;
    const pipeY = 3.0;
    const valveX = pipeJoinX + pipeLength - 0.3;

    // Default pipe diameter is 0.02. Scale the entire valve relative to this baseline.
    const valveScale = diameter / 0.02;

    const handleRef = useRef();
    const handsRef = useRef();

    useFrame((state, delta) => {
        if (!handleRef.current) return;
        // When open, the valve wheel rotates 4 full turns (Math.PI * 8)
        const targetRot = valveOpen ? Math.PI * 8 : 0;

        const currentRot = handleRef.current.rotation.y;
        handleRef.current.rotation.y = THREE.MathUtils.lerp(
            currentRot,
            targetRot,
            delta * 4
        );

        if (handsRef.current) {
            // Show hands only when rotating significantly
            const isTurning = Math.abs(currentRot - targetRot) > 0.1;
            handsRef.current.visible = isTurning;
        }
    });

    const valveColor = valveOpen ? 0x00ee44 : 0xffcc00;
    const emissiveColor = valveOpen ? 0x004400 : 0x664400;

    return (
        <group position={[valveX, pipeY, 0]} scale={[valveScale, valveScale, valveScale]} onClick={(e) => { if (onClick) { e.stopPropagation(); onClick(); } }}>
            {/* Main Valve Body (Inline with pipe) */}
            <mesh rotation={[0, 0, Math.PI / 2]}>
                <cylinderGeometry args={[0.25, 0.25, 0.6, 16]} />
                <meshStandardMaterial color={0x222244} metalness={1.0} roughness={0.15} />
            </mesh>

            {/* Valve Stem (Vertical) */}
            <mesh position={[0, 0.3, 0]}>
                <cylinderGeometry args={[0.08, 0.08, 0.4, 16]} />
                <meshStandardMaterial color={0x333355} metalness={1.0} roughness={0.15} />
            </mesh>

            {/* Valve Wheel Handle */}
            <group ref={handleRef} position={[0, 0.5, 0]}>
                {/* Outer Ring */}
                <mesh rotation={[Math.PI / 2, 0, 0]}>
                    <torusGeometry args={[0.3, 0.04, 16, 32]} />
                    <meshStandardMaterial
                        color={valveColor}
                        emissive={emissiveColor}
                        metalness={0.8}
                        roughness={0.2}
                        emissiveIntensity={0.6}
                    />
                </mesh>
                {/* Cross Spokes */}
                <mesh rotation={[Math.PI / 2, 0, 0]}>
                    <cylinderGeometry args={[0.03, 0.03, 0.58, 8]} />
                    <meshStandardMaterial color={valveColor} metalness={0.8} roughness={0.2} />
                </mesh>
                <mesh rotation={[Math.PI / 2, 0, Math.PI / 2]}>
                    <cylinderGeometry args={[0.03, 0.03, 0.58, 8]} />
                    <meshStandardMaterial color={valveColor} metalness={0.8} roughness={0.2} />
                </mesh>
                {/* Center cap */}
                <mesh position={[0, 0.02, 0]}>
                    <cylinderGeometry args={[0.08, 0.08, 0.06, 16]} />
                    <meshStandardMaterial color={valveColor} metalness={0.8} roughness={0.2} />
                </mesh>

                {/* Animated Turning Hands */}
                <group ref={handsRef} visible={false}>
                    {/* Left Hand Grabbing Wheel */}
                    <group position={[-0.32, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
                        {/* Palm */}
                        <mesh><sphereGeometry args={[0.07, 16, 16]} /><meshStandardMaterial color="#fcd5ab" roughness={0.5} /></mesh>
                        {/* Fingers wrapping */}
                        <mesh position={[0, 0.05, 0.0]}><capsuleGeometry args={[0.02, 0.08, 8, 8]} /><meshStandardMaterial color="#fcd5ab" roughness={0.5} /></mesh>
                    </group>
                    {/* Right Hand Grabbing Wheel */}
                    <group position={[0.32, 0, 0]} rotation={[0, 0, -Math.PI / 2]}>
                        {/* Palm */}
                        <mesh><sphereGeometry args={[0.07, 16, 16]} /><meshStandardMaterial color="#fcd5ab" roughness={0.5} /></mesh>
                        {/* Fingers wrapping */}
                        <mesh position={[0, 0.05, 0.0]}><capsuleGeometry args={[0.02, 0.08, 8, 8]} /><meshStandardMaterial color="#fcd5ab" roughness={0.5} /></mesh>
                    </group>
                </group>
            </group>
        </group>
    );
}
