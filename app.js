/* ==========================================
   AeroTask - Premium Glassmorphic Application Code
   ========================================== */

// --- Constants & Color Presets ---
const COLOR_PRESETS = [
  '#8b5cf6', // Violet
  '#3b82f6', // Blue
  '#ec4899', // Pink
  '#10b981', // Emerald
  '#f59e0b', // Amber
  '#ef4444', // Rose
  '#06b6d4', // Cyan
  '#6366f1'  // Indigo
];

const DEFAULT_CATEGORIES = [
  { id: 'work', name: 'Work', color: '#8b5cf6' },
  { id: 'personal', name: 'Personal', color: '#3b82f6' },
  { id: 'shopping', name: 'Shopping', color: '#ec4899' },
  { id: 'health', name: 'Health', color: '#10b981' }
];

const MOTIVATIONAL_QUOTES = [
  "Let's get some tasks done today!",
  "Small steps lead to big accomplishments.",
  "Focus on progress, not perfection.",
  "You're doing great! Keep the momentum going.",
  "One task at a time, you've got this!",
  "Make today count!",
  "Organized mind, productive day."
];

// --- Application State ---
let state = {
  tasks: [],
  categories: [],
  activeCategory: 'all',
  activeStatus: 'all',
  searchQuery: '',
  sortBy: 'createdAt-desc',
  soundEnabled: true,
  theme: 'dark',
  userName: 'Ayush',
  selectedCategoryColor: COLOR_PRESETS[0]
};

// --- Undo Deletion Buffer ---
let undoBuffer = {
  task: null,
  timeoutId: null
};

// --- DOM Selector Helpers ---
const $ = (selector) => document.querySelector(selector);
const $$ = (selector) => document.querySelectorAll(selector);

// --- Initialization ---
document.addEventListener('DOMContentLoaded', () => {
  loadLocalStorage();
  setupTheme();
  setupSoundToggle();
  renderCategories();
  renderTasks();
  updateProgressTracker();
  setupGreetings();
  setupEventListeners();
  setupColorPicker();
  populateCategorySelects();
  
  // Initialize Lucide Icons
  lucide.createIcons();
});

// --- Local Storage Management ---
function loadLocalStorage() {
  const savedTasks = localStorage.getItem('aerotask_tasks');
  const savedCategories = localStorage.getItem('aerotask_categories');
  const savedSound = localStorage.getItem('aerotask_sound_enabled');
  const savedTheme = localStorage.getItem('aerotask_theme');
  const savedUserName = localStorage.getItem('aerotask_username');

  // Load username
  state.userName = savedUserName || 'Ayush';

  // Load Categories
  if (savedCategories) {
    state.categories = JSON.parse(savedCategories);
  } else {
    state.categories = [...DEFAULT_CATEGORIES];
    saveCategories();
  }

  // Load Tasks (or load onboarding demo tasks if empty)
  if (savedTasks) {
    state.tasks = JSON.parse(savedTasks);
  } else {
    state.tasks = [
      {
        id: 'demo-1',
        title: 'Welcome to AeroTask! ⚡',
        description: 'This is a premium, glassmorphic task manager. Check out our neat animations!',
        dueDate: getFutureDate(0),
        priority: 'high',
        category: 'Work',
        completed: false,
        createdAt: Date.now() - 100000
      },
      {
        id: 'demo-2',
        title: 'Check me off to hear a satisfying chime 🎵',
        description: 'Complete tasks to increase your progress bar in the sidebar.',
        dueDate: getFutureDate(0),
        priority: 'medium',
        category: 'Personal',
        completed: false,
        createdAt: Date.now() - 50000
      },
      {
        id: 'demo-3',
        title: 'Plan a healthy weekly meal prep 🍏',
        description: 'Set due dates and priorities to keep your schedule perfectly organized.',
        dueDate: getFutureDate(2),
        priority: 'low',
        category: 'Health',
        completed: false,
        createdAt: Date.now()
      }
    ];
    saveTasks();
  }

  // Load settings
  if (savedSound !== null) {
    state.soundEnabled = savedSound === 'true';
  }
  if (savedTheme) {
    state.theme = savedTheme;
  } else {
    // Detect system dark mode preference
    state.theme = window.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark';
  }
}

