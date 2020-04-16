import React, {useState, useEffect} from 'react';
import {Text} from 'react-native';
import AsyncStorage from '@react-native-community/async-storage';
import ApolloClient from 'apollo-boost';
import {ApolloProvider} from '@apollo/react-hooks';
import {ThemeProvider} from 'styled-components';
import {InMemoryCache} from 'apollo-cache-inmemory';
import {persistCache} from 'apollo-cache-persist';
import {AuthProvider} from './AuthContext';
import styles from './styles';
import NavController from './navigation/NavController';

export default function App() {
  const [loading, setLoading] = useState(true);
  const [client, setClient] = useState(null);
  const [isLoggedIn, setIsLoggedIn] = useState(null);

  useEffect(() => {
    async function preLoad() {
      const cache = new InMemoryCache();
      const client = new ApolloClient({
        cache,
        request: async operation => {
          const token = await AsyncStorage.getItem('jwt');
          return operation.setContext({
            headers: {Authorization: `Bearer ${token}`},
          });
        },
        uri:
          'https://491mtg7xw0.execute-api.ap-northeast-2.amazonaws.com/staging/',
      });

      persistCache({
        cache,
        storage: AsyncStorage,
      }).then(() => {
        setClient(client);
      });

      const isLoggedIn = await AsyncStorage.getItem('isLoggedIn');
      if (!isLoggedIn || isLoggedIn === 'false') {
        setIsLoggedIn(false);
      } else {
        setIsLoggedIn(true);
      }

      setLoading(false);
    }

    preLoad();
  }, []);

  return loading ? (
    <Text>Loading</Text>
  ) : (
    <ApolloProvider client={client}>
      <ThemeProvider theme={styles}>
        <AuthProvider isLoggedIn={isLoggedIn} client={client}>
          <NavController />
        </AuthProvider>
      </ThemeProvider>
    </ApolloProvider>
  );
}
