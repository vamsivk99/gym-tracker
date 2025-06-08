import { useState, useEffect } from 'react';
import './App.css';

interface CheckIn {
  date: string;
  timestamp: number;
}

function App() {
  const [checkIns, setCheckIns] = useState<CheckIn[]>([]);
  const [hasCheckedInToday, setHasCheckedInToday] = useState(false);
  const [currentView, setCurrentView] = useState<'dashboard' | 'calendar'>('dashboard');
  const [currentMonth, setCurrentMonth] = useState(new Date());

  useEffect(() => {
    const saved = localStorage.getItem('gym-checkins');
    if (saved) {
      const parsedCheckIns = JSON.parse(saved);
      setCheckIns(parsedCheckIns);
      
      const today = new Date().toDateString();
      const checkedInToday = parsedCheckIns.some((checkin: CheckIn) => 
        new Date(checkin.timestamp).toDateString() === today
      );
      setHasCheckedInToday(checkedInToday);
    }
  }, []);

  const handleCheckIn = () => {
    const today = new Date();
    const todayString = today.toDateString();
    
    if (hasCheckedInToday) {
      return;
    }

    const newCheckIn: CheckIn = {
      date: todayString,
      timestamp: today.getTime()
    };

    const updatedCheckIns = [...checkIns, newCheckIn];
    setCheckIns(updatedCheckIns);
    setHasCheckedInToday(true);
    
    localStorage.setItem('gym-checkins', JSON.stringify(updatedCheckIns));
  };

  const handleUncheck = () => {
    const today = new Date().toDateString();
    const updatedCheckIns = checkIns.filter(checkIn => 
      new Date(checkIn.timestamp).toDateString() !== today
    );
    
    setCheckIns(updatedCheckIns);
    setHasCheckedInToday(false);
    localStorage.setItem('gym-checkins', JSON.stringify(updatedCheckIns));
  };

  const calculateStreak = () => {
    if (checkIns.length === 0) return 0;
    
    const sortedCheckIns = [...checkIns].sort((a, b) => b.timestamp - a.timestamp);
    const today = new Date();
    let streak = 0;
    
    for (let i = 0; i < sortedCheckIns.length; i++) {
      const checkIn = sortedCheckIns[i];
      if (!checkIn) break;
      
      const checkInDate = new Date(checkIn.timestamp);
      const daysDiff = Math.floor((today.getTime() - checkInDate.getTime()) / (1000 * 60 * 60 * 24));
      
      if (i === 0 && daysDiff <= 1) {
        streak = 1;
      } else if (i > 0) {
        const prevCheckIn = sortedCheckIns[i - 1];
        if (!prevCheckIn) break;
        
        const prevCheckInDate = new Date(prevCheckIn.timestamp);
        const daysBetween = Math.floor((prevCheckInDate.getTime() - checkInDate.getTime()) / (1000 * 60 * 60 * 24));
        
        if (daysBetween <= 1) {
          streak++;
        } else {
          break;
        }
      } else {
        break;
      }
    }
    
    return streak;
  };

  const getLastVisit = () => {
    if (checkIns.length === 0) return 'Never';
    const sortedCheckIns = [...checkIns].sort((a, b) => b.timestamp - a.timestamp);
    const lastCheckIn = sortedCheckIns[0];
    if (!lastCheckIn) return 'Never';
    return new Date(lastCheckIn.timestamp).toLocaleDateString();
  };

  const getRecentCheckIns = () => {
    return checkIns
      .sort((a, b) => b.timestamp - a.timestamp)
      .slice(0, 5);
  };

  const generateCalendarDays = () => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    const firstDay = new Date(year, month, 1);
    const startDate = new Date(firstDay);
    startDate.setDate(startDate.getDate() - firstDay.getDay());
    
    const days = [];
    const current = new Date(startDate);
    
    for (let i = 0; i < 42; i++) {
      const dayString = current.toDateString();
      const hasWorkout = checkIns.some(checkIn => 
        new Date(checkIn.timestamp).toDateString() === dayString
      );
      const isCurrentMonth = current.getMonth() === month;
      const isToday = current.toDateString() === new Date().toDateString();
      
      days.push({
        date: new Date(current),
        hasWorkout,
        isCurrentMonth,
        isToday,
        dayNumber: current.getDate()
      });
      
      current.setDate(current.getDate() + 1);
    }
    
    return days;
  };

  const navigateMonth = (direction: 'prev' | 'next') => {
    setCurrentMonth(prev => {
      const newMonth = new Date(prev);
      if (direction === 'prev') {
        newMonth.setMonth(newMonth.getMonth() - 1);
      } else {
        newMonth.setMonth(newMonth.getMonth() + 1);
      }
      return newMonth;
    });
  };

  const thisMonth = checkIns.filter(checkIn => {
    const checkInDate = new Date(checkIn.timestamp);
    return checkInDate.getMonth() === new Date().getMonth() && 
           checkInDate.getFullYear() === new Date().getFullYear();
  }).length;

  return (
    <div className="app">
      <div className="container">
        <header className="header">
          <h1>💪 Gym Tracker</h1>
          <p>Build consistent habits, one workout at a time</p>
          
          <nav className="nav-tabs">
            <button 
              className={`nav-tab ${currentView === 'dashboard' ? 'active' : ''}`}
              onClick={() => setCurrentView('dashboard')}
            >
              Dashboard
            </button>
            <button 
              className={`nav-tab ${currentView === 'calendar' ? 'active' : ''}`}
              onClick={() => setCurrentView('calendar')}
            >
              Calendar
            </button>
          </nav>
        </header>

        <div className="content">
          {currentView === 'dashboard' ? (
            <>
              <div className="stats-grid">
                <div className="stat-card primary">
                  <div className="stat-number">{checkIns.length}</div>
                  <div className="stat-label">Total Workouts</div>
                </div>
                <div className="stat-card primary">
                  <div className="stat-number">{calculateStreak()}</div>
                  <div className="stat-label">Current Streak</div>
                </div>
                <div className="stat-card secondary">
                  <div className="stat-number">{thisMonth}</div>
                  <div className="stat-label">This Month</div>
                </div>
                <div className="stat-card secondary">
                  <div className="stat-number">{getLastVisit()}</div>
                  <div className="stat-label">Last Workout</div>
                </div>
              </div>

              <div className="check-in-section">
                {hasCheckedInToday ? (
                  <div className="button-group">
                    <button className="check-in-btn checked-in" disabled>
                      ✅ Workout Complete
                    </button>
                    <button className="uncheck-btn" onClick={handleUncheck}>
                      ↩️ Undo Check-in
                    </button>
                  </div>
                ) : (
                  <button className="check-in-btn" onClick={handleCheckIn}>
                    🏋️ Log Today's Workout
                  </button>
                )}
              </div>

              <div className="recent-activity">
                <h3>Recent Activity</h3>
                {getRecentCheckIns().length > 0 ? (
                  <div className="activity-list">
                    {getRecentCheckIns().map((checkIn, index) => (
                      <div key={index} className="activity-item">
                        <div className="activity-icon">🏋️</div>
                        <div className="activity-text">
                          <div className="activity-title">Workout completed</div>
                          <div className="activity-date">
                            {new Date(checkIn.timestamp).toLocaleDateString('en-US', {
                              weekday: 'long',
                              month: 'short',
                              day: 'numeric'
                            })}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="no-activity">
                    <div className="no-activity-icon">📈</div>
                    <div className="no-activity-title">Ready to start?</div>
                    <div className="no-activity-subtitle">Log your first workout to begin tracking</div>
                  </div>
                )}
              </div>
            </>
          ) : (
            <div className="calendar-view">
              <div className="calendar-header">
                <button className="calendar-nav" onClick={() => navigateMonth('prev')}>
                  ‹
                </button>
                <h3 className="calendar-title">
                  {currentMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                </h3>
                <button className="calendar-nav" onClick={() => navigateMonth('next')}>
                  ›
                </button>
              </div>
              
              <div className="calendar-grid">
                <div className="calendar-weekdays">
                  {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                    <div key={day} className="calendar-weekday">{day}</div>
                  ))}
                </div>
                
                <div className="calendar-days">
                  {generateCalendarDays().map((day, index) => (
                    <div 
                      key={index} 
                      className={`calendar-day ${
                        day.isCurrentMonth ? 'current-month' : 'other-month'
                      } ${day.isToday ? 'today' : ''} ${day.hasWorkout ? 'workout-day' : ''}`}
                    >
                      <span className="day-number">{day.dayNumber}</span>
                      {day.hasWorkout && <div className="workout-indicator">💪</div>}
                    </div>
                  ))}
                </div>
              </div>
              
              <div className="calendar-legend">
                <div className="legend-item">
                  <div className="legend-color workout"></div>
                  <span>Workout Day</span>
                </div>
                <div className="legend-item">
                  <div className="legend-color rest"></div>
                  <span>Rest Day</span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default App;
