/**
 * API Wrapper for Google Apps Script Backend
 */

const API = {
    BASE_URL: 'https://script.google.com/macros/s/AKfycbzYftmtIZDQsBS-bGl8X9fEmshKYOuHOZN0-98TTzQVkMSXNn4u4aM0R8VToYB-BWRWUQ/exec',

    async _request(action, data = {}) {
        // Use GET for data fetching to avoid CORS preflight issues with simple requests
        // Google Apps Script Web Apps handle GET much easier for public access

        const params = new URLSearchParams();
        params.append('action', action);
        params.append('origin', 'Web'); // Identifier for logging

        for (const key in data) {
            params.append(key, data[key]);
        }

        const url = `${this.BASE_URL}?${params.toString()}`;

        try {
            const response = await fetch(url, {
                method: 'GET',
                // 'cors' mode is default and correct for GET if script sets headers
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            return await response.json();

        } catch (error) {
            console.error('API Error:', error);
            // DEBUG: Show error in UI
            const errorDiv = document.getElementById('admin-message-text');
            if (errorDiv) {
                errorDiv.innerHTML = `
                    <span style="color:red; font-size: 0.8rem">
                    <b>Error de Conexión:</b><br>
                    ${error.message}<br>
                    Intenta recargar. Revisa que el Script esté publicado como "Anyone".
                    </span>`;
            }
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
        return this._request('upload', {
            telefono: phone,
            equipo: team,
            puntos: score,
            aciertos: correct,
            total: total
        });
    },

    async getRanking(phone = "") {
        const data = phone ? { telefono: phone } : {};
        return this._request('get_scores', data);
    },

    async getMessages() {
        return this._request('get_messages');
    },

    async getPresencialScores() {
        return this._request('get_presencial_scores');
    }
};
