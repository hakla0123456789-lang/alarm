document.addEventListener("DOMContentLoaded", function () {
  // Populate time dropdowns
  populateTimeDropdowns();

  // Update current time every second
  setInterval(updateCurrentTime, 1000);
  updateCurrentTime();

  // Set up event listeners
  document.getElementById("setAlarmBtn").addEventListener("click", setAlarm);
  document.getElementById("stopAlarmBtn").addEventListener("click", stopAlarm);

  // Initial update
  updateDate();
});

function populateTimeDropdowns() {
  const hoursSelect = document.getElementById("hours");
  const minutesSelect = document.getElementById("minutes");

  // Hours 1-12
  for (let i = 1; i <= 12; i++) {
    const option = document.createElement("option");
    option.value = i;
    option.textContent = i;
    hoursSelect.appendChild(option);
  }

  // Minutes 00-59 with 5 min intervals
  for (let i = 0; i < 60; i++) {
    const min = i.toString().padStart(2, "0");
    const option = document.createElement("option");
    option.value = min;
    option.textContent = min;
    minutesSelect.appendChild(option);
  }
}

function updateCurrentTime() {
  // Fetch current time from Flask backend
  fetch("/get_time")
    .then((response) => response.json())
    .then((data) => {
      document.getElementById("currentTime").textContent = data.current_time;
    })
    .catch((error) => {
      console.error("Error fetching time:", error);
      // Fallback to client time
      const now = new Date();
      document.getElementById("currentTime").textContent =
        now.toLocaleTimeString("en-US", { hour12: false });
    });
}

function updateDate() {
  const now = new Date();
  const options = {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  };
  document.getElementById("dateDisplay").textContent = now.toLocaleDateString(
    "en-US",
    options
  );
}

function setAlarm() {
  const hours = document.getElementById("hours").value;
  const minutes = document.getElementById("minutes").value;
  const meridian = document.getElementById("meridian").value;

  if (!hours || !minutes) {
    showMessage("Please select both hour and minute!", "error");
    return;
  }

  const alarmData = {
    hours: hours,
    minutes: minutes,
    meridian: meridian,
  };

  // Send to Flask backend
  fetch("/set_alarm", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(alarmData),
  })
    .then((response) => response.json())
    .then((data) => {
      if (data.success) {
        showMessage(data.message, "success");
        document.getElementById(
          "alarmTimeDisplay"
        ).textContent = `${hours}:${minutes} ${meridian}`;

        // Update status box
        const statusBox = document.getElementById("alarmStatus");
        statusBox.innerHTML = `<i class="fas fa-check-circle"></i> ${data.message}`;
        statusBox.style.background = "#e8f5e9";

        // Add flashing effect
        document.body.classList.add("alarm-active");
        setTimeout(() => {
          document.body.classList.remove("alarm-active");
        }, 3000);
      } else {
        showMessage(data.message, "error");
      }
    })
    .catch((error) => {
      console.error("Error:", error);
      showMessage("Failed to set alarm. Please try again.", "error");
    });
}

function stopAlarm() {
  fetch("/stop_alarm", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
  })
    .then((response) => response.json())
    .then((data) => {
      if (data.success) {
        showMessage(data.message, "info");

        const statusBox = document.getElementById("alarmStatus");
        statusBox.innerHTML = `<i class="fas fa-stop-circle"></i> Alarm stopped`;
        statusBox.style.background = "#fff3cd";

        // Stop any playing sound
        const alarmSound = document.getElementById("alarmSound");
        alarmSound.pause();
        alarmSound.currentTime = 0;

        // Remove flashing effect
        document.body.classList.remove("alarm-active");
      }
    });
}

