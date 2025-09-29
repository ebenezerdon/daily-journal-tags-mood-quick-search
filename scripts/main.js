/* main.js
   Entry point that initializes the app. Calls window.App.init and App.render with guards as required.
*/
$(function(){
  try {
    if(!window.App || typeof App.init !== 'function' || typeof App.render !== 'function'){
      console.error('[Contract] Missing App.init/App.render');
      return;
    }
    App.init();
    App.render();
  } catch (e) {
    console.error('Initialization failed', e);
  }
});
