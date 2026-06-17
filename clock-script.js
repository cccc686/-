// Store active timezones in localStorage
let activeTimezones = JSON.parse(localStorage.getItem('activeTimezones')) || ['UTC'];

// Initialize on page load
document.addEventListener('DOMContentLoaded', () => {
    renderClocks();
    updateClocks();
    
    // Update clocks every second
    setInterval(updateClocks, 1000);

    // Event listeners
    document.getElementById('addBtn').addEventListener('click', addTimezone);
    document.getElementById('timezoneSelect').addEventListener('change', function() {
        if (this.value) {
            addTimezoneFromSelect(this.value);
            this.value = '';
        }
    });

    // Preset buttons
    document.querySelectorAll('.preset-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            const tz = this.getAttribute('data-tz');
            addTimezoneIfNotExists(tz);
        });
    });
});

function addTimezone() {
    const select = document.getElementById('timezoneSelect');
    const tz = select.value;
    
    if (tz && !activeTimezones.includes(tz)) {
        activeTimezones.push(tz);
        localStorage.setItem('activeTimezones', JSON.stringify(activeTimezones));
        renderClocks();
    }
    
    select.value = '';
}

function addTimezoneFromSelect(tz) {
    if (tz && !activeTimezones.includes(tz)) {
        activeTimezones.push(tz);
        localStorage.setItem('activeTimezones', JSON.stringify(activeTimezones));
        renderClocks();
    }
}

function addTimezoneIfNotExists(tz) {
    if (!activeTimezones.includes(tz)) {
        activeTimezones.push(tz);
        localStorage.setItem('activeTimezones', JSON.stringify(activeTimezones));
        renderClocks();
    }
}

function removeTimezone(tz) {
    activeTimezones = activeTimezones.filter(t => t !== tz);
    localStorage.setItem('activeTimezones', JSON.stringify(activeTimezones));
    renderClocks();
}

function renderClocks() {
    const grid = document.getElementById('clocksGrid');
    grid.innerHTML = '';

    if (activeTimezones.length === 0) {
        grid.innerHTML = `
            <div class="empty-state">
                <p>📍 No time zones selected yet</p>
                <p>Add a time zone from the dropdown or preset buttons above!</p>
            </div>
        `;
        return;
    }

    activeTimezones.forEach(tz => {
        const card = createClockCard(tz);
        grid.appendChild(card);
    });
}

function createClockCard(timezone) {
    const card = document.createElement('div');
    card.className = 'clock-card';
    card.id = `clock-${timezone}`;

    const header = document.createElement('div');
    header.className = 'clock-header';

    const tzInfo = getTimezoneInfo(timezone);
    
    header.innerHTML = `
        <div>
            <div class="timezone-name">${tzInfo.name}</div>
            <div class="timezone-offset">${tzInfo.offset}</div>
        </div>
        <button class="remove-btn" onclick="removeTimezone('${timezone}')">×</button>
    `;

    const display = document.createElement('div');
    display.className = 'clock-display';
    display.id = `display-${timezone}`;

    card.appendChild(header);
    card.appendChild(display);

    return card;
}

function updateClocks() {
    activeTimezones.forEach(tz => {
        updateClockDisplay(tz);
    });
}

function updateClockDisplay(timezone) {
    const display = document.getElementById(`display-${timezone}`);
    if (!display) return;

    const now = new Date();
    const formatter = new Intl.DateTimeFormat('en-US', {
        timeZone: timezone,
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: true,
    });

    const dateFormatter = new Intl.DateTimeFormat('en-US', {
        timeZone: timezone,
        year: 'numeric',
        month: 'short',
        day: 'numeric',
    });

    const dayFormatter = new Intl.DateTimeFormat('en-US', {
        timeZone: timezone,
        weekday: 'long',
    });

    const timeParts = formatter.formatToParts(now);
    let hour = '', minute = '', second = '', ampm = '';

    timeParts.forEach(part => {
        if (part.type === 'hour') hour = part.value;
        if (part.type === 'minute') minute = part.value;
        if (part.type === 'second') second = part.value;
        if (part.type === 'dayPeriod') ampm = part.value;
    });

    const time = `${hour}:${minute}:${second}`;
    const date = dateFormatter.format(now);
    const day = dayFormatter.format(now);

    display.innerHTML = `
        <div class="time">${time}<span class="ampm">${ampm}</span></div>
        <div class="date">${date}</div>
        <div class="day">${day}</div>
    `;
}

function getTimezoneInfo(timezone) {
    // Get current time in the timezone
    const formatter = new Intl.DateTimeFormat('en-US', {
        timeZone: timezone,
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: false,
    });

    // Calculate offset
    const now = new Date();
    const utcDate = new Date(now.toLocaleString('en-US', { timeZone: 'UTC' }));
    const tzDate = new Date(now.toLocaleString('en-US', { timeZone: timezone }));
    const offset = (tzDate - utcDate) / (1000 * 60 * 60);

    let offsetStr = '';
    if (offset > 0) {
        offsetStr = `UTC+${Math.abs(offset)}`;
    } else if (offset < 0) {
        offsetStr = `UTC${offset}`;
    } else {
        offsetStr = 'UTC';
    }

    // Format offset with minutes if needed
    const offsetHours = Math.floor(Math.abs(offset));
    const offsetMinutes = Math.round((Math.abs(offset) % 1) * 60);
    
    if (offsetMinutes !== 0) {
        const sign = offset > 0 ? '+' : '-';
        offsetStr = `UTC${sign}${offsetHours}:${String(offsetMinutes).padStart(2, '0')}`;
    }

    // Get clean timezone name
    const tzName = timezone.split('/').pop().replace(/_/g, ' ');

    return {
        name: tzName,
        offset: offsetStr
    };
}