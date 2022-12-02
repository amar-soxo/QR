import * as React from 'react';

import AsyncStorage from '@react-native-async-storage/async-storage';
// import {NavigationContainer} from '@react-navigation/native';
// import {createStackNavigator} from '@react-navigation/stack';
import {NavigationContainer} from '@react-navigation/native';
import {createNativeStackNavigator} from '@react-navigation/native-stack';
import {Provider, connect} from 'react-redux';
import {createStore, applyMiddleware} from 'redux';
import {combineReducers} from 'redux';
import * as eva from '@eva-design/eva';
import {ApplicationProvider} from '@ui-kitten/components';

import LoginScreen from './screens/Login';
import {loginReducer} from './screens/Login';
import HomeScreen from './screens/Home';
import {homeReducer} from './screens/Home';
import ReportScreen from './screens/Report';
import {reportReducer} from './screens/Report';
import {EvaIconsPack} from '@ui-kitten/eva-icons';
import {IconRegistry} from '@ui-kitten/components';

export const AuthContext = React.createContext();
const Stack = createNativeStackNavigator();

const red = combineReducers({
  loginReducer,
  homeReducer,
  reportReducer,
});

const store = createStore(red, applyMiddleware());

const Nav = ({navigation, userToken, restoreToken}) => {
  React.useEffect(() => {
    const bootstrapAsync = async () => {
      let storedUserToken;
      try {
        storedUserToken = await AsyncStorage.getItem('userToken');
      } catch (e) {
        // Restoring token failed
      }
      restoreToken(JSON.parse(storedUserToken));
    };
    bootstrapAsync();

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <NavigationContainer>
      <IconRegistry icons={EvaIconsPack} />
      <Stack.Navigator
        screenOptions={{
          headerShown: false,
        }}>
        {userToken == null ? (
          <>
            <Stack.Screen name="Login" component={LoginScreen} />
          </>
        ) : (
          <>
            <Stack.Screen name="Home" component={HomeScreen} />
            <Stack.Screen name="Report" component={ReportScreen} />
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
};

function mapStateToProps(state) {
  return {
    isLoading: state.loginReducer.isLoading,
    isSignout: state.loginReducer.isSignout,
    userToken: state.loginReducer.userToken,
  };
}
function bindAction(dispatch) {
  return {
    restoreToken: user => {
      dispatch({type: 'RESTORE_TOKEN', user});
    },
  };
}
const App = connect(mapStateToProps, bindAction)(Nav);

const Root = ({navigation}) => {
  return (
    <ApplicationProvider {...eva} theme={eva.light}>
      <Provider store={store}>
        <App />
      </Provider>
    </ApplicationProvider>
  );
};

// export default Root;
export default Root;
