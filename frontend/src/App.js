import "./App.css";
import { Route, BrowserRouter as Router, Routes } from "react-router-dom";
import { AuthProvider } from "./contexts/AuthContext";
import { ChatProvider } from "./contexts/ChatContext";
import Landing from "./pages/landing";
import Login from "./pages/login";
import Signup from "./pages/signup";
import Dashboard from "./components/dashboard";
import MessageModal from "./components/MessageModal";
import VideoMeet from "./pages/video";
import ChatPage from "./pages/ChatPage";
import FriendsPage from "./pages/FriendsPage";
import TeamsPage from "./pages/TeamsPage";
import CalendarPage from "./pages/CalendarPage";
import Layout from "./components/Layout";

function App() {
  return (
    <AuthProvider>
      <ChatProvider>
        <Router>
          <Routes>
            <Route path="/" element={<Landing />} />
            <Route path="/login" element={<Login />} />
            <Route path="/signup" element={<Signup />} />
            <Route path="/dashboard" element={<Layout><Dashboard /></Layout>} />
            <Route path="/meet/:url" element={<VideoMeet />} />
            <Route path="/chat" element={<Layout><ChatPage /></Layout>} />
            <Route path="/friends" element={<Layout><FriendsPage /></Layout>} />
            <Route path="/teams" element={<Layout><TeamsPage /></Layout>} />
            <Route path="/calendar" element={<Layout><CalendarPage /></Layout>} />
          </Routes>
          <MessageModal />
        </Router>
      </ChatProvider>
    </AuthProvider>
  );
}

export default App;
