/******************************************************
* 
* seasonhealth.com - js for goals 
* Authored by Ka Wai Cheung
*
/******************************************************/

/******************************************************
*
* DOM references
* 
/******************************************************/

// Single item references (by ID)
const elem_ApptSoonModal = document.getElementById('seasonApptSoonModal');
const elem_ApptSoonBug = document.getElementById('seasonApptSoonBug');
const elem_SplashContainer = document.getElementById('seasonSplashContainer');
const elem_CalendarCardsContainer = document.getElementById('seasonCalendarCardsContainer');
const elem_GoalsTrackingPanel = document.getElementById('seasonGoalsTrackingPanel');
const elem_GoalsDailyCalendar = document.getElementById('seasonGoalsDailyCalendar');
const elem_PreVisitSummaryItemToggles = document.getElementById('seasonPreVisitSummaryItemToggles');
const elem_PreVisitSummaryGeneratedReport = document.getElementById('seasonPreVisitSummaryGeneratedReport');
const elem_PrevReportTabContainer = document.getElementById('seasonPrevReportTabContainer');
const elem_GoalGridContainer = document.getElementById('seasonGoalGridContainer');
const elem_GoalModalsContainer = document.getElementById('seasonGoalModalsContainer');

// Collection references (by class)
const elems_PrevReportTabContent = document.querySelectorAll('.season--prev-report-tab-content');
const elems_ShareableItems = document.querySelectorAll('.season--shareable-item');

// Classes (Built dynamically so cannot reference document.querySelectorAll initially)
const class_ApptCard = '.season--appointment-card';
const class_GoalActionBtnsContainer = '.season--goal-action-buttons';
const class_GoalProgressBtn = '.season--goal-progress-btn';

// HTML constants
const svgs = {
  sad_face: `<svg width="32" height="32" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
               <circle cx="12" cy="12" r="9.5" fill="none" stroke="currentColor" stroke-width="1"/>
               <circle cx="9" cy="9" r="1" fill="currentColor"/>
               <circle cx="15" cy="9" r="1" fill="currentColor"/>
               <path d="M 8 16 Q 12 12 16 16" stroke="currentColor" stroke-width="1" fill="none" stroke-linecap="round"/>
             </svg>`,
  mid_face: `<svg width="32" height="32" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
               <circle cx="12" cy="12" r="9.5" fill="none" stroke="currentColor" stroke-width="1"/>
               <circle cx="9" cy="9" r="1" fill="currentColor"/>
               <circle cx="15" cy="9" r="1" fill="currentColor"/>
               <line x1="8" y1="15" x2="16" y2="15" stroke="currentColor" stroke-width="1" stroke-linecap="round"/>
             </svg>`,
  happy_face: `<svg width="32" height="32" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                 <circle cx="12" cy="12" r="9.5" fill="none" stroke="currentColor" stroke-width="1"/>
                 <circle cx="9" cy="9" r="1" fill="currentColor"/>
                 <circle cx="15" cy="9" r="1" fill="currentColor"/>
                 <path d="M 8 14 Q 12 18 16 14" stroke="currentColor" stroke-width="1" fill="none" stroke-linecap="round"/>
               </svg>`,
  close: `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M18 6L6 18" stroke="black" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            <path d="M6 6L18 18" stroke="black" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>`,
  check: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M5 12.7037L9.93103 18L18 5" stroke="black" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>`
};

/******************************************************
*
* Data references
* 
/******************************************************/

// Dates between appointments
const date_PrevAppt = new Date('2025-08-16');
const date_NextAppt = new Date('2025-09-15');

// Appointments for appointment cards
const data_ApptCards = [
  {
    date: "2024-12-12",
    month: "Dec",
    day: "12",
    caption: "Appointment", 
    blurbText: "First visit. Way to go!",
    ctaText: "View Summary",
    ctaClass: "appt-report-btn"
  },
  {
    date: "2025-02-15",
    month: "Feb", 
    day: "15",
    caption: "Appointment",
    blurbText: "Nice improvements!",
    ctaText: "View Summary", 
    ctaClass: "appt-report-btn"
  },
  {
    date: "2025-03-02",
    month: "Mar",
    day: "2", 
    caption: "Appointment",
    blurbText: "You set new goals.",
    ctaText: "View Summary",
    ctaClass: "appt-report-btn"
  },
  {
    date: "2025-04-12",
    month: "Apr",
    day: "12",
    caption: "Appointment", 
    blurbText: "Nice work on your goals!",
    ctaText: "View Summary",
    ctaClass: "appt-report-btn"
  },
  {
    date: "2025-05-21", 
    month: "May",
    day: "21",
    caption: "Appointment",
    blurbText: "You ordered 10 meals.",
    ctaText: "View Summary",
    ctaClass: "appt-report-btn"
  },
  {
    date: "2025-07-11",
    month: "Jul", 
    day: "11",
    caption: "Appointment",
    blurbText: "Great eating improvements!",
    ctaText: "View Summary",
    ctaClass: "appt-report-btn"
  },
  {
    date: "2025-08-15", 
    month: "Aug",
    day: "19",
    caption: "Today",
    blurbText: "Get ready for your visit.",
    ctaText: "Prepare", 
    ctaClass: "pre-visit-summary-btn primary",
    isToday: true
  },
  {
    date: "2025-08-20",
    month: "Aug", 
    day: "20", 
    caption: "Appointment",
    blurbText: "Next appointment",
    ctaText: "Re-schedule?",
    ctaClass: "appt-report-btn"
  }
];

