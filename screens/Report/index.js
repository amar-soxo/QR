import React, {useEffect} from 'react';
import {connect} from 'react-redux';
import {
  SafeAreaView,
  StyleSheet,
  Text,
  StatusBar,
  View,
  ActivityIndicator,
} from 'react-native';
import Timeline from 'react-native-timeline-flatlist';
import moment from 'moment';

import {Card, Text as KittenText} from '@ui-kitten/components';

const ReportScreen = ({
  patnt,
  userToken,
  isLoading,
  updatePatient,
  subEventUpdate,
  locations,
  subEvents,
}) => {
  useEffect(() => {
    const bootstrapAsync = async () => {
      const response = await fetch(
        `https://blrffdkhportal.nura-in.com/Nura_Dummy/eventtran/Get?id=${patnt.Id}&mode=ff`,
        {
          method: 'GET',
          headers: {
            Accept: 'application/json',
            'Content-Type': 'application/json',
            Authorization:
              'Bearer ' + userToken.Token + ':' + userToken.StaffName,
          },
        },
      );

      const resJson = await response.json();
      if (resJson && resJson.Code === '1' && resJson.Message === 'SUCCESS') {
        updatePatient(resJson.Result);
      }
      const timeLineRes = await fetch(
        `https://blrffdkhportal.nura-in.com/Nura_Dummy/eventtran/GetSubEvents?Mode=OPNO&No=${patnt.Otherref1}`,
        {
          method: 'GET',
          headers: {
            Accept: 'application/json',
            'Content-Type': 'application/json',
            Authorization:
              'Bearer ' + userToken.Token + ':' + userToken.StaffName,
          },
        },
      );

      const timeLineResJson = await timeLineRes.json();
      if (
        timeLineResJson &&
        timeLineResJson.Code === '1' &&
        timeLineResJson.Message === 'SUCCESS'
      ) {
        subEventUpdate(timeLineResJson.Result);
      }
    };
    bootstrapAsync();

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" />
      {isLoading && (
        <View style={styles.loadingView}>
          <ActivityIndicator color={'#000'} />
        </View>
      )}

      <SafeAreaView style={styles.safeArea}>
        <Text style={styles.headline}>
          Reports of {patnt.Title + ' ' + patnt.Fname + ' ' + patnt.Lname}
        </Text>

        <Card
          style={{
            marginBottom: 10,
            shadowColor: 'black',
            shadowOffset: {width: 0, height: 1},
            shadowOpacity: 0.8,
            shadowRadius: 1,
            marginHorizontal: 20,
          }}>
          <View style={{flexDirection: 'row'}}>
            <View style={{flexDirection: 'row'}}>
              <KittenText
                style={{fontSize: 15, fontWeight: 'bold'}}
                category="h1">
                Patient ID :
              </KittenText>
              <KittenText style={{marginTop: 3}} category="label">
                {'   '}
                {patnt.Id}
              </KittenText>
            </View>
            <View style={{flexDirection: 'row'}}>
              <KittenText
                style={{fontSize: 15, fontWeight: 'bold'}}
                category="h1">
                {'         '}Status :
              </KittenText>
              <KittenText style={{marginTop: 3}} category="label">
                {'   '}
                {!isLoading && subEvents[subEvents.length - 1].EventStatus.Desc}
              </KittenText>
            </View>
          </View>
          <View style={{flexDirection: 'row'}}>
            <KittenText
              style={{fontSize: 15, fontWeight: 'bold'}}
              category="h1">
              Gender :
            </KittenText>
            <KittenText style={{marginTop: 3}} category="label">
              {'   '}
              {patnt.Gender}
            </KittenText>
          </View>
          <View style={{flexDirection: 'row'}}>
            <KittenText
              style={{fontSize: 15, fontWeight: 'bold'}}
              category="h1">
              Event :
            </KittenText>
            <KittenText style={{marginTop: 3}} category="label">
              {'   '}
              {!isLoading && subEvents[subEvents.length - 1].Subevent.Desc}
            </KittenText>
          </View>
          {/* <Text style={styles.subHead}>
                        {patnt.Gender + ' ' + patnt.Age + ' Years, Patient ID: ' + patnt.Id}
                    </Text> */}
        </Card>
        {!isLoading && (
          <>
            <View style={styles.timeLineView}>
              {/* <Text style={styles.eventHead}>
                                {'Event: ' +
                                    subEvents[subEvents.length - 1].Subevent.Desc +
                                    ', Status: ' +
                                    subEvents[subEvents.length - 1].EventStatus.Desc}
                            </Text> */}
              <Timeline
                data={locations.map((item, index) => {
                  const subEvent = subEvents.find(
                    ele => ele.Location.Id == item.Id,
                  );
                  let desc = subEvent
                    ? `Start: ${
                        subEvent
                          ? moment(subEvent.Startdttm).format(
                              'hh:mm:ss a, MMM DD, dddd',
                            )
                          : '  ,'
                      }`
                    : 'Pending';
                  desc = subEvent
                    ? subEvent.EventStatus.Desc === 'OUT'
                      ? desc +
                        `, End: ${
                          subEvent
                            ? moment(subEvent.Enddttm).format(
                                'hh:mm:ss a, MMM DD, dddd',
                              )
                            : ''
                        }`
                      : desc
                    : desc;
                  let time = subEvent
                    ? subEvent.Enddttm
                      ? subEvent.Startdttm
                        ? moment(subEvent.Enddttm).diff(
                            moment(subEvent.Startdttm),
                            'minutes',
                          )
                        : '0'
                      : '0'
                    : '0';
                  return {
                    time: time + ' min',
                    title: item.SubEvent,
                    description: desc,
                  };
                })}
              />
            </View>
          </>
        )}
      </SafeAreaView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5FCFF',
    backgroundColor: 'white',
  },
  safeArea: {flex: 1},
  timeLineView: {
    flex: 1,
    paddingHorizontal: 20,
  },
  headline: {
    // textAlign: 'center',
    fontWeight: 'bold',
    fontSize: 22,
    marginTop: 10,
    marginBottom: 8,
    paddingHorizontal: 20,
  },
  subHead: {
    // textAlign: 'center',
    fontSize: 14,
    marginBottom: 8,
  },
  eventHead: {
    textAlign: 'center',
    fontWeight: 'bold',
    fontSize: 20,
    marginBottom: 16,
  },
  loadingView: {
    flex: 1,
    justifyContent: 'center',
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
  },
});

