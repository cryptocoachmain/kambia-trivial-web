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
        currentScore: document.getElementById('current-score'),
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
        this.elements.startAppBtn.addEventListener('click', () => this.showScreen('home-screen'));
        this.elements.playGameBtn.addEventListener('click', () => this.startGame());
        this.elements.backHomeBtn.addEventListener('click', () => {
            this.resetGame();
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
                this.state.adminMessages = result.messages;
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
        // Placeholder for ranking logic
        // Populates #presencial-ranking-listIn, #global-ranking-list, #user-scores-list
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
            // Fetch questions
            const response = await API.getQuestions();
            // Expect: { questions: [ { id, question, optionA, optionB... , correctAnswer }, ... ] }

            if (response && response.questions && response.questions.length > 0) {
                this.state.game.questions = response.questions;
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
        this.elements.currentScore.textContent = this.state.game.score;
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
        const step = 100 / (this.CONSTANTS.QUESTION_TIME_MS / 100); // update every 100ms

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

        // Highlight options
        const buttons = this.elements.optionsContainer.querySelectorAll('.option-btn');
        buttons.forEach(btn => {
            if (btn.dataset.key === correctKey) btn.classList.add('correct');
            if (btn.dataset.key === selectedKey && !isCorrect) btn.classList.add('wrong');
        });

        if (isCorrect) {
            this.state.game.score += this.CONSTANTS.POINTS_PER_QUESTION;
            this.state.game.correctCount++;
            this.showFeedback(true, "¡Correcto!");
            // Play Correct Video?
            // VideoPlayer.play('assets/correct.mp4', false, () => { ... });
        } else {
            this.showFeedback(false, "Incorrecto");
            // Play Wrong Video?
        }

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
        this.elements.cheatWarning.classList.remove('hidden');
        // Logic to strike or deduct points?
        // Close after 3s
        setTimeout(() => {
            this.elements.cheatWarning.classList.add('hidden');
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
