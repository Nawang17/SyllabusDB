import { useEffect, useState } from "react";
import {
  Box,
  Button,
  Paper,
  Text,
  Title,
  TextInput,
  Stack,
  Alert,
} from "@mantine/core";
import { notifications } from "@mantine/notifications";
import { useNavigate } from "react-router";
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  sendSignInLinkToEmail,
  isSignInWithEmailLink,
  signInWithEmailLink,
  onAuthStateChanged,
} from "firebase/auth";
import { doc, getDoc, getFirestore, setDoc } from "firebase/firestore";
import { IconMail, IconSparkles } from "@tabler/icons-react";

export default function SignIn() {
  const auth = getAuth();
  const db = getFirestore();
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [status, setStatus] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (!!user && !user.isAnonymous) {
        navigate("/");
      }
    });

    return unsubscribe;
  }, [auth, navigate]);
  const createUserDocIfNeeded = async (user) => {
    const userRef = doc(db, "users", user.uid);
    const snap = await getDoc(userRef);

    if (!snap.exists()) {
      await setDoc(userRef, {
        email: user.email || "",
        full_name: user.displayName || "",
        profile_image: user.photoURL || "",
        createdAt: new Date(),
        wantsEmailNotifications: true,
      });

      await fetch("https://syllabusdbserver-agza.onrender.com/notify-newUser", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: "new user" }),
      });
    }
  };

  useEffect(() => {
    const finishEmailLinkSignIn = async () => {
      if (!isSignInWithEmailLink(auth, window.location.href)) return;

      let savedEmail = window.localStorage.getItem("emailForSignIn");

      if (!savedEmail) {
        savedEmail = window.prompt(
          "Please enter your email to finish signing in.",
        );
      }

      if (!savedEmail) return;

      try {
        setLoading(true);
        const result = await signInWithEmailLink(
          auth,
          savedEmail,
          window.location.href,
        );

        window.localStorage.removeItem("emailForSignIn");
        await createUserDocIfNeeded(result.user);

        notifications.show({
          title: "Signed in",
          message: "Welcome to SyllabusDB!",
          color: "green",
          icon: <IconSparkles size={16} />,
          position: "bottom-center",
        });

        navigate("/");
      } catch (err) {
        console.error(err);
        setError("Email sign-in failed. Try requesting a new link.");
      } finally {
        setLoading(false);
      }
    };

    finishEmailLinkSignIn();
  }, []);

  const handleGoogleSignIn = async () => {
    try {
      setLoading(true);
      setError("");

      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(auth, provider);

      await createUserDocIfNeeded(result.user);

      notifications.show({
        title: "Signed in",
        message: "Welcome to SyllabusDB!",
        color: "green",
        icon: <IconSparkles size={16} />,
        position: "bottom-center",
      });

      navigate("/");
    } catch (err) {
      console.error(err);
      setError("Google sign-in failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleEmailLinkSignIn = async () => {
    if (!email.trim()) {
      setError("Enter your email first.");
      return;
    }

    try {
      setLoading(true);
      setError("");

      const actionCodeSettings = {
        url: `${window.location.origin}/signin`,
        handleCodeInApp: true,
      };

      await sendSignInLinkToEmail(auth, email.trim(), actionCodeSettings);
      window.localStorage.setItem("emailForSignIn", email.trim());

      setStatus("Check your email. We sent you a sign-in link.");
    } catch (err) {
      console.error(err);
      setError("Could not send sign-in link. Check Firebase settings.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box
      mih="40vh"
      display="flex"
      style={{
        alignItems: "center",
        justifyContent: "center",
        padding: "2rem 1rem",
      }}
    >
      <Paper shadow="sm" radius="lg" p="xl" maw={420} w="100%" withBorder>
        <Stack gap="md">
          <div>
            <Title order={2}>Sign in</Title>
          </div>

          {error && (
            <Alert color="red" radius="md">
              {error}
            </Alert>
          )}

          {status && (
            <Alert color="green" radius="md">
              {status}
            </Alert>
          )}

          <Button
            fullWidth
            variant="outline"
            radius="md"
            size="md"
            loading={loading}
            onClick={handleGoogleSignIn}
            leftSection={
              <img
                src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg"
                alt="Google"
                style={{ width: 18, height: 18 }}
              />
            }
          >
            Sign in with Google
          </Button>

          <Text size="sm" ta="center" c="dimmed">
            or
          </Text>

          <Text size="lg" fw="bold">
            Email sign-in
          </Text>

          <Text size="sm" c="dimmed">
            No password setup required. We'll email you a one-time sign in link
            for your convenience.
          </Text>

          <TextInput
            label="Email"
            placeholder="you@example.com"
            value={email}
            onChange={(e) => setEmail(e.currentTarget.value)}
            leftSection={<IconMail size={16} />}
          />

          <Button
            fullWidth
            radius="md"
            loading={loading}
            onClick={handleEmailLinkSignIn}
          >
            Send sign-in link
          </Button>
        </Stack>
      </Paper>
    </Box>
  );
}
