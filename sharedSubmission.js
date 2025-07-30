// URL of the deployed Google Apps Script for recording quiz results.
// Deployed Google Apps Script web app URL for recording quiz and exam results.
// Update this value if you redeploy the Apps Script.
// Updated Apps Script URL for posting quiz and exam data. This URL points to the
// newly deployed Google Apps Script web app. When updating, ensure it ends
// with `/exec` and that the script is deployed with public access.
const SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbw_jGIq9JUm4TwzDgm5ad6QrhGygJirVOBQMVcj3KHV29nGzvS0gIW0Mf9vmwiGvJpR/exec';

/**
 * Display a modal overlay asking the student for their name.
 * Returns a Promise that resolves with the entered name (trimmed).
 * If the user submits an empty value the promise resolves to an empty string.
 */
function showNamePrompt(defaultName = '') {
  return new Promise((resolve) => {
    let overlay = document.getElementById('name-overlay');
    if (!overlay) {
      // create overlay
      overlay = document.createElement('div');
      overlay.id = 'name-overlay';
      Object.assign(overlay.style, {
        position: 'fixed',
        top: '0',
        left: '0',
        width: '100%',
        height: '100%',
        background: 'rgba(0,0,0,0.5)',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: '9999'
      });
      const modal = document.createElement('div');
      Object.assign(modal.style, {
        background: '#fff',
        padding: '20px',
        borderRadius: '6px',
        boxShadow: '0 2px 8px rgba(0,0,0,0.2)',
        width: '90%',
        maxWidth: '400px',
        textAlign: 'center'
      });
      modal.innerHTML = `
        <p style="margin-top:0;margin-bottom:10px;font-size:1.1em;">Please enter your name:</p>
        <input type="text" id="modal-name-input" style="width:100%;padding:8px;margin-bottom:15px;border:1px solid #ccc;border-radius:4px;" />
        <button id="modal-name-submit" style="padding:8px 16px;background:#007bff;color:#fff;border:none;border-radius:4px;cursor:pointer;">Submit</button>
      `;
      overlay.appendChild(modal);
      document.body.appendChild(overlay);
    }
    const input = overlay.querySelector('#modal-name-input');
    input.value = defaultName;
    overlay.style.display = 'flex';
    const button = overlay.querySelector('#modal-name-submit');
    function handleClick() {
      overlay.style.display = 'none';
      button.removeEventListener('click', handleClick);
      resolve(input.value.trim());
    }
    button.addEventListener('click', handleClick);
    input.focus();
  });
}

function padWeek(week){
  const num = (week.match(/\d+/) || ['0'])[0];
  return num.toString().padStart(3,'0');
}

function submitSupportQuiz(btn){
  const form = btn.closest('form');
  const week = form.dataset.week || '';
  const quizNumber = 'S' + padWeek(week);
  showNamePrompt().then((name) => {
    if (!name) return;
    // Collect responses and compute score based on data-correct attributes
    const responses = [];
    let correctCount = 0;
    const questions = form.querySelectorAll('ol li');
    questions.forEach(li => {
      const checked = li.querySelector('input[type="radio"]:checked');
      responses.push(checked ? checked.value : '');
      if (checked && checked.dataset.correct === 'true') {
        correctCount++;
      }
    });
    const scoreStr = `${correctCount}/${questions.length}`;
    const payload = {
      studentName: name,
      quizNumber,
      week,
      score: scoreStr,
      timestamp: new Date().toISOString(),
      responses
    };
    // Send data as JSON; the Apps Script expects raw JSON in e.postData.contents
    fetch(SCRIPT_URL, {
      method: 'POST',
      mode: 'no-cors',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    }).then(() => {
      form.querySelector('.quiz-msg').textContent = `Thanks ${name}, you scored ${scoreStr}.`;
    }).catch(() => {
      form.querySelector('.quiz-msg').textContent = 'Error submitting.';
    });
  });
}

function submitAdvancedQuiz(btn){
  const form = btn.closest('form');
  const week = form.dataset.week || '';
  const quizNumber = 'A' + padWeek(week);
  showNamePrompt().then((name) => {
    if (!name) return;
    const responses = [];
    form.querySelectorAll('textarea').forEach(t => responses.push(t.value.trim()));
    const payload = {
      studentName: name,
      quizNumber,
      week,
      timestamp: new Date().toISOString(),
      responses
    };
    // Send data as JSON; the Apps Script expects raw JSON in e.postData.contents
    fetch(SCRIPT_URL, {
      method: 'POST',
      mode: 'no-cors',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    }).then(() => {
      form.querySelector('.quiz-msg').textContent = 'Submitted!';
    }).catch(() => {
      form.querySelector('.quiz-msg').textContent = 'Error submitting.';
    });
  });
}
