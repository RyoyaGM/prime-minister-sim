// ===================================
// モデル (Model): ゲーム内のデータ
// ===================================

let game = {
    turn: 1,
    gameOver: false
};

let player = {
    name: "新人議員 A",
    position: "衆議院議員",
    partyRank: "平議員", // 例: 平議員 -> 副大臣 -> 大臣 -> 党役員
    funds: 500, // 単位: 万円
    approval: 40, // 国民支持率 (%)
    influence: 10, // 党内人脈/影響力
};

// アクション定義
const actions = {
    campaign: {
        title: "地元で選挙活動",
        cost: 50, // 万円
        effect: () => {
            player.approval += 3;
            player.funds -= 50;
            return "地元での活動が報道され、国民からの注目度が少し上がりました。";
        }
    },
    fundraising: {
        title: "資金調達パーティー",
        cost: 10, // 開催費用
        effect: () => {
            const gain = Math.floor(Math.random() * 200) + 100; // 100〜300万円
            player.funds += gain;
            player.influence += 1;
            player.funds -= 10;
            return `資金調達に成功し、${gain}万円を獲得しました。党内での発言力もわずかに向上しました。`;
        }
    },
    policy: {
        title: "政策立案・勉強会",
        cost: 30,
        effect: () => {
            player.approval += 1;
            player.funds -= 30;
            return "今後の国会で役立つ政策案の準備を進めました。地味ですが着実な一歩です。";
        }
    },
    faction_meeting: {
        title: "派閥会合に参加",
        cost: 0,
        effect: () => {
            const influenceGain = Math.floor(Math.random() * 5) + 1;
            player.influence += influenceGain;
            player.approval -= 1; // 党内政治に傾注しすぎると国民受けが下がる
            return `派閥の会合に出席し、古参議員との交流を深めました。党内影響力が ${influenceGain} 上昇。`;
        }
    }
};

// ===================================
// ビュー (View): UIの更新
// ===================================

function updateUI() {
    // ステータスパネルの更新
    document.getElementById('player-name').textContent = player.name;
    document.getElementById('player-position').textContent = player.position;
    document.getElementById('party-rank').textContent = player.partyRank;
    document.getElementById('funds').textContent = player.funds.toFixed(0);
    document.getElementById('approval').textContent = player.approval.toFixed(1);
    document.getElementById('influence').textContent = player.influence.toFixed(0);
    document.getElementById('turn-counter').textContent = game.turn;

    // ゲームオーバー判定
    if (player.funds < 0) {
        endGame("資金が尽き、政治活動が不可能になりました...");
    }
    if (player.approval < 10) {
        endGame("国民の支持を完全に失い、失職しました...");
    }
}

function displayMessage(text, isEvent = false) {
    const messageArea = document.getElementById('message-area');
    const msgElement = document.createElement('p');
    msgElement.className = 'message';
    msgElement.textContent = `[${game.turn}ヶ月目] ${text}`;
    
    // メッセージエリアの先頭に追加
    messageArea.prepend(msgElement);
    // 古いメッセージを削除 (例: 20個まで残す)
    while (messageArea.children.length > 20) {
        messageArea.removeChild(messageArea.lastChild);
    }
}

// ===================================
// コントローラー (Controller): ロジック処理
// ===================================

// ゲーム開始時の初期化
function initializeGame() {
    player.name = prompt("あなたの政治家名を入力してください:", "田中太郎");
    if (!player.name) player.name = "田中太郎";
    
    displayMessage(`ようこそ、**${player.name}**議員。あなたの首相への道が始まります。`);
    updateUI();
}

// アクション実行処理
function performAction(actionId) {
    if (game.gameOver) {
        displayMessage("ゲームは終了しました。リロードしてください。");
        return;
    }
    
    const action = actions[actionId];
    
    if (player.funds < action.cost) {
        displayMessage(`資金が足りません！ (必要: ${action.cost}万円)`, true);
        return;
    }
    
    // 効果を適用
    const resultMsg = action.effect();
    displayMessage(`[${action.title}] ${resultMsg}`);
    
    // ターンを消費
    nextTurn();
}

// ターン終了処理 (1ヶ月の経過)
function nextTurn() {
    if (game.gameOver) return;

    // 資金の自然減 (秘書給与や経常経費)
    player.funds -= 20;

    // 支持率の自然減 (何もなければ下がる)
    player.approval = Math.max(0, player.approval - 0.5);

    // 役職昇進のチェック (簡易版)
    checkPromotion();

    game.turn++;
    updateUI();
    
    // 重要なイベント発生のチェック
    if (game.turn % 12 === 0) {
        displayMessage("🚨 **臨時ニュース:** 経済情勢が変化しました。全ての国民支持率に影響があります。", true);
        player.approval += Math.floor(Math.random() * 10) - 5; // ランダムな変動
    }
    
    // 勝利条件のチェック (例: 4年(48ヶ月)経過と影響力)
    if (game.turn >= 48) {
        checkWinCondition();
    }
}

// 昇進判定
function checkPromotion() {
    if (player.position === "衆議院議員") {
        if (player.influence >= 50 && player.approval >= 50 && player.partyRank === "平議員") {
            player.partyRank = "副大臣級";
            displayMessage("🎉 **速報:** あなたは副大臣級のポストに抜擢されました！");
        } else if (player.influence >= 100 && player.approval >= 60 && player.partyRank === "副大臣級") {
            player.partyRank = "大臣級";
            player.position = "内閣官房副長官";
            displayMessage("✨ **大ニュース:** あなたが内閣の要職、内閣官房副長官に就任しました！");
        }
    }
}

// 勝利条件判定
function checkWinCondition() {
    if (player.position === "内閣官房副長官" && player.influence >= 150 && player.funds >= 5000) {
        endGame("🏆 **祝！総理大臣就任！** あなたは熾烈な党内選挙を勝ち抜き、ついに日本の首相に就任しました！", true);
    } else {
        endGame("ゲーム終了。首相の座は遠かったです...次のチャンスを待ちましょう。", false);
    }
}

// ゲームオーバー処理
function endGame(message, isWin = false) {
    game.gameOver = true;
    const endTitle = isWin ? "ゲームクリア！" : "ゲームオーバー";
    displayMessage(`\n--- ${endTitle} ---`);
    displayMessage(message);
    document.getElementById('action-panel').innerHTML = `<h2>${endTitle}</h2><p>${message}</p><button onclick="window.location.reload()">再スタート</button>`;
}

// ページロード時にゲームを開始
window.onload = initializeGame;
