
//part 1 of total code
let notes = JSON.parse(localStorage.getItem("notes")) || [];
let editingNoteIndex = null;
let currentNoteId = null;
let currentDeleteNoteId = null;
let currentItems = []; // Will now store objects like { name: 'item name', checked: true/false }
let editingListIndex = null;
let historyStack = [];
let currentIndex = -1;

document.addEventListener("DOMContentLoaded", function () {
  startAiScan();
  
  setTimeout(copyResultsToModal, 1500);
  setTimeout(showAiModal, 1500);
});

function saveState() {
  const noteContent = document.getElementById("noteContent").value;

  // If the current index is not the last element in the stack, remove any "future" states
  if (currentIndex < historyStack.length - 1) {
    historyStack = historyStack.slice(0, currentIndex + 1);
  }

  // Add the current content to the history stack
  historyStack.push(noteContent);
  currentIndex++;

  toggleButtons();
}

function showEmail(emailId) {
  // Hide all email contents
  const contents = document.querySelectorAll(".email-content");
  contents.forEach((content) => (content.style.display = "none"));

  // Show the selected email content
  document.getElementById(emailId).style.display = "block";
}


function sendAIQuery() {
  const input = document.getElementById('aiQuery');
  const response = document.getElementById('aiResponse');
  const query = input.value.trim();

  if (query === '') return;

  response.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Thinking...';
  setTimeout(() => {
    response.innerHTML = `<i class="fas fa-robot"></i> Here’s an explanation for: <strong>${query}</strong>`;
  }, 1500);
}



// Function to handle undo
function undo() {
  if (currentIndex > 0) {
    currentIndex--;
    const previousState = historyStack[currentIndex];
    // Restore the previous state
    document.getElementById("noteContent").value = previousState;
  }
  toggleButtons();
}

// Function to handle redo
function redo() {
  if (currentIndex < historyStack.length - 1) {
    currentIndex++;
    const nextState = historyStack[currentIndex];
    // Restore the next state
    document.getElementById("noteContent").value = nextState;
  }
  toggleButtons();
}



document.getElementById('noteContent').addEventListener('keyup', function (e) {
if (e.key === " " || e.key === "Enter") {
const textarea = e.target;
const text = textarea.value;

// Use regex to find formula-like patterns: e.g., =5+4, =SUM(1,2)
const formulaPattern = /=(SUM|AVG)?\(?[0-9+*/,\s.-]+\)?/gi;
const matches = text.match(formulaPattern);

if (matches) {
matches.forEach(match => {
  const result = evaluateInlineFormula(match.trim());
  if (result !== null) {
    textarea.value = textarea.value.replace(match, result);
  }
});
}
}
});

function evaluateInlineFormula(formula) {
try {
if (formula.startsWith('=SUM(')) {
const nums = formula.slice(5, -1).split(',').map(Number);
return nums.reduce((a, b) => a + b, 0);
} else if (formula.startsWith('=AVG(')) {
const nums = formula.slice(5, -1).split(',').map(Number);
return (nums.reduce((a, b) => a + b, 0) / nums.length).toFixed(2);
} else if (formula.startsWith('=')) {
return eval(formula.slice(1)); // simple math
}
} catch (e) {
return null;
}
return null;
}



function goBack() {
  // Hide all sections when going back
  const sections = document.querySelectorAll(".setting-category div");
  sections.forEach((section) => {
    section.classList.add("hidden");
  });

  // Reset toggle icons to plus
  const toggleIcons = document.querySelectorAll(".toggle-icon");
  toggleIcons.forEach((icon) => {
    icon.textContent = "+";
  });
}

function showTab(tabId) {
  // Hide all tab contents
  const tabContents = document.querySelectorAll(".tab-content");
  tabContents.forEach((content) => {
    content.classList.remove("active");
  });

  // Remove active class from all tab buttons
  const tabButtons = document.querySelectorAll(".tab-button");
  tabButtons.forEach((button) => {
    button.classList.remove("active");
  });

  // Show the selected tab content
  document.getElementById(tabId).classList.add("active");

  // Set the clicked tab button as active
  const activeButton = Array.from(tabButtons).find(
    (button) =>
      button.textContent === tabId.replace(/([A-Z])/g, " $1").trim()
  );
  if (activeButton) {
    activeButton.classList.add("active");
  }
}

// Function to toggle sections within the settings
function toggleSection(sectionId) {
  const section = document.getElementById(sectionId);
  if (section) {
    section.classList.toggle("hidden");
    const toggleIcon = document.getElementById(sectionId + "Toggle");
    if (toggleIcon) {
      toggleIcon.textContent = toggleIcon.textContent === "+" ? "-" : "+";
    }
  }
}

