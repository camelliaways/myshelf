const PLAYER_SHEET_NAME = 'PlayerPassRecords';
const SCORE_SHEET_NAME = 'TypingAttempts';
const MIN_RANKING_ACCURACY = 95;

function doGet(e) {
  try {
    const params = e && e.parameter ? e.parameter : {};
    if (params.action === 'leaderboard') {
      return jsonResponse_(getLeaderboard_(Number(params.poemId || 0)));
    }
    if (params.action === 'score-status') {
      return jsonResponse_(getScoreStatus_(cleanText_(params.scoreId, 60)));
    }
    return jsonResponse_({ success: true, service: 'KWJH Learning Records', version: 2 });
  } catch (error) {
    return jsonResponse_({ success: false, error: error.message });
  }
}

function doPost(e) {
  const lock = LockService.getScriptLock();
  lock.waitLock(10000);
  try {
    const input = e && e.parameter ? e.parameter : {};
    if (input.type === 'typing-score') {
      const score = validateTypingScore_(input);
      appendTypingScore_(score);
      return jsonResponse_({ success: true, scoreId: score.scoreId, eligible: score.eligible });
    }

    const record = validatePlayerPass_(input);
    upsertPlayerPass_(record);
    return jsonResponse_({ success: true, recordId: record.recordId });
  } catch (error) {
    return jsonResponse_({ success: false, error: error.message });
  } finally {
    lock.releaseLock();
  }
}

function validatePlayerPass_(input) {
  const recordId = cleanText_(input.recordId, 40);
  const classNum = cleanText_(input.classNum, 20);
  const name = cleanText_(input.name, 30);
  if (!/^2026F-[0-9A-Z]+-[0-9A-Z]+$/.test(recordId)) throw new Error('紀錄碼格式不正確');
  if (!classNum || !name) throw new Error('缺少暱稱或班級座號');
  return {
    recordId: recordId,
    timestamp: cleanText_(input.timestamp, 40),
    classNum: classNum,
    name: name,
    usage: cleanText_(input.usage, 120),
    tools: cleanText_(input.tools, 300),
    wish: cleanText_(input.wish, 200),
    updatedAt: new Date()
  };
}

function validateTypingScore_(input) {
  const scoreId = cleanText_(input.scoreId, 60);
  const classCode = cleanText_(input.classCode, 3);
  const classNum = cleanText_(input.classNum, 20);
  const name = cleanText_(input.name, 20);
  const poemId = Number(input.poemId);
  const wpm = Number(input.wpm);
  const acc = Number(input.acc);
  const mistakes = Number(input.mistakes || 0);
  const correctCount = Number(input.correctCount || 0);
  const durationSeconds = Number(input.durationSeconds || 0);

  if (!scoreId || !name || !classNum) throw new Error('成績資料不完整');
  if (!/^(80[1-9]|81[0-8])$/.test(classCode)) throw new Error('班級必須介於 801～818');
  if (!Number.isInteger(poemId) || poemId < 0 || poemId > 4) throw new Error('關卡編號不正確');
  if (!Number.isFinite(wpm) || wpm < 1 || wpm > 300) throw new Error('打字速度超出合理範圍');
  if (!Number.isFinite(acc) || acc < 0 || acc > 100) throw new Error('準確率不正確');

  const seatMatch = classNum.match(/(\d{1,2})\s*號?\s*$/);
  const seat = seatMatch ? seatMatch[1].padStart(2, '0') : '';
  if (!seat || Number(seat) < 1 || Number(seat) > 50) throw new Error('座號格式不正確');

  return {
    scoreId: scoreId,
    playerPassId: cleanText_(input.playerPassId, 40),
    timestamp: cleanText_(input.timestamp, 40),
    studentKey: classCode + '-' + seat,
    classCode: classCode,
    classNum: classCode + ' ' + Number(seat) + '號',
    name: name,
    poemId: poemId,
    poemTitle: cleanText_(input.poemTitle, 40),
    wpm: Math.round(wpm),
    acc: Math.round(acc),
    mistakes: Math.max(0, Math.round(mistakes)),
    correctCount: Math.max(0, Math.round(correctCount)),
    durationSeconds: Math.max(0, Math.round(durationSeconds)),
    eligible: acc >= MIN_RANKING_ACCURACY,
    receivedAt: new Date()
  };
}

function upsertPlayerPass_(record) {
  const sheet = getOrCreateSheet_(PLAYER_SHEET_NAME, [
    '紀錄碼', '學生送出時間', '班級座號', '課堂暱稱', '電腦習慣與打字程度', '數位探索', '學習願望', '最後更新時間'
  ]);
  const lastRow = sheet.getLastRow();
  let targetRow = lastRow + 1;
  if (lastRow > 1) {
    const ids = sheet.getRange(2, 1, lastRow - 1, 1).getDisplayValues().flat();
    const existingIndex = ids.indexOf(record.recordId);
    if (existingIndex >= 0) targetRow = existingIndex + 2;
  }
  sheet.getRange(targetRow, 1, 1, 8).setValues([[
    record.recordId, record.timestamp, record.classNum, record.name,
    record.usage, record.tools, record.wish, record.updatedAt
  ]]);
}

