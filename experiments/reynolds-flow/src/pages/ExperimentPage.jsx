import UIOverlay from "../components/UIOverlay";
import ReynoldsExperiment from "../components/ReynoldsExperiment";
import MobileRotateOverlay from "../components/MobileRotateOverlay";
import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";

// Fluid database (room temperature)
const FLUID_DATABASE = {
    "Water (25°C)": { rho: 997, mu: 0.00089 },
    "Glycerin": { rho: 1260, mu: 1.49 },
    "Engine Oil": { rho: 870, mu: 0.25 },
    "Ethanol": { rho: 789, mu: 0.00107 },
    "Air (25°C)": { rho: 1.184, mu: 0.0000185 }
};

const STEP_LABELS = [
    "1 · Switch on Pump",
    "2 · Open Valve",
    "3 · Stabilise Flow",
    "4 · Inject Dye",
    "5 · Collect Water",
    "6 · Results"
];

export default function ExperimentPage() {
    const navigate = useNavigate();

    const location = useLocation();

    // Get initial runs from location state if passed, otherwise default to 1
    const initialRuns = location.state?.targetRuns || 1;
    // Determine which phase to start in based on IntroPage button
    const startMode = location.state?.startMode || 'experiment';
    const initialStep = startMode === 'explore' ? 0 : 1;

    // Experiment States
    const [step, setStep] = useState(initialStep);
    // 0: Setup, 1: Turn on Pump, 2: Open valve, 3: Wait for stab, 4: Inject dye, 5: Collect, 6: Results

    // Config for number of runs - modal appears if not configured and we are past step 0
    const [targetRuns, setTargetRuns] = useState(initialRuns);
    const [runsConfigured, setRunsConfigured] = useState(startMode === 'explore');
    const [runCurrent, setRunCurrent] = useState(1);

    // Core parameters
    const initialFlowRate = 1.0;
    const initialRegime = "Laminar";

    const [foundComponents, setFoundComponents] = useState([]);
    const [pumpOn, setPumpOn] = useState(false);
    const [valveOpen, setValveOpen] = useState(false);
    const [dyeActive, setDyeActive] = useState(false);
    const [collectStartTs, setCollectStartTs] = useState(0);
    const [collectedVolume, setCollectedVolume] = useState(0);
    const [collecting, setCollecting] = useState(false);
    const [collectElapsed, setCollectElapsed] = useState(0);
    const [showResults, setShowResults] = useState(false);
    const [stabRemaining, setStabRemaining] = useState(0); // Placeholder for stabilization time
    const [volumeTarget, setVolumeTarget] = useState(0); // Placeholder
    const [volumeRemaining, setVolumeRemaining] = useState(0); // Placeholder

    const [resultRe, setResultRe] = useState(null);
    const [resultRegime, setResultRegime] = useState(null);
    const [resultElapsed, setResultElapsed] = useState(null);

    // Add history tracking
    const [experimentHistory, setExperimentHistory] = useState([]);

    // Physics parameters
    const [diameter, setDiameter] = useState(0.02);
    const [length, setLength] = useState(1.0);
    const [velocity, setVelocity] = useState(1.0);
    const [fluidName, setFluidName] = useState("Water (25°C)");

    const fluid = FLUID_DATABASE[fluidName];
    const area = Math.PI * Math.pow(diameter / 2, 2);
    const flowRateM3s = velocity * area;
    // Used to randomize parameters between runs
    const resetExperiment = (fullReset = false) => {
        if (fullReset) {
            setStep(initialStep);
            setFoundComponents([]);
            setRunCurrent(1);
            setRunsConfigured(startMode === 'explore');
            setPumpOn(false);
            setExperimentHistory([]);
        } else {
            // Keep the pump on and the tank full for subsequent runs
            setStep(pumpOn ? 2 : 1);
        }

        setValveOpen(false);
        setDyeActive(false);
        setCollecting(false);
        setCollectStartTs(0);
        setCollectedVolume(0);
        setCollectElapsed(0);
        setShowResults(false);
        setResultRe(null);
        setResultRegime(null);
        setResultElapsed(null);
    };

    const handleComponentClick = (componentName) => {
        if (step === 1 && componentName === "Pump Switch") {
            setPumpOn(true);
            setTimeout(() => setStep(2), 3000); // 3 seconds to fill tank
            return;
        }

        if (step !== 0) return; // Only process clicks in step 0
        setFoundComponents(prev => {
            if (!prev.includes(componentName)) {
                return [...prev, componentName];
            }
            return prev;
        });
    };

    const handleActionClick = () => {
        if (step === 0) {
            if (foundComponents.length === 6) { // Assuming 6 components for identification
                navigate('/'); // Return to Main Menu
            }
        } else if (step === 1) {
            // Handled by clicking the red pump switch instead
            setPumpOn(true);
            setTimeout(() => setStep(2), 3000); // 3 seconds to fill tank
        } else if (step === 2) {
            setValveOpen(true);
            setStep(3);
        } else if (step === 3) {
            // Wait for stab
            setStep(4); // Move to next step after stabilization
        } else if (step === 4) {
            setDyeActive(true);
            setStep(5);
        } else if (step === 5) {
            if (!collecting) {
                setCollecting(true);
                setCollectStartTs(Date.now());
            } else {
                setCollecting(false);
                setCollectElapsed(prev => prev + (Date.now() - collectStartTs));

                // Calculate results here, as collection has stopped
                const elapsed = (Date.now() - collectStartTs) / 1000;
                const vol = flowRateM3s * elapsed;
                const vMeas = vol / elapsed / area;
                const re = (fluid.rho * vMeas * diameter) / fluid.mu;

                let sigmaRe = 250;
                let noise = (Math.random() - 0.5) * 2 * sigmaRe * 0.4;
                let reN = re + noise;

                let regime = "Laminar";
                if (reN >= 2300 && reN < 4000) regime = "Transitional";
                if (reN >= 4000) regime = "Turbulent";

                setCollectedVolume(vol);
                setResultElapsed(elapsed);
                setResultRe(reN);
                setResultRegime(regime);

                // Add to history
                setExperimentHistory(prev => [
                    ...prev,
                    {
                        runNum: prev.length + 1,
                        fluid: fluidName,
                        velocity: vMeas,
                        diameter: diameter * 1000,
                        re: Math.round(reN),
                        regime,
                        time: elapsed,
                        vol: vol * 1000
                    }
                ]);

                setStep(6);
                setShowResults(true);
            }
        } else if (step === 6) {
            if (runCurrent < targetRuns) {
                setRunCurrent(prev => prev + 1);
                resetExperiment(false);
            } else {
                navigate('/'); // Return to main menu
            }
        }
    };

    // Auto-stop collection at 95% beaker capacity (0.0019 m^3)
    useEffect(() => {
        let timer;
        if (collecting) {
            const timeToFillMs = (0.0019 / flowRateM3s) * 1000;
            timer = setTimeout(() => {
                alert("Beaker is 95% full! Collection stopped automatically.");
                handleActionClick();
            }, timeToFillMs);
        }
        return () => clearTimeout(timer);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [collecting, flowRateM3s]);

    // Provide a state object and setter methods
    const state = {
        step, foundComponents, pumpOn,
        valveOpen, stabRemaining,
        dyeActive,
        collecting, collectStartTs, collectElapsed,
        collectedVolume, volumeTarget, volumeRemaining,
        runCurrent, targetRuns,
        flowRateLpm: flowRateM3s * 60000, // Convert m3/s to L/min for display
        length, diameter, velocity,
        resultRe, resultRegime, resultElapsed, showResults,
        fluid, fluidName, area, flowRateM3s,
        STEP_LABELS, FLUID_DATABASE, experimentHistory
    };

    const setters = {
        setStep, setValveOpen, setDyeActive, setCollectStartTs, setCollecting, setPumpOn,
        setDiameter, setLength, setVelocity, setFluidName,
        handleComponentClick, handleActionClick, resetExperiment
    };

    return (
        <>
            <MobileRotateOverlay />
            <div style={{ position: 'absolute', top: 20, left: 20, zIndex: 1000 }}>
                <button
                    onClick={() => navigate('/')}
                    style={{
                        padding: '10px 20px',
                        backgroundColor: 'rgba(20, 30, 50, 0.9)',
                        color: '#e6edf3',
                        border: '1px solid rgba(121, 192, 255, 0.3)',
                        borderRadius: '8px',
                        cursor: 'pointer',
                        fontWeight: '600',
                        backdropFilter: 'blur(5px)',
                        boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
                        transition: 'all 0.2s ease',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px'
                    }}
                    onMouseOver={(e) => {
                        e.currentTarget.style.backgroundColor = 'rgba(30, 45, 75, 0.95)';
                        e.currentTarget.style.borderColor = 'rgba(121, 192, 255, 0.6)';
                    }}
                    onMouseOut={(e) => {
                        e.currentTarget.style.backgroundColor = 'rgba(20, 30, 50, 0.9)';
                        e.currentTarget.style.borderColor = 'rgba(121, 192, 255, 0.3)';
                    }}
                >
                    <span style={{ fontSize: '1.2em' }}>&larr;</span> Back to Introduction
                </button>
            </div>
            <ReynoldsExperiment state={state} setters={setters} />
            <UIOverlay state={state} setters={setters} />

            {/* Target Runs Configuration Modal */}
            {!runsConfigured && step > 0 && (
                <div style={{
                    position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
                    backgroundColor: 'rgba(0,0,0,0.8)', zIndex: 9999,
                    display: 'flex', justifyContent: 'center', alignItems: 'center',
                    backdropFilter: 'blur(4px)'
                }}>
                    <div style={{
                        background: '#161b22', padding: '30px', borderRadius: '12px',
                        border: '1px solid #30363d', boxShadow: '0 12px 28px rgba(0,0,0,0.5)',
                        maxWidth: '400px', width: '100%', textAlign: 'center', color: '#e6edf3'
                    }}>
                        <h2 style={{ marginTop: 0, marginBottom: '20px', color: '#79c0ff' }}>Experiment Setup</h2>
                        <label style={{ display: 'block', fontSize: '1.1em', marginBottom: '15px' }}>
                            How many runs would you like to perform?
                        </label>
                        <input
                            type="number"
                            min="1" max="10"
                            value={targetRuns}
                            onChange={(e) => setTargetRuns(Math.max(1, Math.min(10, parseInt(e.target.value) || 1)))}
                            style={{
                                width: '100px', padding: '10px', fontSize: '1.2em',
                                backgroundColor: '#0d1117', color: '#e6edf3',
                                border: '1px solid #30363d', borderRadius: '6px',
                                textAlign: 'center', marginBottom: '25px'
                            }}
                        />
                        <button
                            onClick={() => setRunsConfigured(true)}
                            style={{
                                display: 'block', width: '100%', padding: '12px',
                                backgroundColor: '#238636', color: 'white', border: 'none',
                                borderRadius: '6px', fontSize: '1.1em', fontWeight: 'bold',
                                cursor: 'pointer', transition: 'background-color 0.2s'
                            }}
                            onMouseOver={e => e.currentTarget.style.backgroundColor = '#2ea043'}
                            onMouseOut={e => e.currentTarget.style.backgroundColor = '#238636'}
                        >
                            Begin Experiment
                        </button>
                    </div>
                </div>
            )}
        </>
    );
}
