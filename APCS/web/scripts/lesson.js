// 課程頁面 JavaScript 功能

// 側邊欄導航高亮
const sidebarLinks = document.querySelectorAll('.sidebar-link');
const contentSections = document.querySelectorAll('.content-section');

function updateSidebarActive() {
    const scrollY = window.pageYOffset;
    
    contentSections.forEach(section => {
        const sectionTop = section.offsetTop - 150;
        const sectionHeight = section.offsetHeight;
        const sectionId = section.getAttribute('id');
        
        if (scrollY > sectionTop && scrollY <= sectionTop + sectionHeight) {
            sidebarLinks.forEach(link => {
                link.classList.remove('active');
                if (link.getAttribute('href') === `#${sectionId}`) {
                    link.classList.add('active');
                }
            });
        }
    });
}

window.addEventListener('scroll', updateSidebarActive);

// 平滑滾動
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        e.preventDefault();
        const target = document.querySelector(this.getAttribute('href'));
        if (target) {
            const offset = 100;
            const targetPosition = target.offsetTop - offset;
            window.scrollTo({
                top: targetPosition,
                behavior: 'smooth'
            });
        }
    });
});

// 複製程式碼功能
function copyCode(button) {
    const codeBlock = button.parentElement.nextElementSibling;
    const code = codeBlock.querySelector('code').textContent;
    
    navigator.clipboard.writeText(code).then(() => {
        const originalText = button.textContent;
        button.textContent = '✅ 已複製！';
        button.style.background = 'rgba(0, 255, 136, 0.2)';
        button.style.borderColor = 'var(--success-green)';
        button.style.color = 'var(--success-green)';
        
        setTimeout(() => {
            button.textContent = originalText;
            button.style.background = '';
            button.style.borderColor = '';
            button.style.color = '';
        }, 2000);
    }).catch(err => {
        console.error('複製失敗:', err);
        button.textContent = '❌ 複製失敗';
        setTimeout(() => {
            button.textContent = '📋 複製';
        }, 2000);
    });
}

// 顯示/隱藏解答
function toggleSolution() {
    const solutionSection = document.getElementById('solution');
    const button = document.querySelector('.show-solution-btn');
    
    if (solutionSection.classList.contains('solution-hidden')) {
        solutionSection.classList.remove('solution-hidden');
        button.textContent = '🔒 隱藏解答';
        solutionSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
    } else {
        solutionSection.classList.add('solution-hidden');
        button.textContent = '💡 顯示提示';
    }
}

// 程式碼區塊增強
document.addEventListener('DOMContentLoaded', () => {
    // 為所有程式碼區塊添加複製按鈕
    document.querySelectorAll('pre code').forEach((block) => {
        if (!block.closest('.example-card')) {
            const pre = block.parentElement;
            const wrapper = document.createElement('div');
            wrapper.style.position = 'relative';
            
            const copyBtn = document.createElement('button');
            copyBtn.className = 'copy-btn';
            copyBtn.textContent = '📋 複製';
            copyBtn.style.position = 'absolute';
            copyBtn.style.top = '10px';
            copyBtn.style.right = '10px';
            copyBtn.onclick = function() { copyCode(this); };
            
            pre.parentNode.insertBefore(wrapper, pre);
            wrapper.appendChild(pre);
            wrapper.appendChild(copyBtn);
        }
    });
    
    // 添加行號
    document.querySelectorAll('pre code.language-python').forEach((block) => {
        const lines = block.textContent.split('\n');
        const numberedLines = lines.map((line, index) => {
            if (index < lines.length - 1 || line.trim() !== '') {
                return `<span class="line-number">${index + 1}</span>${line}`;
            }
            return line;
        }).join('\n');
        block.innerHTML = numberedLines;
    });
});