// Goals 
const data_Goals = [
  {
    id: 1,
    title: "Say \"no\" to work treats.",
    rating: "poor" 
  },
  {
    id: 2,
    title: "Drink 64oz of water a day.",
    rating: "poor" 
  },
  {
    id: 3,
    title: "Exercise 15-20 min, 5 days per week.",
    rating: "ok" 
  },
  {
    id: 4,
    title: "Avoid eating while watching TV.",
    rating: "good" 
  }
];

// Goal modals data
const configs_GoalModal = createconfigs_GoalModal();

// Static modals data
const configs_StaticModal = [
  {
    openBtnSelector: '#ai-chat-btn',
    modalId: 'ai-chat',
    closeBtnId: 'ai-chat-close-btn'
  },
  {
    openBtnSelector: '#rd-chat-btn',
    modalId: 'rd-chat',
    closeBtnId: 'rd-chat-close-btn'
  },
  {
    openBtnSelector: '.appt-report-btn',
    modalId: 'appt-report',
    closeBtnId: 'appt-report-close-btn'
  },
  {
    openBtnSelector: '.pre-visit-summary-btn',
    modalId: 'pre-visit-summary',
    closeBtnId: 'pre-visit-summary-close-btn'
  }
];

document.addEventListener('DOMContentLoaded', () => {
  
  // Can call on base page
  enableSplashContainerFade();

  // Component: Appointment callouts 
  enableApptSoonAlerts();

  // Component: Appointment cards
  createApptCards();
  enableCalendarCardSwiping();

  // Component: Goals tracking 
  createGoalsTrackingCalendar(date_PrevAppt, date_NextAppt);
  createGoalGridSquares();
  createGoalModals();
  initGoalsTrackingHeaderClick();

  initPreVisitSummaryItemToggles(); 

  // Must come after createApptCards() and createGoalModals()
  initModals([...configs_StaticModal, ...configs_GoalModal]);
  initPreVisitSummaryEdit();
  initCustomInput();
  initGoalAddMoreToggle();
  initUnifiedTextInput();
  enableApptReportTabs();
  updateAppointmentReportHeader();
});

// Calendar fade effect when scrolling vertically to reveal goals
function enableSplashContainerFade() {
  window.addEventListener('scroll', () => {
    const calTranslateYMax = 20;
    const calFadeRate = 0.8; 
    const goalSummaryHeight = elem_GoalsTrackingPanel.offsetHeight;
    const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
    const scrollProgress = Math.min(scrollTop / goalSummaryHeight, 1);
    const translateY = scrollProgress * -1 * calTranslateYMax; 
    const opacity = 1 - (scrollProgress / calFadeRate); 
    
    elem_SplashContainer.style.transform = `translateY(${translateY}vh)`;
    elem_SplashContainer.style.opacity = opacity;
  });
}

// Enabled only when within X hours of next appt
function enableApptSoonAlerts() {
  const skipModalBtn = elem_ApptSoonModal.querySelector('button:last-of-type');
  const joinNowBugBtn = elem_ApptSoonBug.querySelector('button:last-of-type');
  
  skipModalBtn.addEventListener('click', (e) => {
    e.preventDefault();
    elem_ApptSoonModal.classList.add('hidden');
    elem_ApptSoonBug.classList.remove('hidden');
  });

  // TODO: Replace this with actual 'join' functionality. 
  // For demo, just hiding the bug.
  joinNowBugBtn.addEventListener('click', (e) => {
    e.preventDefault();
    elem_ApptSoonBug.classList.add('hidden');
  });
}

