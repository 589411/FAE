document.addEventListener('DOMContentLoaded', () => {
    const playerNameInput = document.getElementById('playerName');
    const startMissionBtn = document.getElementById('startMission');
    const missionBrief = document.getElementById('missionBrief');
    const proceedToPasswordBtn = document.getElementById('proceedToPassword');

    startMissionBtn.addEventListener('click', () => {
        const playerName = playerNameInput.value.trim();
        if (playerName) {
            localStorage.setItem('playerName', playerName);
            playerNameInput.disabled = true;
            startMissionBtn.style.display = 'none';
            missionBrief.classList.remove('hidden');
        } else {
            alert('請輸入你的名字！');
        }
    });

    proceedToPasswordBtn.addEventListener('click', () => {
        window.location.href = 'question.html';
    });
});
