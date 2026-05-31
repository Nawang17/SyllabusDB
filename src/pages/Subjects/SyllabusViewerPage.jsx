import { useParams, useNavigate } from "react-router";
import { doc, getDoc } from "firebase/firestore";
import { useEffect, useMemo, useState } from "react";
import {
  Alert,
  Badge,
  Box,
  Button,
  Card,
  Divider,
  Flex,
  Group,
  Paper,
  Skeleton,
  Stack,
  Text,
  Title,
} from "@mantine/core";
import {
  IconArrowLeft,
  IconExternalLink,
  IconFileText,
  IconInfoCircle,
  IconStarFilled,
} from "@tabler/icons-react";
import { db } from "../../../firebaseConfig";

function formatCollegeName(collegeId) {
  if (!collegeId) return "";
  return collegeId
    .split("-")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

function useIsMobile() {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const query = window.matchMedia("(max-width: 768px)");
    const update = () => setIsMobile(query.matches);

    update();
    query.addEventListener("change", update);

    return () => query.removeEventListener("change", update);
  }, []);

  return isMobile;
}

export default function SyllabusViewerPage() {
  const { collegeId, subject, courseId, syllabusId } = useParams();
  const navigate = useNavigate();

  const [syllabus, setSyllabus] = useState(null);
  const [loading, setLoading] = useState(true);

  const isMobile = useIsMobile();

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });

    async function fetchSyllabus() {
      try {
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

        if (snap.exists()) {
          setSyllabus({ id: snap.id, ...snap.data() });
        }
      } catch (error) {
        console.error("Error fetching syllabus:", error);
      } finally {
        setLoading(false);
      }
    }

    fetchSyllabus();
  }, [collegeId, courseId, syllabusId]);

  const collegeName = useMemo(() => formatCollegeName(collegeId), [collegeId]);

  const syllabusTitle =
    syllabus?.title || syllabus?.file_path?.split("/")?.pop() || "Syllabus PDF";

  const hasReview = Boolean(syllabus?.experience_text);

  const openPdf = () => {
    if (!syllabus?.pdf_url) return;
    window.open(syllabus.pdf_url, "_blank", "noopener,noreferrer");
  };

  if (loading) {
    return (
      <Box maw={1300} mx="auto" p={{ base: "md", sm: "xl" }}>
        <Skeleton height={36} width={260} mb="lg" />
        <Skeleton height={90} radius="lg" mb="md" />
        <Skeleton height="78vh" radius="lg" />
      </Box>
    );
  }

  if (!syllabus) {
    return (
      <Box maw={900} mx="auto" p="xl">
        <Alert icon={<IconInfoCircle size={18} />} color="red" radius="md">
          Syllabus not found.
        </Alert>
      </Box>
    );
  }

  return (
    <Box maw={1210} mx="auto" p={{ base: "md", sm: "xl" }}>
      <Group justify="space-between" mb="md" gap="sm">
        <Button
          variant="light"
          onClick={() => navigate(`/college/${collegeId}/subject/${subject}`)}
        >
          View all {subject?.toUpperCase()} courses
        </Button>

        {syllabus?.pdf_url && (
          <Button
            leftSection={<IconExternalLink size={16} />}
            variant={isMobile ? "filled" : "light"}
            color="blue"
            onClick={openPdf}
          >
            Open PDF
          </Button>
        )}
      </Group>

      <Paper withBorder radius="lg" p={{ base: "md", sm: "lg" }} mb="md">
        <Group justify="space-between" align="flex-start" gap="md">
          <Box>
            <Group gap="xs" mb={6}>
              <Title order={3}> {courseId}</Title>
            </Group>

            <Text size="sm" c="dimmed">
              {collegeName}
              {syllabus?.term ? ` • ${syllabus.term}` : ""}
              {syllabus?.year ? ` ${syllabus.year}` : ""}
              {syllabus?.professor ? ` • Professor ${syllabus.professor}` : ""}
            </Text>
          </Box>

          {syllabus?.rating && (
            <Badge
              size="lg"
              color="yellow"
              leftSection={<IconStarFilled size={13} />}
            >
              {syllabus.rating}/5
            </Badge>
          )}
        </Group>
      </Paper>

      {hasReview && (
        <Card withBorder radius="lg" p="lg" mb="md">
          <Group justify="space-between" mb="xs">
            <Title order={4}>Review</Title>
            {syllabus?.reviewedBy && (
              <Text size="xs" c="dimmed">
                Reviewed by {syllabus.reviewedBy}
              </Text>
            )}
          </Group>

          <Divider mb="sm" />

          <Text size="sm" style={{ whiteSpace: "pre-line", lineHeight: 1.7 }}>
            {syllabus.experience_text}
          </Text>
        </Card>
      )}

      {!syllabus?.pdf_url ? (
        <Alert icon={<IconInfoCircle size={18} />} color="orange" radius="md">
          This syllabus does not have a PDF URL.
        </Alert>
      ) : isMobile ? (
        <Stack gap="md">
          <Alert icon={<IconInfoCircle size={18} />} color="blue" radius="md">
            Embedded PDFs are unreliable on mobile. Use the Open PDF button for
            the best viewing experience.
          </Alert>

          <Box
            style={{
              height: "75vh",
              border: "1px solid #e5e7eb",
              borderRadius: 12,
              overflow: "hidden",
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
          </Box>
        </Stack>
      ) : (
        <Box
          style={{
            height: "82vh",
            border: "1px solid #e5e7eb",
            borderRadius: 12,
            overflow: "hidden",
            background: "#fff",
            boxShadow: "0 8px 24px rgba(15, 23, 42, 0.06)",
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
        </Box>
      )}
    </Box>
  );
}
