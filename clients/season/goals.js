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

// Shell for enableApptSoonAlerts() component...
const elem_ApptSoonAlert = document.getElementById('seasonApptSoonAlert');

// Shell for initSplashContainer() component...
const elem_SplashContainer = document.getElementById('seasonSplashContainer');

// Shell for initGoalsTrackingPanel() component...
const elem_GoalsTrackingPanel = document.getElementById('seasonGoalsTrackingPanel');

// Shell for initPreVisitSummary() component (popup)...
const elem_PreVisitSummary = document.getElementById('seasonPreVisitSummary');

// Shell for initAppointmentReport() component (popup)...
const elem_ApptReport = document.getElementById('seasonApptReport');

// Classes (Built dynamically so cannot reference document.querySelectorAll initially)
const class_ApptCard = 'season--appt-card';
const sel_ApptCard = `.${class_ApptCard}`;

const class_GoalActionBtnsContainer = 'season--goal-action-buttons';
const sel_GoalActionBtnsContainer = `.${class_GoalActionBtnsContainer}`;

const class_GoalProgressBtn = 'season--goal-progress-btn';
const sel_GoalProgressBtn = `.${class_GoalProgressBtn}`;

const class_TodayApptCard = 'season--today-card';
const sel_TodayApptCard = `.${class_TodayApptCard}`;

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