function clearData() {
  if (
    confirm(
      "Are you sure you want to clear all data? This action cannot be undone."
    )
  ) {
    localStorage.removeItem("notes");
    localStorage.removeItem("lists");
    notes = [];
    lists = [];
    displayNotes();
    displayLists();
    showMessageBox("All data cleared successfully!");
  }
}

function encryptData() {
  const encryptedNotes = btoa(JSON.stringify(notes)); // Base64 encode the notes
  const encryptedLists = btoa(JSON.stringify(lists)); // Base64 encode the lists
  showMessageBox(
    "This feature is buggy and may not work as expected. Use with cuation your old data may be deleted"
  );
  localStorage.setItem("encryptedNotes", encryptedNotes);
  localStorage.setItem("encryptedLists", encryptedLists);
  showMessageBox("Data encrypted successfully!");
}

function decryptData() {
  const encryptedNotes = localStorage.getItem("encryptedNotes");
  const encryptedLists = localStorage.getItem("encryptedLists");
  showMessageBox(
    "This feature is buggy and may not work as expected. Use with cuation your old data may be deleted"
  );

  if (encryptedNotes) {
    notes = JSON.parse(atob(encryptedNotes)); // Base64 decode the notes
  } else {
    notes = [];
  }

  if (encryptedLists) {
    lists = JSON.parse(atob(encryptedLists)); // Base64 decode the lists
  } else {
    lists = [];
  }

  localStorage.setItem("notes", JSON.stringify(notes)); // Save decrypted notes back to local storage
  localStorage.setItem("lists", JSON.stringify(lists)); // Save decrypted lists back to local storage
  displayNotes();
  displayLists();
  showMessageBox("Data decrypted successfully!");
}

// Function to toggle button states (enable/disable)
function toggleButtons() {
    const undoButton = document.getElementById("undoButton");
    const redoButton = document.getElementById("redoButton");

    // Enable/Disable Undo button
    undoButton.disabled = currentIndex <= 0;
   

    // Enable/Disable Redo button
    redoButton.disabled = currentIndex >= historyStack.length - 1;
    

  
}


// Event listener to automatically save the content whenever the user types
document
  .getElementById("noteContent")
  .addEventListener("input", saveState);
  
// Initial call to enable/disable buttons on page load
toggleButtons();



function startAiScan() {
  const scanStatus = document.getElementById("scanStatus");
  const resultsContainer = document.getElementById("resultsContainer");
  const scanCircle = document.getElementById("scanCircle");
  const notesCountElem = document.getElementById("notesCount");
  const progressBar = document.getElementById("progressBar");

  // Reset UI
  resultsContainer.innerHTML = "";
  scanStatus.textContent = "Initializing AI scan...";
  scanCircle.style.borderColor = "#4CAF50";
  scanCircle.style.animation = "spin 1s linear infinite";
  notesCountElem.textContent = "0";

  const notes = JSON.parse(localStorage.getItem("notes")) || [];
  const sensitiveKeywords = [
    "password", "ssn", "credit card", "bank account", "secret", "pin", "bank",
    "policy", "account", "pass", "id", "aadhaar", "card", "security", "key",
    "token", "license", "confidential", "credentials", "auth", "login"
  ];

  let foundSensitiveData = [];
  let scannedTitles = new Set(); // prevent duplicate messages for same note
  let threatsCount = 0;
  let index = 0;
  const startTime = Date.now();

  const scanInterval = setInterval(() => {
    if (index >= notes.length) {
      clearInterval(scanInterval);

      const endTime = Date.now();
      const duration = ((endTime - startTime) / 1000).toFixed(2);
      scanCircle.style.animation = "none";
      notesCountElem.textContent = `${notes.length}`;

      if (threatsCount === 0) {
        scanCircle.style.borderColor = "#4CAF50";
        scanStatus.textContent = `Scan complete in ${duration}s — No threats found!`;
        resultsContainer.innerHTML = "<div class='success-msg'>All notes are safe!</div>";
      } else {
        scanCircle.style.borderColor = threatsCount === 1 ? "orange" : "red";
        scanStatus.textContent = `Scan complete in ${duration}s — ${threatsCount} threat${threatsCount > 1 ? "s" : ""} found!`;
        resultsContainer.innerHTML = foundSensitiveData.join("<br>");
      }

      // Auto-scroll to results
      resultsContainer.scrollIntoView({ behavior: "smooth" });
      return;
      console.log('AI SCAN CALLED');
    }

    const note = notes[index];
   const currentTitle = note?.title || `Untitled Note`;
notesCountElem.textContent = `🧠 Scanning: "${currentTitle}"`;
progressBar.style.width = `${((index + 1) / notes.length) * 100}%`;


    if (note && (!note.password || note.password.trim() === "")) {
      const content = (note.content || "").toLowerCase();
      const title = note.title || "Untitled";

      const isSensitive = sensitiveKeywords.some(keyword =>
        content.includes(keyword.toLowerCase())
      );

      if (isSensitive && !scannedTitles.has(title)) {
        foundSensitiveData.push(
          `<div class="alert-msg">Sensitive data found in: <strong style="color:red;">${title}</strong></div>`
        );
        scannedTitles.add(title);
        threatsCount++;
      }
    }

    index++;
  }, 250); // Scan delay (ms)
}

