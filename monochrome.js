/**
 * MINIMALIST MONOCHROME DYNAMIC MOTION SCRIPT
 */

document.addEventListener('DOMContentLoaded', () => {

  // 1. 十字準星游標跟隨器 (Crosshair Cursor)
  const cursor = document.getElementById('crosshair-cursor');
  const cursorLabel = document.getElementById('crosshair-label');

  if (cursor && cursorLabel) {
    window.addEventListener('mousemove', (e) => {
      cursor.style.left = `${e.clientX}px`;
      cursor.style.top = `${e.clientY}px`;

      cursorLabel.style.left = `${e.clientX}px`;
      cursorLabel.style.top = `${e.clientY}px`;
      cursorLabel.textContent = `COORD [${e.clientX},${e.clientY}]`;
    });
  }

  // 2. 滾動觸發：數字累加與線條延伸 (Counter & Rule Fill Animation)
  const skillsSection = document.getElementById('skills');
  let animated = false;

  function checkSkillsScroll() {
    if (animated || !skillsSection) return;
    const rect = skillsSection.getBoundingClientRect();
    if (rect.top < window.innerHeight * 0.8) {
      animated = true;

      // 延伸線條動畫
      document.querySelectorAll('.rule-line-fill').forEach(line => {
        const targetWidth = line.getAttribute('data-width') || '100%';
        line.style.width = targetWidth;
      });

      // 數字累加動畫
      document.querySelectorAll('.counter-num').forEach(counter => {
        const target = parseInt(counter.getAttribute('data-target') || '0', 10);
        let current = 0;
        const duration = 1200;
        const stepTime = 30;
        const stepVal = target / (duration / stepTime);

        const timer = setInterval(() => {
          current += stepVal;
          if (current >= target) {
            current = target;
            clearInterval(timer);
          }
          counter.textContent = Math.floor(current);
        }, stepTime);
      });
    }
  }

  window.addEventListener('scroll', checkSkillsScroll);
  checkSkillsScroll();

  // 3.1 「使用電腦主要習慣」其他選項切換
  const usageSelect = document.getElementById('m-usage');
  const otherUsageGroup = document.getElementById('other-usage-group');
  const otherUsageInput = document.getElementById('m-usage-other');
  
  usageSelect?.addEventListener('change', () => {
    if (usageSelect.value === '其他') {
      if (otherUsageGroup) otherUsageGroup.style.display = 'block';
      if (otherUsageInput) otherUsageInput.required = true;
    } else {
      if (otherUsageGroup) otherUsageGroup.style.display = 'none';
      if (otherUsageInput) {
        otherUsageInput.required = false;
        otherUsageInput.value = '';
      }
    }
  });

  // 3.2 打字程度拉桿數值顯示連動
  const typingSlider = document.getElementById('m-typing');
  const typingBadge = document.getElementById('typing-level-badge');
  const typingLabels = {
    1: '一指神功 🐢',
    2: '需要看鍵盤 ⌨️',
    3: '正常輸入 ⚡',
    4: '盲打練習中 🚀',
    5: '飛速輸入 ☄️'
  };

  typingSlider?.addEventListener('input', () => {
    const val = typingSlider.value;
    if (typingBadge) {
      typingBadge.textContent = `[ ${val}: ${typingLabels[val]} ]`;
    }
  });

  // 3.3 Google Apps Script 直連同步設定
  const WEB_APP_URL = 'https://script.google.com/macros/s/AKfycbx6KKDsk-qNoCaw-03i7enBR6tZLwqZSnEU8n7wpunK2J-f_AlIhmRBR86H4VRqDKnX/exec';

  function directSyncToSpreadsheet(data) {
    if (!WEB_APP_URL) return Promise.reject(new Error('尚未設定同步網址'));
    const params = new URLSearchParams();
    params.append('recordId', data.recordId);
    params.append('timestamp', data.timestamp);
    params.append('name', data.name);
    params.append('classNum', data.classNum);
    params.append('usage', data.usage);
    params.append('tools', data.tools.join(', '));
    params.append('wish', data.wish);

    return fetch(WEB_APP_URL, {
      method: 'POST',
      mode: 'no-cors',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: params.toString()
    });
  }

  function createRecordId(classNum) {
    const normalizedClass = classNum.toUpperCase().replace(/[^0-9A-Z]/g, '').slice(0, 10) || 'STUDENT';
    const randomBytes = new Uint8Array(3);
    crypto.getRandomValues(randomBytes);
    const suffix = Array.from(randomBytes, byte => byte.toString(36).padStart(2, '0')).join('').toUpperCase().slice(0, 6);
    return `2026F-${normalizedClass}-${suffix}`;
  }

  // 3.4 學生玩家通行證表單處理 (Student Login & Player Pass)
  const form = document.getElementById('mono-player-form');
  const passResult = document.getElementById('mono-pass-result');
  const printBtn = document.getElementById('print-mono-btn');
  const downloadBtn = document.getElementById('download-mono-btn');
  const editBtn = document.getElementById('edit-mono-btn');
  const submitBtn = document.getElementById('generate-pass-btn');
  const syncStatus = document.getElementById('sync-status');
  const printablePass = document.getElementById('printable-pass');

  const resName = document.getElementById('res-name');
  const resClass = document.getElementById('res-class');
  const resUsage = document.getElementById('res-usage');
  const resTools = document.getElementById('res-tools');
  const resWish = document.getElementById('res-wish');
  const resRecordId = document.getElementById('res-record-id');
  const passChar = document.getElementById('pass-char');

  function setSyncStatus(message, state) {
    if (!syncStatus) return;
    syncStatus.textContent = message;
    syncStatus.dataset.state = state;
  }

  function renderPass(data) {
    if (resName) resName.textContent = data.name || '--';
    if (resClass) resClass.textContent = data.classNum || '--';
    if (resUsage) resUsage.textContent = data.usage || '--';
    if (resTools) resTools.textContent = data.tools.length > 0 ? data.tools.join(', ') : '自學探索中';
    if (resWish) resWish.textContent = data.wish || '完成專題任務';
    if (resRecordId) resRecordId.textContent = data.recordId || '--';
    
    if (passChar && data.name) {
      passChar.textContent = data.name.charAt(0).toUpperCase();
    }

    if (passResult) passResult.style.display = 'block';
    passResult?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  function loadSavedData() {
    const saved = localStorage.getItem('MONO_PLAYER_PASS_DATA');
    if (saved) {
      try {
        const data = JSON.parse(saved);
        if (!data.recordId && data.classNum) {
          data.recordId = createRecordId(data.classNum);
          localStorage.setItem('MONO_PLAYER_PASS_DATA', JSON.stringify(data));
        }
        renderPass(data);
      } catch (e) {}
    }
  }

  form?.addEventListener('submit', async (e) => {
    e.preventDefault();

    const name = document.getElementById('m-name').value.trim();
    const classNum = document.getElementById('m-class').value.trim();
    const usageVal = usageSelect.value;
    const typingVal = typingSlider ? typingLabels[typingSlider.value] : '正常輸入 ⚡';
    
    // 合併「電腦習慣」與「打字熟練度」送入試算表
    const finalUsage = (usageVal === '其他' && otherUsageInput ? '其他: ' + otherUsageInput.value.trim() : usageVal) + ` (打字: ${typingVal})`;
    const wish = document.getElementById('m-wish').value.trim();

    const tools = [];
    document.querySelectorAll('input[name="m-tools"]:checked').forEach(cb => {
      tools.push(cb.value);
    });

    if (!name || !classNum) {
      alert('請填寫暱稱與班級座號！');
      return;
    }

    let previousData = null;
    try {
      previousData = JSON.parse(localStorage.getItem('MONO_PLAYER_PASS_DATA') || 'null');
    } catch (error) {
      console.warn('Saved player pass data could not be read.', error);
    }
    const recordId = previousData?.classNum === classNum && previousData?.recordId
      ? previousData.recordId
      : createRecordId(classNum);
    const data = { recordId, name, classNum, usage: finalUsage, tools, wish, timestamp: new Date().toISOString() };
    localStorage.setItem('MONO_PLAYER_PASS_DATA', JSON.stringify(data));
    renderPass(data);

    submitBtn.disabled = true;
    submitBtn.setAttribute('aria-busy', 'true');
    setSyncStatus('正在同步課程紀錄…', 'sending');
    try {
      await directSyncToSpreadsheet(data);
      setSyncStatus(`同步請求已送出｜紀錄碼：${recordId}`, 'success');
    } catch (error) {
      console.error('Sync error:', error);
      setSyncStatus('同步未完成，資料仍保存在這台電腦；請稍後再次送出。', 'error');
    } finally {
      submitBtn.disabled = false;
      submitBtn.removeAttribute('aria-busy');
    }
  });

  downloadBtn?.addEventListener('click', async () => {
    const saved = JSON.parse(localStorage.getItem('MONO_PLAYER_PASS_DATA') || 'null');
    if (!saved || !printablePass) return;
    if (typeof html2canvas !== 'function') {
      setSyncStatus('圖片工具載入失敗，請重新整理後再試。', 'error');
      return;
    }

    downloadBtn.disabled = true;
    downloadBtn.setAttribute('aria-busy', 'true');
    setSyncStatus('正在製作 PNG 圖片…', 'sending');
    try {
      const canvas = await html2canvas(printablePass, {
        scale: 2,
        backgroundColor: '#ffffff',
        useCORS: true,
        logging: false
      });
      const link = document.createElement('a');
      const safeClass = saved.classNum.replace(/[^0-9A-Za-z\u4e00-\u9fff]/g, '_');
      link.download = `${safeClass}_PlayerPass_${saved.recordId}.png`;
      link.href = canvas.toDataURL('image/png');
      link.click();
      setSyncStatus(`PNG 已下載｜檔名包含紀錄碼 ${saved.recordId}`, 'success');
    } catch (error) {
      console.error('PNG export error:', error);
      setSyncStatus('PNG 製作失敗，請使用「列印 / 另存 PDF」備用。', 'error');
    } finally {
      downloadBtn.disabled = false;
      downloadBtn.removeAttribute('aria-busy');
    }
  });

  printBtn?.addEventListener('click', () => {
    window.print();
  });

  editBtn?.addEventListener('click', () => {
    if (passResult) passResult.style.display = 'none';
    form?.scrollIntoView({ behavior: 'smooth', block: 'center' });
  });

  loadSavedData();
});