const data_CalendarCards = [
  {
    date: "2024-12-12",
    month: "Dec",
    day: "12",
    caption: "Appointment", 
    blurbText: "First visit. Way to go!",
    ctaText: "View Recap",
    ctaClass: "appt-report-btn"
  },
  {
    date: "2025-02-15",
    month: "Feb", 
    day: "15",
    caption: "Appointment",
    blurbText: "Nice improvements!",
    ctaText: "View Recap", 
    ctaClass: "appt-report-btn"
  },
  {
    date: "2025-03-02",
    month: "Mar",
    day: "2", 
    caption: "Appointment",
    blurbText: "You set new goals.",
    ctaText: "View Recap",
    ctaClass: "appt-report-btn"
  },
  {
    date: "2025-04-12",
    month: "Apr",
    day: "12",
    caption: "Appointment", 
    blurbText: "Nice work on your goals!",
    ctaText: "View Recap",
    ctaClass: "appt-report-btn"
  },
  {
    date: "2025-05-21", 
    month: "May",
    day: "21",
    caption: "Appointment",
    blurbText: "You ordered 10 meals.",
    ctaText: "View Recap",
    ctaClass: "appt-report-btn"
  },
  {
    date: "2025-07-11",
    month: "Jul", 
    day: "11",
    caption: "Appointment",
    blurbText: "Great eating improvements!",
    ctaText: "View Recap",
    ctaClass: "appt-report-btn"
  },
  {
    date: "2025-09-04", 
    month: "Sep",
    day: "04",
    caption: "Today",
    blurbText: "Get ready for your visit.",
    ctaText: "Prepare", 
    ctaClass: "pre-visit-summary-btn primary",
    isToday: true
  },
  {
    date: "2025-09-08", 
    month: "Sep",
    day: "08",
    caption: "Delivery",
    blurbText: "Three meals arriving.",
    ctaText: "Review order", 
    isDelivery: true,
    ctaClass: "appt-report-btn"
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

const data_ApptReport = {
  headerTitle: "4/13 - 5/21 Summary",
  providerData: {
    name: "Alejandra Sanchez, RD",
    title: "Registered Dietitian", 
    image: "img/alejandra.png"
  },
  tabData: [
    {
      id: "shared",
      label: "Activity",
      active: true
    },
    {
      id: "pre-visit", 
      label: "Pre-visit",
      active: false
    },
    {
      id: "post-visit",
      label: "Post-visit", 
      active: false
    }
  ],
  sharedContent: {
    rdDiscussions: [
      {
        date: "Apr 17",
        text: "Discussed afternoon energy crashes occurring daily around 2-3 PM and potential dietary causes.",
        excluded: true
      },
      {
        date: "Apr 13", 
        text: "Reviewed recent lab results showing elevated cholesterol (LDL: 145 mg/dL) and mild iron deficiency.",
        excluded: false
      },
      {
        date: "Apr 10",
        text: "Talked about irregular sleep patterns and their impact on morning energy levels.", 
        excluded: false
      }
    ],
    aiAssistantShares: [
      {
        date: "Apr 1",
        text: "Asked about meal prep strategies for busy weekdays and received customized suggestions.",
        excluded: false
      },
      {
        date: "Apr 1", 
        text: "Discussed iron-rich food options and how to improve absorption with vitamin C pairing.",
        excluded: true
      }
    ],
    recentMeals: [
      {
        date: "Apr 11",
        text: "Mediterranean Bowl with grilled chicken, quinoa, and tahini dressing (ordered 4 times).",
        excluded: false
      },
      {
        date: "Mar 30",
        text: "Green Goddess Salad with salmon and avocado (ordered 3 times this month).", 
        excluded: false
      }
    ]
  },
  preVisitContent: {
    currentHealthStatus: {
      text: "Michelle has been experiencing consistent energy fluctuations throughout the day, particularly noticeable afternoon crashes around 2-3 PM. Recent lab work shows slightly elevated cholesterol and mild iron deficiency.",
      points: [
        "Afternoon energy crashes (2-3 PM daily)",
        "Elevated cholesterol levels (LDL: 145 mg/dL)", 
        "Mild iron deficiency (ferritin: 18 ng/mL)",
        "Irregular sleep patterns affecting morning energy"
      ]
    },
    dietaryPatterns: {
      text: "Current eating habits include skipping breakfast 3-4 times per week, rushed lunches, and late dinners that are typically carb-heavy. Michelle tends to rely heavily on coffee for energy management.",
      points: [
        "Frequent breakfast skipping (3-4x per week)",
        "Rushed lunch breaks with processed foods", 
        "Late dinners (after 8 PM) with high carb content",
        "Excessive caffeine consumption (4-5 cups daily)"
      ]
    }
  },
  postVisitContent: {
    assignedGoals: [
      'Say "no" to work treats',
      "Drink 64oz of water a day",
      "Exercise 15-20 min, 5 days per week", 
      "Avoid eating while watching TV"
    ],
    visitSummary: {
      text: "Michelle met with Alejandra for a comprehensive follow-up consultation focusing on energy management and dietary optimization. Key progress was noted in several areas with new recommendations provided."
    },
    keyRecommendations: [
      "Increase morning protein to 25g minimum within 2 hours of waking",
      "Implement structured meal timing with no more than 4 hours between meals",
      "Add iron supplement (18mg) with vitamin C source", 
      "Reduce caffeine intake gradually from 4-5 cups to 2 cups daily"
    ]
  }
};

const data_Goals = [
  {
    id: 1,
    title: "Say \"no\" to work treats!",
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

const data_PreVisitSummary = {
  headerText: 'Your pre-visit summary for 8/15',
  providerData: {
    name: 'Alejandra Sanchez, RD',
    title: 'Registered Dietitian',
    image: 'img/alejandra.png'
  },
  summaryItems: {
    rdDiscussions: [
      { date: 'Aug 17', text: 'Discussed afternoon energy crashes occurring daily around 2-3 PM and potential dietary causes.', excluded: false },
      { date: 'Aug 13', text: 'Reviewed recent lab results showing elevated cholesterol (LDL: 145 mg/dL) and mild iron deficiency.', excluded: true },
      { date: 'Aug 10', text: 'Talked about irregular sleep patterns and their impact on morning energy levels.', excluded: false },
      { date: 'Aug 4', text: 'Established goals for consistent breakfast routine with 20g+ protein daily.', excluded: false }
    ],
    aiAssistantShares: [
      { date: 'Aug 1', text: 'Asked about meal prep strategies for busy weekdays and received customized suggestions.', excluded: false },
      { date: 'Aug 1', text: 'Discussed iron-rich food options and how to improve absorption with vitamin C pairing.', excluded: true },
      { date: 'Aug 1', text: 'Explored caffeine reduction strategies and healthy energy-boosting alternatives.', excluded: true },
      { date: 'Aug 14', text: 'Got recommendations for timing evening meals earlier to improve sleep quality.', excluded: false },
      { date: 'Aug 5', text: 'Received a personalized hydration tracking plan to maintain 64+ oz daily water intake.', excluded: false }
    ],
    recentMeals: [
      { date: 'Aug 11', text: 'Mediterranean Bowl with grilled chicken, quinoa, and tahini dressing (ordered 4 times).', excluded: false },
      { date: 'Jul 30', text: 'Green Goddess Salad with salmon and avocado (ordered 3 times this month).', excluded: false },
      { date: 'Jul 22', text: 'Steel-cut oats breakfast bowl with berries and almond butter (morning favorite).', excluded: false },
      { date: 'Jul 15', text: 'Lentil curry with brown rice and steamed vegetables (comfort meal choice).', excluded: false }
    ]
  },
  generatedSummary: {
    currentHealthStatus: {
      text: 'Michelle has been experiencing consistent energy fluctuations throughout the day, particularly noticeable afternoon crashes around 2-3 PM. Recent lab work shows slightly elevated cholesterol and mild iron deficiency.',
      points: [
        'Afternoon energy crashes (2-3 PM daily)',
        'Elevated cholesterol levels (LDL: 145 mg/dL)',
        'Mild iron deficiency (ferritin: 18 ng/mL)',
        'Irregular sleep patterns affecting morning energy'
      ]
    },
    dietaryPatterns: {
      text: 'Current eating habits include skipping breakfast 3-4 times per week, rushed lunches, and late dinners that are typically carb-heavy. Michelle tends to rely heavily on coffee for energy management.',
      points: [
        'Frequent breakfast skipping (3-4x per week)',
        'Rushed lunch breaks with processed foods',
        'Late dinners (after 8 PM) with high carb content',
        'Excessive caffeine consumption (4-5 cups daily)',
        'Stress-induced meal skipping patterns'
      ]
    },
    upcomingGoals: {
      text: 'The primary focus will be addressing energy stability through improved meal timing and nutrient density. We\'ll also work on strategies for better meal planning despite a busy schedule.',
      points: [
        'Establish consistent breakfast routine with 20g+ protein',
        'Implement meal prep strategies for busy weekdays',
        'Address iron deficiency through dietary modifications',
        'Create sustainable evening meal timing',
        'Reduce caffeine dependency gradually'
      ]
    },
    progressSinceLastVisit: {
      text: 'Michelle has successfully implemented several recommendations from our previous session, including regular hydration tracking and incorporating more leafy greens into her diet.',
      points: [
        'Consistent water intake tracking (64+ oz daily)',
        'Added spinach/kale to smoothies 4x per week',
        'Reduced late-night snacking by 60%',
        'Started taking recommended vitamin D supplement',
        'Improved meal timing on weekends'
      ]
    }
  }
};

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
    modalId: 'seasonApptReport',
    closeBtnId: 'seasonApptReport-close-btn'
  },
  {
    openBtnSelector: '.pre-visit-summary-btn',
    modalId: 'seasonPreVisitSummary', 
    closeBtnId: 'seasonPreVisitSummary-close-btn' 
  }
];

document.addEventListener('DOMContentLoaded', () => {
  
  // Appointment callouts 
  enableApptSoonAlerts(true, {
    userName: 'Michelle',
    providerName: 'Alejandra',
    providerImage: 'img/alejandra.png',
    timeRemaining: '10 minutes',
    shortTimeDisplay: ':10'
  });

  // Splash container 
  initSplashContainer({
    headline: 'Welcome back, Michelle!',
    message: 'You\'ve done <strong>5 straight days</strong> of exercise. Consider skipping your run today and rest. But keep it up!'
  });

  // Goals tracking panel 
  initGoalsTrackingPanel({
    headerText: 'How are your goals going?',
    instructionText: 'Rate your goal progress today. Scroll back to see how you did in the past.',
    dateRange: {
      startDate: new Date('2025-08-26'),
      endDate: new Date('2025-09-15')
    },
    goals: data_Goals
  });

  // Pre-visit summary panel
  initPreVisitSummary(data_PreVisitSummary);

  initApptReport(data_ApptReport);

  // Must come after createCalendarCards() and createGoalModals()
  const configs_GoalModal = createconfigs_GoalModal(data_Goals);
  initModals([...configs_StaticModal, ...configs_GoalModal]);
});

// Enabled only when within X hours of next appt
function enableApptSoonAlerts(enabled, apptData) {

  if (!enabled) {
    elem_ApptSoonAlert.classList.add('hidden');
    elem_ApptSoonAlert.innerHTML = ''; 
    return;
  }

  elem_ApptSoonAlert.innerHTML = `
    <div id="seasonApptSoonModal" class="apt-soon--modal">
      <h2>Hey ${apptData.userName}!</h2>
      <p>Your appointment with ${apptData.providerName} is in ${apptData.timeRemaining}.</p>
      <img class="rd-avatar" src="${apptData.providerImage}" alt="${apptData.providerName}, RD">
      <button class="cta-btn">Join now</button>
      <button class="no-thanks-btn">Just take me to Season for now</button>
    </div>
    <div id="seasonApptSoonBug" class="apt-soon--short hidden">
      <div class="time">Appointment in ${apptData.shortTimeDisplay}</div>
      <button class="cta-btn">Join now!</button>
    </div>
  `;

  // Show the alert
  elem_ApptSoonAlert.classList.remove('hidden');

  // Get references to newly created elements
  const modal = elem_ApptSoonAlert.querySelector('#seasonApptSoonModal');
  const bug = elem_ApptSoonAlert.querySelector('#seasonApptSoonBug');
  const skipModalBtn = modal.querySelector('.no-thanks-btn');
  const joinNowBugBtn = bug.querySelector('.cta-btn');
  
  skipModalBtn.addEventListener('click', (e) => {
    e.preventDefault();
    modal.classList.add('hidden');
    bug.classList.remove('hidden');
  });
  joinNowBugBtn.addEventListener('click', (e) => {
    e.preventDefault();
    bug.classList.add('hidden');
  });
}

// Parent method that creates the full splash container
function initSplashContainer(welcomeData) {

  // Build by sub-component...
  createSplashContent(welcomeData);
  createCalendarCards();
  enableCalendarCardSwiping();
  enableSplashContainerFade();

  // Create splash content (welcome message)
  function createSplashContent(welcomeData = {}) {
    elem_SplashContainer.innerHTML = `
      <div>
        <h1>${welcomeData.headline}</h1>
        <p>${welcomeData.message}</p>
      </div>
      <div class="card-timeline" id="card-timeline">
        <div class="timeline-nav-arrows">
          <div class="nav-arrow nav-arrow-left" id="nav-arrow-left">
            <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M16 19L9 12L16 5" stroke="black" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
          </div>
          <div class="nav-arrow nav-arrow-right" id="nav-arrow-right">
            <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M8 5L15 12L8 19" stroke="black" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
          </div>
        </div>
        <div class="cards-container" id="seasonCalendarCardsContainer">
          <!-- Event cards will be generated by JavaScript (createCalendarCards) -->
        </div>
      </div>
    `;
  }

  // Create carousel of event cards
  function createCalendarCards() {
    const elem_CalendarCardsContainer = document.getElementById('seasonCalendarCardsContainer');
    
    // Clear existing content
    elem_CalendarCardsContainer.innerHTML = '';

    data_CalendarCards.forEach((event, index) => {
      const cardElement = document.createElement('div');
      cardElement.innerHTML = createEventCardContent(event, index);
      elem_CalendarCardsContainer.appendChild(cardElement.firstElementChild);
    });

    function createEventCardContent(event, index) {
      extraClass = ''

      if (event.isToday) {
        extraClass = ` ${class_TodayApptCard} today`;
      } else if (event.isDelivery) {
        extraClass = ` delivery`;
      }

      // Only render button if ctaText exist
      const buttonHTML = event.ctaText 
        ? `<button class="card-cta ${event.ctaClass}">${event.ctaText}</button>`
        : '';
      
      return `
        <div class="${class_ApptCard} event-card${extraClass}" data-event-date="${event.date}" data-index="${index}">
          <div class="caption">${event.caption}</div>
          <div class="card-date">
            <div class="card-month">${event.month}</div>
            <div class="card-day">${event.day}</div>
          </div>
          <div class="card-blurb">
            <div class="card-blurb-text">${event.blurbText}</div>
          </div>
          ${buttonHTML}
        </div>
      `;
    }
  }

  // Swipe effect for event cards collection
  function enableCalendarCardSwiping() {
    const elem_CalendarCardsContainer = document.getElementById('seasonCalendarCardsContainer');
    const leftArrow = document.getElementById('nav-arrow-left');
    const rightArrow = document.getElementById('nav-arrow-right');

    const apptCards = document.querySelectorAll(sel_ApptCard);

    // Find the index of the card with "today" class
    let curIndex = 0;
    const todayCard = elem_CalendarCardsContainer.querySelector(sel_TodayApptCard);

    if (todayCard) {
      curIndex = parseInt(todayCard.dataset.index) || 0;
    }

    let startX = 0;
    let isDragging = false;

    // Desktop arrow navigation
    if (leftArrow && rightArrow) {
      leftArrow.addEventListener('click', swipeRight);
      rightArrow.addEventListener('click', swipeLeft);
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
    updateArrowStates();

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

      updateArrowStates();
    }

    function updateArrowStates() {
      if (leftArrow && rightArrow) {
        // Disable left arrow if at first card
        if (curIndex === 0) {
          leftArrow.classList.add('disabled');
        } else {
          leftArrow.classList.remove('disabled');
        }
        
        // Disable right arrow if at last card
        if (curIndex === apptCards.length - 1) {
          rightArrow.classList.add('disabled');
        } else {
          rightArrow.classList.remove('disabled');
        }
      }
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
  }

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
      
      elem_SplashContainer.style.transform = `translateX(-50%) translateY(${translateY}vh)`;
      elem_SplashContainer.style.opacity = opacity;
    });
  }
}

