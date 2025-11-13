// Fake event categories and templates
const eventTemplates = {
    medical: [
        "Dentist appointment (can't reschedule)",
        "Physical therapy session",
        "Annual checkup",
        "Dermatologist appointment",
        "Eye doctor appointment",
        "Picking up prescription"
    ],
    family: [
        "Family dinner (can't miss it)",
        "Helping parents with something",
        "Visiting relatives",
        "Family obligation",
        "Babysitting nephew/niece",
        "Taking grandma to appointment"
    ],
    work: [
        "Important work deadline",
        "Team meeting (mandatory)",
        "Client presentation",
        "Performance review",
        "Training session",
        "Covering someone's shift"
    ],
    home: [
        "Plumber coming over",
        "Electrician appointment",
        "Pest control visit",
        "HOA meeting",
        "Apartment inspection",
        "Appliance repair scheduled"
    ],
    personal: [
        "Prior commitment (forgot to mention)",
        "Volunteering at local shelter",
        "Class I'm taking",
        "Study group meeting",
        "Car maintenance appointment",
        "Meeting with financial advisor"
    ],
    social: [
        "Friend's birthday party",
        "Wedding shower",
        "Book club meeting",
        "Catching up with old friend in town",
        "Going away party for coworker",
        "Concert tickets I bought months ago"
    ],
    vague: [
        "This thing I can't get out of",
        "Something I committed to ages ago",
        "That thing I told you about",
        "Conflicting obligation",
        "Another engagement",
        "Pre-existing plans"
    ]
};

// Time slots for events
const timeSlots = [
    "9:00 AM", "10:00 AM", "11:00 AM", "12:00 PM",
    "1:00 PM", "2:00 PM", "3:00 PM", "4:00 PM",
    "5:00 PM", "6:00 PM", "7:00 PM", "8:00 PM"
];

// Store events
let events = {};
let currentDate = new Date();
let displayMonth = new Date();

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    loadEvents();
    renderCalendar();
    updateEventsList();

    // Set today's date as default for query
    document.getElementById('queryDate').valueAsDate = new Date();

    // Event listeners
    document.getElementById('generateBtn').addEventListener('click', generateFakeEvents);
    document.getElementById('clearBtn').addEventListener('click', clearAllEvents);
    document.getElementById('prevMonth').addEventListener('click', () => changeMonth(-1));
    document.getElementById('nextMonth').addEventListener('click', () => changeMonth(1));
    document.getElementById('queryBtn').addEventListener('click', queryDate);
    document.getElementById('exportBtn').addEventListener('click', exportToCalendar);
    document.getElementById('removeBtn').addEventListener('click', generateRemovalFile);

    // Allow Enter key on date input
    document.getElementById('queryDate').addEventListener('keypress', (e) => {
        if (e.key === 'Enter') queryDate();
    });
});

// Generate random fake events
function generateFakeEvents() {
    const numberOfEvents = Math.floor(Math.random() * 15) + 10; // 10-25 events
    const daysAhead = 60; // Generate events for next 60 days

    for (let i = 0; i < numberOfEvents; i++) {
        const daysFromNow = Math.floor(Math.random() * daysAhead);
        const eventDate = new Date();
        eventDate.setDate(eventDate.getDate() + daysFromNow);

        const dateKey = formatDateKey(eventDate);

        // Pick random category and event
        const categories = Object.keys(eventTemplates);
        const category = categories[Math.floor(Math.random() * categories.length)];
        const eventList = eventTemplates[category];
        const eventTitle = eventList[Math.floor(Math.random() * eventList.length)];
        const eventTime = timeSlots[Math.floor(Math.random() * timeSlots.length)];

        // Store event
        if (!events[dateKey]) {
            events[dateKey] = [];
        }

        // Avoid duplicates on same day
        if (!events[dateKey].some(e => e.title === eventTitle)) {
            events[dateKey].push({
                title: eventTitle,
                time: eventTime,
                category: category
            });
        }
    }

    saveEvents();
    renderCalendar();
    updateEventsList();

    showNotification('🎉 Your calendar is now convincingly full!');
}

// Clear all events
function clearAllEvents() {
    if (confirm('Clear all fake obligations?')) {
        events = {};
        saveEvents();
        renderCalendar();
        updateEventsList();
        showNotification('🗑️ Calendar cleared!');
    }
}

