/**
 * 《新玩家已登入》 - 炫彩酷炫特效與互動腳本
 */

document.addEventListener('DOMContentLoaded', () => {

  // --------------------------------------------------------------------------
  // 1. Web Audio API 未來感微音效系統
  // --------------------------------------------------------------------------
  let soundEnabled = true;
  let audioCtx = null;

  function initAudio() {
    if (!audioCtx) {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      if (AudioContext) audioCtx = new AudioContext();
    }
  }

  function playSynthSound(freq = 440, type = 'sine', duration = 0.12, sweep = false) {
    if (!soundEnabled) return;
    try {
      initAudio();
      if (!audioCtx) return;
      if (audioCtx.state === 'suspended') audioCtx.resume();
      
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.type = type;
      
      const now = audioCtx.currentTime;
      osc.frequency.setValueAtTime(freq, now);
      if (sweep) {
        osc.frequency.exponentialRampToValueAtTime(freq * 1.8, now + duration);
      }

      gain.gain.setValueAtTime(0.06, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + duration);
      
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      
      osc.start(now);
      osc.stop(now + duration);
    } catch (e) {}
  }

  // 音效開關控制
  const soundToggleBtn = document.getElementById('sound-toggle');
  const soundIconOn = document.getElementById('sound-icon-on');
  const soundIconOff = document.getElementById('sound-icon-off');

  soundToggleBtn?.addEventListener('click', () => {
    soundEnabled = !soundEnabled;
    if (soundEnabled) {
      soundIconOn.style.display = 'block';
      soundIconOff.style.display = 'none';
      playSynthSound(600, 'sine', 0.15, true);
    } else {
      soundIconOn.style.display = 'none';
      soundIconOff.style.display = 'block';
    }
  });

  document.querySelectorAll('button, a.btn, input, select').forEach(elem => {
    elem.addEventListener('mouseenter', () => playSynthSound(800, 'sine', 0.04));
    elem.addEventListener('click', () => playSynthSound(520, 'triangle', 0.1, true));
  });

  // --------------------------------------------------------------------------
  // 2. 互動式 Canvas 粒子背景 (Particle Network System)
  // --------------------------------------------------------------------------
  const canvas = document.getElementById('bg-canvas');
  if (canvas) {
    const ctx = canvas.getContext('2d');
    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    window.addEventListener('resize', () => {
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    });

    const particles = [];
    const particleCount = Math.min(Math.floor(window.innerWidth / 18), 70);
    const mouse = { x: null, y: null, radius: 140 };

    window.addEventListener('mousemove', (e) => {
      mouse.x = e.x;
      mouse.y = e.y;
    });

    for (let i = 0; i < particleCount; i++) {
      particles.push({
        x: Math.random() * width,
        y: Math.random() * height,
        vx: (Math.random() - 0.5) * 0.8,
        vy: (Math.random() - 0.5) * 0.8,
        radius: Math.random() * 2 + 1,
        color: Math.random() > 0.5 ? 'rgba(6, 182, 212, ' : 'rgba(168, 85, 247, '
      });
    }

    function animateParticles() {
      ctx.clearRect(0, 0, width, height);

      particles.forEach((p, index) => {
        p.x += p.vx;
        p.y += p.vy;

        if (p.x < 0 || p.x > width) p.vx *= -1;
        if (p.y < 0 || p.y > height) p.vy *= -1;

        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        ctx.fillStyle = p.color + '0.7)';
        ctx.fill();

        // 粒子連線機制
        for (let j = index + 1; j < particles.length; j++) {
          const p2 = particles[j];
          const dx = p.x - p2.x;
          const dy = p.y - p2.y;
          const dist = Math.sqrt(dx * dx + dy * dy);

          if (dist < 110) {
            ctx.beginPath();
            ctx.moveTo(p.x, p.y);
            ctx.lineTo(p2.x, p2.y);
            ctx.strokeStyle = p.color + (1 - dist / 110) * 0.25 + ')';
            ctx.lineWidth = 0.8;
            ctx.stroke();
          }
        }

        // 滑鼠互動牽引
        if (mouse.x && mouse.y) {
          const mdx = p.x - mouse.x;
          const mdy = p.y - mouse.y;
          const mdist = Math.sqrt(mdx * mdx + mdy * mdy);

          if (mdist < mouse.radius) {
            ctx.beginPath();
            ctx.moveTo(p.x, p.y);
            ctx.lineTo(mouse.x, mouse.y);
            ctx.strokeStyle = 'rgba(6, 182, 212, ' + (1 - mdist / mouse.radius) * 0.4 + ')';
            ctx.lineWidth = 1;
            ctx.stroke();
          }
        }
      });

      requestAnimationFrame(animateParticles);
    }
    animateParticles();
  }

  // --------------------------------------------------------------------------
  // 3. 打字機文字效果 (Typewriter Effect)
  // --------------------------------------------------------------------------
  const typewriterSpan = document.getElementById('typewriter-text');
  if (typewriterSpan) {
    const textToType = "曾經是設計師、前端開發者，後來跑進教室，現在正在研究怎麼把資訊課變得比較不像資訊課。";
    let charIdx = 0;

    function typeNextChar() {
      if (charIdx < textToType.length) {
        typewriterSpan.textContent += textToType.charAt(charIdx);
        charIdx++;
        setTimeout(typeNextChar, 45);
      }
    }
    setTimeout(typeNextChar, 600);
  }

  // --------------------------------------------------------------------------
  // 4. 3D 卡片視差傾斜特效 (3D Card Tilt Effect)
  // --------------------------------------------------------------------------
  const tiltCards = document.querySelectorAll('.tilt-element');

  tiltCards.forEach(card => {
    card.addEventListener('mousemove', (e) => {
      const rect = card.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      
      const centerX = rect.width / 2;
      const centerY = rect.height / 2;
      
      const rotateX = (y - centerY) / 12;
      const rotateY = (centerX - x) / 12;

      card.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) translateY(-4px)`;
    });

    card.addEventListener('mouseleave', () => {
      card.style.transform = 'perspective(1000px) rotateX(0deg) rotateY(0deg) translateY(0px)';
    });
  });

  // --------------------------------------------------------------------------
  // 5. 滾動觸發：數字累加與技能進度條 (Counter & Meter Animation)
  // --------------------------------------------------------------------------
  const skillCards = document.querySelectorAll('.skill-card');
  let animatedSkills = false;

  function checkSkillsScroll() {
    if (animatedSkills) return;
    const skillsSection = document.getElementById('act-skills');
    if (!skillsSection) return;

    const rect = skillsSection.getBoundingClientRect();
    if (rect.top < window.innerHeight * 0.8) {
      animatedSkills = true;
      skillCards.forEach(card => {
        const counterNum = card.querySelector('.counter-num');
        const meterFill = card.querySelector('.meter-fill');
        const target = parseInt(counterNum?.getAttribute('data-target') || '0', 10);
        const percent = card.getAttribute('data-percent') || '0';

        // 進度條動畫
        if (meterFill) meterFill.style.width = `${percent}%`;

        // 數字累加動畫
        if (counterNum) {
          let current = 0;
          const duration = 1500;
          const stepTime = 25;
          const stepVal = target / (duration / stepTime);

          const timer = setInterval(() => {
            current += stepVal;
            if (current >= target) {
              current = target;
              clearInterval(timer);
            }
            counterNum.textContent = Math.floor(current);
          }, stepTime);
        }
      });
      playSynthSound(700, 'sine', 0.25, true);
    }
  }

  window.addEventListener('scroll', checkSkillsScroll);
  checkSkillsScroll();

  // --------------------------------------------------------------------------
  // 6. 第六幕：學生資料登入與 Confetti 慶祝爆發粒子
  // --------------------------------------------------------------------------
  const playerForm = document.getElementById('player-form');
  const passWrapper = document.getElementById('player-pass-wrapper');
  const printPassBtn = document.getElementById('print-pass-btn');
  const editPassBtn = document.getElementById('edit-pass-btn');

  const passAvatarInitial = document.getElementById('pass-avatar-initial');
  const passNameVal = document.getElementById('pass-name-val');
  const passClassVal = document.getElementById('pass-class-val');
  const passUsageVal = document.getElementById('pass-usage-val');
  const passToolsVal = document.getElementById('pass-tools-val');
  const passWishVal = document.getElementById('pass-wish-val');

  // Confetti 彩帶爆發粒子
  function triggerConfetti() {
    const confettiCanvas = document.createElement('canvas');
    confettiCanvas.style.position = 'fixed';
    confettiCanvas.style.inset = '0';
    confettiCanvas.style.pointerEvents = 'none';
    confettiCanvas.style.zIndex = '9999';
    document.body.appendChild(confettiCanvas);

    const cCtx = confettiCanvas.getContext('2d');
    confettiCanvas.width = window.innerWidth;
    confettiCanvas.height = window.innerHeight;

    const pieces = [];
    const colors = ['#3B82F6', '#06B6D4', '#A855F7', '#10B981', '#F59E0B'];

    for (let i = 0; i < 90; i++) {
      pieces.push({
        x: window.innerWidth / 2,
        y: window.innerHeight / 2,
        vx: (Math.random() - 0.5) * 16,
        vy: (Math.random() - 0.8) * 14,
        size: Math.random() * 8 + 4,
        color: colors[Math.floor(Math.random() * colors.length)],
        rotation: Math.random() * 360,
        rSpeed: (Math.random() - 0.5) * 10
      });
    }

    let frame = 0;
    function drawConfetti() {
      cCtx.clearRect(0, 0, confettiCanvas.width, confettiCanvas.height);
      pieces.forEach(p => {
        p.x += p.vx;
        p.y += p.vy;
        p.vy += 0.3; // 重力
        p.rotation += p.rSpeed;

        cCtx.save();
        cCtx.translate(p.x, p.y);
        cCtx.rotate((p.rotation * Math.PI) / 180);
        cCtx.fillStyle = p.color;
        cCtx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size);
        cCtx.restore();
      });

      frame++;
      if (frame < 120) {
        requestAnimationFrame(drawConfetti);
      } else {
        document.body.removeChild(confettiCanvas);
      }
    }
    drawConfetti();
  }

  function loadSavedPlayerData() {
    const saved = localStorage.getItem('KWJH_PLAYER_DATA_V2');
    if (saved) {
      try {
        const data = JSON.parse(saved);
        renderPlayerPass(data, false);
      } catch (e) {}
    }
  }

  function renderPlayerPass(data, triggerFx = true) {
    if (passNameVal) passNameVal.textContent = data.name || '玩家';
    if (passClassVal) passClassVal.textContent = data.classNum || '未填寫';
    if (passUsageVal) passUsageVal.textContent = data.usage || '未選擇';
    if (passToolsVal) passToolsVal.textContent = data.tools.length > 0 ? data.tools.join(', ') : '自學探索中';
    if (passWishVal) passWishVal.textContent = data.wish || '完成本學期專題任務';
    
    if (passAvatarInitial && data.name) {
      passAvatarInitial.textContent = data.name.charAt(0).toUpperCase();
    }

    if (passWrapper) passWrapper.style.display = 'block';
    passWrapper?.scrollIntoView({ behavior: 'smooth', block: 'start' });

    if (triggerFx) {
      triggerConfetti();
      playSynthSound(880, 'sine', 0.3, true);
    }
  }

  playerForm?.addEventListener('submit', (e) => {
    e.preventDefault();

    const name = document.getElementById('student-name').value.trim();
    const classNum = document.getElementById('student-class').value.trim();
    const usage = document.getElementById('student-usage').value;
    const wish = document.getElementById('student-wish').value.trim();
    const note = document.getElementById('student-note').value.trim();

    const checkedTools = [];
    document.querySelectorAll('input[name="tools"]:checked').forEach(cb => {
      checkedTools.push(cb.value);
    });

    if (!name || !classNum) {
      alert('請填寫暱稱與班級座號！');
      return;
    }

    const playerData = {
      name,
      classNum,
      usage,
      tools: checkedTools,
      wish,
      note,
      timestamp: new Date().toISOString()
    };

    localStorage.setItem('KWJH_PLAYER_DATA_V2', JSON.stringify(playerData));
    renderPlayerPass(playerData, true);
  });

  printPassBtn?.addEventListener('click', () => {
    window.print();
  });

  editPassBtn?.addEventListener('click', () => {
    if (passWrapper) passWrapper.style.display = 'none';
    playerForm?.scrollIntoView({ behavior: 'smooth', block: 'center' });
  });

  loadSavedPlayerData();
});
