// 样例诗库：五言（10字）和七言（14字）句子（无标点）
const poems5 = [
    "床前明月光疑是地上霜",
    "举头望明月低头思故乡",
    "白日依山尽黄河入海流",
    "会当凌绝顶一览众山小"
  ];
  const poems7 = [
    "人生得意须尽欢莫使金樽空对月"
  ];
  
  let answer, answerChars, expectedLen, attempts, seed;
  
  // 去除标点和空格
  function clean(input) {
    return input.replace(/[，。！？；：“”（）【】、《》\\s]/g, '');
  }
  
  // Mulberry32 伪随机生成器
  function mulberry32(a) {
    return function() {
      let t = (a += 0x6D2B79F5) & 0xFFFFFFFF;
      t = Math.imul(t ^ (t >>> 15), t | 1) & 0xFFFFFFFF;
      t ^= t + Math.imul(t ^ (t >>> 7), t) & 0xFFFFFFFF;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }
  
  // Levenshtein 距离计算
  function levenshtein(a, b) {
    const dp = Array.from({ length: a.length + 1 }, () => Array(b.length + 1).fill(0));
    for (let i = 0; i <= a.length; i++) dp[i][0] = i;
    for (let j = 0; j <= b.length; j++) dp[0][j] = j;
    for (let i = 1; i <= a.length; i++) {
      for (let j = 1; j <= b.length; j++) {
        const cost = a[i - 1] === b[j - 1] ? 0 : 1;
        dp[i][j] = Math.min(
          dp[i - 1][j] + 1,
          dp[i][j - 1] + 1,
          dp[i - 1][j - 1] + cost
        );
      }
    }
    return dp[a.length][b.length];
  }
  
  // 开始游戏：读种子、选库、定谜底
  function startGame() {
    attempts = 0;
    const raw = document.getElementById('seedInput').value;
    seed = raw === '' ? Math.floor(Math.random() * 0xFFFFFFFF) : parseInt(raw);
    document.getElementById('seedInput').value = seed;
  
    const rng = mulberry32(seed);
    const pool = rng() < 0.5 ? poems5 : poems7;
    answer = pool[Math.floor(rng() * pool.length)];
    answerChars = answer.split('');
    expectedLen = answerChars.length;
  
    document.getElementById('info').textContent = `种子：${seed}，谜题：${expectedLen} 字诗句`;
    document.getElementById('guesses').innerHTML = '';
    document.getElementById('gameArea').style.display = 'block';
  }
  
  // 提交猜测
  function submitGuess() {
    const raw = document.getElementById('guessInput').value;
    const guessClean = clean(raw);
    const pool = expectedLen === 14 ? poems7 : poems5;
  
    // 1. 长度校验
    if (guessClean.length !== expectedLen) {
      alert(`输入字数不符，需要 ${expectedLen} 字，请重新输入`);
      return;
    }
  
    // 2. 是否在库中
    let guess = guessClean;
    if (!pool.includes(guess)) {
      // 模糊匹配最接近
      const best = pool.reduce((prev, curr) =>
        levenshtein(guess, curr) < levenshtein(guess, prev) ? curr : prev
      );
      if (confirm(`未找到该句，是否使用最接近的：\n${best}`)) {
        guess = best;
      } else {
        return; // 重新输入，不算一次有效猜测
      }
    }
  
    // 3. 有效猜测，累加
    attempts++;
    const row = document.createElement('div');
    row.className = 'guess-row';
    guess.split('').forEach((ch, i) => {
      const box = document.createElement('div');
      box.className = 'char-box';
      box.textContent = ch;
      if (ch === answerChars[i]) box.classList.add('correct');
      else if (answerChars.includes(ch)) box.classList.add('present');
      else box.classList.add('absent');
      row.appendChild(box);
    });
    document.getElementById('guesses').appendChild(row);
  
    // 4. 结果判定
    if (guess === answer) {
      alert('恭喜你猜中答案！');
    } else if (attempts >= 20) {
      alert('次数用尽，答案：' + answer);
    }
  }
  