function saveTasks() {
  localStorage.setItem('aerotask_tasks', JSON.stringify(state.tasks));
}

function saveCategories() {
  localStorage.setItem('aerotask_categories', JSON.stringify(state.categories));
}

function saveUserName() {
  localStorage.setItem('aerotask_username', state.userName);
}

function getFutureDate(daysAhead) {
  const date = new Date();
  date.setDate(date.getDate() + daysAhead);
  return date.toISOString().split('T')[0];
}

// --- Theme Setup ---
function setupTheme() {
  document.documentElement.setAttribute('data-theme', state.theme);
  
  if (state.theme === 'light') {
    $('#theme-icon-sun').classList.add('hidden');
    $('#theme-icon-moon').classList.remove('hidden');
  } else {
    $('#theme-icon-sun').classList.remove('hidden');
    $('#theme-icon-moon').classList.add('hidden');
  }
}

function toggleTheme() {
  state.theme = state.theme === 'dark' ? 'light' : 'dark';
  localStorage.setItem('aerotask_theme', state.theme);
  setupTheme();
  showToast(`Switched to ${state.theme} mode`, '🎨');
}

// --- Sound Toggle ---
function setupSoundToggle() {
  updateSoundIcon();
}

function toggleSound() {
  state.soundEnabled = !state.soundEnabled;
  localStorage.setItem('aerotask_sound_enabled', state.soundEnabled);
  updateSoundIcon();
  showToast(state.soundEnabled ? 'Chime sound enabled' : 'Chime sound muted', state.soundEnabled ? '🔊' : '🔇');
}

function updateSoundIcon() {
  if (state.soundEnabled) {
    $('#sound-icon-on').classList.remove('hidden');
    $('#sound-icon-off').classList.add('hidden');
  } else {
    $('#sound-icon-on').classList.add('hidden');
    $('#sound-icon-off').classList.remove('hidden');
  }
}

// --- Web Audio API Synth Sound effect ---
function playChimeSound() {
  if (!state.soundEnabled) return;

  try {
    const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    const playNote = (freq, time, duration) => {
      const osc = audioCtx.createOscillator();
      const gainNode = audioCtx.createGain();
      
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, time);
      
      // Pitch slide upward for bubbly feel
      osc.frequency.exponentialRampToValueAtTime(freq * 1.05, time + duration);
      
      gainNode.gain.setValueAtTime(0.08, time);
      gainNode.gain.exponentialRampToValueAtTime(0.0001, time + duration);
      
      osc.connect(gainNode);
      gainNode.connect(audioCtx.destination);
      
      osc.start(time);
      osc.stop(time + duration);
    };

    const now = audioCtx.currentTime;
    // Premium, double-chime arpeggio
    playNote(659.25, now, 0.15); // E5
    playNote(880.00, now + 0.08, 0.28); // A5
  } catch (error) {
    console.error('AudioContext could not be initialized:', error);
  }
}

// --- Sidebar Progress Widget ---
function updateProgressTracker() {
  const total = state.tasks.length;
  const completed = state.tasks.filter(t => t.completed).length;
  const percentage = total > 0 ? Math.round((completed / total) * 100) : 0;

  $('#progress-percentage').textContent = `${percentage}%`;
  $('#progress-bar').style.width = `${percentage}%`;
  $('#progress-done-count').textContent = `${completed} of ${total} tasks completed`;

  // Dynamic Quote
  let quote = MOTIVATIONAL_QUOTES[0];
  if (total === 0) {
    quote = "Add some tasks to start your day!";
  } else if (percentage === 100) {
    quote = "Phenomenal! You've checked off all your goals today! 🎉";
  } else if (percentage >= 70) {
    quote = "Looking fantastic! Almost at the finish line.";
  } else if (percentage >= 40) {
    quote = "Great work! You're making steady progress.";
  } else if (percentage > 0) {
    quote = "Keep pushing, every checkbox counts!";
  }
  $('#progress-quote').textContent = `"${quote}"`;
}

