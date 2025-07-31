// Global variables
let currentLanguage = 'en';
let workEntries = [];
let editingId = null;
let db = null; // Database instance

// Check if device is mobile
const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);

// Initialize the application when the DOM is fully loaded
document.addEventListener('DOMContentLoaded', function() {
    initDatabase()
        .then(() => {
            loadFromDatabase();
            setupEventListeners();
            updateCalculations();
            updateSummaryCards();
            renderTable();
            
            // Set today's date as default
            document.getElementById('date').valueAsDate = new Date();
        })
        .catch(error => {
            console.error('Failed to initialize database:', error);
            // Fallback to localStorage if database fails
            loadFromLocalStorage();
            setupEventListeners();
            updateCalculations();
            updateSummaryCards();
            renderTable();
            
            // Set today's date as default
            document.getElementById('date').valueAsDate = new Date();
        });
});

// Event Listeners Setup
function setupEventListeners() {
    // Handle form submission with touch support
    document.getElementById('timeForm').addEventListener('submit', (e) => {
        // Prevent default form submission
        e.preventDefault();
        
        // Show loading state on mobile
        if (isMobile) {
            const submitBtn = document.querySelector('button[type="submit"]');
            const originalText = submitBtn.innerHTML;
            submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Saving...';
            submitBtn.disabled = true;
            
            // Force UI update before processing
            setTimeout(() => {
                handleFormSubmit(e);
                submitBtn.innerHTML = originalText;
                submitBtn.disabled = false;
            }, 50);
        } else {
            handleFormSubmit(e);
        }
    });
    document.getElementById('editForm').addEventListener('submit', handleEditSubmit);
    
    // Time calculations
    document.getElementById('startTime').addEventListener('change', calculateHours);
    document.getElementById('endTime').addEventListener('change', calculateHours);
    document.getElementById('hourlyRate').addEventListener('input', calculateEarnings);
    document.getElementById('withdrawnAmount').addEventListener('input', calculateRemaining);
    
    // Edit form calculations
    document.getElementById('editStartTime').addEventListener('change', calculateEditHours);
    document.getElementById('editEndTime').addEventListener('change', calculateEditHours);
    document.getElementById('editHourlyRate').addEventListener('input', calculateEditEarnings);
    document.getElementById('editWithdrawnAmount').addEventListener('input', calculateEditRemaining);
    
    // Search functionality
    document.getElementById('searchInput').addEventListener('input', handleSearch);
    
    // Modal close on outside click
    document.getElementById('editModal').addEventListener('click', function(e) {
        if (e.target === this) {
            closeEditModal();
        }
    });
}

// Language Management
const translations = {
    en: {
        'Time Tracker Pro': 'Time Tracker Pro',
        'Add Work Entry': 'Add Work Entry',
        'Date': 'Date',
        'Start Time': 'Start Time',
        'End Time': 'End Time',
        'Hours Worked': 'Hours Worked',
        'Hourly Rate (€)': 'Hourly Rate (€)',
        'Total Earnings (€)': 'Total Earnings (€)',
        'Withdrawn Amount (€)': 'Withdrawn Amount (€)',
        'Remaining Amount (€)': 'Remaining Amount (€)',
        'Notes': 'Notes',
        'Save Entry': 'Save Entry',
        'Clear': 'Clear',
        'Work Entries': 'Work Entries',
        'Start': 'Start',
        'End': 'End',
        'Hours': 'Hours',
        'Rate (€)': 'Rate (€)',
        'Earnings (€)': 'Earnings (€)',
        'Withdrawn (€)': 'Withdrawn (€)',
        'Remaining (€)': 'Remaining (€)',
        'Actions': 'Actions',
        'Total Days': 'Total Days',
        'Total Hours': 'Total Hours',
        'Total Earnings': 'Total Earnings',
        'Total Withdrawn': 'Total Withdrawn',
        'Total Remaining': 'Total Remaining',
        'Edit Entry': 'Edit Entry',
        'Update': 'Update',
        'Cancel': 'Cancel',
        'Export PDF': 'Export PDF',
        'Edit': 'Edit',
        'Delete': 'Delete',
        'Search entries...': 'Search entries...',
        'Additional notes...': 'Additional notes...'
    }
};

