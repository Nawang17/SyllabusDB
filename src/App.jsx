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

import AllCollegesPage from "./pages/AllColleges/AllCollegesPage.jsx";
import GuidelinesPage from "./pages/GuidelinesPage/GuideLinesPage.jsx";
import SubjectPage from "./pages/Subjects/SubjectPage.jsx";
import TakedownPage from "./pages/TakeDown/TakeDownPage.jsx";
import TermsOfService from "./pages/TermsOfService/TermsOfService.jsx";

function App() {
  return (
    <BrowserRouter>
      <MantineProvider>
        <Header />
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/college/:collegeId" element={<CollegePage />} />
          <Route path="/uploadSyllabus" element={<UploadSyllabusPage />} />
          <Route path="/colleges" element={<AllCollegesPage />} />
          <Route
            path="/college/:collegeId/subject/:subject"
            element={<SubjectPage />}
          />
          <Route path="/termsofservice" element={<TermsOfService />} />
          <Route path="/guidelines" element={<GuidelinesPage />} />
          <Route path="/takedown" element={<TakedownPage />} />

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
