import { useCallback, useEffect, useState } from 'react';
import { Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import Heracross from 'heracross';
import ExampleDemo, {
  type RecordCounts,
} from '../native/NativeHeracrossExampleDemo';
import { registerSampleToggles } from '../setup';
import { toolkit } from '../toolkit';
import {
  ButtonRow,
  LabeledRow,
  ListScreen,
  Row,
  Section,
  listStyles,
} from '../ui/List';
import { useTheme } from '../ui/theme';

/** The GraphQLZero demo endpoint. See https://graphqlzero.almansi.me */
const GRAPHQL_ENDPOINT = 'https://graphqlzero.almansi.me/api';

const REST_URLS = [
  'https://jsonplaceholder.typicode.com/posts/1',
  'https://jsonplaceholder.typicode.com/users/1',
  'https://jsonplaceholder.typicode.com/comments?postId=1',
  'https://jsonplaceholder.typicode.com/todos/1',
  'https://httpbin.org/get',
  'https://httpbin.org/json',
];

const GET_USER = `query GetUser($id: ID!) {
  user(id: $id) {
    id
    name
    email
  }
}`;

const CREATE_POST = `mutation CreatePost($input: CreatePostInput!) {
  createPost(input: $input) {
    id
    title
    body
  }
}`;

/** Requests fail quietly, as `try?` does in the Swift example: the point is the log entry. */
async function send(input: string, init?: RequestInit) {
  try {
    const response = await fetch(input, init);
    await response.text();
  } catch {
    // Offline, or the demo API is down.
  }
}

function graphQL(operationName: string, query: string, variables: object) {
  return send(GRAPHQL_ENDPOINT, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ operationName, query, variables }),
  });
}

