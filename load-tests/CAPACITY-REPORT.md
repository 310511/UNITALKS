# UniTalks Capacity Report
Generated: 2026-03-13
Environment: Local development
Machine: [Assumed ~4 CPU cores, 8–16 GB RAM desktop]

## Summary Table
| Mode       | Safe Users | Breaking Point | Failure Rate | p95 Latency |
|------------|-----------:|---------------:|-------------:|------------:|
| Text Chat  | ~200       | ~300           | ~94%         | ~25,600ms   |
| Voice Chat | ~120       | ~200           | ~87%         | ~40,500ms   |
| Video Chat | ~100       | ~180           | ~80%         | ~58,000ms   |
| Mixed Load | ~250       | ~400           | ~98%         | ~36,700ms   |

> **Note:** “Safe Users” here is a conservative *local* estimate where the server has not yet fallen over, **not** where it fully meets the ideal SLOs (≤5% failures, ≤2000ms p95). Your current configuration crosses those ideal limits very early; these numbers reflect the point where the system is still usable but clearly under stress.

## What "Safe Users" Means
The “Safe Users” column is the maximum approximate concurrent virtual users where:

- Failure rate has not yet completely saturated (system still recovers between spikes).
- p95 latency has not yet reached its absolute worst values (but is already well above 2000ms).
- Emit rate is still relatively stable (not yet in a free‑fall).

Your current setup **does not** maintain:

- Failure rate under **5%**, or
- p95 latency under **2000ms**

for any of the high‑load phases. So the “safe” numbers above are **practical limits today**, not ideal SLO‑compliant capacity.

## Text Chat Results
- Safe concurrent users: **~200**
- Breaking point: **~300** concurrent users  
  (after this, failure rate and latency explode)
- Total attempted: **24,900**
- Completed: **1,634** (~6.6%)
- Failed: **23,266** (~93.4%)
- p95 latency: **~25,600ms** (from summary p95 session length)
- p99 latency: **~28,000–30,000ms**
- Primary error: **xhr poll error** and **xhr post error**
- Emit rate peak: **~175/sec** during ramp/sustain
- Emit rate at breakdown: **drops to ~7–9/sec** during spike/cool‑down

**Interpretation:**  
Text chat is by far the heaviest load: every message traverses the server, and when you ramp above ~200–300 concurrent users, long‑polling (`xhr poll`/`xhr post`) starts failing at scale. Latency climbs into tens of seconds and most virtual users cannot complete their scripted sessions.

## Voice Chat Results
- Safe concurrent users: **~120**
- Breaking point: **~200** concurrent users
- Total attempted: **12,300**
- Completed: **1,559** (~12.7%)
- Failed: **10,741** (~87.3%)
- p95 latency: **~40,500ms**
- p99 latency: **~42,000ms**
- Primary error: **xhr poll error** and **xhr post error**
- Emit rate peak: **~60–64/sec** early in the test
- Emit rate at breakdown: **~8–10/sec** during the spike

**Interpretation:**  
Voice chat only stresses **signaling** (join queue + SDP + a candidate + 30s “call”). Even so, under sustained and spike loads, xhr‑based transports become unstable. Because calls are longer, per‑VU session length is very high (30–40s+), and when the server is under strain, new voice VUs fail to complete quickly.

## Video Chat Results
- Safe concurrent users: **~100**
- Breaking point: **~180** concurrent users
- Total attempted: **7,680**
- Completed: **1,505** (~19.6%)
- Failed: **6,175** (~80.4%)
- p95 latency: **~58,000ms**
- p99 latency: **~61,700ms**
- Primary error: **xhr poll error** and **xhr post error**
- Emit rate peak: **~110–120/sec** at mid‑ramp
- Emit rate at breakdown: **~7–15/sec** during late spike

**Interpretation:**  
Video chat signaling has the heaviest individual messages (SDP offers + multiple ICE candidates). Under heavy concurrent load, the same transport bottlenecks show up as in text/voice, but the effect is more pronounced because of larger payloads and longer video “call” think times. Again: **this is signaling only** – once peers are connected, actual video RTP flows do not hit the Node.js server.

## Mixed Load Results
- Safe concurrent users: **~250** (all modes combined)
- Breaking point: **~400+** concurrent users
- Total attempted: **73,800**
- Completed: **1,100** (~1.5%)
- Failed: **72,700** (~98.5%)
- p95 latency: **~36,700ms**
- p99 latency: **~41,000ms**
- Primary error: **xhr poll error** (dominant) + **xhr post error**
- Emit rate peak: **~80–90/sec** during early ramp
- Emit rate at breakdown: **~10–15/sec**, oscillating during peak/spike

**Interpretation:**  
With the 60% text / 25% voice / 15% video mix, the text workload dominates. As you climb into the “Peak load” and “Extreme spike” phases, error rates exceed 90%, and the server spends most of its time failing long‑polling requests instead of pushing new events.

## Key Bottlenecks Identified
1. **xhr polling instead of pure WebSocket under load**
   - The errors are overwhelmingly `xhr poll error` and `xhr post error`.
   - Even though the server allows WebSockets, many client connections under Artillery end up via long‑polling, which is far less efficient and much easier to saturate on CPU and sockets.

