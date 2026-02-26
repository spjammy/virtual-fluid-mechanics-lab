import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import Draggable from "react-draggable";

export default function UIOverlay({ state, setters }) {
    const navigate = useNavigate();
    const nodeRef = useRef(null);

    const {
        step, foundComponents, STEP_LABELS, FLUID_DATABASE,
        diameter, length, velocity, fluidName,
        collectStartTs, collecting, dyeActive,
        resultRe, resultRegime, resultElapsed, collectedVolume, flowRateM3s,
        experimentHistory, targetRuns
    } = state;

    const {
        setDiameter, setLength, setVelocity, setFluidName,
        handleActionClick, resetExperiment
    } = setters;

    const [stabRemaining, setStabRemaining] = useState(5.0);
    const [colElapsed, setColElapsed] = useState(0.0);
    const [showResults, setShowResults] = useState(true);
    const [sidebarOpen, setSidebarOpen] = useState(true);

    const currentRunNum = Math.min(experimentHistory.length + 1, targetRuns);
    const isExperimentFinished = experimentHistory.length === targetRuns;

    // Stabilise timer
    useEffect(() => {
        let interval;
        if (step === 3) {
            const start = Date.now();
            interval = setInterval(() => {
                const elapsed = (Date.now() - start) / 1000;
                const rem = Math.max(0, 5.0 - elapsed);
                setStabRemaining(rem);
                if (rem === 0) clearInterval(interval);
            }, 100);
        }
        return () => clearInterval(interval);
    }, [step]);

    // Collection timer
    useEffect(() => {
        let interval;
        if (step === 5 && collectStartTs > 0) {
            interval = setInterval(() => {
                setColElapsed((Date.now() - collectStartTs) / 1000);
            }, 100);
        }
        return () => clearInterval(interval);
    }, [step, collectStartTs]);

    const getActionInfo = () => {
        switch (step) {
            case 0:
                if (foundComponents.length < 9) return { text: `Find all parts of the apparatus listed in the sidebar. Found: ${foundComponents.length} / 9`, btn: "Find Components", disabled: true };
                return { text: "All 9 components identified!", btn: "Return to Main Menu 🏠", disabled: false };
            case 1: return { text: "Turn on the Pump to fill the overhead tank.", btn: "🔌 Start Pump", disabled: false };
            case 2: return { text: "Open the valve to let water flow through the pipe.", btn: "🔧 Open Valve", disabled: false };
            case 3:
                if (stabRemaining > 0) return { text: "Waiting for flow to stabilise…", btn: `⏳ Stabilising…`, disabled: true };
                return { text: "Flow stabilised! Ready to inject dye.", btn: "✅ Continue", disabled: false };
            case 4: return { text: "Inject dye into the stream to observe the flow regime.", btn: "💉 Inject Dye", disabled: false };
            case 5:
                if (collecting) return { text: "Collecting water... Wait a few seconds for an accurate sample.", btn: "⏹ Stop Collection", disabled: false };
                if (collectStartTs > 0) return { text: "Collection complete. Validating results...", btn: "Next", disabled: false };
                return { text: "Start timing the flow to calculate the volumetric flow rate.", btn: "⏱ Start Collection", disabled: false };
            case 6: return { text: "Review the results of this run.", btn: currentRunNum < targetRuns ? "Next Run ➔" : "Finish Experiment 🏁", disabled: false };
            default: return { text: "", btn: "", disabled: true };
        }
    };

    const actionInfo = getActionInfo();

    const colors = { Laminar: '#1E90FF', Transitional: '#FFD700', Turbulent: '#FF4500' };
    const regimeColor = colors[resultRegime] || "#888";

    const renderResults = () => {
        if (step !== 6 || !showResults) return null; // Changed from step !== 5
        const descs = {
            Laminar: 'The dye filament flows in a straight, undisturbed line. Re < 2300.',
            Transitional: 'The filament shows waviness and occasional mixing. 2300 ≤ Re ≤ 4000.',
            Turbulent: 'The dye disperses chaotically across the pipe cross-section. Re > 4000.'
        };
        return (
            <Draggable nodeRef={nodeRef} handle=".results-drag-handle">
                <div ref={nodeRef} className="results-panel">
                    <div className="results-drag-handle">
                        ⋮⋮ Drag to move
                    </div>
                    <h2 style={{ color: regimeColor }}>{resultRegime} Flow</h2>
                    <span className="re-badge" style={{ color: regimeColor }}>Re = {Math.round(resultRe)}</span>
                    <table>
                        <tbody>
                            <tr><td>⏱️ Collection Time</td><td><strong>{resultElapsed.toFixed(2)} s</strong></td></tr>
                            <tr><td>💧 Collected Volume</td><td><strong>{(collectedVolume * 1000).toFixed(3)} L</strong></td></tr>
                            <tr><td>📌 Pipe Diameter</td><td><strong>{(diameter * 1000).toFixed(1)} mm</strong></td></tr>
                            <tr><td>🌊 Measured Velocity</td><td><strong>{(collectedVolume / resultElapsed / (Math.PI * Math.pow(diameter / 2, 2))).toFixed(3)} m/s</strong></td></tr>
                        </tbody>
                    </table>
                    <p style={{ margin: "12px 0 0", fontSize: "0.85em", color: "rgba(180,210,255,0.75)" }}>{descs[resultRegime]}</p>

                    {isExperimentFinished ? (
                        <button
                            className="restart-btn"
                            style={{ background: 'linear-gradient(135deg, #238636, #2ea043)', color: '#fff', border: 'none' }}
                            onClick={() => navigate('/results', { state: { history: experimentHistory } })}
                        >
                            📊 Finish & View Results
                        </button>
                    ) : (
                        <button className="restart-btn" onClick={() => resetExperiment(false)}>
                            ▶️ Start Run {currentRunNum} of {targetRuns}
                        </button>
                    )}
                </div>
            </Draggable>
        );
    };

    return (
        <div className="ui-overlay">
            <div className="status-bar">
                <span><strong>Run {currentRunNum} of {targetRuns}</strong></span>
                <span>&nbsp;|&nbsp;</span>
                {step === 0 ? (
                    <span>Step <strong>0</strong>: <strong>Identify Apparatus</strong></span>
                ) : (
                    <span>Step <strong>{step}</strong>: <strong>{STEP_LABELS[step - 1]}</strong></span>
                )}

                {resultRe && (step > 4 || (step === 4 && dyeActive)) && (
                    <span>&nbsp;|&nbsp; Re = <strong>{Math.round(resultRe)}</strong>&nbsp;|&nbsp; Regime: <strong style={{ color: regimeColor }}>{resultRegime}</strong></span>
                )}
            </div>

            {/* Floating button to reopen sidebar when collapsed */}
            {!sidebarOpen && (
                <button className="sidebar-open-fab" onClick={() => setSidebarOpen(true)} title="Open settings">
                    ⚙️
                </button>
            )}

            <div className={`sidebar${sidebarOpen ? '' : ' sidebar--collapsed'}`}>
                <button
                    className="sidebar-toggle"
                    onClick={() => setSidebarOpen(o => !o)}
                    title={sidebarOpen ? 'Collapse settings' : 'Open settings'}
                >
                    {sidebarOpen ? '✕' : '⚙️'}
                </button>

                {step === 0 ? (
                    <>
                        <h2>🔎 Find Components</h2>
                        <p style={{ color: "#8b949e", fontSize: "0.95em", marginBottom: "1.5rem" }}>
                            Click on the 3D apparatus to identify the following components:
                        </p>
                        <div className="checklist">
                            {["Water Tank", "Dye Reservoir", "Dye Injector", "Test Pipe", "Flow Control Valve", "Collection Flask", "Sump Tank", "Pump System", "Overflow Pipe"].map(comp => (
                                <div key={comp} style={{
                                    display: "flex",
                                    alignItems: "center",
                                    marginBottom: "12px",
                                    color: foundComponents.includes(comp) ? "#2ea043" : "#c9d1d9",
                                    transition: "color 0.3s"
                                }}>
                                    <span style={{
                                        marginRight: "10px",
                                        fontSize: "1.2em",
                                        opacity: foundComponents.includes(comp) ? 1 : 0.4
                                    }}>
                                        {foundComponents.includes(comp) ? "✅" : "🔲"}
                                    </span>
                                    <span style={{
                                        fontWeight: foundComponents.includes(comp) ? "bold" : "normal",
                                        textDecoration: foundComponents.includes(comp) ? "line-through" : "none",
                                        opacity: foundComponents.includes(comp) ? 0.7 : 1
                                    }}>
                                        {comp}
                                    </span>
                                </div>
                            ))}
                        </div>
                    </>
                ) : (
                    <>
                        <h2>⚙️ Apparatus Settings</h2>
                        <div className="control-group">
                            <label>Pipe Diameter: {(diameter * 1000).toFixed(1)} mm</label>
                            <input type="range" min="0.01" max="0.05" step="0.001" value={diameter} onChange={e => setDiameter(parseFloat(e.target.value))} disabled={step > 2} />
                        </div>
                        <div className="control-group">
                            <label>Pipe Length: {length.toFixed(1)} m</label>
                            <input type="range" min="0.5" max="2.0" step="0.1" value={length} onChange={e => setLength(parseFloat(e.target.value))} disabled={step > 2} />
                        </div>
                        <div className="control-group">
                            <label>Flow Velocity: {velocity.toFixed(2)} m/s</label>
                            <input type="range" min="0.01" max="3.0" step="0.01" value={velocity} onChange={e => setVelocity(parseFloat(e.target.value))} disabled={step > 2} />
                        </div>
                        <div className="control-group">
                            <label>Fluid Type</label>
                            <select value={fluidName} onChange={e => setFluidName(e.target.value)} disabled={step > 2}>
                                {Object.keys(FLUID_DATABASE).map(k => <option key={k} value={k}>{k}</option>)}
                            </select>
                        </div>
                        <div style={{ marginTop: 10, fontSize: "0.9em", color: "#555" }}>
                            Density: {FLUID_DATABASE[fluidName].rho} kg/m³<br />
                            Viscosity: {FLUID_DATABASE[fluidName].mu} Pa·s
                        </div>
                        <button style={{ marginTop: 15, width: "100%" }} onClick={() => resetExperiment(true)}>🔄 Reset All Progress</button>
                    </>
                )}
            </div>


            {renderResults()}

            <div className="bottom-panel">
                <div className="step-bar">
                    {[1, 2, 3, 4, 5].map(n => (
                        <div key={n} className={`step-pip ${n < step ? 'done' : n === step ? 'active' : ''}`} />
                    ))}
                </div>
                <div className="action-row">
                    <div className="info-text">{actionInfo.text}</div>

                    {step === 3 && (
                        <div style={{ fontSize: 13, marginRight: 15 }}>{stabRemaining.toFixed(1)} s</div>
                    )}
                    {step === 5 && collectStartTs > 0 && (
                        <div style={{ fontSize: 13, marginRight: 15 }}>
                            ⏱ {colElapsed.toFixed(1)} s | 💧 {(flowRateM3s * colElapsed * 1000).toFixed(3)} L
                        </div>
                    )}

                    {step < 6 && (
                        <button className="action-btn" onClick={handleActionClick} disabled={actionInfo.disabled}>
                            {actionInfo.btn}
                        </button>
                    )}

                    {step === 6 && (
                        <button className="action-btn" onClick={() => setShowResults(!showResults)}>
                            {showResults ? "👁️ Hide Results" : "📊 Show Results"}
                        </button>
                    )}
                </div>
                {step === 3 && (
                    <div style={{ height: 4, background: "rgba(255,255,255,0.1)", borderRadius: 2, marginTop: 6 }}>
                        <div style={{ height: 4, borderRadius: 2, background: "#4488ff", width: `${((5 - stabRemaining) / 5) * 100}%`, transition: "width 0.1s" }} />
                    </div>
                )}
            </div>
        </div>
    );
}
