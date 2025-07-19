import { Box, Button, Group, Modal, Menu, Burger, Text } from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";
import { useNavigate } from "react-router";
import { useEffect, useState } from "react";
import {
  getAuth,
  onAuthStateChanged,
  GoogleAuthProvider,
  signInWithPopup,
} from "firebase/auth";
import {
  IconPhoto,
  IconUpload,
  IconSettings,
  IconLogout,
  IconHome,
  IconLock,
  IconSparkles,
} from "@tabler/icons-react";
import confetti from "canvas-confetti";
import classes from "./styles/Header.module.css";
import { notifications } from "@mantine/notifications";
import { doc, getDoc, getFirestore, setDoc } from "firebase/firestore";

export default function Header() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [signInError, setSignInError] = useState("");
  const [showNewUserModal, setShowNewUserModal] = useState(false);

  const [modalOpened, { open: openModal, close: closeModal }] =
    useDisclosure(false);

  useEffect(() => {
    const auth = getAuth();
    const unsubscribe = onAuthStateChanged(auth, (u) => {
      if (u) {
        setUser(u);
        setIsAnonymous(u.isAnonymous);
        setIsAdmin(u.email === "nawangsherpa1010@gmail.com");
      } else {
        setUser(null);
        setIsAnonymous(false);
        setIsAdmin(false);
      }
    });
    return () => unsubscribe();
  }, []);

  const handleGoogleLink = async () => {
    const auth = getAuth();
    const db = getFirestore();
    const provider = new GoogleAuthProvider();

    try {
      const result = await signInWithPopup(auth, provider);
      const user = result.user;
      setIsAnonymous(false);
      setUser(user);

      // Check if user doc already exists
      const userRef = doc(db, "users", user.uid);
      const userSnap = await getDoc(userRef);

      if (!userSnap.exists()) {
        // Only create if it doesn't exist
        await setDoc(userRef, {
          email: user.email,
          full_name: user.displayName || "",
          profile_image: user.photoURL || "",
          createdAt: new Date(),
        });
        confetti({
          particleCount: 300,
          spread: 70,
          origin: { y: 0.6 },
        });
        // Show modal for email notifications
        setShowNewUserModal(true);
      } else {
        notifications.show({
          title: "Signed In Successfully",
          message: "Welcome back to SyllabusDB!",
          color: "green",
          icon: <IconSparkles size={16} />,
        });
      }
      navigate("/");
      setSignInError("");
      closeModal();
    } catch (error) {
      console.error(error);
      setSignInError("Something went wrong. Please try again.");
    }
  };

  return (
    <Box className={classes.header}>
      <div className={classes["header-inner"]}>
        <div
          className={classes.logo}
          onClick={() => navigate("/")}
          style={{ cursor: "pointer" }}
        >
          <Text
            fw={800}
            size="xl"
            style={{
              fontFamily: "Inter, Roboto, sans-serif",
              letterSpacing: -0.5,
            }}
          >
            Syllabus<span style={{ color: "#1E88E5" }}>DB</span>
          </Text>
        </div>

        <Group className={classes.rightSide}>
          <Button
            variant="default"
            onClick={() => navigate("/uploadsyllabus")}
            visibleFrom="sm"
          >
            Upload Syllabus
          </Button>

          {isAdmin && (
            <Button
              variant="outline"
              onClick={() => navigate("/admin")}
              visibleFrom="sm"
            >
              Admin
            </Button>
          )}

          {/* Unified Menu (desktop + mobile) */}
          {(!user || isAnonymous) && (
            <Button onClick={openModal} variant="subtle" visibleFrom="sm">
              Sign In
            </Button>
          )}
          <Menu shadow="md" width={220} position="bottom-end" withinPortal>
            <Menu.Target>
              <div>
                {user && !isAnonymous && (
                  <Button visibleFrom="sm" variant="subtle">
                    My Account
                  </Button>
                )}
                <Burger hiddenFrom="sm" />
              </div>
            </Menu.Target>

            <Menu.Dropdown>
              <Menu.Item
                leftSection={<IconHome size={16} />}
                onClick={() => navigate("/")}
              >
                Home
              </Menu.Item>

              <Menu.Divider />
              <Menu.Item
                leftSection={<IconUpload size={16} />}
                onClick={() => navigate("/uploadsyllabus")}
              >
                Upload Syllabus
              </Menu.Item>

              {user && !isAnonymous && (
                <>
                  <Menu.Divider />
                  <Menu.Item
                    onClick={() => navigate("/myuploads")}
                    leftSection={<IconPhoto size={16} />}
                  >
                    My Uploads
                  </Menu.Item>

                  <Menu.Item
                    onClick={() => navigate("/settings")}
                    leftSection={<IconSettings size={16} />}
                  >
                    Settings
                  </Menu.Item>
                </>
              )}
              <Menu.Divider />

              {user && !isAnonymous && (
                <Menu.Item
                  color="red"
                  onClick={async () => {
                    const auth = getAuth();
                    await auth.signOut();
                    navigate("/");
                    notifications.show({
                      title: "Signed Out",
                      message: "You have been signed out successfully.",
                      color: "green",
                    });
                  }}
                  leftSection={<IconLogout size={16} />}
                >
                  Sign Out
                </Menu.Item>
              )}
              {(!user || isAnonymous) && (
                <Menu.Item
                  color="blue"
                  leftSection={<IconLock size={16} />}
                  onClick={openModal}
                >
                  Sign In
                </Menu.Item>
              )}

              {isAdmin && (
                <Menu.Item onClick={() => navigate("/admin")}>Admin</Menu.Item>
              )}
            </Menu.Dropdown>
          </Menu>
        </Group>
      </div>

      {/* Sign-in modal */}
      <Modal
        opened={modalOpened}
        onClose={() => {
          closeModal();
          setSignInError("");
        }}
        title="Sign In"
        radius="md"
        size="md"
      >
        <Text mb="md" size="sm">
          <strong>Note:</strong> You don’t need to sign in to upload a syllabus.
          However, signing in allows you to{" "}
          <strong>track and manage your uploads</strong> easily.
        </Text>

        {signInError && (
          <Box
            mb="sm"
            p="sm"
            style={{
              backgroundColor: "#ffe0e0",
              color: "#b00020",
              borderRadius: 6,
              fontSize: 13,
              textAlign: "center",
            }}
          >
            {signInError}
          </Box>
        )}

        <Button
          fullWidth
          variant="default"
          radius="md"
          onClick={handleGoogleLink}
          leftSection={
            <img
              src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg"
              alt="Google Logo"
              style={{ width: 18, height: 18 }}
            />
          }
        >
          Sign in with Google
        </Button>
      </Modal>
      {showNewUserModal && (
        <Modal
          opened
          onClose={() => setShowNewUserModal(false)}
          centered
          radius="md"
          padding="lg"
          withCloseButton={false}
        >
          <div style={{ textAlign: "center" }}>
            <h2 style={{ marginBottom: "1rem", fontSize: "1.5rem" }}>
              🎓 Welcome to SyllabusDB
            </h2>

            <p style={{ marginBottom: "1rem" }}>
              Want to get email updates when your syllabus or college request is
              approved?
            </p>

            <p
              style={{
                fontSize: "0.9rem",
                color: "#666",
                marginBottom: "1.5rem",
              }}
            >
              You can change this anytime in Settings.
            </p>

            <div
              style={{ display: "flex", justifyContent: "center", gap: "1rem" }}
            >
              <Button
                onClick={async () => {
                  const db = getFirestore();
                  const auth = getAuth();
                  const userRef = doc(db, "users", auth.currentUser.uid);
                  await setDoc(
                    userRef,
                    { wantsEmailNotifications: true },
                    { merge: true }
                  );
                  setShowNewUserModal(false);
                }}
              >
                Yes
              </Button>
              <Button
                variant="default"
                onClick={() => setShowNewUserModal(false)}
              >
                No
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </Box>
  );
}
