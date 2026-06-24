import startETracker from '@fuxi/eevee-tracker-starter';

const { ETracker, sendEvent, switchPage, sendPV, sendLeave } = startETracker({
  pid: import.meta.env.VITE_APP_ID || 'danqing-ugc',
  env: (window.EEVEE_ENV || 'production') as 'dev' | 'qa' | 'pre' | 'prod',
  requiredFields: ['pid', 'uid'],
  plugin_pv: {
    autoPV: true,
    autoLeave: true,
    enableHistory: true,
  },
});

export { ETracker, sendEvent, switchPage, sendPV, sendLeave };
