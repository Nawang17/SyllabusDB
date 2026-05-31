import { useParams, useNavigate } from "react-router";
import { doc, getDoc } from "firebase/firestore";
import { useEffect, useMemo, useState } from "react";
import {
  Alert,
  Badge,
  Box,
  Button,
  Collapse,
  Group,
  Paper,
  Rating,
  Skeleton,
  Text,
  Title,
} from "@mantine/core";
import {
  IconChevronDown,
  IconChevronUp,
  IconExternalLink,
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

const ratingLabels = {
  1: "Rough class",
  2: "Pretty tough",
  3: "Manageable",
  4: "Good class",
  5: "Would recommend",
};

export default function SyllabusViewerPage() {
  const { collegeId, subject, courseId, syllabusId } = useParams();
  const navigate = useNavigate();

  const [syllabus, setSyllabus] = useState(null);
  const [loading, setLoading] = useState(true);
  const [reviewOpen, setReviewOpen] = useState(false);

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

  const ratingValue = Number(syllabus?.rating || 0);
  const hasRating = ratingValue > 0;
  const hasReview = Boolean(syllabus?.experience_text?.trim());
  const hasStudentIntel = hasRating || hasReview;

  const openPdf = () => {
    if (!syllabus?.pdf_url) return;
    window.open(syllabus.pdf_url, "_blank", "noopener,noreferrer");
  };

  if (loading) {
    return (
      <Box maw={1250} mx="auto" p={{ base: "sm", sm: "xl" }}>
        <Skeleton height={42} width={260} mb="md" />
        <Skeleton height={isMobile ? "82vh" : "80vh"} radius="lg" />
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
    <Box
      maw={1230}
      mx="auto"
      p={{ base: "xs", sm: "xl" }}
      style={{
        minHeight: "100vh",
      }}
    >
      <Paper
        withBorder={!isMobile}
        radius={isMobile ? 0 : "lg"}
        p={{ base: "sm", sm: "md" }}
        mb={{ base: "xs", sm: "md" }}
      >
        <Group justify="space-between" align="center" gap="xs" wrap="nowrap">
          <Box style={{ minWidth: 0 }}>
            <Group gap={6} wrap="nowrap" style={{ minWidth: 0 }}>
              <Text
                component="button"
                type="button"
                onClick={() =>
                  navigate(`/college/${collegeId}/subject/${subject}`)
                }
                style={{
                  border: 0,
                  background: "transparent",
                  padding: 0,
                  color: "#2563eb",
                  fontWeight: 800,
                  fontSize: isMobile ? 14 : 16,
                  cursor: "pointer",
                  whiteSpace: "nowrap",
                }}
              >
                {subject?.toUpperCase()}
              </Text>

              <Text c="dimmed" fw={700}>
                &gt;
              </Text>

              <Text
                size={isMobile ? "sm" : "md"}
                order={isMobile ? 5 : 3}
                lineClamp={1}
              >
                {courseId}
              </Text>

              {hasRating && (
                <Badge
                  color="yellow"
                  variant="light"
                  leftSection={<IconStarFilled size={12} />}
                  style={{ flexShrink: 0 }}
                >
                  {ratingValue}/5
                </Badge>
              )}
            </Group>

            {!isMobile && (
              <Text size="sm" c="dimmed" lineClamp={1}>
                {collegeName}
                {syllabus?.term ? ` • ${syllabus.term}` : ""}
                {syllabus?.year ? ` ${syllabus.year}` : ""}
                {syllabus?.professor ? ` • ${syllabus.professor}` : ""}
              </Text>
            )}
          </Box>

          {syllabus?.pdf_url && (
            <Button
              leftSection={<IconExternalLink size={15} />}
              variant={isMobile ? "filled" : "light"}
              size={isMobile ? "xs" : "sm"}
              onClick={openPdf}
              style={{ flexShrink: 0 }}
            >
              PDF
            </Button>
          )}
        </Group>
      </Paper>

      {isMobile && (
        <Box mb="xs" px="xs">
          <Text size="xs" c="dimmed" lineClamp={1}>
            {collegeName}
            {syllabus?.term ? ` • ${syllabus.term}` : ""}
            {syllabus?.year ? ` ${syllabus.year}` : ""}
            {syllabus?.professor ? ` • ${syllabus.professor}` : ""}
          </Text>
        </Box>
      )}

      {hasStudentIntel && (
        <Paper
          withBorder
          radius="md"
          p={isMobile ? "xs" : "md"}
          mb={isMobile ? "xs" : "md"}
          style={{
            background: "#fffef7",
            borderColor: "#fde68a",
          }}
        >
          <Group justify="space-between" wrap="nowrap">
            <Group gap="xs" style={{ minWidth: 0 }}>
              <IconStarFilled size={16} color="#d97706" />

              <Box style={{ minWidth: 0 }}>
                <Text fw={700} size={isMobile ? "sm" : "md"} lineClamp={1}>
                  Student Review
                </Text>

                {hasRating && (
                  <Text size="xs" c="dimmed" lineClamp={1}>
                    {ratingValue}/5 · {ratingLabels[ratingValue]}
                  </Text>
                )}
              </Box>
            </Group>

            <Button
              variant="subtle"
              size="xs"
              color="yellow"
              rightSection={
                reviewOpen ? (
                  <IconChevronUp size={14} />
                ) : (
                  <IconChevronDown size={14} />
                )
              }
              onClick={() => setReviewOpen((prev) => !prev)}
            >
              {reviewOpen ? "Hide" : "Show"}
            </Button>
          </Group>

          <Collapse in={reviewOpen}>
            <Box mt="sm">
              {hasRating && (
                <Group gap="xs" mb={hasReview ? "sm" : 0}>
                  <Rating value={ratingValue} readOnly size="sm" />
                  <Text size="sm" fw={700}>
                    {ratingLabels[ratingValue]}
                  </Text>
                </Group>
              )}

              {hasReview && (
                <Text
                  size="sm"
                  c="dark"
                  style={{
                    whiteSpace: "pre-line",
                    lineHeight: 1.65,
                  }}
                >
                  {syllabus.experience_text}
                </Text>
              )}
            </Box>
          </Collapse>
        </Paper>
      )}

      {!syllabus?.pdf_url ? (
        <Alert icon={<IconInfoCircle size={18} />} color="orange" radius="md">
          This syllabus does not have a PDF URL.
        </Alert>
      ) : (
        <Box
          style={{
            height: isMobile ? "calc(100vh - 140px)" : "82vh",
            border: isMobile ? "none" : "1px solid #e5e7eb",
            borderRadius: isMobile ? 0 : 14,
            overflow: "hidden",
            background: "#fff",
            boxShadow: isMobile ? "none" : "0 8px 24px rgba(15, 23, 42, 0.06)",
          }}
        >
          <iframe
            src={syllabus.pdf_url}
            title={syllabusTitle}
            style={{
              width: "100%",
              height: "100%",
              border: 0,
              display: "block",
            }}
          />
        </Box>
      )}
    </Box>
  );
}
