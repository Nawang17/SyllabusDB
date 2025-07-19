import { useEffect, useState } from "react";
import { getAuth } from "firebase/auth";
import { doc, getDoc, setDoc } from "firebase/firestore";
import {
  Container,
  Title,
  Text,
  Loader,
  Switch,
  Card,
  Divider,
} from "@mantine/core";
import { useNavigate } from "react-router";
import { db } from "../../../../../firebaseConfig";

export default function SettingsPage() {
  const [loading, setLoading] = useState(true);
  const [notificationsEnabled, setNotificationsEnabled] = useState(false);
  const [userDocExists, setUserDocExists] = useState(false);
  // Add a new state to manage the disable status of the switch
  const [isSaving, setIsSaving] = useState(false);
  const navigate = useNavigate();
  const auth = getAuth();
  const user = auth.currentUser;

  useEffect(() => {
    if (!user || user.isAnonymous) {
      navigate("/");
      return;
    }

    const fetchSettings = async () => {
      try {
        const userRef = doc(db, "users", user.uid);
        const userSnap = await getDoc(userRef);

        if (userSnap.exists()) {
          setUserDocExists(true);
          setNotificationsEnabled(
            userSnap.data()?.wantsEmailNotifications || false
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
  }, [user, navigate]);

  const handleToggle = async (checked) => {
    // Immediately set the UI state for responsiveness
    setNotificationsEnabled(checked);
    // Disable the switch to prevent further clicks
    setIsSaving(true);
    try {
      const userRef = doc(db, "users", user.uid);
      await setDoc(
        userRef,
        { wantsEmailNotifications: checked },
        { merge: true }
      );
    } catch (e) {
      console.error("Failed to save setting:", e);
      // If saving fails, revert the UI state
      setNotificationsEnabled(!checked);
      // Optionally, show an error message to the user here
    } finally {
      // Re-enable the switch once the operation is complete (success or failure)
      setIsSaving(false);
    }
  };

  return (
    <Container size="1200px" py="xl" px="2rem">
      <Title order={2} mb="md">
        Settings
      </Title>
      <Text size="sm" mb="xs" c="dimmed">
        Manage your notification preferences
      </Text>

      {loading ? (
        <Loader style={{ marginTop: "2rem" }} />
      ) : !userDocExists ? (
        <Card shadow="sm" radius="md" withBorder mt="md" p="lg">
          <Text>
            You don't have a user profile yet. Please resign in to create one.
          </Text>
        </Card>
      ) : (
        <Card shadow="sm" radius="md" withBorder mt="md" p="lg">
          <Switch
            checked={notificationsEnabled}
            onChange={(e) => handleToggle(e.currentTarget.checked)}
            label="Email me when my syllabus or college request is approved or rejected"
            // Disable the switch if data is being saved
            onLabel="Yes"
            offLabel="No"
            disabled={isSaving}
          />

          <Text size="xs" pt="md" c="dimmed">
            You can change this anytime. All emails will be sent from{" "}
            <strong>momosalerts@gmail.com</strong>.
          </Text>

          <Divider my="md" />

          <Text size="xs">Account created</Text>
          <Text size="xs" pt="4px" c="dimmed">
            {user?.metadata?.creationTime
              ? new Date(user.metadata.creationTime).toLocaleString("default", {
                  month: "long",
                  day: "numeric",
                  year: "numeric",
                  hour: "numeric",
                  minute: "numeric",
                })
              : "Unknown"}
          </Text>
        </Card>
      )}
    </Container>
  );
}
