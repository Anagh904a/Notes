
//part 1 of total code
let notes = JSON.parse(localStorage.getItem("notes")) || [];
let editingNoteIndex = null;
let currentNoteId = null;
let currentDeleteNoteId = null;
let currentItems = []; // Will now store objects like { name: 'item name', checked: true/false }
let editingListIndex = null;
let historyStack = [];
let currentIndex = -1;
let holdTimer = null;
let selectionMode = false;
let selectedNotes = [];
let notesDirectoryHandle = null;





function setupLongPress(element, index) {
  element.addEventListener("mousedown", (e) => {
    holdTimer = setTimeout(() => {
      enterSelectionMode(index);
    }, 500);
  });

  element.addEventListener("mouseup", () => clearTimeout(holdTimer));
  element.addEventListener("mouseleave", () => clearTimeout(holdTimer));
}

function enterSelectionMode(index) {
  selectionMode = true;
  selectedNotes = [index];
 displayNotes();
  showSelectionActions();
}



let backupDirHandle = null;

// Prompt once and store basic reference
async function requestBackupFolder() {
  try {
    backupDirHandle = await window.showDirectoryPicker();
    // Store a flag only (cannot store actual handle directly)
    localStorage.setItem("backupGranted", "true");
    alert("Folder access granted.");
  } catch (err) {
    alert("Storage access denied! Your data may get lost in case of app/browser update.");
  }
}

// Restore backup folder handle (user must re-select)
async function getSavedFolderHandle() {
  if (backupDirHandle) return backupDirHandle;

  const allowed = localStorage.getItem("backupGranted");
  if (!allowed) return null;

  try {
    // Ask again, since no persistent handle storage
    backupDirHandle = await window.showDirectoryPicker();
    return backupDirHandle;
  } catch {
    return null;
  }
}

// Get file handle
async function getBackupFileHandle() {
  const folderHandle = await getSavedFolderHandle();
  if (!folderHandle) return null;

  try {
    return await folderHandle.getFileHandle("backup_data.json", { create: false });
  } catch {
    return null;
  }
}

// Restore data from backup_data.json
async function restoreBackup() {
  const folderHandle = await getSavedFolderHandle();
  if (!folderHandle) {
    alert("Could not access your backup folder.");
    return;
  }

  try {
    const fileHandle = await folderHandle.getFileHandle("backup_data.json");
    const file = await fileHandle.getFile();
    const content = await file.text();
    const data = JSON.parse(content);

    if (data.notes) {
      localStorage.setItem("notes", JSON.stringify(data.notes));
    }
    if (data.lists) {
      localStorage.setItem("lists", JSON.stringify(data.lists));
    }

    alert("Backup restored successfully!");
    location.reload();
  } catch (err) {
    console.error("Restore failed:", err);
    alert("Failed to restore backup.");
  }
}

// Ask for folder and create empty backup file
async function askForBackupFolder() {
  try {
    const folderHandle = await window.showDirectoryPicker();
    localStorage.setItem("backupGranted", "true");
    backupDirHandle = folderHandle;

    const fileHandle = await folderHandle.getFileHandle("backup_data.json", { create: true });
    const writable = await fileHandle.createWritable();
    await writable.write(JSON.stringify({ notes: [], lists: [] }));
    await writable.close();

    alert("Backup folder linked!");
  } catch (err) {
    alert("Storage permission denied. Backup will be unavailable.");
  }
}

// ✅ Auto-restore if no notes/lists
window.addEventListener("DOMContentLoaded", async () => {
  const notes = JSON.parse(localStorage.getItem("notes") || "[]");
  const lists = JSON.parse(localStorage.getItem("lists") || "[]");

  if (notes.length === 0 && lists.length === 0) {
    const backupFile = await getBackupFileHandle();
    if (backupFile) {
      const userWants = confirm("We found your backup. Would you like to restore it?");
      if (userWants) {
        await restoreBackup();
      }
    }
  }
});




