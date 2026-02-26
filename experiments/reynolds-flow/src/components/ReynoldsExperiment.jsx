import { Canvas, useFrame } from "@react-three/fiber";
import { OrbitControls, Environment, ContactShadows } from "@react-three/drei";
import * as THREE from "three";
import { useRef } from "react";

import AppGeometry from "./AppGeometry";
import DyeGeometry from "./DyeGeometry";
import GlassPipe from "./Pipe";
import Valve from "./Valve";
import Beaker from "./Beaker";
import Stand from "./Stand";
import WaterFlow from "./WaterFlow";
import DyeFilament from "./DyeFilament";
import BeakerFill from "./BeakerFill";
import LeaderLabel from "./LeaderLabel";
import SumpTank from "./SumpTank";
import PumpSystem from "./PumpSystem";

// A Camera controller to smoothly swing in when dye is injected
function CameraRig({ dyeActive, pipeY, step }) {
  const controlsRef = useRef();

  const camDefaultPos = new THREE.Vector3(2, 6.5, 20);
  const camDyePos = new THREE.Vector3(0, 2, 8);

  const targetDefault = new THREE.Vector3(0, 2, 0);
  const targetDye = new THREE.Vector3(0, pipeY, 0);

  useFrame((state) => {
    // Only lock the camera perfectly into cinematic position if we aren't in the free-roaming Find Apparatus step (0)
    if (step !== 0) {
      const tgtPos = dyeActive ? camDyePos : camDefaultPos;
      const tgtTar = dyeActive ? targetDye : targetDefault;
      const tgtFov = dyeActive ? 60 : 45;

      // Lerp camera position
      state.camera.position.lerp(tgtPos, 0.04);

      // Lerp FOV
      if (Math.abs(state.camera.fov - tgtFov) > 0.1) {
        state.camera.fov += (tgtFov - state.camera.fov) * 0.04;
        state.camera.updateProjectionMatrix();
      }

      // Lerp Controls Target
      if (controlsRef.current) {
        controlsRef.current.target.lerp(tgtTar, 0.04);
        controlsRef.current.update();
      }
    }
  });

  return (
    <OrbitControls
      ref={controlsRef}
      makeDefault
      enableDamping
      dampingFactor={0.05}
      minDistance={6}
      maxDistance={40}
      maxPolarAngle={Math.PI / 2} // Prevent user from awkwardly clipping camera under the floor in free roam
    />
  );
}

