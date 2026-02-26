import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './IntroPage.css';
import 'katex/dist/katex.min.css';
import { BlockMath } from 'react-katex';
import MobileRotateOverlay from '../components/MobileRotateOverlay';

export default function IntroPage() {
    const navigate = useNavigate();
    const [runs, setRuns] = useState(3);

    return (
        <>
            <MobileRotateOverlay />
            <div className="intro-container">
                <header className="intro-hero">
                    <div className="glow-bg"></div>
                    <div className="hero-header">
                        <h1>Reynolds Flow Experiment</h1>
                        <p>Investigate the transition between laminar and turbulent flow regimes.</p>

                        <div className="action-section-top">
                            <div className="start-buttons">
                                <button className="start-btn explore-btn" onClick={() => navigate('/experiment', { state: { startMode: 'explore' } })}>
                                    Find the Apparatus
                                </button>
                                <button className="start-btn" onClick={() => navigate('/experiment', { state: { startMode: 'experiment' } })}>
                                    Start Experiment
                                </button>
                            </div>
                        </div>
                    </div>
                </header>

                <main className="intro-main-split">
                    <section className="theory-section">
                        <h2>Theoretical Background</h2>
                        <p>
                            Osborne Reynolds (1883) demonstrated that fluid flow in a pipe can be either smooth
                            and orderly (laminar) or chaotic and mixing (turbulent). The transition depends on
                            fluid velocity (<i>V</i>), pipe diameter (<i>D</i>), fluid density (<i>&rho;</i>), and dynamic viscosity (<i>&mu;</i>).
                        </p>
                        <p>
                            The dimensionless <strong>Reynolds Number (<i>Re</i>)</strong> characterizes this flow:
                        </p>
                        <div className="formula-box">
                            <BlockMath math={'Re = \\frac{\\rho V D}{\\mu}'} />
                        </div>
                        <ul className="flow-types">
                            <li><span className="badge laminar">Re &lt; 2300</span> &mdash; Laminar Flow</li>
                            <li><span className="badge transitional">2300 &le; Re &le; 4000</span> &mdash; Transitional Flow</li>
                            <li><span className="badge turbulent">Re &gt; 4000</span> &mdash; Turbulent Flow</li>
                        </ul>
                    </section>

                    <div className="apparatus-side">
                        <img src="/apparatus.png" alt="Reynolds Apparatus" className="main-apparatus-img" />
                    </div>
                </main>

                <footer style={{
                    textAlign: "center",
                    padding: "20px 0 24px",
                    borderTop: "1px solid rgba(255,255,255,0.08)",
                    marginTop: "16px",
                    color: "rgba(180,200,255,0.55)",
                    fontSize: "0.82rem",
                    letterSpacing: "0.01em",
                }}>
                    <span style={{ fontWeight: 600, color: "rgba(200,220,255,0.75)" }}>
                        Prof. Satya Pramod Jammy
                    </span>
                    <span style={{ margin: "0 10px", opacity: 0.35 }}>·</span>
                    School of Computer Science, UPES Dehradun
                </footer>
            </div>
        </>
    );
}

