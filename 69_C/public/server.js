 // ===== CONFIGURATION ===== //
 const JSONBIN_API_KEY = "$2a$10$QOxOhmBtQdIGb16mV2A6gO1yGc9DdE2.nCoAzmS5.lZ3KNmgCmB2u";
 const JSONBIN_BIN_ID = "682aa9b88a456b7966a0d12a";
 const PINATA_API_KEY = "dbc7363de36c4ba9eac6";
 const PINATA_SECRET = "8636682e7913e1c952445afb1e62298eb28abdbafd03d894d412a8d47a386379";

 // ===== MAIN CODE ===== //
 document.addEventListener("DOMContentLoaded", async () => {
   // DOM Elements
   const resourceList = document.getElementById("resourceList");
   const sessionList = document.getElementById("sessionList");
   const recordingList = document.getElementById("recordingList");
   const nextSession = document.getElementById("nextSession");
   const tabs = document.querySelectorAll(".tab");
   const tabContents = document.querySelectorAll(".tab-content");
   const searchInput = document.getElementById("searchInput");
   const searchBtn = document.getElementById("searchBtn");
   const subjectFilters = document.querySelectorAll('input[name="subjectFilter"]');

   // State
   let resources = [];
   let sessions = [];
   let recordings = [];
   let exams = [];
   let currentFilter = "all";
   let currentSearchTerm = "";

   // Initialize
   await loadData();
   setupEventListeners();
   updateNextSession();

   // ===== DATA FUNCTIONS ===== //
   async function loadData() {
     try {
       showLoading(true);
       const res = await fetch(`https://api.jsonbin.io/v3/b/${JSONBIN_BIN_ID}/latest`, {
         headers: { "X-Master-Key": JSONBIN_API_KEY }
       });
       const data = await res.json();
       resources = data.record?.resources || [];
       sessions = data.record?.sessions || [];
       recordings = data.record?.recordings || [];
       exams = data.record?.exams || [];
       renderResourceList(filterResources(resources, currentFilter, currentSearchTerm));
       renderSessionList(filterSessions(sessions, currentSearchTerm));
       renderRecordingList(filterRecordings(recordings, currentSearchTerm));
       renderExamList(filterExams(exams, currentSearchTerm));
     } catch (err) {
       console.error("Failed to load data:", err);
       showError("Failed to load data. Please refresh the page.");
     } finally {
       showLoading(false);
     }
   }

   async function saveData() {
     try {
       showLoading(true);
       await fetch(`https://api.jsonbin.io/v3/b/${JSONBIN_BIN_ID}`, {
         method: "PUT",
         headers: {
           "Content-Type": "application/json",
           "X-Master-Key": JSONBIN_API_KEY
         },
         body: JSON.stringify({ resources, sessions, recordings, exams })
       });
     } catch (err) {
       console.error("Failed to save data:", err);
       showError("Failed to save changes. Please try again.");
     } finally {
       showLoading(false);
     }
   }

   // ===== RENDER FUNCTIONS ===== //
   function renderResourceList(resourcesToRender) {
     if (resourcesToRender.length === 0) {
       resourceList.innerHTML = `
         <div class="empty-state">
           <i class="fas fa-book-open"></i>
           <p>No resources found</p>
           ${currentSearchTerm ? `<p class="mt-2">Try a different search term</p>` : ''}
         </div>
       `;
       return;
     }

     resourceList.innerHTML = resourcesToRender.map(resource => `
       <div class="resource-card card" data-subject="${resource.subject}">
         <div class="flex justify-between items-start mb-3">
           <span class="badge ${resource.type === 'file' ? 'badge-file' : 'badge-link'}">
             <i class="fas fa-${resource.type === 'file' ? 'file-alt' : 'link'}"></i> ${resource.type}
           </span>
           <span class="text-muted text-sm">${formatDate(resource.sharedDate)}</span>
         </div>
         <h3>${highlightSearchTerm(resource.name)}</h3>
         ${resource.topic ? `<p class="text-muted"><i class="fas fa-tag"></i> ${highlightSearchTerm(resource.topic)}</p>` : ''}
         <p class="mb-3">${highlightSearchTerm(resource.description)}</p>
         <div class="flex justify-between items-center mt-auto">
           <span class="text-sm"><i class="fas fa-user"></i> ${resource.sharedBy}</span>
           <a href="${resource.url}" ${resource.type === 'file' ? 'download' : 'target="_blank"'}" 
             class="btn btn-primary btn-sm">
             ${resource.type === 'file' ? '<i class="fas fa-download"></i> Download' : '<i class="fas fa-external-link-alt"></i> Open'}
           </a>
         </div>
       </div>
     `).join("");
   }

   function renderSessionList(sessionsToRender) {
    // Sort by date (soonest first)
    sessionsToRender.sort((a, b) => new Date(a.date) - new Date(b.date));
    
    if (sessionsToRender.length === 0) {
        sessionList.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-calendar-times"></i>
                <p>No sessions found</p>
                ${currentSearchTerm ? `<p class="mt-2">Try a different search term</p>` : ''}
            </div>
        `;
        return;
    }

    const now = new Date();
    
    sessionList.innerHTML = sessionsToRender.map(session => {
        const isPastSession = new Date(session.date) < now;
        
        return `
        <div class="session-card card ${session.expanded ? 'expanded' : ''} ${isPastSession ? 'past-session' : ''}" 
             data-session-id="${session.id}" data-subject="${session.subject}">
            <div class="flex justify-between items-start">
                <div>
                    <span class="badge ${isPastSession ? 'badge-session-past' : 'badge-session'}">
                        <i class="fas fa-calendar-check"></i> ${isPastSession ? 'Completed' : 'Session'}
                    </span>
                    <h3 class="mt-2">${highlightSearchTerm(session.topic)}</h3>
                    <p class="text-muted"><i class="fas fa-book"></i> ${capitalize(session.subject)}</p>
                </div>
                <div class="text-right">
                    <p class="font-medium">${formatDateTime(session.date)}</p>
                    <p class="text-muted text-sm"><i class="fas fa-user"></i> ${session.host}</p>
                </div>
            </div>
            
            ${!isPastSession ? `
            <div class="session-details">
                ${session.notes ? `<div class="bg-gray-50 p-3 rounded mt-3">
                    <h4 class="font-medium mb-2"><i class="fas fa-sticky-note"></i> Notes</h4>
                    <p>${session.notes}</p>
                </div>` : ''}
                
                ${session.zoomLink || session.zoomId ? `
                    <div class="bg-gray-50 p-3 rounded mt-3">
                        <h4 class="font-medium mb-2"><i class="fas fa-video"></i> Meeting Details</h4>
                        ${session.zoomLink ? `
                            <p class="mb-2"><a href="${session.zoomLink}" target="_blank" 
                               class="btn btn-primary btn-sm">
                                <i class="fas fa-video"></i> Join Zoom Meeting
                            </a></p>
                        ` : ''}
                        ${session.zoomId ? `<p><strong>ID:</strong> ${session.zoomId}</p>` : ''}
                        ${session.zoomPass ? `<p><strong>Password:</strong> ${session.zoomPass}</p>` : ''}
                    </div>
                ` : ''}
                
                <div class="flex justify-end mt-3">
                    <button class="btn btn-outline btn-sm close-session-details">
                        <i class="fas fa-times"></i> Close
                    </button>
                </div>
            </div>
            ` : ''}
        </div>
        `;
    }).join("");
}

   function renderRecordingList(recordingsToRender) {
     if (recordingsToRender.length === 0) {
       recordingList.innerHTML = `
         <div class="empty-state">
           <i class="fas fa-video-slash"></i>
           <p>No recordings found</p>
           ${currentSearchTerm ? `<p class="mt-2">Try a different search term</p>` : ''}
         </div>
       `;
       return;
     }

     recordingList.innerHTML = recordingsToRender.map(recording => `
       <div class="recording-card card" data-subject="${recording.subject}">
         <div class="flex justify-between items-start mb-3">
           <span class="badge badge-recording">
             <i class="fas fa-video"></i> Recorded
           </span>
           <span class="text-muted text-sm">${formatDate(recording.recordedDate)}</span>
         </div>
         
         <div class="video-container">
           <iframe 
             src="https://www.youtube.com/embed/${recording.youtubeId}" 
             frameborder="0" 
             allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
             allowfullscreen>
           </iframe>
         </div>
         
         <h3>${highlightSearchTerm(recording.title)}</h3>
         ${recording.topic ? `<p class="text-muted"><i class="fas fa-tag"></i> ${highlightSearchTerm(recording.topic)}</p>` : ''}
         <p class="mb-3">${highlightSearchTerm(recording.description)}</p>
         
         <div class="flex justify-between items-center mt-auto">
           <span class="text-sm"><i class="fas fa-user"></i> ${recording.recordedBy}</span>
           <a href="https://www.youtube.com/watch?v=${recording.youtubeId}" 
              target="_blank" 
              class="btn btn-danger btn-sm">
             <i class="fab fa-youtube"></i> Watch on YouTube
           </a>
         </div>
       </div>
     `).join("");
   }

   function renderExamList(examsToRender) {
  if (examsToRender.length === 0) {
    examList.innerHTML = `
      <div class="empty-state">
        <i class="fas fa-clipboard-question"></i>
        <p>No exams found</p>
        ${currentSearchTerm ? `<p class="mt-2">Try a different search term</p>` : ''}
      </div>
    `;
    return;
  }

  // Sort by date (soonest first)
  examsToRender.sort((a, b) => new Date(a.date) - new Date(b.date));

  examList.innerHTML = examsToRender.map(exam => {
    const now = new Date();
    const examDate = new Date(exam.date);
    const isPast = examDate < now;
    
    let badgeClass, badgeIcon;
    switch(exam.type) {
      case 'quiz':
        badgeClass = 'badge-quiz';
        badgeIcon = 'fa-question-circle';
        break;
      case 'mid':
        badgeClass = 'badge-mid';
        badgeIcon = 'fa-book-open';
        break;
      case 'final':
        badgeClass = 'badge-final';
        badgeIcon = 'fa-award';
        break;
      case 'assignment':
        badgeClass = 'badge-assignment';
        badgeIcon = 'fa-tasks';
        break;
      case 'presentation':
        badgeClass = 'badge-presentation';
        badgeIcon = 'fa-presentation';
        break;
      default:
        badgeClass = 'badge-exam-other';
        badgeIcon = 'fa-clipboard-list';
    }

    return `
      <div class="card exam-card ${isPast ? 'past-session' : ''}" data-exam-id="${exam.id}" data-subject="${exam.subject}">
        <div class="flex justify-between items-start">
          <div>
            <span class="badge ${badgeClass}">
              <i class="fas ${badgeIcon}"></i> ${capitalize(exam.type)}
            </span>
            <h3 class="mt-2">${highlightSearchTerm(exam.title)}</h3>
            <p class="text-muted"><i class="fas fa-book"></i> ${capitalize(exam.subject)}</p>
          </div>
          <div class="text-right">
            <p class="font-medium">${formatDateTime(exam.date)}</p>
            ${exam.duration ? `<p class="text-muted text-sm"><i class="fas fa-clock"></i> ${exam.duration}</p>` : ''}
          </div>
        </div>
        
        ${!isPast ? `
          <div class="exam-timer" id="timer-${exam.id}">
            ${getCountdownText(exam.date)}
          </div>
        ` : ''}
        
        <div class="flex justify-end">
          <button class="btn btn-outline btn-sm view-exam-details" data-exam-id="${exam.id}">
            <i class="fas fa-info-circle"></i> Details
          </button>
        </div>
      </div>
    `;
  }).join("");

  // Start countdown timers for upcoming exams
  examsToRender.filter(exam => new Date(exam.date) > new Date()).forEach(exam => {
    startCountdownTimer(exam.id, exam.date);
  });
}

   function updateNextSession() {
     const upcomingSessions = sessions.filter(session => new Date(session.date) > new Date());
     
     if (upcomingSessions.length > 0) {
       // Find the next session (closest to current date)
       const next = upcomingSessions.reduce((closest, session) => {
         return (!closest || new Date(session.date) < new Date(closest.date)) ? session : closest;
       }, null);
       
       if (next) {
         nextSession.innerHTML = `
           <div class="card">
             <div class="flex items-center gap-3 mb-3">
               <span class="badge badge-session">
                 <i class="fas fa-calendar-star"></i> Up Next
               </span>
               <span class="text-sm text-muted">${formatRelativeDate(next.date)}</span>
             </div>
             <h3>${next.topic}</h3>
             <p class="text-muted"><i class="fas fa-book"></i> ${capitalize(next.subject)}</p>
             <p class="mt-2"><i class="fas fa-user"></i> Hosted by ${next.host}</p>
             ${next.zoomLink ? `
               <a href="${next.zoomLink}" target="_blank" class="btn btn-primary w-full mt-3">
                 <i class="fas fa-video"></i> Join Zoom Meeting
               </a>
             ` : ''}
           </div>
         `;
         return;
       }
     }
     
     nextSession.innerHTML = `<div class="card text-center py-4 text-muted">
       <i class="fas fa-calendar-times fa-2x mb-2"></i>
       <p>No upcoming sessions</p>
     </div>`;
   }

   // ===== FILTER & SEARCH FUNCTIONS ===== //
   function filterResources(resources, filter, searchTerm = "") {
     let filtered = [...resources];
     
     // Apply subject filter
     if (filter !== "all") {
       filtered = filtered.filter(resource => resource.subject === filter);
     }
     
     // Apply search term
     if (searchTerm) {
       const term = searchTerm.toLowerCase();
       filtered = filtered.filter(resource => 
         resource.name.toLowerCase().includes(term) ||
         resource.description.toLowerCase().includes(term) ||
         (resource.topic && resource.topic.toLowerCase().includes(term)) ||
         resource.sharedBy.toLowerCase().includes(term)
       );
     }
     
     return filtered;
   }

   function filterSessions(sessions, searchTerm = "") {
     let filtered = [...sessions];
     
     // Apply search term
     if (searchTerm) {
       const term = searchTerm.toLowerCase();
       filtered = filtered.filter(session => 
         session.topic.toLowerCase().includes(term) ||
         session.host.toLowerCase().includes(term) ||
         (session.notes && session.notes.toLowerCase().includes(term))
       );
     }
     
     return filtered;
   }

   function filterRecordings(recordings, searchTerm = "") {
     let filtered = [...recordings];
     
     // Apply search term
     if (searchTerm) {
       const term = searchTerm.toLowerCase();
       filtered = filtered.filter(recording => 
         recording.title.toLowerCase().includes(term) ||
         recording.description.toLowerCase().includes(term) ||
         (recording.topic && recording.topic.toLowerCase().includes(term)) ||
         recording.recordedBy.toLowerCase().includes(term)
       );
     }
     
     return filtered;
   }

   function highlightSearchTerm(text) {
     if (!currentSearchTerm || !text) return text;
     
     const term = currentSearchTerm.toLowerCase();
     const lowerText = text.toLowerCase();
     const startIndex = lowerText.indexOf(term);
     
     if (startIndex === -1) return text;
     
     const endIndex = startIndex + term.length;
     return (
       text.substring(0, startIndex) +
       `<span style="background-color: #fff9c4;">${text.substring(startIndex, endIndex)}</span>` +
       text.substring(endIndex)
     );
   }

   // ===== EVENT HANDLERS ===== //
   function setupEventListeners() {
     // Tab switching
     tabs.forEach(tab => {
       tab.addEventListener("click", () => {
         tabs.forEach(t => t.classList.remove("active"));
         tabContents.forEach(c => c.classList.remove("active"));
         
         tab.classList.add("active");
         document.getElementById(`${tab.dataset.tab}Tab`).classList.add("active");
       });
     });


     // Inside your setupEventListeners function:
const toggleFiltersBtn = document.getElementById("toggleFilters");
const filterOptions = document.getElementById("filterOptions");

// Set initial state (hidden)
filterOptions.classList.add("collapsed");
toggleFiltersBtn.classList.add("collapsed");

toggleFiltersBtn.addEventListener("click", () => {
  filterOptions.classList.toggle("collapsed");
  toggleFiltersBtn.classList.toggle("collapsed");
  
  // Rotate the chevron icon
  const icon = toggleFiltersBtn.querySelector("i");
  if (filterOptions.classList.contains("collapsed")) {
    icon.style.transform = "rotate(-90deg)";
  } else {
    icon.style.transform = "rotate(0deg)";
  }
});

     // Resource modal
     document.getElementById("addResourceBtn").addEventListener("click", () => {
       document.getElementById("resourceModal").style.display = "flex";
     });

     // Session modal
     document.getElementById("addSessionBtn").addEventListener("click", () => {
       document.getElementById("sessionModal").style.display = "flex";
     });

     // Recording modal
     document.getElementById("addRecordingBtn").addEventListener("click", () => {
       document.getElementById("recordingModal").style.display = "flex";
     });

     document.getElementById("addExamBtn").addEventListener("click", () => {
      document.getElementById("examModal").style.display = "flex";
     });

     // Close modals
     document.querySelectorAll(".close-btn, .close-modal").forEach(btn => {
       btn.addEventListener("click", () => {
         document.querySelectorAll(".modal").forEach(modal => {
           modal.style.display = "none";
         });
       });
     });

     // Resource type toggle
     document.getElementById("resourceType").addEventListener("change", function() {
       document.getElementById("fileUploadGroup").style.display = 
         this.value === "file" ? "block" : "none";
       document.getElementById("linkInputGroup").style.display = 
         this.value === "link" ? "block" : "none";
     });

     // Form submissions
     document.getElementById("resourceForm").addEventListener("submit", async (e) => {
       e.preventDefault();
       await addResource();
     });

     document.getElementById("sessionForm").addEventListener("submit", async (e) => {
       e.preventDefault();
       await addSession();
     });

     document.getElementById("recordingForm").addEventListener("submit", async (e) => {
       e.preventDefault();
       await addRecording();
     });

     document.getElementById("examForm").addEventListener("submit", async (e) => {
       e.preventDefault();
       await addExam();
     });


     // Session card click (expand details)
     document.addEventListener("click", (e) => {
       const sessionCard = e.target.closest(".session-card");
       const closeBtn = e.target.closest(".close-session-details");
       
       if (sessionCard && !closeBtn) {
         const sessionId = sessionCard.dataset.sessionId;
         sessions = sessions.map(session => ({
           ...session,
           expanded: session.id === sessionId ? !session.expanded : false
         }));
         renderSessionList(filterSessions(sessions, currentSearchTerm));
       }
       
       if (closeBtn) {
         const sessionCard = closeBtn.closest(".session-card");
         const sessionId = sessionCard.dataset.sessionId;
         sessions = sessions.map(session => ({
           ...session,
           expanded: session.id === sessionId ? false : session.expanded
         }));
         renderSessionList(filterSessions(sessions, currentSearchTerm));
       }
       
     });

     

     // Search functionality
     searchBtn.addEventListener("click", performSearch);
     searchInput.addEventListener("keyup", (e) => {
       if (e.key === "Enter") performSearch();
     });

     // Subject filter changes
     subjectFilters.forEach(filter => {
       filter.addEventListener("change", (e) => {
         currentFilter = e.target.value;
         renderResourceList(filterResources(resources, currentFilter, currentSearchTerm));
       });
     });
   }

function performSearch() {
  currentSearchTerm = searchInput.value.trim();
  renderResourceList(filterResources(resources, currentFilter, currentSearchTerm));
  renderSessionList(filterSessions(sessions, currentSearchTerm));
  renderRecordingList(filterRecordings(recordings, currentSearchTerm));
  renderExamList(filterExams(exams, currentSearchTerm));
}

   // ===== CORE FUNCTIONS ===== //
   async function addResource() {
     const type = document.getElementById("resourceType").value;
     const subject = document.getElementById("resourceSubject").value;
     const topic = document.getElementById("resourceTopic").value;
     const description = document.getElementById("resourceDescription").value;
     const sharedBy = document.getElementById("sharedBy").value;
     
     // Validate required fields
     if (!type || !subject || !description || !sharedBy) {
       showError("Please fill in all required fields");
       return;
     }

     let name, url;

     // Show loading state
     const submitBtn = document.getElementById("resourceSubmitBtn");
     const submitText = document.getElementById("resourceSubmitText");
     const spinner = document.getElementById("resourceSpinner");
     
     submitBtn.disabled = true;
     submitText.textContent = type === "file" ? "Uploading..." : "Sharing...";
     spinner.style.display = "inline-block";

     try {
       if (type === "file") {
         const fileInput = document.getElementById("fileUpload");
         if (fileInput.files.length === 0) {
           showError("Please select a file");
           return;
         }

         try {
           const formData = new FormData();
           formData.append("file", fileInput.files[0]);

           const response = await fetch("https://api.pinata.cloud/pinning/pinFileToIPFS", {
             method: "POST",
             headers: {
               "pinata_api_key": PINATA_API_KEY,
               "pinata_secret_api_key": PINATA_SECRET
             },
             body: formData
           });

           if (!response.ok) {
             throw new Error("Upload failed");
           }

           const data = await response.json();
           url = `https://gateway.pinata.cloud/ipfs/${data.IpfsHash}`;
           name = fileInput.files[0].name;
         } catch (error) {
           console.error("IPFS upload failed:", error);
           showError("File upload failed. Try again or share a link instead.");
           return;
         }
       } else {
         url = document.getElementById("resourceLink").value;
         if (!url) {
           showError("Please enter a valid URL");
           return;
         }
         if (!url.startsWith("http")) {
           url = "https://" + url;
         }
         name = new URL(url).hostname;
       }

       const newResource = {
         id: Date.now().toString(),
         type,
         name,
         url,
         subject,
         topic,
         description,
         sharedBy,
         sharedDate: new Date().toISOString()
       };

       resources.unshift(newResource);
       await saveData();
       renderResourceList(filterResources(resources, currentFilter, currentSearchTerm));
       document.getElementById("resourceModal").style.display = "none";
       document.getElementById("resourceForm").reset();
     } finally {
       submitBtn.disabled = false;
       submitText.textContent = "Share Resource";
       spinner.style.display = "none";
     }
   }

   async function addSession() {
     const topic = document.getElementById("sessionTopic").value;
     const subject = document.getElementById("sessionSubject").value;
     const date = document.getElementById("sessionDate").value;
     const zoomLink = document.getElementById("zoomLink").value;
     const zoomId = document.getElementById("zoomId").value;
     const zoomPass = document.getElementById("zoomPass").value;
     const host = document.getElementById("sessionHost").value;
     const notes = document.getElementById("sessionNotes").value;

     // Validate required fields
     if (!topic || !subject || !date || !host) {
       showError("Please fill in all required fields");
       return;
     }

     // Show loading state
     const submitBtn = document.getElementById("sessionSubmitBtn");
     const submitText = document.getElementById("sessionSubmitText");
     const spinner = document.getElementById("sessionSpinner");
     
     submitBtn.disabled = true;
     submitText.textContent = "Scheduling...";
     spinner.style.display = "inline-block";

     try {
       const newSession = {
         id: Date.now().toString(),
         topic,
         subject,
         date,
         zoomLink,
         zoomId,
         zoomPass,
         host,
         notes,
         createdAt: new Date().toISOString(),
         expanded: false
       };

       sessions.unshift(newSession);
       await saveData();
       renderSessionList(filterSessions(sessions, currentSearchTerm));
       updateNextSession();
       document.getElementById("sessionModal").style.display = "none";
       document.getElementById("sessionForm").reset();
     } finally {
       submitBtn.disabled = false;
       submitText.textContent = "Schedule Session";
       spinner.style.display = "none";
     }
   }