// Form Handling
function handleFormSubmit(e) {
    e.preventDefault();
    
    const formData = new FormData(e.target);
    const entry = {
        id: Date.now(),
        date: formData.get('date'),
        startTime: formData.get('startTime'),
        endTime: formData.get('endTime'),
        hours: parseFloat(formData.get('hours')),
        hourlyRate: parseFloat(formData.get('hourlyRate')),
        totalEarnings: parseFloat(formData.get('totalEarnings')),
        withdrawnAmount: parseFloat(formData.get('withdrawnAmount')) || 0,
        remainingAmount: parseFloat(formData.get('remainingAmount')),
        notes: formData.get('notes') || ''
    };
    
    workEntries.push(entry);
    
    // Save to database and localStorage
    saveToDatabase()
        .then(() => {
            renderTable();
            updateSummaryCards();
            clearForm();
            showNotification('Entry saved successfully!', 'success');
        })
        .catch(error => {
            console.error('Failed to save to database:', error);
            saveToLocalStorage(); // Fallback to localStorage
            renderTable();
            updateSummaryCards();
            clearForm();
            showNotification('Entry saved successfully!', 'success');
        });
}

function handleEditSubmit(e) {
    e.preventDefault();
    
    const entry = workEntries.find(e => e.id === editingId);
    if (!entry) return;
    
    // Update entry with form data
    entry.date = document.getElementById('editDate').value;
    entry.startTime = document.getElementById('editStartTime').value;
    entry.endTime = document.getElementById('editEndTime').value;
    entry.hourlyRate = parseFloat(document.getElementById('editHourlyRate').value);
    entry.withdrawnAmount = parseFloat(document.getElementById('editWithdrawnAmount').value) || 0;
    entry.notes = document.getElementById('editNotes').value || '';
    
    // Recalculate derived values
    entry.hours = calculateHoursDifference(entry.startTime, entry.endTime);
    entry.totalEarnings = entry.hours * entry.hourlyRate;
    entry.remainingAmount = entry.totalEarnings - entry.withdrawnAmount;
    
    // Save to database and localStorage
    saveToDatabase()
        .then(() => {
            renderTable();
            updateSummaryCards();
            closeEditModal();
            showNotification('Entry updated successfully!', 'success');
        })
        .catch(error => {
            console.error('Failed to update database:', error);
            saveToLocalStorage(); // Fallback to localStorage
            renderTable();
            updateSummaryCards();
            closeEditModal();
            showNotification('Entry updated successfully!', 'success');
        });
}

// Calculations
function calculateHours() {
    const startTime = document.getElementById('startTime').value;
    const endTime = document.getElementById('endTime').value;
    
    if (startTime && endTime) {
        const hours = calculateHoursDifference(startTime, endTime);
        document.getElementById('hours').value = hours;
        calculateEarnings();
    }
}

function calculateEditHours() {
    const startTime = document.getElementById('editStartTime').value;
    const endTime = document.getElementById('editEndTime').value;
    
    if (startTime && endTime) {
        const hours = calculateHoursDifference(startTime, endTime);
        calculateEditEarnings();
    }
}

function calculateHoursDifference(startTime, endTime) {
    const start = new Date(`2000-01-01 ${startTime}`);
    const end = new Date(`2000-01-01 ${endTime}`);
    
    // Handle overnight shifts
    if (end < start) {
        end.setDate(end.getDate() + 1);
    }
    
    const diffMs = end - start;
    const diffHours = diffMs / (1000 * 60 * 60);
    return Math.round(diffHours * 4) / 4; // Round to nearest quarter hour
}

function calculateEarnings() {
    const hours = parseFloat(document.getElementById('hours').value) || 0;
    const hourlyRate = parseFloat(document.getElementById('hourlyRate').value) || 0;
    const totalEarnings = hours * hourlyRate;
    
    document.getElementById('totalEarnings').value = totalEarnings.toFixed(2);
    calculateRemaining();
}

function calculateEditEarnings() {
    const startTime = document.getElementById('editStartTime').value;
    const endTime = document.getElementById('editEndTime').value;
    const hourlyRate = parseFloat(document.getElementById('editHourlyRate').value) || 0;
    
    if (startTime && endTime) {
        const hours = calculateHoursDifference(startTime, endTime);
        calculateEditRemaining();
    }
}

