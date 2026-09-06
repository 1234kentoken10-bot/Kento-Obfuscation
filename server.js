const express = require('express');
const path = require('path');
const app = express();

app.use(express.json({ limit: '10mb' }));
app.use(express.static('public'));

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.post('/obfuscate', (req, res) => {
    const { code } = req.body;
    if (!code) {
        return res.status(400).json({ error: 'コードが空です' });
    }
    try {
        const obfuscated = obfuscateLua(code);
        res.json({ success: true, obfuscated: obfuscated });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

function obfuscateLua(code) {
    let result = code;
    
    // 1. コメント削除（-- から行末まで）
    result = result.replace(/--.*$/gm, '');
    
    // 2. 連続した空白を1つに
    result = result.replace(/\s+/g, ' ');
    
    // 3. 変数名を短縮（RobloxのAPIは保護！）
    const varMap = {};
    let counter = 0;
    
    // ⚠️ 絶対に変えてはいけないキーワード（RobloxのAPI）
    const protectedKeywords = [
        'game', 'workspace', 'Players', 'LocalPlayer', 'PlayerGui',
        'ReplicatedStorage', 'ServerStorage', 'RunService', 'UserInputService',
        'HttpService', 'TweenService', 'Debris', 'CollectionService',
        'print', 'wait', 'spawn', 'task', 'coroutine', 'pcall', 'xpcall',
        'Vector3', 'CFrame', 'Color3', 'UDim2', 'Instance', 'Enum',
        'string', 'table', 'math', 'os', 'debug', 'type', 'typeof',
        'self', 'super', 'getfenv', 'setfenv', 'require',
        'pairs', 'ipairs', 'next', 'select', 'unpack',
        'tonumber', 'tostring', 'rawget', 'rawset',
        'getmetatable', 'setmetatable', 'rawequal'
    ];
    
    // Luaのキーワードも保護
    const luaKeywords = [
        'local', 'function', 'if', 'then', 'else', 'elseif', 'end',
        'for', 'do', 'while', 'repeat', 'until', 'return', 'break',
        'nil', 'true', 'false', 'and', 'or', 'not', 'in'
    ];
    
    const allProtected = protectedKeywords.concat(luaKeywords);
    
    result = result.replace(/\b([a-zA-Z_][a-zA-Z0-9_]*)\b/g, (match) => {
        // 保護リストに含まれている場合はそのまま
        if (allProtected.includes(match)) return match;
        // 数字だけの場合はそのまま
        if (/^\d+$/.test(match)) return match;
        // 短い変数名はそのまま（_a みたいなやつ）
        if (match.startsWith('_') && match.length <= 3) return match;
        // すでに短縮された変数はそのまま
        if (match.match(/^_[a-zA-Z0-9]$/)) return match;
        
        if (!varMap[match]) {
            // 変数名を短くする（最大2文字）
            const short = '_' + counter.toString(36);
            varMap[match] = short;
            counter++;
        }
        return varMap[match];
    });
    
    // 4. 文字列はそのまま（Robloxが正しく解釈できるように）
    // 文字列のエスケープはしない！
    
    // 5. 余分な空白を削除
    result = result.replace(/\s+/g, ' ');
    
    return result.trim();
}

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`🔥 Kento Obfuscator 起動: http://localhost:${PORT}`);
});