export default function ReynoldsExperiment({ state, setters }) {
  const {
    step, foundComponents, pumpOn,
    dyeActive, valveOpen, length, velocity, resultRegime, resultRe,
    collecting, collectStartTs, flowRateM3s, diameter, collectedVolume, fluid
  } = state;

  const pipeY = 3.0;
  const pipeJoinX = -3.6;
  const pipeLength = length * 5;

  const outletMid = pipeJoinX;
  const valveX = pipeJoinX + pipeLength - 0.3;
  const beakerX = pipeJoinX + pipeLength + 4.5; // Rest on the extended table area
  const beakerY = 1.6 / 2;

  // Calculate the target collection drop spot based on flow speed
  const gravity = 9.8;
  const flowSpeed = velocity * 0.06;
  const shootVelocity = flowSpeed * 18.0;
  const tableY = 0;
  const streamDropHeightToTable = pipeY - tableY;
  const currentRe = (fluid.rho * velocity * diameter) / fluid.mu;

  let computedRegime = "Laminar";
  if (currentRe >= 2300 && currentRe < 4000) computedRegime = "Transitional";
  if (currentRe >= 4000) computedRegime = "Turbulent";

  const displayRegime = resultRegime || computedRegime;
  const displayRe = resultRe || currentRe;

  // The beaker's mouth is at Y = 2.6, so water hits it earlier than the table
  const beakerMouthY = 2.6;
  const dropHeightToBeaker = pipeY - beakerMouthY;
  const timeToHitBeaker = Math.sqrt((2 * dropHeightToBeaker) / gravity);

  const streamOffsetX = shootVelocity * timeToHitBeaker;
  const dropX = pipeJoinX + pipeLength + streamOffsetX; // Exact geometrical center

  // Tank params based on AppGeometry
  const tankW = 2.4;
  const tankX = pipeJoinX - tankW / 2 + 0.1;
  const tankY = 2.5;

  const sumpY = -3.5; // Raised floor level for the sump
  const resY = 6.7;

  return (
    <div style={{ width: "100%", height: "100%", background: "#111827" }}>
      <Canvas
        shadows
        camera={{ position: [2, 6.5, 20], fov: 45 }}
        style={{ cursor: step === 0 ? "pointer" : "default" }}
      >
        <fog attach="fog" args={["#111827", 15, 45]} />

        {/* Lights & Environment */}
        <ambientLight intensity={0.4} />
        <directionalLight position={[10, 15, 10]} intensity={1.5} castShadow color={0xffffff} />
        <directionalLight position={[-10, 5, -5]} intensity={0.5} color={0xaabbff} />
        <pointLight position={[0, 4, 3]} intensity={0.8} />

        {/* Studio environment for crisp reflections */}
        <Environment preset="studio" background={false} />

        {/* Deeper ground shadow */}
        <ContactShadows position={[0, -0.05, 0]} opacity={0.8} scale={30} blur={2.0} far={4} color="#000000" />

        <CameraRig dyeActive={dyeActive} pipeY={pipeY} step={step} />

        {/* Static Base Geometry */}
        <AppGeometry length={length} diameter={diameter} velocity={velocity} pumpOn={pumpOn} sumpX={tankX + 2.5} sumpY={sumpY} onClick={() => setters.handleComponentClick("Water Tank")} onOverflowClick={() => setters.handleComponentClick("Overflow Pipe")} />
        <DyeGeometry length={length} dyeActive={dyeActive} onClickRes={() => setters.handleComponentClick("Dye Reservoir")} onClickInj={() => setters.handleComponentClick("Dye Injector")} />
        <Beaker length={length} restX={beakerX} collectX={dropX} collecting={collecting} onClick={() => setters.handleComponentClick("Collection Flask")} />
        <SumpTank pipeLength={pipeLength} pipeJoinX={pipeJoinX} pumpX={tankX} sumpY={sumpY} onClick={() => setters.handleComponentClick("Sump Tank")} />
        <PumpSystem onClickPump={() => setters.handleComponentClick("Pump System")} onClickSwitch={() => setters.handleComponentClick("Pump Switch")} pumpOn={pumpOn} tankX={tankX} tankY={tankY} sumpY={sumpY} />

        {/* Dynamic State Meshes */}
        <GlassPipe length={length} valveOpen={valveOpen} diameter={diameter} onClick={() => setters.handleComponentClick("Test Pipe")} />
        <Valve length={length} valveOpen={valveOpen} diameter={diameter} onClick={() => setters.handleComponentClick("Flow Control Valve")} />

        {/* Animations */}
        <WaterFlow valveOpen={valveOpen} length={length} velocity={velocity} diameter={diameter} sumpY={sumpY} collecting={collecting} />
        <DyeFilament dyeActive={dyeActive} length={length} velocity={velocity} regime={displayRegime} diameter={diameter} re={displayRe} />
        <BeakerFill length={length} collectStartTs={collectStartTs} collecting={collecting} restX={beakerX} collectX={dropX} flowRateM3s={flowRateM3s} collectedVolume={collectedVolume} />

        {/* Component Identification Labels */}
        {step === 0 && (
          <group>
            {foundComponents.includes("Water Tank") && <LeaderLabel text="Water Tank" color="#00aaff" anchor={[tankX, tankY, 0]} labelPos={[-7.5, 3.5, 0]} />}
            {foundComponents.includes("Dye Reservoir") && <LeaderLabel text="Dye Reservoir" color="#ff1177" anchor={[-3.8, resY, 0]} labelPos={[-7.5, 6.0, 0]} />}
            {foundComponents.includes("Dye Injector") && <LeaderLabel text="Dye Injector" color="#ffcc00" anchor={[-3.8, pipeY + 0.2, 0]} labelPos={[-1.5, 4.5, 0]} />}
            {foundComponents.includes("Test Pipe") && <LeaderLabel text="Test Pipe" color="#44ffcc" anchor={[pipeJoinX + pipeLength / 2, pipeY, 0]} labelPos={[pipeJoinX + pipeLength / 2 - 1.0, 4.0, 0]} />}
            {foundComponents.includes("Flow Control Valve") && <LeaderLabel text="Flow Control Valve" color="#ffcc00" anchor={[valveX, pipeY, 0]} labelPos={[valveX + 1.0, 4.5, 0]} />}
            {foundComponents.includes("Collection Flask") && <LeaderLabel text="Collection Flask" color="#88ffee" anchor={[beakerX, beakerY, 0]} labelPos={[beakerX + 2.0, 3.0, 0]} />}
            {foundComponents.includes("Sump Tank") && <LeaderLabel text="Sump Tank" color="#00aaff" anchor={[0, -4.5, 0]} labelPos={[2.0, -2.5, 0]} />}
            {foundComponents.includes("Pump System") && <LeaderLabel text="Pump System" color="#ffcc00" anchor={[-4.0, -4.0, 0]} labelPos={[-6.0, -2.0, 0]} />}
            {/* Overflow pipe hit logic lives on the tank currently, so we'll just check "Water Tank" and add a label, or add a dedicated hit box for overflow. The AppGeometry doesn't send "Overflow Pipe" click since it's grouped. Need to attach overflow click separately. Working around it by adding label when "Overflow Pipe" is somehow triggered or just add a separate hitbox. For now we will add a dedicated hitbox to AppGeometry later if needed, but we must handle the label. */}
            {foundComponents.includes("Overflow Pipe") && <LeaderLabel text="Overflow Pipe" color="#aaaaaa" anchor={[tankX, 0, -(2.4 / 2 + 0.4)]} labelPos={[tankX + 2.0, 1.0, 0]} />}
          </group>
        )}
      </Canvas>
    </div>
  );
}
