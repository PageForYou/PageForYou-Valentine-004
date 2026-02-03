window.passQuiz = false;

class QuizManager {
    constructor() {
        if (QuizManager.instance) {
            return QuizManager.instance;
        }
        QuizManager.instance = this;

        this.quizContainer = document.getElementById('quizContainer');
        this.quizQuestion = document.getElementById('quizQuestion');
        this.quizQuestionImage = document.getElementById('quizQuestionImage');
        this.quizOptions = document.getElementById('quizOptions');
        this.quizProgressBar = document.getElementById('quizProgressBar');
        this.quizResult = document.getElementById('quizResult');
        this.quizScore = document.getElementById('quizScore');
        this.quizMessage = document.getElementById('quizMessage');
        // this.quizHeaderImage = document.getElementById('quizHeaderImage');
        this.quizResultImage = document.getElementById('quizResultImage');
        this.quizCloseButton = document.getElementById('quizCloseButton');
        this.quizRestartButton = document.getElementById('quizRestartButton');
        this.quizContent = document.querySelector('.quiz-content');
        
        this.currentQuiz = null;
        this.currentQuestionIndex = 0;
        this.score = 0;
        this.answerSelected = false;
        
        this.initializeEventListeners();
    }
    
    initializeEventListeners() {
        if (this.quizCloseButton) {
            this.quizCloseButton.addEventListener('click', () => this.closeQuiz());
        }
        if (this.quizRestartButton) {
            this.quizRestartButton.addEventListener('click', () => this.restartQuiz());
        }
    }
    
