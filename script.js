let currentFilter = 'all';

// Initialize the app when the DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    // Check login status
    if (!auth.isLoggedIn()) {
        window.location.href = 'login.html';
        return;
    }

    // Display username
    const currentUser = auth.getCurrentUser();
    if (currentUser) {
        const header = document.querySelector('.header p');
        header.textContent = `Welcome back, ${currentUser.username}!`;
    }

    // Set up logout button
    const logoutButton = document.getElementById('logoutButton');
    if (logoutButton) {
        logoutButton.addEventListener('click', handleLogout);
    }

    // Load initial notes
    loadNotes();

    // Set up add note form
    const addNoteButton = document.querySelector('.add-note-container .btn');
    if (addNoteButton) {
        addNoteButton.addEventListener('click', addNote);
    }
});

// Handle logout
function handleLogout() {
    if (confirm('Are you sure you want to logout? You will need to verify your face to login again.')) {
        auth.logout();
        window.location.href = 'login.html';
    }
}

// Add new note
function addNote() {
    const titleInput = document.getElementById('note-title');
    const contentInput = document.getElementById('note-content');
    
    const title = titleInput.value.trim();
    const content = contentInput.value.trim();
    
    if (!title || !content) {
        alert('Please fill in both title and content!');
        return;
    }
    
    try {
        auth.addNote(title, content);
        
        // Clear input fields
        titleInput.value = '';
        contentInput.value = '';
        
        // Refresh notes display
        loadNotes();
    } catch (error) {
        alert(error.message);
    }
}

// Delete note
function deleteNote(noteId) {
    if (confirm('Are you sure you want to delete this note?')) {
        try {
            auth.deleteNote(noteId);
            loadNotes();
        } catch (error) {
            alert(error.message);
        }
    }
}

// Toggle pin status
function togglePin(noteId) {
    const notes = auth.getUserNotes();
    const note = notes.find(n => n.id === noteId);
    
    if (note) {
        note.isPinned = !note.isPinned;
        if (note.isPinned) {
            note.isArchived = false;
        }
        auth.saveUsers();
        loadNotes();
    }
}

// Toggle archive status
function toggleArchive(noteId) {
    const notes = auth.getUserNotes();
    const note = notes.find(n => n.id === noteId);
    
    if (note) {
        note.isArchived = !note.isArchived;
        if (note.isArchived) {
            note.isPinned = false;
        }
        auth.saveUsers();
        loadNotes();
    }
}

// Filter notes
function filterNotes(filter) {
    currentFilter = filter;
    
    // Update active filter button
    document.querySelectorAll('.filter-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    document.querySelector(`.filter-btn[onclick*="${filter}"]`).classList.add('active');
    
    loadNotes();
}

// Load and display notes
function loadNotes() {
    const notesContainer = document.getElementById('notes-container');
    let notes = auth.getUserNotes();
    
    // Apply filter
    switch (currentFilter) {
        case 'pinned':
            notes = notes.filter(note => note.isPinned);
            break;
        case 'archived':
            notes = notes.filter(note => note.isArchived);
            break;
        default:
            notes = notes.filter(note => !note.isArchived);
            break;
    }
    
    // Sort notes (pinned first, then by date)
    notes.sort((a, b) => {
        if (a.isPinned && !b.isPinned) return -1;
        if (!a.isPinned && b.isPinned) return 1;
        return new Date(b.timestamp) - new Date(a.timestamp);
    });
    
    // Clear container
    notesContainer.innerHTML = '';
    
    // Display notes
    notes.forEach(note => {
        const noteElement = document.createElement('div');
        noteElement.className = `note ${note.isPinned ? 'pinned-note' : ''} ${note.isArchived ? 'archived-note' : ''}`;
        noteElement.innerHTML = `
            <div class="action-buttons">
                <button class="action-btn pin-btn" onclick="togglePin(${note.id})" title="${note.isPinned ? 'Unpin' : 'Pin'} note">
                    ${note.isPinned ? '📌' : '📍'}
                </button>
                <button class="action-btn archive-btn" onclick="toggleArchive(${note.id})" title="${note.isArchived ? 'Unarchive' : 'Archive'} note">
                    ${note.isArchived ? '📤' : '📥'}
                </button>
                <button class="action-btn delete-btn" onclick="deleteNote(${note.id})" title="Delete note">×</button>
            </div>
            <h3>${escapeHtml(note.title)}</h3>
            <p>${escapeHtml(note.content)}</p>
            <div class="timestamp">${new Date(note.timestamp).toLocaleString()}</div>
        `;
        notesContainer.appendChild(noteElement);
    });
}

// Helper function to escape HTML
function escapeHtml(unsafe) {
    return unsafe
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}