import React, {useState, useEffect} from 'react';
import {
  SafeAreaView,
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  Modal,
  ToastAndroid,
  RefreshControl,
} from 'react-native';
// import RnZxing from 'react-native-rn-zxing';

import moment from 'moment';
import {
  Card,
  Text as KittenText,
  MenuItem,
  OverflowMenu,
  Button,
  Layout,
  Input,
} from '@ui-kitten/components';
// import {RNCamera} from 'react-native-camera';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {connect} from 'react-redux';
import Icon from 'react-native-vector-icons/FontAwesome';
import Entypo from 'react-native-vector-icons/Entypo'
import {BarCodeScanner} from 'expo-barcode-scanner';
import {StatusBar} from 'expo-status-bar';

// import QRCodeScanner from 'react-native-qrcode-scanner';

const handle = {
  GCI: [17, 24],
  BCM: [18, 25],
  COLP: [35],
  Mamo: [31],
  Oral: [19, 26],
  CT: [21, 28],
  BD: [33, 30],
  DP: [34, 36],
};

const wait = timeout => {
  return new Promise(resolve => setTimeout(resolve, timeout));
};

const HomeScreen = ({
  navigation,
  signOut,
  userToken,
  fetchPatntSuccess,
  patntList,
  selectPatnt,
}) => {
  const [qrManual, setQrManual] = useState(false);

  const [qrScannerFlag, setQrScannerFlag] = useState(false);

  const [visible, setVisible] = React.useState(false);

  const [refreshing, setRefreshing] = React.useState(false);

  const [retake, setRetake] = useState(0);

  function toggleQr() {
    setQrManual(!qrManual);
  }

  function toggleQrScannerFlag() {
    setQrScannerFlag(!qrScannerFlag);
  }

  useEffect(() => {
    const bootstrapAsync = async () => {
      const response = await fetch(
        'http://122.185.247.155/Nura_Dummy/eventtran/Get?pageno=1&pagesize=100&mode=dt',
        {
          method: 'PUT',
          headers: {
            Accept: 'application/json',
            'Content-Type': 'application/json',
            Authorization:
              'Bearer ' + userToken.Token + ':' + userToken.StaffName,
          },
          body: JSON.stringify({
            EventName: '',
          }),
        },
      );

      const resJson = await response.json();
      if (resJson.Code === '-1') {
      } else if (resJson.Code === '1') {
        fetchPatntSuccess(resJson.Result.EventList);
      }
    };
    bootstrapAsync();

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [retake]);

  function getEventDetailsApi(accNo) {
    return new Promise(function (resolve) {
      fetch(
        `http://122.185.247.155/Nura_Dummy/eventtran/GetSubEvents?Mode=OPNO&No=${accNo}`,
        {
          method: 'GET',
          headers: {
            Accept: 'application/json',
            'Content-Type': 'application/json',
            Authorization:
              'Bearer ' + userToken.Token + ':' + userToken.StaffName,
          },
        },
      ).then(response => {
        response.json().then(data => {
          if (data && data.Code === '1' && data.Message === 'SUCCESS') {
            resolve(data.Result.SubEvents);
          }
        });
      });
    });
  }

  const onRead = result => {
    // toggleQr();
    if (patntList && patntList.length) {
      let ele = {};
      fetch(
        `https://blrffdkhportal.nura-in.com/Nura_Dummy/eventtran/GetByNo?GetByMode=OPNO&NO=${result}`,
        {
          method: 'GET',
          headers: {
            Authorization:
              'Bearer ' + userToken.Token + ':' + userToken.StaffName,
            'Content-Type': 'application/json',
          },
        },
      )
        .then(res => res.json())
        .then(res => {
          ele = res;
          if (ele && ele.Id) {
            var element = ele;

            var location = handle[userToken.StaffName];
            var locationId = location[0];

            if (element.Event.Id === 1) {
              locationId = location[0];
            } else {
              if (['Mamo', 'COLP'].indexOf(userToken.StaffName) !== -1) {
                locationId = location[0];
              } else {
                locationId = location[1];
              }
            }

            // If the patient has already started some event we would end that event or else we would
            // start the event
            if (element.LastSubEventStatus === 'IN') {
              updatePatientEvent(result, locationId, element);
            } else {
              insertPatientEvent(result, locationId, element);
            }
          } else {
            ToastAndroid.showWithGravity(
              'No matching record',
              ToastAndroid.SHORT,
              ToastAndroid.BOTTOM,
            );
          }
        })
        .catch(error => {
          console.log('er', error);
        });
      // var ele = patntList.filter((item) => item.Otherref1 === result);
    } else {
      ToastAndroid.showWithGravity(
        'No data',
        ToastAndroid.SHORT,
        ToastAndroid.BOTTOM,
      );
    }
  };

  const onRefresh = React.useCallback(() => {
    setRefreshing(true);
    wait(2000).then(() => {
      setRetake(Math.random());
      setRefreshing(false);
    });
  }, []);

  const insertPatientEvent = async (result, location, element) => {
    const OPNO = result;
    const LocationID = location;

    const formData = {
      OPNO: OPNO,
      LocationID: LocationID,
    };

    const response = await fetch(
      'http://122.185.247.155/Nura_Dummy/eventtran/InsertPatientLocationWithPreviousCheck',
      {
        method: 'PUT',
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/json',
          Authorization:
            'Bearer ' + userToken.Token + ':' + userToken.StaffName,
        },
        body: JSON.stringify(formData),
      },
    );

    const resJson = await response.json();

    if (resJson && resJson.Code === '1') {
      ToastAndroid.showWithGravity(
        'IN',
        ToastAndroid.SHORT,
        ToastAndroid.BOTTOM,
      );
      let scanedData =
        patntList &&
        patntList[0] &&
        patntList.filter(ele => ele.Id == element.Id);
      if (scanedData && scanedData[0]) {
        selectPatnt(scanedData[0]);
        navigation.navigate('Report');
      }
    } else {
      ToastAndroid.showWithGravity(
        resJson.Result,
        ToastAndroid.SHORT,
        ToastAndroid.BOTTOM,
      );
    }
  };

  const updatePatientEvent = async (result, location, element) => {
    const OPNO = result;
    const LocationID = location;
    const formData = {
      OPNO: OPNO,
      LocationID: LocationID,
    };

    const response = await fetch(
      'http://122.185.247.155/Nura_Dummy/eventtran/UpdatePatientLocationWithPreviousCheck',
      {
        method: 'PUT',
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/json',
          Authorization:
            'Bearer ' + userToken.Token + ':' + userToken.StaffName,
        },
        body: JSON.stringify(formData),
      },
    );

    const resJson = await response.json();

    if (resJson && resJson.Code === '1') {
      ToastAndroid.showWithGravity(
        'OUT',
        ToastAndroid.SHORT,
        ToastAndroid.BOTTOM,
      );
      let scanedData =
        patntList &&
        patntList[0] &&
        patntList.filter(ele => ele.Id == element.Id);
      if (scanedData && scanedData[0]) {
        selectPatnt(scanedData[0]);
        navigation.navigate('Report');
      }
    } else {
      ToastAndroid.showWithGravity(
        resJson.Result,
        ToastAndroid.SHORT,
        ToastAndroid.BOTTOM,
      );
    }
  };

  const onItemSelect = index => {
    setVisible(false);
    signOut();
  };

  const renderToggleButton = () => (
    <Button appearance="ghost" onPress={() => setVisible(true)}>
      {userToken.StaffName}
    </Button>
  );

  return (
    <View style={styles.container}>
      <View
        style={{
          flexDirection: 'row',
          justifyContent: 'space-between',
          marginBottom: 20,
        }}>
        <Text style={styles.headline}>Guests</Text>
        <Text
          style={{
            fontSize: 22,
            marginTop: 20,
            marginBottom: 10,
            paddingHorizontal: 20,
          }}>
          {userToken ? userToken.StaffName : null}
        </Text>
        {/* <Layout style={{ fontSize: 22, marginTop: 15 }} level='1'>
                    <OverflowMenu
                        anchor={renderToggleButton}
                        visible={visible}
                        // selectedIndex={selectedIndex}
                        onSelect={onItemSelect}
                        onBackdropPress={() => setVisible(false)}
                    >
                        <MenuItem title='Logout' />
                    </OverflowMenu>
                </Layout> */}
      </View>
      <ScrollView
        style={styles.container}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }>
        {refreshing ? (
          <View>
            <Text style={{textAlign: 'center'}}>Refreshing ...</Text>
          </View>
        ) : patntList && patntList[0] ? (
          <CustomCard
            cardList={patntList}
            navigation={navigation}
            selectPatnt={selectPatnt}
          />
        ) : (
          <View style={{}}>
            <Text style={{textAlign: 'center', fontSize: 18}}>No Record</Text>
          </View>
        )}
      </ScrollView>
      <Scanner onRead={onRead} qrManual={qrManual} toggleQr={toggleQr} />
      <QrScanner
        onRead={onRead}
        qrScannerFlag={qrScannerFlag}
        toggleQrScannerFlag={toggleQrScannerFlag}
      />

      <TouchableOpacity
        onPress={() => {
          signOut();
        }}
        style={styles.fabLogout}>
        {/* <Icon size={40} name="sign-out" color="#01a699" /> */}
        <Entypo name='log-out' style={{color: '#01a699', fontSize: 50}} />
      </TouchableOpacity>
      <TouchableOpacity
        onPress={() => {
          toggleQr();
        }}
        style={styles.fabScanManual}>
        <Icon size={40} name="pencil" color="#01a699" />
      </TouchableOpacity>
      <TouchableOpacity
        onPress={() => {
          toggleQrScannerFlag();
        }}
        style={styles.fabQr}>
        <Icon size={40} name="qrcode" color="#01a699" />
      </TouchableOpacity>
    </View>
  );
};

