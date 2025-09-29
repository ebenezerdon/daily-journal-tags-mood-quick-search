/* ui.js
   Responsibility: Render UI, manage user interactions and state. Exposes window.App with init and render.
   Uses jQuery for all DOM manipulation.
*/
(function(window, $){
  'use strict';
  window.App = window.App || {};

  // Internal state
  const state = {
    entries: [],
    filtered: [],
    query: '',
    activeTags: [],
    activeMood: null
  };

  // short references to DOM
  const DOM = {};

  // Initialize DOM references and bind events
  App.init = function(){
    try{
      DOM.$composeForm = $('#composeForm');
      DOM.$entryDate = $('#entryDate');
      DOM.$entryText = $('#entryText');
      DOM.$entryTags = $('#entryTags');
      DOM.$moodSelector = $('#moodSelector');
      DOM.$saveBtn = $('#saveBtn');
      DOM.$clearBtn = $('#clearBtn');
      DOM.$entriesList = $('#entriesList');
      DOM.$searchInput = $('#searchInput');
      DOM.$tagSuggestions = $('#tagSuggestions');
      DOM.$tagsContainer = $('#tagsContainer');
      DOM.$countDisplay = $('#countDisplay');
      DOM.$emptyState = $('#emptyState');
      DOM.$focusCompose = $('#focusCompose');
      DOM.$exportBtn = $('#exportBtn');
      DOM.$importBtn = $('#importBtn');
      DOM.$activeFilters = $('#activeFilters');
      DOM.$clearFiltersBtn = $('#clearFiltersBtn');
      DOM.$quickFilters = $('#quickFilters');
      DOM.$filterChips = $('#quickFilters');

      // Seed state from storage
      state.entries = window.AppHelpers.loadEntries();

      // Set default date
      DOM.$entryDate.val(window.AppHelpers.formatDateForInput());

      // Render mood buttons
      renderMoodSelector();

      // Bind events
      bindComposeEvents();
      bindSearchAndFilters();
      bindExportImport();

      // Accessibility helpers
      $(document).on('keydown', function(e){
        if(e.key === 'Escape'){
          // clear form
          clearForm();
          DOM.$entryText.blur();
        }
      });

    } catch(e){
      console.error('App.init errored', e);
    }
  };

  App.render = function(){
    try{
      state.filtered = state.entries.slice().sort((a,b)=> new Date(b.date) - new Date(a.date));
      renderTagSuggestions();
      renderTagsFilter();
      renderEntries();
      updateCounts();
    } catch(e){
      console.error('App.render errored', e);
    }
  };

  // ------------------ UI RENDER HELPERS ------------------
  function renderMoodSelector(){
    DOM.$moodSelector.empty();
    window.AppHelpers.moods.forEach(m => {
      const $btn = $(`
        <button class="entry-mood" data-mood="${m.id}" title="${m.label}" aria-pressed="false" role="radio">
          <span aria-hidden="true">${m.emoji}</span>
        </button>
      `);
      $btn.css({'background-color': m.color, 'color': '#1f2937'});
      $btn.on('click', function(){
        DOM.$moodSelector.find('button').attr('aria-pressed','false');
        $(this).attr('aria-pressed','true');
        DOM.$moodSelector.data('selected', m.id);
      });
      DOM.$moodSelector.append($btn);
    });
  }

  function renderTagSuggestions(){
    const tags = window.AppHelpers.extractAllTags(state.entries).slice(0,6);
    DOM.$tagSuggestions.text(tags.join(', ') || 'none');
  }

  function renderTagsFilter(){
    DOM.$tagsContainer.empty();
    const tags = window.AppHelpers.extractAllTags(state.entries);
    if(tags.length === 0){
      DOM.$tagsContainer.append('<div class="text-sm text-slate-400">No tags yet</div>');
      return;
    }
    tags.forEach(tag=>{
      const $pill = $(`<button class="tag-pill" data-tag="${tag}" aria-pressed="false">${tag}</button>`);
      $pill.on('click', function(){
        const t = $(this).data('tag');
        toggleTagFilter(t);
      });
      DOM.$tagsContainer.append($pill);
    });
  }

  function renderEntries(){
    DOM.$entriesList.empty();
    let list = applyFilters(state.entries);

    if(list.length === 0){
      DOM.$emptyState.removeClass('hidden');
      DOM.$entriesList.attr('aria-hidden', 'true');
      DOM.$countDisplay.text('0');
      return;
    }
    DOM.$emptyState.addClass('hidden');
    DOM.$entriesList.attr('aria-hidden', 'false');

    list.forEach(entry => {
      const tagsHtml = (entry.tags||[]).map(t=>`<span class="tag-pill mr-1">${t}</span>`).join(' ');
      const mood = window.AppHelpers.moods.find(m=> m.id === entry.mood) || {emoji: '—', color:'#f1f5f9'};
      const dateLabel = (new Date(entry.date)).toLocaleDateString();

      const $li = $(
        `<li class="entry-card" data-id="${entry.id}" tabindex="0">
           <div class="flex items-start gap-3">
             <div style="flex-shrink:0;">
               <div class="entry-mood" aria-hidden="true" style="background:${mood.color};">${mood.emoji}</div>
             </div>
             <div class="flex-1">
               <div class="flex items-start justify-between gap-2">
                 <div>
                   <div class="text-sm font-semibold">${escapeHtml(entry.content.split('\n')[0] || '').slice(0,80)}</div>
                   <div class="text-xs text-slate-400">${dateLabel}</div>
                 </div>
                 <div class="flex gap-2">
                   <button class="edit-btn btn-ghost" aria-label="Edit entry">Edit</button>
                   <button class="delete-btn btn-ghost" aria-label="Delete entry">Delete</button>
                 </div>
               </div>
               <div class="mt-2 text-sm text-slate-700">${escapeHtml(entry.content).replace(/\n/g,'<br>')}</div>
               <div class="mt-3 flex gap-2" aria-hidden="true">${tagsHtml}</div>
             </div>
           </div>
         </li>`
      );

      // Edit
      $li.find('.edit-btn').on('click', function(){
        startEditEntry(entry.id);
      });
      $li.find('.delete-btn').on('click', function(){
        if(confirm('Delete this entry?')){
          deleteEntry(entry.id);
        }
      });

      // keyboard: Enter opens edit
      $li.on('keydown', function(e){ if(e.key === 'Enter'){ startEditEntry(entry.id); } });

      DOM.$entriesList.append($li.hide().slideDown(160));
    });

    DOM.$countDisplay.text(list.length);
  }

  function updateCounts(){
    DOM.$countDisplay.text(applyFilters(state.entries).length);
    // active filters visual
    DOM.$activeFilters.empty();
    if(state.query){ DOM.$activeFilters.append(`<span class="tag-pill">Search: ${escapeHtml(state.query)}</span>`); }
    state.activeTags.forEach(t => DOM.$activeFilters.append(`<button class="tag-pill" data-remove-tag="${t}">${escapeHtml(t)} ×</button>`));
    if(state.activeMood) DOM.$activeFilters.append(`<span class="tag-pill">Mood: ${escapeHtml(state.activeMood)}</span>`);

    // remove tag via active filters
    DOM.$activeFilters.find('[data-remove-tag]').on('click', function(){
      const t = $(this).data('remove-tag');
      state.activeTags = state.activeTags.filter(x=> x !== t);
      App.render();
    });
  }

  // ------------------ ACTIONS ------------------
  function bindComposeEvents(){
    DOM.$composeForm.on('submit', function(e){
      e.preventDefault();
      saveFormEntry();
    });

    DOM.$clearBtn.on('click', function(){ clearForm(); });

    // Keyboard shortcut: Ctrl/Cmd + Enter to submit
    DOM.$entryText.on('keydown', function(e){
      if((e.ctrlKey || e.metaKey) && e.key === 'Enter'){
        e.preventDefault();
        saveFormEntry();
      }
    });

    DOM.$focusCompose.on('click', function(){
      DOM.$entryText.focus();
    });
  }

  function bindSearchAndFilters(){
    let typingTimer = null;
    DOM.$searchInput.on('input', function(){
      clearTimeout(typingTimer);
      typingTimer = setTimeout(()=>{ state.query = $(this).val().trim(); App.render(); }, 250);
    });

    DOM.$clearFiltersBtn.on('click', function(){
      state.query = ''; state.activeTags = []; state.activeMood = null; DOM.$searchInput.val(''); App.render();
    });

    DOM.$quickFilters.find('button').on('click', function(){
      const f = $(this).data('filter');
      applyQuickFilter(f);
    });
  }

  function bindExportImport(){
    DOM.$exportBtn.on('click', function(){
      const data = JSON.stringify(state.entries, null, 2);
      const blob = new Blob([data], {type: 'application/json'});
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url; a.download = 'journal-entries.json';
      document.body.appendChild(a); a.click(); a.remove();
      URL.revokeObjectURL(url);
    });

    DOM.$importBtn.on('click', function(){
      const input = document.createElement('input');
      input.type = 'file'; input.accept = 'application/json';
      input.onchange = function(e){
        const f = e.target.files[0];
        if(!f) return;
        const reader = new FileReader();
        reader.onload = function(ev){
          try{
            const parsed = JSON.parse(ev.target.result);
            if(Array.isArray(parsed)){
              // merge carefully to avoid duplicates
              const existingIds = new Set(state.entries.map(en=>en.id));
              parsed.forEach(en=>{ if(!existingIds.has(en.id)) state.entries.push(en); });
              window.AppHelpers.saveEntries(state.entries);
              App.render();
              alert('Imported ' + parsed.length + ' entries');
            } else {
              alert('Invalid file format');
            }
          } catch(err){ alert('Import failed: ' + err.message); }
        };
        reader.readAsText(f);
      };
      input.click();
    });
  }

  function saveFormEntry(){
    const content = DOM.$entryText.val().trim();
    const date = DOM.$entryDate.val();
    const tags = window.AppHelpers.parseTags(DOM.$entryTags.val());
    const mood = DOM.$moodSelector.data('selected') || null;

    const entry = {
      id: window.AppHelpers.generateId(),
      content, date, tags, mood,
      createdAt: window.AppHelpers.nowISO(),
      updatedAt: window.AppHelpers.nowISO()
    };

    if(!window.AppHelpers.validateEntry(entry)){
      alert('Please add a date and some content');
      return;
    }

    // Insert or update: support editing via form dataset
    const editingId = DOM.$composeForm.data('editing');
    if(editingId){
      // Update existing
      const idx = state.entries.findIndex(e=> e.id === editingId);
      if(idx !== -1){
        state.entries[idx].content = entry.content;
        state.entries[idx].date = entry.date;
        state.entries[idx].tags = entry.tags;
        state.entries[idx].mood = entry.mood;
        state.entries[idx].updatedAt = window.AppHelpers.nowISO();
      }
      DOM.$composeForm.removeData('editing');
    } else {
      state.entries.push(entry);
    }

    window.AppHelpers.saveEntries(state.entries);
    clearForm();
    App.render();

    // small animation feedback
    DOM.$saveBtn.text('Saved!');
    setTimeout(()=> DOM.$saveBtn.text('Save Entry'), 900);
  }

  function clearForm(){
    DOM.$entryText.val('');
    DOM.$entryTags.val('');
    DOM.$entryDate.val(window.AppHelpers.formatDateForInput());
    DOM.$moodSelector.find('button').attr('aria-pressed','false');
    DOM.$moodSelector.removeData('selected');
    DOM.$composeForm.removeData('editing');
  }

  function startEditEntry(id){
    const e = state.entries.find(x=> x.id === id);
    if(!e) return;
    DOM.$entryText.val(e.content);
    DOM.$entryTags.val((e.tags||[]).join(', '));
    DOM.$entryDate.val(window.AppHelpers.formatDateForInput(e.date));
    if(e.mood){
      DOM.$moodSelector.find('button').attr('aria-pressed','false');
      DOM.$moodSelector.find(`button[data-mood=\"${e.mood}\"]`).attr('aria-pressed','true');
      DOM.$moodSelector.data('selected', e.mood);
    }
    DOM.$composeForm.data('editing', e.id);
    $('html, body').animate({ scrollTop: 0 }, 200);
    DOM.$entryText.focus();
  }

  function deleteEntry(id){
    state.entries = state.entries.filter(e=> e.id !== id);
    window.AppHelpers.saveEntries(state.entries);
    App.render();
  }

  function toggleTagFilter(tag){
    if(state.activeTags.includes(tag)){
      state.activeTags = state.activeTags.filter(t=> t !== tag);
    } else {
      state.activeTags.push(tag);
    }
    App.render();
  }

  function applyQuickFilter(filter){
    const now = new Date();
    if(filter === 'today'){
      const today = window.AppHelpers.formatDateForInput();
      state.query = ''; state.activeTags = []; state.activeMood = null;
      state.entries = state.entries || state.entries; // noop
      // set a transient filter by setting query to date
      state.query = today;
    } else if(filter === 'week'){
      state.query = ''; state.activeTags = []; state.activeMood = null;
      const weekAgo = new Date(); weekAgo.setDate(now.getDate() - 7);
      // Implement filter by storing a special marker
      state._quickFilter = {type: 'range', from: weekAgo.toISOString().slice(0,10), to: window.AppHelpers.formatDateForInput()};
    } else if(filter === 'month'){
      state.query = ''; state.activeTags = []; state.activeMood = null;
      const monthAgo = new Date(); monthAgo.setMonth(now.getMonth() - 1);
      state._quickFilter = {type:'range', from: monthAgo.toISOString().slice(0,10), to: window.AppHelpers.formatDateForInput()};
    } else {
      state._quickFilter = null; state.query = '';
    }
    App.render();
  }

  function applyFilters(entries){
    let list = entries.slice();

    // Quick filter range
    if(state._quickFilter && state._quickFilter.type === 'range'){
      const from = new Date(state._quickFilter.from);
      const to = new Date(state._quickFilter.to);
      list = list.filter(e=>{
        const d = new Date(e.date);
        return d >= from && d <= to;
      });
    }

    // Active tags
    if(state.activeTags.length){
      list = list.filter(e => state.activeTags.every(t=> (e.tags||[]).includes(t)));
    }

    // Mood
    if(state.activeMood){
      list = list.filter(e => e.mood === state.activeMood);
    }

    // Query search: search content, tags, date, mood
    if(state.query){
      const q = state.query.toLowerCase();
      list = list.filter(e=>{
        if(window.AppHelpers.fuzzyMatch(e.content, q)) return true;
        if((e.tags||[]).some(t=> t.toLowerCase().indexOf(q)!==-1)) return true;
        if((e.mood||'').toLowerCase().indexOf(q)!==-1) return true;
        if((e.date||'').indexOf(q)!==-1) return true;
        return false;
      });
    }

    return list.sort((a,b)=> new Date(b.date) - new Date(a.date));
  }

  // ------------------ Utilities ------------------
  function escapeHtml(str){
    if(!str) return '';
    return String(str)
      .replace(/&/g,'&amp;')
      .replace(/</g,'&lt;')
      .replace(/>/g,'&gt;')
      .replace(/"/g,'&quot;')
      .replace(/'/g,'&#039;');
  }

  // Expose some methods for debugging/tests
  App._state = state;
  App._helpers = window.AppHelpers;
  App.createEntry = function(entry){
    state.entries.push(entry);
    window.AppHelpers.saveEntries(state.entries);
    App.render();
  };

})(window, jQuery);