export function HomeScreen() {
  const theme = useTheme();
  const [requestCount, setRequestCount] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [graphQLCount, setGraphQLCount] = useState(0);
  const [counts, setCounts] = useState<RecordCounts>({
    users: 0,
    posts: 0,
    products: 0,
  });

  useEffect(() => {
    ExampleDemo.getRecordCounts().then(setCounts);
  }, []);

  const makeNetworkRequest = async () => {
    setIsLoading(true);
    await send(REST_URLS[0]!);
    setIsLoading(false);
    setRequestCount((count) => count + 1);
  };

  const makeMultipleRequests = async () => {
    setIsLoading(true);
    for (const url of REST_URLS) {
      await send(url);
      setRequestCount((count) => count + 1);
    }
    setIsLoading(false);
  };

  const sendGraphQL = useCallback(async (request: () => Promise<void>) => {
    setIsLoading(true);
    await request();
    setIsLoading(false);
    setGraphQLCount((count) => count + 1);
  }, []);

  const makeGraphQLQuery = () =>
    sendGraphQL(() => graphQL('GetUser', GET_USER, { id: 1 }));

  const makeGraphQLMutation = () =>
    sendGraphQL(() =>
      graphQL('CreatePost', CREATE_POST, {
        input: { title: toolkit.name, body: 'Testing GraphQL logging' },
      })
    );

  return (
    <ListScreen title="Heracross Example">
      <Section header={`${toolkit.name} Demo`}>
        <ButtonRow
          title={`Open ${toolkit.name} Menu`}
          onPress={Heracross.showMenu}
        />
        <ButtonRow title={toolkit.invocationHint} disabled />
      </Section>

      <Section header="Network Requests">
        <ButtonRow
          title="Make Sample Request"
          onPress={makeNetworkRequest}
          disabled={isLoading}
          loading={isLoading}
        />
        <ButtonRow
          title="Make Multiple Requests"
          onPress={makeMultipleRequests}
          disabled={isLoading}
        />
        <LabeledRow label="Requests Made" value={String(requestCount)} />
      </Section>

      <Section header="GraphQL Demo" footer={toolkit.graphQLFooter}>
        <ButtonRow
          title="Run GraphQL Query"
          onPress={makeGraphQLQuery}
          disabled={isLoading}
        />
        <ButtonRow
          title="Run GraphQL Mutation"
          onPress={makeGraphQLMutation}
          disabled={isLoading}
        />
        <ButtonRow
          title="Run Both GraphQL Operations"
          onPress={() => {
            makeGraphQLQuery();
            makeGraphQLMutation();
          }}
          disabled={isLoading}
        />
        <LabeledRow label="GraphQL Calls" value={String(graphQLCount)} />
      </Section>

      <Section header={toolkit.defaultsSection}>
        <ButtonRow
          title="Write Sample Data"
          onPress={ExampleDemo.writeSampleDefaults}
        />
        <ButtonRow
          title="Clear Sample Data"
          onPress={ExampleDemo.clearSampleDefaults}
        />
      </Section>

      <Section header="Feature Flags Demo">
        <ButtonRow title="Setup Sample Toggles" onPress={registerSampleToggles} />
      </Section>

      {/* Scyther's accessibility audit is iOS only; Scizor has nothing to flag these with. */}
      {Platform.OS === 'ios' && (
        <Section
          header="Accessibility Audit Demo"
          footer="These three controls are deliberately broken so Scyther's accessibility audit has something to find. Open Scyther → UI/UX → Accessibility Audit, or turn on Live Mode, to see them flagged."
        >
          <Row style={styles.auditRow}>
            <Text style={[listStyles.caption, { color: theme.secondaryLabel }]}>
              Deliberate: icon-only button with no accessibility label, for the
              Missing Labels check.
            </Text>
            {/* Drawn rather than a glyph, so there is no text for VoiceOver to read as a label. */}
            <Pressable
              accessibilityRole="button"
              style={[styles.infoButton, { backgroundColor: theme.tint }]}
            >
              <View style={styles.infoDot} />
              <View style={styles.infoStem} />
            </Pressable>
          </Row>
          <Row style={styles.auditRow}>
            <Text style={[listStyles.caption, { color: theme.secondaryLabel }]}>
              Deliberate: 30 × 30pt button, under the 44pt minimum, for the
              Touch Targets check.
            </Text>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Small Button"
              style={[styles.smallButton, { backgroundColor: theme.tint }]}
            />
          </Row>
          <Row style={styles.auditRow}>
            <Text style={[listStyles.caption, { color: theme.secondaryLabel }]}>
              Deliberate: low-contrast text, for the Contrast check.
            </Text>
            {/* Both colours are fixed, so the ratio (about 1.4:1) fails in light and dark mode alike. */}
            <Text style={styles.lowContrast}>Hard to read text</Text>
          </Row>
        </Section>
      )}

      <Section header="Database Demo" footer={toolkit.databaseFooter}>
        <ButtonRow
          title="Add More Records"
          onPress={() => ExampleDemo.addDemoRecords().then(setCounts)}
        />
        <ButtonRow
          title="Clear All Records"
          destructive
          onPress={() => ExampleDemo.clearDemoRecords().then(setCounts)}
        />
        <LabeledRow label="Users" value={String(counts.users)} />
        <LabeledRow label="Posts" value={String(counts.posts)} />
        <LabeledRow label="Products" value={String(counts.products)} />
      </Section>

      {__DEV__ && (
        <Section header="Crash Testing" footer={toolkit.crashFooter}>
          <ButtonRow
            title="Trigger Test Crash"
            destructive
            onPress={Heracross.crashes.triggerTestCrash}
          />
        </Section>
      )}
    </ListScreen>
  );
}

const styles = StyleSheet.create({
  auditRow: {
    flexDirection: 'column',
    alignItems: 'flex-start',
    gap: 8,
    paddingVertical: 15,
  },
  infoButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  infoDot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
    backgroundColor: '#FFFFFF',
    marginBottom: 3,
  },
  infoStem: {
    width: 5,
    height: 14,
    borderRadius: 2.5,
    backgroundColor: '#FFFFFF',
  },
  smallButton: {
    width: 30,
    height: 30,
    borderRadius: 15,
  },
  lowContrast: {
    color: 'rgb(184, 184, 184)',
    backgroundColor: 'rgb(153, 153, 153)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    fontSize: 17,
  },
});