// --- Date & Greetings Helper ---
function setupGreetings() {
  const hour = new Date().getHours();
  let timeStr = "day";
  if (hour < 12) timeStr = "morning 🌅";
  else if (hour < 18) timeStr = "afternoon ☀️";
  else timeStr = "evening 🌙";

  $('#welcome-greeting').innerHTML = `Good ${timeStr}, <span class="editable-name" id="user-name-span" title="Click to rename">${escapeHTML(state.userName)}</span>`;

  // Attach event listener for inline editing
  const nameSpan = $('#user-name-span');
  if (nameSpan) {
    nameSpan.addEventListener('click', startEditingName);
  }

  // Set Today's date format (e.g. Friday, Jul 3)
  const options = { weekday: 'long', month: 'short', day: 'numeric' };
  $('#current-date').textContent = new Date().toLocaleDateString('en-US', options);
}

function startEditingName() {
  const nameSpan = $('#user-name-span');
  if (!nameSpan) return;

  const originalName = state.userName;
  
  // Replace span with input field
  const input = document.createElement('input');
  input.type = 'text';
  input.className = 'name-edit-input';
  input.value = originalName;
  input.maxLength = 15;
  
  nameSpan.replaceWith(input);
  input.focus();
  input.select();

  let finished = false;

  const saveAndExit = () => {
    if (finished) return;
    finished = true;
    
    const newName = input.value.trim();
    if (newName && newName !== originalName) {
      state.userName = newName;
      saveUserName();
      showToast(`Renamed user to "${newName}"`, '👤');
    }
    setupGreetings();
  };

  const cancelAndExit = () => {
    if (finished) return;
    finished = true;
    setupGreetings();
  };

  input.addEventListener('blur', saveAndExit);
  
  input.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      saveAndExit();
    } else if (e.key === 'Escape') {
      cancelAndExit();
    }
  });
}

// --- Color Picker for Custom Categories ---
function setupColorPicker() {
  const grid = $('#color-picker-grid');
  grid.innerHTML = '';

  COLOR_PRESETS.forEach((color, idx) => {
    const swatch = document.createElement('div');
    swatch.classList.add('color-swatch');
    swatch.style.backgroundColor = color;
    if (idx === 0) {
      swatch.classList.add('selected');
      state.selectedCategoryColor = color;
    }

    swatch.addEventListener('click', () => {
      $$('.color-swatch').forEach(s => s.classList.remove('selected'));
      swatch.classList.add('selected');
      state.selectedCategoryColor = color;
    });

    grid.appendChild(swatch);
  });
}

// --- Populate Category Select Elements ---
function populateCategorySelects() {
  const select = $('#task-category');
  select.innerHTML = '';

  state.categories.forEach(cat => {
    const opt = document.createElement('option');
    opt.value = cat.name;
    opt.textContent = cat.name;
    select.appendChild(opt);
  });
}

// --- Rendering Dynamic Categories (Sidebar) ---
function renderCategories() {
  const list = $('#category-list');
  list.innerHTML = '';

  // Add the "All" Category
  const allCount = state.tasks.length;
  const allItem = document.createElement('li');
  allItem.className = `category-item ${state.activeCategory === 'all' ? 'active' : ''}`;
  allItem.dataset.id = 'all';
  allItem.innerHTML = `
    <div class="category-left">
      <div class="category-dot" style="background-color: var(--color-primary);"></div>
      <span>All Tasks</span>
    </div>
    <span class="category-count">${allCount}</span>
  `;
  allItem.addEventListener('click', () => selectCategory('all'));
  list.appendChild(allItem);

  // Render actual categories
  state.categories.forEach(cat => {
    const count = state.tasks.filter(t => t.category === cat.name).length;
    const item = document.createElement('li');
    item.className = `category-item ${state.activeCategory === cat.name ? 'active' : ''}`;
    item.dataset.id = cat.name;
    item.innerHTML = `
      <div class="category-left">
        <div class="category-dot" style="background-color: ${cat.color}"></div>
        <span>${cat.name}</span>
      </div>
      <span class="category-count">${count}</span>
    `;
    item.addEventListener('click', () => selectCategory(cat.name));
    list.appendChild(item);
  });
}