// Create carousel of appointment cards
function createApptCards() {
  // Clear existing content
  elem_CalendarCardsContainer.innerHTML = '';
  
  data_ApptCards.forEach((appointment, index) => {
    const cardElement = document.createElement('div');
    cardElement.innerHTML = createAppointmentCardContent(appointment, index);
    elem_CalendarCardsContainer.appendChild(cardElement.firstElementChild);
  });

  function createAppointmentCardContent(appointment, index) {
    const todayClass = appointment.isToday ? ' today' : '';
    const primaryClass = appointment.ctaClass.includes('primary') ? ' primary' : '';
    
    return `
      <div class="season--appointment-card appointment-card${todayClass}" data-appointment-date="${appointment.date}" data-index="${index}">
        <div class="caption">${appointment.caption}</div>
        <div class="card-date">
          <div class="card-month">${appointment.month}</div>
          <div class="card-day">${appointment.day}</div>
        </div>
        <div class="card-blurb">
          <div class="card-blurb-text">${appointment.blurbText}</div>
        </div>
        <button class="card-cta ${appointment.ctaClass}">${appointment.ctaText}</button>
      </div>
    `;
  }
}

// Swipe effect for appointment cards collection
function enableCalendarCardSwiping() {

  const apptCards = document.querySelectorAll(class_ApptCard);
  console.log(apptCards);

  // Find the index of the card with "today" class
  let curIndex = 0;
  const todayCard = elem_CalendarCardsContainer.querySelector('.today');

  if (todayCard) {
    curIndex = parseInt(todayCard.dataset.index) || 0;
  }

  let startX = 0;
  let isDragging = false;

  function updateCardPositions() {
    apptCards.forEach((card, index) => {
      card.classList.remove('left', 'center', 'right', 'hidden');
      
      if (index === curIndex) {
        card.classList.add('center');
      } else if (index === curIndex - 1) {
        card.classList.add('left');
      } else if (index === curIndex + 1) {
        card.classList.add('right');
      } else {
        card.classList.add('hidden');
      }
    });
  }

  function addCardClickListeners() {
    apptCards.forEach((card, index) => {
      card.addEventListener('click', (e) => {
        if (card.classList.contains('left') || card.classList.contains('right')) {
          curIndex = index;
          updateCardPositions();
          e.stopPropagation(); 
        }
      });
    });
  }

  function swipeLeft() {
    if (curIndex < apptCards.length - 1) {
      curIndex++;
      updateCardPositions();
    }
  }

  function swipeRight() {
    if (curIndex > 0) {
      curIndex--;
      updateCardPositions();
    }
  }

  // Touch events
  elem_CalendarCardsContainer.addEventListener('touchstart', (e) => {
    startX = e.touches[0].clientX;
    isDragging = true;
  });

  elem_CalendarCardsContainer.addEventListener('touchmove', (e) => {
    if (!isDragging) return;
    e.preventDefault();
  });

  elem_CalendarCardsContainer.addEventListener('touchend', (e) => {
    if (!isDragging) return;
    isDragging = false;
    
    const endX = e.changedTouches[0].clientX;
    const diff = startX - endX;
    
    if (Math.abs(diff) > 50) { // Minimum swipe distance
      if (diff > 0) {
        swipeLeft();
      } else {
        swipeRight();
      }
    }
  });

  // Mouse events for desktop
  elem_CalendarCardsContainer.addEventListener('mousedown', (e) => {
    startX = e.clientX;
    isDragging = true;
  });

  elem_CalendarCardsContainer.addEventListener('mousemove', (e) => {
    if (!isDragging) return;
    e.preventDefault();
  });

  elem_CalendarCardsContainer.addEventListener('mouseup', (e) => {
    if (!isDragging) return;
    isDragging = false;
    
    const endX = e.clientX;
    const diff = startX - endX;
    
    if (Math.abs(diff) > 50) { // Minimum swipe distance
      if (diff > 0) {
        swipeLeft();
      } else {
        swipeRight();
      }
    }
  });

  updateCardPositions();
  addCardClickListeners();
}

