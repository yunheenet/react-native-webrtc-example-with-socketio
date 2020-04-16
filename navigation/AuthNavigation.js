import React from 'react';
import {NavigationContainer} from '@react-navigation/native';
import {createStackNavigator} from '@react-navigation/stack';
import Signup from '../screens/Auth/Signup';
import Confirm from '../screens/Auth/Confirm';
import Login from '../screens/Auth/Login';
import AuthHome from '../screens/Auth/AuthHome';
import styles from '../styles';

const Stack = createStackNavigator();

export default () => {
  return (
    <NavigationContainer>
      <Stack.Navigator
        headerMode="screen"
        screenOptions={{
          headerBackTitleVisible: false,
          headerTintColor: styles.blackColor,
          headerStyle: {backgroundColor: '#FAFAFA'},
        }}>
        <Stack.Screen
          name="AuthHome"
          component={AuthHome}
          options={{headerShown: false}}
        />
        <Stack.Screen name="Login" component={Login} />
        <Stack.Screen
          name="Confirm"
          component={Confirm}
          options={{headerShown: false}}
        />
        <Stack.Screen
          name="Signup"
          component={Signup}
          options={{
            headerTitle: 'Sign Up',
          }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
};