function selectCategory(catId) {
  state.activeCategory = catId;
  $$('.category-item').forEach(item => {
    item.classList.toggle('active', item.dataset.id === catId);
  });
  renderTasks();
}

// --- Task Filter Engine & Rendering ---
function renderTasks() {
  const container = $('#task-list-container');
  container.innerHTML = '';

  let filtered = [...state.tasks];

  // 1. Filter by Active Category
  if (state.activeCategory !== 'all') {
    filtered = filtered.filter(t => t.category === state.activeCategory);
  }

  // 2. Filter by Tab Status (All, Active, Completed)
  if (state.activeStatus === 'active') {
    filtered = filtered.filter(t => !t.completed);
  } else if (state.activeStatus === 'completed') {
    filtered = filtered.filter(t => t.completed);
  }

  // 3. Filter by Search Query
  if (state.searchQuery.trim() !== '') {
    const query = state.searchQuery.toLowerCase().trim();
    filtered = filtered.filter(t => 
      t.title.toLowerCase().includes(query) || 
      t.description.toLowerCase().includes(query)
    );
  }

  // Show Empty State if no tasks match
  if (filtered.length === 0) {
    $('#empty-state').classList.remove('hidden');
    container.classList.add('hidden');
    return;
  } else {
    $('#empty-state').classList.add('hidden');
    container.classList.remove('hidden');
  }

  // 4. Sorting
  const [field, direction] = state.sortBy.split('-');
  filtered.sort((a, b) => {
    let valA = a[field];
    let valB = b[field];

    if (field === 'priority') {
      const priorityWeights = { high: 3, medium: 2, low: 1 };
      valA = priorityWeights[a.priority] || 0;
      valB = priorityWeights[b.priority] || 0;
    }

    if (field === 'dueDate') {
      // Unspecified due date sorted last
      if (!valA) return direction === 'asc' ? 1 : -1;
      if (!valB) return direction === 'asc' ? -1 : 1;
    }

    if (typeof valA === 'string') {
      return direction === 'asc' 
        ? valA.localeCompare(valB) 
        : valB.localeCompare(valA);
    }

    return direction === 'asc' ? valA - valB : valB - valA;
  });

  // Render elements
  filtered.forEach(task => {
    const card = createTaskCard(task);
    container.appendChild(card);
  });

  // Update lucide icons inside generated elements
  lucide.createIcons();
}

