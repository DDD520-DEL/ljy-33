import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Home from "@/pages/Home";
import FloorDetail from "@/pages/FloorDetail";
import Statistics from "@/pages/Statistics";
import Navbar from "@/components/Navbar";
import AlertModal from "@/components/AlertModal";
import { useBathroomStore } from "@/store/useBathroomStore";

function AppContent() {
  const { showAlertModal, currentAlert, dismissAlert } = useBathroomStore();

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/floor/:floorId" element={<FloorDetail />} />
        <Route path="/stats" element={<Statistics />} />
      </Routes>
      {showAlertModal && currentAlert && (
        <AlertModal alert={currentAlert} onDismiss={dismissAlert} />
      )}
    </div>
  );
}

export default function App() {
  return (
    <Router>
      <AppContent />
    </Router>
  );
}
