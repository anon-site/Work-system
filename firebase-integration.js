// Firebase Cloud Database Integration
// This script provides cloud synchronization functionality for the Time Tracker Pro application

class CloudSyncManager {
    constructor() {
        this.isLoggedIn = false;
        this.currentUser = null;
        this.isSyncing = false;
        this.lastSyncTime = null;
        this.unsubscribe = null;
        this.collectionName = 'workEntries';
        
        this.init();
    }

    async init() {
        // Check authentication state
        this.checkAuthState();
        
        // Set up authentication listener
        if (window.authService && window.authService.getCurrentUser) {
            this.setupAuthListener();
        }
    }

    // Authentication Methods
    async checkAuthState() {
        try {
            if (window.authService && window.authService.getCurrentUser) {
                const user = window.authService.getCurrentUser();
                if (user) {
                    this.currentUser = user;
                    this.isLoggedIn = true;
                    this.updateAuthUI();
                    await this.enableCloudSync();
                }
            }
        } catch (error) {
            console.error('Error checking auth state:', error);
        }
    }

    setupAuthListener() {
        // Listen for auth state changes
        if (window.firebase && window.firebase.auth) {
            window.firebase.auth().onAuthStateChanged((user) => {
                if (user) {
                    this.currentUser = user;
                    this.isLoggedIn = true;
                    this.updateAuthUI();
                    this.enableCloudSync();
                } else {
                    this.currentUser = null;
                    this.isLoggedIn = false;
                    this.updateAuthUI();
                    this.disableCloudSync();
                }
            });
        }
    }

    async login(email, password) {
        try {
            this.showSyncStatus('Logging in...', 'syncing');
            const user = await window.authService.signIn(email, password);
            this.currentUser = user;
            this.isLoggedIn = true;
            this.updateAuthUI();
            await this.enableCloudSync();
            this.showSyncStatus('Login successful! Syncing data...', 'success');
            return true;
        } catch (error) {
            console.error('Login error:', error);
            this.showSyncStatus(`Login failed: ${error.message}`, 'error');
            throw error;
        }
    }

    async register(email, password) {
        try {
            this.showSyncStatus('Creating account...', 'syncing');
            const user = await window.authService.signUp(email, password);
            this.currentUser = user;
            this.isLoggedIn = true;
            this.updateAuthUI();
            await this.enableCloudSync();
            this.showSyncStatus('Account created successfully!', 'success');
            return true;
        } catch (error) {
            console.error('Registration error:', error);
            this.showSyncStatus(`Registration failed: ${error.message}`, 'error');
            throw error;
        }
    }

    async logout() {
        try {
            this.showSyncStatus('Logging out...', 'syncing');
            await window.authService.signOut();
            this.currentUser = null;
            this.isLoggedIn = false;
            this.updateAuthUI();
            this.disableCloudSync();
            this.showSyncStatus('Logged out successfully', 'success');
            return true;
        } catch (error) {
            console.error('Logout error:', error);
            this.showSyncStatus(`Logout failed: ${error.message}`, 'error');
            throw error;
        }
    }

    // Cloud Sync Methods
    async enableCloudSync() {
        if (!this.isLoggedIn || !window.databaseService) return;

        try {
            this.showSyncStatus('Enabling cloud sync...', 'syncing');
            
            // Load existing data from cloud
            await this.loadFromCloud();
            
            // Set up real-time listener
            this.setupRealtimeListener();
            
            // Update UI
            this.updateCloudSyncUI(true);
            this.showSyncStatus('Cloud sync enabled', 'success');
            
        } catch (error) {
            console.error('Error enabling cloud sync:', error);
            this.showSyncStatus('Failed to enable cloud sync', 'error');
        }
    }

    disableCloudSync() {
        if (this.unsubscribe) {
            this.unsubscribe();
            this.unsubscribe = null;
        }
        this.updateCloudSyncUI(false);
    }

    async loadFromCloud() {
        if (!this.isLoggedIn || !window.databaseService) return;

        try {
            this.showSyncStatus('Loading data from cloud...', 'syncing');
            
            const cloudData = await window.databaseService.getAllData(this.collectionName);
            
            if (cloudData && cloudData.length > 0) {
                // Merge cloud data with local data
                const mergedData = this.mergeData(cloudData, workEntries);
                workEntries = mergedData;
                
                // Update local storage
                saveToLocalStorage();
                renderTable();
                updateSummaryCards();
                
                this.showSyncStatus(`Loaded ${cloudData.length} entries from cloud`, 'success');
            } else if (workEntries.length > 0) {
                // Upload local data to cloud if cloud is empty
                await this.uploadLocalData();
            }
            
        } catch (error) {
            console.error('Error loading from cloud:', error);
            this.showSyncStatus('Failed to load data from cloud', 'error');
        }
    }

    async uploadLocalData() {
        if (!this.isLoggedIn || !window.databaseService || workEntries.length === 0) return;

        try {
            this.showSyncStatus('Uploading local data...', 'syncing');
            
            for (const entry of workEntries) {
                await window.databaseService.addData(this.collectionName, {
                    ...entry,
                    userId: this.currentUser.uid,
                    synced: true
                });
            }
            
            this.showSyncStatus(`Uploaded ${workEntries.length} entries to cloud`, 'success');
        } catch (error) {
            console.error('Error uploading local data:', error);
            this.showSyncStatus('Failed to upload local data', 'error');
        }
    }