2. **Single‑process Node.js handling everything**
   - Your server process is handling:
     - Express HTTP
     - Socket.IO handshake & transports
     - Matching logic every 250ms
     - Redis state access
   - Under thousands of concurrent vusers, the single event loop becomes saturated, which manifests as huge p95/p99 latencies and falling emit rates.

3. **Very aggressive virtual user arrival patterns**
   - The test phases hit:
     - Up to **300 arrivals/sec** in text
     - Up to **500 arrivals/sec** in mixed
   - This is essentially a **connection storm**, well beyond “normal” production ramp‑up. It’s good to find theoretical limits, but the current config is harsher than many real‑world scenarios; it exposes system weaknesses very quickly.

4. **Lack of back‑pressure / admission control**
   - When the server is overloaded, new users still keep joining the queue and attempting to signal.
   - There is no “server busy / try again later” behavior, so failures just accumulate, inflating failure rates.

## Verdict
- Current capacity (local): **~250 concurrent users total** before the system becomes clearly unstable under your harshest load profiles.
- Text chat handles: **~150–200 concurrent pairs** (300–400 text users; but with very high latencies as you approach 300+).
- Voice chat handles: **~80–120 concurrent pairs** under signaling load.
- Video chat handles: **~60–100 concurrent pairs** under signaling load.
- Mixed (60/25/15 split): **~250 concurrent users** is a realistic “safe but stressed” upper bound on this single local instance.

Remember:

- **Voice/Video numbers are SIGNALING ONLY.**
  - Audio/video RTP streams are peer‑to‑peer; the server only sees:
    - Queue joins
    - SDP offers/answers
    - A handful of ICE candidates
  - Once the P2P connection is established, marginal signaling load drops.

- **Text chat is the heaviest on the server.**
  - All messages traverse the Node.js process.
  - Long‑lived text conversations keep emitting Socket.IO events throughout the chat instead of just during connection setup.

- **Local machine limitations matter.**
  - Artillery, the React dev server, and Node.js backend are all sharing CPU and RAM.
  - Disk and OS scheduling on your dev machine are not tuned like a production VM.
  - A realistic **AWS t3.medium** (2 vCPU, 4GB) could handle roughly **3–5×** these numbers.
  - A **t3.large** (2 vCPU, 8GB) or similar could push toward **8–10×**, assuming Redis and clustering are configured correctly.

## What These Numbers Mean in Real World
- At **~250 concurrent users**:
  - Roughly **125 active text chat pairs**, plus some additional voice/video signaling users.
  - The server is still functioning but already showing long latencies and elevated error rates under the synthetic “spiky” workload.
- Voice/Video counts:
  - These are limited mostly by **signaling chattiness** and the matching cadence, not by the media payload (which is off‑loaded to WebRTC peer connections).
- On a properly sized cloud instance:
  - With clustering and Redis, these **local limits should be multiplied** by at least **3–5×** (t3.medium) and up to **8–10×** (t3.large+), as long as network and Redis are also scaled appropriately.

## Recommendations to increase capacity

**Priority 1 (biggest impact): Transport & Socket.IO configuration**
  - **Force WebSocket where possible** in your Socket.IO clients:
    - Set `transports: ['websocket']` on clients in production where WebSockets are available.
  - Consider **disabling long‑polling** in high‑scale environments or only allowing it as a rare fallback.
  - Tune Socket.IO heartbeat/ping intervals and timeouts for production to reduce spurious disconnects under load.

**Priority 2: Scale out the Node.js backend**
  - Use **Node.js cluster mode** or run **multiple container instances** behind a load balancer.
  - Ensure **Redis adapter** is active and healthy so that Socket.IO rooms and events replicate correctly.
  - Separate concerns:
    - One service for **matchmaking/state**.
    - One or more services dedicated to **Socket.IO signaling**.

**Priority 3: Rate limiting & back‑pressure**
  - Introduce **connection and queue admission limits**:
    - If queues exceed a certain length, return “server busy, please retry” to new joins.
  - Add **per‑IP and per‑session rate limits** on signaling and message events (you already have some token‑bucket style logic; tune and enforce it more aggressively under high load).
  - Log and monitor:
    - When `userCount` exceeds a threshold, begin shedding non‑critical traffic.

**Additional optimizations:**
  - Reduce payload sizes in signaling (shorter SDP/candidate fields when possible).
  - Avoid unnecessary JSON bloat in event payloads.
  - Ensure Redis is running on the same LAN / low‑latency network as the Node.js processes.

## Estimated capacity AFTER fixes

If you implement the priorities above (especially WebSocket‑first transport, clustering, and better back‑pressure) and deploy on a modest cloud VM:

| Mode       | Current (Local) | After Fixes (Prod‑like) | Improvement |
|------------|----------------:|------------------------:|------------:|
| Text Chat  | ~200 users      | ~800–1500 users         | ~4–7×       |
| Voice Chat | ~120 users      | ~500–800 users          | ~4–6×       |
| Video Chat | ~100 users      | ~400–700 users          | ~4–7×       |

These are **order‑of‑magnitude planning numbers**, not hard guarantees, but they give stakeholders a clear sense of where UniTalks stands today and how far it can scale with targeted engineering work.

