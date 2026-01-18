import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { SocketProvider } from './context/SocketContext';
import Login from './pages/Login';
import Register from './pages/Register';
import WorkspaceSelect from './pages/WorkspaceSelect';
import Settings from './pages/Settings';
import WorkspaceManagement from './pages/WorkspaceManagement';
import Chat from './pages/Chat';

function ProtectedRoute({ children }) {
  const { user, loading } = useAuth();
  if (loading) return <div>Loading...</div>;
  if (!user) return <Navigate to="/login" />;
  return children;
}

function App() {
  return (
    <Router>
      <AuthProvider>
        <SocketProvider>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />

            <Route path="/client" element={
              <ProtectedRoute>
                <WorkspaceSelect />
              </ProtectedRoute>
            } />

            <Route path="/settings" element={
              <ProtectedRoute>
                <Settings />
              </ProtectedRoute>
            } />

            <Route path="/client/:workspaceId/manage" element={
              <ProtectedRoute>
                <WorkspaceManagement />
              </ProtectedRoute>
            } />

            <Route path="/client/:workspaceId" element={
              <ProtectedRoute>
                <Chat />
              </ProtectedRoute>
            } />

            <Route path="/client/:workspaceId/:channelId" element={
              <ProtectedRoute>
                <Chat />
              </ProtectedRoute>
            } />

            <Route path="/client/:workspaceId/dm/:dmId" element={
              <ProtectedRoute>
                <Chat />
              </ProtectedRoute>
            } />

            <Route path="/" element={<Navigate to="/client" />} />
          </Routes>
        </SocketProvider>
      </AuthProvider>
    </Router>
  )
}

export default App