function calculateRemaining() {
    const totalEarnings = parseFloat(document.getElementById('totalEarnings').value) || 0;
    const withdrawnAmount = parseFloat(document.getElementById('withdrawnAmount').value) || 0;
    const remainingAmount = totalEarnings - withdrawnAmount;
    
    document.getElementById('remainingAmount').value = remainingAmount.toFixed(2);
}

function calculateEditRemaining() {
    const startTime = document.getElementById('editStartTime').value;
    const endTime = document.getElementById('editEndTime').value;
    const hourlyRate = parseFloat(document.getElementById('editHourlyRate').value) || 0;
    const withdrawnAmount = parseFloat(document.getElementById('editWithdrawnAmount').value) || 0;
    
    if (startTime && endTime) {
        const hours = calculateHoursDifference(startTime, endTime);
        const totalEarnings = hours * hourlyRate;
        const remainingAmount = totalEarnings - withdrawnAmount;
        // Note: We don't have a field to display this in the edit form, but it's calculated
    }
}

// Table Management
function renderTable() {
    const tbody = document.getElementById('tableBody');
    tbody.innerHTML = '';
    
    if (workEntries.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="10" style="text-align: center; padding: 40px; color: var(--gray-500);">
                    <i class="fas fa-inbox" style="font-size: 2rem; margin-bottom: 10px; display: block;"></i>
                    No entries yet. Add your first work entry above!
                </td>
            </tr>
        `;
        return;
    }
    
    workEntries.forEach(entry => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${formatDate(entry.date)}</td>
            <td>${entry.startTime}</td>
            <td>${entry.endTime}</td>
            <td>${entry.hours}</td>
            <td>€${entry.hourlyRate.toFixed(2)}</td>
            <td>€${entry.totalEarnings.toFixed(2)}</td>
            <td>€${entry.withdrawnAmount.toFixed(2)}</td>
            <td>€${entry.remainingAmount.toFixed(2)}</td>
            <td>${entry.notes}</td>
            <td>
                <div class="action-buttons">
                    <button class="btn btn-edit" onclick="editEntry(${entry.id})">
                        <i class="fas fa-edit"></i>
                        <span>Edit</span>
                    </button>
                    <button class="btn btn-danger" onclick="deleteEntry(${entry.id})">
                        <i class="fas fa-trash"></i>
                        <span>Delete</span>
                    </button>
                </div>
            </td>
        `;
        tbody.appendChild(row);
    });
}

function formatDate(dateString) {
    const date = new Date(dateString);
    return currentLanguage === 'ar' 
        ? date.toLocaleDateString('ar-SA')
        : date.toLocaleDateString('en-GB');
}

// Entry Management
function editEntry(id) {
    const entry = workEntries.find(e => e.id === id);
    if (!entry) return;
    
    editingId = id;
    
    // Populate edit form
    document.getElementById('editId').value = id;
    document.getElementById('editDate').value = entry.date;
    document.getElementById('editStartTime').value = entry.startTime;
    document.getElementById('editEndTime').value = entry.endTime;
    document.getElementById('editHourlyRate').value = entry.hourlyRate;
    document.getElementById('editWithdrawnAmount').value = entry.withdrawnAmount;
    document.getElementById('editNotes').value = entry.notes;
    
    // Show modal
    document.getElementById('editModal').style.display = 'block';
}

function deleteEntry(id) {
    const confirmMessage = currentLanguage === 'en' 
        ? 'Are you sure you want to delete this entry?' 
        : 'Are you sure you want to delete this entry?';
        
    if (confirm(confirmMessage)) {
        workEntries = workEntries.filter(e => e.id !== id);
        
        // Save to database and localStorage
        saveToDatabase()
            .then(() => {
                renderTable();
                updateSummaryCards();
                showNotification('Entry deleted successfully!', 'success');
            })
            .catch(error => {
                console.error('Failed to delete from database:', error);
                saveToLocalStorage(); // Fallback to localStorage
                renderTable();
                updateSummaryCards();
                showNotification('Entry deleted successfully!', 'success');
            });
    }
}