// Sets up horizontal days UI for goal tracking
function createGoalsTrackingCalendar(startDate, endDate) {
  const calendar = elem_GoalsDailyCalendar;

  const today = new Date();
  let curIndex = 0; // Will be set to today's index
  
  // Generate calendar days
  const days = [];
  let currentDate = startDate;
  const todayDate = new Date();

  while (currentDate <= endDate) {
    days.push(new Date(currentDate));
    currentDate.setDate(currentDate.getDate() + 1);
  }
  
  // Find today's index
  const todayIndex = days.findIndex(date => 
    date.toDateString() === todayDate.toDateString()
  );

  if (todayIndex !== -1) {
    curIndex = todayIndex;
  }
  
  // Clear existing content
  calendar.innerHTML = '';
  
  // Render calendar days
  days.forEach((date, index) => {
    const dayElement = document.createElement('div');
    dayElement.className = 'calendar-day';
    dayElement.dataset.date = date.toISOString().split('T')[0];
    dayElement.dataset.index = index;
    
    const isToday = date.toDateString() === todayDate.toDateString();

    dayElement.innerHTML = `
      <div class="day-square ${isToday ? 'today' : ''}">
        <div class="check">
          ${svgs.check}
        </div>
        <div class="day-label">
          <div class="month">${date.toLocaleDateString('en-US', { month: 'short' })}</div>
          <div class="day">${date.getDate()}</div>
        </div>
      </div>
    `;
    
    calendar.appendChild(dayElement);
  });

  function updateCalendarPositions() {
    const dayElements = calendar.querySelectorAll('.calendar-day');
    
    dayElements.forEach((dayElement, index) => {
      const dayCircle = dayElement.querySelector('.day-square');
      dayCircle.classList.remove('selected');
      
      if (index === curIndex) {
        dayCircle.classList.add('selected');
      }
    });
  }

  function centerSelectedDay() {
    const selectedDay = calendar.querySelector(`[data-index="${curIndex}"]`);
    if (!selectedDay) return;

    const calendarRect = calendar.getBoundingClientRect();
    const selectedRect = selectedDay.getBoundingClientRect();
    
    // Calculate the offset of selected day relative to the calendar's scroll container
    const selectedOffsetLeft = selectedDay.offsetLeft;
    const selectedWidth = selectedRect.width;
    const calendarWidth = calendarRect.width;
    const maxScrollLeft = calendar.scrollWidth - calendar.clientWidth;
    
    // Calculate ideal scroll position to center the selected day
    let scrollToCenter = selectedOffsetLeft - (calendarWidth / 2) + (selectedWidth / 2);
    
    // Clamp the scroll position to valid bounds
    scrollToCenter = Math.max(0, Math.min(scrollToCenter, maxScrollLeft));
    
    // Smooth scroll to the position
    calendar.scrollTo({
      left: scrollToCenter,
      behavior: 'smooth'
    });
  }

  function addCalendarClickListeners() {
    const dayElements = calendar.querySelectorAll('.calendar-day');
    
    dayElements.forEach((dayElement, index) => {
      dayElement.addEventListener('click', (e) => {
        // Prevent click if we were just scrolling/swiping
        if (calendar.dataset.wasScrolling === 'true') {
          return;
        }
        
        curIndex = index;
        updateCalendarPositions();
        
        // Center the newly selected day
        setTimeout(() => {
          centerSelectedDay();
        }, 50); // Small delay to ensure DOM updates
        
        e.stopPropagation();
      });
    });
  }

  // Track scrolling state to prevent clicks during scroll
  let scrollTimeout;
  let isScrolling = false;

  calendar.addEventListener('scroll', () => {
    isScrolling = true;
    calendar.dataset.wasScrolling = 'true';
    
    clearTimeout(scrollTimeout);
    scrollTimeout = setTimeout(() => {
      isScrolling = false;
      calendar.dataset.wasScrolling = 'false';
    }, 150);
  });

  // Touch events for free scrolling (no selection change)
  let startX = 0;
  let startY = 0;
  let isDragging = false;

  calendar.addEventListener('touchstart', (e) => {
    startX = e.touches[0].clientX;
    startY = e.touches[0].clientY;
    isDragging = false;
  });

  calendar.addEventListener('touchmove', (e) => {
    const currentX = e.touches[0].clientX;
    const currentY = e.touches[0].clientY;
    const diffX = Math.abs(currentX - startX);
    const diffY = Math.abs(currentY - startY);
    
    // If horizontal movement is greater than vertical, we're scrolling horizontally
    if (diffX > diffY && diffX > 10) {
      isDragging = true;
      calendar.dataset.wasScrolling = 'true';
    }
  });

  calendar.addEventListener('touchend', (e) => {
    if (isDragging) {
      // Reset scrolling state after a delay
      setTimeout(() => {
        calendar.dataset.wasScrolling = 'false';
      }, 100);
    }
    isDragging = false;
  });

  // Mouse events for desktop (free scrolling)
  calendar.addEventListener('mousedown', (e) => {
    startX = e.clientX;
    isDragging = false;
  });

  calendar.addEventListener('mousemove', (e) => {
    const currentX = e.clientX;
    const diffX = Math.abs(currentX - startX);
    
    if (diffX > 10) {
      isDragging = true;
      calendar.dataset.wasScrolling = 'true';
    }
  });

  calendar.addEventListener('mouseup', (e) => {
    if (isDragging) {
      // Reset scrolling state after a delay
      setTimeout(() => {
        calendar.dataset.wasScrolling = 'false';
      }, 100);
    }
    isDragging = false;
  });

  // init
  calendar.dataset.wasScrolling = 'false';
  updateCalendarPositions();
  addCalendarClickListeners();
  
  // Center today on load
  setTimeout(() => {
    centerSelectedDay();
  }, 100);
}

