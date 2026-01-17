const map = {
    "Skill": "技", "Passive": "常時", "Buff": "強化", "Active": "効果中",
    "Select": "印を選択してください。", "NoMoney": "お金が足りません。",
    "Recog": "認識中...", "Input": "入力中...", "Wait": "認識待機中...",
    "Selecting": "選択中:", "Result": "結果",
    "No": "第", "Stage": "戦場", "Sec": "秒",
    "Unrivaled": "天下無双へ", "Next": "次の戦場へ",
    "Instant": "瞬時", "Dot": "秒(Dot)",
    "Slash": "斬", "Stop": "止", "Weak": "弱", "Danger": "危", "Heavy": "重",
    "Ready": "READY", "Win": "勝利", "Lose": "敗北"
};
Object.keys(map).forEach(k => {
    const s = map[k];
    const u = s.split("").map(c => "\\u" + c.charCodeAt(0).toString(16).padStart(4, "0")).join("");
    console.log(`${k}: "${u}" // ${s}`);
});
