# Player Pass Apps Script

目前打字排行榜使用的部署網址：

`https://script.google.com/macros/s/AKfycbx_-OZHwtIXIwLz20hWBMoLD1ffPqyBvzhwCTSf8l4ytAorxBTPljqsmXCkrydGvOIe/exec`

1. 開啟保存學生紀錄的 Google 試算表。
2. 選擇「擴充功能 → Apps Script」。
3. 將 `Code.gs` 全部內容貼入編輯器並儲存。
4. 選擇「部署 → 管理部署作業」，編輯現有網頁應用程式部署。
5. 執行身分選擇「我」，存取權限依學校政策選擇允許學生使用的範圍。
6. 建立新版本並部署；若網址改變，請同步更新 `monochrome.js` 的 `WEB_APP_URL`。
7. 開啟部署網址，看到 `{"success":true,"service":"KWJH Learning Records","version":2}` 後再進行學生測試。

資料工作表：

- `PlayerPassRecords`：學生通行證資料；同一紀錄碼再次送出時更新原列。
- `TypingAttempts`：每次完成的打字挑戰；準確率至少 95% 才會納入公開排行榜。

部署完成後，請測試：

1. 開啟 `部署網址?action=leaderboard&poemId=0`，應看到包含 `players` 與 `classes` 的 JSON。
2. 網站送出成績後會用 `action=score-status` 回查成績編號，只有試算表確實存在該筆資料才顯示同步成功。
3. 在網站完成一次打字挑戰並登記成績。
4. 確認試算表自動建立 `TypingAttempts`，並新增一列。
5. 重新整理遊戲頁面，確認榜單出現課堂暱稱、班級、WPM 與準確率，不會顯示座號。