    setupRealtimeListener() {
        if (!this.isLoggedIn || !window.databaseService) return;

        this.unsubscribe = window.databaseService.listenToData(
            this.collectionName,
            (data) => {
                if (data && data.length > 0) {
                    // Filter data for current user
                    const userData = data.filter(entry => 
                        entry.userId === this.currentUser.uid
                    );
                    
                    if (userData.length > 0) {
                        workEntries = userData;
                        saveToLocalStorage();
                        renderTable();
                        updateSummaryCards();
                        this.lastSyncTime = new Date();
                    }
                }
            }
        );
    }

    async saveEntryToCloud(entry) {
        if (!this.isLoggedIn || !window.databaseService) return;

        try {
            this.showSyncStatus('Saving to cloud...', 'syncing');
            
            const cloudEntry = {
                ...entry,
                userId: this.currentUser.uid,
                synced: true
            };

            if (entry.id && entry.id.startsWith('cloud_')) {
                // Update existing cloud entry
                await window.databaseService.updateData(
                    this.collectionName,
                    entry.id.replace('cloud_', ''),
                    cloudEntry
                );
            } else {
                // Add new cloud entry
                const docId = await window.databaseService.addData(
                    this.collectionName,
                    cloudEntry
                );
                entry.id = `cloud_${docId}`;
            }
            
            this.showSyncStatus('Saved to cloud', 'success');
            return entry;
        } catch (error) {
            console.error('Error saving to cloud:', error);
            this.showSyncStatus('Failed to save to cloud', 'error');
            throw error;
        }
    }

    async deleteEntryFromCloud(entryId) {
        if (!this.isLoggedIn || !window.databaseService || !entryId.startsWith('cloud_')) return;

        try {
            this.showSyncStatus('Deleting from cloud...', 'syncing');
            
            await window.databaseService.deleteData(
                this.collectionName,
                entryId.replace('cloud_', '')
            );
            
            this.showSyncStatus('Deleted from cloud', 'success');
        } catch (error) {
            console.error('Error deleting from cloud:', error);
            this.showSyncStatus('Failed to delete from cloud', 'error');
        }
    }

    // Data Management Methods
    mergeData(cloudData, localData) {
        const merged = [...localData];
        
        cloudData.forEach(cloudEntry => {
            const existingIndex = merged.findIndex(localEntry => 
                localEntry.date === cloudEntry.date &&
                localEntry.startTime === cloudEntry.startTime &&
                localEntry.endTime === cloudEntry.endTime
            );
            
            if (existingIndex >= 0) {
                // Update local entry with cloud data if cloud is newer
                if (cloudEntry.timestamp && cloudEntry.timestamp > merged[existingIndex].timestamp) {
                    merged[existingIndex] = { ...cloudEntry, id: `cloud_${cloudEntry.id}` };
                }
            } else {
                // Add new cloud entry
                merged.push({ ...cloudEntry, id: `cloud_${cloudEntry.id}` });
            }
        });
        
        return merged.sort((a, b) => new Date(b.date) - new Date(a.date));
    }

    // UI Update Methods
    updateAuthUI() {
        const authBtn = document.getElementById('authBtn');
        const authBtnText = authBtn.querySelector('span');
        
        if (this.isLoggedIn && this.currentUser) {
            authBtn.classList.add('logged-in');
            authBtnText.textContent = this.currentUser.email;
            authBtn.onclick = () => this.logout();
        } else {
            authBtn.classList.remove('logged-in');
            authBtnText.textContent = currentLanguage === 'ar' ? 'تسجيل الدخول' : 'Login';
            authBtn.onclick = () => toggleAuthModal();
        }
    }

    updateCloudSyncUI(enabled) {
        const cloudSyncBtn = document.getElementById('cloudSyncBtn');
        
        if (enabled) {
            cloudSyncBtn.classList.add('active');
            cloudSyncBtn.title = currentLanguage === 'ar' ? 'مزامنة السحابة مفعلة' : 'Cloud sync enabled';
        } else {
            cloudSyncBtn.classList.remove('active', 'syncing');
            cloudSyncBtn.title = currentLanguage === 'ar' ? 'تفعيل مزامنة السحابة' : 'Enable cloud sync';
        }
    }

    showSyncStatus(message, type = 'info') {
        const syncStatus = document.getElementById('syncStatus');
        const indicator = syncStatus.querySelector('.sync-indicator span');
        const icon = syncStatus.querySelector('.sync-indicator i');
        
        indicator.textContent = message;
        syncStatus.className = `sync-status sync-${type}`;
        syncStatus.style.display = 'flex';
        
        // Auto-hide after 3 seconds
        setTimeout(() => {
            syncStatus.style.display = 'none';
        }, 3000);
    }

    // Utility Methods
    formatTimestamp(timestamp) {
        if (!timestamp) return null;
        return timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    }
}

// Global instance
let cloudSyncManager = null;

