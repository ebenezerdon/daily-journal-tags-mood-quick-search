/* helpers.js
   Responsibility: Provide storage helpers, data model utilities and validation.
   Exposes window.AppHelpers with necessary methods used by UI module.
*/
(function(window, $){
  'use strict';

  const STORAGE_KEY = 'daily-journal.entries.v1';

  const moods = [
    {id: 'ecstatic', label: 'Ecstatic', emoji: '🤩', color: '#ff7ab6'},
    {id: 'happy', label: 'Happy', emoji: '🙂', color: '#ffd166'},
    {id: 'neutral', label: 'Neutral', emoji: '😐', color: '#a7f3d0'},
    {id: 'down', label: 'Down', emoji: '😕', color: '#93c5fd'},
    {id: 'sad', label: 'Sad', emoji: '😢', color: '#c7b2ff'}
  ];

  function generateId(){
    // Simple but robust id generator
    return 'id-' + Date.now().toString(36) + '-' + Math.random().toString(36).slice(2,9);
  }

  function nowISO(){
    return new Date().toISOString();
  }

  function formatDateForInput(dateISO){
    try{
      const d = dateISO ? new Date(dateISO) : new Date();
      const yyyy = d.getFullYear();
      const mm = String(d.getMonth()+1).padStart(2,'0');
      const dd = String(d.getDate()).padStart(2,'0');
      return `${yyyy}-${mm}-${dd}`;
    } catch(e){
      return '';
    }
  }

  function loadEntries(){
    try{
      const raw = localStorage.getItem(STORAGE_KEY);
      if(!raw) return [];
      const parsed = JSON.parse(raw);
      if(!Array.isArray(parsed)) return [];
      return parsed;
    } catch(e){
      console.error('Failed to load entries', e);
      return [];
    }
  }

  function saveEntries(entries){
    try{
      localStorage.setItem(STORAGE_KEY, JSON.stringify(entries));
    } catch(e){
      console.error('Failed to save entries', e);
    }
  }

  function validateEntry(entry){
    if(!entry) return false;
    if(!entry.content || String(entry.content).trim().length < 1) return false;
    if(!entry.date) return false;
    return true;
  }

  function parseTags(input){
    if(!input) return [];
    return input.split(',').map(t=>t.trim()).filter(Boolean).slice(0,10);
  }

  function extractAllTags(entries){
    const s = new Set();
    entries.forEach(e=> (e.tags||[]).forEach(t=> s.add(t)));
    return Array.from(s).sort();
  }

  function fuzzyMatch(text, q){
    if(!q) return true;
    try{
      q = q.toLowerCase();
      return String(text||'').toLowerCase().indexOf(q) !== -1;
    } catch(e){ return false; }
  }

  // Expose API
  window.AppHelpers = {
    STORAGE_KEY,
    moods,
    generateId,
    nowISO,
    formatDateForInput,
    loadEntries,
    saveEntries,
    validateEntry,
    parseTags,
    extractAllTags,
    fuzzyMatch
  };

})(window, jQuery);
