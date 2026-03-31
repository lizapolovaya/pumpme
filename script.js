function saveSet() {
    const exercise = document.getElementById('exercise').value;
    const weight = document.getElementById('weight').value;
    const reps = document.getElementById('reps').value;
    const rpe = document.getElementById('rpe').value;
    const date = new Date().toLocaleDateString();

    if(!weight || !reps) return alert("Enter weight and reps!");

    const entry = { date, exercise, weight, reps, rpe };
    let logs = JSON.parse(localStorage.getItem('fitnessLogs')) || [];
    logs.unshift(entry); // Newest first
    localStorage.setItem('fitnessLogs', JSON.stringify(logs));
    
    displayLogs();
}

function displayLogs() {
    const logList = document.getElementById('logList');
    const logs = JSON.parse(localStorage.getItem('fitnessLogs')) || [];
    logList.innerHTML = logs.map(log => `
        <li>
            <strong>${log.exercise}</strong>: ${log.weight}kg x ${log.reps} (RPE ${log.rpe}) 
            <span>${log.date}</span>
        </li>
    `).join('');
}

function clearLogs() {
    if(confirm("Delete all history?")) {
        localStorage.clear();
        displayLogs();
    }
}

// Load logs on startup
displayLogs();
