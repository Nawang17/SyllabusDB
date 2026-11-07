import { extractSubject, normalizeCourseCode } from "../../../utils/courseCode.js";
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
  onSnapshot,
} from "firebase/firestore";
import { getAuth, onAuthStateChanged } from "firebase/auth";
import {
  Text,
  Group,
  Stack,
  Button,
  Skeleton,
  Textarea,
  Modal,
  Rating,
} from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";
import { notifications } from "@mantine/notifications";
import { db } from "../../../../firebaseConfig";
import { Link } from "react-router";
import "./MyUploadsPage.css";
import {
  IconX,
  IconPencil,
  IconCheck,
  IconTrash,
  IconThumbUp,
  IconExternalLink,
  IconUpload,
  IconSearch,
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
    return d?.toLocaleDateString?.(undefined, { month: "short", day: "numeric", year: "numeric" }) ?? "";
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

function HelpfulCount({ path }) {
  const [count, setCount] = useState(null);
  const [error, setError] = useState(false);
  useEffect(() => {
    setCount(null);
    setError(false);
    return onSnapshot(doc(db, `${path}/helpfulStats/total`), (snapshot) => {
      setCount(snapshot.exists() ? snapshot.data().count : 0);
    }, (err) => {
      console.error("Could not load helpful count:", err);
      setError(true);
    });
  }, [path]);
  return <span className="mu-helpful"><IconThumbUp size={17} aria-hidden="true" />{error ? "Helpful count unavailable" : count === null ? "Loading helpful count..." : `${count.toLocaleString()} ${count === 1 ? "person" : "people"} found this helpful`}</span>;
}

export default function MyUploadsPage() {
  const [authResolved, setAuthResolved] = useState(false);
  const [authUser, setAuthUser] = useState(null);

  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);

  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [sortBy, setSortBy] = useState("newest");

  const [loadError, setLoadError] = useState("");
  const [retry, setRetry] = useState(0);
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
    document.title = "SyllabusDB | My uploads";
    window.scrollTo(0, 0);
  }, []);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => {
      setRows([]);
      setLoading(!!u && !u.isAnonymous);
      setAuthUser(u && !u.isAnonymous ? u : null);
      setAuthResolved(true);
    });

    return unsub;
  }, [auth]);

  useEffect(() => {
    if (!authResolved) return;
    let active = true;

    if (!authUser) {
      setRows([]);
      setLoading(false);
      return;
    }

    const fetchUploadsWithCourseInfo = async () => {
      try {
        setLoading(true);
        setLoadError("");

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
            const courseId = pathSegments[3];

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
                id: courseId,
                code: courseData.code || courseId,
              },
            };
          }),
        );

        enriched.sort(
          (a, b) => dt(b.syllabus.createdAt) - dt(a.syllabus.createdAt),
        );

        if (active) setRows(enriched);
      } catch (err) {
        console.error("Error fetching syllabi:", err);
        if (active) setLoadError("We couldn't load your uploads. Please try again.");
      } finally {
        if (active) setLoading(false);
      }
    };

    fetchUploadsWithCourseInfo();
    return () => { active = false; };
  }, [authResolved, authUser, retry]);

  const filtered = useMemo(() => {
    let out = rows.filter(({ syllabus, course }) => {
      const q = searchQuery.trim().toLowerCase();

      if (q) {
        const hay = `${toTitleCaseCollege(course?.collegeId)} ${course?.title ?? ""} ${course?.code ?? ""} ${
          syllabus?.professor ?? ""
        }`.toLowerCase();

        if (
          !hay.includes(q) &&
          !normalizeCourseCode(course?.code).includes(normalizeCourseCode(q))
        ) return false;
      }

      if (statusFilter === "approved" && !syllabus?.approved) return false;
      if (statusFilter === "pending" && syllabus?.approved) return false;

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
    searchQuery,
    statusFilter,
    sortBy,
  ]);

  const clearAll = () => {
    setSearchQuery("");
    setStatusFilter("all");
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
    if (!activeRow || expSaving || auth.currentUser?.uid !== activeRow.syllabus.owner) return;

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
          r.ref.path === activeRow.ref.path
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
    if (!activeRow || expSaving || auth.currentUser?.uid !== activeRow.syllabus.owner) return;

    try {
      setExpSaving(true);

      await updateDoc(activeRow.ref, {
        experience_text: null,
        rating: null,
        experience_updatedAt: serverTimestamp(),
      });

      setRows((prev) =>
        prev.map((r) =>
          r.ref.path === activeRow.ref.path
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

  const approvedCount = rows.filter((row) => row.syllabus.approved).length;
  const hasFilters = Boolean(searchQuery.trim()) || statusFilter !== "all";
  const busy = !authResolved || loading;

  return (
    <main className="my-uploads-page">
      <header className="mu-header">
        <div><h1>My uploads</h1><p>Manage your syllabi and see how they help other students.</p></div>
        {authUser && <Link className="mu-primary" to="/uploadsyllabus"><IconUpload size={18} aria-hidden="true" />Upload a syllabus</Link>}
      </header>
      {busy ? (
        <div className="mu-list" role="status" aria-label="Loading uploads">{Array.from({ length: 3 }, (_, index) => <Skeleton key={index} height={180} radius="md" />)}</div>
      ) : !authUser ? (
        <section className="mu-empty"><h2>Sign in to see your uploads</h2><p>Track your submissions, update your reviews, and see how many people found your syllabi helpful.</p><Link className="mu-primary" to="/signin?returnTo=%2Fmyuploads">Sign in</Link></section>
      ) : loadError ? (
        <section className="mu-empty" role="alert"><h2>Uploads unavailable</h2><p>{loadError}</p><button className="mu-primary" onClick={() => setRetry((value) => value + 1)}>Try again</button></section>
      ) : rows.length === 0 ? (
        <section className="mu-empty"><IconUpload size={32} aria-hidden="true" /><h2>Share your first syllabus</h2><p>Your uploads will appear here after submission. Help another student know what to expect.</p><Link className="mu-primary" to="/uploadsyllabus">Upload a syllabus</Link></section>
      ) : (
        <>
          <p className="mu-summary">{rows.length} {rows.length === 1 ? "upload" : "uploads"}<span aria-hidden="true"> · </span>{approvedCount} published<span aria-hidden="true"> · </span>{rows.length - approvedCount} awaiting review</p>
          <div className="mu-toolbar">
            <div className="mu-search"><IconSearch size={19} aria-hidden="true" /><input type="search" placeholder="Search course, college, or professor" aria-label="Search your uploads" value={searchQuery} onChange={(event) => setSearchQuery(event.target.value)} /></div>
            <select aria-label="Filter uploads by status" value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)}><option value="all">All statuses</option><option value="approved">Published</option><option value="pending">Awaiting review</option></select>
            <select aria-label="Sort uploads" value={sortBy} onChange={(event) => setSortBy(event.target.value)}><option value="newest">Newest first</option><option value="oldest">Oldest first</option><option value="az">Course: A to Z</option></select>
          </div>
          {hasFilters && <div className="mu-results" role="status"><span>{filtered.length} of {rows.length} uploads</span><button onClick={clearAll}>Clear filters</button></div>}
          {filtered.length === 0 ? (
            <section className="mu-empty"><h2>No uploads match</h2><p>Try a different search or status.</p><button className="mu-secondary" onClick={clearAll}>Clear filters</button></section>
          ) : <div className="mu-list">{filtered.map((row) => {
            const { syllabus, course } = row;
            const approved = Boolean(syllabus.approved);
            const code = normalizeCourseCode(course.code);
            const viewerPath = `/college/${encodeURIComponent(course.collegeId)}/subject/${encodeURIComponent(extractSubject(course.code))}/course/${encodeURIComponent(course.id)}/syllabus/${encodeURIComponent(row.id)}`;
            const createdAt = syllabus.createdAt?.toDate?.();
            const rating = Number(syllabus.rating || 0);
            const hasReview = Boolean(syllabus.experience_text || rating);
            return <article className="mu-card" key={row.ref.path}>
              <div className="mu-card-header">
                <div className="mu-course"><p className="mu-code">{code}</p><h2>{approved ? <Link to={viewerPath}>{course.title || "Course syllabus"}</Link> : course.title || "Course syllabus"}</h2><p className="mu-college">{toTitleCaseCollege(course.collegeId)}</p></div>
                <span className={`mu-status ${approved ? "is-published" : "is-pending"}`}>{approved ? "Published" : "Awaiting review"}</span>
              </div>
              <div className="mu-meta"><span>{[syllabus.term, syllabus.year].filter(Boolean).join(" ") || "Term not provided"}</span>{syllabus.professor && <span>{syllabus.professor}</span>}{createdAt && <span>Uploaded {fmtDate(createdAt)}</span>}</div>
              {approved ? <HelpfulCount path={row.ref.path} /> : <p className="mu-pending-note">Helpful counts will appear once your syllabus is published.</p>}
              {hasReview && <details className="mu-review"><summary>Your review{rating > 0 ? ` (${rating}/5)` : ""}</summary>{rating > 0 && <p className="mu-rating">{ratingLabels[rating]}</p>}{syllabus.experience_text && <p className="mu-experience">{syllabus.experience_text}</p>}</details>}
              <div className="mu-card-actions">
                <button className="mu-secondary" onClick={() => openExperienceModal(row)}><IconPencil size={16} aria-hidden="true" />{hasReview ? "Edit review" : "Add review"}</button>
                {approved && <Link className="mu-secondary" to={viewerPath}>View syllabus</Link>}
                {syllabus.pdf_url && <a className="mu-pdf" href={syllabus.pdf_url} target="_blank" rel="noopener noreferrer">Open PDF<IconExternalLink size={16} aria-hidden="true" /></a>}
              </div>
            </article>;
          })}</div>}
        </>
      )}
      <Modal
        opened={expModalOpened && !!authUser && activeRow?.syllabus.owner === authUser.uid}
        onClose={() => !expSaving && resetReviewModal()}
        closeOnClickOutside={!expSaving}
        closeOnEscape={!expSaving}
        withCloseButton={!expSaving}
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
              <Rating value={ratingDraft} onChange={setRatingDraft} size="lg" readOnly={expSaving} aria-label="Your class rating" />

              <Text size="sm" c="dimmed">
                {ratingLabels[ratingDraft]}
              </Text>
            </Group>
          </div>

          <Textarea
            label="Your experience"
            disabled={expSaving}
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
              disabled={expSaving}
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
                Remove review
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
    </main>
  );
}
