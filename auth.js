class Auth {
    constructor() {
        this.users = JSON.parse(localStorage.getItem('users')) || {};
        this.currentUser = null;
        this.init();
    }

    init() {
        const userId = localStorage.getItem('currentUser');
        if (userId && this.users[userId]) {
            this.currentUser = this.users[userId];
        }
    }

    register(username, password, faceDescriptor) {
        if (this.users[username]) {
            throw new Error('Username already exists');
        }

        const user = {
            username,
            password: this.hashPassword(password),
            faceDescriptor,
            notes: [],
            createdAt: new Date().toISOString()
        };

        this.users[username] = user;
        this.saveUsers();
        return true;
    }

    login(username, password) {
        const user = this.users[username];
        if (!user || user.password !== this.hashPassword(password)) {
            throw new Error('Invalid username or password');
        }

        this.currentUser = user;
        localStorage.setItem('currentUser', username);
        return true;
    }

    verifyFace(username, faceDescriptor) {
        const user = this.users[username];
        if (!user || !user.faceDescriptor) {
            throw new Error('User not found or face not registered');
        }

        const savedDescriptor = new Float32Array(user.faceDescriptor);
        const distance = faceapi.euclideanDistance(faceDescriptor, savedDescriptor);
        return distance < 0.45;
    }

    logout() {
        this.currentUser = null;
        localStorage.removeItem('currentUser');
    }

    isLoggedIn() {
        return this.currentUser !== null;
    }

    getCurrentUser() {
        return this.currentUser;
    }

    addNote(title, content) {
        if (!this.currentUser) {
            throw new Error('Not logged in');
        }

        const note = {
            id: Date.now(),
            title,
            content,
            timestamp: new Date().toISOString(),
            isPinned: false,
            isArchived: false
        };

        if (!this.currentUser.notes) {
            this.currentUser.notes = [];
        }

        this.currentUser.notes.push(note);
        this.saveUsers();
        return note;
    }

    deleteNote(noteId) {
        if (!this.currentUser) {
            throw new Error('Not logged in');
        }

        this.currentUser.notes = this.currentUser.notes.filter(note => note.id !== noteId);
        this.saveUsers();
    }

    getUserNotes() {
        return this.currentUser ? (this.currentUser.notes || []) : [];
    }

    saveUsers() {
        localStorage.setItem('users', JSON.stringify(this.users));
    }

    hashPassword(password) {
        return btoa(password);
    }
}

// Create global auth instance
const auth = new Auth();