function mapStateToProps(state) {
  return {
    isLoading: state.reportReducer.isLoading,
    patnt: state.reportReducer.patnt,
    locations: state.reportReducer.locations,
    subEvents: state.reportReducer.subEvents,
    userToken: state.loginReducer.userToken,
  };
}
function bindAction(dispatch) {
  return {
    updatePatient: payload => {
      dispatch({type: 'UPDATE_PATIENT', payload});
    },
    subEventUpdate: payload => {
      dispatch({type: 'UPDATE_SUB_EVENTS', payload});
    },
  };
}
export default connect(mapStateToProps, bindAction)(ReportScreen);

export const reportReducer = function (
  state = {
    isLoading: true,
    patnt: {},
    patntUpdated: {},
    locations: [],
    subEvents: [],
  },
  action,
) {
  switch (action.type) {
    case 'SELECT_PATIENT':
      return {
        ...state,
        patnt: action.payload,
        isLoading: true,
        patntUpdated: {},
        locations: [],
        subEvents: [],
      };
    case 'UPDATE_PATIENT':
      return {
        ...state,
        patntUpdated: action.payload,
      };
    case 'UPDATE_SUB_EVENTS':
      return {
        ...state,
        locations: action.payload.Locations,
        subEvents: action.payload.SubEvents,
        isLoading: false,
      };
    default:
      return {
        ...state,
      };
  }
};
