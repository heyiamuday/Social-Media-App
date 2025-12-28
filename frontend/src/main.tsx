// main.tsx
import { ApolloClient, InMemoryCache, ApolloProvider, createHttpLink, from } from '@apollo/client';
import { setContext } from '@apollo/client/link/context';
import { onError } from '@apollo/client/link/error';
import { RetryLink } from '@apollo/client/link/retry';
import { createRoot } from 'react-dom/client';
import App from './App';
import './styles/main.scss';

// Use an environment variable for the GraphQL URI, with a fallback for safety.
const graphqlUri = import.meta.env.VITE_GRAPHQL_URI || 'http://localhost:4000/graphql';

// Configure HTTP link with extended timeout for cold starts (90 seconds)
const httpLink = createHttpLink({
  uri: graphqlUri,
  fetchOptions: {
    timeout: 90000, // 90 seconds to handle Render cold starts
  },
});

// Auth link to add JWT token to requests
const authLink = setContext((_, { headers }) => {
  const token = localStorage.getItem('token');
  return {
    headers: {
      ...headers,
      authorization: token ? `Bearer ${token}` : '',
    },
  };
});

// Error handling link for better debugging
const errorLink = onError(({ graphQLErrors, networkError, operation }) => {
  if (graphQLErrors) {
    graphQLErrors.forEach(({ message, locations, path }) => {
      console.error(
        `[GraphQL error]: Message: ${message}, Location: ${locations}, Path: ${path}`
      );
    });
  }
  
  if (networkError) {
    console.error(`[Network error]: ${networkError.message}`);
    // Check if it's a timeout error (cold start scenario)
    if (networkError.message.includes('timeout') || networkError.message.includes('fetch')) {
      console.warn('⚠️ Backend may be waking from sleep (cold start). Retrying...');
    }
  }
});

// Retry link with exponential backoff for failed requests
const retryLink = new RetryLink({
  delay: {
    initial: 1000, // Start with 1 second delay
    max: 5000, // Max 5 seconds between retries
    jitter: true, // Add randomness to prevent thundering herd
  },
  attempts: {
    max: 3, // Retry up to 3 times
    retryIf: (error, _operation) => {
      // Retry on network errors or timeouts (typical during cold starts)
      return !!error && !error.message?.includes('Unauthorized');
    },
  },
});

// Combine all links in order: error handling -> retry -> auth -> http
const client = new ApolloClient({
  link: from([errorLink, retryLink, authLink, httpLink]),
  cache: new InMemoryCache(),
  defaultOptions: {
    watchQuery: {
      fetchPolicy: 'network-only', // Always fetch fresh data
      errorPolicy: 'all',
    },
    query: {
      fetchPolicy: 'network-only',
      errorPolicy: 'all',
    },
    mutate: {
      errorPolicy: 'all',
    },
  },
});

createRoot(document.getElementById('root')!).render(
  <ApolloProvider client={client}>
    <App />
  </ApolloProvider>
);