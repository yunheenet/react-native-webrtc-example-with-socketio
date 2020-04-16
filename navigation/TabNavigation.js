import React from 'react';
import {Platform} from 'react-native';
import {createStackNavigator} from '@react-navigation/stack';
import {createBottomTabNavigator} from '@react-navigation/bottom-tabs';
import Home from '../screens/Tabs/Home';
import Room from '../screens/Room';
import styles from '../styles';

const stackNavigatorOptions = {
  headerBackTitleVisible: false,
  headerTintColor: styles.blackColor,
  headerStyle: {backgroundColor: '#FAFAFA'},
};

const HomeStack = createStackNavigator();

function HomeStackScreen() {
  return (
    <HomeStack.Navigator
      screenOptions={{
        // tabBarIcon: ({focused}) => (
        //   <NavIcon
        //     focused={focused}
        //     name={Platform.OS === 'ios' ? 'ios-home' : 'md-home'}
        //   />),
        ...stackNavigatorOptions,
      }}>
      <HomeStack.Screen name="Home" component={Home} />
      <HomeStack.Screen
        name="Room"
        component={Room}
        options={{title: 'Room'}}
      />
    </HomeStack.Navigator>
  );
}

const Tab = createBottomTabNavigator();

export default () => {
  return (
    <Tab.Navigator
      initialRouteName="Home"
      tabBarOptions={{
        showLabel: false,
        style: {
          backgroundColor: '#FAFAFA',
        },
      }}>
      <Tab.Screen
        name="Home"
        component={HomeStackScreen}
        options={
          {
            // tabBarIcon: ({focused}) => (
            //   <NavIcon
            //     focused={focused}
            //     name={Platform.OS === 'ios' ? 'ios-home' : 'md-home'}
            //   />
            // ),
          }
        }
      />
    </Tab.Navigator>
  );
};
