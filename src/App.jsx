import "./App.css";
import { BrowserRouter, Routes, Route } from "react-router";
import { MantineProvider } from "@mantine/core";
import "@mantine/core/styles.css";
import HomePage from "./pages/HomePage/HomePage";
import Header from "./components/Header";
import CollegePage from "./pages/CollegePage/CollegePage";
import UploadSyllabusPage from "./pages/UploadSyllabusPage.jsx/UploadSyllabusPage";
import AdminApprovalPage from "./pages/Admin/AdminApprovalPage";
import LoginPage from "./pages/Login/LoginPage.jsx";
import Footer from "./components/Footer.jsx";
import AboutPage from "./pages/About/AboutPage.jsx";
import { getAuth, signInAnonymously, onAuthStateChanged } from "firebase/auth";
import { useEffect } from "react";
function App() {
  const auth = getAuth();
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (!user) {
        // Not logged in yet — sign in anonymously
        signInAnonymously(auth);
      }
    });

    return () => unsubscribe();
  }, []);
  return (
    <BrowserRouter>
      <MantineProvider>
        <Header />
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/college/:collegeId" element={<CollegePage />} />
          <Route path="/uploadSyllabus" element={<UploadSyllabusPage />} />
          <Route path="/admin" element={<AdminApprovalPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/aboutpage" element={<AboutPage />} />
        </Routes>

        <Footer />
      </MantineProvider>
    </BrowserRouter>
  );
}

export default App;
