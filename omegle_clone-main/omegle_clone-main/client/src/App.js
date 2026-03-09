import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import styled from 'styled-components';
import Homepage from './components/Homepage';
import StartChat from './components/StartChat';
import TextChat from './components/TextChat';
import VoiceChat from './components/VoiceChat';
import VideoChat from './components/VideoChat';
import Privacy from './components/Privacy';
import Terms from './components/Terms';
import About from './components/About';
import Help from './components/Help';

const AppBackground = styled.div`
  min-height: 100vh;
  width: 100vw;
  background: ${props => props.theme.colors.appBg};
  display: flex;
  flex-direction: column;
`;

const MainContent = styled.main`
  flex: 1;
  display: flex;
  flex-direction: column;
  max-width: 100vw;
`;

function App() {


  return (
    <Router>
      <AppBackground>
        <MainContent>
          <Routes>
            <Route path="/" element={<Homepage />} />
            <Route path="/start-chat" element={<StartChat />} />
            <Route path="/text" element={<TextChat />} />
            <Route path="/voice" element={<VoiceChat />} />
            <Route path="/video" element={<VideoChat />} />
            <Route path="/privacy" element={<Privacy />} />
            <Route path="/terms" element={<Terms />} />
            <Route path="/about" element={<About />} />
            <Route path="/help" element={<Help />} />
          </Routes>
        </MainContent>
      </AppBackground>
    </Router>
  );
}

export default App; 