function mapStateToProps(state) {
  return {
    isLoading: state.homeReducer.isLoading,
    patntList: state.homeReducer.patntList,
    userToken: state.loginReducer.userToken,
  };
}
function bindAction(dispatch) {
  return {
    signOut: () => {
      AsyncStorage.removeItem('userToken');
      dispatch({type: 'SIGN_OUT'});
    },
    fetchPatntSuccess: payload => {
      dispatch({type: 'PATIENTS_FETCH_SUCCESS', payload});
    },
    selectPatnt: payload => {
      dispatch({type: 'SELECT_PATIENT', payload});
    },
  };
}
export default connect(mapStateToProps, bindAction)(HomeScreen);

export const homeReducer = function (
  state = {
    isLoading: true,
    patntList: [],
  },
  action,
) {
  switch (action.type) {
    case 'PATIENTS_FETCH_SUCCESS':
      return {
        ...state,
        patntList: action.payload,
        isLoading: false,
      };
    default:
      return {
        ...state,
      };
  }
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    // backgroundColor: '#F5FCFF',
    backgroundColor: 'white',
  },
  headline: {
    textAlign: 'left',
    fontWeight: 'bold',
    fontSize: 22,
    marginTop: 20,
    marginBottom: 10,
    paddingHorizontal: 20,
  },
  fabQr: {
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    width: 70,
    position: 'absolute',
    bottom: 10,
    right: 10,
    height: 70,
    backgroundColor: '#fff',
    borderRadius: 100,
  },
  fabLogout: {
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    width: 70,
    position: 'absolute',
    bottom: 170,
    right: 10,
    height: 70,
    backgroundColor: '#fff',
    borderRadius: 100,
  },
  fabScanManual: {
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    width: 70,
    position: 'absolute',
    bottom: 90,
    right: 10,
    height: 70,
    backgroundColor: '#fff',
    borderRadius: 100,
  },
});