document.addEventListener("DOMContentLoaded", function () {
  const toggle = document.getElementById("aiToggle");

  // 🔒 Load saved settings or default to enabled = true
  let scannerSettings = JSON.parse(localStorage.getItem("aiScannerSettings")) || {
    enabled: true,
    lastScan: null
  };

  // ✅ Force default to true if `enabled` is undefined or null
  if (scannerSettings.enabled === undefined || scannerSettings.enabled === null) {
    scannerSettings.enabled = true;
    localStorage.setItem("aiScannerSettings", JSON.stringify(scannerSettings));
  }

  // Set toggle position on page
  toggle.checked = scannerSettings.enabled;

  // 🚀 Run AI scan if enabled
  if (scannerSettings.enabled) {
    startAiScan();
    scannerSettings.lastScan = new Date().toISOString();
    localStorage.setItem("aiScannerSettings", JSON.stringify(scannerSettings));

    setTimeout(() => {
      copyResultsToModal();
      showAiModal(); // Only shows if enabled
    }, 1500);
  }

  // 🔁 Listen for user toggle changes
  toggle.addEventListener("change", function () {
    scannerSettings.enabled = toggle.checked;
    localStorage.setItem("aiScannerSettings", JSON.stringify(scannerSettings));

    if (toggle.checked) {
      startAiScan();
      setTimeout(() => {
        copyResultsToModal();
        showAiModal();
      }, 1500);
    }
  });
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

    function switchTab(tab) {
      const notePanel = document.getElementById('addNoteSection');
      const listPanel = document.getElementById('addListSection');
      const noteTab = document.getElementById('note-tab');
      const checklistTab = document.getElementById('checklist-tab');

      if (tab === 'note') {
        notePanel.style.display = 'block';
        listPanel.style.display = 'none';
        noteTab.classList.add('data-active');
        checklistTab.classList.remove('data-active');
      } else {
        notePanel.style.display = 'none';
        listPanel.style.display = 'block';
        noteTab.classList.remove('data-active');
        checklistTab.classList.add('data-active');
      }
    }

    switchTab('note'); // Default to note tab on load

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

function toggleSelect(index) {
  if (selectedNotes.includes(index)) {
    selectedNotes = selectedNotes.filter(i => i !== index);
  } else {
    selectedNotes.push(index);
  }
}

function showSelectionActions() {
  document.getElementById("selectionBar").classList.remove("hidden");
}

window.addEventListener("load", () => {
  const seen = localStorage.getItem("notesAppOnboarded");
  const overlay = document.getElementById("onboardingOverlay");

  if (!seen && overlay) {
    overlay.style.display = "flex";
  }
});

function applySortFilter() {
  const sortValue = document.getElementById("sortSelect").value;

  const notesContainer = document.getElementById("notesContainer");
  const listsContainerContent = document.getElementById("listsContainerContent");
  
  if (sortValue === "note") {
    // Clear lists
    listsContainerContent.innerHTML = "";
    displayNotes(); // Render only notes
    showSection("combinedContainer");
    console.log("Displaying only notes");
  } else if (sortValue === "lists") {
    // Clear notes
    if (notesContainer) notesContainer.innerHTML = "";
    displayLists(); // Render only lists
    showSection("combinedContainer");
    console.log("Displaying only lists");
  } else if (sortValue === "all") {
   displayNotes();
   displayLists();
    showSection("combinedContainer");
    console.log("Displaying all notes and lists");
  } else if (sortValue === "date_newest" || sortValue === "date_oldest") {
    alert("Sorting by date is disabled in this mode.");
  }
}

// Add click effect that creates ripples
        document.querySelector('.fab').addEventListener('click', function(e) {
            const x = e.clientX - e.target.getBoundingClientRect().left;
            const y = e.clientY - e.target.getBoundingClientRect().top;
            
            const ripple = document.createElement('span');
            ripple.className = 'ripple';
            ripple.style.left = `${x}px`;
            ripple.style.top = `${y}px`;
            
            this.appendChild(ripple);
            
            setTimeout(() => {
                ripple.remove();
            }, 600);
        });


function deleteSelectedNotes() {
  selectedNotes.sort((a, b) => b - a); // delete from end to avoid reindex
  selectedNotes.forEach(i => notes.splice(i, 1));
  localStorage.setItem("notes", JSON.stringify(notes));
  exitSelectionMode();
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

async function autoBackupToFile() {
  if (!backupDirHandle) {
    console.warn("No backup folder selected.");
    return;
  }

  try {
    // Create or replace the backup file
    const fileHandle = await backupDirHandle.getFileHandle("backup_data.json", { create: true });
    const writable = await fileHandle.createWritable();

    await writable.write(JSON.stringify({ notes, lists }));
    await writable.close();

    console.log("Backup updated successfully.");
  } catch (err) {
    console.error("Auto-backup failed:", err);
  }
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

function highlightSearchTerm(text, searchTerm) {
    if (!searchTerm) return text; // If no search term, return the text as is
    const regex = new RegExp(`(${searchTerm})`, 'gi'); // Case insensitive matching
    return text.replace(regex, '<span class="highlight">$1</span>');
}

// Function to display filtered notes and lists with highlights
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
        const noteDate = new Date(note.date); // Convert the stored date string back to a Date object
        const formattedDate = formatDate(noteDate); // Format the date for display
        const lockIndicator = note.password && note.password !== "" ? ' <i class="fas fa-lock"></i>' : "";
        
        const noteAIbutton = !note.password || note.password === "" 
        ? `
        <button class="summarize-btn" 
                data-note-content="${note.content}" 
                data-note-title="${note.title}"
                onclick="handleSummarizeButtonClick(this); event.stopPropagation();">
            <i class="fas fa-magic"></i> Summarize Note
        </button>
        ` 
        : "";
        
        const noteAIbtn = note.password || note.password !== "" 
        ? `
        <button class="summarize-btn" 
        onclick="alert('Locked notes cannot be summarized due to security reasons'); event.stopPropagation();">
            <i class="fas fa-magic"></i> Summarize Note
        </button>
        ` 
        : "";

        // Highlight title with search term
        const highlightedTitle = highlightSearchTerm(note.title, document.getElementById('searchInput').value.toLowerCase());

        noteDiv.innerHTML = `
        <div class="note" onclick="openNote(${index})">
            <div class="note-header">
                <h4>${highlightedTitle}</h4>
                ${lockIndicator}
            </div>
            <span class="note-date">${formattedDate}</span>
            ${noteAIbutton}
            ${noteAIbtn}
            <button class="delete-btn" onclick="deleteNote(${index}); event.stopPropagation();">Delete</button>
        </div>
        `;
        container.appendChild(noteDiv);
    });

    // Display lists
    filteredLists.forEach((list, index) => {
        const listDiv = document.createElement("div");

        // Highlight list name with search term
        const highlightedListName = highlightSearchTerm(list.name, document.getElementById('searchInput').value.toLowerCase());

        listDiv.innerHTML = `
        <div class="note" onclick="openList(${index})">
            <h4>${highlightedListName}</h4>
            <span class="note-date">${list.date || "No date"}</span>
            <button class="delete-btn" onclick="event.stopPropagation(); deleteList(${index})">Delete</button>
        </div>
        `;
        container.appendChild(listDiv);
    });
}

// Function to perform search and display highlighted notes and lists
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

    // Display both with highlights
    displayFilteredNotesAndLists(filteredNotes, filteredLists);
}




