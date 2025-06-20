import { Box, Button, Group, Modal, Menu, Burger, Text } from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";
import { useNavigate } from "react-router";
import { useEffect, useState } from "react";
import {
  getAuth,
  onAuthStateChanged,
  GoogleAuthProvider,
  signInWithPopup,
  linkWithPopup,
} from "firebase/auth";
import {
  IconPhoto,
  IconUpload,
  IconSettings,
  IconLogout,
  IconHome,
  IconInfoCircle,
} from "@tabler/icons-react";
import classes from "./styles/Header.module.css";
import { notifications } from "@mantine/notifications";

export default function Header() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [signInError, setSignInError] = useState("");

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
    const provider = new GoogleAuthProvider();
    try {
      const currentUser = auth.currentUser;
      if (currentUser?.isAnonymous) {
        await linkWithPopup(currentUser, provider);
        setIsAnonymous(false);
        notifications.show({
          title: "Logged In",
          message: "You are now signed in with your Google account.",
          color: "green",
        });
      } else {
        const result = await signInWithPopup(auth, provider);
        setIsAnonymous(false);
        setUser(result.user);
        notifications.show({
          title: "Logged In",
          message: "You are now signed in with your Google account.",
          color: "green",
        });
      }
      setSignInError("");
      closeModal();
    } catch (error) {
      if (error.code === "auth/credential-already-in-use") {
        setSignInError("This Google account is already linked.");
      } else {
        setSignInError("Something went wrong. Please try again.");
      }
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

              <Menu.Item
                leftSection={<IconUpload size={16} />}
                onClick={() => navigate("/uploadsyllabus")}
              >
                Upload Syllabus
              </Menu.Item>

              {user && !isAnonymous && (
                <>
                  <Menu.Item
                    onClick={() => navigate("/myuploads")}
                    leftSection={<IconPhoto size={16} />}
                  >
                    My Uploads
                  </Menu.Item>
                  <Menu.Divider />
                  {/* <Menu.Item leftSection={<IconSettings size={16} />}>
                    Settings
                  </Menu.Item> */}

                  <Menu.Item
                    leftSection={<IconInfoCircle size={16} />}
                    onClick={() => navigate("/aboutpage")}
                  >
                    About
                  </Menu.Item>
                  <Menu.Divider />
                  <Menu.Item
                    color="red"
                    onClick={async () => {
                      const auth = getAuth();
                      await auth.signOut();
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
                </>
              )}

              {(!user || isAnonymous) && (
                <Menu.Item onClick={openModal}>Sign In</Menu.Item>
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
        title="Sign In (Optional)"
        radius="md"
        size="md"
      >
        <Text mb="md" size="sm">
          <strong>Note:</strong> You don’t need to sign in to upload or view a
          syllabus. However, signing in lets you{" "}
          <strong>track and manage your uploads</strong> more easily.
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
          Continue with Google
        </Button>
      </Modal>
    </Box>
  );
}
