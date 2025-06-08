import { useState, useEffect } from 'react';
import './App.css';

interface CheckIn {
  date: string;
  timestamp: number;
}

interface Friend {
  id: string;
  name: string;
  friendCode: string;
  checkIns: CheckIn[];
  addedAt: number;
}

interface UserProfile {
  name: string;
  friendCode: string;
  checkIns: CheckIn[];
}

function App() {
  const [checkIns, setCheckIns] = useState<CheckIn[]>([]);
  const [hasCheckedInToday, setHasCheckedInToday] = useState(false);
  const [currentView, setCurrentView] = useState<'dashboard' | 'calendar' | 'friends'>('dashboard');
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [friends, setFriends] = useState<Friend[]>([]);
  const [showAddFriend, setShowAddFriend] = useState(false);
  const [friendName, setFriendName] = useState('');
  const [friendCode, setFriendCode] = useState('');


  // Generate unique friend code
  const generateFriendCode = () => {
    return Math.random().toString(36).substring(2, 8).toUpperCase();
  };

  useEffect(() => {
    // Load user profile
    const savedProfile = localStorage.getItem('gym-user-profile');
    if (savedProfile) {
      const profile = JSON.parse(savedProfile);
      setUserProfile(profile);
    }

    // Load check-ins
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

    // Load friends
    const savedFriends = localStorage.getItem('gym-friends');
    if (savedFriends) {
      setFriends(JSON.parse(savedFriends));
    }
  }, []);

  const createUserProfile = (name: string) => {
    const profile: UserProfile = {
      name: name.trim(),
      friendCode: generateFriendCode(),
      checkIns: checkIns
    };
    setUserProfile(profile);
    localStorage.setItem('gym-user-profile', JSON.stringify(profile));
  };

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
    
    // Update user profile with new check-in
    if (userProfile) {
      const updatedProfile = { ...userProfile, checkIns: updatedCheckIns };
      setUserProfile(updatedProfile);
      localStorage.setItem('gym-user-profile', JSON.stringify(updatedProfile));
    }
  };

  const handleUncheck = () => {
    const today = new Date().toDateString();
    const updatedCheckIns = checkIns.filter(checkIn => 
      new Date(checkIn.timestamp).toDateString() !== today
    );
    
    setCheckIns(updatedCheckIns);
    setHasCheckedInToday(false);
    localStorage.setItem('gym-checkins', JSON.stringify(updatedCheckIns));
    
    // Update user profile
    if (userProfile) {
      const updatedProfile = { ...userProfile, checkIns: updatedCheckIns };
      setUserProfile(updatedProfile);
      localStorage.setItem('gym-user-profile', JSON.stringify(updatedProfile));
    }
  };

  const addFriend = () => {
    if (!friendName.trim() || !friendCode.trim()) return;
    
    const newFriend: Friend = {
      id: Date.now().toString(),
      name: friendName.trim(),
      friendCode: friendCode.trim().toUpperCase(),
      checkIns: [], // Will be populated when they share their data
      addedAt: Date.now()
    };
    
    const updatedFriends = [...friends, newFriend];
    setFriends(updatedFriends);
    localStorage.setItem('gym-friends', JSON.stringify(updatedFriends));
    
    setFriendName('');
    setFriendCode('');
    setShowAddFriend(false);
  };

  const removeFriend = (friendId: string) => {
    const updatedFriends = friends.filter(f => f.id !== friendId);
    setFriends(updatedFriends);
    localStorage.setItem('gym-friends', JSON.stringify(updatedFriends));
  };

  const shareMyData = () => {
    if (!userProfile) return;
    
    const shareData = {
      name: userProfile.name,
      friendCode: userProfile.friendCode,
      checkIns: checkIns,
      sharedAt: Date.now()
    };
    
    const encodedData = btoa(JSON.stringify(shareData));
    const shareUrl = `${window.location.origin}?friend=${encodedData}`;
    
    navigator.clipboard.writeText(shareUrl).then(() => {
      alert('Share link copied to clipboard! Send this to your friends.');
    });
  };

  const calculateStreak = (workouts: CheckIn[]) => {
    if (workouts.length === 0) return 0;
    
    const sortedCheckIns = [...workouts].sort((a, b) => b.timestamp - a.timestamp);
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

  const getLastVisit = (workouts: CheckIn[] = checkIns) => {
    if (workouts.length === 0) return 'Never';
    const sortedCheckIns = [...workouts].sort((a, b) => b.timestamp - a.timestamp);
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

  // Check for shared friend data in URL
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const friendData = urlParams.get('friend');
    
    if (friendData) {
      try {
        const decodedData = JSON.parse(atob(friendData));
        const existingFriend = friends.find(f => f.friendCode === decodedData.friendCode);
        
        if (existingFriend) {
          // Update existing friend's data
          const updatedFriends = friends.map(f => 
            f.friendCode === decodedData.friendCode 
              ? { ...f, checkIns: decodedData.checkIns }
              : f
          );
          setFriends(updatedFriends);
          localStorage.setItem('gym-friends', JSON.stringify(updatedFriends));
        } else {
          // Add new friend with data
          const newFriend: Friend = {
            id: Date.now().toString(),
            name: decodedData.name,
            friendCode: decodedData.friendCode,
            checkIns: decodedData.checkIns,
            addedAt: Date.now()
          };
          const updatedFriends = [...friends, newFriend];
          setFriends(updatedFriends);
          localStorage.setItem('gym-friends', JSON.stringify(updatedFriends));
        }
        
        // Clean URL
        window.history.replaceState({}, document.title, window.location.pathname);
      } catch (error) {
        console.log('Invalid friend data in URL');
      }
    }
  }, [friends]);

  // Show profile setup if no user profile
  if (!userProfile) {
    return (
      <div className="app">
        <div className="container">
          <div className="profile-setup">
            <div className="profile-setup-content">
              <div className="profile-icon">👋</div>
              <h2>Welcome to Gym Tracker!</h2>
              <p>Let's set up your profile to start tracking workouts with friends</p>
              
              <form onSubmit={(e) => {
                e.preventDefault();
                const formData = new FormData(e.target as HTMLFormElement);
                const name = formData.get('name') as string;
                if (name.trim()) createUserProfile(name);
              }}>
                <input
                  type="text"
                  name="name"
                  placeholder="Enter your name"
                  className="profile-input"
                  maxLength={20}
                  required
                />
                <button type="submit" className="profile-submit">
                  Get Started 🚀
                </button>
              </form>
            </div>
          </div>
        </div>
      </div>
    );
  }

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
            <button 
              className={`nav-tab ${currentView === 'friends' ? 'active' : ''}`}
              onClick={() => setCurrentView('friends')}
            >
              Friends
            </button>
          </nav>
        </header>

        <div className="content">
          {currentView === 'dashboard' ? (
            <>
              <div className="user-greeting">
                <h2>Hey {userProfile.name}! 👋</h2>
                <div className="friend-code-display">
                  <span>Your friend code: <strong>{userProfile.friendCode}</strong></span>
                  <button className="share-btn" onClick={shareMyData}>
                    📤 Share Progress
                  </button>
                </div>
              </div>

              <div className="stats-grid">
                <div className="stat-card primary">
                  <div className="stat-number">{checkIns.length}</div>
                  <div className="stat-label">Total Workouts</div>
                </div>
                <div className="stat-card primary">
                  <div className="stat-number">{calculateStreak(checkIns)}</div>
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
          ) : currentView === 'calendar' ? (
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
          ) : (
            <div className="friends-view">
              <div className="friends-header">
                <h3>Workout Buddies</h3>
                <button 
                  className="add-friend-btn"
                  onClick={() => setShowAddFriend(true)}
                >
                  ➕ Add Friend
                </button>
              </div>

              {showAddFriend && (
                <div className="add-friend-modal">
                  <div className="modal-content">
                    <div className="modal-header">
                      <h4>Add Workout Buddy</h4>
                      <button 
                        className="close-btn"
                        onClick={() => setShowAddFriend(false)}
                      >
                        ✕
                      </button>
                    </div>
                    <form onSubmit={(e) => {
                      e.preventDefault();
                      addFriend();
                    }}>
                      <input
                        type="text"
                        placeholder="Friend's name"
                        value={friendName}
                        onChange={(e) => setFriendName(e.target.value)}
                        className="friend-input"
                        maxLength={20}
                        required
                      />
                      <input
                        type="text"
                        placeholder="Friend's code (e.g., ABC123)"
                        value={friendCode}
                        onChange={(e) => setFriendCode(e.target.value.toUpperCase())}
                        className="friend-input"
                        maxLength={6}
                        required
                      />
                      <div className="modal-actions">
                        <button type="button" onClick={() => setShowAddFriend(false)} className="cancel-btn">
                          Cancel
                        </button>
                        <button type="submit" className="add-btn">
                          Add Friend
                        </button>
                      </div>
                    </form>
                  </div>
                </div>
              )}

              {friends.length > 0 ? (
                <div className="friends-list">
                  {friends.map((friend) => (
                    <div key={friend.id} className="friend-card">
                      <div className="friend-info">
                        <div className="friend-avatar">👤</div>
                        <div className="friend-details">
                          <div className="friend-name">{friend.name}</div>
                          <div className="friend-code">Code: {friend.friendCode}</div>
                        </div>
                      </div>
                      
                      <div className="friend-stats">
                        <div className="friend-stat">
                          <div className="stat-number">{friend.checkIns.length}</div>
                          <div className="stat-label">Workouts</div>
                        </div>
                        <div className="friend-stat">
                          <div className="stat-number">{calculateStreak(friend.checkIns)}</div>
                          <div className="stat-label">Streak</div>
                        </div>
                        <div className="friend-stat">
                          <div className="stat-number">{getLastVisit(friend.checkIns)}</div>
                          <div className="stat-label">Last Visit</div>
                        </div>
                      </div>
                      
                      <button 
                        className="remove-friend-btn"
                        onClick={() => removeFriend(friend.id)}
                      >
                        🗑️
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="no-friends">
                  <div className="no-friends-icon">👥</div>
                  <div className="no-friends-title">No workout buddies yet</div>
                  <div className="no-friends-subtitle">
                    Add friends to track each other's progress and stay motivated!
                  </div>
                </div>
              )}

              <div className="friends-help">
                <h4>How to add friends:</h4>
                <ol>
                  <li>Ask your friend for their <strong>friend code</strong></li>
                  <li>Click "Add Friend" and enter their name and code</li>
                  <li>Share your progress using the "Share Progress" button</li>
                  <li>When they click your link, their data will sync automatically!</li>
                </ol>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default App;
