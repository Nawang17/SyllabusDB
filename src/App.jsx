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
import Footer from "./pages/Footer/Footer.jsx";

import AllCollegesPage from "./pages/AllColleges/AllCollegesPage.jsx";
import GuidelinesPage from "./pages/Footer/GuidelinesPage/GuideLinesPage.jsx";
import SubjectPage from "./pages/Subjects/SubjectPage.jsx";
import TakedownPage from "./pages/Footer/TakeDown/TakeDownPage.jsx";
import TermsOfService from "./pages/Footer/TermsOfService/TermsOfService.jsx";
import { Notifications } from "@mantine/notifications";
import MyUploadsPage from "./pages/Account/MyUploads/MyUploadsPage.jsx";
import RequestCollege from "./pages/RequestCollege/RequestCollege.jsx";
import AboutPage from "./pages/Footer/About/AboutPage.jsx";
import PrivacyPolicy from "./pages/Footer/PrivacyPolicy/PrivacyPolicy.jsx";
import SettingsPage from "./pages/Account/MyUploads/Settings/Settings.jsx";
import ExtensionPrivacyPolicy from "./pages/syllabusdb-extension/ExtensionPrivacyPolicy.jsx";

function App() {
  return (
    <BrowserRouter>
      <MantineProvider>
        <Notifications />
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
          <Route path="/myuploads" element={<MyUploadsPage />} />

          <Route path="/termsofservice" element={<TermsOfService />} />
          <Route path="/guidelines" element={<GuidelinesPage />} />
          <Route path="/takedown" element={<TakedownPage />} />
          <Route path="/privacy-policy" element={<PrivacyPolicy />} />
          <Route path="/admin" element={<AdminApprovalPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/aboutpage" element={<AboutPage />} />
          <Route path="/requestcollege" element={<RequestCollege />} />
          <Route path="/settings" element={<SettingsPage />} />

          {/* SyllabusDB Extension Privacy Policy */}
          <Route
            path="/extension-privacy-policy"
            element={<ExtensionPrivacyPolicy />}
          />
        </Routes>

        <Footer />
      </MantineProvider>
    </BrowserRouter>
  );
}

export default App;
