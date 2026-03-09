# Random Chat Application

A full-stack web application similar to Omegle with text, voice, and video chat capabilities.

## Features

- Random text chat
- Random voice chat
- Random video chat
- Real-time matchmaking
- Global online user count
- Responsive design for mobile and desktop
- WebRTC peer-to-peer connections
- No login required
- No data storage

## Prerequisites

- Node.js (v14 or higher)
- npm (v6 or higher)
- Git (for cloning the repository)

## Project Structure

```
random-chat/
├── client/                 # React frontend
│   ├── public/
│   ├── src/
│   ├── package.json
│   └── .env               # Environment variables for client
├── server/                 # Node.js backend
│   ├── server.js
│   └── package.json
├── package.json           # Root package.json
├── Dockerfile
├── .dockerignore
└── cloudbuild.yaml
```

## Initial Setup

### 1. Clone the Repository
```bash
git clone <repository-url>
cd random-chat
```

### 2. Install Dependencies
Install all dependencies for the entire project:
```bash
npm run install-all
```

This command will install dependencies for:
- Root project (concurrently for development)
- Client (React frontend)
- Server (Node.js backend)

### 3. Environment Configuration

#### For Local Development
Create a `.env` file in the `client` directory:
```bash
cd client
touch .env
```

Add the following content to `client/.env`:
```
REACT_APP_SOCKET_URL=http://localhost:5000
```

#### For Production (Cloud Run)
The environment variable will be set during deployment:
```
REACT_APP_SOCKET_URL=https://your-cloud-run-url
```

## Running the Application

### Development Mode (Recommended for Local Development)

Run both frontend and backend simultaneously:
```bash
npm run dev
```

This will start:
- Backend server on `http://localhost:5000`
- Frontend development server on `http://localhost:3000`

### Manual Mode (Alternative)

If you prefer to run servers separately:

1. Start the backend server:
   ```bash
   npm start
   ```

2. In a new terminal, start the frontend development server:
   ```bash
   cd client
   npm start
   ```

3. Open your browser and navigate to `http://localhost:3000`

## Building for Production

1. Build the frontend:
   ```bash
   npm run build
   ```

2. The backend will serve the built frontend files automatically

## Deployment

The application is designed to be deployed on Google Cloud Run. Follow these steps to deploy:

### Prerequisites for Deployment
- Google Cloud account
- Google Cloud SDK installed
- Docker (for manual deployment)

### Automated Deployment (Recommended)

1. Install the Google Cloud SDK and initialize your project:
   ```bash
   gcloud init
   ```

2. Enable required APIs:
   ```bash
   gcloud services enable cloudbuild.googleapis.com run.googleapis.com
   ```

3. Build and deploy using Cloud Build:
   ```bash
   gcloud builds submit
   ```

4. Set environment variables in Cloud Run:
   ```bash
   gcloud run services update random-chat --update-env-vars REACT_APP_SOCKET_URL=https://your-service-url
   ```

### Environment Variables

The following environment variables need to be set in production:

- `REACT_APP_SOCKET_URL`: The URL of your deployed service
- `PORT`: The port the server will listen on (default: 8080)
- `NODE_ENV`: Set to 'production' in production
- `ALLOWED_ORIGINS`: Comma-separated list of origins allowed by CORS (e.g. `https://your-site.com,https://app.your-site.com`). If unset, all origins are allowed (no credentials)
- `SUPPORT_TO`: Email address to receive support messages
- `SMTP_HOST`, `SMTP_PORT`, `SMTP_SECURE`, `SMTP_USER`, `SMTP_PASS`, `SMTP_FROM`: Configure outgoing email. If not set, server will use a JSON transport (no email actually sent)

### WebRTC (TURN/STUN)

For reliable media in NATed networks, add a TURN server. Update the `iceServers` in `client/src/components/VoiceChat.js` and `client/src/components/VideoChat.js` to include your TURN service (e.g. Twilio, coturn):

```
{
  urls: 'turn:your-turn.example.com:3478',
  username: 'user',
  credential: 'pass'
}
```

### Manual Deployment

If you prefer to deploy manually:

1. Build the Docker image:
   ```bash
   docker build -t gcr.io/[PROJECT_ID]/random-chat .
   ```

2. Push to Google Container Registry:
   ```bash
   docker push gcr.io/[PROJECT_ID]/random-chat
   ```

3. Deploy to Cloud Run:
   ```bash
   gcloud run deploy random-chat \
     --image gcr.io/[PROJECT_ID]/random-chat \
     --platform managed \
     --region us-central1 \
     --allow-unauthenticated
   ```

Replace `[PROJECT_ID]` with your Google Cloud project ID.

## Available Scripts

### Root Level Scripts
- `npm run install-all`: Install dependencies for all parts of the project
- `npm run dev`: Start both frontend and backend in development mode
- `npm start`: Start only the backend server
- `npm run build`: Build the frontend for production
- `npm test`: Run frontend tests

### Client Scripts
- `npm start`: Start React development server
- `npm run build`: Build for production
- `npm test`: Run tests
- `npm run eject`: Eject from Create React App (not recommended)

### Server Scripts
- `npm start`: Start production server
- `npm run dev`: Start development server with nodemon

## Technical Details

- Frontend: React with React Router and styled-components
- Backend: Node.js with Express and Socket.IO
- WebRTC: simple-peer for peer-to-peer connections
- UI Components: lucide-react for icons and UI elements
- STUN Server: Google's public STUN server (stun:stun.l.google.com:19302)

## Dependencies

### Root Dependencies
- `concurrently`: Run multiple commands concurrently

### Backend Dependencies
- `express`: Web framework
- `socket.io`: Real-time communication
- `cors`: Cross-origin resource sharing
- `dotenv`: Environment variable management

### Backend Dev Dependencies
- `nodemon`: Auto-restart server during development

### Frontend Dependencies
- `react`: UI library
- `react-dom`: React DOM rendering
- `react-router-dom`: Client-side routing
- `styled-components`: CSS-in-JS styling
- `socket.io-client`: Socket.IO client
- `simple-peer`: WebRTC peer connections
- `lucide-react`: Icon library
- `react-icons`: Additional icon library
- `buffer`: Buffer polyfill for WebRTC
- `react-scripts`: Create React App scripts

### Frontend Dev Dependencies
- `@testing-library/jest-dom`: Testing utilities
- `@testing-library/react`: React testing utilities
- `@testing-library/user-event`: User event testing
- `web-vitals`: Performance monitoring

## Troubleshooting

### Common Issues

1. **Port already in use**: 
   - Change the port in `server/server.js` or kill the process using the port

2. **Environment variables not loading**:
   - Ensure `.env` file is in the `client` directory
   - Restart the development server after creating `.env`

3. **WebRTC not working**:
   - Ensure you're using HTTPS in production
   - Check browser permissions for camera/microphone

4. **Socket connection issues**:
   - Verify `REACT_APP_SOCKET_URL` is set correctly
   - Check if the server is running on the specified port

### Development Tips

- Use browser developer tools to monitor WebSocket connections
- Check the browser console for any JavaScript errors
- Monitor the server console for connection logs
- Use different browsers to test peer-to-peer connections

## Security Notes

- No user data is stored
- No moderation system
- No analytics
- Uses WebRTC for peer-to-peer connections
- HTTPS required for media access in production
- CORS is configured to allow all origins (consider restricting in production)

## License

MIT 