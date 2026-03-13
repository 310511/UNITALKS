# UniTalks Load Test Results Guide

This guide explains how to interpret the Artillery reports and the logs from `monitor.js` when load testing UniTalks.

## Key Metrics

- **http.response_time.p99 / socket.io latency p99**
  - **GOOD**: under 1000 ms
  - **OK**: 1000–3000 ms
  - **BAD**: over 3000 ms → server is struggling under current load

- **errors (socket disconnects / timeouts / connection errors)**
  - **GOOD**: under 1%
  - **OK**: 1–5%
  - **BAD**: over 5% → server is dropping connections or timing out

- **vusers.completed vs vusers.failed**
  - **GOOD**: `vusers.failed` under 2%
  - **BAD**: over 2% → a noticeable fraction of users cannot complete a session

- **Memory usage (from `monitor.js`)**
  - **GOOD**: heap stays under ~512 MB
  - **OK**: 512 MB – 1 GB
  - **BAD**: over 1 GB or steadily increasing without stabilizing → potential memory leak

## Breaking Point Indicators

You are approaching or past the capacity of this single Node.js instance when you see:

- p99 latency **suddenly spikes** (2x or more) as concurrent users rise.
- Error rate **jumps above ~10%**.
- `vusers.failed` starts increasing rapidly compared to `vusers.completed`.
- Memory usage grows continuously over the duration of the test with no plateau.

## Rough Capacity Expectations (single Node.js process)

For a single Node.js server (no clustering, standard VPS, WebRTC media is peer‑to‑peer, Redis for state where available):

- **Text chat**: ~**500–800** concurrent users
- **Voice chat (signaling only)**: ~**200–400** concurrent pairs
- **Video chat (signaling only)**: ~**150–300** concurrent pairs
- **Mixed traffic**: ~**300–500** total concurrent users

With Node.js **cluster mode** enabled and **Redis-backed state**, real-world capacity can be **3–5× higher**, depending on hardware and network.

## How to Run (Local)

1. **Terminal 1 – Start backend (and frontend if needed)**
   - `npm run dev` or your usual start command.

2. **Terminal 2 – Start monitoring**
   - `node load-tests/monitor.js`

3. **Terminal 3 – Run one test**
   - `artillery run load-tests/text-chat.yml`

4. (Optional) Use the Bash helper to run all local tests:
   - `bash load-tests/run-tests.sh`

## Running AWS Tests

When the app is deployed to AWS at `https://unitalks.gingr.chat:5006`, you can run the same scenarios directly against the live backend:

**Option A — Run single AWS tests**

```bash
artillery run load-tests\text-chat.yml
artillery run load-tests\voice-chat.yml
artillery run load-tests\video-chat.yml
artillery run load-tests\aws-full-test.yml
```

**Option B — Run all AWS tests in sequence (PowerShell)**

```powershell
powershell -ExecutionPolicy Bypass -File load-tests\run-aws-tests.ps1
```

**Option C — Run full AWS mixed test only**

```bash
artillery run load-tests\aws-full-test.yml
```

