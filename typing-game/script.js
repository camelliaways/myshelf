/* ==========================================================================
   POETRY LAB // RETRO TYPING CHALLENGE CORE SCRIPT
   ========================================================================== */

document.addEventListener('DOMContentLoaded', () => {

  // 1. 古詩資料庫 (Poetry Database)
  const POEMS = [
    {
      title: "靜夜思",
      author: "李白",
      text: "床前明月光，疑是地上霜。舉頭望明月，低頭思故鄉。"
    },
    {
      title: "登鸛雀樓",
      author: "王之渙",
      text: "白日依山盡，黃河入海流。欲窮千里目，更上一層樓。"
    },
    {
      title: "江雪",
      author: "柳宗元",
      text: "千山鳥飛絕，萬徑人蹤滅。孤舟蓑笠翁，獨釣寒江雪。"
    },
    {
      title: "將進酒 (節選)",
      author: "李白",
      text: "君不見黃河之水天上來，奔流到海不復回。君不見高堂明鏡悲白髮，朝如青絲暮成雪。人生得意須盡歡，莫使金樽空對月。天生我材必有用，千金散盡還復來。"
    },
    {
      title: "琵琶行 (節選 - 魔王關)",
      author: "白居易",
      text: "大絃嘈嘈如急雨，小絃切切如私語。嘈嘈切切錯雜彈，大珠小珠落玉盤。間關鶯語花底滑，幽咽泉流冰下難。冰泉冷澀絃凝絕，凝絕不通聲暫歇。別有幽愁暗恨生，此時無聲勝有聲。"
    }
  ];

  // 2. DOM 節點獲取
  const textDisplay = document.getElementById('text-display');
  const poemTitle = document.getElementById('poem-title');
  const poemAuthor = document.getElementById('poem-author');
  const typingInput = document.getElementById('typing-input');
  const typingZone = document.getElementById('typing-trigger-zone');
  const focusAlert = document.getElementById('focus-alert');
  
  const wpmStat = document.getElementById('stat-wpm');
  const accStat = document.getElementById('stat-acc');
  const comboStat = document.getElementById('stat-combo');
  const timeStat = document.getElementById('stat-time');
  const timeBar = document.getElementById('time-bar');
  
  const resetBtn = document.getElementById('reset-game-btn');
  const toggleSoundBtn = document.getElementById('toggle-sound-btn');
  const levelBtns = document.querySelectorAll('.level-btn');
  const leaderboardRows = document.getElementById('leaderboard-rows');
  
  // 成績 Modal
  const scoreModal = document.getElementById('score-modal');
  const modalWpm = document.getElementById('modal-wpm');
  const modalAcc = document.getElementById('modal-acc');
  const playerNameInput = document.getElementById('player-name');
  const playerClassInput = document.getElementById('player-class');
  const submitScoreBtn = document.getElementById('submit-score-btn');
  const closeModalBtn = document.getElementById('close-modal-btn');

  // Google Apps Script Sync URL
  const WEB_APP_URL = 'https://script.google.com/macros/s/AKfycbx6KKDsk-qNoCaw-03i7enBR6tZLwqZSnEU8n7wpunK2J-f_AlIhmRBR86H4VRqDKnX/exec';

  // 3. 遊戲內部變數
  let currentPoemId = 0;
  let poemChars = []; // 儲存古詩中的中文字元 (排除標點符號的對比用字元，但顯示時保留標點)
  let charElements = []; // 畫面上各個字元的 Span Element
  let currentIndex = 0; // 當前正在打的字元 index
  
  let startTime = null;
  let timerInterval = null;
  let timeLeft = 60.0;
  let totalTimeLimit = 60.0;
  
  let correctCount = 0;
  let mistakeCount = 0;
  let comboCount = 0;
  let soundEnabled = true;
  let isGameOver = false;

  // Web Audio API 鍵盤音效播放器
  let audioCtx = null;
  function initAudio() {
    if (!audioCtx) {
      audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    }
  }

  function playSound(pitch, duration, type = 'sine') {
    if (!soundEnabled) return;
    initAudio();
    if (!audioCtx) return;
    
    try {
      const osc = audioCtx.createOscillator();
      const gainNode = audioCtx.createGain();
      
      osc.type = type;
      osc.frequency.value = pitch;
      
      gainNode.gain.setValueAtTime(0.08, audioCtx.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + duration);
      
      osc.connect(gainNode);
      gainNode.connect(audioCtx.destination);
      
      osc.start();
      osc.stop(audioCtx.currentTime + duration);
    } catch (e) {}
  }

  // 4. 載入並初始化關卡
  function initGame(poemId) {
    clearInterval(timerInterval);
    timerInterval = null;
    startTime = null;
    currentIndex = 0;
    correctCount = 0;
    mistakeCount = 0;
    comboCount = 0;
    isGameOver = false;
    
    currentPoemId = poemId;
    const poem = POEMS[poemId];
    
    // 計算難度給予不同時間
    if (poemId === 3) totalTimeLimit = 120.0; // 將進酒給 120 秒
    else if (poemId === 4) totalTimeLimit = 180.0; // 琵琶行給 180 秒
    else totalTimeLimit = 60.0;
    
    timeLeft = totalTimeLimit;
    
    poemTitle.textContent = poem.title;
    poemAuthor.textContent = `[ 作者: ${poem.author} ]`;
    
    // 渲染文字
    textDisplay.innerHTML = '';
    poemChars = [];
    charElements = [];
    
    // 將詩詞拆分成字元並渲染，保留標點符號
    const chars = Array.from(poem.text);
    chars.forEach((c) => {
      const span = document.createElement('span');
      span.textContent = c;
      
      // 標點符號不列入打字對比，但保留顯示
      if (isPunctuation(c)) {
        span.className = 'char punctuation';
      } else {
        span.className = 'char pending';
        poemChars.push(c);
        charElements.push(span);
      }
      textDisplay.appendChild(span);
    });

    // 標記第一個要輸入的字
    if (charElements.length > 0) {
      charElements[0].classList.add('current');
    }
    
    typingInput.value = '';
    updateHUD();
    loadLeaderboard();
  }

  function isPunctuation(char) {
    const punct = ["，", "。", "、", "；", "：", "？", "！", "（", "）", "(", ")", " "];
    return punct.includes(char);
  }

  // 5. HUD 狀態更新
  function updateHUD() {
    wpmStat.textContent = formatNum(calculateWPM());
    accStat.textContent = `${calculateAcc()}%`;
    comboStat.textContent = formatNum(comboCount);
    timeStat.textContent = `${timeLeft.toFixed(1)}s`;
    
    const pct = Math.max(0, (timeLeft / totalTimeLimit) * 100);
    timeBar.style.width = `${pct}%`;
    if (pct < 25) {
      timeBar.style.backgroundColor = 'var(--retro-error)';
    } else {
      timeBar.style.backgroundColor = 'var(--neon-green)';
    }
  }

  function formatNum(num) {
    if (num < 10) return `0${num}`;
    return num.toString();
  }

  function calculateWPM() {
    if (!startTime) return 0;
    const elapsedMinutes = (Date.now() - startTime) / 60000;
    if (elapsedMinutes <= 0) return 0;
    return Math.round(correctCount / elapsedMinutes);
  }

  function calculateAcc() {
    const total = correctCount + mistakeCount;
    if (total === 0) return 100;
    return Math.round((correctCount / total) * 100);
  }

  // 6. 輸入監聽與邏輯 (支援注音/拼音組字顯示與詞彙整批比對)
  let isComposing = false;

  typingInput.addEventListener('compositionstart', () => {
    isComposing = true;
  });

  typingInput.addEventListener('compositionend', () => {
    isComposing = false;
    // 組字完成後，立即進行比對
    checkInput();
  });

  typingInput.addEventListener('input', () => {
    // 非組字期間的輸入（例如：英文、數字或已確認的中文）
    if (!isComposing) {
      checkInput();
    }
  });

  function checkInput() {
    if (isGameOver) return;
    
    // 第一個字被輸入時啟動計時器
    if (!startTime) {
      startTime = Date.now();
      startTimer();
    }

    const value = typingInput.value;
    if (!value) return;

    let matchedCount = 0;
    
    // 逐字比對輸入框中的字與詩詞字元
    for (let i = 0; i < value.length; i++) {
      const typedChar = value.charAt(i);
      const targetChar = poemChars[currentIndex + matchedCount];
      
      if (targetChar && typedChar === targetChar) {
        charElements[currentIndex + matchedCount].className = 'char correct';
        matchedCount++;
      } else {
        break; // 一旦不符合就停止比對
      }
    }

    if (matchedCount > 0) {
      // 成功打對字
      playSound(780, 0.06); // 清脆鍵盤音
      correctCount += matchedCount;
      comboCount += matchedCount;

      // 移除輸入框中已打對的字
      typingInput.value = value.substring(matchedCount);

      // 移動到下一個字元
      if (charElements[currentIndex]) {
        charElements[currentIndex].classList.remove('current');
      }
      
      currentIndex += matchedCount;
      
      if (currentIndex < poemChars.length) {
        charElements[currentIndex].classList.add('current');
      } else {
        // 完成整首詩！
        endGame(true);
      }
    } else {
      // 如果輸入框已經有完整中文字，但卻與目標字不符（打錯字）
      const trimmed = value.trim();
      if (trimmed.length > 0 && !isComposing) {
        playSound(140, 0.15, 'sawtooth'); // 低沉錯誤音
        charElements[currentIndex].classList.add('incorrect');
        setTimeout(() => {
          if (charElements[currentIndex]) {
            charElements[currentIndex].classList.remove('incorrect');
          }
        }, 300);
        mistakeCount++;
        comboCount = 0; // Combo 中斷
      }
    }

    updateHUD();
  }

  // 7. 計時器與遊戲結束
  function startTimer() {
    timerInterval = setInterval(() => {
      timeLeft -= 0.1;
      if (timeLeft <= 0) {
        timeLeft = 0;
        endGame(false);
      }
      updateHUD();
    }, 100);
  }

  function endGame(isSuccess) {
    clearInterval(timerInterval);
    isGameOver = true;
    
    if (isSuccess) {
      playSound(1000, 0.3);
      // 跳出登記視窗
      modalWpm.textContent = calculateWPM();
      modalAcc.textContent = `${calculateAcc()}%`;
      playerNameInput.value = '';
      
      // 自動載入之前通行證的玩家暱稱與班級
      const saved = localStorage.getItem('MONO_PLAYER_PASS_DATA');
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          playerNameInput.value = parsed.name || '';
          playerClassInput.value = parsed.classNum || '';
        } catch (e) {}
      }

      scoreModal.style.display = 'flex';
    } else {
      playSound(120, 0.6, 'sawtooth');
      alert('系統超載！時間已到，挑戰失敗。請點擊重來再次嘗試！');
    }
  }

  // 8. 本地與雲端排行榜處理 (Leaderboard)
  function loadLeaderboard() {
    const key = `LEADERBOARD_POEM_${currentPoemId}`;
    const data = JSON.parse(localStorage.getItem(key) || '[]');
    
    // 依 WPM 排序
    data.sort((a, b) => b.wpm - a.wpm);
    
    leaderboardRows.innerHTML = '';
    if (data.length === 0) {
      leaderboardRows.innerHTML = '<tr><td colspan="5" style="text-align:center; color:var(--retro-text-muted);">[ 無數據 // NO_DATA ]</td></tr>';
      return;
    }

    data.slice(0, 5).forEach((row, i) => {
      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td>0${i + 1}</td>
        <td>${row.name}</td>
        <td>${row.classNum}</td>
        <td style="color:var(--neon-green); font-weight:700;">${row.wpm}</td>
        <td>${row.acc}%</td>
      `;
      leaderboardRows.appendChild(tr);
    });
  }

  // 儲存至本地排行
  function saveLocalScore(name, classNum, wpm, acc) {
    const key = `LEADERBOARD_POEM_${currentPoemId}`;
    const data = JSON.parse(localStorage.getItem(key) || '[]');
    
    data.push({ name, classNum, wpm, acc, timestamp: new Date().toISOString() });
    localStorage.setItem(key, JSON.stringify(data));
    loadLeaderboard();
  }

  // 背景非同步發送至 Google 試算表（整合紀錄學生的打字進度）
  function syncScoreToGoogleSheets(name, classNum, wpm, acc) {
    if (!WEB_APP_URL) return;
    
    const params = new URLSearchParams();
    params.append('name', name);
    params.append('classNum', classNum);
    // 將打字關卡成績併入使用習慣與作業中發送
    params.append('usage', `打字挑戰《${POEMS[currentPoemId].title}》: ${wpm} WPM (準確度: ${acc}%)`);
    params.append('tools', 'Poetry Lab 打字遊戲');
    params.append('wish', `成功解鎖打字挑戰！`);

    fetch(WEB_APP_URL, {
      method: 'POST',
      mode: 'no-cors',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: params.toString()
    }).catch(err => console.error('Cloud Sync Error:', err));
  }

  // 9. 事件綁定
  // 點擊打字區域時聚焦輸入框
  typingZone.addEventListener('click', () => {
    typingInput.focus();
    focusAlert.style.display = 'none';
    initAudio();
  });

  typingInput.addEventListener('blur', () => {
    if (!isGameOver) {
      focusAlert.style.display = 'flex';
    }
  });

  // 關卡切換
  levelBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      levelBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      const poemId = parseInt(btn.getAttribute('data-id'), 10);
      initGame(poemId);
      typingInput.focus();
    });
  });

  // 重玩
  resetBtn.addEventListener('click', () => {
    initGame(currentPoemId);
    typingInput.focus();
  });

  // 音效開關
  toggleSoundBtn.addEventListener('click', () => {
    soundEnabled = !soundEnabled;
    toggleSoundBtn.textContent = soundEnabled ? '[ 🔊 SOUND: ON ]' : '[ 🔇 SOUND: OFF ]';
    typingInput.focus();
  });

  // 關閉 Modal
  closeModalBtn.addEventListener('click', () => {
    scoreModal.style.display = 'none';
  });

  // 登記送出
  submitScoreBtn.addEventListener('click', () => {
    const name = playerNameInput.value.trim();
    const classNum = playerClassInput.value.trim();
    const wpm = calculateWPM();
    const acc = calculateAcc();

    if (!name || !classNum) {
      alert('請填寫呼號與班級！');
      return;
    }

    // 儲存並同步
    saveLocalScore(name, classNum, wpm, acc);
    syncScoreToGoogleSheets(name, classNum, wpm, acc);
    
    scoreModal.style.display = 'none';
    alert('挑戰紀錄已登錄！');
  });

  // 啟動遊戲
  initGame(0);
});