function showMessage(message, type) {
  // Create temporary message
  const messageDiv = document.createElement("div");
  messageDiv.textContent = message;
  messageDiv.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        padding: 15px 25px;
        border-radius: 8px;
        color: white;
        font-weight: bold;
        z-index: 1000;
        animation: slideIn 0.3s ease;
    `;

  if (type === "success") {
    messageDiv.style.background = "#4CAF50";
  } else if (type === "error") {
    messageDiv.style.background = "#f44336";
  } else {
    messageDiv.style.background = "#2196F3";
  }

  document.body.appendChild(messageDiv);

  // Remove after 3 seconds
  setTimeout(() => {
    messageDiv.style.animation = "slideOut 0.3s ease";
    setTimeout(() => {
      document.body.removeChild(messageDiv);
    }, 300);
  }, 3000);
}

let clientTimezone = "";

document.addEventListener("DOMContentLoaded", function () {
  // Get client timezone
  clientTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
  document.getElementById("timezoneDisplay").textContent = clientTimezone;

  // Initialize
  populateTimeDropdowns();
  updateCurrentTime();
  setInterval(updateCurrentTime, 1000);

  // Event listeners
  document.getElementById("setAlarmBtn").addEventListener("click", setAlarm);
  document.getElementById("stopAlarmBtn").addEventListener("click", stopAlarm);
});

function populateTimeDropdowns() {
  const hoursSelect = document.getElementById("hours");
  const minutesSelect = document.getElementById("minutes");

  // Clear existing options except first
  hoursSelect.innerHTML = '<option value="">--</option>';
  minutesSelect.innerHTML = '<option value="">--</option>';

  // Hours 1-12
  for (let i = 1; i <= 12; i++) {
    const option = document.createElement("option");
    option.value = i;
    option.textContent = i;
    hoursSelect.appendChild(option);
  }

  // Minutes 00-59
  for (let i = 0; i < 60; i++) {
    const min = i.toString().padStart(2, "0");
    const option = document.createElement("option");
    option.value = min;
    option.textContent = min;
    minutesSelect.appendChild(option);

    // Auto-select current minute + 1
    const currentMinute = new Date().getMinutes();
    if (i === (currentMinute + 1) % 60) {
      option.selected = true;
    }
  }

  // Auto-select current hour
  const currentHour = new Date().getHours();
  const currentHour12 = currentHour % 12 || 12;
  const currentMeridian = currentHour >= 12 ? "PM" : "AM";

  hoursSelect.value = currentHour12;
  document.getElementById("meridian").value = currentMeridian;
}

function updateCurrentTime() {
  const now = new Date();

  // Format time in 24-hour format
  const hours24 = now.getHours().toString().padStart(2, "0");
  const minutes = now.getMinutes().toString().padStart(2, "0");
  const seconds = now.getSeconds().toString().padStart(2, "0");

  // Format time in 12-hour format
  const hours12 = now.getHours() % 12 || 12;
  const ampm = now.getHours() >= 12 ? "PM" : "AM";
  const time12hr = `${hours12
    .toString()
    .padStart(2, "0")}:${minutes}:${seconds} ${ampm}`;

  // Display both formats
  document.getElementById("currentTime").innerHTML = `
        <div>${hours24}:${minutes}:${seconds}</div>
        <small>${time12hr}</small>
    `;

  updateDate();
}

function updateDate() {
  const now = new Date();
  const options = {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  };

  document.getElementById("dateDisplay").textContent = now.toLocaleDateString(
    "en-IN",
    options
  );
}

// ... rest of the functions remain same ...
let alarmCheckInterval = null;

// ... existing code ...

function setAlarm() {
  const hours = document.getElementById("hours").value;
  const minutes = document.getElementById("minutes").value;
  const meridian = document.getElementById("meridian").value;

  if (!hours || !minutes) {
    showMessage("Please select both hour and minute!", "error");
    return;
  }

  const alarmData = {
    hours: hours,
    minutes: minutes,
    meridian: meridian,
  };

  // Send to Flask backend
  fetch("/set_alarm", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(alarmData),
  })
    .then((response) => response.json())
    .then((data) => {
      if (data.success) {
        showMessage(data.message, "success");
        document.getElementById(
          "alarmTimeDisplay"
        ).textContent = `${hours}:${minutes} ${meridian}`;

        // Update status box
        const statusBox = document.getElementById("alarmStatus");
        statusBox.innerHTML = `<i class="fas fa-check-circle"></i> ${data.message}`;
        statusBox.style.background = "#e8f5e9";

        // Start checking for alarm
        startAlarmCheck();
      } else {
        showMessage(data.message, "error");
      }
    })
    .catch((error) => {
      console.error("Error:", error);
      showMessage("Failed to set alarm. Please try again.", "error");
    });
}

function startAlarmCheck() {
  // Clear any existing interval
  if (alarmCheckInterval) {
    clearInterval(alarmCheckInterval);
  }

  // Check every second if alarm should ring
  alarmCheckInterval = setInterval(() => {
    fetch("/check_alarm")
      .then((response) => response.json())
      .then((data) => {
        if (data.alarm_triggered) {
          triggerBrowserAlarm();
        }
      });
  }, 1000);
}

function triggerBrowserAlarm() {
  console.log("🔔 Alarm triggered in browser!");

  // Play sound in browser
  const alarmSound = document.getElementById("alarmSound");

  // Reset and play
  alarmSound.currentTime = 0;
  alarmSound.play();

  // Flash effect
  document.body.classList.add("alarm-active");

  // Show notification
  showMessage("WAKE UP! ALARM!", "error");

  // Browser notification (if allowed)
  if ("Notification" in window && Notification.permission === "granted") {
    new Notification("⏰ Alarm Clock", {
      body: "WAKE UP! It's time!",
      icon: "https://img.icons8.com/color/96/000000/alarm.png",
    });
  }

  // Stop checking (alarm already triggered)
  if (alarmCheckInterval) {
    clearInterval(alarmCheckInterval);
    alarmCheckInterval = null;
  }
}

function stopAlarm() {
  fetch("/stop_alarm", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
  })
    .then((response) => response.json())
    .then((data) => {
      if (data.success) {
        showMessage(data.message, "info");

        const statusBox = document.getElementById("alarmStatus");
        statusBox.innerHTML = `<i class="fas fa-stop-circle"></i> Alarm stopped`;
        statusBox.style.background = "#fff3cd";

        // Stop alarm sound in browser
        const alarmSound = document.getElementById("alarmSound");
        alarmSound.pause();
        alarmSound.currentTime = 0;

        // Remove flashing effect
        document.body.classList.remove("alarm-active");

        // Stop checking
        if (alarmCheckInterval) {
          clearInterval(alarmCheckInterval);
          alarmCheckInterval = null;
        }
      }
    });
}

// Request notification permission on page load
if ("Notification" in window && Notification.permission === "default") {
  Notification.requestPermission();
}

// ... rest of the code ...

// Add CSS for animations
const style = document.createElement("style");
style.textContent = `
    @keyframes slideIn {
        from { transform: translateX(100%); opacity: 0; }
        to { transform: translateX(0); opacity: 1; }
    }
    
    @keyframes slideOut {
        from { transform: translateX(0); opacity: 1; }
        to { transform: translateX(100%); opacity: 0; }
    }
`;
document.head.appendChild(style);
