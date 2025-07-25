import { Container, Title, Text, Stack } from "@mantine/core";

export default function ExtensionPrivacyPolicy() {
  return (
    <Container size="1200px" py="xl" px="xl">
      <Title order={2} mb="md">
        Privacy Policy - SyllabusDB for Schedule Builder
      </Title>

      <Stack spacing="md">
        <Text>
          This extension does not collect, store, or share any personal data. It
          is designed solely to enhance the CUNY Schedule Builder experience by
          adding direct links to relevant syllabi hosted on SyllabusDB.
        </Text>

        <Text>
          We do not use cookies, analytics, trackers, or any third-party
          services that gather information about your browsing activity.
        </Text>

        <Text>
          The extension operates entirely on your device. It reads course
          listings on the Schedule Builder page and inserts static links
          pointing to SyllabusDB.
        </Text>

        <Text>
          No personal information, course selection, or usage data is ever
          accessed, transmitted, or saved by this extension.
        </Text>

        <Text>
          For questions or concerns, please contact us at{" "}
          <strong>katophh@gmail.com</strong>.
        </Text>
      </Stack>
    </Container>
  );
}
