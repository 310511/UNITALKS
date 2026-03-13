const { io } = require("socket.io-client");

const TARGET = "https://unitalks.gingr.chat";
const TOTAL_USERS = 50;
const RESULTS = { completed: 0, failed: 0 };

console.log(`Testing ${TARGET} with ${TOTAL_USERS} users...`);

for (let i = 0; i < TOTAL_USERS; i++) {
  setTimeout(() => {
    const socket = io(TARGET, {
      transports: ["polling"],
      reconnection: false,
      timeout: 10000,
      rejectUnauthorized: false,
      secure: true
    });

    socket.on("connect", () => {
      RESULTS.completed++;
      console.log(`[${RESULTS.completed}/${TOTAL_USERS}] Connected - ID: ${socket.id}`);
      socket.emit("joinQueue", { mode: "text" });
      setTimeout(() => socket.disconnect(), 5000);
    });

    socket.on("connect_error", (err) => {
      RESULTS.failed++;
      console.log(`[FAILED ${RESULTS.failed}] Error: ${err.message}`);
    });

    socket.on("disconnect", () => {
      if (RESULTS.completed + RESULTS.failed === TOTAL_USERS) {
        console.log("\n=== RESULTS ===");
        console.log(`Completed: ${RESULTS.completed}`);
        console.log(`Failed:    ${RESULTS.failed}`);
        console.log(`Success:   ${Math.round(RESULTS.completed/TOTAL_USERS*100)}%`);
      }
    });
  }, i * 100);
}