// Add exam function
async function addExam() {
  const type = document.getElementById("examType").value;
  const subject = document.getElementById("examSubject").value;
  const title = document.getElementById("examTitle").value;
  const topics = document.getElementById("examTopics").value;
  const date = document.getElementById("examDate").value;
  const duration = document.getElementById("examDuration").value;
  const location = document.getElementById("examLocation").value;
  const notes = document.getElementById("examNotes").value;

  if (!type || !subject || !title || !date) {
    showError("Please fill in all required fields");
    return;
  }

  const submitBtn = document.getElementById("examSubmitBtn");
  const submitText = document.getElementById("examSubmitText");
  const spinner = document.getElementById("examSpinner");
  
  submitBtn.disabled = true;
  submitText.textContent = "Saving...";
  spinner.style.display = "inline-block";

  try {
    const newExam = {
      id: Date.now().toString(),
      type,
      subject,
      title,
      topics,
      date,
      duration,
      location,
      notes,
      createdAt: new Date().toISOString()
    };

    exams.unshift(newExam);
    await saveData();
    renderExamList(filterExams(exams, currentSearchTerm));
    document.getElementById("examModal").style.display = "none";
    document.getElementById("examForm").reset();
  } finally {
    submitBtn.disabled = false;
    submitText.textContent = "Add Exam";
    spinner.style.display = "none";
  }
}

   async function addRecording() {
     // Get form values
     const title = document.getElementById("recordingTitle").value;
     const subject = document.getElementById("recordingSubject").value;
     const topic = document.getElementById("recordingTopic").value;
     const description = document.getElementById("recordingDescription").value;
     const recordedBy = document.getElementById("recordedBy").value;
     const recordedDate = document.getElementById("recordingDate").value;
     const youtubeUrl = document.getElementById("youtubeUrl").value;
   
     // Validate inputs
     if (!title || !subject || !recordedBy || !recordedDate || !youtubeUrl) {
       showError("Please fill in all required fields");
       return;
     }
   
     // Extract YouTube ID
     const youtubeId = extractYouTubeId(youtubeUrl);
     if (!youtubeId) {
       showError("Please enter a valid YouTube URL");
       return;
     }
   
     // Show loading state
     const submitBtn = document.getElementById("recordingSubmitBtn");
     const submitText = document.getElementById("recordingSubmitText");
     const spinner = document.getElementById("recordingSpinner");
     
     submitBtn.disabled = true;
     submitText.textContent = "Saving...";
     spinner.style.display = "inline-block";

     try {
       const newRecording = {
         id: Date.now().toString(),
         title,
         subject,
         topic,
         description,
         recordedBy,
         recordedDate,
         youtubeId,
         uploadedAt: new Date().toISOString()
       };

       recordings.unshift(newRecording);
       await saveData();
       renderRecordingList(filterRecordings(recordings, currentSearchTerm));
       
       document.getElementById("recordingModal").style.display = "none";
       document.getElementById("recordingForm").reset();
       
       showSuccess("Recording added successfully!");
     } catch (error) {
       console.error("Error saving recording:", error);
       showError("Failed to save recording. Please try again.");
     } finally {
       submitBtn.disabled = false;
       submitText.textContent = "Add Recording";
       spinner.style.display = "none";
     }
   }

   // Helper function to extract YouTube ID from URL
   function extractYouTubeId(url) {
     const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
     const match = url.match(regExp);
     return (match && match[2].length === 11) ? match[2] : null;
   }

   // Helper function to show success messages
   function showSuccess(message) {
     // In a real app, use a proper notification system
     alert(`✅ ${message}`);
   }

   // ===== UTILITY FUNCTIONS ===== //
   function capitalize(str) {
     return str.charAt(0).toUpperCase() + str.slice(1);
   }

   function formatDate(dateString) {
     return new Date(dateString).toLocaleDateString();
   }

   function formatDateTime(dateString) {
     return new Date(dateString).toLocaleString([], {
       weekday: 'short',
       month: 'short',
       day: 'numeric',
       hour: '2-digit',
       minute: '2-digit'
     });
   }

   function formatRelativeDate(dateString) {
     const now = new Date();
     const date = new Date(dateString);
     const diffDays = Math.floor((date - now) / (1000 * 60 * 60 * 24));
     
     if (diffDays === 0) {
       return "Today at " + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
     } else if (diffDays === 1) {
       return "Tomorrow at " + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
     } else if (diffDays > 1 && diffDays < 7) {
       return date.toLocaleDateString([], { weekday: 'long', hour: '2-digit', minute: '2-digit' });
     } else {
       return formatDateTime(dateString);
     }
   }

   function showLoading(isLoading) {
     // You could add a global loading spinner if needed
   }

   function showError(message) {
     alert(message); // In a real app, you'd use a nicer notification system
   }
 }); 

 // Countdown timer functions
