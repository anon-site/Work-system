# Time Tracker Pro

A professional bilingual web application for tracking work hours with Euro currency support and PDF export functionality.

## Features

### 🌍 Bilingual Support
- **English** (default) and **Arabic** language support
- Right-to-left (RTL) layout for Arabic
- Complete UI translation

### 💰 Euro Currency
- All monetary values displayed in Euros (€)
- Automatic calculations for earnings and remaining amounts

### 📊 Data Management
- **Date**: Work date
- **Start/End Time**: Work shift times
- **Hours**: Automatically calculated work duration
- **Hourly Rate**: Pay rate in Euros
- **Total Earnings**: Calculated automatically
- **Withdrawn Amount**: Money taken out
- **Remaining Amount**: Balance remaining
- **Notes**: Additional comments

### ☁️ Cloud Database (NEW!)
- **Firebase Integration**: Data stored in Google Cloud
- **Cross-Device Sync**: Access from any device/browser
- **Real-time Updates**: Changes appear instantly across devices
- **User Authentication**: Secure email/password login
- **Offline Support**: Works offline, syncs when online
- **Automatic Backup**: Never lose your data again

### 💾 Local Database (Fallback)
- Data stored in browser's local storage
- Persistent across browser sessions
- Works without internet connection
- Automatic fallback if cloud sync disabled

### 📄 PDF Export
- Professional PDF reports
- Summary statistics
- Detailed work entries table
- Formatted for printing

### 🎨 Modern UI
- Responsive design for all devices
- Professional gradient styling
- Interactive cards and animations
- Search functionality

## How to Use

### Quick Start (Local Storage)
1. **Open the Application**
   - Simply open `index.html` in your web browser

2. **Add Work Entry**
   - Fill in the date, start time, and end time

### Cloud Setup (Recommended)
1. **Set Up Firebase** (One-time setup)
   - Follow the `FIREBASE_SETUP.md` guide
   - Get your free Firebase configuration

2. **Enable Cloud Sync**
   - Click "Login" in the header
   - Create account or sign in
   - Your data will sync across all devices

3. **Cross-Device Access**
   - Log in with the same account on any device
   - Your data will be available instantly
   - Enter your hourly rate in Euros
   - Hours and earnings are calculated automatically
   - Add any withdrawn amount and notes
   - Click "Save Entry"

3. **View Entries**
   - All entries appear in the table below
   - Summary cards show totals at the bottom

4. **Edit/Delete Entries**
   - Click "Edit" button to modify an entry
   - Click "Delete" button to remove an entry

5. **Switch Language**
   - Click the language toggle button in the header
   - Interface switches between English and Arabic

6. **Export PDF**
   - Click "Export PDF" button in the header
   - Professional report downloads automatically

7. **Search Entries**
   - Use the search box to filter entries
   - Search works across all fields

## Technical Details

- **Frontend**: Pure HTML5, CSS3, JavaScript (ES6+)
- **Database**: 
  - **Cloud**: Firebase Firestore (Google Cloud)
  - **Local**: Browser IndexedDB with localStorage fallback
- **Authentication**: Firebase Auth
- **Styling**: Modern CSS with CSS Grid and Flexbox
- **PDF Generation**: jsPDF library
- **Icons**: Font Awesome 6
- **Responsive**: Mobile-first design
- **Real-time**: Firebase real-time listeners

## Browser Compatibility

- Chrome 60+
- Firefox 55+
- Safari 12+
- Edge 79+

## File Structure

```
├── index.html          # Main HTML file
├── styles.css          # CSS styling
├── script.js           # JavaScript functionality
└── README.md           # This file
```

## Features in Detail

### Automatic Calculations
- Hours are calculated from start/end times
- Supports overnight shifts
- Rounds to nearest quarter hour
- Total earnings = Hours × Hourly Rate
- Remaining amount = Total earnings - Withdrawn amount

### Data Persistence
- All data saved automatically to browser storage
- No server required
- Data persists between sessions
- Import/export capabilities through PDF

### Professional Design
- Modern gradient backgrounds
- Card-based layout
- Smooth animations and transitions
- Professional color scheme
- Print-friendly styling

Enjoy tracking your work hours with Time Tracker Pro! 🚀
