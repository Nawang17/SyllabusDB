import { useEffect, useMemo, useState } from "react";
import {
  collectionGroup,
  getDocs,
  query as fbQuery,
  where,
  doc,
  getDoc,
} from "firebase/firestore";
import { getAuth } from "firebase/auth";
import {
  Container,
  Title,
  Card,
  Text,
  Badge,
  Loader,
  Group,
  Stack,
  Select,
  SegmentedControl,
  Chip,
  Button,
  Tooltip,
  Skeleton,
  TextInput,
} from "@mantine/core";
import { db } from "../../../../firebaseConfig";
import { useNavigate } from "react-router";
import { IconRefresh, IconX } from "@tabler/icons-react";

function toTitleCaseCollege(slug) {
  if (!slug) return "Unknown College";
  return slug.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

function dt(s) {
  return s?.toDate ? s.toDate() : new Date(0);
}

export default function MyUploadsPage() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);

  const [searchQuery, setSearchQuery] = useState("");
  const [termFilter, setTermFilter] = useState(null);
  const [yearFilter, setYearFilter] = useState(null);
  const [statusFilter, setStatusFilter] = useState("all"); // all | approved | pending
  const [collegeFilter, setCollegeFilter] = useState(null);
  const [sortBy, setSortBy] = useState("newest"); // newest | oldest | az

  const navigate = useNavigate();

  useEffect(() => {
    const fetchUploadsWithCourseInfo = async () => {
      const auth = getAuth();
      const user = auth.currentUser;

      if (!user || user.isAnonymous) {
        navigate("/");
        return;
      }

      try {
        setLoading(true);
        const q = fbQuery(
          collectionGroup(db, "syllabi"),
          where("owner", "==", user.uid)
        );
        const snapshot = await getDocs(q);

        const enriched = await Promise.all(
          snapshot.docs.map(async (docSnap) => {
            const syllabus = docSnap.data();
            const pathSegments = docSnap.ref.path.split("/");
            const collegeId = pathSegments[1];
            const courseId = decodeURIComponent(pathSegments[3]);

            let courseData = { title: "Unknown Course", code: courseId };
            try {
              const courseRef = doc(
                db,
                "colleges",
                collegeId,
                "courses",
                courseId
              );
              const courseSnap = await getDoc(courseRef);
              if (courseSnap.exists()) courseData = courseSnap.data();
            } catch (e) {
              console.warn("Failed to fetch course for", courseId, e);
            }

            return {
              id: docSnap.id,
              syllabus,
              course: { ...courseData, collegeId },
            };
          })
        );

        enriched.sort(
          (a, b) => dt(b.syllabus.createdAt) - dt(a.syllabus.createdAt)
        );
        setRows(enriched);
      } catch (err) {
        console.error("Error fetching syllabi:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchUploadsWithCourseInfo();
  }, [navigate]);

  // derived filter options
  const { termOptions, yearOptions, collegeOptions } = useMemo(() => {
    const terms = new Set();
    const years = new Set();
    const colleges = new Set();
    rows.forEach(({ syllabus, course }) => {
      if (syllabus?.term) terms.add(String(syllabus.term));
      if (syllabus?.year) years.add(String(syllabus.year));
      if (course?.collegeId) colleges.add(toTitleCaseCollege(course.collegeId));
    });

    const makeOpts = (arr) => arr.map((v) => ({ value: v, label: v }));

    return {
      termOptions: makeOpts([...terms].sort((a, b) => a.localeCompare(b))),
      // years descending makes sense for quick picking
      yearOptions: makeOpts([...years].sort((a, b) => Number(b) - Number(a))),
      collegeOptions: makeOpts(
        [...colleges].sort((a, b) => a.localeCompare(b))
      ),
    };
  }, [rows]);

  // debounce search
  const [debouncedQuery, setDebouncedQuery] = useState(searchQuery);
  useEffect(() => {
    const t = setTimeout(
      () => setDebouncedQuery(searchQuery.trim().toLowerCase()),
      200
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
              `${b.course?.code ?? ""} ${b.course?.title ?? ""}`.toLowerCase()
            )
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

        <Group gap="xs">
          <Tooltip label="Reset filters" withArrow>
            <Button
              variant="light"
              leftSection={<IconRefresh size={16} />}
              onClick={clearAll}
            >
              Reset
            </Button>
          </Tooltip>
        </Group>
      </Group>

      {/* Controls */}
      <Card withBorder radius="md" mb="md" p="md">
        <Stack gap="sm">
          <TextInput
            style={{
              width: "100%",
            }}
            label="Search"
            placeholder="Search by course, code, or professor"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.currentTarget.value)}
          />
          <Group grow wrap="wrap">
            <Select
              style={{
                width: "100%",
              }}
              label="Term"
              placeholder="All"
              data={termOptions}
              clearable
              value={termFilter}
              onChange={setTermFilter}
            />
            <Select
              style={{
                width: "100%",
              }}
              label="Year"
              placeholder="All"
              data={yearOptions}
              clearable
              value={yearFilter}
              onChange={setYearFilter}
            />
            <Select
              style={{
                width: "100%",
              }}
              label="College"
              placeholder="All"
              data={collegeOptions}
              clearable
              value={collegeFilter}
              onChange={setCollegeFilter}
            />
          </Group>

          <Group justify="space-between" wrap="wrap">
            <Group>
              <Text size="sm" fw={500} style={{ marginRight: 8 }}>
                Status:
              </Text>
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

            <Group>
              <Text size="sm" fw={500} style={{ marginRight: 8 }}>
                Sort:
              </Text>
              <SegmentedControl
                value={sortBy}
                onChange={setSortBy}
                data={[
                  { label: "Newest", value: "newest" },
                  { label: "Oldest", value: "oldest" },
                  { label: "A-Z", value: "az" },
                ]}
              />
            </Group>
          </Group>
        </Stack>
      </Card>

      {/* Content */}
      {loading ? (
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
      ) : filtered.length === 0 ? (
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
          {filtered.map(({ id, syllabus, course }) => {
            const approved = Boolean(syllabus?.approved);
            const createdAt = syllabus?.createdAt?.toDate?.()
              ? syllabus.createdAt.toDate()
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

                <Group justify="space-between" wrap="wrap">
                  <Text size="sm">
                    Professor: {syllabus?.professor || "N/A"}
                  </Text>
                  {createdAt && (
                    <Text size="sm" c="dimmed">
                      Uploaded: {createdAt.toLocaleString()}
                    </Text>
                  )}
                </Group>

                {syllabus?.pdf_url && (
                  <a
                    href={syllabus.pdf_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{ display: "inline-block", marginTop: 8 }}
                  >
                    View PDF
                  </a>
                )}
              </Card>
            );
          })}
        </Stack>
      )}
    </Container>
  );
}
