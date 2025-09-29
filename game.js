// ===================================
// モデル (Model): ゲーム内のデータ
// ===================================

let game = {
    turn: 1, 
    gameOver: false,
    monthsUntilElection: 48, // 衆議院選挙までの月数
    gameState: 'NORMAL', // 'NORMAL', 'ELECTION'
    electionDay: 0,      // 選挙期間中の経過日数 (1-12)
};

let player = {
    name: "新人議員 A",
    position: "衆議院議員",
    partyRank: "平議員", 
    funds: 500, // 単位: 万円
    approval: 40, // 国民支持率 (%)
    influence: 10, // 党内人脈/影響力
    isElected: true, // 議席を持っているか
};

let house = {
    totalSeats: 465, // 衆議院の総議席数
    rulingPartySeats: 250, // 与党の現在の議席数
    oppositionSeats: 215, // 野党の現在の議席数
    rulingPartyApproval: 55, // 与党全体の支持率（選挙結果に影響）
};

// 通常期間のアクション
const actions = {
    campaign: {
        title: "地元で選挙活動",
        cost: 50,
        effect: () => {
            player.approval += 3;
            player.funds -= 50;
            return "地元での活動が報道され、国民からの注目度が少し上がりました。";
        }
    },
    fundraising: {
        title: "資金調達パーティー",
        cost: 10,
        effect: () => {
            const gain = Math.floor(Math.random() * 200) + 100;
            player.funds += gain;
            player.influence += 1;
            player.funds -= 10;
            return `資金調達に成功し、${gain}万円を獲得。党内での発言力もわずかに向上。`;
        }
    },
    policy: {
        title: "政策立案・勉強会",
        cost: 30,
        effect: () => {
            player.approval += 1;
            player.funds -= 30;
            house.rulingPartyApproval += 0.2; 
            return "今後の国会で役立つ政策案の準備を進めました。与党全体の評価もわずかに向上。";
        }
    },
    faction_meeting: {
        title: "派閥会合に参加",
        cost: 0,
        effect: () => {
            const influenceGain = Math.floor(Math.random() * 5) + 1;
            player.influence += influenceGain;
            player.approval -= 1; 
            return `派閥の会合に出席し、古参議員との交流を深めました。党内影響力が ${influenceGain} 上昇。`;
        }
    }
};

// 選挙期間専用のアクション
const electionActions = {
    stumpSpeech: {
        title: "大衆向け遊説",
        cost: 20,
        effect: () => {
            player.approval += 0.5; // 日単位での効果
            player.funds -= 20;
            return "激戦区で遊説を実施。熱意が有権者に伝わりました。";
        }
    },
    tvDebate: {
        title: "テレビ討論会に出演",
        cost: 100,
        effect: () => {
            player.approval += 1.5;
            player.funds -= 100;
            return "テレビ討論会で競合候補を圧倒！全国的な支持率が大きく向上。";
        }
    }
};


// ===================================
// ビュー (View): UIの更新
// ===================================

function updateUI() {
    // 議席、ステータスパネルの更新
    house.oppositionSeats = house.totalSeats - house.rulingPartySeats;
    document.getElementById('player-name').textContent = player.name;
    document.getElementById('player-position').textContent = player.position;
    document.getElementById('party-rank').textContent = player.partyRank;
    document.getElementById('funds').textContent = player.funds.toFixed(0);
    document.getElementById('approval').textContent = player.approval.toFixed(1);
    document.getElementById('influence').textContent = player.influence.toFixed(0);
    document.getElementById('ruling-seats').textContent = house.rulingPartySeats;
    document.getElementById('opposition-seats').textContent = house.oppositionSeats;
    document.getElementById('turn-counter').textContent = game.turn;

    // 選挙までの表示の切り替え
    const electionTimerElement = document.getElementById('election-timer');
    const nextTurnBtn = document.querySelector('.next-turn-btn');
    const normalActions = document.getElementById('normal-actions');
    const electionActionsDiv = document.getElementById('election-actions');
    const actionTitle = document.getElementById('action-title');

    if (game.gameState === 'ELECTION') {
        electionTimerElement.textContent = `残り ${12 - game.electionDay} 日`;
        nextTurnBtn.textContent = '➡️ 1日経過';
        normalActions.style.display = 'none';
        electionActionsDiv.style.display = 'block';
        actionTitle.textContent = '🗳 選挙期間中のアクション';
    } else {
        electionTimerElement.textContent = `${game.monthsUntilElection} ヶ月`;
        nextTurnBtn.textContent = '➡️ ターン終了（次月へ）';
        normalActions.style.display = 'block';
        electionActionsDiv.style.display = 'none';
        actionTitle.textContent = '⚡ アクションを選択';
    }

    // ゲームオーバー判定
    if (!player.isElected && game.turn > 1) { 
        endGame("選挙で議席を失い、浪人となりました...");
    }
    if (player.funds < 0) {
        endGame("資金が尽き、政治活動が不可能になりました...");
    }
    if (player.approval < 5) {
        endGame("国民の支持を完全に失い、政治生命が絶たれました...");
    }
}

