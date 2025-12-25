from flask import Flask, render_template, request, jsonify
from datetime import datetime, timedelta
import threading
import time
import pytz

app = Flask(__name__)

# Global variables
alarm_active = False
alarm_time = None
alarm_thread = None

# Get IST timezone
IST = pytz.timezone('Asia/Kolkata')

def get_ist_time():
    """Get current time in IST"""
    return datetime.now(IST)

def alarm_checker():
    """Background mein alarm check karega"""
    global alarm_active, alarm_time
    
    print(f"Alarm checker started. Waiting for: {alarm_time}")
    
    while alarm_active:
        try:
            current_time = get_ist_time().strftime("%H:%M:%S")
            
            if alarm_time and alarm_time == current_time:
                print("🔔 ALARM TRIGGERED! (Frontend will play sound)")
                alarm_active = False
                break
            
            time.sleep(1)
        except Exception as e:
            print(f"Error in alarm_checker: {e}")
            break

@app.route('/')
def home():
    """Home page"""
    return render_template('index.html')

@app.route('/set_alarm', methods=['POST'])
def set_alarm():
    """Alarm set karega"""
    global alarm_active, alarm_time, alarm_thread
    
    data = request.json
    
    try:
        hours = int(data['hours'])
        mins = int(data['minutes'])
        meridian = data['meridian'].upper()
        
        # Validation
        if not (1 <= hours <= 12) or not (0 <= mins <= 59):
            return jsonify({'success': False, 'message': 'Invalid time format!'})
        
        # Convert 12-hour to 24-hour format
        if meridian == "PM" and hours != 12:
            hours_24 = hours + 12
        elif meridian == "AM" and hours == 12:
            hours_24 = 0
        else:
            hours_24 = hours
        
        # Create alarm time string
        alarm_time_str = f"{hours_24:02d}:{mins:02d}:00"
        
        # Get current IST time
        now_ist = get_ist_time()
        current_date = now_ist.date()
        
        # Create alarm datetime
        alarm_datetime = datetime.combine(
            current_date, 
            datetime.strptime(alarm_time_str, "%H:%M:%S").time()
        )
        
        # Make it timezone aware
        alarm_datetime = IST.localize(alarm_datetime)
        
        # If alarm time is passed, set for next day
        if alarm_datetime <= now_ist:
            alarm_datetime += timedelta(days=1)
        
        # Format for display
        display_time_12hr = f"{hours}:{mins:02d} {meridian}"
        alarm_time = alarm_datetime.strftime("%H:%M:%S")
        
        print(f"Alarm set for: {alarm_time} ({display_time_12hr})")
        
        # Stop any existing alarm thread
        if alarm_thread and alarm_thread.is_alive():
            alarm_active = False
            alarm_thread.join(timeout=1)
        
        # Start new alarm thread
        alarm_active = True
        alarm_thread = threading.Thread(target=alarm_checker, daemon=True)
        alarm_thread.start()
        
        return jsonify({
            'success': True, 
            'message': f'Alarm set for {display_time_12hr}',
            'alarm_time_12hr': display_time_12hr,
            'alarm_time_24hr': alarm_time
        })
        
    except Exception as e:
        print(f"Error setting alarm: {e}")
        return jsonify({'success': False, 'message': f'Error: {str(e)}'})

@app.route('/stop_alarm', methods=['POST'])
def stop_alarm():
    """Alarm band karega"""
    global alarm_active
    alarm_active = False
    return jsonify({'success': True, 'message': 'Alarm stopped'})

@app.route('/check_alarm', methods=['GET'])
def check_alarm():
    """Frontend can check if alarm should ring"""
    current_time = get_ist_time().strftime("%H:%M:%S")
    
    if alarm_time and alarm_time == current_time:
        return jsonify({'alarm_triggered': True})
    return jsonify({'alarm_triggered': False})

if __name__ == '__main__':
    print("=" * 50)
    print("Starting Flask Alarm Clock Server...")
    print(f"IST Time: {get_ist_time().strftime('%Y-%m-%d %H:%M:%S')}")
    print("Server running on: http://localhost:5000")
    print("=" * 50)
    
    app.run(debug=True, port=5000, host='0.0.0.0')