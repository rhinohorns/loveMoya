/**
 * Sample React Native App
 * https://github.com/facebook/react-native
 *
 * @format
 * @flow
 */

import React, {Component} from 'react';
import {Platform, StyleSheet, Text, View, Image, TextInput, Alert, TouchableHighlight, TouchableNativeFeedback,
  TouchableOpacity, FlatList, SectionList, ScrollView, ActivityIndicator, RefreshControl, DatePickerAndroid} from 'react-native';
import jsSHA from 'jssha';
import PouchDB from 'pouchdb-react-native';
import moment from 'moment';
import {Button, Icon} from 'react-native-elements';

//交通開放資料檔頭
const getAuthorizationHeader = function() {
	var AppID = 'FFFFFFFF-FFFF-FFFF-FFFF-FFFFFFFFFFFF';
	var AppKey = 'FFFFFFFF-FFFF-FFFF-FFFF-FFFFFFFFFFFF';

	var GMTString = new Date().toGMTString();
	var ShaObj = new jsSHA('SHA-1', 'TEXT');
	ShaObj.setHMACKey(AppKey, 'TEXT');
	ShaObj.update('x-date: ' + GMTString);
	var HMAC = ShaObj.getHMAC('B64');
	var Authorization = 'hmac username=\"' + AppID + '\", algorithm=\"hmac-sha1\", headers=\"x-date\", signature=\"' + HMAC + '\"';

	return { 'Authorization': Authorization, 'X-Date': GMTString};
}

//type Props = {};
export default class MrtPrice extends Component {
  constructor(props) {
    super(props);
    this.state = {
      text: '',
      mrtDestinationStation: '',
      isMrtLoading: false,
    };
  }

  // 取得網路捷運資料
  _getBusData() {
    this.setState({
      isMrtLoading: true,
    });
    
    // return fetch('http://data.ntpc.gov.tw/od/data/api/245793DB-0958-4C10-8D63-E7FA0D39207C?$format=json')
    return fetch('https://ptx.transportdata.tw/MOTC/v2/Rail/Metro/ODFare/TRTC?$select=OriginStationName%2CDestinationStationName%2CFares&$filter=OriginStationName%2FZh_tw%20eq%20%27%E5%BA%9C%E4%B8%AD%27&$format=JSON',{
      headers: getAuthorizationHeader(),
    })
    .then((response) => response.json())
    .then((responseJson) => {
      this.setState({
        isMrtLoading: false,
        busDataSource: responseJson,
      });
    })
    .catch((error) => {
      console.error(error);
    });
  }

  // 顯示捷運資料
  _showBusData() {
    if(this.state.isMrtLoading || this.state.busDataSource === undefined){
      return(
        <ActivityIndicator style={{alignSelf: 'stretch', flex: 1}} />
      );
    } else {
      let mrtData =[];
      let oriData = this.state.busDataSource;
      let mrtStation = this.state.mrtDestinationStation;

      for(let i=0 ; i < oriData.length ; i++ ){
        let price = 0;
        for( let j=0 ; j < oriData[i].Fares.length ; j++){
          let fare = oriData[i].Fares[j];
          if(fare.TicketType === 1 && fare.FareClass === 1){
            price = fare.Price;
          }
        }
        if (mrtStation === '' || oriData[i].DestinationStationName.Zh_tw.indexOf(mrtStation) >= 0) {
          mrtData.push({
            OriginStationName: oriData[i].OriginStationName.Zh_tw,
            DestinationStationName: oriData[i].DestinationStationName.Zh_tw, 
            Price: price,
          });
        }
      }

      return(
        <FlatList
            data={mrtData}
            renderItem={this._renderMrtPrice}
            keyExtractor={(item, index) => index.toString()}
            style={{alignSelf: 'stretch'}}
            refreshControl={
              <RefreshControl 
                refreshing={this.state.isMrtLoading}
                onRefresh={() => this._getBusData()}
              />
            }
        />
      );
    }
  }
  
  // 捷運列表格式
  _renderMrtPrice({item}) {
    return(
      <View style={styles.container_mrt}>
        <View style={[styles.itemView, styles.firstItemView]}>
          <Text style={styles.item}>{item.OriginStationName}</Text>
        </View>
        <View style={styles.itemView}>
          <Text style={styles.item}>{item.DestinationStationName}</Text>
        </View>
        <View style={styles.itemView}>
          <Text style={styles.item}>{item.Price}</Text>
        </View>
      </View>
    );
  }

  // 輸入迄站站名查詢票價
  _searchMrtPrice(stationName) {
    this.setState({
      mrtDestinationStation: stationName,
    });
    this._showBusData();
  }

  // 日期挑選對話框
  _showDatePicker = async() => {
    try {
      const {action, year, month, day} = await DatePickerAndroid.open({
        date: new Date()
      });
      if (action !== DatePickerAndroid.dismissedAction) {
        this.setState({
          PEI_expDate: new Date(year, month, day)
        });  
      }
    } catch ({code, message}) {
      console.warn('Cannot open date picker', message);
    }
  }

  _onPressButton(text) {
    Alert.alert(text);
  }

  // 起始異步作業
  componentDidMount() {
    this._getBusData();
  }

