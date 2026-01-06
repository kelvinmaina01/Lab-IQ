/**
 * Parses raw AI/Backend errors into human-friendly messages
 */
export const parseAIError = (error: any): { title: string; message: string; isRetryable: boolean } => {
    const errString = typeof error === 'string' ? error : JSON.stringify(error);

    // 1. 404 Model Not Found (The Gemini Free Tier Issue)
    if (errString.includes('404') && errString.includes('models/gemini')) {
        return {
            title: 'AI Model Unavailable',
            message: 'The specific AI model (Gemini Pro) is currently unreachable on your plan. We are switching to a backup.',
            isRetryable: true
        };
    }

    // 2. 429 Rate Limit
    if (errString.includes('429') || errString.includes('Quota exceeded')) {
        return {
            title: 'High Traffic',
            message: 'The AI is experiencing high demand. Please wait a moment and try again.',
            isRetryable: true
        };
    }

    // 3. Connection Refused
    if (errString.includes('Connection refused') || errString.includes('Network Error')) {
        return {
            title: 'Connection Lost',
            message: 'Could not reach the AI Engine. Please check if the backend server is running.',
            isRetryable: false
        };
    }

    // Default
    return {
        title: 'Generation Failed',
        message: 'An unexpected error occurred. Please try again.',
        isRetryable: true
    };
};