// Query specific date
function queryDate() {
    const dateInput = document.getElementById('queryDate');
    const personName = document.getElementById('personName').value.trim();
    const queryDateObj = new Date(dateInput.value);
    const dateKey = formatDateKey(queryDateObj);

    const resultDiv = document.getElementById('queryResult');
    const dayEvents = events[dateKey];

    let response = '';

    if (dayEvents && dayEvents.length > 0) {
        const personPhrase = personName ? ` ${personName}` : '';
        response = `<div class="excuse-box">
            <p class="excuse-intro">Sorry${personPhrase}, I can't that day...</p>`;

        dayEvents.forEach(event => {
            response += `<div class="excuse-item">
                <strong>${event.time}</strong> - ${event.title}
            </div>`;
        });

        response += `<p class="excuse-outro">Maybe another time? 😅</p></div>`;
    } else {
        response = `<div class="excuse-box no-excuse">
            <p>😱 Oh no! You're actually free that day!</p>
            <p>Quick, generate some obligations!</p>
        </div>`;
    }

    resultDiv.innerHTML = response;
    resultDiv.style.display = 'block';
}

// Render calendar
function renderCalendar() {
    const calendar = document.getElementById('calendar');
    const monthTitle = document.getElementById('currentMonth');

    const year = displayMonth.getFullYear();
    const month = displayMonth.getMonth();

    monthTitle.textContent = displayMonth.toLocaleDateString('en-US', {
        month: 'long',
        year: 'numeric'
    });

    // Get first day of month and number of days
    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();

    // Build calendar HTML
    let html = '<div class="calendar-grid">';

    // Day headers
    const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    dayNames.forEach(day => {
        html += `<div class="calendar-day-header">${day}</div>`;
    });

    // Empty cells before first day
    for (let i = 0; i < firstDay; i++) {
        html += '<div class="calendar-cell empty"></div>';
    }

    // Days of month
    for (let day = 1; day <= daysInMonth; day++) {
        const date = new Date(year, month, day);
        const dateKey = formatDateKey(date);
        const isToday = isSameDay(date, currentDate);
        const hasEvents = events[dateKey] && events[dateKey].length > 0;

        let cellClass = 'calendar-cell';
        if (isToday) cellClass += ' today';
        if (hasEvents) cellClass += ' has-events';

        html += `<div class="${cellClass}" data-date="${dateKey}">
            <div class="date-number">${day}</div>`;

        if (hasEvents) {
            html += `<div class="event-indicator">${events[dateKey].length} excuse${events[dateKey].length > 1 ? 's' : ''}</div>`;
        }

        html += '</div>';
    }

    html += '</div>';
    calendar.innerHTML = html;

    // Add click handlers to cells
    document.querySelectorAll('.calendar-cell[data-date]').forEach(cell => {
        cell.addEventListener('click', () => {
            const dateKey = cell.getAttribute('data-date');
            showEventsForDate(dateKey);
        });
    });
}

// Show events for specific date
function showEventsForDate(dateKey) {
    const dayEvents = events[dateKey];
    if (!dayEvents || dayEvents.length === 0) {
        alert('No excuses scheduled for this day!');
        return;
    }

    const date = new Date(dateKey);
    let message = `📅 ${date.toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    })}\n\n`;

    dayEvents.forEach(event => {
        message += `⏰ ${event.time} - ${event.title}\n`;
    });

    alert(message);
}

// Update events list
function updateEventsList() {
    const listDiv = document.getElementById('eventsList');

    // Get upcoming events (next 14 days)
    const upcoming = [];
    for (let i = 0; i < 14; i++) {
        const date = new Date();
        date.setDate(date.getDate() + i);
        const dateKey = formatDateKey(date);

        if (events[dateKey]) {
            events[dateKey].forEach(event => {
                upcoming.push({
                    date: date,
                    dateKey: dateKey,
                    ...event
                });
            });
        }
    }

    if (upcoming.length === 0) {
        listDiv.innerHTML = '<p class="no-events">No excuses scheduled. Generate some!</p>';
        return;
    }

    let html = '<div class="events-grid">';
    upcoming.forEach(event => {
        const dateStr = event.date.toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric'
        });
        html += `<div class="event-card category-${event.category}">
            <div class="event-date">${dateStr}</div>
            <div class="event-time">${event.time}</div>
            <div class="event-title">${event.title}</div>
        </div>`;
    });
    html += '</div>';

    listDiv.innerHTML = html;
}

// Change displayed month
function changeMonth(delta) {
    displayMonth.setMonth(displayMonth.getMonth() + delta);
    renderCalendar();
}

// Utility functions
function formatDateKey(date) {
    return date.toISOString().split('T')[0];
}

function isSameDay(date1, date2) {
    return formatDateKey(date1) === formatDateKey(date2);
}

function saveEvents() {
    localStorage.setItem('gotThisThingEvents', JSON.stringify(events));
}

function loadEvents() {
    const stored = localStorage.getItem('gotThisThingEvents');
    if (stored) {
        events = JSON.parse(stored);
    }
}

function showNotification(message) {
    // Simple notification - could be enhanced
    const notification = document.createElement('div');
    notification.className = 'notification';
    notification.textContent = message;
    document.body.appendChild(notification);

    setTimeout(() => {
        notification.classList.add('show');
    }, 10);

    setTimeout(() => {
        notification.classList.remove('show');
        setTimeout(() => notification.remove(), 300);
    }, 3000);
}

