const os = require('os');
const io = require('socket.io-client');

// Connect as a monitoring client
const socket = io('http://localhost:5006', {
  transports: ['websocket'],
});

socket.on('connect', () => {
  console.log(`📡 Monitoring socket connected as ${socket.id}`);
});

// Track userCount broadcasts
socket.on('userCount', (count) => {
  console.log(`[${new Date().toISOString()}] Online users: ${count}`);
});

socket.on('connect_error', (err) => {
  console.error('Monitoring socket connect_error:', err.message);
});

// Log server resource usage every 5 seconds (from this monitor process)
setInterval(() => {
  const memUsage = process.memoryUsage();
  const cpuLoad = os.loadavg();
  console.log({
    timestamp: new Date().toISOString(),
    memory: {
      heapUsed: `${Math.round(memUsage.heapUsed / 1024 / 1024)}MB`,
      heapTotal: `${Math.round(memUsage.heapTotal / 1024 / 1024)}MB`,
      rss: `${Math.round(memUsage.rss / 1024 / 1024)}MB`
    },
    cpuLoad1min: cpuLoad[0].toFixed(2),
    cpuLoad5min: cpuLoad[1].toFixed(2)
  });
}, 5000);

console.log('📡 Monitoring started — run your artillery tests now');

