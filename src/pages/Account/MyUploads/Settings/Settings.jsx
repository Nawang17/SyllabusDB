import { useEffect, useState } from "react";
import { getAuth, onAuthStateChanged } from "firebase/auth";
import { doc, getDoc, setDoc } from "firebase/firestore";
import {
  Container,
  Title,
  Text,
  Loader,
  Switch,
  Card,
  Divider,
  Button,
} from "@mantine/core";
import { useNavigate } from "react-router";
import { db } from "../../../../../firebaseConfig";

export default function SettingsPage() {
  const [authResolved, setAuthResolved] = useState(false);
  const [authUser, setAuthUser] = useState(null);

  const [loading, setLoading] = useState(true);
  const [notificationsEnabled, setNotificationsEnabled] = useState(false);
  const [userDocExists, setUserDocExists] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const navigate = useNavigate();
  const auth = getAuth();

  // 1) Resolve auth state exactly once on mount
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => {
      setAuthUser(u && !u.isAnonymous ? u : null);
      setAuthResolved(true);
    });
    return unsub;
  }, [auth]);

  // 2) After auth is resolved, fetch settings if signed in
  useEffect(() => {
    if (!authResolved) return;

    if (!authUser) {
      // Not signed in; stop loading and show the message
      setLoading(false);
      return;
    }

    const fetchSettings = async () => {
      try {
        const userRef = doc(db, "users", authUser.uid);
        const snap = await getDoc(userRef);

        if (snap.exists()) {
          setUserDocExists(true);
          setNotificationsEnabled(
            snap.data()?.wantsEmailNotifications || false
          );
        } else {
          setUserDocExists(false);
        }
      } catch (e) {
        console.error("Failed to fetch settings:", e);
      } finally {
        setLoading(false);
      }
    };

    fetchSettings();
  }, [authResolved, authUser]);

  const handleToggle = async (checked) => {
    if (!authUser) return;
    setNotificationsEnabled(checked);
    setIsSaving(true);
    try {
      const userRef = doc(db, "users", authUser.uid);
      await setDoc(
        userRef,
        { wantsEmailNotifications: checked },
        { merge: true }
      );
    } catch (e) {
      console.error("Failed to save setting:", e);
      setNotificationsEnabled((prev) => !prev);
    } finally {
      setIsSaving(false);
    }
  };

  // Still resolving initial auth? Show loader.
  if (!authResolved || loading) {
    return (
      <Container size="1200px" py="xl" px="2rem">
        <Loader
          style={{
            marginTop: "2rem",
            margin: "0 auto",
            display: "block",
          }}
        />
      </Container>
    );
  }

  // Auth resolved and no user
  if (!authUser) {
    return (
      <Container size="1200px" py="xl" px="2rem">
        <Card shadow="sm" radius="md" withBorder p="lg">
          <Title order={3} mb="sm">
            You’re not signed in
          </Title>
          <Text mb="md" c="dimmed">
            Please sign in to view and manage your settings.
          </Text>
          <Button onClick={() => navigate("/")} variant="light">
            Go to Home Page
          </Button>
        </Card>
      </Container>
    );
  }

  // Signed in view
  return (
    <Container size="1200px" py="xl" px="2rem">
      <Title order={2} mb="md">
        Settings
      </Title>
      <Text size="sm" mb="xs" c="dimmed">
        Manage your notification preferences
      </Text>

      {!userDocExists ? (
        <Card shadow="sm" radius="md" withBorder mt="md" p="lg">
          <Text>
            You don’t have a user profile yet. Please sign out and sign back in
            to create one.
          </Text>
        </Card>
      ) : (
        <Card shadow="sm" radius="md" withBorder mt="md" p="lg">
          <Switch
            checked={notificationsEnabled}
            onChange={(e) => handleToggle(e.currentTarget.checked)}
            label="Email me when my syllabus or college request is approved or rejected"
            onLabel="Yes"
            offLabel="No"
            disabled={isSaving}
          />
          <Text size="xs" pt="md" c="dimmed">
            You can change this anytime. All emails will be sent from{" "}
            <strong>no-reply@syllabusdb.com</strong>.
          </Text>
          <Divider my="md" />
          <Text size="xs">Account created</Text>
          <Text size="xs" pt="4px" c="dimmed">
            {authUser?.metadata?.creationTime
              ? new Date(authUser.metadata.creationTime).toLocaleString(
                  "default",
                  {
                    month: "long",
                    day: "numeric",
                    year: "numeric",
                    hour: "numeric",
                    minute: "numeric",
                  }
                )
              : "Unknown"}
          </Text>
        </Card>
      )}
    </Container>
  );
}