// Calendar Export Functions

// Generate unique event ID
function generateEventId(dateKey, index) {
    return `got-this-thing-${dateKey}-${index}@got-anything-app.com`;
}

// Format date for .ics file (YYYYMMDDTHHMMSSZ)
function formatICSDate(date, time) {
    const [hours, minutes] = parseTime(time);
    const eventDate = new Date(date);
    eventDate.setHours(hours, minutes, 0, 0);

    const year = eventDate.getFullYear();
    const month = String(eventDate.getMonth() + 1).padStart(2, '0');
    const day = String(eventDate.getDate()).padStart(2, '0');
    const hour = String(eventDate.getHours()).padStart(2, '0');
    const minute = String(eventDate.getMinutes()).padStart(2, '0');

    return `${year}${month}${day}T${hour}${minute}00`;
}

// Parse time string to hours and minutes
function parseTime(timeStr) {
    const [time, period] = timeStr.split(' ');
    let [hours, minutes] = time.split(':').map(Number);

    if (period === 'PM' && hours !== 12) hours += 12;
    if (period === 'AM' && hours === 12) hours = 0;

    return [hours, minutes || 0];
}

// Generate .ics file content
function generateICSContent(includeMethod = false) {
    if (Object.keys(events).length === 0) {
        alert('No events to export! Generate some fake obligations first.');
        return null;
    }

    let icsContent = [
        'BEGIN:VCALENDAR',
        'VERSION:2.0',
        'PRODID:-//Got This Thing Scheduler//EN',
        'CALSCALE:GREGORIAN',
        'METHOD:PUBLISH',
        'X-WR-CALNAME:Got This Thing - Fake Obligations',
        'X-WR-CALDESC:Plausible fake calendar events'
    ];

    // Add all events
    Object.keys(events).forEach(dateKey => {
        events[dateKey].forEach((event, index) => {
            const eventDate = new Date(dateKey);
            const eventId = generateEventId(dateKey, index);
            const startDateTime = formatICSDate(eventDate, event.time);

            // Calculate end time (1 hour later)
            const [hours, minutes] = parseTime(event.time);
            const endDate = new Date(eventDate);
            endDate.setHours(hours + 1, minutes, 0, 0);
            const endDateTime = formatICSDate(endDate, event.time);

            const now = new Date();
            const timestamp = formatICSDate(now, '12:00 AM');

            icsContent.push('BEGIN:VEVENT');
            icsContent.push(`UID:${eventId}`);
            icsContent.push(`DTSTAMP:${timestamp}`);
            icsContent.push(`DTSTART:${startDateTime}`);
            icsContent.push(`DTEND:${endDateTime}`);
            icsContent.push(`SUMMARY:${event.title}`);
            icsContent.push(`DESCRIPTION:Generated by Got This Thing Scheduler`);
            icsContent.push(`STATUS:CONFIRMED`);
            icsContent.push(`CATEGORIES:${event.category}`);
            icsContent.push('END:VEVENT');
        });
    });

    icsContent.push('END:VCALENDAR');

    return icsContent.join('\r\n');
}

// Export events to calendar
function exportToCalendar() {
    const icsContent = generateICSContent();

    if (!icsContent) return;

    // Create blob and download
    const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = 'got-this-thing-obligations.ics';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    showNotification('📅 Calendar file downloaded! Open it to add events to your calendar.');
}

// Generate removal file to delete events
function generateRemovalFile() {
    if (Object.keys(events).length === 0) {
        alert('No events to remove! Generate some fake obligations first.');
        return;
    }

    let icsContent = [
        'BEGIN:VCALENDAR',
        'VERSION:2.0',
        'PRODID:-//Got This Thing Scheduler//EN',
        'METHOD:CANCEL'
    ];

    // Cancel all events
    Object.keys(events).forEach(dateKey => {
        events[dateKey].forEach((event, index) => {
            const eventDate = new Date(dateKey);
            const eventId = generateEventId(dateKey, index);
            const startDateTime = formatICSDate(eventDate, event.time);

            const now = new Date();
            const timestamp = formatICSDate(now, '12:00 AM');

            icsContent.push('BEGIN:VEVENT');
            icsContent.push(`UID:${eventId}`);
            icsContent.push(`DTSTAMP:${timestamp}`);
            icsContent.push(`DTSTART:${startDateTime}`);
            icsContent.push(`SUMMARY:${event.title}`);
            icsContent.push(`STATUS:CANCELLED`);
            icsContent.push(`SEQUENCE:1`);
            icsContent.push('END:VEVENT');
        });
    });

    icsContent.push('END:VCALENDAR');

    const blob = new Blob([icsContent.join('\r\n')], { type: 'text/calendar;charset=utf-8' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = 'got-this-thing-REMOVE.ics';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    showNotification('🗑️ Removal file downloaded! Open it to delete events from your calendar.');
}