// Function to display filtered notes and lists


function toggleSidebar() {
  const sidebar = document.getElementById("sidebar");
  sidebar.classList.toggle("show");
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

function navigateTo(sectionId) {
 document.querySelectorAll(".container").forEach((section) => {
    section.classList.add("hidden"); // Hide all sections
  });
  document.getElementById(sectionId).classList.remove("hidden"); // Show the selected section

  // Manage history stack

  currentSection = sectionId; // Update current section
 closeSidebar(); // Close sidebar if open
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
  showSection("addItemSection"); // Show the add item section
  document.getElementById("noteContent").value = ""; // Clear the note content
  document.getElementById("notePassword").value = ""; // Clear the password input
  switchTab('note'); // Switch to the note tab

  if (editingNoteIndex !== null) {
    // Editing an existing note
    const note = notes[editingNoteIndex]; // Get the note being edited
    document.getElementById("noteTitle").value = note.title; // Set the input value to the note title
    document.getElementById("noteContent").value = note.content; // Set the input value to the note content
   
  } else {
    // Creating a new note
    document.getElementById("noteTitle").value = ""; // Clear the title input
    
  }
  closeAddOptions(); // Close the add options modal
}

function addItemModal() {
  const modal = document.getElementById("addItemModal");
  modal.style.display = "flex"; // Show the modal
}

const sidebar = document.getElementById("sidebar");
const sidebarToggle = document.getElementById("sidebarToggle");

sidebarToggle.addEventListener("click", () => {
  const isVisible = !sidebar.classList.contains("hide-anim");

  if (isVisible) {
    sidebar.classList.remove("show-anim");
    sidebar.classList.add("hide-anim");
    sidebarToggle.setAttribute("aria-expanded", "false");
  } else {
    sidebar.style.display = "flex";
    sidebar.classList.remove("hide-anim");
    void sidebar.offsetWidth; // Trigger reflow
    sidebar.classList.add("show-anim");
    sidebarToggle.setAttribute("aria-expanded", "true");
  }
});

// Close sidebar function for the close button
function closeSidebar() {
  sidebar.classList.remove("show-anim");
  sidebar.classList.add("hide-anim");
  sidebarToggle.setAttribute("aria-expanded", "false");
  setTimeout(() => {
    sidebar.style.display = "none";
  }, 300);
}



function closeAddItemModal() {
  const modal = document.getElementById("addItemModal");
  modal.style.display = "none"; // Hide the modal
}

// Function to cancel note and reset visibility
function cancelNote() {
  const section = document.getElementById("addItemSection");
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
  const date = new Date();
  const formattedDate = formatDate(date);

  if (content === "") {
    showMessageBox("Note content cannot be empty!");
    return;
  }

  if (title === "") {
    suggestTitle(content);
    return;
  }

  // ✅ Create the note object here so it's always defined
  const note = {
    title,
    content,
    password,
    pinned: false,
    date: formattedDate
  };

  if (editingNoteIndex !== null) {
    // Update existing note
    notes[editingNoteIndex] = note;
    showMessageBox("Note updated successfully!");
  } else {
    // Add new note
    notes.push(note);
    showMessageBox("Note saved successfully!");
  }

  // Save to localStorage
  localStorage.setItem('notes', JSON.stringify(notes));

  // Sync to IndexedDB
  syncNoteToIndexedDB(note);

  // Update UI
  displayNotes();
  showSection('combinedContainer');
  document.getElementById("notePasswordModal").classList.add("hidden");

  // Reset editing state
  editingNoteIndex = null;
}


function syncNoteToIndexedDB(note) {
  if (!db) return;
  const syncState = localStorage.getItem("syncEnabled");
  if (syncState !== "true") return;

  if (!note.noteId) {
    note.noteId = `${note.title}-${Date.now()}`;
  }

  const tx = db.transaction("notes", "readwrite");
  tx.objectStore("notes").put(note);
  localStorage.setItem("lastSynced", new Date().toISOString());
updateLastSyncedDisplay();
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

document.addEventListener("DOMContentLoaded", function () {
    const tabButtons = document.querySelectorAll("#settingsTabs button");

    tabButtons.forEach((button) => {
      button.addEventListener("click", function () {
        // Remove 'active' from all buttons
        tabButtons.forEach((btn) => btn.classList.remove("active"));

        // Add 'active' to the clicked button
        this.classList.add("active");

        // OPTIONAL: Call showSection or handle tab content switching here
        // Example: showSection(this.dataset.target);
      });
    });
  });

  async function hashPassword(password) {
  const encoder = new TextEncoder();
  const data = encoder.encode(password);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, "0")).join("");
}

