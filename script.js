let poems5 = [], poems7 = [];
let poemsLoaded = false;

let answer, answerChars, expectedLen, attempts, seed;

function clean(input) {
  return input.replace(/[，。！？；：“”（）【】、《》\s]/g, '');
}

// 加载题库函数：只加载一次
async function loadPoems() {
  if (poemsLoaded) return;  // 如果已经加载过，则直接返回
  try {
    const [res5, res7] = await Promise.all([
      fetch('poems5.txt'),
      fetch('poems7.txt')
    ]);
    poems5 = (await res5.text()).split('\n').map(l => l.trim()).filter(l => l.length === 10);
    poems7 = (await res7.text()).split('\n').map(l => l.trim()).filter(l => l.length === 14);
    poemsLoaded = true;
    console.log("题库加载完成");
  } catch (err) {
    alert("加载题库失败：" + err);
  }
}

window.onload = loadPoems;

function startGame() {
  if (!poemsLoaded) {
    alert("题库尚未加载完成，请稍候再试。");
    return;
  }

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

function submitGuess() {
  const raw = document.getElementById('guessInput').value;
  const guessClean = clean(raw);
  const pool = expectedLen === 14 ? poems7 : poems5;

  if (guessClean.length !== expectedLen) {
    alert(`输入字数不符，需要 ${expectedLen} 字，请重新输入`);
    return;
  }

  let guess = guessClean;
  if (!pool.includes(guess)) {
    const best = pool.reduce((prev, curr) =>
      levenshtein(guess, curr) < levenshtein(guess, prev) ? curr : prev
    );
    if (confirm(`未找到该句，是否使用最接近的：\n${best}`)) {
      guess = best;
    } else {
      return;
    }
  }

  attempts++;
  const row = document.createElement('div'); row.className = 'guess-row';
  guess.split('').forEach((ch, i) => {
    const box = document.createElement('div');
    box.className = 'char-box'; box.textContent = ch;
    if (ch === answerChars[i]) box.classList.add('correct');
    else if (answerChars.includes(ch)) box.classList.add('present');
    else box.classList.add('absent');
    row.appendChild(box);
  });
  document.getElementById('guesses').appendChild(row);

  if (guess === answer) {
    alert('恭喜你猜中答案！');
  } else if (attempts >= 20) {
    alert('次数用尽，答案：' + answer);
  }
}

function mulberry32(a) {
  return function() {
    let t = (a += 0x6D2B79F5) & 0xFFFFFFFF;
    t = Math.imul(t ^ (t >>> 15), t | 1) & 0xFFFFFFFF;
    t ^= t + Math.imul(t ^ (t >>> 7), t) & 0xFFFFFFFF;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

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
