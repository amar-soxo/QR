import React, { useState } from 'react';
import { connect } from 'react-redux';

import { Icon, Card, Button, Input, Text as KittenText } from '@ui-kitten/components';

import AsyncStorage from '@react-native-async-storage/async-storage';
import {
    StyleSheet,
    // Text,
    View,
    Image,
    TextInput,
    TouchableOpacity,
    ToastAndroid,
    TouchableWithoutFeedback
} from 'react-native';

const AlertIcon = (props) => (
    <Icon {...props} name='alert-circle-outline' />
);

const LoginScreen = ({ navigation, signIn }) => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');

    const [secureTextEntry, setSecureTextEntry] = React.useState(true);

    const toggleSecureEntry = () => {
        setSecureTextEntry(!secureTextEntry);
    };

    const renderIcon = (props) => (
        <TouchableWithoutFeedback onPress={toggleSecureEntry}>
            <Icon {...props} name={secureTextEntry ? 'eye-off' : 'eye'} />
        </TouchableWithoutFeedback>
    );

    async function login(params) {
        const response = await fetch(
            'http://122.185.247.155/NURA/opreg/validatelogin',
            {
                method: 'POST',
                headers: {
                    Accept: 'application/json',
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    username: email,
                    password: password,
                    // username: 'DP',
                    // password: '123',
                    mode: 'ff',
                }),
            },
        );
        const resJson = await response.json();
        if (resJson.Code === '-1') {
            ToastAndroid.showWithGravity(
                resJson.Message,
                ToastAndroid.SHORT,
                ToastAndroid.BOTTOM,
            );
            await AsyncStorage.removeItem('userToken');
        } else if (resJson.Code === '1') {
            ToastAndroid.showWithGravity(
                'User Signed In',
                ToastAndroid.SHORT,
                ToastAndroid.BOTTOM,
            );
            signIn(resJson.Result);
            await AsyncStorage.setItem('userToken', JSON.stringify(resJson.Result));
        }
    }
    return (
        <View style={styles.container}>
            <Card style={{ width: 280, height: 100 }}>
                <Image style={styles.image} source={require('../../assets/logo2.png')} />
            </Card>

            <View style={{ marginVertical: 20 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                    <KittenText style={{ fontSize: 32 }} category='h1'>Login</KittenText>
                </View>
                <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 20 }}>
                    <KittenText style={styles.text} category='p1'>All the guest records on your phone, easy !</KittenText>
                </View>
            </View>

            <View style={styles.inputView}>
                {/* <TextInput
                    style={styles.TextInput}
                    placeholder="Email."
                    placeholderTextColor="#003f5c"
                    onChangeText={(txt) => setEmail(txt)}
                /> */}
                <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
                    <KittenText style={{ fontSize: 14 }} category='label'>Username</KittenText>
                </View>
                <Input
                    placeholder='Enter Username'
                    value={email}
                    onChangeText={nextValue => setEmail(nextValue)}
                />
            </View>

            <View style={styles.inputView}>
                {/* <TextInput
                    style={styles.TextInput}
                    placeholder="Password."
                    placeholderTextColor="#003f5c"
                    secureTextEntry={true}
                    onChangeText={(txt) => setPassword(txt)}
                /> */}
                <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
                    <KittenText style={{ fontSize: 14 }} category='label'>Password</KittenText>
                </View>
                {/* <Input
                    placeholder='Enter Password'
                    value={password}
                    onChangeText={nextValue => setPassword(nextValue)}
                /> */}
                <Input
                    value={password}
                    placeholder='Enter Password'
                    accessoryRight={renderIcon}
                    captionIcon={AlertIcon}
                    secureTextEntry={secureTextEntry}
                    onChangeText={nextValue => setPassword(nextValue)}
                />
            </View>

            {/* <TouchableOpacity
                style={styles.loginBtn}
                onPress={() => {
                    login({ email, password });
                }}>
                <Text style={styles.loginText}>LOGIN</Text>
            </TouchableOpacity> */}
            <Button
                style={styles.loginBtn}
                size='small'
                onPress={() => {
                    login({ email, password });
                }}
            >
                LOGIN
            </Button>
            <View style={{ marginTop: 20 }}>
                <KittenText style={{ textAlign: 'center', fontSize: 12 }} category='p1'>Version 1.4</KittenText>
            </View>
        </View>
    );
};

function bindAction(dispatch) {
    return {
        signIn: (user) => {
            dispatch({ type: 'SIGN_IN', user });
        },
    };
}

export default connect(null, bindAction)(LoginScreen);

export const loginReducer = function (
    state = {
        isLoading: true,
        isSignout: false,
        userToken: null,
    },
    action,
) {
    switch (action.type) {
        case 'RESTORE_TOKEN':
            return {
                ...state,
                userToken: action.user,
                isLoading: false,
            };
        case 'SIGN_IN':
            return {
                ...state,
                isSignout: false,
                userToken: action.user,
            };
        case 'SIGN_OUT':
            return {
                ...state,
                isSignout: true,
                userToken: null,
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
        backgroundColor: '#fff',
        padding: 20
        // alignItems: 'center',
        // justifyContent: 'center',
    },

    image: {
        width: '100%',
        height: '87%'
        // marginBottom: 40,
    },

    inputView: {
        // backgroundColor: '#b3ddff',
        borderRadius: 30,
        // width: '70%',
        height: 45,
        marginBottom: 20,
        // alignItems: 'center',
    },

    TextInput: {
        height: 50,
        flex: 1,
        padding: 10,
        marginLeft: 20,
    },

    forgot_button: {
        height: 30,
        marginBottom: 30,
    },

    loginBtn: {
        // width: '80%',
        // borderRadius: 25,
        height: 40,
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: 40,
        backgroundColor: '#40a9ff',
    },
});
