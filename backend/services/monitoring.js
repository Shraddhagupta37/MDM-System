const promClient = require('prom-client');

// Create metrics
const httpRequestDuration = new promClient.Histogram({
  name: 'http_request_duration_seconds',
  help: 'Duration of HTTP requests in seconds',
  labelNames: ['method', 'route', 'status']
});

const activeDevices = new promClient.Gauge({
  name: 'active_devices_total',
  help: 'Total number of active devices'
});

const updateJobsTotal = new promClient.Counter({
  name: 'update_jobs_total',
  help: 'Total number of update jobs',
  labelNames: ['status']
});

// Update metrics periodically
setInterval(async () => {
  const count = await Device.countDocuments({ status: 'active' });
  activeDevices.set(count);
}, 60000);

module.exports = {
  httpRequestDuration,
  activeDevices,
  updateJobsTotal
};