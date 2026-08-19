const SHEET_NAME = 'PlayerPassRecords';

function doGet() {
  return jsonResponse_({ success: true, service: 'KWJH Player Pass Sync' });
}

function doPost(e) {
  const lock = LockService.getScriptLock();
  lock.waitLock(10000);

  try {
    const input = e && e.parameter ? e.parameter : {};
    const record = validateRecord_(input);
    const sheet = getOrCreateSheet_();
    upsertRecord_(sheet, record);
    return jsonResponse_({ success: true, recordId: record.recordId });
  } catch (error) {
    return jsonResponse_({ success: false, error: error.message });
  } finally {
    lock.releaseLock();
  }
}

function validateRecord_(input) {
  const clean = value => String(value || '').trim();
  const recordId = clean(input.recordId).slice(0, 40);
  const classNum = clean(input.classNum).slice(0, 20);
  const name = clean(input.name).slice(0, 30);

  if (!/^2026F-[0-9A-Z]+-[0-9A-Z]+$/.test(recordId)) throw new Error('紀錄碼格式不正確');
  if (!classNum || !name) throw new Error('缺少暱稱或班級座號');

  return {
    recordId,
    timestamp: clean(input.timestamp).slice(0, 40),
    classNum,
    name,
    usage: clean(input.usage).slice(0, 120),
    tools: clean(input.tools).slice(0, 300),
    wish: clean(input.wish).slice(0, 200),
    updatedAt: new Date()
  };
}

function getOrCreateSheet_() {
  const spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
  if (!spreadsheet) throw new Error('請將指令碼綁定至 Google 試算表');
  let sheet = spreadsheet.getSheetByName(SHEET_NAME);
  if (!sheet) sheet = spreadsheet.insertSheet(SHEET_NAME);
  if (sheet.getLastRow() === 0) {
    sheet.appendRow(['紀錄碼', '學生送出時間', '班級座號', '課堂暱稱', '電腦習慣與打字程度', '數位探索', '學習願望', '最後更新時間']);
    sheet.setFrozenRows(1);
  }
  return sheet;
}

function upsertRecord_(sheet, record) {
  const lastRow = sheet.getLastRow();
  let targetRow = lastRow + 1;

  if (lastRow > 1) {
    const ids = sheet.getRange(2, 1, lastRow - 1, 1).getDisplayValues().flat();
    const existingIndex = ids.indexOf(record.recordId);
    if (existingIndex >= 0) targetRow = existingIndex + 2;
  }

  sheet.getRange(targetRow, 1, 1, 8).setValues([[
    record.recordId,
    record.timestamp,
    record.classNum,
    record.name,
    record.usage,
    record.tools,
    record.wish,
    record.updatedAt
  ]]);
}

function jsonResponse_(payload) {
  return ContentService
    .createTextOutput(JSON.stringify(payload))
    .setMimeType(ContentService.MimeType.JSON);
}
