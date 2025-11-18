// Background Runner for Autonomous AI Tasks
// This runs even when the app is closed

addEventListener('autonomousTask', async (resolve, reject) => {
  try {
    console.log('[Background] Autonomer Task wird ausgeführt...');
    
    // Fetch pending autonomous tasks from Supabase
    const response = await fetch('https://9b0e25a6-d522-47d5-a9dc-a7b6d83f0dca.lovableproject.com/api/autonomous-executor', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    const result = await response.json();
    console.log('[Background] Task-Ergebnis:', result);
    
    // Send notification if task completed
    if (result.success) {
      CapacitorNotifications.schedule({
        notifications: [{
          title: 'OMEGA AI',
          body: `${result.tasksExecuted} autonome Tasks ausgeführt`,
          id: Date.now(),
          schedule: { at: new Date(Date.now() + 1000) }
        }]
      });
    }
    
    resolve();
  } catch (error) {
    console.error('[Background] Fehler:', error);
    reject(error);
  }
});
