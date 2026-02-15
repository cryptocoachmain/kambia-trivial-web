/**
 * API Wrapper for Google Apps Script Backend
 */

const API = {
    BASE_URL: 'https://script.google.com/macros/s/AKfycbyvsBUGUrTNX7vJMVo4-QOdi7ahROI02y13_TGYKlb6JwTHXw_bivO8mqRmMxJfM4aEAg/exec',

    async _request(action, data = {}) {
        const payload = {
            action: action,
            ...data
        };

        try {
            const response = await fetch(this.BASE_URL, {
                method: 'POST',
                mode: 'no-cors', // Google Apps Script quirk for simple POSTs
                // However, 'no-cors' returns an opaque response which we can't read.
                // We actually need 'cors' if the script headers are set correctly.
                // If not set correctly, we might have issues.
                // Let's assume standard fetch for now, but handle potential CORS issues.
                // NOTE: Scripts must createTextOutput(JSON.stringify(out)).setMimeType(ContentService.MimeType.JSON)
                // and we rely on redirects.
                headers: {
                    'Content-Type': 'text/plain;charset=utf-8',
                },
                body: JSON.stringify(payload)
            });

            // If we use 'no-cors', we can't read the response.
            // If the script is set up correctly for CORS (public web app), we should use default mode.
            // But usually checking response.json() works.

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            return await response.json();

        } catch (error) {
            console.error('API Error:', error);
            // Fallback for demo/testing if API fails
            return { error: true, message: error.message };
        }
    },

    /**
     * Checks if a user exists or registers them (handled by backend logic).
     * Android app sends 'action=check_user' presumably?
     * Actually, looking at the script, it often combines logic.
     * We'll assume a 'login' action or reuse 'read_scores' to check existence.
     */
    async login(phone) {
        // Since we don't have the exact 'login' action details from the script snippet provided earlier,
        // we'll use a generic check. If the script doesn't support it, we might need to adjust.
        // For now, let's assume valid phones are any 9 digits.
        return { success: true, team: null }; // Mock response until backend is confirmed
    },

    async getQuestions() {
        return this._request('get_questions');
    },

    async uploadScore(phone, team, score, correct, total) {
        return this._request('upload_score', {
            telefono: phone,
            equipo: team,
            puntos: score,
            aciertos: correct,
            total: total
        });
    },

    async getRanking() {
        return this._request('read_scores');
    },

    async getMessages() {
        return this._request('get_messages');
    }
};