function displayMessage(text, isEvent = false) {
    const messageArea = document.getElementById('message-area');
    const msgElement = document.createElement('p');
    msgElement.className = 'message';
    
    let prefix;
    if (game.gameState === 'ELECTION') {
        prefix = isEvent ? `【速報/E${game.electionDay}日目】` : `[E${game.electionDay}日目]`;
    } else {
        prefix = isEvent ? `【速報】` : `[${game.turn}ヶ月目]`;
    }

    msgElement.innerHTML = `${prefix} ${text}`;
    
    messageArea.prepend(msgElement);
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
    
    displayMessage(`ようこそ、**${player.name}**議員。あなたの首相への道が始まります。衆議院選挙まであと${game.monthsUntilElection}ヶ月です。`);
    updateUI();
}

// 通常期間のアクション実行処理
function performAction(actionId) {
    if (game.gameOver || game.gameState === 'ELECTION') return;
    
    const action = actions[actionId];
    if (player.funds < action.cost) {
        displayMessage(`資金が足りません！ (必要: ${action.cost}万円)`, true);
        return;
    }
    
    const resultMsg = action.effect();
    displayMessage(`[${action.title}] ${resultMsg}`);
    
    // アクションを実行しても、ターン進行は「ターン終了」ボタンを押すまで待つ
}

// 選挙期間のアクション実行処理
function performElectionAction(actionId) {
    if (game.gameOver || game.gameState !== 'ELECTION') return;

    const action = electionActions[actionId];
    if (player.funds < action.cost) {
        displayMessage(`資金が足りません！ (必要: ${action.cost}万円)`, true);
        return;
    }
    
    const resultMsg = action.effect();
    displayMessage(`[${action.title}] ${resultMsg}`);

    // 選挙アクションを実行しても、ターン進行は「1日経過」ボタンを押すまで待つ
}


// ターン終了処理 (メイン関数)
function nextTurn() {
    if (game.gameOver) return;

    if (game.gameState === 'ELECTION') {
        handleElectionDay();
    } else {
        handleNormalTurn();
    }
    updateUI();
}

// 通常ターン（月単位）の処理
function handleNormalTurn() {
    // 1. 基本的なパラメータ変動
    player.funds -= 20; 
    player.approval = Math.max(0, player.approval - 0.5); 
    house.rulingPartyApproval = Math.max(10, Math.min(90, house.rulingPartyApproval - 0.1));

    // 2. 選挙までのカウントダウン
    game.monthsUntilElection--;
    
    // 3. 選挙の実施判定 (月が0になったら選挙フェーズへ移行)
    if (game.monthsUntilElection <= 0) {
        startElectionPhase();
        return;
    }

    // 4. 役職昇進のチェック
    checkPromotion();

    // 5. ランダムイベント
    if (Math.random() < 0.1) { 
        triggerRandomEvent();
    }
    
    game.turn++;
}

// 選挙期間（日単位）の処理
function handleElectionDay() {
    game.electionDay++;
    
    // 1. 資金消費
    player.funds -= 10; 

    // 2. 世論調査の実施
    if (game.electionDay === 3 || game.electionDay === 6 || game.electionDay === 9 || game.electionDay === 12) {
        pollResults();
    }
    
    // 3. 選挙終了判定 (13日目で投票日と集計)
    if (game.electionDay > 12) {
        runElectionResult();
        return;
    }
    
    // UIを更新（日数の変更を即座に反映）
    updateUI();
}

// 選挙期間への移行
function startElectionPhase() {
    game.gameState = 'ELECTION';
    game.electionDay = 0;
    displayMessage("🔴 **【解散総選挙公示】** これから12日間の選挙戦が始まります！積極的に行動し、支持を勝ち取りましょう。", true);
    updateUI();
}