    startQuiz(quizData) {
        if (!quizData) {
            console.error('No quiz data provided');
            return;
        }

        this.currentQuiz = quizData;
        this.currentQuestionIndex = 0;
        this.score = 0;
        this.answerSelected = false;
        
        // Add close button if passQuiz is true
        if (window.passQuiz) {
            // Remove existing close button if any
            const existingCloseBtn = document.querySelector('.quiz-close-btn');
            if (existingCloseBtn) {
                existingCloseBtn.remove();
            }
            
            // Create and append close button
            const closeBtn = document.createElement('div');
            closeBtn.className = 'quiz-close-btn';
            closeBtn.innerHTML = '&times;';
            closeBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                this.closeQuiz();
            });
            this.quizContainer.appendChild(closeBtn);
        }
        
        // Show quiz container with animation
        this.quizContainer.style.display = 'flex';
        // Small timeout to allow display to update
        setTimeout(() => {
            this.quizContainer.classList.add('active');
        }, 10);
        
        // Load first question
        this.loadQuestion();
    }
    
    loadQuestion() {
        // Update progress
        const progress = ((this.currentQuestionIndex) / this.currentQuiz.quiz_items.length) * 100;
        this.quizProgressBar.style.width = `${progress}%`;
        if (!this.currentQuiz || !this.currentQuiz.quiz_items) {
            console.error('Invalid quiz data');
            return;
        }

        if (this.currentQuestionIndex >= this.currentQuiz.quiz_items.length) {
            this.showResults();
            return;
        }
        
        const question = this.currentQuiz.quiz_items[this.currentQuestionIndex];
        this.answerSelected = false;
        
        // Set question text
        this.quizQuestion.textContent = question.question_text || '';
        
        // Handle question image if exists
        if (question.question_type === 'ImageAndText' && question.question_image) {
            const imagePath = window.getCloudinaryUrl('w_400', `customers/${window.customerId}/img/${question.question_image}.jpg`);
            this.quizQuestionImage.src = imagePath;
            this.quizQuestionImage.style.display = 'block';
            this.quizQuestionImage.onerror = () => {
                this.quizQuestionImage.style.display = 'none';
            };
        } else {
            this.quizQuestionImage.style.display = 'none';
        }
        
        // Clear previous options
        this.quizOptions.innerHTML = '';
        
        // Create and append options
        if (question.options_text && Array.isArray(question.options_text)) {
            question.options_text.forEach((option, index) => {
                if (!option) return;
                
                const optionElement = document.createElement('div');
                optionElement.className = 'quiz-option';
                optionElement.textContent = option;
                optionElement.dataset.index = index;
                
                optionElement.addEventListener('click', () => {
                    if (this.answerSelected) return;
                    this.answerSelected = true;
                    this.selectAnswer(option, question.correct_answer);
                });
                
                this.quizOptions.appendChild(optionElement);
            });
        }
    }
    
    selectAnswer(selectedOption, correctAnswer) {
        window.AppAssets.audio.fast_click.play();
        const options = this.quizOptions.querySelectorAll('.quiz-option');
        let selectedElement = null;
        
        // Find and highlight selected option
        options.forEach(option => {
            if (option.textContent === selectedOption) {
                selectedElement = option;
                option.classList.add('selected');
                if (selectedOption === correctAnswer) {
                    // option.classList.add('correct');
                    this.score++;
                } else {
                    // option.classList.add('wrong');
                    // // Also highlight the correct answer
                    // options.forEach(opt => {
                    //     if (opt.textContent === correctAnswer) {
                    //         opt.classList.add('correct');
                    //     }
                    // });
                }
            }
        });
        
        // Disable all options after selection
        options.forEach(option => {
            option.style.pointerEvents = 'none';
        });
        
        // Move to next question after a delay
        this.currentQuestionIndex++;
        // Update progress
        const progress = ((this.currentQuestionIndex) / this.currentQuiz.quiz_items.length) * 100;
        this.quizProgressBar.style.width = `${progress}%`;
        setTimeout(() => {
            this.loadQuestion();
        }, 300);
    }
    
    showResults() {
        if (!this.currentQuiz || !this.currentQuiz.quiz_items) {
            console.error('Cannot show results: Invalid quiz data');
            return;
        }

        const totalQuestions = this.currentQuiz.quiz_items.length;
        const percentage = Math.round((this.score / totalQuestions) * 100);
        const passed = this.score >= (this.currentQuiz.pass_score || totalQuestions);
        
        // Update result UI
        this.quizScore.textContent = `คะแนน: ${this.score}/${totalQuestions}`;
        
        // Set result message based on score
        if (passed) {
            window.AppAssets.audio.correct.play();
            window.passQuiz = true;
            const quizThumbnailImage = document.querySelector('.quiz-thumbnail-image');
            quizThumbnailImage.src = window.getAssetUrl("w_500", "quiz_finish_1.png");
            this.quizMessage.textContent = 'ยินดีด้วย! คุณตอบถูกทุกข้อเลยนะ';
            this.quizResultImage.src = window.getAssetUrl("w_300", "cat_happy_1.png");
            this.quizCloseButton.style.display = 'block';
            this.quizRestartButton.style.display = 'none';
        } else {
            window.AppAssets.audio.wrong.play();
            this.quizMessage.textContent = 'ยังไม่ผ่านนะ ลองใหม่อีกครั้งได้เลย!';
            this.quizResultImage.src = window.getAssetUrl("w_300", "cat_sad_1.png");
            this.quizCloseButton.style.display = 'none';
            this.quizRestartButton.style.display = 'block';
        }
        
        // Show result section
        this.quizContent.style.display = 'none';
        this.quizResult.style.display = 'block';
    }
    
    closeQuiz() {
        // Reset for next time
        setTimeout(() => {
            this.quizContainer.classList.remove('active');
            this.quizResult.style.display = 'none';
            this.quizContent.style.display = 'block';
            
            // Set isWaiting to false in page-chat.js
            if (window.isWaiting !== undefined) {
                window.isWaiting = false;
            }
        }, 100);
    }
    
    restartQuiz() {
        this.currentQuestionIndex = 0;
        this.score = 0;
        this.answerSelected = false;
        this.quizResult.style.display = 'none';
        this.quizContent.style.display = 'block';
        this.loadQuestion();
    }
}

// Initialize the quiz manager when the DOM is fully loaded
document.addEventListener('DOMContentLoaded', () => {
    // Create a single instance of QuizManager
    const quizManager = new QuizManager();
    
    // Expose startQuiz globally
    window.startQuiz = function(quizData) {
        if (quizManager) {
            quizManager.startQuiz(quizData);
        } else {
            console.error('Quiz manager not initialized');
        }
    };
    
    // For debugging
    console.log('QuizManager initialized');
});