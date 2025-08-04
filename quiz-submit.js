// URL of the deployed Google Apps Script web app for recording main theory quiz results.
// This value must correspond to your latest deployment and end with `/exec`.
const SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbw_jGIq9JUm4TwzDgm5ad6QrhGygJirVOBQMVcj3KHV29nGzvS0gIW0Mf9vmwiGvJpR/exec';

/**
 * Display a modal overlay asking the student for their name.
 * Returns a Promise that resolves with the entered name (trimmed).
 */
function showNamePrompt(defaultName = '') {
  return new Promise((resolve) => {
    let overlay = document.getElementById('name-overlay');
    if (!overlay) {
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

function submitQuiz(button, quizNumber, answers) {
  const form = button.closest('form');
  const nameField = document.getElementById('studentName');
  let studentName = nameField ? nameField.value.trim() : '';
  // function to process and submit after obtaining student name
  const proceed = (name) => {
    const questions = Array.from(form.querySelectorAll('ol li'));
    let correctCount = 0;
    const quizResults = [];
    questions.forEach((li, idx) => {
      const qid = `q${idx + 1}`;
      const chosen = li.querySelector('input[type="radio"]:checked');
      const answerValue = chosen ? chosen.value : '';
      const correctValue = answers[qid];
      const isCorrect = answerValue === correctValue;
      if (isCorrect) correctCount++;
      quizResults.push({
        question: li.querySelector('p').textContent.trim(),
        answer: chosen ? chosen.parentElement.textContent.trim() : '',
        correct: isCorrect
      });
    });
    const scoreStr = `${correctCount}/${questions.length}`;
    form.querySelector('.quiz-msg').textContent = `Thanks ${name}, you scored ${scoreStr}.`;
    const payload = {
      quizType: quizNumber.charAt(0),
      quizNumber,
      quiz: quizResults,
      score: scoreStr,
      studentName: name,
      timestamp: new Date().toISOString()
    };
    // Send JSON to Google Apps Script. The script will parse e.postData.contents.
    fetch(SCRIPT_URL, {
      method: 'POST',
      mode: 'no-cors',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    alert('Your mark has been submitted to your teacher');
  };
  if (!studentName) {
    // Show modal prompt
    showNamePrompt().then(name => {
      if (!name) return;
      proceed(name);
    });
    return;
  }
  proceed(studentName);
}

function submitTextQuiz(button, quizNumber) {
  const form = button.closest('form');
  let studentName = prompt('Enter your name:', '');
  if (!studentName) return;
  studentName = studentName.trim();

  const responses = {};
  form.querySelectorAll('textarea').forEach((ta, idx) => {
    responses[`q${idx + 1}`] = ta.value.trim();
  });

  const d = new Date();
  const formattedDate = `${String(d.getDate()).padStart(2, '0')}/` +
                       `${String(d.getMonth() + 1).padStart(2, '0')}/` +
                       `${String(d.getFullYear()).slice(-2)}`;

  const payload = {
    name: studentName,
    quiz: quizNumber,
    date: formattedDate,
    question1: responses.q1 || '',
    question2: responses.q2 || '',
    question3: responses.q3 || ''
  };

  // Send JSON payload to the Apps Script.
  fetch(SCRIPT_URL, {
    method: 'POST',
    mode: 'no-cors',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });

  alert('Your responses have been submitted to your teacher');
}
