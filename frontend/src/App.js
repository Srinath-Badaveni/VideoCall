import './App.css';
import { Route, BrowserRouter as Router, Routes } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import Landing from './pages/landing';
import Login from './pages/login';
import Signup from './pages/signup';
import Dashboard from './components/dashboard';
import MessageModal from './components/MessageModal';
import VideoMeet from './pages/video';

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route path="/" element={<Landing />} />
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/meet/:url" element={<VideoMeet />} />
        </Routes>
        <MessageModal />
      </Router>
    </AuthProvider>
  );
}

export default App;
