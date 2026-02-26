import { useState, useEffect } from "react";

/**
 * Returns { isMobile, isPortrait } based on window size and orientation.
 * isMobile: true if screen width < 768px
 * isPortrait: true if window height > window width
 */
export function useMobile() {
    const getState = () => ({
        isMobile: window.innerWidth < 768,
        isPortrait: window.innerHeight > window.innerWidth,
    });

    const [state, setState] = useState(getState);

    useEffect(() => {
        const handler = () => setState(getState());
        window.addEventListener("resize", handler);
        window.addEventListener("orientationchange", handler);
        return () => {
            window.removeEventListener("resize", handler);
            window.removeEventListener("orientationchange", handler);
        };
    }, []);

    return state;
}
