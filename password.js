document.addEventListener('DOMContentLoaded', () => {
    const passwordInput = document.getElementById('passwordInput');
    const submitButton = document.getElementById('submitPassword');
    const correctPassword = '1969'; // 阿波羅11號在1969年登陸月球

    submitButton.addEventListener('click', checkPassword);
    passwordInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            checkPassword();
        }
    });

    function checkPassword() {
        const enteredPassword = passwordInput.value.trim();
        
        if (enteredPassword === correctPassword) {
            // 儲存進度
            localStorage.setItem('passwordCompleted', 'true');
            // 進入下一關
            window.location.href = 'game.html';
        } else {
            alert('密碼錯誤！請重試。');
            passwordInput.value = '';
        }
    }

    // 檢查是否已經完成前一關
    const playerName = localStorage.getItem('playerName');
    if (!playerName) {
        window.location.href = 'index.html';
    }
});
