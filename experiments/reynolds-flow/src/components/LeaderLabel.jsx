import { Html, Line } from "@react-three/drei";

export default function LeaderLabel({ anchor, labelPos, text, color }) {
    return (
        <group>
            {/* Connecting Line */}
            <Line
                points={[anchor, labelPos]}
                color={color}
                lineWidth={2}
            />

            {/* Dot at Anchor */}
            <mesh position={anchor}>
                <sphereGeometry args={[0.09, 10, 10]} />
                <meshStandardMaterial color={color} emissive={color} emissiveIntensity={0.6} />
            </mesh>

            {/* HTML Label positioned near the top point */}
            <Html position={labelPos} center style={{ pointerEvents: 'none' }}>
                <div style={{
                    background: 'rgba(255,255,255,0.93)',
                    border: `3px solid ${color}`,
                    borderLeft: `10px solid ${color}`,
                    borderRadius: 16,
                    padding: '12px 24px',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.18)',
                    color: '#111133',
                    fontFamily: 'Arial, sans-serif',
                    fontWeight: 'bold',
                    fontSize: 18,
                    whiteSpace: 'nowrap',
                    transform: 'translate(-50%, -100%)', // Shift up appropriately
                    marginTop: -10
                }}>
                    {text}
                </div>
            </Html>
        </group>
    );
}
