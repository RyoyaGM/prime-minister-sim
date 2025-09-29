// ===================================
// モデル (Model): ゲーム内のデータ
// ===================================

let game = {
    turn: 1, 
    gameOver: false,
    monthsUntilElection: 48, // 衆議院選挙までの月数（最初は任期満了の48ヶ月）
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

// アクション定義 (ロジックは簡略化しています)
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
            // プレイヤーの活動が与党支持率に影響
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

// ===================================
// ビュー (View): UIの更新
// ===================================

function updateUI() {
    // 議席を常に表示
    house.oppositionSeats = house.totalSeats - house.rulingPartySeats;
    
    // ステータスパネルの更新
    document.getElementById('player-name').textContent = player.name;
    document.getElementById('player-position').textContent = player.position;
    document.getElementById('party-rank').textContent = player.partyRank;
    document.getElementById('funds').textContent = player.funds.toFixed(0);
    document.getElementById('approval').textContent = player.approval.toFixed(1);
    document.getElementById('influence').textContent = player.influence.toFixed(0);
    
    // 国会情報の更新
    document.getElementById('ruling-seats').textContent = house.rulingPartySeats;
    document.getElementById('opposition-seats').textContent = house.oppositionSeats;
    document.getElementById('election-timer').textContent = game.monthsUntilElection;
    document.getElementById('turn-counter').textContent = game.turn;

    // ゲームオーバー判定
    if (player.funds < 0 && player.isElected) {
        endGame("資金が尽き、政治活動が不可能になりました...");
    }
    if (player.approval < 5 && player.isElected) {
        endGame("国民の支持を完全に失い、政治生命が絶たれました...");
    }
    if (!player.isElected) {
        endGame("選挙で議席を失い、浪人となりました...");
    }
}

function displayMessage(text, isEvent = false) {
    const messageArea = document.getElementById('message-area');
    const msgElement = document.createElement('p');
    msgElement.className = 'message';
    
    // イベントメッセージを強調表示
    const prefix = isEvent ? `【速報】` : `[${game.turn}ヶ月目]`;
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

// アクション実行処理
function performAction(actionId) {
    if (game.gameOver) {
        displayMessage("ゲームは終了しました。リロードしてください。", true);
        return;
    }
    
    const action = actions[actionId];
    
    if (player.funds < action.cost) {
        displayMessage(`資金が足りません！ (必要: ${action.cost}万円)`, true);
        return;
    }
    
    const resultMsg = action.effect();
    displayMessage(`[${action.title}] ${resultMsg}`);
    
    nextTurn();
}

// ターン終了処理 (1ヶ月の経過)
function nextTurn() {
    if (game.gameOver) return;

    // 1. 基本的なパラメータ変動
    player.funds -= 20; // 経常経費
    player.approval = Math.max(0, player.approval - 0.5); // 支持率の自然減
    house.rulingPartyApproval = Math.max(10, Math.min(90, house.rulingPartyApproval - 0.1)); // 与党支持率の自然減

    // 2. 選挙までのカウントダウン
    game.monthsUntilElection--;
    
    // 3. 選挙の実施判定
    if (game.monthsUntilElection <= 0) {
        // 任期満了の場合は選挙を実施
        runElection();
        return;
    }

    // 4. 役職昇進のチェック
    checkPromotion();

    // 5. ランダムイベント
    if (Math.random() < 0.1) { // 10%の確率でランダムイベント
        triggerRandomEvent();
    }
    
    game.turn++;
    updateUI();
}

// 衆議院選挙ロジック
function runElection() {
    displayMessage("🔴 **【解散総選挙】** 衆議院の任期満了または解散により、総選挙が実施されます！", true);
    
    // 選挙結果の計算（簡易版）
    // 与党支持率とプレイヤー個人の支持率が結果に影響
    
    let rulingPartyResult = 0;
    
    // 1. 与党支持率による変動
    // ベースライン (50%で現状維持) + 与党支持率
    const baseSeats = house.totalSeats * (house.rulingPartyApproval / 100);
    
    // 2. ランダム要素の追加
    const randomFactor = (Math.random() - 0.5) * 50; // -25から+25程度の変動
    
    rulingPartyResult = Math.round(baseSeats + randomFactor);
    rulingPartyResult = Math.max(100, Math.min(house.totalSeats, rulingPartyResult)); // 極端な結果の制限
    
    // プレイヤー自身の当落判定 (影響力と資金が重要)
    let playerWinChance = (player.approval * 2) + player.influence + (player.funds / 100);
    let playerElected = playerWinChance > 100; // 簡易な閾値判定
    
    // 結果の更新
    house.rulingPartySeats = rulingPartyResult;
    house.oppositionSeats = house.totalSeats - rulingPartyResult;
    game.monthsUntilElection = 48; // 次の選挙までリセット
    game.turn++;

    displayMessage(`🗳 **選挙結果発表:** 新しい議席配分は **与党 ${house.rulingPartySeats} 議席**、**野党 ${house.oppositionSeats} 議席** となりました。`, true);

    // プレイヤーの当落判定
    if (!playerElected) {
        player.isElected = false;
        displayMessage("❌ **残念ながら、あなたは議席を失いました。**", true);
    } else {
        displayMessage("✅ **再選:** あなたは激戦を勝ち抜き、無事に議席を守りました！");
        // 選挙後の党内地位や役職リセット/再編ロジックを将来追加可能
    }

    checkPrimeMinister();
    updateUI();
}


// 昇進判定
function checkPromotion() {
    // 昇進の条件を影響力と資金にリンク
    const currentRank = player.partyRank;

    if (currentRank === "平議員" && player.influence >= 50 && player.approval >= 50) {
        player.partyRank = "副大臣級";
        displayMessage("🎉 **速報:** 副大臣級のポストに抜擢され、党内での発言力が増しました！", true);
    } else if (currentRank === "副大臣級" && player.influence >= 100 && player.approval >= 60) {
        player.partyRank = "大臣級";
        player.position = "内閣官房副長官";
        displayMessage("✨ **大ニュース:** 内閣の要職、内閣官房副長官に就任しました！", true);
    } else if (currentRank === "大臣級" && player.influence >= 150 && house.rulingPartySeats > house.totalSeats / 2) {
        // 首相挑戦の資格獲得
        if (player.position !== "党総裁候補") {
            player.position = "党総裁候補";
            displayMessage("📢 **首相の座へ:** あなたは党内有力候補として総裁選への出馬資格を得ました！");
        }
    }
}

// 首相就任判定（最終目標）
function checkPrimeMinister() {
    // 首相になる条件: 議席を勝ち取った後、党総裁候補であり、与党が過半数を維持している
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
