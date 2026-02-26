import { useLocation, useNavigate, Navigate } from 'react-router-dom';
import './ResultsPage.css';

export default function ResultsPage() {
    const location = useLocation();
    const navigate = useNavigate();

    // If navigated here without history, redirect to home
    const history = location.state?.history;
    if (!history || history.length === 0) {
        return <Navigate to="/" replace />;
    }

    const regimeColors = {
        Laminar: '#1E90FF',
        Transitional: '#FFD700',
        Turbulent: '#FF4500'
    };

    return (
        <div className="results-container">
            <header className="results-header">
                <h1>Experiment Results</h1>
                <p>Tabulated data for all completed runs.</p>
            </header>

            <main className="results-main">
                <div className="table-wrapper">
                    <table className="results-table">
                        <thead>
                            <tr>
                                <th>Run #</th>
                                <th>Fluid</th>
                                <th>Diameter (mm)</th>
                                <th>Velocity (m/s)</th>
                                <th>Time (s)</th>
                                <th>Reynolds No.</th>
                                <th>Flow Regime</th>
                            </tr>
                        </thead>
                        <tbody>
                            {history.map((run, idx) => (
                                <tr key={idx}>
                                    <td>{run.runNum}</td>
                                    <td>{run.fluid}</td>
                                    <td>{run.diameter.toFixed(1)}</td>
                                    <td>{run.velocity.toFixed(3)}</td>
                                    <td>{run.time.toFixed(1)}</td>
                                    <td className="re-cell">{run.re}</td>
                                    <td>
                                        <span
                                            className="regime-badge"
                                            style={{
                                                backgroundColor: `${regimeColors[run.regime]}22`,
                                                color: regimeColors[run.regime],
                                                border: `1px solid ${regimeColors[run.regime]}44`
                                            }}
                                        >
                                            {run.regime}
                                        </span>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                <div className="results-actions">
                    <button className="restart-btn" onClick={() => navigate('/')}>
                        🔄 Start New Session
                    </button>
                </div>
            </main>
        </div>
    );
}