function closeEditModal() {
    document.getElementById('editModal').style.display = 'none';
    editingId = null;
}

// Search Functionality
function handleSearch(e) {
    const searchTerm = e.target.value.toLowerCase();
    const rows = document.querySelectorAll('#tableBody tr');
    
    rows.forEach(row => {
        const text = row.textContent.toLowerCase();
        row.style.display = text.includes(searchTerm) ? '' : 'none';
    });
}

// Summary Cards
function updateSummaryCards() {
    // Calculate total days (unique dates)
    const uniqueDates = new Set(workEntries.map(entry => entry.date));
    const totalDays = uniqueDates.size;
    
    const totalHours = workEntries.reduce((sum, entry) => sum + entry.hours, 0);
    const totalEarnings = workEntries.reduce((sum, entry) => sum + entry.totalEarnings, 0);
    const totalWithdrawn = workEntries.reduce((sum, entry) => sum + entry.withdrawnAmount, 0);
    const totalRemaining = totalEarnings - totalWithdrawn;
    
    // Update the UI
    document.getElementById('totalDays').textContent = totalDays;
    document.getElementById('totalHours').textContent = totalHours.toFixed(2);
    document.getElementById('totalEarningsSum').textContent = `€${totalEarnings.toFixed(2)}`;
    document.getElementById('totalWithdrawn').textContent = `€${totalWithdrawn.toFixed(2)}`;
    document.getElementById('totalRemaining').textContent = `€${totalRemaining.toFixed(2)}`;
}

// Utility Functions
function clearForm() {
    document.getElementById('timeForm').reset();
    document.getElementById('date').valueAsDate = new Date();
}

function updateCalculations() {
    calculateHours();
    calculateEarnings();
    calculateRemaining();
}

// Local Storage Management
function saveToLocalStorage() {
    try {
        localStorage.setItem('timeTrackerEntries', JSON.stringify(workEntries));
        console.log('Saved to localStorage:', workEntries.length, 'entries');
    } catch (e) {
        console.error('Error saving to localStorage:', e);
        // If localStorage is full, try to save a limited number of entries
        if (e.name === 'QuotaExceededError') {
            try {
                // Keep only the most recent 100 entries
                const limitedEntries = workEntries.slice(-100);
                localStorage.setItem('timeTrackerEntries', JSON.stringify(limitedEntries));
                console.warn('LocalStorage full, saved only most recent 100 entries');
            } catch (e2) {
                console.error('Failed to save limited entries to localStorage:', e2);
            }
        }
    }
}

// Database Management
function initDatabase() {
    return new Promise((resolve, reject) => {
        const request = indexedDB.open('TimeTrackerDB', 1);
        
        request.onerror = () => reject(request.error);
        request.onsuccess = () => {
            db = request.result;
            resolve();
        };
        
        request.onupgradeneeded = (event) => {
            const db = event.target.result;
            
            // Create object store for work entries
            if (!db.objectStoreNames.contains('workEntries')) {
                const store = db.createObjectStore('workEntries', { keyPath: 'id', autoIncrement: true });
                store.createIndex('date', 'date', { unique: false });
                store.createIndex('startTime', 'startTime', { unique: false });
                store.createIndex('endTime', 'endTime', { unique: false });
            }
        };
    });
}

function saveToDatabase() {
    // Always save to localStorage as a fallback
    saveToLocalStorage();
    
    if (!db) {
        console.warn('Database not initialized, using localStorage only');
        return Promise.resolve();
    }
    
    return new Promise((resolve, reject) => {
        try {
            const transaction = db.transaction(['workEntries'], 'readwrite');
            const store = transaction.objectStore('workEntries');
            
            // Clear existing entries and save new ones
            const clearRequest = store.clear();
            
            clearRequest.onsuccess = () => {
                if (workEntries.length === 0) {
                    resolve();
                    return;
                }
                
                const addPromises = workEntries.map(entry => {
                    return new Promise((resolveAdd, rejectAdd) => {
                        try {
                            const addRequest = store.add(entry);
                            addRequest.onsuccess = () => resolveAdd();
                            addRequest.onerror = (e) => {
                                console.error('Error adding entry:', e.target.error);
                                rejectAdd(e.target.error);
                            };
                        } catch (e) {
                            console.error('Error in saveToDatabase:', e);
                            rejectAdd(e);
                        }
                    });
                });
                
                Promise.all(addPromises)
                    .then(() => resolve())
                    .catch(error => {
                        console.error('Error in saveToDatabase Promise.all:', error);
                        reject(error);
                    });
            };
            
            clearRequest.onerror = (e) => {
                console.error('Error clearing database:', e.target.error);
                reject(e.target.error);
            };
            
            transaction.onerror = (e) => {
                console.error('Transaction error:', e.target.error);
                reject(e.target.error);
            };
        } catch (e) {
            console.error('Error in saveToDatabase:', e);
            reject(e);
        }
    });
}

