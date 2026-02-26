import { useFrame } from "@react-three/fiber";
import { useRef, useEffect } from "react";
import * as THREE from "three";

export default function BeakerFill({ length, collectStartTs, collecting, restX, collectX, flowRateM3s, collectedVolume }) {
    const beakerH = 2.6;
    const beakerR = 0.4;

    const beakerBottomY = 0.1; // Base thickness is 0.1, liquid rests on it
    const maxFillH = beakerH - 0.2; // liquid max height padding from top

    const beakerTargetVol = 0.002; // max volume is 2 liters

    const meshRef = useRef();

    useFrame((state, delta) => {
        if (!meshRef.current) return;

        // Slide animation perfectly synchronized with the Beaker.jsx interpolation speed
        const targetX = collecting ? collectX : restX;
        meshRef.current.position.x += (targetX - meshRef.current.position.x) * (4.0 * delta);

        if (collectStartTs > 0) {
            let vol = 0;
            if (collectedVolume > 0) {
                vol = collectedVolume;
            } else {
                const elapsedSec = (Date.now() - collectStartTs) / 1000;
                vol = flowRateM3s * elapsedSec;
            }

            const ratio = Math.min(vol / beakerTargetVol, 1.0);
            const fillH = Math.max(maxFillH * ratio, 0.001);

            meshRef.current.scale.y = fillH;
            meshRef.current.position.y = beakerBottomY + fillH / 2;
            meshRef.current.visible = true;
        } else {
            // initial hidden state until collection starts
            meshRef.current.scale.y = 0.001;
            meshRef.current.position.y = beakerBottomY + 0.001 / 2;
            meshRef.current.visible = false;
        }
    });

    // Snap geometrically if the pipelength UI stretches restX
    useEffect(() => {
        if (meshRef.current && !collecting) {
            meshRef.current.position.x = restX;
        }
    }, [restX, collecting]);

    return (
        <mesh ref={meshRef} position={[restX, 0, 0]}>
            {/* Slightly smaller radius than the base beaker to fit inside avoid z-fighting */}
            <cylinderGeometry args={[beakerR - 0.01, beakerR - 0.01, 1, 32]} />
            <meshStandardMaterial
                color={0x1166ff}
                transparent={false}
                opacity={1.0}
                roughness={0.2}
            />
        </mesh>
    );
}