async function setMasterPassword(password) {
  const hashed = await hashPassword(password);
  localStorage.setItem("masterPasswordHash", hashed);
  alert("This Feature Is under Development and don't work properly yet");
  showMessageBox("Master password set unsuccessfully!"); // Show success message
}

function isMasterPasswordSet() {
  return localStorage.getItem("masterPasswordHash") !== null;
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
     const noteAIbutton = !note.password || note.password === "" 
  ? `
    <button class="summarize-btn" 
            data-note-content="${note.content}" 
            data-note-title="${note.title}"
            onclick="handleSummarizeButtonClick(this); event.stopPropagation();">
        <i class="fas fa-magic"></i> Summarize Note
    </button>
  ` 
  : "";
  const noteAIbtn = note.password || note.password !== "" 
  ? `
    <button class="summarize-btn" 
    onclick="alert('Locked notes cannot be summarized due to security reasons'); event.stopPropagation();">
        <i class="fas fa-magic"></i> Summarize Note
    </button>
  ` 
  : "";
    noteDiv.innerHTML = `
   
 <div class="note" onclick="openNote(${index})">
  <div class="note-header">
    <h4>${note.title}</h4>
    ${lockIndicator}

  </div>
  <span class="note-date">${formattedDate}</span>
 ${noteAIbutton}
  ${noteAIbtn}
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

function formatSyncTime(date) {
  const now = new Date();
  const diff = now - date;

  if (diff < 60000) {
    return "Just now";
  }

  const options = {
    hour: 'numeric',
    minute: 'numeric',
    hour12: true
  };

  const isToday = now.toDateString() === date.toDateString();
  return isToday 
    ? `Today at ${date.toLocaleTimeString([], options)}`
    : date.toLocaleString([], options);
}



const GEMINI_API_KEY = "AIzaSyD2BMm3Fx16VYcF_tCYcDsEJnuSmW-wG6I"; 

// Base URL for Gemini API (gemini-2.0-flash model)
const GEMINI_API_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_API_KEY}`;




// --- Utility function to make Gemini API calls ---
async function callGeminiAPI(prompt, featureName = "AI Feature") {
    try {
        const chatHistory = [{ role: "user", parts: [{ text: prompt }] }];
        const payload = { contents: chatHistory };

        showMessageBox(`Applying ${featureName}...`, 0); // Show loading indefinitely (duration 0)

        const response = await fetch(GEMINI_API_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        const result = await response.json();
        
        // Hide loading message after response
        showMessageBox("", 1); // Hide immediately by sending an empty message and small duration

        if (response.ok && result.candidates && result.candidates.length > 0 &&
            result.candidates[0].content && result.candidates[0].content.parts &&
            result.candidates[0].content.parts.length > 0) {
            const text = result.candidates[0].content.parts[0].text;
            showMessageBox(`${featureName} successful!`, 2000);
            return text;
        } else {
            // Check for specific error messages from the API
            const errorDetail = result.error ? result.error.message : 'Unknown error or no content.';
            showMessageBox(`Error with ${featureName}: ${errorDetail}`, 4000);
            console.error(`Gemini API Error for ${featureName}:`, result);
            return null;
        }
    } catch (error) {
        showMessageBox(`Network error for ${featureName}: ${error.message}`, 4000);
        console.error(`Fetch error for ${featureName}:`, error);
        return null;
    }
}

// --- Specific AI Feature Functions ---

async function summarizeNoteWithAI(textToSummarize) {
    const prompt = `Summarize the following text concisely:\n\n${textToSummarize}`;
    return await callGeminiAPI(prompt, "Note Summary");
}



// --- Event Listeners for AI Feature Toggles ---


    

async function handleSummarizeButtonClick(buttonElement) {
    const noteContentTextarea = document.getElementById('noteContent');
    const noteTitle = buttonElement.getAttribute('data-note-title') || "Sample Note"; // Get title from data attribute
    const contentToSummarize = buttonElement.getAttribute('data-note-content'); 
            
    if (contentToSummarize) {
        showMessageBox("Summarizing this note...", 0); // Show loading
        const summarizedText = await summarizeNoteWithAI(contentToSummarize); // Pass the note's content
        showMessageBox("AI is doing it's job!", 1); // Hide loading
        
        if (summarizedText) {
            // Display summarized content in showMessageBox
            alert(`Summary of "${noteTitle}": ${summarizedText}`, 10000); // Show for longer duration
        } else {
            showMessageBox("Failed to summarize note.", 3000);
        }
    } else {
        showMessageBox("No content found to summarize for this note.", 3000);
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
  syncListToIndexedDB();
  syncNoteToIndexedDB(); // Sync notes to IndexedDB on load
});

function showListsSection() {
  showSection("combinedContainer"); // Show the lists container
  displayLists(); // Refresh the displayed lists
  document.getElementById("addItemSection").classList.add("hidden"); // Ensure add list section is hidden
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
  
  showSection("addItemSection"); // Show the add item section
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
  syncNoteToIndexedDB(note);
}


function closeDeletePasswordModal() {
  document.getElementById("deletePasswordModal").style.display = "none"; // Hide the modal
  document.getElementById("deletePasswordInput").value = ""; // Clear the input
  document.getElementById('passwordModal').style.display = 'none';
}

function closeAddListSection() {
  document.getElementById("addItemSection").classList.add("hidden"); // Hide the add list section
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
  document.getElementById("addItemSection").classList.remove("hidden"); // Show the add list section
document.getElementById("addListSection").style.display = "block"; // Show the add list section
document.getElementById("addNoteSection").style.display = "none"; // Show the add list section
switchTab('checklist'); // Switch to the add list tab
  if (editingListIndex !== null) {
    const list = lists[editingListIndex]; // Get the list being edited
    document.getElementById("listTitle").value = list.title; // Set the input value to the list title
    currentItems = list.items.slice(); // Copy items to currentItems
    displayChecklist(); // Display the checklist with items
    
  } else {
    // Reset for new list
    document.getElementById("listTitle").value = ""; // Clear the title input
   
    currentItems = []; // Reset current items
    displayChecklist(); // Clear the checklist display
  }

  closeAddOptions(); // Close any open options
}

// Function to cancel adding a list
function cancelList() {
  // Hide the add list section and show the lists section
  document.getElementById("addItemSection").classList.add("hidden"); // Hide the add list section
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
syncListToIndexedDB(listData);
}

function syncListToIndexedDB(listData) {
  console.log("Trying to sync list to IndexedDB...");

  if (!db) return;
  const syncState = localStorage.getItem("syncEnabled");
  if (syncState !== "true") return;

  if (!listData.listId) {
    listData.listId = `${listData.title}-${Date.now()}`;
  }

  const tx = db.transaction("lists", "readwrite");
  tx.objectStore("lists").put(listData);
  localStorage.setItem("lastSynced", new Date().toISOString());
updateLastSyncedDisplay();
}

function updateLastSyncedDisplay() {
  const div = document.getElementById("lastSyncedStatus");
  const lastSynced = localStorage.getItem("lastSynced");

  if (!div) return;

  if (!lastSynced) {
    div.innerText = "🕒 Last Synced: Never";
    return;
  }

  const syncedDate = new Date(lastSynced);
  div.innerText = "🕒 Last Synced: " + formatSyncTime(syncedDate);
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

function restoreFromIndexedDB() {
  const overlay = document.getElementById("restoreOverlay");
  overlay.style.display = "flex"; // Show overlay

  // Add a delay for realism (simulate restore delay)
  setTimeout(() => {
    // === Restore notes ===
    const tx1 = db.transaction("notes", "readonly");
    const store1 = tx1.objectStore("notes");

    const notes = [];
    store1.openCursor().onsuccess = function (e) {
      const cursor = e.target.result;
      if (cursor) {
        notes.push(cursor.value);
        cursor.continue();
      } else {
        localStorage.setItem("notes", JSON.stringify(notes));

        // === Restore lists ===
        const tx2 = db.transaction("lists", "readonly");
        const store2 = tx2.objectStore("lists");

        const lists = [];
        store2.openCursor().onsuccess = function (e) {
          const cursor = e.target.result;
          if (cursor) {
            lists.push(cursor.value);
            cursor.continue();
          } else {
            localStorage.setItem("lists", JSON.stringify(lists));

            // Done restoring
            overlay.style.display = "none"; // Hide overlay
            showMessageBox("Notes and Lists restored from Server!");
          }
        };
      }
    };
  }, 10000); // Delay of 1 second for visual effect
}

document.addEventListener("DOMContentLoaded", () => {
  updateLastSyncedDisplay();
});


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
  <i class="fas fa-list"></i>
  <div class="note-header">
    <h4>${list.title}</h4>
    ${loclIndicator}
    </div>
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
  syncListToIndexedDB(list);
}

function toggleSync(el) {
  const isEnabled = el.checked;
  localStorage.setItem("syncEnabled", isEnabled ? "true" : "false");

  // Optional feedback
  const status = document.getElementById("syncStatus");
  if (status) {
    status.innerText = isEnabled ? "✅ Sync is ON" : "🔄 Sync is OFF";
  }
}

document.addEventListener("DOMContentLoaded", () => {
  const syncToggle = document.getElementById("syncToggle");
  const syncState = localStorage.getItem("syncEnabled");

  if (syncToggle) {
    if (syncState === null || syncState === "true") {
      syncToggle.checked = true;
    } else {
      syncToggle.checked = false;
    }

    // Optional: set visual text
    const status = document.getElementById("syncStatus");
    if (status) {
      status.innerText = syncToggle.checked ? "✅ Sync is ON" : "🔄 Sync is OFF";
    }
  }
});



// Function to cancel adding a list

// Call displayLists on page load
displayLists();
displayNotes();    //end of part 3 , code eended , udertand ths code by combiningall three pats 