// Creates goal grid squares to populate goals tracking panel
function createGoalGridSquares() {
  // Clear existing content
  elem_GoalGridContainer.innerHTML = '';
  
  data_Goals.forEach(goal => {
    const squareElement = document.createElement('div');
    squareElement.innerHTML = createGoalGridSquare(goal);
    elem_GoalGridContainer.appendChild(squareElement.firstElementChild);
  });

  function createGoalGridSquare(goal) {
    let svgContent = '';
    
    switch(goal.rating) {
      case "poor":
        svgContent = svgs.sad_face;
        break;
      case "ok":
        svgContent = svgs.mid_face;
        break;
      case "good":
        svgContent = svgs.happy_face;
        break;
    }
    
    return `
      <div class="bottom-panel-square square square-${goal.id} goals-${goal.id}-logging-btn">
        <div class="rated">
          ${svgContent}
        </div>
        <span>${goal.title}</span>
      </div>
    `;
  }
}

// Creates goal modals
function createGoalModals() {
  // Clear existing content
  elem_GoalModalsContainer.innerHTML = '';
  
  data_Goals.forEach(goal => {
    // Create and append goal modal
    const modalElement = document.createElement('div');
    modalElement.innerHTML = createGoalModalContent(goal);
    elem_GoalModalsContainer.appendChild(modalElement.firstElementChild);
  });

  function createGoalModalContent(goal) {
    return `
      <div class="popup" id="goals-${goal.id}-logging">
        <div class="popup-content goals-${goal.id}-logging">
          <div class="close" id="goals-${goal.id}-logging-close-btn">
            ${svgs.close}
          </div> 
          <div class="goal-title">${goal.title}</div>
          <div class="goal-rating">
            <div class="day-square today">
              <div class="day-label">
                <div class="month">Aug</div>
                <div class="day">25</div>
              </div>
            </div>
            <div class="goal-rating-title">How did it go today?</div>
            <div class="rating-options">
              <div class="rating-option">
                <div class="season--goal-progress-btn rating-btn" data-rating="positive">
                  <span>I didn't do so well.</span>
                  ${svgs.sad_face}
                </div>
              </div>
              <div class="rating-option">
                <div class="season--goal-progress-btn rating-btn" data-rating="neutral">
                  <span>I did OK.</span>
                  ${svgs.mid_face}
                </div>
              </div>
              <div class="rating-option">
                <div class="season--goal-progress-btn rating-btn" data-rating="negative">
                  <span>I did great!</span>
                  ${svgs.happy_face}     
                </div>
              </div>
            </div>
            <div class="season--goal-action-buttons goal-action-buttons hidden">
              <button class="share-more-btn" data-goal="${goal.id}">Share More&hellip;</button>
              <span class="button-divider">or</span>
              <button class="save-btn" data-goal="${goal.id}">Save</button>
            </div>
          </div>
        </div>
      </div>
    `;
  }
}

// Allow clicking "How are your goals going?" to pop the entire goals tracking panel
function initGoalsTrackingHeaderClick() {
  const elem = elem_GoalsTrackingPanel.firstElementChild;
          
  elem.addEventListener('click', () => {
    // Add bounce animation class
    elem.classList.add('bounce-animation');
    
    // Remove the animation class after animation completes
    setTimeout(() => {
        elem.classList.remove('bounce-animation');
    }, 500);
    
    window.scrollTo({
        top: document.documentElement.scrollHeight,
        behavior: 'smooth'
    });
  });
}

