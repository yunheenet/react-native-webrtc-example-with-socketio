import React, {useState} from 'react';
import {
  TouchableWithoutFeedback,
  Keyboard,
  Alert,
  KeyboardAvoidingView,
} from 'react-native';
import styled from 'styled-components';
import {useMutation} from '@apollo/react-hooks';
import {CREATE_ACCOUNT} from './AuthQueries';
import AuthButton from '../../components/AuthButton';
import AuthInput from '../../components/AuthInput';
import useInput from '../../hooks/useInput';

const View = styled.View`
  justify-content: center;
  align-items: center;
  flex: 1;
`;

export default ({navigation, route}) => {
  const fNameInput = useInput('');
  const lNameInput = useInput('');
  const emailInput = useInput(route.params?.email ?? '');
  const usernameInput = useInput('');
  const [loading, setLoading] = useState(false);

  const [createAccountMutation] = useMutation(CREATE_ACCOUNT, {
    variables: {
      username: usernameInput.value,
      email: emailInput.value,
      firstName: fNameInput.value,
      lastName: lNameInput.value,
    },
  });

  const handleSingup = async () => {
    const {value: email} = emailInput;
    const {value: fName} = fNameInput;
    const {value: lName} = lNameInput;
    const {value: username} = usernameInput;
    const emailRegex = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;

    if (!emailRegex.test(email)) {
      return Alert.alert('That email is invalid');
    }
    if (fName === '') {
      return Alert.alert('I need your name');
    }
    if (username === '') {
      return Alert.alert('Invalid username');
    }

    try {
      setLoading(true);
      const {
        data: {createAccount},
      } = await createAccountMutation();
      if (createAccount) {
        Alert.alert('Account created', 'Log in now!');
        navigation.navigate('Login', {email});
      }
    } catch (e) {
      console.log(e);
      Alert.alert('Username taken.', 'Log in instead');
      navigation.navigate('Login', {email});
    } finally {
      setLoading(false);
    }
  };

  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
      <KeyboardAvoidingView
        style={{justifyContent: 'center', alignItems: 'center', flex: 1}}
        behavior="padding">
        <AuthInput
          {...fNameInput}
          placeholder="First name"
          autoCapitalize="words"
        />
        <AuthInput
          {...lNameInput}
          placeholder="Last name"
          autoCapitalize="words"
        />
        <AuthInput
          {...emailInput}
          placeholder="Email"
          keyboardType="email-address"
          returnKeyType="send"
          autoCorrect={false}
        />
        <AuthInput
          {...usernameInput}
          placeholder="Username"
          returnKeyType="send"
          autoCorrect={false}
        />
        <AuthButton loading={loading} onPress={handleSingup} text="Sign up" />
      </KeyboardAvoidingView>
    </TouchableWithoutFeedback>
  );
};