function getCountdownText(targetDate) {
  const now = new Date();
  const target = new Date(targetDate);
  const diff = target - now;
  
  if (diff <= 0) return 'Exam time has arrived!';
  
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
  const seconds = Math.floor((diff % (1000 * 60)) / 1000);
  
  return `${days}d ${hours}h ${minutes}m ${seconds}s remaining`;
}

function startCountdownTimer(examId, targetDate) {
  const timerElement = document.getElementById(`timer-${examId}`);
  if (!timerElement) return;
  
  const updateTimer = () => {
    const now = new Date();
    const target = new Date(targetDate);
    const diff = target - now;
    
    if (diff <= 0) {
      timerElement.textContent = 'Exam time has arrived!';
      timerElement.classList.add('expired');
      clearInterval(interval);
      return;
    }
    
    // Add 'soon' class if less than 24 hours remaining
    if (diff < 24 * 60 * 60 * 1000) {
      timerElement.classList.add('exam-timer-soon');
    }
    
    timerElement.textContent = getCountdownText(targetDate);
  };
  
  updateTimer();
  const interval = setInterval(updateTimer, 1000);
}

// Filter function for exams
function filterExams(exams, searchTerm = "") {
  let filtered = [...exams];
  
  if (searchTerm) {
    const term = searchTerm.toLowerCase();
    filtered = filtered.filter(exam => 
      exam.title.toLowerCase().includes(term) ||
      exam.subject.toLowerCase().includes(term) ||
      (exam.topics && exam.topics.toLowerCase().includes(term)) ||
      (exam.notes && exam.notes.toLowerCase().includes(term))
    );
  }
  
  return filtered;
}