function loadFromDatabase() {
    return new Promise((resolve) => {
        if (!db) {
            console.warn('Database not initialized, falling back to localStorage');
            loadFromLocalStorage();
            resolve();
            return;
        }
        
        try {
            const transaction = db.transaction(['workEntries'], 'readonly');
            const store = transaction.objectStore('workEntries');
            const request = store.getAll();
            
            request.onsuccess = () => {
                workEntries = request.result || [];
                console.log('Loaded from database:', workEntries.length, 'entries');
                
                if (workEntries.length === 0) {
                    // Fallback to localStorage if database is empty
                    console.log('No entries in database, checking localStorage...');
                    loadFromLocalStorage();
                } else {
                    renderTable();
                    updateSummaryCards();
                }
                resolve();
            };
            
            request.onerror = (e) => {
                console.error('Error loading from database:', e.target.error);
                // Fallback to localStorage on error
                loadFromLocalStorage();
                resolve();
            };
            
            transaction.onerror = (e) => {
                console.error('Transaction error while loading:', e.target.error);
                // Fallback to localStorage on transaction error
                loadFromLocalStorage();
                resolve();
            };
        } catch (e) {
            console.error('Error in loadFromDatabase:', e);
            // Fallback to localStorage on any error
            loadFromLocalStorage();
            resolve();
        }
    });
}

function loadFromLocalStorage() {
    try {
        const stored = localStorage.getItem('timeTrackerEntries');
        if (stored) {
            workEntries = JSON.parse(stored) || [];
            console.log('Loaded from localStorage:', workEntries.length, 'entries');
            renderTable();
            updateSummaryCards();
        } else {
            console.log('No entries found in localStorage');
            workEntries = [];
            renderTable();
            updateSummaryCards();
        }
    } catch (e) {
        console.error('Error loading from localStorage:', e);
        workEntries = [];
        renderTable();
        updateSummaryCards();
    }
}