  render() {
    return (
      <View style={{flex: 1}}>
        <View style={styles.container}>
          <Text style={styles.welcome}>我愛小茉茉</Text>
        </View>

        <View style={{flexDirection: 'row', flex: 1}}>
          <View style={styles.container_2}>
            <TouchableNativeFeedback 
              onPress={() => this._onPressButton('我是小QQ哦！')}
              background={Platform.OS === 'android' ? TouchableNativeFeedback.SelectableBackground() : ''}
            >
              <Image 
                source={require('./img/deqma_0.png')}
                style={styles.QQimg}
              />
            </TouchableNativeFeedback>
          </View>
          <View style={[styles.container_2, {flex: 2}]}>
            <TextInput
                placeholder='請輸入迄站站名…'
                onChangeText={(text) => this._searchMrtPrice(text)}
                style={{height: 40, width: 250, fontSize: 16}}
            />
          </View>
        </View>

        <View style={styles.container_4_1}>
          <View style={styles.container_mrt}>
            <View style={{flex: 1}}>
              <Text style={styles.sectionHeader}>起站</Text>
            </View>
            <View style={{flex: 1}}>
              <Text style={styles.sectionHeader}>迄站</Text>
            </View>
            <View style={{flex: 1}}>
              <Text style={styles.sectionHeader}>價錢</Text>
            </View>
          </View>
          {
            /* 顯示由網上取得之捷運資料 */
            this._showBusData()
          }  
        </View>
        
        <View style={styles.container_3}>
          <Button 
            raised
            icon={{name: 'replay'}}
            title='票價更新'
            backgroundColor='#915c8b'
            onPress={() => this._getBusData()}
            buttonStyle={{
              height: 35,
            }}
          />
        </View>
      </View>
    );
  }
}

/*
        <View style={styles.container_4_2}>
          {
            this._showMovieData()
          }
        </View>

        <View style={styles.container_4_1}>  
          <SectionList
            sections={[
              {title: '犀', data: ['犀角']},
              {title: '茉', data: ['茉茉茉', '茉茉姬', '茉莉の', '茉茉の', '茉茉', '茉莉', '茉小茉']},
            ]}
            renderItem={({item}) => <Text style={styles.item}>{item}</Text>}
            renderSectionHeader={({section}) => <Text style={styles.sectionHeader}>{section.title}</Text>}
            keyExtractor={(item, index) => index.toString()}
            style={{alignSelf: 'stretch'}}
          />
        </View>

        <TouchableNativeFeedback 
          onPress={this._showDatePicker.bind(this)}
          background={Platform.OS === 'android' ? TouchableNativeFeedback.SelectableBackground() : ''}
          >
          <View style={styles.button}>
            <Image 
              source={require('./img/icon_today.png')}
              style={{width: 18, height: 18, margin: 5,}}
            />
          </View>
        </TouchableNativeFeedback>

        <TouchableHighlight onPress={() => this._getMovieData()} underlayColor='white'>
          <View style={styles.button}>
            <Text style={styles.buttonText}>重整電影</Text>
          </View>
        </TouchableHighlight>
*/

const styles = StyleSheet.create({
  container: {
    height: 50,
    justifyContent: 'center',
    backgroundColor: '#d3cfd9',
    alignItems: 'center',
  },
  container_2: {
    flex: 1,
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
  },
  container_3: {
    height: 60,
    flexDirection: 'row',
    backgroundColor: '#d3cfd9',
    justifyContent: 'center',
    alignItems: 'center',
  },
  container_4_1: {
    flex: 3,
    backgroundColor: '#fafafa',
    justifyContent: 'flex-start',
    alignItems: 'center',
  },
  container_4_2: {
    flex: 3,
    backgroundColor: '#fafafa',
    justifyContent: 'center',
    alignItems: 'center',
  },
  welcome: {
    fontSize: 20,
    textAlign: 'center',
    margin: 10,
  },
  instructions: {
    textAlign: 'center',
    color: '#333333',
    marginBottom: 5,
  },
  labelText: {
    textAlign: 'left',
    color: '#000',
    marginTop: 10,
    fontSize: 15,
  },
  QQimg: {
    width: 90,
    height: 90,
    marginTop: 10,
    resizeMode: Image.resizeMode.conver,
  },
  button: {
    flexDirection: 'row',
    marginLeft: 15,
    alignItems: 'center',
    backgroundColor: '#915c8b',
  },
  buttonText: {
    color: '#FFF',
    paddingTop: 8,
    paddingBottom: 8,
    paddingLeft: 15,
    paddingRight: 15,
  },
  buttonTextWithIcon: {
    color: '#FFF',
    paddingTop: 8,
    paddingBottom: 8,
    paddingRight: 15,
  },
  itemView: {
    flex: 1,
  },
  firstItemView: {
    borderLeftWidth: 3,
    borderLeftColor: '#e6cde3',
  },
  item: {
    paddingLeft: 10,
    fontSize: 16,
    height: 30,
  },
  sectionHeader: {
    paddingTop: 5,
    paddingLeft: 10,
    paddingRight: 10,
    paddingBottom: 5,
    fontSize: 14,
    fontWeight: 'bold',
    backgroundColor: '#d4dcd6',
  },
  container_mrt: {
    flexDirection: 'row',
    backgroundColor: '#fcfcfc',
    justifyContent: 'center',
    alignItems: 'center',
  },
});