// Initialize cloud sync when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    // Wait for Firebase to be ready
    const checkFirebase = setInterval(() => {
        if (window.firebase && window.databaseService && window.authService) {
            clearInterval(checkFirebase);
            cloudSyncManager = new CloudSyncManager();
        }
    }, 100);
});

// Authentication UI Functions
function toggleAuthModal() {
    const modal = document.getElementById('authModal');
    modal.style.display = modal.style.display === 'block' ? 'none' : 'block';
}

function closeAuthModal() {
    document.getElementById('authModal').style.display = 'none';
}

function showLoginTab() {
    document.getElementById('loginForm').style.display = 'block';
    document.getElementById('registerForm').style.display = 'none';
    document.querySelector('.tab-btn.active').classList.remove('active');
    document.querySelector('.tab-btn').classList.add('active');
}

function showRegisterTab() {
    document.getElementById('loginForm').style.display = 'none';
    document.getElementById('registerForm').style.display = 'block';
    document.querySelector('.tab-btn.active').classList.remove('active');
    document.querySelectorAll('.tab-btn')[1].classList.add('active');
}

function toggleCloudSync() {
    if (!cloudSyncManager) {
        showNotification('Cloud sync not ready yet', 'error');
        return;
    }
    
    if (!cloudSyncManager.isLoggedIn) {
        toggleAuthModal();
        return;
    }
    
    if (cloudSyncManager.isSyncing) {
        cloudSyncManager.disableCloudSync();
    } else {
        cloudSyncManager.enableCloudSync();
    }
}

// Form submission override for cloud sync
const originalHandleFormSubmit = handleFormSubmit;
handleFormSubmit = async function(e) {
    e.preventDefault();
    
    const formData = new FormData(document.getElementById('timeForm'));
    const entry = {
        id: Date.now().toString(),
        date: formData.get('date'),
        startTime: formData.get('startTime'),
        endTime: formData.get('endTime'),
        hours: parseFloat(document.getElementById('hours').value),
        hourlyRate: parseFloat(formData.get('hourlyRate')),
        totalEarnings: parseFloat(document.getElementById('totalEarnings').value),
        withdrawnAmount: parseFloat(formData.get('withdrawnAmount') || 0),
        remainingAmount: parseFloat(document.getElementById('remainingAmount').value),
        notes: formData.get('notes'),
        timestamp: new Date().toISOString()
    };
    
    // Add to local data
    workEntries.unshift(entry);
    saveToLocalStorage();
    renderTable();
    updateSummaryCards();
    clearForm();
    
    // Sync to cloud if enabled
    if (cloudSyncManager && cloudSyncManager.isLoggedIn) {
        try {
            await cloudSyncManager.saveEntryToCloud(entry);
        } catch (error) {
            console.error('Failed to sync to cloud:', error);
        }
    }
    
    showNotification(currentLanguage === 'ar' ? 'تم حفظ الإدخال بنجاح!' : 'Entry saved successfully!', 'success');
};

// Delete override for cloud sync
const originalDeleteEntry = deleteEntry;
deleteEntry = async function(id) {
    if (confirm(currentLanguage === 'ar' ? 'هل أنت متأكد من حذف هذا الإدخال؟' : 'Are you sure you want to delete this entry?')) {
        workEntries = workEntries.filter(entry => entry.id !== id);
        saveToLocalStorage();
        renderTable();
        updateSummaryCards();
        
        // Delete from cloud if enabled
        if (cloudSyncManager && cloudSyncManager.isLoggedIn) {
            try {
                await cloudSyncManager.deleteEntryFromCloud(id);
            } catch (error) {
                console.error('Failed to delete from cloud:', error);
            }
        }
        
        showNotification(currentLanguage === 'ar' ? 'تم حذف الإدخال' : 'Entry deleted', 'success');
    }
};

// Event listeners for authentication
if (document.getElementById('loginForm')) {
    document.getElementById('loginForm').addEventListener('submit', async (e) => {
        e.preventDefault();
        const email = document.getElementById('loginEmail').value;
        const password = document.getElementById('loginPassword').value;
        
        try {
            await cloudSyncManager.login(email, password);
            closeAuthModal();
            document.getElementById('loginForm').reset();
        } catch (error) {
            // Error already handled in login method
        }
    });
}

if (document.getElementById('registerForm')) {
    document.getElementById('registerForm').addEventListener('submit', async (e) => {
        e.preventDefault();
        const email = document.getElementById('registerEmail').value;
        const password = document.getElementById('registerPassword').value;
        const confirmPassword = document.getElementById('confirmPassword').value;
        
        if (password !== confirmPassword) {
            showNotification(currentLanguage === 'ar' ? 'كلمات المرور غير متطابقة' : 'Passwords do not match', 'error');
            return;
        }
        
        try {
            await cloudSyncManager.register(email, password);
            closeAuthModal();
            document.getElementById('registerForm').reset();
        } catch (error) {
            // Error already handled in register method
        }
    });
}

// Close modals on outside click
window.addEventListener('click', (e) => {
    if (e.target.classList.contains('modal')) {
        e.target.style.display = 'none';
    }
});
