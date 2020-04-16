import React, {useState} from 'react';
import {Alert, Keyboard, TouchableWithoutFeedback} from 'react-native';
import {useMutation} from '@apollo/react-hooks';
import styled from 'styled-components';
import AuthButton from '../../components/AuthButton';
import AuthInput from '../../components/AuthInput';
import useInput from '../../hooks/useInput';
import {LOG_IN} from './AuthQueries';

const View = styled.View`
  justify-content: center;
  align-items: center;
  flex: 1;
`;

export default ({navigation, route}) => {
  const emailInput = useInput(route.params?.email ?? '');
  const [loading, setLoading] = useState(false);

  const [requestSecretMutation] = useMutation(LOG_IN, {
    variables: {
      email: emailInput.value,
    },
  });

  const handleLogin = async () => {
    const {value} = emailInput;
    const emailRegex = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
    if (value === '') {
      return Alert.alert('Email cant be empty.');
    } else if (!emailRegex.test(value)) {
      return Alert.alert('Email is invalid.');
    }
    try {
      setLoading(true);

      const {
        data: {requestSecret},
      } = await requestSecretMutation();
      if (requestSecret) {
        Alert.alert('Check your email');
        navigation.navigate('Confirm', {email: value});
        return;
      } else {
        Alert.alert('Account not found');
        navigation.navigate('Signup', {email: value});
      }
    } catch (e) {
      Alert.alert("Can't log in now");
    } finally {
      setLoading(false);
    }
  };

  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
      <View>
        <AuthInput
          {...emailInput}
          placeholder="Email"
          keyboardType="email-address"
          returnKeyType="send"
          onSubmitEdting={handleLogin}
          autoCorrect={false}
        />
        <AuthButton loading={loading} onPress={handleLogin} text="Log In" />
      </View>
    </TouchableWithoutFeedback>
  );
};
