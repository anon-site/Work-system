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

### 💾 Local Database
- Data stored in browser's local storage
- Persistent across browser sessions
- Edit and update existing entries
- Delete unwanted entries

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

1. **Open the Application**
   - Simply open `index.html` in your web browser

2. **Add Work Entry**
   - Fill in the date, start time, and end time
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

- **Frontend**: HTML5, CSS3, JavaScript (ES6+)
- **Storage**: Browser Local Storage
- **PDF Generation**: jsPDF library
- **Icons**: Font Awesome
- **Responsive**: Mobile-first design

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
