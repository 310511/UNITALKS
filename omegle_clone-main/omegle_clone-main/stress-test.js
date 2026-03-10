const { io } = require("socket.io-client");

// CONFIGURATION
const URL = "https://punya-mittal-omegle.hf.space";
const TOTAL_USERS = 6000;
const BATCH_SIZE = 10; // Lowered from 15 to reduce burst pressure
const DELAY_BETWEEN_BATCHES = 1000; // Increased delay to 1s (10 users/sec)

process.on('uncaughtException', (err) => {
    console.error('💥 UNCAUGHT EXCEPTION:', err);
});

process.on('unhandledRejection', (reason, promise) => {
    console.error('💥 UNHANDLED REJECTION:', reason);
});

// Mock SDP Data to simulate WebRTC negotiation packet size
const DUMMY_SDP = "v=0\r\no=- 4723928472938472938 2 IN IP4 127.0.0.1\r\ns=-\r\nt=0 0\r\na=group:BUNDLE 0 1\r\na=msid-semantic: WMS\r\nm=audio 9 UDP/TLS/RTP/SAVPF 111 103 104 9 0 8 106 105 13 110 112 113 126\r\nc=IN IP4 0.0.0.0\r\n" + "x".repeat(1000); // Add 1KB of junk to simulate real SDP size

console.log(`🚀 Starting WebRTC Signaling Stress Test for ${TOTAL_USERS} users...`);

let connectedCount = 0;
let matchCount = 0;
let signalsSent = 0;
let handshakesCompleted = 0;
let errorCount = 0;

function createClient(id) {
    const socket = io(URL, {
        transports: ["websocket"],
        reconnection: false
    });

    socket.on("connect", () => {
        connectedCount++;
        socket.emit("joinQueue", "text");
    });

    socket.on("match", (data) => {
        matchCount++;
        const partnerId = data.partnerId;

        // Simulate the WebRTC "Offer" phase
        // User with the "lower" ID acts as the initiator
        if (socket.id < partnerId) {
            setTimeout(() => {
                socket.emit("signal", { to: partnerId, signal: { type: "offer", sdp: DUMMY_SDP } });
                signalsSent++;
            }, 500);
        }
    });

    // Listen for signals to simulate the "Answer" phase
    socket.on("signal", (data) => {
        if (data.signal.type === "offer") {
            socket.emit("signal", { to: data.from, signal: { type: "answer", sdp: DUMMY_SDP } });
            // We don't increment signalsSent here as we only want to track unique routes
        } else if (data.signal.type === "answer") {
            handshakesCompleted++;
        }
    });

    socket.on("connect_error", (err) => {
        errorCount++;
        // console.error(`❌ Client ${id} error:`, err.message);
    });

    socket.on("disconnect", () => {
        connectedCount--;
    });
}

function startTest() {
    let created = 0;
    const interval = setInterval(() => {
        for (let i = 0; i < BATCH_SIZE && created < TOTAL_USERS; i++) {
            createClient(created++);
        }
        if (created >= TOTAL_USERS) clearInterval(interval);
    }, DELAY_BETWEEN_BATCHES);
}

// Start the test
startTest();

setInterval(() => {
    console.log(`\n--- WEBRTC SIGNALING REPORT ---`);
    console.log(`Users Online: ${connectedCount}`);
    console.log(`Total Matches: ${matchCount}`);
    console.log(`SDP Handshakes: ${handshakesCompleted}`);
    console.log(`Signals Routed: ${signalsSent}`);
    console.log(`Connection Errors: ${errorCount}`);
    console.log(`-------------------------------\n`);
}, 5000);
