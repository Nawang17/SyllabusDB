import { useParams, useNavigate } from "react-router";
import { doc, getDoc } from "firebase/firestore";
import { useEffect, useState } from "react";
import { Box, Button, Group, Skeleton } from "@mantine/core";
import { db } from "../../../firebaseConfig";
import { IconArrowLeft, IconExternalLink } from "@tabler/icons-react";

export default function SyllabusViewerPage() {
  const { collegeId, subject, courseId, syllabusId } = useParams();
  const navigate = useNavigate();
  const [syllabus, setSyllabus] = useState(null);
  const [loading, setLoading] = useState(true);

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
        {/* Top controls skeleton */}
        <Group mb="md">
          <Skeleton height={36} width={180} radius="md" />
          <Skeleton height={36} width={160} radius="md" />
        </Group>

        {/* Title / metadata skeleton */}
        <Box mb="md">
          <Skeleton height={20} width="60%" mb={8} />
          <Skeleton height={14} width="40%" />
        </Box>

        {/* PDF viewer skeleton */}
        <Skeleton
          height="80vh"
          radius="md"
          style={{ border: "1px solid #e5e7eb" }}
        />
      </div>
    );
  }

  if (!syllabus) return <p>Syllabus not found.</p>;

  return (
    <div style={{ maxWidth: 1200, margin: "0 auto", padding: "1.5rem" }}>
      <Group mb="md">
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
          onClick={() => window.open(syllabus.pdf_url, "_blank")}
        >
          Open PDF in new tab
        </Button>
      </Group>

      <iframe
        src={syllabus.pdf_url}
        title="Syllabus PDF"
        style={{
          width: "100%",
          height: "80vh",
          border: "1px solid #e5e7eb",
          borderRadius: 8,
        }}
      />
    </div>
  );
}
