export default function Stand({ length }) {
    const pipeJoinX = -3.6;
    const pipeLength = length * 5;

    const beakerX = pipeJoinX + pipeLength + 1.2;
    // Table is at y = 0
    const beakerH = 1.6;
    const beakerY = beakerH / 2; // Rests on table

    const standX = beakerX + 1.0;
    const standZ = -0.9;
    const standRodH = beakerY + beakerH / 2 + 0.8; // Table is 0, so height is from 0

    const armLen = Math.abs(standX - beakerX) + 0.05;
    const armMidX = (standX + beakerX) / 2;
    const armY = beakerY + 0.1;
    const connLen = Math.abs(standZ);

    const standMat = { color: 0x888899, metalness: 0.9, roughness: 0.15 };

    return (
        <group>
            {/* Vertical Rod */}
            <mesh position={[standX, standRodH / 2, standZ]}>
                <cylinderGeometry args={[0.055, 0.055, standRodH, 12]} />
                <meshStandardMaterial {...standMat} />
            </mesh>

            {/* Heavy Base Foot */}
            <mesh position={[standX - 0.1, 0.06, standZ]}>
                <boxGeometry args={[1.0, 0.12, 0.5]} />
                <meshStandardMaterial color={0x555566} metalness={0.85} roughness={0.2} />
            </mesh>

            {/* Horizontal Arm */}
            <mesh position={[armMidX, armY, standZ]} rotation={[0, 0, Math.PI / 2]}>
                <cylinderGeometry args={[0.04, 0.04, armLen, 10]} />
                <meshStandardMaterial {...standMat} />
            </mesh>

            {/* Ring Clamp */}
            <mesh position={[beakerX, armY, 0]} rotation={[Math.PI / 2, 0, 0]}>
                <torusGeometry args={[0.42, 0.04, 10, 32]} />
                <meshStandardMaterial color={0x777788} metalness={0.9} roughness={0.1} />
            </mesh>

            {/* Connector */}
            <mesh position={[beakerX, armY, -connLen / 2]} rotation={[Math.PI / 2, 0, 0]}>
                <cylinderGeometry args={[0.035, 0.035, connLen, 8]} />
                <meshStandardMaterial {...standMat} />
            </mesh>
        </group>
    );
}