function closeAiModal() {
  document.getElementById("aiModal").style.display = "none";
}

function showAiModal(){
 const results = document.getElementById("resultsContainer").innerHTML;
    document.getElementById("modalResultsContainer").innerHTML = results;
  document.getElementById("aiModal").style.display = "flex";
}

 function copyResultsToModal() {
    const scanResults = document.getElementById("resultsContainer").innerHTML;
    document.getElementById("modalResultsContainer").innerHTML = scanResults;
    document.getElementById("aiModal").classList.remove("hidden");
  }

function showNotePassword() {
  document.getElementById("notePasswordModal").style.display = "flex";
}

function closeNotePassword() {
  document.getElementById("notePasswordModal").style.display = "none";
}

function showList() {
  document.getElementById("listPasswordModalr").style.display = "flex";
}

function closeListPassword() {
  document.getElementById("listPasswordModalr").style.display = "none";
}




// Call startScan when needed, e.g., on button click






function closeListPasswordModal() {
  document.getElementById("listPasswordModal").style.display = "none";
}

function closeDeleteListPasswordModal() {
  document.getElementById("deleteListPasswordModal").style.display =
    "none";
    closeListPasswordModal();
}

function showCredits() {
  const credits = document.getElementById("creditsSection");
  credits.style.display =
    credits.style.display === "none" ? "block" : "none";
}

function updateDataStats() {
  const noteCount = document.getElementById("noteCount");
  const listCount = document.getElementById("listCount");

  // Count the number of notes and lists
  noteCount.textContent = notes.length; // Update the note count
  listCount.textContent = lists.length; // Update the list count
}

function backupNotes() {
const backupData = {
notes: notes,
lists: lists,
};

const blob = new Blob([JSON.stringify(backupData)], {
type: "application/json",
});
const url = URL.createObjectURL(blob);
const a = document.createElement("a");
a.href = url;
a.download = "backup_data.json";
a.click();
URL.revokeObjectURL(url);
}

function prepareImport(event) {
const file = event.target.files[0];
if (file) {
const reader = new FileReader();
reader.onload = (e) => {
const importedData = JSON.parse(e.target.result);

if (importedData.notes) {
  notes = [...notes, ...importedData.notes];
}

if (importedData.lists) {
  lists = [...lists, ...importedData.lists];
  localStorage.setItem("lists", JSON.stringify(lists));
  displayLists(); // Refresh the list display if needed
}

localStorage.setItem("notes", JSON.stringify(notes));
displayNotes(); // Only if you have such a function
};
reader.readAsText(file);
}
}


document.getElementById("notifyButton").onclick = function () {
  if (Notification.permission === "granted") {
    new Notification("Reminder!", {
      body: "Don't forget to check your notes!",
    });
  } else if (Notification.permission !== "denied") {
    Notification.requestPermission().then((permission) => {
      if (permission === "granted") {
        new Notification("Reminder!", {
          body: "Don't forget to check your notes!",
        });
      }
    });
  }
};

function importNotes() {
  const fileInput = document.getElementById("importFile");
  if (!fileInput.files.length) {
    showMessageBox("No file selected!");
    return;
  }

  localStorage.setItem("notes", JSON.stringify(notes));
  displayNotes();
  showMessageBox("Notes imported successfully!");
}

// Function to toggle edit note mode

const monthYear = document.getElementById('monthYear');
const calendarDays = document.getElementById('calendarDays');

let currentDate = new Date();

function renderCalendar(date) {
const year = date.getFullYear();
const month = date.getMonth();

// Set month and year
const monthNames = [
'January', 'February', 'March', 'April', 'May', 'June',
'July', 'August', 'September', 'October', 'November', 'December'
];
monthYear.textContent = `${monthNames[month]} ${year}`;

// First day of the month
const firstDay = new Date(year, month, 1);
const startingDay = (firstDay.getDay() + 6) % 7; // Adjusting so Monday = 0

// Number of days in the month
const daysInMonth = new Date(year, month + 1, 0).getDate();

// Clear previous cells
calendarDays.innerHTML = '';

// Add empty cells for days before the first day
for (let i = 0; i < startingDay; i++) {
const emptyCell = document.createElement('div');
calendarDays.appendChild(emptyCell);
}

// Add day cells
for (let i = 1; i <= daysInMonth; i++) {   //end of part 1 wait fpr oter parts total 3 parts , 
const dayCell = document.createElement('div');//start of part 2 
dayCell.textContent = i;

// Highlight today
const today = new Date();
if (
i === today.getDate() &&
month === today.getMonth() && //part 2 of total code , tehre are total 3 parts , when u will undertnd te cde and debug it kindly combine all thhree parts
year === today.getFullYear()
) {
dayCell.classList.add('today');
}

calendarDays.appendChild(dayCell);
}
}

