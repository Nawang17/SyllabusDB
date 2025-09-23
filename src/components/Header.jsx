// src/components/Header.jsx
import {
  Box,
  Button,
  Group,
  Modal,
  Menu,
  Burger,
  Text,
  Avatar,
  Drawer,
  Divider,
  Title,
} from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";
import { useLocation, useNavigate } from "react-router";
import { useEffect, useMemo, useState } from "react";
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
  IconChevronDown,
  IconUser,
} from "@tabler/icons-react";
import confetti from "canvas-confetti";
import classes from "./styles/Header.module.css";
import { notifications } from "@mantine/notifications";
import {
  collectionGroup,
  doc,
  getDoc,
  getDocs,
  getFirestore,
  query,
  setDoc,
  writeBatch,
  where,
  deleteField,
} from "firebase/firestore";

export default function Header() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [userData, setUserData] = useState(null);
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [signInError, setSignInError] = useState("");
  const [showNewUserModal, setShowNewUserModal] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const location = useLocation();
  const isHome = location.pathname === "/";
  const [isSignInOpen, { open: openSignIn, close: closeSignIn }] =
    useDisclosure(false);
  const [
    isMobileOpen,
    { open: openMobile, close: closeMobile, toggle: toggleMobile },
  ] = useDisclosure(false);

  const auth = getAuth();

  // Elevation on scroll
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 6);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);
  // Auth state watcher + user doc fetch
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (u) => {
      if (u) {
        setUser(u);
        setIsAnonymous(u.isAnonymous);
        setIsAdmin(u.email === "nawangsherpa1010@gmail.com");

        if (!u.isAnonymous) {
          const db = getFirestore();
          const userRef = doc(db, "users", u.uid);
          const snap = await getDoc(userRef);
          if (snap.exists()) setUserData(snap.data());
        } else {
          setUserData(null);
        }
      } else {
        setUser(null);
        setIsAnonymous(false);
        setIsAdmin(false);
        setUserData(null);
      }
    });
    return () => unsubscribe();
  }, []);
  const initials = useMemo(() => {
    if (!userData?.full_name) return "U";
    const parts = userData.full_name.trim().split(/\s+/);
    const first = parts[0]?.[0] || "";
    const last = parts.length > 1 ? parts[parts.length - 1][0] : "";
    return (first + last).toUpperCase();
  }, [userData?.full_name]);

  const handleGoogleLink = async () => {
    const db = getFirestore();
    const provider = new GoogleAuthProvider();

    let docPathsToClaim = [];
    const anonUser = auth.currentUser?.isAnonymous ? auth.currentUser : null;
    const anonUID = anonUser?.uid;

    if (anonUID) {
      try {
        const snapshot = await getDocs(
          query(collectionGroup(db, "syllabi"), where("owner", "==", anonUID))
        );
        const batch = writeBatch(db);
        snapshot.forEach((docSnap) => {
          const ref = doc(db, docSnap.ref.path);
          batch.update(ref, { owner: deleteField() });
          docPathsToClaim.push(ref.path);
        });
        await batch.commit();
        sessionStorage.setItem(
          "pendingSyllabusClaims",
          JSON.stringify(docPathsToClaim)
        );
      } catch (err) {
        console.error(err);
      }
    }

    try {
      const result = await signInWithPopup(auth, provider);
      const signedUser = result.user;
      setUser(signedUser);
      setIsAnonymous(false);

      const claimedPaths = JSON.parse(
        sessionStorage.getItem("pendingSyllabusClaims") || "[]"
      );
      if (claimedPaths.length > 0) {
        const batch = writeBatch(db);
        claimedPaths.forEach((path) => {
          const ref = doc(db, path);
          batch.update(ref, { owner: signedUser.uid });
        });
        await batch.commit();
        sessionStorage.removeItem("pendingSyllabusClaims");
      }

      // Ensure user doc
      const userRef = doc(db, "users", signedUser.uid);
      const userSnap = await getDoc(userRef);
      if (!userSnap.exists()) {
        await setDoc(userRef, {
          email: signedUser.email,
          full_name: signedUser.displayName || "",
          profile_image: signedUser.photoURL || "",
          createdAt: new Date(),
        });
        confetti({ particleCount: 220, spread: 60, origin: { y: 0.6 } });
        setShowNewUserModal(true);
      } else {
        notifications.show({
          title: "Signed in",
          message: "Welcome back to SyllabusDB!",
          color: "green",
          icon: <IconSparkles size={16} />,
          position: "bottom-center",
        });
      }

      navigate("/");
      setSignInError("");
      closeSignIn();
      closeMobile();
    } catch (error) {
      console.error("Google sign-in failed:", error);
      setSignInError("Something went wrong. Please try again.");

      // Rollback
      if (anonUID && docPathsToClaim.length > 0) {
        try {
          const batch = writeBatch(db);
          docPathsToClaim.forEach((path) => {
            const ref = doc(db, path);
            batch.update(ref, { owner: anonUID });
          });
          await batch.commit();
          sessionStorage.removeItem("pendingSyllabusClaims");
        } catch (rollbackError) {
          console.error(rollbackError);
        }
      }
    }
  };

  const handleSignOut = async () => {
    await getAuth().signOut();
    navigate("/");
    notifications.show({
      title: "Signed out",
      message: "You have been signed out successfully.",
      color: "red",
      position: "bottom-center",
      icon: <IconLogout size={16} />,
    });
  };

  return (
    <Box className={`${classes.header} ${scrolled ? classes.scrolled : ""}`}>
      <div className={classes.headerInner}>
        {/* Logo */}
        <button
          className={classes.logo}
          onClick={() => navigate("/")}
          aria-label="SyllabusDB Home"
        >
          <Text fw={800} size="xl" className={classes.wordmark}>
            Syllabus<span className={classes.brand}>DB</span>
          </Text>
        </button>

        {/* Right side actions */}
        <Group className={classes.rightSide} gap="sm">
          <Burger
            hiddenFrom="sm"
            size="sm"
            opened={isMobileOpen}
            onClick={toggleMobile}
            aria-label="Open menu"
          />
          <Button
            variant="light"
            color="blue"
            onClick={() => navigate("/uploadsyllabus")}
            visibleFrom="sm"
            size="sm"
          >
            Upload Syllabus
          </Button>

          {isAdmin && (
            <Button
              variant="subtle"
              onClick={() => navigate("/admin")}
              visibleFrom="sm"
              size="sm"
            >
              Admin
            </Button>
          )}

          {/* Desktop account menu */}
          {user && !isAnonymous ? (
            <Menu shadow="md" width={240} position="bottom-end" withinPortal>
              <Menu.Target>
                <Button
                  variant="subtle"
                  size="sm"
                  className={classes.accountBtn}
                  leftSection={
                    userData?.profile_image ? (
                      <Avatar
                        src={userData.profile_image}
                        radius="xl"
                        size="sm"
                      />
                    ) : (
                      <Avatar radius="xl" size="sm" color="blue">
                        {initials}
                      </Avatar>
                    )
                  }
                  rightSection={<IconChevronDown size={14} />}
                  visibleFrom="sm"
                >
                  {userData?.full_name || "Account"}
                </Button>
              </Menu.Target>

              <Menu.Dropdown>
                {!isHome && (
                  <Menu.Item
                    leftSection={<IconHome size={16} />}
                    onClick={() => navigate("/")}
                  >
                    Home
                  </Menu.Item>
                )}
                <Menu.Item
                  leftSection={<IconUpload size={16} />}
                  onClick={() => navigate("/uploadsyllabus")}
                >
                  Upload Syllabus
                </Menu.Item>
                <Menu.Item
                  leftSection={<IconPhoto size={16} />}
                  onClick={() => navigate("/myuploads")}
                >
                  My Uploads
                </Menu.Item>
                <Menu.Item
                  leftSection={<IconSettings size={16} />}
                  onClick={() => navigate("/settings")}
                >
                  Settings
                </Menu.Item>
                {isAdmin && (
                  <Menu.Item onClick={() => navigate("/admin")}>
                    Admin
                  </Menu.Item>
                )}
                <Menu.Divider />
                <Menu.Item
                  color="red"
                  leftSection={<IconLogout size={16} />}
                  onClick={handleSignOut}
                >
                  Sign Out
                </Menu.Item>
              </Menu.Dropdown>
            </Menu>
          ) : (
            <>
              <Button
                onClick={openSignIn}
                variant="outline"
                size="sm"
                visibleFrom="sm"
              >
                Sign In
              </Button>
            </>
          )}
        </Group>
      </div>

      {/* Mobile drawer */}
      <Drawer
        opened={isMobileOpen}
        onClose={closeMobile}
        padding="md"
        size="80%"
        position="right"
      >
        <Group align="center" gap="sm" mb="md">
          {user && !isAnonymous ? (
            <>
              {userData?.profile_image ? (
                <Avatar src={userData.profile_image} radius="xl" />
              ) : (
                <Avatar radius="xl" color="blue">
                  {initials}
                </Avatar>
              )}
              <div>
                <Text fw={600}>{userData?.full_name || "Account"}</Text>
                <Text size="xs" c="dimmed">
                  {user?.email || "Signed in"}
                </Text>
              </div>
            </>
          ) : (
            <>
              <Avatar radius="xl" color="gray">
                <IconUser size={16} />
              </Avatar>
              <Text fw={600}>Guest</Text>
            </>
          )}
        </Group>

        <Divider my="sm" />
        {!isHome && (
          <Button
            fullWidth
            variant="light"
            leftSection={<IconHome size={16} />}
            mb="xs"
            onClick={() => {
              navigate("/");
              closeMobile();
            }}
          >
            Home
          </Button>
        )}

        <Button
          fullWidth
          variant="light"
          leftSection={<IconUpload size={16} />}
          mb="xs"
          onClick={() => {
            navigate("/uploadsyllabus");
            closeMobile();
          }}
        >
          Upload Syllabus
        </Button>
        {user && !isAnonymous && (
          <>
            <Button
              fullWidth
              variant="light"
              leftSection={<IconPhoto size={16} />}
              mb="xs"
              onClick={() => {
                navigate("/myuploads");
                closeMobile();
              }}
            >
              My Uploads
            </Button>
            <Button
              fullWidth
              variant="light"
              leftSection={<IconSettings size={16} />}
              mb="xs"
              onClick={() => {
                navigate("/settings");
                closeMobile();
              }}
            >
              Settings
            </Button>
          </>
        )}
        {isAdmin && (
          <Button
            fullWidth
            variant="light"
            mb="xs"
            onClick={() => {
              navigate("/admin");
              closeMobile();
            }}
          >
            Admin
          </Button>
        )}

        <Divider my="sm" />

        {user && !isAnonymous ? (
          <Button
            fullWidth
            color="red"
            leftSection={<IconLogout size={16} />}
            onClick={() => {
              handleSignOut();
              closeMobile();
            }}
          >
            Sign Out
          </Button>
        ) : (
          <Button
            fullWidth
            leftSection={<IconLock size={16} />}
            onClick={() => {
              openSignIn();
              closeMobile();
            }}
          >
            Sign In
          </Button>
        )}
      </Drawer>

      {/* Sign-in modal */}
      <Modal
        opened={isSignInOpen}
        onClose={() => {
          closeSignIn();
          setSignInError("");
        }}
        title="Welcome to SyllabusDB"
        radius="md"
        size="md"
      >
        <Text size="sm" mb="sm">
          Sign in with Google to easily manage your uploads and get
          notifications about their status.
        </Text>

        {signInError && <Box className={classes.errorBox}>{signInError}</Box>}

        <Button
          fullWidth
          variant="outline"
          radius="md"
          size="md"
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

      {/* New user modal */}
      {showNewUserModal && (
        <Modal
          opened
          onClose={() => setShowNewUserModal(false)}
          centered
          radius="md"
          padding="lg"
          withCloseButton={false}
        >
          <div className={classes.welcomeBox}>
            <Title order={3} mb="sm">
              🎓 Welcome to SyllabusDB
            </Title>
            <Text mb="xs">
              Get email updates when your syllabus or college request is
              approved?
            </Text>
            <Text size="sm" c="dimmed" mb="md">
              You can change this anytime in Settings.
            </Text>

            <Group justify="center" gap="md">
              <Button
                onClick={async () => {
                  const db = getFirestore();
                  const current = getAuth().currentUser;
                  if (!current) return setShowNewUserModal(false);
                  const userRef = doc(db, "users", current.uid);
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
            </Group>
          </div>
        </Modal>
      )}
    </Box>
  );
}
