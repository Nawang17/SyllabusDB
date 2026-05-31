import { useEffect, useMemo, useState } from "react";
import {
  collectionGroup,
  getDocs,
  query as fbQuery,
  where,
  doc,
  getDoc,
  updateDoc,
  serverTimestamp,
} from "firebase/firestore";
import { getAuth, onAuthStateChanged } from "firebase/auth";
import {
  Container,
  Title,
  Card,
  Text,
  Badge,
  Group,
  Stack,
  Chip,
  Button,
  Skeleton,
  TextInput,
  Textarea,
  Modal,
  Paper,
  Divider,
  Rating,
} from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";
import { notifications } from "@mantine/notifications";
import { db } from "../../../../firebaseConfig";
import { useNavigate } from "react-router";
import {
  IconX,
  IconPencil,
  IconCheck,
  IconTrash,
  IconStarFilled,
} from "@tabler/icons-react";

function toTitleCaseCollege(slug) {
  if (!slug) return "Unknown College";
  return slug.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

function dt(s) {
  return s?.toDate ? s.toDate() : new Date(0);
}

function fmtDate(d) {
  try {
    return d?.toLocaleString?.() ?? "";
  } catch {
    return "";
  }
}

const ratingLabels = {
  0: "No rating",
  1: "Rough class",
  2: "Pretty tough",
  3: "Manageable",
  4: "Good class",
  5: "Would recommend",
};

export default function MyUploadsPage() {
  const [authResolved, setAuthResolved] = useState(false);
  const [authUser, setAuthUser] = useState(null);

  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);

  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [termFilter, setTermFilter] = useState(null);
  const [yearFilter, setYearFilter] = useState(null);
  const [collegeFilter, setCollegeFilter] = useState(null);
  const [sortBy, setSortBy] = useState("newest");

  const navigate = useNavigate();
  const auth = getAuth();

  const [expModalOpened, { open: openExpModal, close: closeExpModal }] =
    useDisclosure(false);
  const [expDraft, setExpDraft] = useState("");
  const [ratingDraft, setRatingDraft] = useState(0);
  const [expSaving, setExpSaving] = useState(false);
  const [activeRow, setActiveRow] = useState(null);

  const EXP_MAX = 500;
  const EXP_MIN = 8;

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => {
      setAuthUser(u && !u.isAnonymous ? u : null);
      setAuthResolved(true);
    });

    return unsub;
  }, [auth]);

  useEffect(() => {
    if (!authResolved) return;

    if (!authUser) {
      setRows([]);
      setLoading(false);
      return;
    }

    const fetchUploadsWithCourseInfo = async () => {
      try {
        setLoading(true);

        const q = fbQuery(
          collectionGroup(db, "syllabi"),
          where("owner", "==", authUser.uid),
        );

        const snapshot = await getDocs(q);

        const enriched = await Promise.all(
          snapshot.docs.map(async (docSnap) => {
            const syllabus = docSnap.data();
            const pathSegments = docSnap.ref.path.split("/");
            const collegeId = pathSegments[1];
            const courseId = decodeURIComponent(pathSegments[3]);

            let courseData = {
              title: "Unknown Course",
              code: courseId,
            };

            try {
              const courseRef = doc(
                db,
                "colleges",
                collegeId,
                "courses",
                courseId,
              );

              const courseSnap = await getDoc(courseRef);

              if (courseSnap.exists()) {
                courseData = courseSnap.data();
              }
            } catch (e) {
              console.warn("Failed to fetch course for", courseId, e);
            }

            return {
              id: docSnap.id,
              ref: docSnap.ref,
              syllabus,
              course: {
                ...courseData,
                collegeId,
                code: courseId,
              },
            };
          }),
        );

        enriched.sort(
          (a, b) => dt(b.syllabus.createdAt) - dt(a.syllabus.createdAt),
        );

        setRows(enriched);
      } catch (err) {
        console.error("Error fetching syllabi:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchUploadsWithCourseInfo();
  }, [authResolved, authUser]);

  const [debouncedQuery, setDebouncedQuery] = useState(searchQuery);

  useEffect(() => {
    const t = setTimeout(
      () => setDebouncedQuery(searchQuery.trim().toLowerCase()),
      200,
    );

    return () => clearTimeout(t);
  }, [searchQuery]);

  const filtered = useMemo(() => {
    let out = rows.filter(({ syllabus, course }) => {
      const q = debouncedQuery;

      if (q) {
        const hay = `${course?.title ?? ""} ${course?.code ?? ""} ${
          syllabus?.professor ?? ""
        }`.toLowerCase();

        if (!hay.includes(q)) return false;
      }

      if (termFilter && String(syllabus?.term) !== termFilter) return false;
      if (yearFilter && String(syllabus?.year) !== yearFilter) return false;

      if (statusFilter === "approved" && !syllabus?.approved) return false;
      if (statusFilter === "pending" && syllabus?.approved) return false;

      if (collegeFilter) {
        const nice = toTitleCaseCollege(course?.collegeId);
        if (nice !== collegeFilter) return false;
      }

      return true;
    });

    if (sortBy === "newest") {
      out = out
        .slice()
        .sort((a, b) => dt(b.syllabus.createdAt) - dt(a.syllabus.createdAt));
    } else if (sortBy === "oldest") {
      out = out
        .slice()
        .sort((a, b) => dt(a.syllabus.createdAt) - dt(b.syllabus.createdAt));
    } else if (sortBy === "az") {
      out = out
        .slice()
        .sort((a, b) =>
          `${a.course?.code ?? ""} ${a.course?.title ?? ""}`
            .toLowerCase()
            .localeCompare(
              `${b.course?.code ?? ""} ${b.course?.title ?? ""}`.toLowerCase(),
            ),
        );
    }

    return out;
  }, [
    rows,
    debouncedQuery,
    termFilter,
    yearFilter,
    statusFilter,
    collegeFilter,
    sortBy,
  ]);

  const clearAll = () => {
    setSearchQuery("");
    setTermFilter(null);
    setYearFilter(null);
    setStatusFilter("all");
    setCollegeFilter(null);
    setSortBy("newest");
  };

  const resetReviewModal = () => {
    closeExpModal();
    setActiveRow(null);
    setExpDraft("");
    setRatingDraft(0);
  };

  const openExperienceModal = (row) => {
    setActiveRow(row);
    setExpDraft(row?.syllabus?.experience_text ?? "");
    setRatingDraft(Number(row?.syllabus?.rating || 0));
    openExpModal();
  };

  const saveExperience = async () => {
    if (!activeRow) return;

    const trimmed = expDraft.trim();

    if (trimmed.length && trimmed.length < EXP_MIN) {
      notifications.show({
        color: "orange",
        title: "Too short",
        message: `Please add at least ${EXP_MIN} characters.`,
      });
      return;
    }

    if (trimmed.length > EXP_MAX) {
      notifications.show({
        color: "orange",
        title: "Too long",
        message: `Keep it under ${EXP_MAX} characters.`,
      });
      return;
    }

    try {
      setExpSaving(true);

      await updateDoc(activeRow.ref, {
        experience_text: trimmed || null,
        rating: ratingDraft || null,
        experience_updatedAt: serverTimestamp(),
      });

      setRows((prev) =>
        prev.map((r) =>
          r.id === activeRow.id
            ? {
                ...r,
                syllabus: {
                  ...r.syllabus,
                  experience_text: trimmed || null,
                  rating: ratingDraft || null,
                  experience_updatedAt: {
                    toDate: () => new Date(),
                  },
                },
              }
            : r,
        ),
      );

      notifications.show({
        icon: <IconCheck size={16} />,
        title: "Review saved",
        message:
          trimmed || ratingDraft
            ? "Your rating and experience were saved."
            : "Your review was cleared.",
      });

      resetReviewModal();
    } catch (e) {
      console.error(e);

      notifications.show({
        color: "red",
        title: "Failed to save",
        message: "Could not update your review. Please try again.",
      });
    } finally {
      setExpSaving(false);
    }
  };

  const deleteExperience = async () => {
    if (!activeRow) return;

    try {
      setExpSaving(true);

      await updateDoc(activeRow.ref, {
        experience_text: null,
        rating: null,
        experience_updatedAt: serverTimestamp(),
      });

      setRows((prev) =>
        prev.map((r) =>
          r.id === activeRow.id
            ? {
                ...r,
                syllabus: {
                  ...r.syllabus,
                  experience_text: null,
                  rating: null,
                  experience_updatedAt: {
                    toDate: () => new Date(),
                  },
                },
              }
            : r,
        ),
      );

      notifications.show({
        icon: <IconTrash size={16} />,
        title: "Review removed",
        message: "Your rating and experience were deleted.",
      });

      resetReviewModal();
    } catch (e) {
      console.error(e);

      notifications.show({
        color: "red",
        title: "Failed to delete",
        message: "Could not delete your review. Please try again.",
      });
    } finally {
      setExpSaving(false);
    }
  };

  if (!authResolved || loading) {
    return (
      <Container size="1200px" py="xl" px="2rem">
        <Title order={2} mb="xs">
          My Uploaded Syllabi
        </Title>

        <Stack>
          {[...Array(4)].map((_, i) => (
            <Card key={i} withBorder radius="md">
              <Skeleton height={16} width="60%" mb="xs" />
              <Skeleton height={12} width="40%" mb="sm" />
              <Skeleton height={12} width="30%" mb="sm" />
              <Skeleton height={10} width="25%" />
            </Card>
          ))}
        </Stack>
      </Container>
    );
  }

  if (!authUser) {
    return (
      <Container size="1200px" py="xl" px="2rem">
        <Card shadow="sm" radius="md" withBorder p="lg">
          <Title order={3} mb="sm">
            You’re not signed in
          </Title>

          <Text mb="md" c="dimmed">
            Please sign in to view your uploads.
          </Text>

          <Button onClick={() => navigate("/")} variant="light">
            Go to Home Page
          </Button>
        </Card>
      </Container>
    );
  }

  return (
    <Container size="1200px" py="xl" px="2rem">
      <Group justify="space-between" align="end" mb="xs">
        <div>
          <Title order={2}>My Uploaded Syllabi</Title>

          <Text size="sm" c="dimmed">
            Showing {filtered.length} of {rows.length} upload
            {rows.length !== 1 ? "s" : ""}
          </Text>
        </div>
      </Group>

      <Card withBorder radius="md" mb="md" p="md">
        <Stack gap="sm">
          <TextInput
            label="Search"
            placeholder="Search by course, code, or professor"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.currentTarget.value)}
          />

          <Group justify="space-between" wrap="wrap">
            <Chip.Group
              multiple={false}
              value={statusFilter}
              onChange={setStatusFilter}
            >
              <Chip value="all">All</Chip>
              <Chip value="approved">Approved</Chip>
              <Chip value="pending">Pending</Chip>
            </Chip.Group>
          </Group>
        </Stack>
      </Card>

      {filtered.length === 0 ? (
        <Card withBorder radius="md" p="lg" style={{ textAlign: "center" }}>
          <Text fw={600} mb={4}>
            No results
          </Text>

          <Text size="sm" c="dimmed" mb="md">
            Try adjusting your search or filters.
          </Text>

          <Button
            variant="subtle"
            leftSection={<IconX size={16} />}
            onClick={clearAll}
          >
            Clear all filters
          </Button>
        </Card>
      ) : (
        <Stack gap="md">
          {filtered.map((row) => {
            const { id, syllabus, course } = row;
            const approved = Boolean(syllabus?.approved);
            const ratingValue = Number(syllabus?.rating || 0);
            const hasRating = ratingValue > 0;

            const createdAt = syllabus?.createdAt?.toDate?.()
              ? syllabus.createdAt.toDate()
              : null;

            const updatedAt = syllabus?.experience_updatedAt?.toDate?.()
              ? syllabus.experience_updatedAt.toDate()
              : null;

            return (
              <Card key={id} shadow="sm" radius="md" withBorder>
                <Group justify="space-between" mb="xs" align="start">
                  <div>
                    <Text fw={600} size="md">
                      {course?.code} {course?.title ? `- ${course.title}` : ""}
                    </Text>

                    <Text size="sm" c="dimmed">
                      {syllabus?.term || "Unknown Term"} {syllabus?.year ?? ""}{" "}
                      • {toTitleCaseCollege(course?.collegeId)}
                    </Text>
                  </div>

                  <Badge color={approved ? "green" : "yellow"} variant="light">
                    {approved ? "Approved" : "Pending"}
                  </Badge>
                </Group>

                <Group justify="space-between" wrap="wrap" mb="xs">
                  <Text size="sm">
                    Professor: {syllabus?.professor || "N/A"}
                  </Text>

                  {createdAt && (
                    <Text size="sm" c="dimmed">
                      Uploaded: {fmtDate(createdAt)}
                    </Text>
                  )}
                </Group>

                {hasRating && (
                  <Group gap={6} mb="xs">
                    <IconStarFilled size={16} color="#d97706" />

                    <Text size="sm" fw={700}>
                      {ratingValue}/5
                    </Text>

                    <Text size="sm" c="dimmed">
                      {ratingLabels[ratingValue]}
                    </Text>
                  </Group>
                )}

                <Divider my="xs" />

                <Group gap="xs" align="flex-start">
                  <Button
                    color="indigo"
                    variant="light"
                    size="xs"
                    leftSection={<IconPencil size={16} />}
                    onClick={() => openExperienceModal(row)}
                  >
                    {syllabus?.experience_text || syllabus?.rating
                      ? "Edit review"
                      : "Add review"}
                  </Button>

                  {syllabus?.pdf_url && (
                    <Button
                      component="a"
                      href={syllabus.pdf_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      variant="subtle"
                      size="xs"
                    >
                      View PDF
                    </Button>
                  )}
                </Group>

                {syllabus?.experience_text && (
                  <Paper withBorder p="sm" radius="md" mt="sm">
                    <Text size="sm" style={{ whiteSpace: "pre-wrap" }}>
                      {syllabus.experience_text}
                    </Text>

                    <Text size="xs" c="dimmed" mt="xs">
                      {updatedAt ? `Last updated: ${fmtDate(updatedAt)}` : ""}
                    </Text>
                  </Paper>
                )}
              </Card>
            );
          })}
        </Stack>
      )}

      <Modal
        opened={expModalOpened}
        onClose={resetReviewModal}
        title="Edit review"
        centered
        radius="md"
      >
        <Stack>
          <div>
            <Text size="sm" fw={700} mb={6}>
              Rating
            </Text>

            <Group gap="sm">
              <Rating value={ratingDraft} onChange={setRatingDraft} size="lg" />

              <Text size="sm" c="dimmed">
                {ratingLabels[ratingDraft]}
              </Text>
            </Group>
          </div>

          <Textarea
            autosize
            minRows={4}
            maxRows={8}
            placeholder="Grading style, workload, exam/essay balance, tips..."
            value={expDraft}
            onChange={(e) => setExpDraft(e.currentTarget.value)}
            maxLength={EXP_MAX}
            description={`${expDraft.trim().length}/${EXP_MAX} characters`}
          />

          <Group justify="space-between" mt="xs">
            <Button
              variant="default"
              leftSection={<IconX size={16} />}
              onClick={resetReviewModal}
            >
              Cancel
            </Button>

            <Group>
              <Button
                color="red"
                variant="light"
                leftSection={<IconTrash size={16} />}
                loading={expSaving}
                onClick={deleteExperience}
                disabled={!activeRow?.syllabus}
              >
                Delete
              </Button>

              <Button
                leftSection={<IconCheck size={16} />}
                loading={expSaving}
                onClick={saveExperience}
                disabled={
                  expDraft.trim() ===
                    (activeRow?.syllabus?.experience_text ?? "").trim() &&
                  ratingDraft === Number(activeRow?.syllabus?.rating || 0)
                }
              >
                Save
              </Button>
            </Group>
          </Group>
        </Stack>
      </Modal>
    </Container>
  );
}