function changeMonth(offset) {
currentDate.setMonth(currentDate.getMonth() + offset);
renderCalendar(currentDate);
}

// Initial render
renderCalendar(currentDate);



function formatDate(date) {
  const options = { day: "numeric", month: "long", year: "numeric" };
  return date.toLocaleDateString("en-US", options);
}

function searchNotes() {
const searchTerm = document.getElementById('searchInput').value.toLowerCase();

// Filter notes safely
const filteredNotes = notes.filter(note =>
note?.title?.toLowerCase().includes(searchTerm)
);

// Filter lists safely
const filteredLists = lists.filter(list =>
list?.name?.toLowerCase().includes(searchTerm)
);

// Display both
displayFilteredNotesAndLists(filteredNotes, filteredLists);
}




// Function to display filtered notes and lists
function displayFilteredNotesAndLists(filteredNotes, filteredLists) {
const container = document.getElementById("notesContainer");
container.innerHTML = ""; // Clear existing content
const noNotesMessage = document.getElementById("noNotesMessage");

if (filteredNotes.length === 0 && filteredLists.length === 0) {
noNotesMessage.classList.remove("hidden");
} else {
noNotesMessage.classList.add("hidden");
}

// Display notes
filteredNotes.forEach((note, index) => {
const noteDiv = document.createElement("div");
noteDiv.innerHTML = `
<div class="note" onclick="openNote(${index})">
    <h4>${note.title}</h4>
    <span class="note-date">${note.date}</span>
    <button class="delete-btn" onclick="event.stopPropagation(); deleteNote(${index})">Delete</button>
</div>
`;
container.appendChild(noteDiv);
});

// Display lists
filteredLists.forEach((list, index) => {
const listDiv = document.createElement("div");
listDiv.innerHTML = `
<div class="note" onclick="openList(${index})">
    <h4>${list.name}</h4>
    <span class="note-date">${list.date || "No date"}</span>
    <button class="delete-btn" onclick="event.stopPropagation(); deleteList(${index})">Delete</button>
</div>
`;
container.appendChild(listDiv);
});
}


// Function to close the list password modal
function toggleFeatureSection(sectionId) {
  const sections = [
    "privacyInfoSection",
    "calculatorSection",
    "notificationPanel",
  ]; // Add all feature section IDs here
  sections.forEach((section) => {
    const element = document.getElementById(section);
    if (section === sectionId) {
      element.classList.toggle("hidden"); // Toggle the selected section
    } else {
      element.classList.add("hidden"); // Hide other sections
    }
  });
}

// Function to close a specific feature section
function closeFeatureSection(sectionId) {
  const element = document.getElementById(sectionId);
  element.classList.add("hidden"); // Hide the specified section
}


function showListPassword() {
  const listPasswordInput = document.getElementById("listPassword");
  listPasswordInput.classList.toggle("hidden"); // Toggle visibility of the password input
}

// Function to verify the password for accessing the list
function verifyListPassword() {
  const password = document.getElementById("listPasswordInput").value;
  const listIndex =
    document.getElementById("listPasswordModal").dataset.listIndex; // Assuming you set this when opening the modal
  const list = lists[listIndex]; // Get the list being accessed

  if (password === list.password) {
    document.getElementById("listPasswordModal").style.display = "none"; // Close the modal
    document.getElementById("listTitle").value = list.title;
    currentItems = list.items.slice(); // Copy items to currentItems
    displayChecklist(); // Display the checklist with items
    editingListIndex = listIndex; // Update the editing list index
    showAddListSection(); // Implement this function to display the list content
    document.getElementById("listPassword").value = list.password;
  } else {
    showMessageBox("Incorrect password!"); // Show an error message
  }
}

function closeCalculator() {
  document.getElementById("calculatorSection").classList.add("hidden")
  ;
  showSection('combinedContainer');
}

function appendValue(value) {
  const display = document.getElementById("calc-display");
  if (display.value === "0" || display.value === "Error") {
    display.value = value;
  } else {
    display.value += value;
  }
}

function calculate() {
  const display = document.getElementById("calc-display");
  try {
    display.value = eval(display.value);
  } catch {
    display.value = "Error";
  }
}

function clearDisplay() {
  document.getElementById("calc-display").value = "0";
}

// Function to show alert when a feature is not implemented
function showAlert(feature) {
  alert(`${feature} feature is not implemented yet.`);
}
// Function to show the delete password modal

// Function to close the delete list password mod