// 世論調査のロジック
function pollResults() {
    const currentApproval = player.approval + (Math.random() * 5 - 2.5); // 誤差
    const currentRulingApproval = house.rulingPartyApproval + (Math.random() * 5 - 2.5);
    
    const expectedSeats = house.totalSeats * (currentRulingApproval / 100);
    
    displayMessage(`📊 **【世論調査】** 選挙期間${game.electionDay}日目`, true);
    displayMessage(`あなたの選挙区の支持率: **約 ${currentApproval.toFixed(1)}%**。`);
    displayMessage(`与党の獲得予想議席: **約 ${Math.round(expectedSeats)}議席**。`, true);
}

// 選挙結果の計算（投票日後）
function runElectionResult() {
    displayMessage("✅ **【投票締め切り】** 開票作業に入ります...", true);
    
    let rulingPartyResult = 0;
    const baseSeats = house.totalSeats * (house.rulingPartyApproval / 100);
    const randomFactor = (Math.random() - 0.5) * 50; 
    
    rulingPartyResult = Math.round(baseSeats + randomFactor);
    rulingPartyResult = Math.max(100, Math.min(house.totalSeats, rulingPartyResult));
    
    // プレイヤー自身の当落判定
    let playerWinChance = (player.approval * 2) + player.influence + (player.funds / 100);
    let playerElected = playerWinChance > 100;
    
    // 結果の更新とフェーズ移行
    house.rulingPartySeats = rulingPartyResult;
    house.oppositionSeats = house.totalSeats - rulingPartyResult;
    game.monthsUntilElection = 48; 
    game.gameState = 'NORMAL'; 

    displayMessage(`🗳 **選挙結果発表:** 新しい議席配分は **与党 ${house.rulingPartySeats} 議席**、**野党 ${house.oppositionSeats} 議席** となりました。`, true);

    if (!playerElected) {
        player.isElected = false;
        displayMessage("❌ **残念ながら、あなたは議席を失いました。** 政治生命は絶たれます。", true);
    } else {
        player.isElected = true;
        displayMessage("✅ **再選:** あなたは激戦を勝ち抜き、無事に議席を守りました！");
    }

    checkPrimeMinister();
    updateUI();
}


// 昇進判定
function checkPromotion() {
    const currentRank = player.partyRank;

    if (currentRank === "平議員" && player.influence >= 50 && player.approval >= 50) {
        player.partyRank = "副大臣級";
        displayMessage("🎉 **速報:** 副大臣級のポストに抜擢され、党内での発言力が増しました！", true);
    } else if (currentRank === "副大臣級" && player.influence >= 100 && player.approval >= 60) {
        player.partyRank = "大臣級";
        player.position = "内閣官房副長官";
        displayMessage("✨ **大ニュース:** 内閣の要職、内閣官房副長官に就任しました！", true);
    } else if (currentRank === "大臣級" && player.influence >= 150 && house.rulingPartySeats > house.totalSeats / 2) {
        if (player.position !== "党総裁候補") {
            player.position = "党総裁候補";
            displayMessage("📢 **首相の座へ:** あなたは党内有力候補として総裁選への出馬資格を得ました！");
        }
    }
}

// 首相就任判定（最終目標）
function checkPrimeMinister() {
    // 首相になる条件: 議席を維持し、党総裁候補であり、与党が過半数を維持している
    if (player.isElected && player.position === "党総裁候補" && house.rulingPartySeats > house.totalSeats / 2) {
        endGame("🏆 **祝！総理大臣就任！** あなたは激しい党内競争と国政選挙を勝ち抜き、ついに日本の首相に就任しました！", true);
    }
}

// ランダムイベント（簡易版）
function triggerRandomEvent() {
    const events = [
        { msg: "野党が不祥事を起こしました。与党支持率が**大幅**に上昇！", effect: () => house.rulingPartyApproval += 5 },
        { msg: "全国的な自然災害が発生。政府の対応が問われます。国民支持率が**低下**。", effect: () => player.approval -= 5 },
        { msg: "海外からの大型投資が決定！景気が上向き、与党支持率が**上昇**。", effect: () => house.rulingPartyApproval += 3 },
    ];
    
    const event = events[Math.floor(Math.random() * events.length)];
    event.effect();
    displayMessage(event.msg, true);
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