function initPreVisitSummaryEdit() {
  const actionBtn = document.getElementById('pre-visit-action-btn');
  const summaryContent = document.getElementById('summary-content');
  const regeneratingState = document.getElementById('regenerating-state');
  const actionBtnManage = document.querySelector('.audit-button--manage');
  const actionBtnSee = document.querySelector('.audit-button--see');
  
  let isEditing = true;
  updateActionButtonText();

  actionBtn.addEventListener('click', () => {
    if (isEditing) {
      saveAndRegenerate();
    } else {
      switchToEditMode();
    }
  });

  function switchToEditMode() {
    elem_PreVisitSummaryGeneratedReport.classList.add('hidden');
    elem_PreVisitSummaryItemToggles.classList.remove('hidden');
    isEditing = true;
    updateActionButtonText();
  }
  
  function saveAndRegenerate() {
    elem_PreVisitSummaryItemToggles.classList.add('hidden');
    actionBtn.classList.add('hidden');
    regeneratingState.classList.remove('hidden');
    
    // Simulate regeneration process (modify when implementing into React)
    setTimeout(() => {
      // Hide regenerating state
      elem_PreVisitSummaryGeneratedReport.classList.remove('hidden');
      actionBtn.classList.remove('hidden');
      regeneratingState.classList.add('hidden');
      isEditing = false;
      updateActionButtonText();
    }, 1000);
  }

  function updateActionButtonText() {
    if (isEditing) {
      actionBtnSee.classList.remove('hidden');
      actionBtnManage.classList.add('hidden');
    } else {
      actionBtnManage.classList.remove('hidden');
      actionBtnSee.classList.add('hidden');
    }
  }
}

// Sets the share/exclude functionality for pre-visit summaries items
// Dev note: Can add API call to regenerate summary on each click? Or on submit.
function initPreVisitSummaryItemToggles() {
  elems_ShareableItems.forEach(item => {
    enableShareableItemToggle(item);
  });
}

// Sets up all modals (goals, chats, summaries)
function initModals(modalConfigs) {
  modalConfigs.forEach(config => {
    const { openBtnSelector, modalId, closeBtnId } = config;
    
    const openBtn = document.querySelectorAll(openBtnSelector);
    const modal = document.getElementById(modalId);
    const closeBtn = document.getElementById(closeBtnId);
    
    openBtn.forEach(btn => {
      btn.addEventListener('click', () => {
        modal.style.display = 'block';
        disableHtmlScroll();
      });
    });
    
    closeBtn.addEventListener('click', () => {
      modal.style.display = 'none';
      enableHtmlScroll();
    });
    
    modal.addEventListener('click', (e) => {
      if (e.target === modal) {
        modal.style.display = 'none';
        enableHtmlScroll();
      }
    });
  });
}

function initCustomInput() {
  const saveBtn = document.getElementById('save-custom-btn');
  const textarea = document.getElementById('custom-input-textarea');
  
  saveBtn.addEventListener('click', () => {
    const inputText = textarea.value.trim();
    
    if (inputText) {
      // Create or get the custom items container
      let customItemsContainer = document.getElementById('custom-edit-items');
      
      if (!customItemsContainer) {
        customItemsContainer = document.createElement('div');
        customItemsContainer.className = 'edit-items';
        customItemsContainer.id = 'custom-edit-items';
        
        // Insert it before the custom-input-section
        const customInputSection = document.querySelector('.custom-input-section');
        customInputSection.parentNode.insertBefore(customItemsContainer, customInputSection);
      }
      
      // Create new edit item
      const newItem = document.createElement('div');
      newItem.className = 'edit-item';
      newItem.dataset.itemId = `custom-${Date.now()}`;

      const currentDate = new Date();
      const formattedDate = currentDate.toLocaleDateString('en-US', { 
        month: 'short', 
        day: 'numeric' 
      });
      
      newItem.innerHTML = `
        <div class="item-date">${formattedDate}</div>
        <div class="item-text">${inputText}</div>
        <div class="item-toggle">
          <svg class="eye-closed hidden" width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <g clip-path="url(#clip0_179_0)">
              <path d="M14.12 14.12C13.8454 14.4147 13.5141 14.6511 13.1462 14.8151C12.7782 14.9791 12.3809 15.0673 11.9781 15.0744C11.5753 15.0815 11.1752 15.0074 10.8016 14.8565C10.4281 14.7056 10.0887 14.481 9.80385 14.1961C9.51897 13.9113 9.29439 13.5719 9.14351 13.1984C8.99262 12.8248 8.91853 12.4247 8.92563 12.0219C8.93274 11.6191 9.02091 11.2218 9.18488 10.8538C9.34884 10.4858 9.58525 10.1546 9.88 9.87999M17.94 17.94C16.2306 19.243 14.1491 19.9649 12 20C5 20 1 12 1 12C2.24389 9.68189 3.96914 7.6566 6.06 6.05999L17.94 17.94ZM9.9 4.23999C10.5883 4.07887 11.2931 3.99833 12 3.99999C19 3.99999 23 12 23 12C22.393 13.1356 21.6691 14.2047 20.84 15.19L9.9 4.23999Z" stroke="black" stroke-linecap="round" stroke-linejoin="round"/>
              <path d="M1 1L23 23" stroke="black" stroke-linecap="round" stroke-linejoin="round"/>
            </g>
            <defs>
              <clipPath id="clip0_179_0">
              <rect width="24" height="24" fill="white"/>
              </clipPath>
            </defs>
          </svg>
          <svg class="eye-opened" width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M1 12C1 12 5 4 12 4C19 4 23 12 23 12C23 12 19 20 12 20C5 20 1 12 1 12Z" stroke="black" stroke-linecap="round" stroke-linejoin="round"/>
            <path d="M12 15C13.6569 15 15 13.6569 15 12C15 10.3431 13.6569 9 12 9C10.3431 9 9 10.3431 9 12C9 13.6569 10.3431 15 12 15Z" stroke="black" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
        </div>
      `;

      enableShareableItemToggle(newItem);
      customItemsContainer.appendChild(newItem);
      textarea.value = '';
      textarea.focus();
    }
  });
}