function createTaskCard(task) {
  // Find category color
  const catObj = state.categories.find(c => c.name === task.category);
  const catColor = catObj ? catObj.color : '#8b5cf6';

  const card = document.createElement('div');
  card.className = `task-card ${task.completed ? 'completed' : ''}`;
  card.style.setProperty('--category-color', catColor);
  card.dataset.id = task.id;

  // Build due date warning badge
  let dueDateBadge = '';
  if (task.dueDate) {
    const todayStr = new Date().toISOString().split('T')[0];
    const isOverdue = !task.completed && task.dueDate < todayStr;
    const dateObj = new Date(task.dueDate + 'T00:00:00');
    const formattedDate = dateObj.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    
    dueDateBadge = `
      <div class="badge badge-due ${isOverdue ? 'overdue' : ''}">
        <i data-lucide="calendar" style="width: 12px; height: 12px;"></i>
        <span>${isOverdue ? 'Overdue: ' : ''}${formattedDate}</span>
      </div>
    `;
  }

  card.innerHTML = `
    <div class="task-check-wrapper">
      <input type="checkbox" class="task-checkbox" ${task.completed ? 'checked' : ''}>
      <i data-lucide="check" class="task-check-icon"></i>
    </div>
    
    <div class="task-body">
      <div class="task-title-row">
        <h4 class="task-card-title">${escapeHTML(task.title)}</h4>
      </div>
      ${task.description ? `<p class="task-card-desc">${escapeHTML(task.description)}</p>` : ''}
      <div class="task-meta-row">
        <div class="badge badge-category">
          <span>${task.category}</span>
        </div>
        <div class="badge badge-priority priority-${task.priority}">
          <span>${task.priority}</span>
        </div>
        ${dueDateBadge}
      </div>
    </div>
    
    <div class="task-actions">
      <button class="action-btn edit-btn" title="Edit Task">
        <i data-lucide="edit-3"></i>
      </button>
      <button class="action-btn delete-btn" title="Delete Task">
        <i data-lucide="trash-2"></i>
      </button>
    </div>
  `;

  // Attach interactive listeners
  const checkbox = card.querySelector('.task-checkbox');
  checkbox.addEventListener('change', () => toggleTaskCompletion(task.id));

  const editBtn = card.querySelector('.edit-btn');
  editBtn.addEventListener('click', () => openEditTaskModal(task));

  const deleteBtn = card.querySelector('.delete-btn');
  deleteBtn.addEventListener('click', () => deleteTask(task.id));

  return card;
}

