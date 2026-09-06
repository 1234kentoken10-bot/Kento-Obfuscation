const express = require('express');
const path = require('path');
const app = express();

app.use(express.json({ limit: '10mb' }));
app.use(express.static('public'));

// ============================================
// トップページ
// ============================================
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// ============================================
// 難読化API（POST）
// ============================================
app.post('/obfuscate', (req, res) => {
    const { code } = req.body;
    
    if (!code) {
        return res.status(400).json({ error: 'コードが空です' });
    }

    try {
        const obfuscated = obfuscateLua(code);
        res.json({
            success: true,
            original: code,
            obfuscated: obfuscated
        });
    } catch (error) {
        res.status(500).json({ 
            error: '難読化に失敗しました: ' + error.message 
        });
    }
});

// ============================================
// 難読化エンジン（サーバーサイド）
// ============================================
function obfuscateLua(code) {
    let result = code;
    
    // 1. コメント削除（-- から行末まで）
    result = result.replace(/--.*$/gm, '');
    
    // 2. 連続した空白を1つに
    result = result.replace(/\s+/g, ' ');
    
    // 3. 変数名を短縮
    const varMap = {};
    let counter = 0;
    const keywords = [
        'local', 'function', 'if', 'then', 'else', 'elseif', 'end',
        'for', 'do', 'while', 'repeat', 'until', 'return', 'break',
        'nil', 'true', 'false', 'and', 'or', 'not', 'in',
        'self', 'super', 'typeof', 'print', 'wait', 'spawn',
        'game', 'workspace', 'script', 'Players', 'ReplicatedStorage',
        'require', 'getfenv', 'setfenv', 'pairs', 'ipairs', 'next',
        'select', 'unpack', 'tonumber', 'tostring', 'type', 'rawget',
        'rawset', 'rawequal', 'getmetatable', 'setmetatable'
    ];
    
    result = result.replace(/\b([a-zA-Z_][a-zA-Z0-9_]*)\b/g, (match) => {
        if (keywords.includes(match)) return match;
        if (/^\d+$/.test(match)) return match;
        if (match.startsWith('_') && match.length <= 3) return match;
        
        if (!varMap[match]) {
            varMap[match] = '_' + counter.toString(36);
            counter++;
        }
        return varMap[match];
    });
    
    // 4. 文字列をエスケープ（強化版）
    result = result.replace(/"(.*?)"/g, (match, str) => {
        return '"' + str.split('').map(c => {
            const code = c.charCodeAt(0);
            return '\\' + code.toString(8);
        }).join('') + '"';
    });
    
    // 5. 文字列をエスケープ（シングルクォート）
    result = result.replace(/'(.*?)'/g, (match, str) => {
        return "'" + str.split('').map(c => {
            const code = c.charCodeAt(0);
            return '\\' + code.toString(8);
        }).join('') + "'";
    });
    
    // 6. 余分な空白を削除
    result = result.replace(/\s+/g, ' ');
    
    return result.trim();
}

// ============================================
// サーバー起動
// ============================================
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`🔥 Kento Obfuscator 起動: http://localhost:${PORT}`);
});