function Scanner({onRead, qrManual, toggleQr}) {
  const [value, setValue] = React.useState('');

  const onSuccess = e => {
    if (e) {
      setValue('');
      toggleQr();
      onRead(e);
    } else {
      ToastAndroid.showWithGravity(
        'Enter OP NO.',
        ToastAndroid.SHORT,
        ToastAndroid.BOTTOM,
      );
    }
  };

  return (
    <>
      <Modal
        visible={qrManual}
        onRequestClose={() => {
          toggleQr();
        }}>
        <SafeAreaView>
          {/* <QRCodeScanner
                        reactivateTimeout={1000}
                        onRead={onSuccess}
                        flashMode={RNCamera.Constants.FlashMode.off}
                        // cameraProps={{useCamera2Api: true}}
                    /> */}
          <View style={{height: '100%', padding: 25}}>
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                marginTop: 20,
              }}>
              <KittenText category="p1">
                Update the patients events manually.
              </KittenText>
            </View>
            <View style={{marginTop: 15}}>
              <Input
                label="OP No."
                placeholder="Place your Text"
                value={value}
                onChangeText={nextValue => setValue(nextValue)}
              />
            </View>
            <View style={{marginTop: 15, alignItems: 'flex-start'}}>
              <Button
                style={{fontSize: 14, marginBottom: 15}}
                size="small"
                onPress={() => onSuccess(value)}>
                SUBMIT
              </Button>
            </View>
          </View>
        </SafeAreaView>
      </Modal>
    </>
  );
}