// --- Escape HTML to prevent XSS ---
function escapeHTML(str) {
  return str.replace(/[&<>'"]/g, 
    tag => ({
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      "'": '&#39;',
      '"': '&quot;'
    }[tag] || tag)
  );
}

// --- Toggle Task Completion ---
function toggleTaskCompletion(taskId) {
  const task = state.tasks.find(t => t.id === taskId);
  if (task) {
    task.completed = !task.completed;
    saveTasks();
    
    if (task.completed) {
      playChimeSound();
      showToast(`Completed "${task.title}"`, '🎉');
    }
    
    renderTasks();
    renderCategories();
    updateProgressTracker();
  }
}

// --- Create/Edit Task Event logic ---
function openAddTaskModal() {
  $('#modal-title').textContent = 'Create New Task';
  $('#task-edit-id').value = '';
  $('#task-form').reset();
  
  // Set default due date to empty
  $('#task-due').value = '';
  $('#task-priority').value = 'medium';
  
  // Select first category default
  if (state.categories.length > 0) {
    $('#task-category').value = state.categories[0].name;
  }

  $('#task-modal').classList.remove('hidden');
  $('#task-title').focus();
}

function openEditTaskModal(task) {
  $('#modal-title').textContent = 'Edit Task';
  $('#task-edit-id').value = task.id;
  $('#task-title').value = task.title;
  $('#task-desc').value = task.description || '';
  $('#task-due').value = task.dueDate || '';
  $('#task-priority').value = task.priority;
  $('#task-category').value = task.category;

  $('#task-modal').classList.remove('hidden');
  $('#task-title').focus();
}

function closeTaskModal() {
  $('#task-modal').classList.add('hidden');
}

function handleTaskFormSubmit(e) {
  e.preventDefault();
  
  const editId = $('#task-edit-id').value;
  const title = $('#task-title').value.trim();
  const description = $('#task-desc').value.trim();
  const dueDate = $('#task-due').value;
  const priority = $('#task-priority').value;
  const category = $('#task-category').value;

  if (title === '') return;

  if (editId) {
    // Edit existing task
    const task = state.tasks.find(t => t.id === editId);
    if (task) {
      task.title = title;
      task.description = description;
      task.dueDate = dueDate;
      task.priority = priority;
      task.category = category;
      showToast('Task updated successfully', '📝');
    }
  } else {
    // Create new task
    const newTask = {
      id: 'task_' + Date.now() + Math.random().toString(36).substr(2, 4),
      title,
      description,
      dueDate,
      priority,
      category,
      completed: false,
      createdAt: Date.now()
    };
    state.tasks.push(newTask);
    showToast('New task added', '⚡');
  }

  saveTasks();
  closeTaskModal();
  renderTasks();
  renderCategories();
  updateProgressTracker();
}

// --- Quick Add Field Handler ---
function handleQuickAdd(e) {
  if (e.key === 'Enter') {
    const title = $('#quick-add-input').value.trim();
    if (title === '') return;

    // Pick first category or Work
    const defaultCategory = state.categories.length > 0 ? state.categories[0].name : 'Work';

    const newTask = {
      id: 'task_' + Date.now() + Math.random().toString(36).substr(2, 4),
      title,
      description: '',
      dueDate: '',
      priority: 'medium',
      category: defaultCategory,
      completed: false,
      createdAt: Date.now()
    };

    state.tasks.push(newTask);
    $('#quick-add-input').value = '';
    
    saveTasks();
    showToast('Task added quickly', '⚡');
    renderTasks();
    renderCategories();
    updateProgressTracker();
  }
}

// --- Custom Category Creator Modal ---
function openCategoryModal() {
  $('#new-category-name').value = '';
  $('#category-modal').classList.remove('hidden');
  $('#new-category-name').focus();
}

function closeCategoryModal() {
  $('#category-modal').classList.add('hidden');
}

function handleCategoryFormSubmit(e) {
  e.preventDefault();
  const name = $('#new-category-name').value.trim();
  const color = state.selectedCategoryColor;

  if (name === '') return;

  // Check duplicate name
  const isDuplicate = state.categories.some(c => c.name.toLowerCase() === name.toLowerCase());
  if (isDuplicate) {
    alert('This category name already exists!');
    return;
  }

  const newCat = {
    id: 'cat_' + Date.now(),
    name,
    color
  };

  state.categories.push(newCat);
  saveCategories();
  
  closeCategoryModal();
  populateCategorySelects();
  renderCategories();
  showToast(`Category "${name}" created`, '🎨');
}

// --- Delete Task & Undo Toast Stack ---
function deleteTask(taskId) {
  const index = state.tasks.findIndex(t => t.id === taskId);
  if (index !== -1) {
    const removedTask = state.tasks[index];
    
    // Put into Undo Buffer
    undoBuffer.task = { ...removedTask, originalIndex: index };
    
    // Filter it out of active list
    state.tasks.splice(index, 1);
    saveTasks();

    renderTasks();
    renderCategories();
    updateProgressTracker();

    // Trigger Toast with Undo button
    showToast(`Deleted "${removedTask.title}"`, '🗑️', true);
  }
}

function undoDelete() {
  if (undoBuffer.task) {
    const restored = undoBuffer.task;
    
    // Put it back in its original position or push to end
    state.tasks.splice(restored.originalIndex, 0, {
      id: restored.id,
      title: restored.title,
      description: restored.description,
      dueDate: restored.dueDate,
      priority: restored.priority,
      category: restored.category,
      completed: restored.completed,
      createdAt: restored.createdAt
    });

    saveTasks();
    
    // Clean buffer
    undoBuffer.task = null;
    if (undoBuffer.timeoutId) {
      clearTimeout(undoBuffer.timeoutId);
      undoBuffer.timeoutId = null;
    }

    // Hide Toast
    const toast = $('.toast.has-undo');
    if (toast) {
      toast.classList.add('fade-out');
      setTimeout(() => toast.remove(), 300);
    }

    renderTasks();
    renderCategories();
    updateProgressTracker();
    showToast('Task restored', '🔄');
  }
}

// --- Toast System ---
function showToast(message, icon, showUndo = false) {
  const container = $('#toast-container');
  
  // Create Toast Card
  const toast = document.createElement('div');
  toast.className = `toast ${showUndo ? 'has-undo' : ''}`;
  
  toast.innerHTML = `
    <div class="toast-content">
      <span class="toast-icon">${icon}</span>
      <span>${escapeHTML(message)}</span>
    </div>
    ${showUndo ? `<button class="toast-undo-btn" id="toast-undo-btn">Undo</button>` : ''}
  `;

  container.appendChild(toast);

  // Undo button logic
  if (showUndo) {
    const undoBtn = toast.querySelector('#toast-undo-btn');
    undoBtn.addEventListener('click', undoDelete);

    // Auto-expire undo buffer after 5 seconds
    if (undoBuffer.timeoutId) clearTimeout(undoBuffer.timeoutId);
    undoBuffer.timeoutId = setTimeout(() => {
      undoBuffer.task = null;
      undoBuffer.timeoutId = null;
    }, 5000);
  }

  // Automatic slide-out fade after 4 seconds (unless it's an undo toast, which stays slightly longer)
  setTimeout(() => {
    toast.classList.add('fade-out');
    setTimeout(() => {
      toast.remove();
    }, 300);
  }, showUndo ? 5000 : 3500);
}

// --- Setup All Event Listeners ---
function setupEventListeners() {
  // Modal toggle events
  $('#btn-open-task-modal').addEventListener('click', openAddTaskModal);
  $('#btn-close-task-modal').addEventListener('click', closeTaskModal);
  $('#btn-cancel-task').addEventListener('click', closeTaskModal);
  $('#task-modal').addEventListener('click', (e) => {
    if (e.target === $('#task-modal')) closeTaskModal();
  });

  // Category Modal toggle events
  $('#btn-add-category-modal').addEventListener('click', openCategoryModal);
  $('#btn-close-category-modal').addEventListener('click', closeCategoryModal);
  $('#btn-cancel-category').addEventListener('click', closeCategoryModal);
  $('#category-modal').addEventListener('click', (e) => {
    if (e.target === $('#category-modal')) closeCategoryModal();
  });

  // Form Submits
  $('#task-form').addEventListener('submit', handleTaskFormSubmit);
  $('#category-form').addEventListener('submit', handleCategoryFormSubmit);

  // Quick Add input
  $('#quick-add-input').addEventListener('keyup', handleQuickAdd);

  // Search input change
  $('#search-input').addEventListener('input', (e) => {
    state.searchQuery = e.target.value;
    const clearBtn = $('#clear-search-btn');
    if (state.searchQuery.trim() !== '') {
      clearBtn.classList.remove('hidden');
    } else {
      clearBtn.classList.add('hidden');
    }
    renderTasks();
  });

  // Clear Search button
  $('#clear-search-btn').addEventListener('click', () => {
    $('#search-input').value = '';
    state.searchQuery = '';
    $('#clear-search-btn').classList.add('hidden');
    renderTasks();
  });

  // Tab buttons click (All, Active, Completed)
  $$('.tab-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      $$('.tab-btn').forEach(b => b.classList.remove('active'));
      e.target.classList.add('active');
      state.activeStatus = e.target.dataset.status;
      renderTasks();
    });
  });

  // Sorting selection changed
  $('#sort-select').addEventListener('change', (e) => {
    state.sortBy = e.target.value;
    renderTasks();
  });

  // Theme switcher
  $('#theme-toggle').addEventListener('click', toggleTheme);

  // Sound toggle
  $('#sound-toggle').addEventListener('click', toggleSound);

  // Reset dashboard
  $('#btn-reset-all').addEventListener('click', resetDashboard);

  // Close modals on Escape key
  window.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      closeTaskModal();
      closeCategoryModal();
    }
  });
}

function resetDashboard() {
  const confirmReset = confirm("Are you sure you want to reset your dashboard?\n\nThis will permanently delete all your custom tasks and custom categories, and restore the default onboarding tasks.");
  if (confirmReset) {
    localStorage.removeItem('aerotask_tasks');
    localStorage.removeItem('aerotask_categories');
    localStorage.removeItem('aerotask_username');
    localStorage.removeItem('aerotask_theme');
    localStorage.removeItem('aerotask_sound_enabled');
    
    // Reload page to reset everything
    window.location.reload();
  }
}
