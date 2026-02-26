import { useMobile } from "../hooks/useMobile";

/**
 * Shown only on mobile devices in portrait mode.
 * Asks the user to rotate to landscape for the best experience.
 */
export default function MobileRotateOverlay() {
    const { isMobile, isPortrait } = useMobile();

    if (!isMobile || !isPortrait) return null;

    return (
        <div style={{
            position: "fixed",
            inset: 0,
            zIndex: 99999,
            background: "linear-gradient(160deg, #0d1117 0%, #0f1e3d 100%)",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            gap: "24px",
            color: "#e6edf3",
            textAlign: "center",
            padding: "32px",
        }}>
            {/* Rotating phone icon */}
            <div style={{
                fontSize: "72px",
                animation: "rotatePhone 2s ease-in-out infinite",
                display: "inline-block",
                transformOrigin: "center",
            }}>
                📱
            </div>

            <h2 style={{
                margin: 0,
                fontSize: "1.5rem",
                fontWeight: 700,
                color: "#79c0ff",
            }}>
                Rotate Your Device
            </h2>

            <p style={{
                margin: 0,
                fontSize: "1rem",
                color: "rgba(200,220,255,0.7)",
                maxWidth: "280px",
                lineHeight: "1.6",
            }}>
                This experiment uses a 3D apparatus that works best in <strong style={{ color: "#e6edf3" }}>landscape mode</strong>.
                Please rotate your phone sideways.
            </p>

            <div style={{
                display: "flex",
                alignItems: "center",
                gap: "12px",
                marginTop: "8px",
                opacity: 0.5,
                fontSize: "0.85rem",
                color: "#8b949e",
            }}>
                <span>↕️ Portrait</span>
                <span style={{ fontSize: "1.2rem" }}>→</span>
                <span>↔️ Landscape</span>
            </div>

            <style>{`
                @keyframes rotatePhone {
                    0%   { transform: rotate(0deg); }
                    30%  { transform: rotate(0deg); }
                    60%  { transform: rotate(-90deg); }
                    90%  { transform: rotate(-90deg); }
                    100% { transform: rotate(0deg); }
                }
            `}</style>
        </div>
    );
}
