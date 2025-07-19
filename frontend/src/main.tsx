// main.tsx
import { ApolloClient, InMemoryCache, ApolloProvider, createHttpLink, HttpOptions } from '@apollo/client';
import { setContext } from '@apollo/client/link/context';
import { createRoot } from 'react-dom/client';
import App from './App';
import './styles/main.scss';

// Use an environment variable for the GraphQL URI, with a fallback for safety.
const graphqlUri = import.meta.env.VITE_GRAPHQL_URI || 'http://localhost:4000/graphql';

const httpLink = createHttpLink({
  uri: graphqlUri,
});

const authLink = setContext((_, { headers }) => {
  const token = localStorage.getItem('token');
  return {
    headers: {
      ...headers,
      authorization: token ? `Bearer ${token}` : '',
    },
  };
});

const client = new ApolloClient({
  link: authLink.concat(httpLink),
  cache: new InMemoryCache(),
});

createRoot(document.getElementById('root')!).render(
  <ApolloProvider client={client}>
    <App />
  </ApolloProvider>
);