function appendTypingScore_(score) {
  const sheet = getOrCreateSheet_(SCORE_SHEET_NAME, [
    '成績編號', '通行證編號', '學生送出時間', '學生鍵值', '班級', '班級座號', '課堂暱稱',
    '關卡編號', '詩詞', 'WPM', '準確率', '錯字數', '正確字數', '完成秒數', '符合排行', '伺服器收到時間'
  ]);
  if (sheet.getLastRow() > 1) {
    const ids = sheet.getRange(2, 1, sheet.getLastRow() - 1, 1).getDisplayValues().flat();
    if (ids.indexOf(score.scoreId) >= 0) return;
  }
  sheet.appendRow([
    score.scoreId, score.playerPassId, score.timestamp, score.studentKey, score.classCode, score.classNum,
    score.name, score.poemId, score.poemTitle, score.wpm, score.acc, score.mistakes,
    score.correctCount, score.durationSeconds, score.eligible, score.receivedAt
  ]);
}

function getLeaderboard_(poemId) {
  if (!Number.isInteger(poemId) || poemId < 0 || poemId > 4) throw new Error('關卡編號不正確');
  const spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = spreadsheet && spreadsheet.getSheetByName(SCORE_SHEET_NAME);
  if (!sheet || sheet.getLastRow() < 2) return { success: true, poemId: poemId, players: [], classes: [] };

  const rows = sheet.getRange(2, 1, sheet.getLastRow() - 1, 16).getValues();
  const bestByStudent = {};
  rows.forEach(function(row) {
    if (Number(row[7]) !== poemId || row[14] !== true) return;
    const candidate = {
      studentKey: String(row[3]), classCode: String(row[4]), name: String(row[6]),
      wpm: Number(row[9]), acc: Number(row[10])
    };
    const current = bestByStudent[candidate.studentKey];
    if (!current || candidate.wpm > current.wpm || (candidate.wpm === current.wpm && candidate.acc > current.acc)) {
      bestByStudent[candidate.studentKey] = candidate;
    }
  });

  const players = Object.keys(bestByStudent).map(function(key) { return bestByStudent[key]; });
  players.sort(compareScores_);
  const publicPlayers = players.map(function(player) {
    return { name: player.name, classCode: player.classCode, wpm: player.wpm, acc: player.acc };
  });

  const classGroups = {};
  players.forEach(function(player) {
    if (!classGroups[player.classCode]) classGroups[player.classCode] = [];
    classGroups[player.classCode].push(player);
  });
  const classes = Object.keys(classGroups).map(function(classCode) {
    const entries = classGroups[classCode];
    return {
      classCode: classCode,
      participants: entries.length,
      averageWpm: Math.round(entries.reduce(function(sum, item) { return sum + item.wpm; }, 0) / entries.length),
      averageAcc: Math.round(entries.reduce(function(sum, item) { return sum + item.acc; }, 0) / entries.length)
    };
  }).sort(function(a, b) { return b.averageWpm - a.averageWpm || b.averageAcc - a.averageAcc; });

  return { success: true, poemId: poemId, minimumAccuracy: MIN_RANKING_ACCURACY, players: publicPlayers, classes: classes };
}

function getScoreStatus_(scoreId) {
  if (!scoreId) return { success: false, found: false, error: '缺少成績編號' };
  const spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = spreadsheet && spreadsheet.getSheetByName(SCORE_SHEET_NAME);
  if (!sheet || sheet.getLastRow() < 2) return { success: true, found: false };
  const ids = sheet.getRange(2, 1, sheet.getLastRow() - 1, 1).getDisplayValues().flat();
  const index = ids.indexOf(scoreId);
  if (index < 0) return { success: true, found: false };
  const row = sheet.getRange(index + 2, 1, 1, 16).getValues()[0];
  return { success: true, found: true, eligible: row[14] === true };
}

function compareScores_(a, b) {
  return b.wpm - a.wpm || b.acc - a.acc;
}

function getOrCreateSheet_(sheetName, headers) {
  const spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
  if (!spreadsheet) throw new Error('請將指令碼綁定至 Google 試算表');
  let sheet = spreadsheet.getSheetByName(sheetName);
  if (!sheet) sheet = spreadsheet.insertSheet(sheetName);
  if (sheet.getLastRow() === 0) {
    sheet.appendRow(headers);
    sheet.setFrozenRows(1);
    sheet.getRange(1, 1, 1, headers.length).setFontWeight('bold');
  }
  return sheet;
}

function cleanText_(value, maxLength) {
  let text = String(value || '').trim().replace(/[\u0000-\u001F\u007F]/g, '');
  if (/^[=+\-@]/.test(text)) text = "'" + text;
  return text.slice(0, maxLength);
}

function jsonResponse_(payload) {
  return ContentService.createTextOutput(JSON.stringify(payload)).setMimeType(ContentService.MimeType.JSON);
}