// Function to verify the password for deleting the list
// Function to verify the password for deleting the list
function deleteListVerifyPassword() {
  const passwordInput = document.getElementById(
    "deleteListPasswordInput"
  ).value;
  const index = document.getElementById("deleteListPasswordModal").dataset
    .listIndex; // Get the index of the list being deleted

  console.log("List Index:", index); // Debugging line

  const list = lists[index]; // Get the list being deleted

  if (!list) {
    console.error("List not found at index:", index); // Log an error if the list is undefined
    return; // Exit the function if the list is not found
  }

  if (passwordInput === list.password) {
    // If the password is correct, delete the list
    lists.splice(index, 1);
    localStorage.setItem("lists", JSON.stringify(lists));
    document.getElementById("deleteListPasswordModal").style.display =
      "none";
    document.getElementById("listPasswordModal").style.display = "none";
    displayLists();
  } else {
    showMessageBox("Incorrect password!"); // Show an error message
  }
}

// Function to toggle the password input field
function togglePasswordInput() {
  const passwordInput = document.getElementById("notePassword");
  passwordInput.classList.toggle("hidden");


}


function showSection(sectionId) {
  document.querySelectorAll(".container").forEach((section) => {
    section.classList.add("hidden"); // Hide all sections
  });
  document.getElementById(sectionId).classList.remove("hidden"); // Show the selected section

  // Manage history stack
  if (historyStack[historyStack.length - 1] !== sectionId) {
    historyStack.push(sectionId);
  }

  currentSection = sectionId; // Update current section
}

// Event listener for the Android back button functionality
window.addEventListener("popstate", function (event) {
  if (historyStack.length > 1) {
    historyStack.pop(); // Remove the current section
    const previousSection = historyStack.pop(); // Get the previous section
    showSection(previousSection); // Show the previous section
    historyStack.push(previousSection); // Push it back to maintain history
  }
});

window.onload = function () {
  startAiScan();
};


let isMessageBoxVisible = false; // Flag to track visibility
function showMessageBox(message) {
  if (isMessageBoxVisible) return; // Prevent showing if already visible

  const messageBox = document.getElementById("messageBox");
  messageBox.textContent = message; // Set the message text
  messageBox.style.display = "block"; // Show the message box
  isMessageBoxVisible = true; // Set the flag to true

  // Fade out effect after 3 seconds
  setTimeout(function () {
    messageBox.style.opacity = "0"; // Start fading out
    setTimeout(function () {
      messageBox.style.display = "none"; // Hide the message box after fading out
      messageBox.style.opacity = "1"; // Reset opacity for next display
      isMessageBoxVisible = false; // Reset the flag to allow showing again
    }, 1000); // Wait for the fade out transition to complete
  }, 1000); // Show for 3 seconds
}

function showAddNote() {
  showSection("addNoteSection");
  document.getElementById("noteContent").value = ""; // Clear the note content
  document.getElementById("notePassword").value = ""; // Clear the password input

  if (editingNoteIndex !== null) {
    // Editing an existing note
    const note = notes[editingNoteIndex]; // Get the note being edited
    document.getElementById("noteTitle").value = note.title; // Set the input value to the note title
    document.getElementById("noteContent").value = note.content; // Set the input value to the note content
    document.getElementById(
      "manageNoteTitle"
    ).textContent = `Manage Your ${note.title} Note`; // Update title with the actual note title
  } else {
    // Creating a new note
    document.getElementById("noteTitle").value = ""; // Clear the title input
    document.getElementById("manageNoteTitle").textContent =
      "Add New Note"; // Set title for new note
  }
  closeAddOptions(); // Close the add options modal
}

// Function to cancel note and reset visibility
function cancelNote() {
  const section = document.getElementById("addNoteSection");
  section.classList.add("hidden");
  showSection("combinedContainer");
  document.getElementById("notePasswordModal").classList.add("hidden");
}

// Add event listener for the Add Note button
document
  .getElementById("addNoteButton")
  .addEventListener("click", function () {
    editingNoteIndex = null; // Reset the editing index for a new note
    showAddNote(); // Show the add note section
  });

  function saveNote() {
     const title = document.getElementById('noteTitle').value.trim();
    const content = document.getElementById('noteContent').value.trim();
    const password = document.getElementById('notePassword').value.trim();
    const date = new Date(); // Get the current date
    const formattedDate = formatDate(date); // Format the date


    if (content === "") {
        showMessageBox("Note content cannot be empty!");
        return;
    }

   if (title === "") {
    suggestTitle(content);
    return;
    }

    if (editingNoteIndex !== null) {
        // Update existing note
        notes[editingNoteIndex] = { title, content, password, date }; // Include date
        showMessageBox("Note updated successfully!");
    } else {
        // Add new note
        const note = { title, content, password, date }; // Include date
        notes.push(note);
        showMessageBox("Note saved successfully!");
    }

    localStorage.setItem('notes', JSON.stringify(notes));
    displayNotes();
    showSection('combinedContainer');
    document.getElementById("notePasswordModal").classList.add("hidden");

    // Reset editing state
    editingNoteIndex = null; // Reset after saving
}