function createconfigs_GoalModal() {
  const modalConfigs = [];
  
  data_Goals.forEach(goal => {
    modalConfigs.push({
      openBtnSelector: `.goals-${goal.id}-logging-btn`,
      modalId: `goals-${goal.id}-logging`,
      closeBtnId: `goals-${goal.id}-logging-close-btn`
    });
  });
  
  return modalConfigs;
}

function initGoalAddMoreToggle() {
  // Hide all goal-add-more sections by default
  document.querySelectorAll(class_GoalActionBtnsContainer).forEach(section => {
    section.classList.add('hidden');
  });

  // Add event listeners to all rating options
  document.querySelectorAll(class_GoalProgressBtn).forEach(option => {
    option.addEventListener('click', function() {
      const parentGoal = this.closest('.popup-content');
      if (!parentGoal) return;

      const goalAddMoreSection = parentGoal.querySelector(class_GoalActionBtnsContainer);
      
      // Remove selected class from all rating options in this goal
      parentGoal.querySelectorAll(class_GoalProgressBtn).forEach(opt => {
        opt.classList.remove('selected');
      });
      
      // Add selected class to clicked option
      this.classList.add('selected');
      
      // Show the goal-add-more section with a smooth animation
      if (goalAddMoreSection) {
        goalAddMoreSection.classList.remove('hidden')
        goalAddMoreSection.style.opacity = '0';
        goalAddMoreSection.style.transform = 'translateY(20px)';
        
        // Animate in
        requestAnimationFrame(() => {
          goalAddMoreSection.style.transition = 'all 0.3s ease';
          goalAddMoreSection.style.opacity = '1';
          goalAddMoreSection.style.transform = 'translateY(0)';
        });
      }
    });
  });
}

function initUnifiedTextInput() {
  const textInputPopup = document.getElementById('text-input-popup');
  const closeBtn = document.getElementById('close-text-popup');
  const saveBtn = textInputPopup.querySelector('.save-text-btn');
  const textarea = textInputPopup.querySelector('.main-textarea');
  
  let currentGoalId = null;

  // Store reference to current goal when opening popup
  document.querySelectorAll('.share-more-btn').forEach(button => {
      button.addEventListener('click', (e) => {
          currentGoalId = e.target.dataset.goal;
          textInputPopup.style.display = 'flex';
          
          // Focus on textarea after a short delay
          setTimeout(() => {
              textarea.focus();
          }, 300);
      });
  });

  // Handle input method selector for text input popup
  document.querySelectorAll('.input-method-option').forEach(option => {
      option.addEventListener('click', (e) => {
          const method = e.currentTarget.dataset.method;
          const popup = e.currentTarget.closest('.text-input-popup');
          
          // Remove selected class from all options in this popup
          popup.querySelectorAll('.input-method-option').forEach(opt => {
              opt.classList.remove('selected');
          });
          
          // Add selected class to clicked option
          e.currentTarget.classList.add('selected');
          
          // Hide all input areas in this popup
          popup.querySelectorAll('.input-area').forEach(area => {
              area.classList.add('hidden');
          });
          
          // Show the selected input area
          const targetArea = popup.querySelector(`#${method}-area`);
          if (targetArea) {
              targetArea.classList.remove('hidden');
              
              // Focus on textarea if type method is selected
              if (method === 'type') {
                  const textarea = targetArea.querySelector('.main-textarea');
                  if (textarea) {
                      setTimeout(() => textarea.focus(), 100);
                  }
              }
          }
      });
  });

 // Handle Save buttons (same functionality as old goal-footer button)
  document.querySelectorAll('.save-btn').forEach(button => {
    button.addEventListener('click', (e) => {
      const goalId = e.target.dataset.goal;
      const modal = document.getElementById(`goals-${goalId}-logging`);
      
      // In a real app, you'd save the data here
      console.log(`Saving goal ${goalId} without additional text`);
      
      // Hide modal
      modal.style.display = 'none';
      enableHtmlScroll();
    });
  });

  // Close text input popup
  if (closeBtn) {
      closeBtn.addEventListener('click', () => {
          textInputPopup.style.display = 'none';
          currentGoalId = null;
      });
  }

  // Close when clicking background
  textInputPopup.addEventListener('click', (e) => {
      if (e.target === textInputPopup) {
          textInputPopup.style.display = 'none';
          currentGoalId = null;
      }
  });

  // Save and close both popups
  if (saveBtn) {
      saveBtn.addEventListener('click', () => {
          const textContent = textarea.value.trim();
          
          // In a real app, you'd save the data here
          console.log(`Saving text input for goal ${currentGoalId}:`, textContent);
          
          // Hide text input popup
          textInputPopup.style.display = 'none';
          
          // Hide parent goal popup if currentGoalId exists
          if (currentGoalId) {
              const parentPopup = document.getElementById(`goals-${currentGoalId}-logging`);
              if (parentPopup) {
                  parentPopup.style.display = 'none';
              }
          }
          
          // Re-enable scrolling
          enableHtmlScroll();
          
          // Clear textarea and reset goal reference
          textarea.value = '';
          currentGoalId = null;
      });
  }
}

