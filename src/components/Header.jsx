import {
  Box,
  Button,
  Burger,
  Drawer,
  Group,
  ScrollArea,
  Divider,
  Image,
} from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";
import classes from "./styles/Header.module.css";
import { useNavigate } from "react-router";
import appLogo from "../assets/app_logo.png";
export default function Header() {
  const [drawerOpened, { toggle: toggleDrawer, close: closeDrawer }] =
    useDisclosure(false);
  const navigate = useNavigate();
  return (
    <Box>
      <header className={classes.header}>
        <div className={classes["header-inner"]}>
          {/* Left spacer */}
          <div className={classes.leftSide} />

          <div className={classes.logo} onClick={() => navigate("/")}>
            SyllabusDB
          </div>
          {/* Right buttons */}
          <Group className={classes.rightSide} visibleFrom="sm">
            <Button
              variant="default"
              onClick={() => navigate("/uploadsyllabus")}
            >
              Upload Syllabus
            </Button>
            {/* <Button onClick={() => (window.location.href = "/login")}>
              Log in
            </Button> */}
          </Group>
          {/* Burger for mobile */}
          <Burger
            opened={drawerOpened}
            onClick={toggleDrawer}
            hiddenFrom="sm"
          />
        </div>
      </header>

      {/* Drawer for mobile */}
      <Drawer
        opened={drawerOpened}
        onClose={closeDrawer}
        size="100%"
        padding="md"
        title={
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <img
              src={appLogo}
              alt="App Logo"
              style={{ height: 40, cursor: "pointer", borderRadius: 8 }}
              onClick={() => navigate("/")}
            />
            <strong>SyllabusDB</strong>
          </div>
        }
        hiddenFrom="sm"
        zIndex={1000000}
      >
        <ScrollArea h="calc(100vh - 80px)" mx="-md">
          <Divider my="sm" />

          <p
            onClick={() => {
              navigate("/");
              closeDrawer();
            }}
            className={classes.link}
          >
            Home
          </p>
          <p
            onClick={() => {
              navigate("/uploadsyllabus");
              closeDrawer();
            }}
            className={classes.link}
          >
            Upload Syllabus
          </p>
          <p
            onClick={() => {
              navigate("/aboutpage");
              closeDrawer();
            }}
            className={classes.link}
          >
            About
          </p>
          {/* <a href="/login" className={classes.link}>
            Log in
          </a> */}
        </ScrollArea>
      </Drawer>
    </Box>
  );
}