function suggestTitle(noteContent) {
  const keywords = {
    "grocery": "Grocery List",
    "buy": "Shopping List",
    "meeting": "Meeting Notes",
    "exam": "Study Plan",
    "todo": "To-Do List",
    "to do": "To-Do List",
    "shopping": "Shopping List",
    "study": "Study Plan",
    "project": "Project Plan",
    "task": "To-Do List",
"work": "Work Notes"
  };

  for (const key in keywords) {
    if (noteContent.toLowerCase().includes(key)) {
      alert("Suggested title by AI: " + keywords[key]);
      return keywords[key];
    }
  }
  console.log("Suggest title called");
  return "Untitled Note";
  
  
}


function showNotification(message) {
  const notificationList = document.getElementById("notificationList");
  const notificationItem = document.createElement("div");
  notificationItem.textContent = message;
  notificationList.appendChild(notificationItem);
  document.getElementById("notificationModal").style.display = "block";
}

function closeNotificationModal() {
  document.getElementById("notificationModal").style.display = "none";
}

function displayNotes() {
  const container = document.getElementById("notesContainer");
  container.innerHTML = "";
  const noNotesMessage = document.getElementById("noNotesMessage"); // Get the no notes message element
  if (notes.length === 0) {
    noNotesMessage.classList.remove("hidden"); // Show the no notes message
  } else {
    noNotesMessage.classList.add("hidden");
  } // Hide the no notes message
  notes.forEach((note, index) => {
    const noteDiv = document.createElement("div");
    const noteDate = new Date(note.date); // Convert the stored date string back to a Date object
    const formattedDate = formatDate(noteDate); // Format the date for display
    const lockIndicator = note.password && note.password !== "" ? ' <i class="fas fa-lock"></i>' : "";
    noteDiv.innerHTML = `
  <div class="note" onclick="openNote(${index})">  
        <h4>${note.title}${lockIndicator}</h4>
        <span class="note-date">${formattedDate}</span>
        <button class="delete-btn" onclick="deleteNote(${index}); event.stopPropagation();">Delete</button>
      </div>
    `;
    container.appendChild(noteDiv);
  });
}

function openNote(index) {
  const note = notes[index];
  if (note.password) {
      document.getElementById('passwordModal').style.display = 'flex';
      document.getElementById('passwordInput').value = "";
      document.getElementById('passwordModal').dataset.noteIndex = index;
  } else {
      showNoteContent(note);
  }
}


document.addEventListener("DOMContentLoaded", function () {
  // Hide all sections initially
  document.querySelectorAll(".container").forEach((section) => {
    section.classList.add("hidden"); // Hide all sections
  });

  // Show only the notes section on page load
  showSection("combinedContainer"); // Show the notes section

  // Load notes and lists from local storage
  displayNotes();
  displayLists();
});

function showListsSection() {
  showSection("combinedContainer"); // Show the lists container
  displayLists(); // Refresh the displayed lists
  document.getElementById("addListSection").classList.add("hidden"); // Ensure add list section is hidden
}

function verifyPassword() {
  const password = document.getElementById("passwordInput").value;
  const index =
    document.getElementById("passwordModal").dataset.noteIndex;
  const note = notes[index];

  if (password === note.password) {
    document.getElementById("passwordModal").style.display = "none";
    showNoteContent(note);
  } else {
    showMessageBox("Incorrect password!");
  }
}

function deleteVerifyPassword() {
  const passwordInput = document.getElementById(
    "deletePasswordInput"
  ).value;
  const index = document.getElementById("deletePasswordModal").dataset
    .noteIndex; // Get the index of the note being deleted
  const note = notes[index]; // Get the note being deleted

  if (passwordInput === note.password) {
    // If the password is correct, delete the note
    notes.splice(index, 1);
    localStorage.setItem("notes", JSON.stringify(notes)); // Update local storage
    displayNotes(); // Refresh the displayed notes
    closeDeletePasswordModal(); // Close the modal
  } else {
    showMessageBox("Incorrect password!"); // Show an error message
  }
}

function showNoteContent(note) {
  document.getElementById("noteTitle").value = note.title;
  document.getElementById("noteContent").value = note.content;
  document.getElementById("notePassword").value = note.password;
  document.getElementById(
    "manageNoteTitle"
  ).textContent = `Manage Your ${note.title}`; // Update the title to reflect the note being managed
  showSection("addNoteSection");
  // Set the index of the note being edited
  editingNoteIndex = notes.findIndex(
    (n) => n.title === note.title && n.content === note.content
  );
  closeAddOptions();
}

// Modify the deleteNote function to include password verification

