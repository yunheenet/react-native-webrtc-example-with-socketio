import React, {useState, useEffect} from 'react';
import {
  Image,
  ScrollView,
  RefreshControl,
  StatusBar,
  TouchableOpacity,
  Alert,
} from 'react-native';
import {withNavigation} from '@react-navigation/compat';
import styled from 'styled-components';
import Loader from '../../components/Loader';
import {gql} from 'apollo-boost';
import {useQuery} from '@apollo/react-hooks';

const Room = styled.View`
  flex-direction: row;
  align-items: center;
`;

const Header = styled.View`
  padding: 30px;
  width: 200px;
  flex-direction: row;
  align-items: center;
`;

const UserColumn = styled.View`
  margin-left: 10px;
`;

const Location = styled.Text`
  margin-top: 5px;
  font-size: 12px;
`;

const Meta = styled.View`
  padding: 15px;
`;

const Button = styled.View`
  background-color: ${props => props.theme.blueColor};
  padding: 10px;
  border-radius: 4px;
`;

const Buttons = styled.View`
  margin-bottom: 10px;
`;

const Bold = styled.Text`
  font-weight: 500;
`;

const ROOM_LIST_QUERY = gql`
  {
    seeRequestRooms {
      id
      location
      participants {
        username
        avatar
      }
      createdAt
      updatedAt
    }
  }
`;

const Home = ({navigation}) => {
  const [refreshing, setRefreshing] = useState(false);
  const {loading, data, refetch} = useQuery(ROOM_LIST_QUERY);

  const refresh = async () => {
    setRefreshing(true);
    try {
      await refetch();
    } catch (e) {
      console.log(e);
    } finally {
      setRefreshing(false);
    }
  };

  useEffect(() => {
    refresh();
  }, []);

  return (
    <ScrollView
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={refresh} />
      }>
      <StatusBar barStyle="dark-content" />
      <Header>
        <TouchableOpacity
          onPress={() => navigation.navigate('Room', {state: 'Create'})}>
          <Button>
            <Bold>Create my Room</Bold>
          </Button>
        </TouchableOpacity>
      </Header>
      {loading ? (
        <Loader />
      ) : (
        data &&
        data.seeRequestRooms &&
        data.seeRequestRooms.map((room, index) => (
          <Room key={index}>
            <Header>
              <Image
                style={{height: 40, width: 40, borderRadius: 20}}
                source={
                  room.participants[0].avatar
                    ? {uri: room.participants[0].avatar}
                    : require('../../assets/logo_full.png')
                }
              />
              <UserColumn>
                <Bold>{room.participants[0].username}</Bold>
                <Location>{room.location}</Location>
              </UserColumn>
            </Header>
            <Meta>
              <Buttons>
                <TouchableOpacity
                  onPress={() =>
                    navigation.navigate('Room', {
                      roomId: room.id,
                    })
                  }>
                  <Button>
                    <Bold>Join</Bold>
                  </Button>
                </TouchableOpacity>
              </Buttons>
            </Meta>
          </Room>
        ))
      )}
    </ScrollView>
  );
};

export default withNavigation(Home);