function QrScanner({onRead, qrScannerFlag, toggleQrScannerFlag}) {
  const [hasPermission, setHasPermission] = useState(null);
  const [scanned, setScanned] = useState(false);

  useEffect(() => {
    setScanned(false)
    const getBarCodeScannerPermissions = async () => {
      const {status} = await BarCodeScanner.requestPermissionsAsync();
      setHasPermission(status === 'granted');
    };

    getBarCodeScannerPermissions();
  }, [qrScannerFlag]);

  const handleBarCodeScanned = ({type, data}) => {
    setScanned(true);
    onRead(data);
    toggleQrScannerFlag()
  };

  if (hasPermission === null) {
    return <Text>Requesting for camera permission</Text>;
  }
  if (hasPermission === false) {
    return <Text>No access to camera</Text>;
  }

  return (
    <>
      <Modal
        visible={qrScannerFlag}
        onRequestClose={() => {
          setScanned(false);
          toggleQrScannerFlag();
        }}>
        <SafeAreaView>
          <View style={{height: '100%', padding: 25}}>
            <BarCodeScanner
              onBarCodeScanned={scanned ? undefined : handleBarCodeScanned}
              style={StyleSheet.absoluteFillObject}
            />
          </View>
        </SafeAreaView>
      </Modal>
    </>
  );
}

function CustomCard({onRead, cardList, navigation, selectPatnt}) {
  return (
    <View>
      {cardList.map((item, index) => {
        return (
          <Card
            style={{
              marginBottom: 10,
              shadowColor: 'black',
              shadowOffset: {width: 0, height: 1},
              shadowOpacity: 0.8,
              shadowRadius: 1,
            }}
            key={index}
            onPress={() => {
              selectPatnt(item);
              navigation.navigate('Report');
            }}>
            {/* <Text>{item.Title + ' ' + item.Fname + ' ' + item.Lname}</Text> */}
            {/* <View style={{ flexDirection: 'row', alignItems: 'center' }}> */}
            <KittenText
              style={{fontSize: 17, fontWeight: 'bold'}}
              category="h1">
              {item.Title + ' ' + item.Fname + ' ' + item.Lname}
            </KittenText>
            {/* </View> */}
            <KittenText style={{fontSize: 13}} category="h1">
              {item.Add1 +
                ' ' +
                item.Add2 +
                ' ' +
                item.Place +
                ' ' +
                item.State}
            </KittenText>
            <View style={{flexDirection: 'row', marginVertical: 5}}>
              <KittenText style={{}} category="label">
                {'Mobile: ' + item.Mobile}
              </KittenText>
              <KittenText style={{}} category="label">
                {'                Age: ' + item.Age}
              </KittenText>
            </View>
            <KittenText style={{}} category="label">
              {'Event: ' + item.EventName + ' - ' + item.Otherref1}
            </KittenText>
            <View style={{flexDirection: 'row', marginVertical: 5}}>
              <KittenText style={{}} category="label">
                {'Status: ' + item.LastSubEventStatus}
              </KittenText>
              <KittenText style={{}} category="label">
                {'                Date: ' +
                  moment(item.Startdttm).format('MM/DD/YYYY')}
              </KittenText>
            </View>
            <View
              style={{
                backgroundColor: 'orange',
                padding: 0,
                borderColor: 'black',
                borderWidth: 0.5,
                borderRadius: 2,
                width: '30%',
              }}>
              <KittenText
                style={{
                  fontSize: 10,
                  fontWeight: '700',
                  color: 'white',
                  paddingHorizontal: 7,
                  paddingVertical: 3,
                  textAlign: 'center',
                }}
                category="label">
                {item.LastSubEventName}
              </KittenText>
            </View>
          </Card>
        );
      })}
    </View>
  );
}
