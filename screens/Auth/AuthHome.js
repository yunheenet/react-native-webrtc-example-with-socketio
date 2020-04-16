import React from 'react';
import {StatusBar} from 'react-native';
import styled from 'styled-components';
import constants from '../../constants';
import AuthButton from '../../components/AuthButton';

const View = styled.View`
  justify-content: center;
  align-items: center;
  flex: 1;
`;

const Image = styled.Image`
  width: ${constants.width / 2.5}px;
  margin-top: -100px;
`;

const Touchable = styled.TouchableOpacity``;

const LoginLink = styled.View``;
const LoginLinkText = styled.Text`
  color: ${props => props.theme.blueColor};
  margin-top: 20px;
  font-weight: 600;
`;

export default ({navigation}) => (
  <View>
    <StatusBar barStyle="dark-content" />
    <Image
      resizeMode={'contain'}
      source={require('../../assets/logo_full.png')}
    />
    <AuthButton
      text={'Create New Account'}
      onPress={() => navigation.navigate('Signup')}
    />
    <Touchable onPress={() => navigation.navigate('Login')}>
      <LoginLink>
        <LoginLinkText>Log in</LoginLinkText>
      </LoginLink>
    </Touchable>
  </View>
);
