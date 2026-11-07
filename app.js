const STORAGE_KEY = 'lotgen-645-tickets-v1';
const ticketList = document.querySelector('#ticket-list');
const emptyState = document.querySelector('#empty-state');
const generateButton = document.querySelector('#generate-button');
const copyButton = document.querySelector('#copy-button');
const shareButton = document.querySelector('#share-button');
const resetButton = document.querySelector('#reset-button');
const copyStatus = document.querySelector('#copy-status');
const setCount = document.querySelector('#set-count');
const winningForm = document.querySelector('#winning-form');
const formError = document.querySelector('#form-error');
const resultSummary = document.querySelector('#result-summary');

let tickets = loadTickets();
let checkedDraw = null;

function loadTickets() {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
    if (!Array.isArray(saved)) return [];
    return saved.filter((ticket) => Array.isArray(ticket.numbers)
      && ticket.numbers.length === 6
      && ticket.numbers.every((number) => Number.isInteger(number) && number >= 1 && number <= 45));
  } catch {
    return [];
  }
}

function saveTickets() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(tickets));
  } catch {
    copyStatus.textContent = '브라우저 저장 공간을 사용할 수 없어 새로고침하면 조합이 사라질 수 있어요.';
  }
}

// Rejection sampling avoids the small modulo bias of a simple random % max.
function randomBelow(max) {
  const range = 0x100000000;
  const limit = Math.floor(range / max) * max;
  const value = new Uint32Array(1);
  do {
    crypto.getRandomValues(value);
  } while (value[0] >= limit);
  return value[0] % max;
}

function makeTicket() {
  const pool = Array.from({ length: 45 }, (_, index) => index + 1);
  for (let index = 0; index < 6; index += 1) {
    const swapIndex = index + randomBelow(pool.length - index);
    [pool[index], pool[swapIndex]] = [pool[swapIndex], pool[index]];
  }
  return pool.slice(0, 6).sort((a, b) => a - b);
}

function ballRange(number) {
  if (number <= 10) return 1;
  if (number <= 20) return 2;
  if (number <= 30) return 3;
  if (number <= 40) return 4;
  return 5;
}

function getRank(matchCount, hasBonus) {
  if (matchCount === 6) return '1등';
  if (matchCount === 5 && hasBonus) return '2등';
  if (matchCount === 5) return '3등';
  if (matchCount === 4) return '4등';
  if (matchCount === 3) return '5등';
  return '낙첨';
}

function addBall(container, number, matchedNumbers = [], bonus = null) {
  const ball = document.createElement('span');
  ball.className = `ball ball-${ballRange(number)}`;
  if (matchedNumbers.includes(number)) ball.classList.add('matched');
  if (bonus === number) ball.classList.add('bonus-match');
  ball.textContent = String(number).padStart(2, '0');
  container.append(ball);
}

function renderTickets() {
  ticketList.replaceChildren();
  if (tickets.length === 0) {
    ticketList.append(emptyState);
  } else {
    tickets.forEach((ticket, index) => {
      const row = document.createElement('article');
      row.className = 'ticket';
      row.style.animationDelay = `${Math.min(index * 35, 280)}ms`;

      const label = document.createElement('span');
      label.className = 'ticket-index';
      label.textContent = String(index + 1).padStart(2, '0');
      label.setAttribute('aria-label', `${index + 1}번째 조합`);

      const balls = document.createElement('div');
      balls.className = 'balls';
      balls.setAttribute('aria-label', ticket.numbers.join(', '));
      ticket.numbers.forEach((number) => addBall(balls, number,
        checkedDraw?.numbers ?? [], checkedDraw?.bonus ?? null));

      const result = document.createElement('span');
      result.className = `ticket-result${ticket.rank && ticket.rank !== '낙첨' ? ' rank' : ''}`;
      result.textContent = ticket.rank || '';
      row.append(label, balls, result);
      ticketList.append(row);
    });
  }
  const hasTickets = tickets.length > 0;
  copyButton.disabled = !hasTickets;
  shareButton.disabled = !hasTickets;
  resetButton.disabled = !hasTickets;
}

