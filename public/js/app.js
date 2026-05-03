// Auto-dismiss flash messages after 4 seconds
setTimeout(() => {
  ['flash-success', 'flash-error'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.remove();
  });
}, 4000);
