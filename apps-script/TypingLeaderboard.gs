const TYPING_SHEET_NAME = 'TypingAttempts';
const TYPING_MIN_ACCURACY = 95;

function typingHandlePost_(p) {
  const score = typingValidateScore_(p);
  const spreadsheet = openWorkbook_();
  const sheet = typingGetOrCreateSheet_(spreadsheet);
  if (sheet.getLastRow() > 1) {
    const found = sheet.getRange(2, 1, sheet.getLastRow() - 1, 1)
      .createTextFinder(score.scoreId).matchEntireCell(true).findNext();
    if (found) return json_({ ok: true, duplicate: true, scoreId: score.scoreId, eligible: score.eligible });
  }
  sheet.appendRow([
    score.scoreId, score.playerPassId, score.timestamp, score.studentKey, score.classCode,
    score.classSeat, score.name, score.poemId, score.poemTitle, score.wpm, score.acc,
    score.mistakes, score.correctCount, score.durationSeconds, score.eligible, new Date()
  ]);
  return json_({ ok: true, duplicate: false, scoreId: score.scoreId, eligible: score.eligible });
}

function typingValidateScore_(p) {
  const scoreId = clean_(p.scoreId, 60);
  const classCode = normalizeClass_(p.classCode);
  const classSeat = clean_(p.classNum, 20);
  const name = clean_(p.name, 20);
  const poemId = Number(p.poemId);
  const wpm = Number(p.wpm);
  const acc = Number(p.acc);
  const seat = normalizeSeat_(classSeat);

  if (!scoreId || !name || !seat) throw new Error('打字成績資料不完整。');
  if (!/^(80[1-9]|81[0-8])$/.test(classCode)) throw new Error('班級必須介於 801～818。');
  if (Number(seat) < 1 || Number(seat) > 50) throw new Error('座號格式不正確。');
  if (!Number.isInteger(poemId) || poemId < 0 || poemId > 4) throw new Error('關卡編號不正確。');
  if (!Number.isFinite(wpm) || wpm < 1 || wpm > 300) throw new Error('打字速度超出合理範圍。');
  if (!Number.isFinite(acc) || acc < 0 || acc > 100) throw new Error('準確率不正確。');

  return {
    scoreId: scoreId,
    playerPassId: clean_(p.playerPassId, 40),
    timestamp: clean_(p.timestamp, 40),
    studentKey: classCode + '-' + seat,
    classCode: classCode,
    classSeat: classCode + ' ' + Number(seat) + '號',
    name: name,
    poemId: poemId,
    poemTitle: clean_(p.poemTitle, 40),
    wpm: Math.round(wpm),
    acc: Math.round(acc),
    mistakes: Math.max(0, Math.round(Number(p.mistakes) || 0)),
    correctCount: Math.max(0, Math.round(Number(p.correctCount) || 0)),
    durationSeconds: Math.max(0, Math.round(Number(p.durationSeconds) || 0)),
    eligible: acc >= TYPING_MIN_ACCURACY
  };
}

function typingGetLeaderboard_(poemId) {
  if (!Number.isInteger(poemId) || poemId < 0 || poemId > 4) throw new Error('關卡編號不正確。');
  const sheet = openWorkbook_().getSheetByName(TYPING_SHEET_NAME);
  if (!sheet || sheet.getLastRow() < 2) return { success: true, poemId: poemId, players: [], classes: [] };

  const rows = sheet.getRange(2, 1, sheet.getLastRow() - 1, 16).getValues();
  const best = {};
  rows.forEach(row => {
    if (Number(row[7]) !== poemId || row[14] !== true) return;
    const candidate = { studentKey: String(row[3]), classCode: String(row[4]), name: String(row[6]), wpm: Number(row[9]), acc: Number(row[10]) };
    const current = best[candidate.studentKey];
    if (!current || candidate.wpm > current.wpm || (candidate.wpm === current.wpm && candidate.acc > current.acc)) best[candidate.studentKey] = candidate;
  });

  const players = Object.values(best).sort((a, b) => b.wpm - a.wpm || b.acc - a.acc);
  const publicPlayers = players.map(item => ({ name: item.name, classCode: item.classCode, wpm: item.wpm, acc: item.acc }));
  const groups = {};
  players.forEach(item => {
    if (!groups[item.classCode]) groups[item.classCode] = [];
    groups[item.classCode].push(item);
  });
  const classes = Object.keys(groups).map(classCode => {
    const items = groups[classCode];
    return {
      classCode: classCode,
      participants: items.length,
      averageWpm: Math.round(items.reduce((sum, item) => sum + item.wpm, 0) / items.length),
      averageAcc: Math.round(items.reduce((sum, item) => sum + item.acc, 0) / items.length)
    };
  }).sort((a, b) => b.averageWpm - a.averageWpm || b.averageAcc - a.averageAcc);
  return { success: true, poemId: poemId, minimumAccuracy: TYPING_MIN_ACCURACY, players: publicPlayers, classes: classes };
}

function typingGetScoreStatus_(scoreId) {
  const cleanId = clean_(scoreId, 60);
  if (!cleanId) return { success: false, found: false, error: '缺少成績編號' };
  const sheet = openWorkbook_().getSheetByName(TYPING_SHEET_NAME);
  if (!sheet || sheet.getLastRow() < 2) return { success: true, found: false };
  const found = sheet.getRange(2, 1, sheet.getLastRow() - 1, 1)
    .createTextFinder(cleanId).matchEntireCell(true).findNext();
  if (!found) return { success: true, found: false };
  const row = sheet.getRange(found.getRow(), 1, 1, 16).getValues()[0];
  return { success: true, found: true, eligible: row[14] === true };
}

function typingGetOrCreateSheet_(spreadsheet) {
  const headers = [
    '成績編號', '通行證編號', '學生送出時間', '學生鍵值', '班級', '班級座號', '課堂暱稱',
    '關卡編號', '詩詞', 'WPM', '準確率', '錯字數', '正確字數', '完成秒數', '符合排行', '伺服器收到時間'
  ];
  const sheet = spreadsheet.getSheetByName(TYPING_SHEET_NAME) || spreadsheet.insertSheet(TYPING_SHEET_NAME);
  if (sheet.getLastRow() === 0) {
    sheet.appendRow(headers);
    sheet.setFrozenRows(1);
    sheet.getRange(1, 1, 1, headers.length).setFontWeight('bold');
  }
  return sheet;
}
