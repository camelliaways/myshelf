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

  // 3. 學生玩家通行證表單處理 (Student Login & Player Pass)
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
    const usage = document.getElementById('m-usage').value;
    const wish = document.getElementById('m-wish').value.trim();

    const tools = [];
    document.querySelectorAll('input[name="m-tools"]:checked').forEach(cb => {
      tools.push(cb.value);
    });

    if (!name || !classNum) {
      alert('請填寫暱稱與班級座號！');
      return;
    }

    const data = { name, classNum, usage, tools, wish, timestamp: new Date().toISOString() };
    localStorage.setItem('MONO_PLAYER_PASS_DATA', JSON.stringify(data));
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