function createTickets() {
  const amount = Number(setCount.value);
  const first = tickets.length;
  const newTickets = Array.from({ length: amount }, () => ({
    id: crypto.randomUUID?.() ?? `${Date.now()}-${Math.random()}`,
    numbers: makeTicket(),
    rank: ''
  }));
  tickets = [...tickets, ...newTickets];
  if (checkedDraw) applyDraw(checkedDraw, false);
  else renderTickets();
  saveTickets();
  copyStatus.textContent = `${first + 1}번부터 ${tickets.length}번까지 ${amount}개 조합을 만들었어요.`;
}

function applyDraw(draw, showSummary = true) {
  checkedDraw = draw;
  let winners = 0;
  tickets = tickets.map((ticket) => {
    const matchCount = ticket.numbers.filter((number) => draw.numbers.includes(number)).length;
    const hasBonus = ticket.numbers.includes(draw.bonus);
    const rank = getRank(matchCount, hasBonus);
    if (rank !== '낙첨') winners += 1;
    return { ...ticket, rank, matchCount, hasBonus };
  });
  renderTickets();
  saveTickets();
  if (showSummary) {
    resultSummary.hidden = false;
    resultSummary.textContent = winners
      ? `${tickets.length}개 조합 중 ${winners}개가 5등 이상이에요. 각 조합의 일치 번호는 노란 테두리, 보너스 일치는 초록 테두리로 표시했어요.`
      : `${tickets.length}개 조합을 확인했어요. 이번 입력 번호와 일치한 당첨 조합은 없습니다.`;
  }
}

function readWinningNumbers() {
  const values = Array.from({ length: 6 }, (_, index) => Number(document.querySelector(`#win-${index + 1}`).value));
  const bonus = Number(document.querySelector('#bonus-number').value);
  if (values.some((number) => !Number.isInteger(number) || number < 1 || number > 45)) {
    throw new Error('당첨번호 6개를 각각 1부터 45 사이로 입력해 주세요.');
  }
  if (new Set(values).size !== 6) throw new Error('당첨번호 6개는 서로 달라야 해요.');
  if (!Number.isInteger(bonus) || bonus < 1 || bonus > 45) {
    throw new Error('보너스 번호를 1부터 45 사이로 입력해 주세요.');
  }
  if (values.includes(bonus)) throw new Error('보너스 번호는 당첨번호 6개와 달라야 해요.');
  return { numbers: values, bonus };
}

function ticketText() {
  return tickets.map((ticket, index) => `${String(index + 1).padStart(2, '0')}. ${ticket.numbers.join(', ')}`).join('\n');
}

async function copyText(text) {
  try {
    await navigator.clipboard.writeText(text);
  } catch {
    const textarea = document.createElement('textarea');
    textarea.value = text;
    textarea.style.position = 'fixed';
    textarea.style.opacity = '0';
    document.body.append(textarea);
    textarea.select();
    document.execCommand('copy');
    textarea.remove();
  }
}

generateButton.addEventListener('click', createTickets);

copyButton.addEventListener('click', async () => {
  await copyText(ticketText());
  copyStatus.textContent = '번호 조합을 복사했어요.';
});

shareButton.addEventListener('click', async () => {
  const text = `로또 6/45 번호\n${ticketText()}`;
  if (navigator.share) {
    try {
      await navigator.share({ title: '로또 6/45 번호', text });
      copyStatus.textContent = '번호를 공유했어요.';
    } catch (error) {
      if (error.name !== 'AbortError') copyStatus.textContent = '공유를 열지 못했어요.';
    }
  } else {
    await copyText(text);
    copyStatus.textContent = '이 브라우저는 공유 기능이 없어 번호를 복사했어요.';
  }
});

resetButton.addEventListener('click', () => {
  tickets = [];
  checkedDraw = null;
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {
    // Clearing the in-memory view still works when browser storage is unavailable.
  }
  for (let index = 1; index <= 6; index += 1) {
    document.querySelector(`#win-${index}`).value = '';
  }
  document.querySelector('#bonus-number').value = '';
  formError.textContent = '';
  resultSummary.hidden = true;
  resultSummary.textContent = '';
  copyStatus.textContent = '생성된 조합과 입력한 당첨번호를 모두 지웠어요.';
  renderTickets();
});

winningForm.addEventListener('submit', (event) => {
  event.preventDefault();
  formError.textContent = '';
  if (tickets.length === 0) {
    formError.textContent = '먼저 번호 조합을 만들어 주세요.';
    return;
  }
  try {
    applyDraw(readWinningNumbers());
  } catch (error) {
    formError.textContent = error.message;
    resultSummary.hidden = true;
  }
});

renderTickets();
