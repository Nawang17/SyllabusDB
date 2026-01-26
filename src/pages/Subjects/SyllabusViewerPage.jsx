import { useParams, useNavigate } from "react-router";
import { doc, getDoc } from "firebase/firestore";
import { useEffect, useMemo, useState } from "react";
import { Box, Button, Flex, Group, Skeleton, Text } from "@mantine/core";
import { db } from "../../../firebaseConfig";
import { IconArrowLeft, IconExternalLink } from "@tabler/icons-react";

export default function SyllabusViewerPage() {
  const { collegeId, subject, courseId, syllabusId } = useParams();
  const navigate = useNavigate();
  const [syllabus, setSyllabus] = useState(null);
  const [loading, setLoading] = useState(true);

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
  console.log(syllabus);
  const syllabusTitle = syllabus?.file_path.split("/")[2];

  const openPdf = () =>
    window.open(syllabus?.pdf_url, "_blank", "noopener,noreferrer");

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
        {!isMobile && (
          <Button
            leftSection={<IconExternalLink size={14} />}
            variant="subtle"
            color="gray"
            size="sm"
            onClick={openPdf}
          >
            Open PDF in a new tab
          </Button>
        )}
      </Group>
      <Flex pl={15} direction="column" gap={4} mb="md">
        <Text fw={600} size="sm">
          {syllabusTitle}
        </Text>

        <Text size="xs" c="dimmed">
          {syllabus?.term} {syllabus?.year} • {syllabus?.professor}
        </Text>
      </Flex>

      {isMobile ? (
        <div>
          <Box
            mb={15}
            style={{
              border: "1px solid #e5e7eb",
              borderRadius: 8,
              padding: "1rem",
              background: "#fff",
            }}
          >
            <Text fw={600} mb={6}>
              PDF viewing on mobile
            </Text>
            <Text size="sm" c="dimmed" mb="md">
              Some mobile browsers don’t scroll embedded PDFs reliably. Opening
              in a new tab works best.
            </Text>
            <Button
              leftSection={<IconExternalLink size={16} />}
              onClick={openPdf}
            >
              Open PDF in a new tab
            </Button>
          </Box>
          <iframe
            src={syllabus.pdf_url}
            title={syllabusTitle}
            style={{
              width: "100%",
              height: "80vh",
              border: "1px solid #e5e7eb",
              borderRadius: 8,
            }}
          />
        </div>
      ) : (
        // Desktop: keep iframe, but put it inside a scrollable container (helps some cases too)
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
            title={syllabusTitle}
            style={{
              width: "100%",
              height: "100%",
              border: 0,
            }}
          />
        </div>
      )}
    </div>
  );
}
