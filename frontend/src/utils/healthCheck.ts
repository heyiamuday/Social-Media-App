// Utility to check if backend is awake and warm it up if needed
// Used before critical operations like login to prevent timeout failures

const BACKEND_URL = import.meta.env.VITE_GRAPHQL_URI || 'http://localhost:4000/graphql';
const HEALTH_ENDPOINT = BACKEND_URL.replace('/graphql', '/health');

export interface HealthCheckResult {
    isAwake: boolean;
    responseTime: number;
    error?: string;
    isTimeout?: boolean;
}

// Singleton state to manage concurrent warm-up requests
let warmUpPromise: Promise<boolean> | null = null;
let lastResult: HealthCheckResult | null = null;
let lastCheckTime: number = 0;

/**
 * Pings the backend health endpoint to check if it's awake
 * If backend is sleeping (on Render free tier), this will trigger a wake-up
 * 
 * @param timeoutMs - Maximum time to wait for response (default: 60 seconds)
 * @returns Promise with health check result
 */
export async function checkBackendHealth(timeoutMs: number = 60000): Promise<HealthCheckResult> {
    // If we had a successful check in the last 2 minutes, assume it's still awake
    if (lastResult?.isAwake && Date.now() - lastCheckTime < 120000) {
        return lastResult;
    }

    const startTime = Date.now();

    try {
        console.log(`🔍 Checking backend health at: ${HEALTH_ENDPOINT}`);
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

        const response = await fetch(HEALTH_ENDPOINT, {
            method: 'GET',
            signal: controller.signal,
            headers: {
                'Accept': 'application/json',
            },
        });

        clearTimeout(timeoutId);
        const responseTime = Date.now() - startTime;

        // If we get ANY response from the server (even a 404), it means it's awake!
        // This is a robust fallback in case the /health endpoint isn't deployed yet.
        if (response.status !== 0) {
            console.log(`✅ Backend is awake (responded with status ${response.status} in ${responseTime}ms)`);
            lastResult = { isAwake: true, responseTime };
            lastCheckTime = Date.now();
            return lastResult;
        } else {
            return {
                isAwake: false,
                responseTime,
                error: `Connection closed without response`,
            };
        }
    } catch (error: any) {
        const responseTime = Date.now() - startTime;

        if (error.name === 'AbortError') {
            console.error(`❌ Health check timeout after ${timeoutMs}ms`);
            return {
                isAwake: false,
                responseTime,
                isTimeout: true,
                error: 'Timeout - backend may be down or still waking up',
            };
        }

        console.error('❌ Health check failed:', error.message);
        return {
            isAwake: false,
            responseTime,
            error: error.message || 'Network error',
        };
    }
}

/**
 * Warm up the backend before a critical operation
 * Shows progress during cold start wake-up
 * Uses a singleton promise to avoid redundant pings
 * 
 * @param onProgress - Callback for progress updates (optional)
 * @returns Promise that resolves when backend is ready
 */
export async function warmUpBackend(
    onProgress?: (message: string, elapsed: number) => void
): Promise<boolean> {
    // If a warm-up is already in progress, wait for it
    if (warmUpPromise) {
        console.log('🔄 Warm-up already in progress, waiting...');
        if (onProgress) onProgress('Waiting for existing connection...', 0);
        return warmUpPromise;
    }

    warmUpPromise = (async () => {
        const startTime = Date.now();
        let attempts = 0;
        const maxAttempts = 3;

        while (attempts < maxAttempts) {
            attempts++;
            const elapsed = Math.round((Date.now() - startTime) / 1000);

            if (onProgress) {
                if (attempts === 1) {
                    onProgress('Connecting to server...', elapsed);
                } else {
                    onProgress(`Waking up server (Attempt ${attempts}/${maxAttempts})...`, elapsed);
                }
            }

            // Use a long timeout for the first attempt to give Render time
            const timeout = attempts === 1 ? 120000 : 60000;
            const result = await checkBackendHealth(timeout);

            if (result.isAwake) {
                const totalTime = Math.round((Date.now() - startTime) / 1000);
                if (onProgress) {
                    onProgress(`Server ready! (${totalTime}s)`, totalTime);
                }
                return true;
            }

            // If it was a timeout, Render might still be waking up. 
            // Don't wait too long between retries if it's a timeout.
            if (attempts < maxAttempts) {
                const waitTime = result.isTimeout ? 1000 : 3000;
                await new Promise(resolve => setTimeout(resolve, waitTime));
            }
        }

        return false;
    })();

    try {
        const success = await warmUpPromise;
        return success;
    } finally {
        // Clear the promise after completion (success or fail)
        // but keep a small cooldown to avoid immediate re-triggering
        setTimeout(() => { warmUpPromise = null; }, 5000);
    }
}

/**
 * Helper to start warm-up silently (e.g., on app load)
 */
export function silentWarmUp() {
    console.log('🚀 Triggering silent background warm-up...');
    warmUpBackend().catch(err => console.error('Silent warm-up failed:', err));
}
