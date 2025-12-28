// Utility to check if backend is awake and warm it up if needed
// Used before critical operations like login to prevent timeout failures

const BACKEND_URL = import.meta.env.VITE_GRAPHQL_URI || 'http://localhost:4000/graphql';
const HEALTH_ENDPOINT = BACKEND_URL.replace('/graphql', '/health');

export interface HealthCheckResult {
    isAwake: boolean;
    responseTime: number;
    error?: string;
}

/**
 * Pings the backend health endpoint to check if it's awake
 * If backend is sleeping (on Render free tier), this will trigger a wake-up
 * 
 * @param timeoutMs - Maximum time to wait for response (default: 60 seconds)
 * @returns Promise with health check result
 */
export async function checkBackendHealth(timeoutMs: number = 60000): Promise<HealthCheckResult> {
    const startTime = Date.now();

    try {
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

        if (response.ok) {
            console.log(`✅ Backend is awake (responded in ${responseTime}ms)`);
            return {
                isAwake: true,
                responseTime,
            };
        } else {
            console.warn(`⚠️ Backend responded with status ${response.status}`);
            return {
                isAwake: false,
                responseTime,
                error: `HTTP ${response.status}`,
            };
        }
    } catch (error: any) {
        const responseTime = Date.now() - startTime;

        if (error.name === 'AbortError') {
            console.error(`❌ Health check timeout after ${timeoutMs}ms`);
            return {
                isAwake: false,
                responseTime,
                error: 'Timeout - backend may be down',
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
 * 
 * @param onProgress - Callback for progress updates (optional)
 * @returns Promise that resolves when backend is ready
 */
export async function warmUpBackend(
    onProgress?: (message: string, elapsed: number) => void
): Promise<boolean> {
    const startTime = Date.now();
    let attempts = 0;
    const maxAttempts = 3;

    while (attempts < maxAttempts) {
        attempts++;
        const elapsed = Math.round((Date.now() - startTime) / 1000);

        if (onProgress) {
            if (attempts === 1) {
                onProgress('Waking up backend...', elapsed);
            } else {
                onProgress(`Retry ${attempts}/${maxAttempts}...`, elapsed);
            }
        }

        const result = await checkBackendHealth(90000); // 90 second timeout

        if (result.isAwake) {
            const totalTime = Math.round((Date.now() - startTime) / 1000);
            if (onProgress) {
                onProgress(`Backend ready! (${totalTime}s)`, totalTime);
            }
            return true;
        }

        // Wait a bit before retrying (unless this was the last attempt)
        if (attempts < maxAttempts) {
            await new Promise(resolve => setTimeout(resolve, 2000));
        }
    }

    // Failed after all attempts
    if (onProgress) {
        const totalTime = Math.round((Date.now() - startTime) / 1000);
        onProgress(`Backend didn't respond after ${totalTime}s`, totalTime);
    }
    return false;
}
