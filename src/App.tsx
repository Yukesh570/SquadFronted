import { BrowserRouter } from "react-router-dom";
import AppRoutes from "./routes/AppRoutes";
import { AuthProvider } from "./context/AuthContext";
// 1. Remove the ToastContainer and CSS imports from here

// 2. Import our new clean component
import ToastManager from "./components/ui/ToastManager";

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
      {/* 3. Add our new component here. It's much cleaner! */}
      <ToastManager />
    </BrowserRouter>
  );
}

export default App;