// Parent method that creates the full goals tracking section
function initGoalsTrackingPanel(panelData) {

  // Build by sub-component...
  createGoalsTrackingPanel(panelData);
  createGoalsTrackingCalendar(panelData.dateRange.startDate, panelData.dateRange.endDate);
  createGoalGridSquares(panelData.goals);
  createGoalModals(panelData.goals);
  enableGoalProgressSelection();
  initGoalAddMoreInput();
  initGoalsTrackingHeaderClick();

  // Create goals tracking panel content
  function createGoalsTrackingPanel(panelData = {}) {
    // Default data
    const defaultData = {
      headerText: 'How are your goals going?',
      instructionText: 'Rate your goal progress today. Scroll back to see how you did in the past.'
    };

    // Merge with provided data
    const goalData = { ...defaultData, ...panelData };

    // Create the content
    elem_GoalsTrackingPanel.innerHTML = `
      <div class="bottom-panel-header">
        ${goalData.headerText}
      </div>
      <div class="goal-instructions">
        ${goalData.instructionText}
      </div>
      <div class="goal-calendar-container">
        <div id="seasonGoalsDailyCalendar" class="goal-calendar">
          <!-- Calendar will be generated by JavaScript -->
        </div>
      </div>
      <div class="bottom-panel-content">
        <div id="seasonGoalGridContainer" class="bottom-panel-grid">
          <!-- Squares will be generated by JavaScript -->
        </div>
      </div>
    `;
  }

  // Sets up horizontal days UI for goal tracking
  function createGoalsTrackingCalendar(startDate, endDate) {
    const calendar = document.getElementById('seasonGoalsDailyCalendar');

    const today = new Date();
    let curIndex = 0; // Will be set to today's index
    
    // Generate calendar days
    const days = [];
    let currentDate = new Date(startDate);
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
          console.log('clicked')
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
  function createGoalGridSquares(goals) {
    const elem_GoalGridContainer = document.getElementById('seasonGoalGridContainer');

    // Clear existing content
    elem_GoalGridContainer.innerHTML = '';
    
    goals.forEach(goal => {
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
        <button class="bottom-panel-square square square-${goal.id} goals-${goal.id}-logging-btn">
          <div class="rated">
            ${svgContent}
          </div>
          <span>${goal.title}</span>
        </button>
      `;
    }
  }

  // Creates goal modals
  function createGoalModals(goals) {
    const elem_GoalModalsContainer = document.getElementById('seasonGoalModalsContainer');
    
    goals.forEach(goal => {
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
                  <button class="${class_GoalProgressBtn} rating-btn" data-rating="negative">
                    <span>I did great!</span>
                    ${svgs.happy_face}     
                  </button>
                </div>
                <div class="rating-option">
                  <button class="${class_GoalProgressBtn} rating-btn" data-rating="neutral">
                    <span>I did OK.</span>
                    ${svgs.mid_face}
                  </button>
                </div>
                <div class="rating-option">
                  <button class="${class_GoalProgressBtn} rating-btn" data-rating="positive">
                    <span>I didn't do so well.</span>
                    ${svgs.sad_face}
                  </button>
                </div>
              </div>
              <div class="${class_GoalActionBtnsContainer} goal-action-buttons hidden">
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

  // Goal progress selection + add more buttons
  function enableGoalProgressSelection() {
    // Add event listeners to all rating options
    document.querySelectorAll(sel_GoalProgressBtn).forEach(option => {
      option.addEventListener('click', function() {
        const parentGoal = this.closest('.popup-content');
        const goalAddMoreSection = parentGoal.querySelector(sel_GoalActionBtnsContainer);
        
        // Remove selected class from all rating options in this goal
        parentGoal.querySelectorAll(sel_GoalProgressBtn).forEach(opt => {
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

  // Goal add more input (text, speak, upload)
  function initGoalAddMoreInput() {
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
}

// Master method that creates the full pre-visit summary component
function initPreVisitSummary(summaryData) {

  const eyeToggleHTML = `
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
  
  // Build by sub-component...
  createPreVisitSummaryContent(summaryData);
  
  // Get DOM references after content creation
  const elem_PreVisitSummaryItemToggles = document.getElementById('seasonPreVisitSummaryItemToggles');
  const elem_PreVisitSummaryGeneratedReport = document.getElementById('seasonPreVisitSummaryGeneratedReport');
  
  // Initialize sub-components
  initPreVisitSummaryItemToggles(); 
  initPreVisitSummaryEdit();
  initCustomInput();

  // Create pre-visit summary content
  function createPreVisitSummaryContent(summaryData = {}) {

    const modalContent = elem_PreVisitSummary.querySelector('.popup-content');
    
    // Clear all existing content
    modalContent.innerHTML = '';
    
    // Create and add the close button first
    const closeBtn = document.createElement('div');
    closeBtn.className = 'close';
    closeBtn.id = 'seasonPreVisitSummary-close-btn';
    closeBtn.innerHTML = `
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M18 6L6 18" stroke="black" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
        <path d="M6 6L18 18" stroke="black" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
      </svg>
    `;
    modalContent.appendChild(closeBtn);
    
    // Add the main content
    const contentDiv = document.createElement('div');
    contentDiv.className = 'pre-visit-summary-content';
    contentDiv.innerHTML = `
      <!-- Header -->
      <div class="summary-header">${summaryData.headerText}</div>
      
      <!-- Provider info -->
      <div class="summary-to">
        <img src="${summaryData.providerData.image}" alt="${summaryData.providerData.name}" class="avatar">
        <div class="rd-info">
          <div class="rd-name">${summaryData.providerData.name}</div>
          <div class="rd-title">${summaryData.providerData.title}</div>
        </div>
      </div>

      <!-- Pre-visit summary item toggles -->
      <div id="seasonPreVisitSummaryItemToggles" class="edit-form">
        <div class="edit-disclaimer">
          Review what you've done since last visit. Tap to
          hide things you don't want to share below. 
          Scroll to the bottom to share something else before your visit.
          <div class="bg-sparkle">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" id="Reward-Stars-2--Streamline-Ultimate" height="42" width="42">
              <desc>Reward Stars 2 Streamline Icon: https://streamlinehq.com</desc>
              <defs></defs>
              <path d="M10.751 1.375c-0.025 6.281 3.029 9.844 10 10 -6.465 -0.025 -9.672 3.441 -10 10 -0.063 -6.187 -2.828 -10.009 -10 -10 6.416 -0.09 9.975 -3.187 10 -10 Z" fill="none" stroke="rgba(132,197,230,0.7)" stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5"></path>
              <path d="m19.012 1.375 0 4" fill="none" stroke="rgba(132,197,230,0.7)" stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5"></path>
              <path d="m17.012 3.375 4 0" fill="none" stroke="rgba(132,197,230,0.7)" stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5"></path>
              <path d="m21.25 18.625 0 4" fill="none" stroke="rgba(132,197,230,0.7)" stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5"></path>
              <path d="m19.25 20.625 4 0" fill="none" stroke="rgba(132,197,230,0.7)" stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5"></path>
            </svg>
          </div>
        </div>
        ${createSummaryItemSections(summaryData.summaryItems)}
        <div class="edit-section">
          <h3>Anything else you'd like to share?</h3>
          <div class="custom-input-section">
            <textarea 
              id="custom-input-textarea" 
              class="custom-input-textarea" 
              placeholder="Add anything else you'd like to share with ${summaryData.providerData.name.split(',')[0]}..."></textarea>
            <button class="save-custom-btn" id="save-custom-btn">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M22 2L11 13" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                <path d="M22 2L15 22L11 13L2 9L22 2Z" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
              </svg>
            </button>
          </div>
        </div>
      </div>

      <!-- Pre-visit generated report (Hidden to start) -->
      <div id="seasonPreVisitSummaryGeneratedReport" class="summary-content hidden">
        ${createGeneratedSummaryContent(summaryData.generatedSummary)}
      </div>

      <!-- Toggle button -->
      <div class="audit-button" id="pre-visit-action-btn">
        <div class="audit-button--manage">
          <span>Manage what you want to share</span>
          <svg viewBox="0 0 24 24" width="24" height="24">
            <path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34c-.39-.39-1.02-.39-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z" fill="currentColor"/>
          </svg>
        </div>
        <div class="audit-button--see">
          <span>Update your pre-visit summary</span>
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" id="Reward-Stars-2--Streamline-Ultimate" height="24" width="24">
            <desc>Reward Stars 2 Streamline Icon: https://streamlinehq.com</desc>
            <defs></defs>
            <path d="M10.751 1.375c-0.025 6.281 3.029 9.844 10 10 -6.465 -0.025 -9.672 3.441 -10 10 -0.063 -6.187 -2.828 -10.009 -10 -10 6.416 -0.09 9.975 -3.187 10 -10 Z" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5"></path>
            <path d="m19.012 1.375 0 4" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5"></path>
            <path d="m17.012 3.375 4 0" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5"></path>
            <path d="m21.25 18.625 0 4" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5"></path>
            <path d="m19.25 20.625 4 0" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5"></path>
          </svg>
        </div>
      </div>

      <!-- Regenerating state (hidden by default) -->
      <div class="regenerating-state hidden" id="regenerating-state">
        <div class="regenerating-spinner"></div>
        <div class="regenerating-text">Regenerating pre-visit summary...</div>
        <div class="regenerating-subtext">This will take just a moment!</div>
      </div>
    `;
    
    modalContent.appendChild(contentDiv);
  }

  // Helper function to create summary item sections
  function createSummaryItemSections(summaryItems) {
    return `
      <div class="edit-section">
        <h3>What you discussed with your RD</h3>
        <div class="edit-items">
          ${summaryItems.rdDiscussions.map((item, index) => `
            <div class="season--shareable-item edit-item${item.excluded ? ' excluded' : ''}" data-item-id="rd-${index + 1}">
              <div class="item-date">${item.date}</div>
              <div class="item-text">${item.text}</div>
              ${eyeToggleHTML}
            </div>
          `).join('')}
        </div>
      </div>
      
      <div class="edit-section">
        <h3>What you shared with Season Assistant</h3>
        <div class="edit-items">
          ${summaryItems.aiAssistantShares.map((item, index) => `
            <div class="season--shareable-item edit-item${item.excluded ? ' excluded' : ''}" data-item-id="ai-${index + 1}">
              <div class="item-date">${item.date}</div>
              <div class="item-text">${item.text}</div>
              ${eyeToggleHTML}
            </div>
          `).join('')}
        </div>
      </div>
      
      <div class="edit-section">
        <h3>Meals you ordered recently</h3>
        <div class="edit-items">
          ${summaryItems.recentMeals.map((item, index) => `
            <div class="season--shareable-item edit-item${item.excluded ? ' excluded' : ''}" data-item-id="meal-${index + 1}">
              <div class="item-date">${item.date}</div>
              <div class="item-text">${item.text}</div>
              ${eyeToggleHTML}
            </div>
          `).join('')}
        </div>
      </div>
    `;
  }

  // Helper function to create generated summary content
  function createGeneratedSummaryContent(generatedSummary) {
    return `
      <div class="content-section">
        <h3 class="section-title">Current Health Status</h3>
        <p class="section-text">${generatedSummary.currentHealthStatus.text}</p>
        <ul class="section-list">
          ${generatedSummary.currentHealthStatus.points.map(point => `<li>${point}</li>`).join('')}
        </ul>
      </div>
      <div class="content-section">
        <h3 class="section-title">Dietary Patterns & Concerns</h3>
        <p class="section-text">${generatedSummary.dietaryPatterns.text}</p>
        <ul class="section-list">
          ${generatedSummary.dietaryPatterns.points.map(point => `<li>${point}</li>`).join('')}
        </ul>
      </div>
      <div class="content-section">
        <h3 class="section-title">Goals for Upcoming Visit</h3>
        <p class="section-text">${generatedSummary.upcomingGoals.text}</p>
        <ul class="section-list">
          ${generatedSummary.upcomingGoals.points.map(point => `<li>${point}</li>`).join('')}
        </ul>
      </div>
      <div class="content-section">
        <h3 class="section-title">Progress Since Last Visit</h3>
        <p class="section-text">${generatedSummary.progressSinceLastVisit.text}</p>
        <ul class="section-list">
          ${generatedSummary.progressSinceLastVisit.points.map(point => `<li>${point}</li>`).join('')}
        </ul>
      </div>
    `;
  }

  // Sets the share/exclude functionality for pre-visit summaries items
  // Dev note: Can add API call to regenerate summary on each click? Or on submit.
  function initPreVisitSummaryItemToggles() {
    const shareableItems = document.querySelectorAll('.season--shareable-item');
    shareableItems.forEach(item => {
      enableShareableItemToggle(item);
    });
  }

  // Initialize pre-visit summary edit functionality
  function initPreVisitSummaryEdit() {
    const actionBtn = document.getElementById('pre-visit-action-btn');
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

  // Initialize custom input functionality
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
          ${eyeToggleHTML}
        `;
        enableShareableItemToggle(newItem);
        customItemsContainer.appendChild(newItem);
        textarea.value = '';
        textarea.focus();
      }
    });
  }
}

// Master method to initialize appointment report content
function initApptReport(reportData) {
  const modalContent = elem_ApptReport.querySelector('.popup-content');

  // Clear all existing content
  modalContent.innerHTML = '';
  
  // Create and add the close button first
  const closeBtn = document.createElement('div');
  closeBtn.className = 'close';
  closeBtn.id = 'seasonApptReport-close-btn';
  closeBtn.innerHTML = `
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M18 6L6 18" stroke="black" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
      <path d="M6 6L18 18" stroke="black" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
    </svg>
  `;
  modalContent.appendChild(closeBtn);
  
  // Clear existing content except close button
  const existingCloseBtn = modalContent.querySelector('.close');
  modalContent.innerHTML = '';
  modalContent.appendChild(existingCloseBtn);
  
  // Create and add main content
  const contentDiv = document.createElement('div');
  contentDiv.className = 'appt-report-summary-content';
  contentDiv.innerHTML = createAppointmentReportContent(reportData);
  modalContent.appendChild(contentDiv);
  
  // Re-initialize tab functionality after content creation
  enableApptReportTabs();

  function enableApptReportTabs() {
    const tabBtns = document.getElementById('seasonPrevReportTabContainer').querySelectorAll('div');
    const tabContents = document.querySelectorAll('.season--prev-report-tab-content');

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

  function createAppointmentReportContent(reportData) {
    return `
      <!-- Header -->
      <div class="summary-header" id="appt-report-header">${reportData.headerTitle}</div>
      
      <!-- Provider info -->
      <div class="summary-to">
        <img src="${reportData.providerData.image}" alt="${reportData.providerData.name}" class="avatar">
        <div class="rd-info">
          <div class="rd-name">${reportData.providerData.name}</div>
          <div class="rd-title">${reportData.providerData.title}</div>
        </div>
      </div>

      <!-- Tabs -->
      <div id="seasonPrevReportTabContainer" class="appt-report-tabs">
        ${reportData.tabData.map(tab => `
          <div class="tab-btn${tab.active ? ' active' : ''}" data-tab="${tab.id}">${tab.label}</div>
        `).join('')}
      </div>

      <!-- Tab Content: What you shared -->
      <div class="season--prev-report-tab-content tab-content${reportData.tabData.find(t => t.id === 'shared')?.active ? ' active' : ''}" id="shared-content">
        <div class="edit-form-content">
          <div class="edit-section">
            <h3>What you discussed with your RD</h3>
            <div class="edit-items">
              ${reportData.sharedContent.rdDiscussions.map(item => `
                <div class="edit-item${item.excluded ? ' excluded' : ''}">
                  <div class="item-date">${item.date}</div>
                  <div class="item-text">${item.text}</div>
                </div>
              `).join('')}
            </div>
          </div>
          
          <div class="edit-section">
            <h3>What you shared with Season Assistant</h3>
            <div class="edit-items">
              ${reportData.sharedContent.aiAssistantShares.map(item => `
                <div class="season--shareable-item edit-item${item.excluded ? ' excluded' : ''}">
                  <div class="item-date">${item.date}</div>
                  <div class="item-text">${item.text}</div>
                </div>
              `).join('')}
            </div>
          </div>
          
          <div class="edit-section">
            <h3>Meals you ordered recently</h3>
            <div class="edit-items">
              ${reportData.sharedContent.recentMeals.map(item => `
                <div class="season--shareable-item edit-item${item.excluded ? ' excluded' : ''}">
                  <div class="item-date">${item.date}</div>
                  <div class="item-text">${item.text}</div>
                </div>
              `).join('')}
            </div>
          </div>
        </div>
      </div>

      <!-- Tab Content: Pre-visit -->
      <div class="season--prev-report-tab-content tab-content${reportData.tabData.find(t => t.id === 'pre-visit')?.active ? ' active' : ''}" id="pre-visit-content">
        <div class="summary-content-style">
          <div class="content-section">
            <h3 class="section-title">Current Health Status</h3>
            <p class="section-text">${reportData.preVisitContent.currentHealthStatus.text}</p>
            <ul class="section-list">
              ${reportData.preVisitContent.currentHealthStatus.points.map(point => `<li>${point}</li>`).join('')}
            </ul>
          </div>
          
          <div class="content-section">
            <h3 class="section-title">Dietary Patterns & Concerns</h3>
            <p class="section-text">${reportData.preVisitContent.dietaryPatterns.text}</p>
            <ul class="section-list">
              ${reportData.preVisitContent.dietaryPatterns.points.map(point => `<li>${point}</li>`).join('')}
            </ul>
          </div>
        </div>
      </div>

      <!-- Tab Content: Post-visit -->
      <div class="season--prev-report-tab-content tab-content${reportData.tabData.find(t => t.id === 'post-visit')?.active ? ' active' : ''}" id="post-visit-content">
        <div class="summary-content-style">
          <div class="content-section">
            <h3 class="section-title">Assigned Goals</h3>
            <ul class="section-list">
              ${reportData.postVisitContent.assignedGoals.map(goal => `<li>${goal}</li>`).join('')}
            </ul>
          </div>
          <div class="content-section">
            <h3 class="section-title">Visit Summary</h3>
            <p class="section-text">${reportData.postVisitContent.visitSummary.text}</p>
          </div>
          <div class="content-section">
            <h3 class="section-title">Key Recommendations</h3>
            <ul class="section-list">
              ${reportData.postVisitContent.keyRecommendations.map(rec => `<li>${rec}</li>`).join('')}
            </ul>
          </div>
        </div>
      </div>
    `;
  }
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

function createconfigs_GoalModal(goals) {
  const modalConfigs = [];
  
  goals.forEach(goal => {
    modalConfigs.push({
      openBtnSelector: `.goals-${goal.id}-logging-btn`,
      modalId: `goals-${goal.id}-logging`,
      closeBtnId: `goals-${goal.id}-logging-close-btn`
    });
  });
  
  return modalConfigs;
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
