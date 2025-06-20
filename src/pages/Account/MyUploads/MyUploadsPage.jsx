import { useEffect, useState } from "react";
import {
  collectionGroup,
  getDocs,
  query,
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
} from "@mantine/core";
import { db } from "../../../../firebaseConfig";
import { TextInput } from "@mantine/core";
import { useNavigate } from "react-router";

export default function MyUploadsPage() {
  const [syllabiWithCourses, setSyllabiWithCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const navigate = useNavigate();
  useEffect(() => {
    const fetchUploadsWithCourseInfo = async () => {
      const auth = getAuth();
      const user = auth.currentUser;

      // Redirect if not signed in or anonymous
      if (!user || user.isAnonymous) {
        navigate("/"); // Change this to your login page route
        return;
      }

      try {
        const q = query(
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
              if (courseSnap.exists()) {
                courseData = courseSnap.data();
              }
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

        enriched.sort((a, b) => {
          const dateA = a.syllabus.createdAt?.toDate?.() || new Date(0);
          const dateB = b.syllabus.createdAt?.toDate?.() || new Date(0);
          return dateB - dateA;
        });

        setSyllabiWithCourses(enriched);
      } catch (err) {
        console.error("Error fetching syllabi:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchUploadsWithCourseInfo();
  }, [navigate]);

  return (
    <Container size="lg" py="xl">
      <Title order={2} mb="md">
        My Uploaded Syllabi
      </Title>
      <Text size="sm" mb="xs" c="dimmed">
        Showing {syllabiWithCourses.length} upload
        {syllabiWithCourses.length !== 1 ? "s" : ""}
      </Text>

      <TextInput
        placeholder="Search by course, code, or professor"
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.currentTarget.value)}
        mb="md"
      />

      {loading ? (
        <Loader style={{ margin: "auto", display: "block" }} />
      ) : syllabiWithCourses.length === 0 ? (
        <Text>No syllabi uploaded yet.</Text>
      ) : (
        <Stack spacing="md">
          {syllabiWithCourses
            .filter(({ syllabus, course }) => {
              const query = searchQuery.toLowerCase();
              return (
                course.title?.toLowerCase().includes(query) ||
                course.code?.toLowerCase().includes(query) ||
                syllabus.professor?.toLowerCase().includes(query)
              );
            })
            .map(({ id, syllabus, course }) => (
              <Card key={id} shadow="sm" radius="md" withBorder>
                <Group position="apart" mb="xs">
                  <Text weight={500}>
                    {course.code} - {course.title}
                  </Text>
                  <Badge
                    color={syllabus.approved ? "green" : "yellow"}
                    variant="light"
                  >
                    {syllabus.approved ? "Approved" : "Pending"}
                  </Badge>
                </Group>
                <Text size="sm" c="dimmed">
                  {syllabus.term || "Unknown Term"} {syllabus.year} -{" "}
                  {course.collegeId
                    .replace(/-/g, " ")
                    .replace(/\b\w/g, (char) => char.toUpperCase())}
                </Text>
                <Text size="sm" mt="xs">
                  Professor: {syllabus.professor || "N/A"}
                </Text>

                {syllabus.createdAt?.toDate && (
                  <Text size="sm" c="dimmed">
                    Uploaded: {syllabus.createdAt.toDate().toLocaleString()}
                  </Text>
                )}

                {syllabus.pdf_url && (
                  <a
                    href={syllabus.pdf_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{ display: "inline-block", marginTop: 6 }}
                  >
                    View PDF
                  </a>
                )}
              </Card>
            ))}
        </Stack>
      )}
    </Container>
  );
}
