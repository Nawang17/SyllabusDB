import {
  Box,
  Button,
  Group,
  Menu,
  Burger,
  Text,
  Avatar,
  Drawer,
  Divider,
} from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";
import { useLocation, useNavigate } from "react-router";
import { useEffect, useMemo, useState } from "react";
import { getAuth, onAuthStateChanged } from "firebase/auth";
import {
  IconPhoto,
  IconUpload,
  IconSettings,
  IconLogout,
  IconHome,
  IconChevronDown,
  IconUser,
  IconLock,
} from "@tabler/icons-react";
import classes from "./styles/Header.module.css";
import { notifications } from "@mantine/notifications";
import { doc, getDoc, getFirestore } from "firebase/firestore";

export default function Header() {
  const navigate = useNavigate();
  const location = useLocation();
  const auth = getAuth();

  const [user, setUser] = useState(null);
  const [userData, setUserData] = useState(null);
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  const isHome = location.pathname === "/";

  const [isMobileOpen, { close: closeMobile, toggle: toggleMobile }] =
    useDisclosure(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 6);

    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });

    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (u) => {
      if (!u) {
        setUser(null);
        setUserData(null);
        setIsAnonymous(false);
        setIsAdmin(false);
        return;
      }

      setUser(u);
      setIsAnonymous(u.isAnonymous);
      setIsAdmin(u.email === "nawangsherpa1010@gmail.com");

      if (u.isAnonymous) {
        setUserData(null);
        return;
      }

      try {
        const db = getFirestore();
        const userRef = doc(db, "users", u.uid);
        const snap = await getDoc(userRef);

        setUserData(snap.exists() ? snap.data() : null);
      } catch (error) {
        console.error("Failed to fetch user data:", error);
        setUserData(null);
      }
    });

    return () => unsubscribe();
  }, [auth]);

  const initials = useMemo(() => {
    if (!userData?.full_name) return "U";

    const parts = userData.full_name.trim().split(/\s+/);
    const first = parts[0]?.[0] || "";
    const last = parts.length > 1 ? parts[parts.length - 1][0] : "";

    return (first + last).toUpperCase();
  }, [userData?.full_name]);

  const goToSignIn = () => {
    navigate("/signin");
  };

  const handleSignOut = async () => {
    await auth.signOut();

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
        <button
          className={classes.logo}
          onClick={() => {
            navigate("/");

            if (location.pathname === "/") {
              window.scrollTo({ top: 0, behavior: "smooth" });
            }
          }}
          aria-label="SyllabusDB Home"
        >
          <Text c="black" fw={800} size="xl" className={classes.wordmark}>
            Syllabus<span className={classes.brand}>DB</span>
          </Text>
        </button>

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
                  {userData?.full_name || user.email || "Account"}
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
            <Button
              onClick={goToSignIn}
              variant="outline"
              size="sm"
              visibleFrom="sm"
            >
              Sign In
            </Button>
          )}
        </Group>
      </div>

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
              goToSignIn();
              closeMobile();
            }}
          >
            Sign In
          </Button>
        )}
      </Drawer>
    </Box>
  );
}