function deleteNote(index) {
  const note = notes[index];
  if (note.password) {

      document.getElementById('deletePasswordModal').style.display = 'flex';
      document.getElementById('passwordModal').style.display = 'hidden';
      document.getElementById('deletePasswordInput').value = "";
      document.getElementById('deletePasswordModal').dataset.noteIndex = index;
  } else {
      if (confirm("Are you sure you want to delete this note?")) {
          notes.splice(index, 1);
          localStorage.setItem('notes', JSON.stringify(notes));
          displayNotes();
      }
  }
}


function closeDeletePasswordModal() {
  document.getElementById("deletePasswordModal").style.display = "none"; // Hide the modal
  document.getElementById("deletePasswordInput").value = ""; // Clear the input
  document.getElementById('passwordModal').style.display = 'none';
}

function closeAddListSection() {
  document.getElementById("addListSection").classList.add("hidden"); // Hide the add list section
  showSection("combinedContainer"); // Show the lists section
}

// Function to show the add options modal
function showAddOptions() {
  document.getElementById('addOptionsModal');
  document.getElementById('addOptionsModal').style.display = 'flex';
}

function closeAddOptions() {
  document.getElementById('addOptionsModal');
  document.getElementById('addOptionsModal').style.display = 'none';
}

// Function to open a list and pre-fill the add list section

// Function to show the add list section
// Function to show the add list section
function showAddListSection() {
  // Hide all sections first

  document.querySelectorAll(".container").forEach((section) => {
    section.classList.add("hidden"); // Hide all sections
  });

  // Show the add list section
  document.getElementById("addListSection").classList.remove("hidden"); // Show the add list section

  // Check if we are editing an existing list
  if (editingListIndex !== null) {
    const list = lists[editingListIndex]; // Get the list being edited
    document.getElementById("listTitle").value = list.title; // Set the input value to the list title
    currentItems = list.items.slice(); // Copy items to currentItems
    displayChecklist(); // Display the checklist with items
    document.getElementById(
      "manageListTitle"
    ).textContent = `Manage Your ${list.title} List`; // Update title with the actual list title
  } else {
    // Reset for new list
    document.getElementById("listTitle").value = ""; // Clear the title input
    document.getElementById("manageListTitle").textContent =
      "Manage Your New List"; // Default title for new list
    currentItems = []; // Reset current items
    displayChecklist(); // Clear the checklist display
  }

  closeAddOptions(); // Close any open options
}

// Function to cancel adding a list
function cancelList() {
  // Hide the add list section and show the lists section
  document.getElementById("addListSection").classList.add("hidden"); // Hide the add list section
  showSection("combinedContainer"); // Show the lists section
  displayNotes();
  displayLists();
  document.getElementById("listPasswordModalr").classList.add("hidden");

}

// Function to show a specific section

// Function to save a new list
function saveList() {
const title = document.getElementById("listTitle").value.trim();
const password = document.getElementById("listPassword").value.trim();
const date = new Date();
const formattedDate = formatDate(date);

if (title === "" || currentItems.length === 0) {
showMessageBox("List title and items cannot be empty!");
return;
}

const listData = {
title,
items: JSON.parse(JSON.stringify(currentItems)), // Deep copy
password,
date: formattedDate,
};

if (editingListIndex !== null) {
lists[editingListIndex] = listData;
showMessageBox("List updated successfully!");
} else {
lists.push(listData);
showMessageBox("List saved successfully!");
}

localStorage.setItem("lists", JSON.stringify(lists));
displayLists();
showSection("combinedContainer");
editingListIndex = null;
document.getElementById("listPasswordModalr").classList.add("hidden");

}
// Function to open a list and pre-fill the add list section
function openList(index) {
  const list = lists[index];

  // Check if the list has a password
  if (list.password) {
    // Store the index of the list being accessed in the modal
    document.getElementById("listPasswordModal").dataset.listIndex =
      index;
    document.getElementById("listPasswordModal").style.display = "flex";
  } else {
    // If no password is required, proceed to open the list
    document.getElementById("listTitle").value = list.title;
    currentItems = list.items.slice(); // Copy items to currentItems
    displayChecklist(); // Display the checklist with items
    editingListIndex = index;
    showAddListSection(); // Show the add list section
    document.getElementById("listPassword").value = list.password;
  }
}


document
  .getElementById("addListButton")
  .addEventListener("click", function () {
    editingListIndex = null; // Reset the editing index for a new list
    showAddListSection(); // Show the add list section for a new list
  });

const lists = JSON.parse(localStorage.getItem("lists")) || [];


// Function to show the lists section
function showListsSection() {
  showSection("combinedContainer");
  displayLists(); // Refresh the displayed lists
}

function showListContent(list) {
  // Implement the logic to display the list content
  // For example, you might want to show the items in the list
  const checklistContainer =
    document.getElementById("checklistContainer");
  checklistContainer.innerHTML = ""; // Clear previous items

  list.items.forEach((item) => {
    const itemDiv = document.createElement("div");
    itemDiv.textContent = item; // Display each item
    checklistContainer.appendChild(itemDiv);
  });

  // Show the section that contains the list content
  showSection("checklistContainer"); // Assuming you have a section to show the checklist
}

