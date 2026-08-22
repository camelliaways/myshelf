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
  const editPlayerBtn = document.getElementById('edit-player-btn');
  const soundModeSelect = document.getElementById('sound-mode-select');
  const levelBtns = document.querySelectorAll('.level-btn');
  const leaderboardRows = document.getElementById('leaderboard-rows');
  
  // 排行榜控制與切換元素
  const leaderboardContainer = document.getElementById('leaderboard-container');
  const tabAllGrade = document.getElementById('tab-all-grade');
  const tabClassOnly = document.getElementById('tab-class-only');
  const classFilterSelect = document.getElementById('leaderboard-class-select');
  const toggleFullscreenBtn = document.getElementById('toggle-fullscreen-btn');
  const leaderboardStatus = document.getElementById('leaderboard-status');
  
  // 成績 Modal
  const scoreModal = document.getElementById('score-modal');
  const scoreModalTitle = document.getElementById('score-modal-title');
  const scoreModalIntro = document.getElementById('score-modal-intro');
  const scoreStatsSummary = document.getElementById('score-stats-summary');
  const modalWpm = document.getElementById('modal-wpm');
  const modalAcc = document.getElementById('modal-acc');
  const playerNameInput = document.getElementById('player-name');
  const playerClassInput = document.getElementById('player-class');
  const submitScoreBtn = document.getElementById('submit-score-btn');
  const closeModalBtn = document.getElementById('close-modal-btn');
  const scoreSubmitStatus = document.getElementById('score-submit-status');

  // Google Apps Script Sync URL
  const WEB_APP_URL = 'https://script.google.com/macros/s/AKfycbx_-OZHwtIXIwLz20hWBMoLD1ffPqyBvzhwCTSf8l4ytAorxBTPljqsmXCkrydGvOIe/exec';
  const TYPING_PLAYER_PROFILE_KEY = 'TYPING_PLAYER_PROFILE';

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
  let soundMode = 'retro-beep'; // 'retro-beep', 'silent'
  let isGameOver = false;
  let isProfileEditMode = false;

  // Web Audio API 鍵盤音效播放器 (多模音效：支援機械青軸、復古打字機、電子嗶嗶音)
  let audioCtx = null;
  let noiseBuffer = null;
  let masterGain = null;
  const audioBuffers = {}; // 快取解碼後的 AudioBuffer 實體

  // 實體錄音檔位址 (分別對應經典青軸、打字機與叮鈴聲)
  const SOUND_URLS = {
    mech_click: 'https://assets.mixkit.co/active_storage/sfx/2568/2568-84.wav',
    mech_space: 'https://assets.mixkit.co/active_storage/sfx/2568/2568-84.wav',
    
    type_click: 'https://www.soundjay.com/communication/sounds/typewriter-key-1.mp3',
    type_space: 'https://www.soundjay.com/communication/sounds/typewriter-key-space-1.mp3',
    
    bell: 'https://www.soundjay.com/communication/sounds/typewriter-bell-1.mp3'
  };

  function initAudio() {
    if (!audioCtx) {
      audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      createNoiseBuffer();
      masterGain = audioCtx.createGain();
      masterGain.gain.value = 0.72;
      const compressor = audioCtx.createDynamicsCompressor();
      compressor.threshold.value = -18;
      compressor.knee.value = 12;
      compressor.ratio.value = 5;
      compressor.attack.value = 0.002;
      compressor.release.value = 0.12;
      masterGain.connect(compressor);
      compressor.connect(audioCtx.destination);
    }
    if (audioCtx.state === 'suspended') audioCtx.resume();
  }

  // 預先異步加載所有實體音訊檔，以確保打字時「零延遲」發聲
  function preLoadSounds() {
    if (!audioCtx) return;
    
    Object.entries(SOUND_URLS).forEach(([key, url]) => {
      fetch(url)
        .then(response => {
          if (!response.ok) throw new Error("Network response was not ok");
          return response.arrayBuffer();
        })
        .then(arrayBuffer => audioCtx.decodeAudioData(arrayBuffer))
        .then(decodedBuffer => {
          audioBuffers[key] = decodedBuffer;
          console.log(`[ SOUND_SYSTEM ] 音效 ${key} 加載並快取完成！`);
        })
        .catch(err => {
          console.warn(`[ SOUND_SYSTEM ] ${key} 實體檔加載失敗，已備妥合成音作為降級方案。`);
        });
    });
  }

  // 播放實體快取音效
  function playBufferSound(key, rate = 1.0) {
    if (soundMode === 'silent') return;
    initAudio();
    if (!audioCtx) return;

    const buffer = audioBuffers[key];
    if (buffer) {
      try {
        const source = audioCtx.createBufferSource();
        source.buffer = buffer;
        source.playbackRate.value = rate;

        const gainNode = audioCtx.createGain();
        gainNode.gain.value = key === 'bell' ? 0.35 : 0.65; // 調高音效，打起來更帶感

        source.connect(gainNode);
        gainNode.connect(audioCtx.destination);
        source.start(0);
      } catch (e) {
        console.error("Buffer play error:", e);
      }
    } else {
      // 降級方案：若實體錄音檔尚未下載完畢或失敗（例如本地 file:// 測試被跨網域阻擋），使用對應的合成音
      if (key.startsWith('mech_')) {
        playSynthMechanicalClick(key.includes('space'));
      } else if (key.startsWith('type_')) {
        playSynthTypewriterClick(key.includes('space'));
      } else if (key === 'bell') {
        playSynthTypewriterBell();
      }
    }
  }

  // 1. 打字鍵敲擊音效分流
  function playTypewriterClick(isSpace = false, hitCount = 1) {
    if (soundMode === 'silent') return;
    initAudio();
    const burstCount = Math.min(hitCount, 5);
    for (let i = 0; i < burstCount; i++) {
      const time = audioCtx.currentTime + i * 0.032;
      if (soundMode === 'mechanical') playPunchyMechanical(time, isSpace);
      else if (soundMode === 'typewriter') playMetalTypewriter(time, isSpace);
      else if (soundMode === 'retro-beep') playArcadeCombo(time, isSpace);
    }
  }

  // 2. 打錯字音效分流
  function playTypewriterError() {
    if (soundMode === 'silent') return;
    initAudio();
    const now = audioCtx.currentTime;
    playNoiseLayer(now, 310, 1.2, 0.1, 0.055);
    playToneLayer(now, 'triangle', 125, 78, 0.09, 0.085);
  }

  // 3. 通關換行鈴聲分流
  function playTypewriterBell() {
    if (soundMode === 'silent') return;
    initAudio();
    const now = audioCtx.currentTime;
    if (soundMode === 'retro-beep') {
      [523.25, 659.25, 783.99, 1046.5].forEach((frequency, index) => {
        playToneLayer(now + index * 0.055, 'square', frequency, frequency * 0.995, 0.06, 0.13);
      });
    } else {
      playNoiseLayer(now, 820, 1.1, 0.09, 0.07);
      playToneLayer(now + 0.025, 'sine', 2350, 2180, 0.13, 0.42);
      playToneLayer(now + 0.035, 'sine', 1175, 1080, 0.07, 0.32);
      playToneLayer(now + 0.16, 'triangle', 175, 92, 0.1, 0.14);
    }
  }

  // ================= 備用合成音效 (Fallback Synthesizers) =================
  // 用於網路尚未載入完成、離線或直接打開 HTML 檔案 (file://) 的備份，確保每個模式聽起來不同！

  // 建立白噪音 Buffer (複用)
  function createNoiseBuffer() {
    if (!audioCtx) return;
    const bufferSize = audioCtx.sampleRate * 0.1;
    noiseBuffer = audioCtx.createBuffer(1, bufferSize, audioCtx.sampleRate);
    const data = noiseBuffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }
  }

  function playNoiseLayer(time, frequency, q, volume, duration) {
    const source = audioCtx.createBufferSource();
    const filter = audioCtx.createBiquadFilter();
    const gain = audioCtx.createGain();
    source.buffer = noiseBuffer;
    filter.type = 'bandpass';
    filter.frequency.value = frequency;
    filter.Q.value = q;
    gain.gain.setValueAtTime(volume, time);
    gain.gain.exponentialRampToValueAtTime(0.001, time + duration);
    source.connect(filter);
    filter.connect(gain);
    gain.connect(masterGain);
    source.start(time);
    source.stop(time + duration + 0.01);
  }

  function playToneLayer(time, type, startFrequency, endFrequency, volume, duration) {
    const oscillator = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    oscillator.type = type;
    oscillator.frequency.setValueAtTime(startFrequency, time);
    oscillator.frequency.exponentialRampToValueAtTime(endFrequency, time + duration);
    gain.gain.setValueAtTime(volume, time);
    gain.gain.exponentialRampToValueAtTime(0.001, time + duration);
    oscillator.connect(gain);
    gain.connect(masterGain);
    oscillator.start(time);
    oscillator.stop(time + duration + 0.01);
  }

  // 厚實段落軸：短促上蓋聲、低頻觸底及細小回彈。
  function playPunchyMechanical(time, isSpace) {
    const variation = 0.92 + Math.random() * 0.16;
    playNoiseLayer(time, (isSpace ? 620 : 1450) * variation, 1.4, isSpace ? 0.13 : 0.105, 0.026);
    playToneLayer(time, 'triangle', isSpace ? 190 : 330, isSpace ? 105 : 170, isSpace ? 0.12 : 0.075, 0.038);
    playToneLayer(time + 0.009, 'sine', 2100 * variation, 1250 * variation, 0.025, 0.018);
  }

  // 金屬打字機：字槌撞擊、機身共鳴與回彈三層聲響。
  function playMetalTypewriter(time, isSpace) {
    const variation = 0.9 + Math.random() * 0.2;
    playNoiseLayer(time, (isSpace ? 520 : 980) * variation, 1.1, isSpace ? 0.14 : 0.12, 0.032);
    playToneLayer(time, 'triangle', isSpace ? 150 : 240, isSpace ? 85 : 120, isSpace ? 0.13 : 0.09, 0.052);
    playToneLayer(time + 0.004, 'square', 1850 * variation, 920 * variation, 0.026, 0.022);
    playNoiseLayer(time + 0.026, 2600 * variation, 3.5, 0.028, 0.018);
  }

  // 街機連擊：Combo 越高，確認音階越往上推進。
  function playArcadeCombo(time, isSpace) {
    const scale = [0, 3, 5, 7, 10, 12];
    const note = scale[Math.min(scale.length - 1, Math.floor(comboCount / 4))];
    const base = (isSpace ? 150 : 230) * Math.pow(2, note / 12);
    playToneLayer(time, 'square', base * 2.02, base * 1.5, 0.052, 0.045);
    playToneLayer(time, 'triangle', base, base * 0.72, 0.085, 0.065);
    playNoiseLayer(time, 1900, 2.2, 0.025, 0.018);
  }

  // A. 備用「機械鍵盤」合成音：清脆高頻塑膠撞擊 "咔"
  function playSynthMechanicalClick(isSpace = false) {
    try {
      const now = audioCtx.currentTime;
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(isSpace ? 450 : 2200, now); // 高頻點擊音
      
      gain.gain.setValueAtTime(isSpace ? 0.12 : 0.08, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.02);
      
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.start(now);
      osc.stop(now + 0.03);
    } catch(e){}
  }

  // B. 備用「復古打字機」合成音：低重度帶通噪聲 "哐"
  function playSynthTypewriterClick(isSpace = false) {
    try {
      const now = audioCtx.currentTime;
      if (noiseBuffer) {
        const noise = audioCtx.createBufferSource();
        noise.buffer = noiseBuffer;
        const filter = audioCtx.createBiquadFilter();
        filter.type = 'bandpass';
        filter.frequency.value = isSpace ? 350 : 750; // 中低頻重音
        filter.Q.value = 2.0;
        
        const gain = audioCtx.createGain();
        gain.gain.setValueAtTime(isSpace ? 0.22 : 0.16, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.04);
        
        noise.connect(filter);
        filter.connect(gain);
        gain.connect(audioCtx.destination);
        noise.start(now);
        noise.stop(now + 0.05);
      }
    } catch(e){}
  }

  // C. 備用「電子音」合成音：經典方波 beep beep
  function playSynthRetroBeep(isSpace = false) {
    try {
      const now = audioCtx.currentTime;
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.type = 'square'; // 經典 8-bit 方波
      osc.frequency.setValueAtTime(isSpace ? 300 : 580, now);
      
      gain.gain.setValueAtTime(0.04, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.06);
      
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.start(now);
      osc.stop(now + 0.07);
    } catch(e){}
  }

  // D. 備用電子錯誤音
  function playSynthRetroError() {
    try {
      const now = audioCtx.currentTime;
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(100, now);
      gain.gain.setValueAtTime(0.06, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.15);
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.start(now);
      osc.stop(now + 0.16);
    } catch(e){}
  }

  // E. 備用電子通關鈴聲
  function playSynthRetroBell() {
    try {
      const now = audioCtx.currentTime;
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(988, now); // B5 階音
      gain.gain.setValueAtTime(0.12, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.start(now);
      osc.stop(now + 0.4);
    } catch(e){}
  }

  // F. 備用打字機鈴聲
  function playSynthTypewriterBell() {
    try {
      const now = audioCtx.currentTime;
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(2500, now);
      gain.gain.setValueAtTime(0.1, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.5);
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.start(now);
      osc.stop(now + 0.5);
    } catch(e){}
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
    initRealtimeLeaderboardListener();
    
    // 等待 DOM 渲染完畢後對齊輸入游標
    setTimeout(alignInputWithCurrentChar, 50);
  }

  function alignInputWithCurrentChar() {
    if (isGameOver) return;
    const currentChar = charElements[currentIndex];
    if (currentChar && typingInput) {
      // 使用 offsetLeft 與 offsetTop，這兩者是相對於父容器 (#text-display) 的精確相對坐標
      // 如此一來，不管頁面如何滾動，綠色輸入框都絕對不會跑位！
      typingInput.style.left = `${currentChar.offsetLeft + (currentChar.offsetWidth / 2)}px`;
      typingInput.style.top = `${currentChar.offsetTop}px`;
    }
  }

  // 監聽視窗縮放以確保游標位置正確
  window.addEventListener('resize', alignInputWithCurrentChar);

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
      playTypewriterClick(false, matchedCount);
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
        // 游標對齊新字元
        alignInputWithCurrentChar();
      } else {
        // 完成整首詩！
        endGame(true);
      }
    } else {
      // 如果輸入框已經有完整中文字，但卻與目標字不符（打錯字）
      const trimmed = value.trim();
      if (trimmed.length > 0 && !isComposing) {
        playTypewriterError();
        charElements[currentIndex].classList.add('incorrect');
        setTimeout(() => {
          if (charElements[currentIndex]) {
            charElements[currentIndex].classList.remove('incorrect');
          }
        }, 300);
        mistakeCount++;
        comboCount = 0; // Combo 中斷
        // 清空打錯的內容，讓學生重新打
        typingInput.value = '';
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
      isProfileEditMode = false;
      scoreModalTitle.textContent = '[ QUEST_COMPLETED // 任務解鎖成功 ]';
      scoreModalIntro.textContent = '你已成功完成挑戰！請登記你的玩家資料：';
      scoreStatsSummary.style.display = '';
      submitScoreBtn.textContent = '[ 💾 儲存本次成績 ]';
      playTypewriterBell();
      // 跳出登記視窗
      modalWpm.textContent = calculateWPM();
      modalAcc.textContent = `${calculateAcc()}%`;
      // 優先載入主頁通行證；直接進入遊戲時則載入上次在遊戲內儲存的資料。
      let savedProfile = null;
      for (const key of ['MONO_PLAYER_PASS_DATA', TYPING_PLAYER_PROFILE_KEY]) {
        try {
          const parsed = JSON.parse(localStorage.getItem(key) || 'null');
          if (parsed?.name && parsed?.classNum) {
            savedProfile = parsed;
            break;
          }
        } catch (error) {}
      }
      playerNameInput.value = savedProfile?.name || '';
      playerClassInput.value = savedProfile?.classNum || '';

      scoreModal.style.display = 'flex';
      scoreSubmitStatus.textContent = calculateAcc() >= 95 ? '準確率達標，可登錄排行榜。' : '準確率達 95% 才會列入公開排行。';
      scoreSubmitStatus.dataset.state = '';
      playerNameInput.focus();
    } else {
      playTypewriterError();
      alert('系統超載！時間已到，挑戰失敗。請點擊重來再次嘗試！');
    }
  }

  // 8. Google Sheets 雲端排行榜與本地備援
  let activeTab = 'all-grade'; // 'all-grade' 或 'class-only'
  let currentLeaderboardData = [];

  function setLeaderboardStatus(message, state = '') {
    if (!leaderboardStatus) return;
    leaderboardStatus.textContent = message;
    leaderboardStatus.dataset.state = state;
  }

  async function initRealtimeLeaderboardListener() {
    setLeaderboardStatus('[ 正在載入雲端排行榜… ]');
    try {
      const url = new URL(WEB_APP_URL);
      url.searchParams.set('action', 'leaderboard');
      url.searchParams.set('poemId', String(currentPoemId));
      url.searchParams.set('_', String(Date.now()));
      const response = await fetch(url.toString(), { cache: 'no-store' });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const payload = await response.json();
      if (!payload.success || !Array.isArray(payload.players)) throw new Error(payload.error || '排行榜格式不正確');
      currentLeaderboardData = payload.players;
      renderLeaderboardTable(currentLeaderboardData);
      setLeaderboardStatus(`[ 雲端排行榜已更新｜合格紀錄 ${payload.players.length} 筆 ]`, 'success');
    } catch (error) {
      console.warn('Cloud leaderboard unavailable, using local fallback:', error);
      loadLocalStorageLeaderboard();
      setLeaderboardStatus('[ 雲端排行榜尚未啟用｜目前顯示此電腦的暫存紀錄 ]', 'error');
    }
  }

  // 渲染排行榜表格的實體方法
  function renderLeaderboardTable(dataList) {
    leaderboardRows.innerHTML = '';
    
    let filteredData = dataList.filter(item => Number(item.acc) >= 95);
    if (activeTab === 'class-only') {
      const targetClass = classFilterSelect.value;
      filteredData = dataList.filter(item => {
        return item.classCode === targetClass;
      });
    }
    
    if (filteredData.length === 0) {
      leaderboardRows.innerHTML = '<tr><td colspan="5" style="text-align:center; color:var(--retro-text-muted);">[ 無數據 // NO_DATA ]</td></tr>';
      return;
    }
    
    // 廣播大螢幕模式顯示前 10 名，普通模式顯示前 5 名
    const limit = leaderboardContainer.classList.contains('fullscreen-mode') ? 10 : 5;
    
    filteredData.slice(0, limit).forEach((row, i) => {
      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td>0${i + 1}</td>
        <td>${row.name}</td>
        <td>${row.classCode || extractClassCode(row.classNum) || '--'}</td>
        <td style="color:var(--neon-green); font-weight:700; font-size:1.15em;">${row.wpm}</td>
        <td>${row.acc}%</td>
      `;
      leaderboardRows.appendChild(tr);
    });
  }

  // 本地 LocalStorage 備用資料讀取
  function loadLocalStorageLeaderboard() {
    const key = `LEADERBOARD_POEM_${currentPoemId}`;
    try {
      currentLeaderboardData = JSON.parse(localStorage.getItem(key) || '[]');
    } catch (error) {
      currentLeaderboardData = [];
    }
    currentLeaderboardData.sort((a, b) => b.wpm - a.wpm);
    renderLeaderboardTable(currentLeaderboardData);
  }

  function extractClassCode(classValue) {
    const match = String(classValue || '').match(/\b(80[1-9]|81[0-8])\b/);
    return match ? match[1] : '';
  }

  function createScoreId() {
    if (crypto.randomUUID) return crypto.randomUUID();
    return `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
  }

  async function fetchWithTimeout(url, options = {}, timeoutMs = 6000) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs);
    try {
      return await fetch(url, { ...options, signal: controller.signal });
    } finally {
      clearTimeout(timeoutId);
    }
  }

  // 儲存打字成績
  function saveScore(name, classNum, wpm, acc) {
    const classCode = extractClassCode(classNum);
    const scoreItem = {
      name,
      classNum,
      classCode,
      wpm,
      acc,
      timestamp: new Date().toISOString()
    };

    // 1. 寫入本地 LocalStorage (備用)
    const key = `LEADERBOARD_POEM_${currentPoemId}`;
    const localData = JSON.parse(localStorage.getItem(key) || '[]');
    const existingIndex = localData.findIndex(item => item.name === name && item.classNum === classNum);
    if (existingIndex < 0 || wpm > localData[existingIndex].wpm || (wpm === localData[existingIndex].wpm && acc > localData[existingIndex].acc)) {
      if (existingIndex >= 0) localData[existingIndex] = scoreItem;
      else localData.push(scoreItem);
    }
    localStorage.setItem(key, JSON.stringify(localData));
    loadLocalStorageLeaderboard();
  }

  // 每次挑戰都保留教師診斷紀錄；公開榜只讀取準確率 95% 以上的個人最佳成績。
  async function syncScoreToGoogleSheets(name, classNum, wpm, acc) {
    if (!WEB_APP_URL) return Promise.reject(new Error('尚未設定同步網址'));
    const classCode = extractClassCode(classNum);
    if (!classCode) return Promise.reject(new Error('班級格式必須是 801～818'));

    let playerPassId = '';
    try {
      playerPassId = JSON.parse(localStorage.getItem('MONO_PLAYER_PASS_DATA') || 'null')?.recordId || '';
    } catch (error) {}

    const scoreId = createScoreId();
    const params = new URLSearchParams();
    params.append('type', 'typing-score');
    params.append('scoreId', scoreId);
    params.append('playerPassId', playerPassId);
    params.append('timestamp', new Date().toISOString());
    params.append('name', name);
    params.append('classNum', classNum);
    params.append('classCode', classCode);
    params.append('poemId', String(currentPoemId));
    params.append('poemTitle', POEMS[currentPoemId].title);
    params.append('wpm', String(wpm));
    params.append('acc', String(acc));
    params.append('mistakes', String(mistakeCount));
    params.append('correctCount', String(correctCount));
    params.append('durationSeconds', String(startTime ? Math.round((Date.now() - startTime) / 1000) : 0));

    await fetchWithTimeout(WEB_APP_URL, {
      method: 'POST',
      mode: 'no-cors',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: params.toString()
    }, 6000);

    // no-cors 無法讀取 Apps Script 回應；請求成功送出後就先解除介面鎖定。
    return { success: true, queued: true, scoreId };
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

  // 音效選擇切換
  soundModeSelect.addEventListener('change', () => {
    soundMode = soundModeSelect.value;
    typingInput.focus();
  });

  // 關閉 Modal
  closeModalBtn.addEventListener('click', () => {
    scoreModal.style.display = 'none';
    resetBtn.focus();
  });

  // 開始遊戲前也能更換本裝置記住的課堂識別資料，不會送出成績。
  editPlayerBtn.addEventListener('click', () => {
    isProfileEditMode = true;
    let savedProfile = null;
    for (const key of [TYPING_PLAYER_PROFILE_KEY, 'MONO_PLAYER_PASS_DATA']) {
      try {
        const parsed = JSON.parse(localStorage.getItem(key) || 'null');
        if (parsed?.name && parsed?.classNum) {
          savedProfile = parsed;
          break;
        }
      } catch (error) {}
    }
    playerNameInput.value = savedProfile?.name || '';
    playerClassInput.value = savedProfile?.classNum || '';
    scoreModalTitle.textContent = '[ PLAYER_PROFILE // 更換玩家資料 ]';
    scoreModalIntro.textContent = '修改這台電腦記住的課堂暱稱與班級座號；這次不會送出成績。';
    scoreStatsSummary.style.display = 'none';
    submitScoreBtn.textContent = '[ 💾 儲存玩家資料 ]';
    scoreSubmitStatus.textContent = '格式範例：801 15號。';
    scoreSubmitStatus.dataset.state = '';
    scoreModal.style.display = 'flex';
    playerNameInput.focus();
  });

  // 儲存成績與學生在本裝置使用的課堂識別資料。
  async function submitScore() {
    const name = playerNameInput.value.trim();
    const classVal = playerClassInput.value.trim();
    const wpm = calculateWPM();
    const acc = calculateAcc();
    const classCode = extractClassCode(classVal);

    playerNameInput.setAttribute('aria-invalid', String(!name));
    playerClassInput.setAttribute('aria-invalid', String(!classCode));
    const hasValidSeat = /(?:80[1-9]|81[0-8])[^0-9]*([1-9]|[1-4][0-9]|50)號?$/.test(classVal);
    if (!name || !classCode || !hasValidSeat) {
      scoreSubmitStatus.textContent = '請填寫課堂暱稱，班級座號格式需為「801 15號」。';
      scoreSubmitStatus.dataset.state = 'error';
      return;
    }

    localStorage.setItem(TYPING_PLAYER_PROFILE_KEY, JSON.stringify({
      name,
      classNum: classVal,
      updatedAt: new Date().toISOString()
    }));

    if (isProfileEditMode) {
      scoreSubmitStatus.textContent = `已記住 ${classVal}；完成挑戰後會自動帶入。`;
      scoreSubmitStatus.dataset.state = 'success';
      setTimeout(() => {
        scoreModal.style.display = 'none';
        typingInput.focus();
      }, 700);
      return;
    }

    submitScoreBtn.disabled = true;
    submitScoreBtn.setAttribute('aria-busy', 'true');
    scoreSubmitStatus.textContent = '正在保存挑戰紀錄…';
    scoreSubmitStatus.dataset.state = '';
    saveScore(name, classVal, wpm, acc);
    try {
      await syncScoreToGoogleSheets(name, classVal, wpm, acc);
      scoreSubmitStatus.textContent = acc >= 95
        ? '本機已保存，雲端紀錄已送出；符合公開排行資格。'
        : '本機已保存，紀錄已送交教師；準確率未達 95%，不列入公開排行。';
      scoreSubmitStatus.dataset.state = 'success';
      setTimeout(() => {
        scoreModal.style.display = 'none';
        resetBtn.focus();
        initRealtimeLeaderboardListener();
      }, 900);
    } catch (error) {
      console.error('Cloud Sync Error:', error);
      scoreSubmitStatus.textContent = '本機紀錄已保存；雲端連線逾時，請稍後再按一次。';
      scoreSubmitStatus.dataset.state = 'error';
    } finally {
      submitScoreBtn.disabled = false;
      submitScoreBtn.removeAttribute('aria-busy');
    }
  }

  submitScoreBtn.addEventListener('click', submitScore);

  [playerNameInput, playerClassInput].forEach(input => {
    input.addEventListener('keydown', event => {
      if (event.key === 'Enter') {
        event.preventDefault();
        submitScore();
      }
    });
  });

  document.addEventListener('keydown', event => {
    if (event.key === 'Escape' && scoreModal.style.display === 'flex') {
      scoreModal.style.display = 'none';
      resetBtn.focus();
    }
  });

  // 排行榜頁籤切換
  tabAllGrade?.addEventListener('click', () => {
    tabAllGrade.classList.add('active');
    tabClassOnly.classList.remove('active');
    classFilterSelect.style.display = 'none';
    activeTab = 'all-grade';
    renderLeaderboardTable(currentLeaderboardData);
  });

  tabClassOnly?.addEventListener('click', () => {
    tabClassOnly.classList.add('active');
    tabAllGrade.classList.remove('active');
    classFilterSelect.style.display = 'inline-block';
    activeTab = 'class-only';
    renderLeaderboardTable(currentLeaderboardData);
  });

  classFilterSelect?.addEventListener('change', () => {
    renderLeaderboardTable(currentLeaderboardData);
  });

  // 廣播大螢幕模式切換
  toggleFullscreenBtn?.addEventListener('click', () => {
    leaderboardContainer.classList.toggle('fullscreen-mode');
    if (leaderboardContainer.classList.contains('fullscreen-mode')) {
      toggleFullscreenBtn.textContent = '[ ✖️ 關閉大螢幕 ]';
    } else {
      toggleFullscreenBtn.textContent = '[ 📺 投影大螢幕 ]';
    }
    // 重新渲染表格以配合行數上限 (大螢幕顯示 10 筆，小螢幕 5 筆)
    renderLeaderboardTable(currentLeaderboardData);
  });

  // 啟動遊戲
  initGame(0);
});