// 進度追蹤
function trackProgress() {
    const lessonId = document.querySelector('.lesson-title').textContent;
    const progress = JSON.parse(localStorage.getItem('apcs-progress') || '{}');
    
    if (!progress[lessonId]) {
        progress[lessonId] = {
            started: new Date().toISOString(),
            completed: false
        };
        localStorage.setItem('apcs-progress', JSON.stringify(progress));
    }
}

// 標記課程完成
function markComplete() {
    const lessonId = document.querySelector('.lesson-title').textContent;
    const progress = JSON.parse(localStorage.getItem('apcs-progress') || '{}');
    
    if (progress[lessonId]) {
        progress[lessonId].completed = true;
        progress[lessonId].completedAt = new Date().toISOString();
        localStorage.setItem('apcs-progress', JSON.stringify(progress));
        
        // 顯示完成動畫
        showCompletionAnimation();
    }
}

function showCompletionAnimation() {
    const badge = document.querySelector('.completion-badge');
    if (badge) {
        badge.style.animation = 'pulse-glow 1s ease-in-out 3';
    }
}

// 鍵盤快捷鍵
document.addEventListener('keydown', (e) => {
    // Alt + 左箭頭：上一課
    if (e.altKey && e.key === 'ArrowLeft') {
        const prevBtn = document.querySelector('.prev-btn');
        if (prevBtn) prevBtn.click();
    }
    
    // Alt + 右箭頭：下一課
    if (e.altKey && e.key === 'ArrowRight') {
        const nextBtn = document.querySelector('.next-btn');
        if (nextBtn) nextBtn.click();
    }
    
    // Alt + H：返回首頁
    if (e.altKey && e.key === 'h') {
        window.location.href = '../index.html';
    }
});

// 滾動進度條
function updateScrollProgress() {
    const winScroll = document.body.scrollTop || document.documentElement.scrollTop;
    const height = document.documentElement.scrollHeight - document.documentElement.clientHeight;
    const scrolled = (winScroll / height) * 100;
    
    let progressBar = document.getElementById('scroll-progress');
    if (!progressBar) {
        progressBar = document.createElement('div');
        progressBar.id = 'scroll-progress';
        progressBar.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: ${scrolled}%;
            height: 3px;
            background: linear-gradient(90deg, var(--energy-cyan), var(--energy-purple));
            z-index: 1000;
            transition: width 0.1s;
        `;
        document.body.appendChild(progressBar);
    } else {
        progressBar.style.width = scrolled + '%';
    }
}

window.addEventListener('scroll', updateScrollProgress);

// 初始化
document.addEventListener('DOMContentLoaded', () => {
    trackProgress();
    updateScrollProgress();
    
    // 檢查是否滾動到底部，自動標記完成
    let hasReachedBottom = false;
    window.addEventListener('scroll', () => {
        const scrollPosition = window.innerHeight + window.pageYOffset;
        const pageHeight = document.documentElement.scrollHeight;
        
        if (scrollPosition >= pageHeight - 100 && !hasReachedBottom) {
            hasReachedBottom = true;
            markComplete();
        }
    });
});

// 代碼執行模擬器（未來功能）
function runCode() {
    // TODO: 整合線上 Python 執行環境
    console.log('代碼執行功能開發中...');
}

// 添加筆記功能
function saveNote(sectionId, note) {
    const notes = JSON.parse(localStorage.getItem('apcs-notes') || '{}');
    const lessonId = document.querySelector('.lesson-title').textContent;
    
    if (!notes[lessonId]) {
        notes[lessonId] = {};
    }
    
    notes[lessonId][sectionId] = {
        content: note,
        timestamp: new Date().toISOString()
    };
    
    localStorage.setItem('apcs-notes', JSON.stringify(notes));
}

// 控制台提示
console.log('%c🚀 APCS 太空探險課程', 'color: #00d9ff; font-size: 20px; font-weight: bold;');
console.log('%c快捷鍵提示:', 'color: #a855f7; font-size: 14px;');
console.log('Alt + ←  : 上一課');
console.log('Alt + →  : 下一課');
console.log('Alt + H  : 返回首頁');