// Notification System
function showNotification(message, type = 'info') {
    // Create notification element
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.innerHTML = `
        <i class="fas fa-${type === 'success' ? 'check-circle' : 'info-circle'}"></i>
        <span>${message}</span>
    `;
    
    // Add styles
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: ${type === 'success' ? 'var(--success-color)' : 'var(--primary-color)'};
        color: white;
        padding: 15px 20px;
        border-radius: var(--border-radius);
        box-shadow: var(--shadow-lg);
        z-index: 1001;
        display: flex;
        align-items: center;
        gap: 10px;
        animation: slideInRight 0.3s ease;
    `;
    
    document.body.appendChild(notification);
    
    // Remove after 3 seconds
    setTimeout(() => {
        notification.style.animation = 'slideOutRight 0.3s ease';
        setTimeout(() => {
            if (notification.parentNode) {
                notification.parentNode.removeChild(notification);
            }
        }, 300);
    }, 3000);
}

// Add CSS for notifications
const style = document.createElement('style');
style.textContent = `
    @keyframes slideInRight {
        from {
            transform: translateX(100%);
            opacity: 0;
        }
        to {
            transform: translateX(0);
            opacity: 1;
        }
    }
    
    @keyframes slideOutRight {
        from {
            transform: translateX(0);
            opacity: 1;
        }
        to {
            transform: translateX(100%);
            opacity: 0;
        }
    }
`;
document.head.appendChild(style);

// PDF Export Functionality
function exportToPDF() {
    // Show loading state on mobile
    if (isMobile) {
        const exportBtn = document.querySelector('.export-pdf');
        if (exportBtn) {
            const originalText = exportBtn.innerHTML;
            exportBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Exporting...';
            exportBtn.disabled = true;
            
            // Force UI update before processing
            setTimeout(() => {
                generatePDF();
                exportBtn.innerHTML = originalText;
                exportBtn.disabled = false;
            }, 50);
            return;
        }
    }
    
    generatePDF();
}

// Helper function to generate the PDF
function generatePDF() {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();
    
    // Set up fonts and colors
    doc.setFont('helvetica');
    
    // Header
    doc.setFontSize(20);
    doc.setTextColor(37, 99, 235);
    doc.text('Time Tracker Pro - Work Report', 20, 25);
    
    // Date range
    doc.setFontSize(12);
    doc.setTextColor(100, 100, 100);
    doc.text(`Generated on: ${new Date().toLocaleDateString()}`, 20, 35);
    
    // Summary section
    doc.setFontSize(14);
    doc.setTextColor(0, 0, 0);
    doc.text('Summary', 20, 50);
    
    // Calculate summary values
    const uniqueDates = new Set(workEntries.map(entry => entry.date));
    const totalDays = uniqueDates.size;
    const totalHours = workEntries.reduce((sum, entry) => sum + entry.hours, 0);
    const totalEarnings = workEntries.reduce((sum, entry) => sum + entry.totalEarnings, 0);
    const totalWithdrawn = workEntries.reduce((sum, entry) => sum + entry.withdrawnAmount, 0);
    const totalRemaining = totalEarnings - totalWithdrawn;
    
    // Display summary
    doc.setFontSize(11);
    doc.text(`Total Working Days: ${totalDays}`, 20, 60);
    doc.text(`Total Hours Worked: ${totalHours.toFixed(2)}`, 20, 68);
    doc.text(`Total Earnings: €${totalEarnings.toFixed(2)}`, 20, 76);
    doc.text(`Total Withdrawn: €${totalWithdrawn.toFixed(2)}`, 20, 84);
    doc.text(`Total Remaining: €${totalRemaining.toFixed(2)}`, 20, 92);
    
    // Table data
    if (workEntries.length > 0) {
        const tableData = workEntries.map(entry => [
            formatDate(entry.date),
            entry.startTime,
            entry.endTime,
            entry.hours.toString(),
            `€${entry.hourlyRate.toFixed(2)}`,
            `€${entry.totalEarnings.toFixed(2)}`,
            `€${entry.withdrawnAmount.toFixed(2)}`,
            `€${entry.remainingAmount.toFixed(2)}`,
            entry.notes
        ]);
        
        doc.autoTable({
            head: [['Date', 'Start', 'End', 'Hours', 'Rate', 'Earnings', 'Withdrawn', 'Remaining', 'Notes']],
            body: tableData,
            startY: 95,
            styles: {
                fontSize: 9,
                cellPadding: 3,
            },
            headStyles: {
                fillColor: [37, 99, 235],
                textColor: 255,
                fontStyle: 'bold'
            },
            alternateRowStyles: {
                fillColor: [248, 250, 252]
            },
            columnStyles: {
                0: { cellWidth: 20 },
                1: { cellWidth: 15 },
                2: { cellWidth: 15 },
                3: { cellWidth: 15 },
                4: { cellWidth: 18 },
                5: { cellWidth: 20 },
                6: { cellWidth: 20 },
                7: { cellWidth: 20 },
                8: { cellWidth: 35 }
            }
        });
    } else {
        doc.text('No entries to display', 20, 100);
    }
    
    // Footer
    const pageCount = doc.internal.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        doc.setFontSize(8);
        doc.setTextColor(150, 150, 150);
        doc.text(`Page ${i} of ${pageCount}`, doc.internal.pageSize.width - 30, doc.internal.pageSize.height - 10);
    }
    
    // Save the PDF
    const fileName = `time-tracker-report-${new Date().toISOString().split('T')[0]}.pdf`;
    doc.save(fileName);
    
    showNotification('PDF exported successfully!', 'success');
}