function enableApptReportTabs() {
  const tabBtns = elem_PrevReportTabContainer.querySelectorAll('div');
  const tabContents = elems_PrevReportTabContent;

  tabBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      const targetTab = btn.dataset.tab;
      
      // Remove active class from all tabs and content
      tabBtns.forEach(b => b.classList.remove('active'));
      tabContents.forEach(c => c.classList.remove('active'));
      
      // Add active class to clicked tab
      btn.classList.add('active');
      
      // Show corresponding content
      const targetContent = document.getElementById(`${targetTab}-content`);
      if (targetContent) {
        targetContent.classList.add('active');
      }
    });
  });
}

function updateAppointmentReportHeader() {
  document.querySelectorAll('.appt-report-btn').forEach((btn, index) => {
    btn.addEventListener('click', () => {
      const card = btn.closest('.appointment-card');
      const appointmentDate = card.dataset.appointmentDate;
      const appointmentIndex = parseInt(card.dataset.index);
      
      // Get the previous appointment date for date range
      const cards = document.querySelectorAll('.appointment-card');
      let headerText = '';
      
      if (appointmentIndex === 0) {
        // First appointment, just show single date
        const date = new Date(appointmentDate);
        headerText = date.toLocaleDateString('en-US', { month: 'numeric', day: 'numeric' }) + ' Summary';
      } else {
        // Find previous appointment
        const prevCard = Array.from(cards).find(c => parseInt(c.dataset.index) === appointmentIndex - 1);
        if (prevCard) {
          const prevDate = new Date(prevCard.dataset.appointmentDate);
          const currentDate = new Date(appointmentDate);
          
          const prevFormatted = prevDate.toLocaleDateString('en-US', { month: 'numeric', day: 'numeric' });
          const currentFormatted = currentDate.toLocaleDateString('en-US', { month: 'numeric', day: 'numeric' });
          
          headerText = `${prevFormatted} - ${currentFormatted} Summary`;
        } else {
          // Fallback to single date
          const date = new Date(appointmentDate);
          headerText = date.toLocaleDateString('en-US', { month: 'numeric', day: 'numeric' }) + ' Summary';
        }
      }
      
      // Update the header
      const header = document.getElementById('appt-report-header');
      if (header) {
        header.textContent = headerText;
      }
    });
  });
}

/******************************************************
*
* Shared utility methods
* 
/******************************************************/

function enableShareableItemToggle(item) {
  item.addEventListener('click', () => {
    const toggle = item.querySelector('.item-toggle');
    const eyeOpened = toggle.querySelector('.eye-opened');
    const eyeClosed = toggle.querySelector('.eye-closed');
    
    const isExcluded = item.classList.contains('excluded');
    
    if (isExcluded) {
      item.classList.remove('excluded');
      // Show eye-opened, hide eye-closed
      eyeOpened.classList.remove('hidden');
      eyeClosed.classList.add('hidden');
    } else {
      item.classList.add('excluded');
      // Hide eye-opened, show eye-closed
      eyeOpened.classList.add('hidden');
      eyeClosed.classList.remove('hidden');
    }
  });
}

function enableHtmlScroll() {
  document.documentElement.classList.remove('no-scroll');
}

function disableHtmlScroll() {
  document.documentElement.classList.add('no-scroll');
}
