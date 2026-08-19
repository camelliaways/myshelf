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
    if (!WEB_APP_URL) return;
    const params = new URLSearchParams();
    params.append('name', data.name);
    params.append('classNum', data.classNum);
    params.append('usage', data.usage);
    params.append('tools', data.tools.join(', '));
    params.append('wish', data.wish);

    fetch(WEB_APP_URL, {
      method: 'POST',
      mode: 'no-cors',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: params.toString()
    }).then(() => {
      console.log('[ AUTO_SYNC ] 通行證資料已同步至試算表！');
    }).catch(err => console.error('Sync error:', err));
  }

  // 3.4 學生玩家通行證表單處理 (Student Login & Player Pass)
  const form = document.getElementById('mono-player-form');
  const passResult = document.getElementById('mono-pass-result');
  const printBtn = document.getElementById('print-mono-btn');
  const editBtn = document.getElementById('edit-mono-btn');

  const resName = document.getElementById('res-name');
  const resClass = document.getElementById('res-class');
  const resUsage = document.getElementById('res-usage');
  const resTools = document.getElementById('res-tools');
  const resWish = document.getElementById('res-wish');
  const passChar = document.getElementById('pass-char');

  function renderPass(data) {
    if (resName) resName.textContent = data.name || '--';
    if (resClass) resClass.textContent = data.classNum || '--';
    if (resUsage) resUsage.textContent = data.usage || '--';
    if (resTools) resTools.textContent = data.tools.length > 0 ? data.tools.join(', ') : '自學探索中';
    if (resWish) resWish.textContent = data.wish || '完成專題任務';
    
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
        renderPass(JSON.parse(saved));
      } catch (e) {}
    }
  }

  form?.addEventListener('submit', (e) => {
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

    const data = { name, classNum, usage: finalUsage, tools, wish, timestamp: new Date().toISOString() };
    localStorage.setItem('MONO_PLAYER_PASS_DATA', JSON.stringify(data));
    
    // 動態同步寫入 Google 試算表（支援重複提交覆蓋）
    directSyncToSpreadsheet(data);
    
    renderPass(data);
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
