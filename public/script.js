// ============================================
// Kento Obfuscator - フロントエンド
// ============================================

let currentResult = '';

// ============================================
// 難読化実行
// ============================================
async function obfuscate() {
    const code = document.getElementById('codeInput').value;
    const status = document.getElementById('status');
    const resultBox = document.getElementById('resultBox');
    const resultOutput = document.getElementById('resultOutput');

    if (!code.trim()) {
        status.className = 'status show error';
        status.textContent = '⚠️ コードを入力してください';
        return;
    }

    status.className = 'status show';
    status.textContent = '⏳ 難読化中...';

    try {
        const response = await fetch('/obfuscate', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ code })
        });

        const data = await response.json();

        if (data.success) {
            currentResult = data.obfuscated;
            resultOutput.textContent = data.obfuscated;
            resultBox.classList.add('show');
            status.className = 'status show success';
            status.textContent = '✅ 難読化完了！';
        } else {
            status.className = 'status show error';
            status.textContent = '❌ ' + data.error;
        }
    } catch (e) {
        status.className = 'status show error';
        status.textContent = '❌ エラー: ' + e.message;
    }
}

// ============================================
// 結果操作
// ============================================
function copyResult() {
    if (currentResult) {
        navigator.clipboard.writeText(currentResult);
        const status = document.getElementById('status');
        status.className = 'status show success';
        status.textContent = '✅ コピーしました！';
    }
}

function clearResult() {
    document.getElementById('resultBox').classList.remove('show');
    currentResult = '';
}

function clearAll() {
    document.getElementById('codeInput').value = '';
    document.getElementById('resultBox').classList.remove('show');
    document.getElementById('status').className = 'status';
    currentResult = '';
}

// ============================================
// ショートカット
// ============================================
document.addEventListener('keydown', function(e) {
    if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
        obfuscate();
    }
    if (e.key === 'Escape') {
        clearResult();
    }
});

console.log('🔥 Kento Obfuscator ロード完了');
console.log('💡 Ctrl+Enter で難読化実行');