// Function to add an item to the checklist
function addItem() {
const newItemInput = document.getElementById("newItem");
const newItemValue = newItemInput.value.trim();

if (newItemValue === "") {
showMessageBox("Item cannot be empty!");
return;
}

currentItems.push({ name: newItemValue, checked: false });
newItemInput.value = "";
displayChecklist();
}
// Event listener for adding item with Enter key
document
  .getElementById("newItem")
  .addEventListener("keypress", function (event) {
    if (event.key === "Enter") {
      addItem();
    }
  });

// Event listener for switching to note content with Enter key
document
  .getElementById("noteTitle")
  .addEventListener("keypress", function (event) {
    if (event.key === "Enter") {
      document.getElementById("noteContent").focus(); // Switch focus to note content
    }
  });

// Event listener for submitting password with Enter key


// Function to close the password modal
function closePasswordModal() {
  document.getElementById("passwordModal").style.display = "none";
  document.getElementById("passwordInput").value = ""; // Clear the password input field
}

function openTab(tabId) {
  document.querySelectorAll(".tab-content").forEach(tab => tab.classList.add("hidden"));
  document.querySelectorAll(".tab-btn").forEach(btn => btn.classList.remove("active-tab"));
  document.getElementById(tabId).classList.remove("hidden");

  // Activate the clicked tab button
  const tabButtons = document.querySelectorAll("#settingsTabs button");
  tabButtons.forEach(btn => {
    if (btn.getAttribute("onclick").includes(tabId)) {
      btn.classList.add("active-tab");
    }
  });
}


// Event listener for closing the password modal with Escape key
document.addEventListener("keydown", function (event) {
  if (event.key === "Escape") {
    closePasswordModal(); // Close the modal
  }
});

// Function to display the checklist
function displayChecklist() {
const checklistContainer = document.getElementById("checklistContainer");
checklistContainer.innerHTML = "";

currentItems.forEach((item, index) => {
const itemDiv = document.createElement("div");
itemDiv.innerHTML = `
<div class="checklist-item">
  <input type="checkbox" id="item-${index}" ${item.checked ? "checked" : ""} onchange="toggleCheck(${index})">
  <label for="item-${index}">${item.name}</label>
  <button onclick="removeItem(${index})">Remove</button>
</div>
`;
checklistContainer.appendChild(itemDiv);
});
}

function toggleCheck(index) {
currentItems[index].checked = !currentItems[index].checked;
// Optionally, you can update localStorage or do something here if needed immediately
}


// Function to remove an item from the checklist
function removeItem(index) {
  currentItems.splice(index, 1); // Remove the item from the array
  displayChecklist(); // Update the checklist display
}

// Function to display lists
function displayLists() {
  const container = document.getElementById("listsContainerContent");
  container.innerHTML = ""; // Clear existing lists
  const noListsMessage = document.getElementById("noListsMessage"); // Get
  if (lists.length === 0) {
    noListsMessage.classList.remove("hidden"); // Show the no lists message
  } else {
    noListsMessage.classList.add("hidden");
  } // Hide the no lists message
  lists.forEach((list, index) => {
    const listDiv = document.createElement("div");
    const listDate = new Date(list.date); // Convert the stored date string back to a Date object
    const formattedDate = formatDate(listDate); // Format the date for display
    const loclIndicator = list.password && list.password !== "" ? ' <i class="fas fa-lock"></i>' : "";
    listDiv.innerHTML = `
  
  <div class="note" onclick="openList(${index})">    
  <i class="fas fa-list"></i> <!-- List Icon -->
     
      <h4>${list.title}${loclIndicator}</h4>
       <span class="list-date">${formattedDate}</span>
   <button class="delete-btn" onclick="deleteList(${index}); event.stopPropagation();">Delete</button>
  </div>
      `;
    container.appendChild(listDiv);
  });
}

// Function to delete a list
function deleteList(index) {
  const list = lists[index];

  // Check if the list has a password
  if (list.password) {
    // Show the password modal for deletion
    document.getElementById("deleteListPasswordModal").style.display =
      "flex";
    document.getElementById("deleteListPasswordModal").dataset.listIndex =
      index; // Set the index here
  } else {
    // If no password is required, confirm deletion
    if (confirm("Are you sure you want to delete this list?")) {
      lists.splice(index, 1); // Remove the list
      localStorage.setItem("lists", JSON.stringify(lists)); // Update local storage
      displayLists(); // Refresh the displayed lists
    }
  }
}

// Function to cancel adding a list

// Call displayLists on page load
displayLists();
displayNotes();    //end of part 3 , code eended , udertand ths code by combiningall three pats 
