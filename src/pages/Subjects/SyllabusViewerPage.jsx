import { useParams, useNavigate } from "react-router";
import { doc, getDoc } from "firebase/firestore";
import { useEffect, useMemo, useState } from "react";
import { Box, Button, Group, Skeleton, Text, Loader } from "@mantine/core";
import { db } from "../../../firebaseConfig";
import { IconArrowLeft, IconExternalLink } from "@tabler/icons-react";

import { Document, Page, pdfjs } from "react-pdf";
import "react-pdf/dist/Page/AnnotationLayer.css";
import "react-pdf/dist/Page/TextLayer.css";

pdfjs.GlobalWorkerOptions.workerSrc = new URL(
  "pdfjs-dist/build/pdf.worker.min.mjs",
  import.meta.url,
).toString();

export default function SyllabusViewerPage() {
  const { collegeId, subject, courseId, syllabusId } = useParams();
  const navigate = useNavigate();
  const [syllabus, setSyllabus] = useState(null);
  const [loading, setLoading] = useState(true);

  // react-pdf state
  const [numPages, setNumPages] = useState(null);
  const [pdfError, setPdfError] = useState(null);

  const isMobile = useMemo(() => {
    if (typeof window === "undefined") return false;
    return window.matchMedia("(max-width: 768px)").matches;
  }, []);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });

    const fetchSyllabus = async () => {
      const ref = doc(
        db,
        "colleges",
        collegeId,
        "courses",
        courseId,
        "syllabi",
        syllabusId,
      );
      const snap = await getDoc(ref);
      if (snap.exists()) setSyllabus(snap.data());
      setLoading(false);
    };

    fetchSyllabus();
  }, [collegeId, courseId, syllabusId]);

  if (loading) {
    return (
      <div style={{ maxWidth: 1200, margin: "0 auto", padding: "1.5rem" }}>
        <Group mb="md">
          <Skeleton height={36} width={180} radius="md" />
          <Skeleton height={30} width={170} radius="md" />
        </Group>
        <Box mb="md">
          <Skeleton height={20} width="60%" mb={8} />
          <Skeleton height={14} width="40%" />
        </Box>
        <Skeleton
          height="80vh"
          radius="md"
          style={{ border: "1px solid #e5e7eb" }}
        />
      </div>
    );
  }

  if (!syllabus) return <p>Syllabus not found.</p>;

  const openPdf = () =>
    window.open(syllabus.pdf_url, "_blank", "noopener,noreferrer");

  return (
    <div style={{ maxWidth: 1200, margin: "0 auto", padding: "1.5rem" }}>
      <Group mb="md" justify="space-between" wrap="wrap">
        <Button
          leftSection={<IconArrowLeft size={16} />}
          variant="subtle"
          onClick={() => navigate(`/college/${collegeId}/subject/${subject}`)}
        >
          Back to {subject?.toUpperCase()} courses
        </Button>

        <Button
          leftSection={<IconExternalLink size={14} />}
          variant="subtle"
          color="gray"
          size="sm"
          onClick={openPdf}
        >
          Open PDF in new tab
        </Button>
      </Group>

      {/* MOBILE: render with pdf.js so it scrolls */}
      {isMobile ? (
        <Box
          style={{
            border: "1px solid #e5e7eb",
            borderRadius: 8,
            background: "#fff",
            padding: "0.75rem",
          }}
        >
          {pdfError ? (
            <Box>
              <Text fw={600} mb={6}>
                Could not load PDF
              </Text>
              <Text size="sm" c="dimmed" mb="md">
                Your browser blocked embedded loading. Open in a new tab
                instead.
              </Text>
              <Button
                leftSection={<IconExternalLink size={16} />}
                onClick={openPdf}
              >
                View PDF
              </Button>
            </Box>
          ) : (
            <Document
              file={syllabus.pdf_url}
              onLoadSuccess={({ numPages }) => setNumPages(numPages)}
              onLoadError={(err) => setPdfError(err)}
              loading={<Loader />}
            >
              <Box
                style={{ display: "flex", flexDirection: "column", gap: 12 }}
              >
                {Array.from(new Array(numPages || 0), (_, i) => (
                  <Box
                    key={`page_${i + 1}`}
                    style={{
                      display: "flex",
                      justifyContent: "center",
                      background: "#f9fafb",
                      borderRadius: 8,
                      padding: 8,
                    }}
                  >
                    <Page
                      pageNumber={i + 1}
                      width={Math.min(720, window.innerWidth - 48)}
                      renderAnnotationLayer={false}
                    />
                  </Box>
                ))}
              </Box>
            </Document>
          )}
        </Box>
      ) : (
        // DESKTOP: iframe is fine
        <div
          style={{
            height: "80vh",
            overflow: "auto",
            WebkitOverflowScrolling: "touch",
            border: "1px solid #e5e7eb",
            borderRadius: 8,
            background: "#fff",
          }}
        >
          <iframe
            src={syllabus.pdf_url}
            title="Syllabus PDF"
            style={{ width: "100%", height: "100%", border: 0 }}
          />
        </div>
      )}
    </div>
  );
}
