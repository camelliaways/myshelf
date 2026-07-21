/**
 * 《學生數位玩家通行證》 - 駭客任務風格 (Matrix Rain, Direct Auto-Sync & Real-time Updates)
 */

document.addEventListener('DOMContentLoaded', () => {

  // 卓老師的 Google 試算表 ID
  const SPREADSHEET_ID = '1NwiIsZWLTcpm0D0GwMHMKTh1GoB5h66iKooXr0yBLFg';

  // 卓老師專屬部署的 Google Apps Script Web App 端點網址
  const WEB_APP_URL = 'https://script.google.com/macros/s/AKfycbx6KKDsk-qNoCaw-03i7enBR6tZLwqZSnEU8n7wpunK2J-f_AlIhmRBR86H4VRqDKnX/exec';

  // 1. 駭客任務綠色代碼雨 (Matrix Rain Canvas Effect)
  const matrixCanvas = document.getElementById('matrix-canvas');
  if (matrixCanvas) {
    const ctx = matrixCanvas.getContext('2d');
    let width = (matrixCanvas.width = window.innerWidth);
    let height = (matrixCanvas.height = window.innerHeight);

    window.addEventListener('resize', () => {
      width = matrixCanvas.width = window.innerWidth;
      height = matrixCanvas.height = window.innerHeight;
    });

    const characters = 'ｦｱｳｴｵｶｷｹｺｻｼｽｾｿﾀﾂﾃﾅﾆﾇﾈﾊﾋﾎﾏﾐﾑﾒﾓﾔﾕﾗﾘﾜ0123456789ABCDEF<>[]{}/*+=~$_';
    const fontSize = 16;
    const columns = Math.floor(width / fontSize);
    const drops = [];

    for (let i = 0; i < columns; i++) {
      drops[i] = Math.floor(Math.random() * -100);
    }

    function drawMatrixRain() {
      ctx.fillStyle = 'rgba(0, 0, 0, 0.05)';
      ctx.fillRect(0, 0, width, height);

      ctx.fillStyle = '#00FF41';
      ctx.font = `${fontSize}px 'VT323', monospace`;

      for (let i = 0; i < drops.length; i++) {
        const text = characters.charAt(Math.floor(Math.random() * characters.length));
        const x = i * fontSize;
        const y = drops[i] * fontSize;

        if (Math.random() > 0.85) {
          ctx.fillStyle = '#FFFFFF';
        } else {
          ctx.fillStyle = '#00FF41';
        }

        ctx.fillText(text, x, y);

        if (y > height && Math.random() > 0.975) {
          drops[i] = 0;
        }
        drops[i]++;
      }

      requestAnimationFrame(drawMatrixRain);
    }

    drawMatrixRain();
  }

  // 2. 終端機嗶嗶聲微音效 (Terminal Click Audio)
  let audioCtx = null;
  function playTerminalBeep(freq = 800, duration = 0.04) {
    try {
      if (!audioCtx) {
        const AudioContext = window.AudioContext || window.webkitAudioContext;
        if (AudioContext) audioCtx = new AudioContext();
      }
      if (!audioCtx) return;
      if (audioCtx.state === 'suspended') audioCtx.resume();

      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.type = 'square';
      osc.frequency.setValueAtTime(freq, audioCtx.currentTime);

      gain.gain.setValueAtTime(0.03, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + duration);

      osc.connect(gain);
      gain.connect(audioCtx.destination);

      osc.start();
      osc.stop(audioCtx.currentTime + duration);
    } catch (e) {}
  }

  document.querySelectorAll('input, select, button, a').forEach(el => {
    el.addEventListener('focus', () => playTerminalBeep(900, 0.03));
    el.addEventListener('click', () => playTerminalBeep(600, 0.08));
  });

  // 3. 駭客任務 Loading 動畫控制
  const loaderOverlay = document.getElementById('matrix-loader-overlay');
  const progressFill = document.getElementById('matrix-progress-fill');
  const percentText = document.getElementById('matrix-percent-text');
  const skipBtn = document.getElementById('skip-matrix-loader');
  const logItems = document.querySelectorAll('.matrix-terminal-logs .m-log');

  let loaderTimer = null;
  let currentPercent = 0;

  function runMatrixBootLoader(customTitle = null, callback = null) {
    if (!loaderOverlay) return;

    if (customTitle) {
      const loaderTitle = loaderOverlay.querySelector('.loader-title');
      if (loaderTitle) loaderTitle.textContent = customTitle;
    }

    loaderOverlay.style.display = 'flex';
    loaderOverlay.style.opacity = '1';
    loaderOverlay.style.visibility = 'visible';
    currentPercent = 0;
    if (progressFill) progressFill.style.width = '0%';

    logItems.forEach(item => {
      item.classList.remove('active');
      const delay = parseInt(item.getAttribute('data-delay') || '0', 10);
      setTimeout(() => {
        item.classList.add('active');
        playTerminalBeep(400 + delay / 2, 0.03);
      }, delay);
    });

    const totalDuration = 2200;
    const intervalTime = 40;
    const step = 100 / (totalDuration / intervalTime);

    loaderTimer = setInterval(() => {
      currentPercent += step;
      if (currentPercent >= 100) {
        currentPercent = 100;
        clearInterval(loaderTimer);
        setTimeout(() => {
          dismissMatrixLoader();
          if (callback) callback();
        }, 300);
      }
      if (progressFill) progressFill.style.width = `${currentPercent}%`;
      if (percentText) percentText.textContent = Math.floor(currentPercent);
    }, intervalTime);
  }

  function dismissMatrixLoader() {
    if (loaderTimer) clearInterval(loaderTimer);
    if (loaderOverlay) {
      loaderOverlay.style.opacity = '0';
      loaderOverlay.style.visibility = 'hidden';
      setTimeout(() => {
        loaderOverlay.style.display = 'none';
      }, 500);
    }
    playTerminalBeep(1000, 0.15);
  }

  skipBtn?.addEventListener('click', dismissMatrixLoader);
  runMatrixBootLoader();

  // 4. 8 年級 18 個班級 (801~818 班) 切換機制
  const classTabBtns = document.querySelectorAll('.class-tab-btn');
  const classSelect = document.getElementById('p-class-select');
  const seatInput = document.getElementById('p-seat-input');
  const currentClassTag = document.getElementById('current-class-tag');

  classTabBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      const selectedClass = btn.getAttribute('data-class');
      
      classTabBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');

      if (classSelect) {
        classSelect.value = `${selectedClass} 班`;
      }
      if (currentClassTag) {
        currentClassTag.textContent = `ACTIVE_CLASS: ${selectedClass}`;
      }

      playTerminalBeep(700, 0.05);
      updateLivePreview();
    });
  });

  classSelect?.addEventListener('change', () => {
    const val = classSelect.value.replace(' 班', '');
    classTabBtns.forEach(b => {
      if (b.getAttribute('data-class') === val) {
        b.classList.add('active');
        b.scrollIntoView({ behavior: 'smooth', inline: 'center' });
      } else {
        b.classList.remove('active');
      }
    });
    if (currentClassTag) {
      currentClassTag.textContent = `ACTIVE_CLASS: ${val}`;
    }
    updateLivePreview();
  });

  // 5. 表單互動、即時卡片繪製與防爆 URLSearchParams 直連背景自動同步
  const passForm = document.getElementById('student-pass-form');
  const inputName = document.getElementById('p-name');
  const inputUsage = document.getElementById('p-usage');
  const inputWish = document.getElementById('p-wish');
  const toolCheckboxes = document.querySelectorAll('input[name="p-tools"]');

  const cardName = document.getElementById('card-name');
  const cardClass = document.getElementById('card-class');
  const cardUsage = document.getElementById('card-usage');
  const cardTools = document.getElementById('card-tools');
  const cardWish = document.getElementById('card-wish');
  const cardAvatarLetter = document.getElementById('pass-avatar-letter');
  const statusTag = document.getElementById('pass-status-tag');
  const cardActions = document.getElementById('card-actions');

  const generatePassBtn = document.getElementById('generate-pass-btn');
  const printCardBtn = document.getElementById('print-card-btn');
  const resetCardBtn = document.getElementById('reset-card-btn');

  function updateLivePreview() {
    const name = inputName.value.trim() || '--';
    const clsVal = classSelect ? classSelect.value : '801 班';
    const seatVal = seatInput && seatInput.value.trim() ? `${seatInput.value.trim()}號` : '未填座號';
    const classNum = `${clsVal} ${seatVal}`;
    
    const usage = inputUsage.value || '--';
    const wish = inputWish.value.trim() || '--';

    const selectedTools = [];
    toolCheckboxes.forEach(cb => { if (cb.checked) selectedTools.push(cb.value); });

    if (cardName) cardName.textContent = name;
    if (cardClass) cardClass.textContent = classNum;
    if (cardUsage) cardUsage.textContent = usage;
    if (cardTools) cardTools.textContent = selectedTools.length > 0 ? selectedTools.join(', ') : '自學探索中';
    if (cardWish) cardWish.textContent = wish;
    
    if (cardAvatarLetter && name !== '--') {
      cardAvatarLetter.textContent = name.charAt(0).toUpperCase();
    }
  }

  // 採用 100% 防爆相容的 URLSearchParams 跨網域提交 (適用於 localhost, file:// 與任何環境)
  function directSyncToSpreadsheet(data) {
    if (!WEB_APP_URL) return;

    const params = new URLSearchParams();
    params.append('name', data.name);
    params.append('classNum', data.classNum);
    params.append('usage', data.usage);
    params.append('tools', Array.isArray(data.tools) ? data.tools.join(', ') : data.tools);
    params.append('wish', data.wish);

    try {
      fetch(WEB_APP_URL, {
        method: 'POST',
        mode: 'no-cors',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: params.toString()
      }).then(() => {
        console.log('[ MATRIX_SYSTEM ] 成功跨網域發送至試算表！');
      }).catch(err => console.error('Sync error:', err));
    } catch (e) {
      console.error('Fetch error:', e);
    }
  }

  inputName?.addEventListener('input', updateLivePreview);
  seatInput?.addEventListener('input', updateLivePreview);
  inputUsage?.addEventListener('change', updateLivePreview);
  inputWish?.addEventListener('input', updateLivePreview);
  toolCheckboxes.forEach(cb => cb.addEventListener('change', updateLivePreview));

  generatePassBtn?.addEventListener('click', () => {
    const name = inputName.value.trim();
    const seatVal = seatInput.value.trim();

    if (!name || !seatVal) {
      alert('[ ERROR ] 請輸入 CALLSIGN 與 座號！');
      return;
    }

    const selectedTools = [];
    toolCheckboxes.forEach(cb => { if (cb.checked) selectedTools.push(cb.value); });

    const data = {
      name,
      classNum: `${classSelect.value} ${seatVal}號`,
      usage: inputUsage.value,
      tools: selectedTools,
      wish: inputWish.value.trim(),
      spreadsheetId: SPREADSHEET_ID,
      timestamp: new Date().toISOString()
    };

    localStorage.setItem('KWJH_STUDENT_PASS_DATA', JSON.stringify(data));
    directSyncToSpreadsheet(data);

    runMatrixBootLoader('> SYNCING_TO_SPREADSHEET...', () => {
      if (statusTag) {
        statusTag.textContent = '[ STATUS: SAVED & SYNCED ✓ ]';
        statusTag.style.background = 'rgba(0, 255, 65, 0.25)';
      }
      playTerminalBeep(1200, 0.2);
      if (cardActions) cardActions.style.display = 'flex';
      document.getElementById('pass-card')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    });
  });

  printCardBtn?.addEventListener('click', () => {
    window.print();
  });

  resetCardBtn?.addEventListener('click', () => {
    if (cardActions) cardActions.style.display = 'none';
    passForm?.scrollIntoView({ behavior: 'smooth', block: 'center' });
  });

  function loadSavedData() {
    const saved = localStorage.getItem('KWJH_STUDENT_PASS_DATA');
    if (saved) {
      try {
        const data = JSON.parse(saved);
        if (inputName) inputName.value = data.name || '';
        if (inputWish) inputWish.value = data.wish || '';

        if (data.classNum) {
          const matchCls = data.classNum.match(/(8\d\d 班)/);
          const matchSeat = data.classNum.match(/(\d+)號/);
          if (matchCls && classSelect) classSelect.value = matchCls[1];
          if (matchSeat && seatInput) seatInput.value = matchSeat[1];
        }

        if (data.tools && Array.isArray(data.tools)) {
          toolCheckboxes.forEach(cb => {
            cb.checked = data.tools.includes(cb.value);
          });
        }
        updateLivePreview();
        if (cardActions) cardActions.style.display = 'flex';
      } catch (e) {}
    }
  }

  loadSavedData();
});
