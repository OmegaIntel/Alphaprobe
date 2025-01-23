import amplitudeJs from 'amplitude-js';

if (typeof window !== 'undefined') {
  const amplitude = amplitudeJs.getInstance();
  amplitude.init('b07260e647c7c3cc3c25aac93aa17db8', undefined, {
    batchEvents: true,
    eventUploadPeriodMillis: 30000,
  });
}