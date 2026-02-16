/**
 * Main Application Logic
 */

const App = {
    // efficient DOM cache
    elements: {
        screens: document.querySelectorAll('.screen'),
        loginScreen: document.getElementById('login-screen'),
        welcomeScreen: document.getElementById('welcome-screen'),
        homeScreen: document.getElementById('home-screen'),
        gameScreen: document.getElementById('game-screen'),
        thanksScreen: document.getElementById('thanks-screen'),

        loginBtn: document.getElementById('login-btn'),
        phoneInput: document.getElementById('phone-input'),
        teamSelector: document.getElementById('team-selector'),
        teamError: document.getElementById('team-error'),

        startAppBtn: document.getElementById('start-app-btn'),
        playGameBtn: document.getElementById('play-game-btn'),

        adminMsgText: document.getElementById('admin-message-text'),
        msgCounter: document.getElementById('message-counter'),
        prevMsgBtn: document.getElementById('prev-msg-btn'),
        nextMsgBtn: document.getElementById('next-msg-btn'),

        timerProgress: document.getElementById('timer-progress'),
        currentQuestionNum: document.getElementById('current-question-num'),
        questionText: document.getElementById('question-text'),
        optionsContainer: document.getElementById('options-container'),
        feedbackMsg: document.getElementById('feedback-msg'),

        finalScore: document.getElementById('final-score'),
        finalCorrect: document.getElementById('final-correct'),
        perfectBonusMsg: document.getElementById('perfect-bonus-msg'),
        backHomeBtn: document.getElementById('back-home-btn'),

        cheatWarning: document.getElementById('cheat-warning'),
        cheatMsg: document.getElementById('cheat-msg')
    },

    state: {
        user: {
            phone: null,
            team: null
        },
        game: {
            questions: [],
            currentIndex: 0,
            score: 0,
            correctCount: 0,
            timer: null,
            timeLeft: 0, // 100%
            isOver: false,
            canAnswer: false
        },
        adminMessages: [],
        currentMsgIndex: 0
    },

    CONSTANTS: {
        TEAMS: [
            { id: 'RED', name: 'Loyola', color: '#E53935' },
            { id: 'YELLOW', name: 'Javier', color: '#FFB300' },
            { id: 'BLUE', name: 'Avila', color: '#1E88E5' }
        ],
        QUESTION_TIME_MS: 15000, // 15 seconds
        POINTS_PER_QUESTION: 10,
        PERFECT_BONUS: 50
    },

    init() {
        this.setupEventListeners();
        this.renderTeamSelector();

        // Anti-cheat detection (Visibility API)
        document.addEventListener('visibilitychange', () => {
            if (document.hidden && !this.state.game.isOver &&
                !this.elements.gameScreen.classList.contains('hidden')) {
                this.handleCheatAttempt();
            }
        });

        // Show initial video? (If user wants it on page load)
        // VideoPlayer.play('assets/mw.mp4', true, () => console.log('Intro done'));
    },

    setupEventListeners() {
        // Login
        this.elements.phoneInput.addEventListener('input', (e) => {
            // Force numbers/limit 9
            e.target.value = e.target.value.replace(/[^0-9]/g, '').slice(0, 9);
            this.validateLogin();
        });

        this.elements.loginBtn.addEventListener('click', () => this.handleLogin());

        // Navigation
        this.elements.startAppBtn.addEventListener('click', () => {
            // Play intro video before entering dashboard
            VideoPlayer.play('assets/mw.mp4', false, () => {
                this.showScreen('home-screen');
                this.loadRankings(); // Load data when entering dashboard
            });
        });
        this.elements.playGameBtn.addEventListener('click', () => this.startGame());

        // Full Ranking
        document.getElementById('view-full-ranking-btn').addEventListener('click', () => this.showFullRanking());
        document.getElementById('close-full-ranking-btn').addEventListener('click', () => this.showScreen('home-screen'));

        // Android App Install
        const installBtn = document.getElementById('show-android-install-btn');
        if (installBtn) {
            installBtn.addEventListener('click', () => this.showScreen('android-install-screen'));
        }
        const cancelInstallBtn = document.getElementById('android-cancel-btn');
        if (cancelInstallBtn) {
            cancelInstallBtn.addEventListener('click', () => this.showScreen('home-screen'));
        }

        this.elements.backHomeBtn.addEventListener('click', () => {
            this.resetGame();
            this.loadRankings(); // Refresh rankings after game
            this.showScreen('home-screen');
        });

        // Admin Messages
        this.elements.prevMsgBtn.addEventListener('click', () => this.navigateMessage(-1));
        this.elements.nextMsgBtn.addEventListener('click', () => this.navigateMessage(1));

        // Report Issue (Demo)
        document.getElementById('report-issue-btn').addEventListener('click', () => {
            alert('Funcionalidad de reporte por implementar (abrir cliente correo).');
            window.location.href = "mailto:hola@fundacionkambia.org?subject=Incidencia Trivial Web";
        });
    },

    renderTeamSelector() {
        this.elements.teamSelector.innerHTML = '';
        this.CONSTANTS.TEAMS.forEach(team => {
            const div = document.createElement('div');
            div.className = 'team-item';
            div.innerHTML = `
                <div class="team-color-dot" style="background-color: ${team.color}"></div>
                <span>${team.name}</span>
            `;
            div.addEventListener('click', () => {
                // Deselect others
                document.querySelectorAll('.team-item').forEach(el => el.classList.remove('selected'));
                div.classList.add('selected');
                this.state.user.team = team;
                this.elements.teamError.classList.add('hidden');
                this.validateLogin();
            });
            this.elements.teamSelector.appendChild(div);
        });
    },

    validateLogin() {
        const phoneValid = this.elements.phoneInput.value.length === 9;
        const teamSelected = !!this.state.user.team;
        this.elements.loginBtn.disabled = !(phoneValid && teamSelected);
    },

    async handleLogin() {
        if (this.elements.loginBtn.disabled) return;

        this.state.user.phone = this.elements.phoneInput.value;

        // Optional: Call API to check user existence or auto-select team
        // await API.login(this.state.user.phone);

        this.showScreen('welcome-screen');

        // Fetch background data
        this.loadAdminMessages();
        this.loadRankings();
    },

    showScreen(screenId) {
        this.elements.screens.forEach(s => s.classList.add('hidden'));
        document.getElementById(screenId).classList.remove('hidden');
    },

    // --- Data Loading ---

    async loadAdminMessages() {
        try {
            // Demo data if API fails or is unimplemented
            const result = await API.getMessages();
            // Expected format: { messages: ["msg1", "msg2"] }
            if (result && result.messages && Array.isArray(result.messages)) {
                // API returns objects like { message: "text" }, extract just the text
                this.state.adminMessages = result.messages.map(m => m.message || m);
            } else {
                this.state.adminMessages = ["Bienvenido al Trivial de Kambia.", "Responde correctamente para sumar puntos."];
            }
            this.updateMessageDisplay();
        } catch (e) {
            console.error(e);
            this.elements.adminMsgText.textContent = "Error cargando mensajes.";
        }
    },

    navigateMessage(direction) {
        if (this.state.adminMessages.length === 0) return;
        this.state.currentMsgIndex += direction;

        // Loop around
        if (this.state.currentMsgIndex < 0) this.state.currentMsgIndex = this.state.adminMessages.length - 1;
        if (this.state.currentMsgIndex >= this.state.adminMessages.length) this.state.currentMsgIndex = 0;

        this.updateMessageDisplay();
    },

    updateMessageDisplay() {
        const count = this.state.adminMessages.length;
        if (count === 0) {
            this.elements.adminMsgText.textContent = "No hay mensajes.";
            this.elements.msgCounter.textContent = "0 / 0";
            return;
        }
        this.elements.adminMsgText.textContent = this.state.adminMessages[this.state.currentMsgIndex];
        this.elements.msgCounter.textContent = `${this.state.currentMsgIndex + 1} / ${count}`;
    },


    async loadRankings() {
        try {
            // Pass user phone to get personalized scores
            const phone = this.state.user.phone || "";

            // Fetch PRESENCIAL scores (from "Presencial" sheet)
            const presencialResult = await API.getPresencialScores();

            // Fetch ONLINE scores (from "Puntuaciones" sheet)
            const result = await API.getRanking(phone);

            if (!result || result.error || result.result !== "success") {
                console.error("Failed to load online rankings", result);
                return;
            }

            // 1. SPORTS LEIOA PRESENCIALES (from Presencial sheet, SORTED)
            const presencialList = document.getElementById('presencial-ranking-list');
            if (presencialList && presencialResult && presencialResult.result === "success" && presencialResult.scores) {
                const teams = [
                    { name: 'Loyola', key: 'Loyola', color: 'red' },
                    { name: 'Javier', key: 'Javier', color: 'yellow' },
                    { name: 'Avila', key: 'Avila', color: 'blue' }
                ];

                // Sort teams by score (descending)
                const sortedTeams = teams
                    .map(team => ({ ...team, score: presencialResult.scores[team.key] || 0 }))
                    .sort((a, b) => b.score - a.score);

                presencialList.innerHTML = sortedTeams.map((team, idx) => {
                    return `<div class="ranking-row"><span class="${team.color}">${idx + 1}. ${team.name}</span><span>${team.score} pts</span></div>`;
                }).join('');
            }

            // 2. CLASIFICACIÓN TOTAL (Global online ranking, SORTED)
            const globalList = document.getElementById('global-ranking-list');
            if (globalList && result.global) {
                const teams = [
                    { name: 'Loyola', key: 'Loyola', color: 'red' },
                    { name: 'Javier', key: 'Javier', color: 'yellow' },
                    { name: 'Avila', key: 'Avila', color: 'blue' }
                ];

                // Sort teams by score (descending)
                const sortedTeams = teams
                    .map(team => ({ ...team, score: result.global[team.key] || 0 }))
                    .sort((a, b) => b.score - a.score);

                globalList.innerHTML = sortedTeams.map((team, idx) => {
                    return `<div class="ranking-row"><span class="${team.color}">${idx + 1}. ${team.name}</span><span>${team.score} pts</span></div>`;
                }).join('');
            }

            // 3. TU PUNTUACIÓN PERSONAL (User's scores by team, SORTED)
            const userList = document.getElementById('user-scores-list');
            if (userList && result.user) {
                const teams = [
                    { name: 'Loyola', key: 'Loyola', color: 'red' },
                    { name: 'Javier', key: 'Javier', color: 'yellow' },
                    { name: 'Avila', key: 'Avila', color: 'blue' }
                ];

                // Sort teams by score (descending)
                const sortedUserTeams = teams
                    .map(team => ({ ...team, score: result.user[team.key] || 0 }))
                    .sort((a, b) => b.score - a.score);

                userList.innerHTML = sortedUserTeams.map(team => {
                    // For user scores, we just show the score, no ranking number needed really, but sorted looks better
                    return `<div class="ranking-row"><span class="${team.color}">${team.name}</span><span>${team.score} pts</span></div>`;
                }).join('');
            }

            // 4. CLASIFICACIÓN POR JUGADOR (Logic: Top 10 + User)
            if (result.ranking && Array.isArray(result.ranking)) {
                this.state.fullRanking = result.ranking; // Store for full view
                this.renderRankingTable('player-ranking-body', this.getDashboardRankingData(result.ranking, phone));
            }

        } catch (e) {
            console.error("Error loading rankings:", e);
        }
    },

    getDashboardRankingData(allRanking, userPhone) {
        // Enforce phone normalization for comparison just in case
        const normUserPhone = userPhone ? userPhone.slice(-9) : "";

        let displayList = allRanking.slice(0, 10);

        // Find user in the FULL list to get real rank
        const userIndex = allRanking.findIndex(r => r.phone && r.phone.slice(-9) === normUserPhone);

        // If user exists and is NOT in top 10, append them
        if (userIndex >= 10) {
            const userEntry = allRanking[userIndex];
            // We attach the 'realRank' property to display the correct number
            userEntry.realRank = userIndex + 1;
            displayList.push(userEntry);
        }

        return displayList;
    },

    renderRankingTable(targetId, data) {
        const tbody = document.getElementById(targetId);
        if (!tbody) return;

        const currentUserPhone = this.state.user.phone ? this.state.user.phone.slice(-9) : "";

        tbody.innerHTML = data.map((player, idx) => {
            // Determine rank display: use 'realRank' if set (for appended user), else idx + 1
            const rank = player.realRank || (idx + 1); // Note: idx matches position for Top 10
            // If we are rendering the FULL list (where realRank might not be set on everyone individually), 
            // we rely on the index passed to map if we passed the full sorted array.
            // But wait, renderRankingTable receives a 'data' array. 
            // If it's the dashboard list, 'data' is the constructed list.
            // If it's the full list, 'data' is the full array.

            // Fix: calculate rank based on the player object's position in the original full list if possible?
            // Actually, for the dashboard list, we manually added 'realRank' to the user. 
            // For the top 10, their index in 'data' IS their rank (0->1, 1->2).
            // So logic: if(player.realRank) return player.realRank; else return idx + 1;
            // This works for Top 10 (idx 0-9) and User (idx 10, realRank X).
            // For Full List, we won't have 'realRank' set, so idx+1 works perfectly.

            const displayRank = player.realRank || (this.state.fullRanking.indexOf(player) + 1);

            const pPhone = player.phone ? player.phone.slice(-9) : "000000000";
            // Masking: 1st, 2nd, [***], 6th, 7th, 8th, 9th
            // Index: 0, 1, [2,3,4], 5, 6, 7, 8
            const maskedPhone = pPhone.length >= 9
                ? pPhone.substring(0, 2) + "***" + pPhone.substring(5)
                : pPhone;

            const isCurrentUser = pPhone === currentUserPhone;
            const rowClass = isCurrentUser ? "current-user-row" : "";

            return `
                <tr class="${rowClass}">
                    <td>${displayRank}</td>
                    <td>${maskedPhone}</td>
                    <td class="red">${player.l || 0}</td>
                    <td class="yellow">${player.j || 0}</td>
                    <td class="blue">${player.a || 0}</td>
                    <td><strong>${player.t || 0}</strong></td>
                </tr>
            `;
        }).join('');
    },

    showFullRanking() {
        if (!this.state.fullRanking) return;
        this.renderRankingTable('full-ranking-body', this.state.fullRanking);
        this.showScreen('full-ranking-screen');
    },


    // --- GAME LOGIC ---

    async startGame() {
        // Reset state
        this.state.game = {
            questions: [],
            currentIndex: 0,
            score: 0,
            correctCount: 0,
            timer: null,
            timeLeft: 100,
            isOver: false,
            canAnswer: false
        };

        this.showScreen('game-screen');
        this.elements.questionText.textContent = "Cargando preguntas...";
        this.elements.optionsContainer.innerHTML = '';

        try {
            // Fetch questions (Web receives ~50, Android ~10)
            const response = await API.getQuestions();

            if (response && response.questions && response.questions.length > 0) {
                let pool = response.questions;

                // --- Client-side filtering for duplicates ---
                const recentkey = 'kambia_recent_questions';
                let recentIds = [];
                try {
                    recentIds = JSON.parse(localStorage.getItem(recentkey) || '[]');
                } catch (e) { recentIds = []; }

                // Filter out recently seen questions
                let questions = pool.filter(q => !recentIds.includes(q.id));

                // If we ran out of unique questions, fallback to the pool (or mix)
                if (questions.length < 10) {
                    // Start filling with pool items that are not already in 'questions'
                    // Ideally, we just take the pool, maybe shuffle again? 
                    // For simplicity, just concat the rest of pool to ensure we have 10
                    // (The filter might have removed too many)
                    // We prioritize 'questions' (unseen) then fill with 'pool' (seen)
                    const needed = 10 - questions.length;
                    const remaining = pool.filter(q => !questions.includes(q));
                    questions = questions.concat(remaining.slice(0, needed));
                }

                // Take exactly 10
                questions = questions.slice(0, 10);

                // Update history
                const newIds = questions.map(q => q.id);
                // Keep last 40 IDs (approx 4 games) in history
                let improvedHistory = [...newIds, ...recentIds].slice(0, 40);
                localStorage.setItem(recentkey, JSON.stringify(improvedHistory));

                this.state.game.questions = questions;
                this.loadNextQuestion();
            } else {
                throw new Error("No questions returned");
            }
        } catch (e) {
            console.error(e);
            this.elements.questionText.textContent = "Error al cargar preguntas. Inténtalo de nuevo.";
            setTimeout(() => this.showScreen('home-screen'), 2000);
        }
    },

    loadNextQuestion() {
        if (this.state.game.currentIndex >= this.state.game.questions.length) {
            this.endGame();
            return;
        }

        const q = this.state.game.questions[this.state.game.currentIndex];

        // Update UI
        this.elements.currentQuestionNum.textContent = this.state.game.currentIndex + 1;
        this.elements.questionText.textContent = q.question;

        // Shuffle options logic would go here if not pre-shuffled
        // For simplicity, assuming options A, B, C, D maps to keys
        const options = [
            { key: 'a', text: q.optionA },
            { key: 'b', text: q.optionB },
            { key: 'c', text: q.optionC },
            { key: 'd', text: q.optionD }
        ];

        this.elements.optionsContainer.innerHTML = '';
        options.forEach(opt => {
            const btn = document.createElement('button');
            btn.className = 'option-btn';
            btn.textContent = opt.text;
            btn.dataset.key = opt.key;
            btn.addEventListener('click', () => this.handleAnswer(opt.key, q.correctAnswer)); // 'b' is usually correct in the CSV based on analysis?? need to verify
            this.elements.optionsContainer.appendChild(btn);
        });

        this.elements.feedbackMsg.classList.add('hidden');
        this.startTimer();
    },

    startTimer() {
        this.state.game.timeLeft = 100;
        this.elements.timerProgress.style.width = '100%';
        this.state.game.canAnswer = true;

        clearInterval(this.state.game.timer);
        const step = 100 / (this.CONSTANTS.QUESTION_TIME_MS / 100);

        this.state.game.timer = setInterval(() => {
            this.state.game.timeLeft -= step;
            this.elements.timerProgress.style.width = this.state.game.timeLeft + '%';

            if (this.state.game.timeLeft <= 0) {
                this.handleTimeout();
            }
        }, 100);
    },

    handleTimeout() {
        clearInterval(this.state.game.timer);
        this.state.game.canAnswer = false;
        this.showFeedback(false, "¡Tiempo agotado!");
        setTimeout(() => {
            this.state.game.currentIndex++;
            this.loadNextQuestion();
        }, 2000);
    },

    handleAnswer(selectedKey, correctKey) {
        if (!this.state.game.canAnswer) return;

        clearInterval(this.state.game.timer);
        this.state.game.canAnswer = false;

        const isCorrect = selectedKey.toLowerCase() === correctKey.toLowerCase();

        // 1. VISUAL FEEDBACK FIRST
        const buttons = this.elements.optionsContainer.querySelectorAll('.option-btn');
        buttons.forEach(btn => {
            if (btn.dataset.key === correctKey) btn.classList.add('correct');
            if (btn.dataset.key === selectedKey && !isCorrect) btn.classList.add('wrong');
        });

        if (isCorrect) {
            this.state.game.score += this.CONSTANTS.POINTS_PER_QUESTION;
            this.state.game.correctCount++;
            this.showFeedback(true, "¡Correcto!");
        } else {
            this.showFeedback(false, "Incorrecto");
        }

        // Update score display immediately
        this.elements.currentScore.textContent = this.state.game.score;

        setTimeout(() => {
            this.state.game.currentIndex++;
            this.loadNextQuestion();
        }, 2000);
    },

    showFeedback(isCorrect, msg) {
        const el = this.elements.feedbackMsg;
        el.textContent = msg;
        el.className = isCorrect ? 'feedback-msg correct-color' : 'feedback-msg error-color'; // Define these classes if needed or inline types
        el.style.color = isCorrect ? 'green' : 'red'; // Simple fallback
        el.classList.remove('hidden');
    },

    handleCheatAttempt() {
        // STOP EVERYTHING IMMEDIATELY
        VideoPlayer.stopVideo(); // Force hide overlay
        clearInterval(this.state.game.timer);
        this.state.game.isOver = true;
        this.state.game.canAnswer = false;

        // Hide game screen instantly to prevent interaction
        this.elements.gameScreen.classList.add('hidden');

        this.elements.cheatWarning.classList.remove('hidden');
        this.elements.cheatMsg.textContent = "Actividad sospechosa detectada. Partida cancelada.";

        // Expel user and reload to clear state
        setTimeout(() => {
            window.location.reload();
        }, 3000);
    },

    async endGame() {
        this.state.game.isOver = true;
        this.showScreen('thanks-screen');

        // Perfect score bonus
        if (this.state.game.correctCount === 10) {
            this.state.game.score += this.CONSTANTS.PERFECT_BONUS;
            this.elements.perfectBonusMsg.classList.remove('hidden');
        } else {
            this.elements.perfectBonusMsg.classList.add('hidden');
        }

        this.elements.finalScore.textContent = this.state.game.score;
        this.elements.finalCorrect.textContent = this.state.game.correctCount;

        // Upload Score
        try {
            await API.uploadScore(
                this.state.user.phone,
                this.state.user.team.name, // e.g. "Loyola" (or ID?) - matching Android enum
                this.state.game.score,
                this.state.game.correctCount,
                10 // total
            );
        } catch (e) {
            console.error("Failed to upload score", e);
        }
    },

    resetGame() {
        // Reset necessary UI bits if needed
    }
};

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    App.init();
});
