/**
 * Sample React Native App
 * https://github.com/facebook/react-native
 *
 * @format
 * @flow
 */

import React, {Component} from 'react';
import {Text, Platform, StyleSheet, View, Image,
   TextInput, Alert, DatePickerAndroid, FlatList, 
   TouchableHighlight, TouchableNativeFeedback, ScrollView} from 'react-native';
import PouchDB from 'pouchdb-react-native';
import moment from 'moment';
import {Button, Icon, Header, Divider, ButtonGroup, Card} from 'react-native-elements';
import ActionButton from 'react-native-action-button';
import {Item, Input, SwipeRow, Picker} from 'native-base';
import PopupDialog, {ScaleAnimation, DialogTitle} from 'react-native-popup-dialog';
import PushNotification from 'react-native-push-notification';
import ImagePicker from 'react-native-image-crop-picker';
import RNFS from 'react-native-fs';
import hashtagRegex from 'hashtag-regex';
import {WheelPicker} from 'react-native-wheel-picker-android';

// 資料庫 (PouchDB
const memberDB = new PouchDB('deqmaMember');

// 色彩
const priColor = {
  main: '#8ca3cb',
  mainRGBA: 'rgba(140,163,203,1)',
  light: '#bdd4fe',
  lightRGBA: 'rgba(189,212,254,1)',
  dark: '#5d749a',
  darkRGBA: 'rgba(93,116,154,1)',
}
const secColor = {
  main: '#eec4c3',
  mainRGBA: 'rgba(238,196,195,1)',
  light: '#fff7f6',
  lightRGBA: 'rgba(255,247,246,1)',
  dark: '#bb9393',
  darkRGBA: 'rgba(187,147,147,1)',
}
const dividerColor = '#d9d5dc';

// 寵物種類表
const petSpeciesList = [
  {species: 'dog', name: '狗'},
  {species: 'cat', name: '貓'},
  {species: 'other', name: '其它'}
];

// 寵物性別表
const petSexList = ['male', 'female'];

// 寵物生活係數表
/*
const PetStatusCoef = [
  {status:'normal_noG', coef: '1.6', desc: '一般已結育'},
  {status:'normal_hasG', coef: '1.8', desc: '一般未結育'},
  {status:'fat_mild', coef: '1.4', desc: '輕度減重期'},
  {status:'fat_moderate', coef: '1.3', desc: '中度減重期'},
  {status:'fat_severe', coef: '1', desc: '重度減重期'},
  {status:'exercise_mild', coef: '2', desc: '活動量稍多'},
  {status:'exercise_moderate', coef: '3', desc: '活動量多'},
  {status:'exercise_severe', coef: '6', desc: '活動量劇烈'},
  {status:'growth_less50', coef: '3', desc: '體重不滿標準成犬量的 50%'},
  {status:'growth_50to80', coef: '2.3', desc: '體重達成犬量的 51% 至 80%'},
  {status:'growth_80to100', coef: '1.9', desc: '體重達成犬量的 80% 至 99% '},
]
*/

const dogPetStatusCoef = [
  {status:'normal_noG', coef: '1.6', desc: '一般已結育'},
  {status:'normal_hasG', coef: '1.8', desc: '一般未結育'},
  {status:'fat_mild', coef: '1.4', desc: '輕度減重期'},
  {status:'fat_moderate', coef: '1.3', desc: '中度減重期'},
  {status:'fat_severe', coef: '1', desc: '重度減重期'},
  {status:'exercise_mild', coef: '2', desc: '活動量稍多'},
  {status:'exercise_moderate', coef: '3', desc: '活動量多'},
  {status:'exercise_severe', coef: '6', desc: '活動量劇烈'},
  {status:'growth_less50', coef: '3', desc: '體重不滿標準成犬量的 50%'},
  {status:'growth_50to80', coef: '2.3', desc: '體重達成犬量的 51% 至 80%'},
  {status:'growth_80to100', coef: '1.9', desc: '體重達成犬量的 80% 至 99% '},
]

const catPetStatusCoef = [
  {status:'normal_noG', coef: '1.2', desc: '一般已結育'},
  {status:'normal_hasG', coef: '1.4', desc: '一般未結育'},
  {status:'child', coef: '2.5', desc: '幼貓'},
  {status:'fat_mild', coef: '1.0', desc: '成貓低活動量'},
  {status:'fat_moderate', coef: '0.9', desc: '中度減重期'},
]

// 對話視窗動畫模式
const scaleAnimation = new ScaleAnimation();

//type Props = {};
export default class MemberAdd extends Component {
  constructor(props) {
    super(props);
    let memberId = this.props.navigation.getParam('memberId');
    //let isEdittingMember = memberId === '' ? false : true ;
    
    this.state = {
      pet_tmp_onePet: this.props.navigation.getParam('onePet'),
      pet_species_selIndex: 0,
      pet_sex_selIndex: 0,
      pet_statusCoef: 'normal_noG',
      pet_tmp_statusCoef: 0,
      pet_statusCoef_Position: 0,
      pet_statusCoefPosition: 0,
      pet_needPerDay: {
        DER: 0,
        waterMin: 0, waterMax: 0,
        proteinBasic: 0, proteinMin: 0, proteinMax: 0,
        fatBasic: 0, fatMin: 0, fatMax: 0,
        starchMin: 0, starchMax: 0
      },
      member_Id: memberId,
      isShowTagPicker_Desc: false,
      isShowTagPicker_Location: false,
      isShowTagPicker_Contect: false,
      dataSource: [],
      hashTagsKeyword: '',
      hashTagsOriData:  this.props.navigation.getParam('hashTags'),
      hashTagsPickerData: [],
      isShowTagPicker: false,
      tmp_string: '',
    };
    //this.notifi_configure(this.notifi_onNotif);
    //this.notifi_LastId = 0;
    this.petSpeciesUpdateIndex = this.petSpeciesUpdateIndex.bind(this);
    this.petSexUpdateIndex = this.petSexUpdateIndex.bind(this);
  }
  
  // 寵物種類 ButtonGroup 用
  petSpeciesUpdateIndex(speciesSelIndex) {
    this.setState({
      pet_species_selIndex: speciesSelIndex
    });
  }

  // 寵物性別 ButtonGroup 用
  petSexUpdateIndex(sexSelIndex) {
    this.setState({
      pet_sex_selIndex: sexSelIndex
    });
  }

  notifi_configure(onNotification, gcm = "") {
    PushNotification.configure({
      onNotification: onNotification,
      senderID: gcm,
      popInitialNotification: true,
    });
  }

  notifi_onNotif(notif) {
    //console.log(notif);
    //Alert.alert(notif.title, notif.message);
  }

  notifi_handlePerm(perms) {
    Alert.alert("Permissions", JSON.stringify(perms));
  }

  notifi_checkPermission(cbk) {
    return PushNotification.checkPermissions(cbk);
  }

  notifi_cancelNotif() {
    PushNotification.cancelLocalNotifications({id: ''+this.lastId});
  }

  notifi_cancelAll() {
    PushNotification.cancelAllLocalNotifications();
  }

  // 日期挑選對話框
  _showDatePicker = async(whoCall, setDate = new Date()) => {
    try {
      const {action, year, month, day} = await DatePickerAndroid.open({
        date: setDate
      });
      if (action !== DatePickerAndroid.dismissedAction) {
        if (whoCall === 'memberDate') {
          this.setState({
            member_Date: new Date(year, month, day),
            isMemberDateNull: false,
          });
        }
      }
    } catch ({code, message}) {
      console.warn('Cannot open date picker', message);
    }
  }

  ////////////////////////////////////////////////////////// 工具 ///////////////////////////////

  // hashtag 選擇器過濾及顯示判定
  _doHashtagMatch(val, fcousWho = '') {
    const tagRegex = hashtagRegex();
    let match;
    let hashtagsText = '';
    let lastHashTag = '';
    while (match = tagRegex.exec(val)) {
      const hashTag = match[0];
      //hashtagsText += hashTag + ', ';
      lastHashTag = hashTag;
    }

    this.setState({
      hashTagsKeyword: lastHashTag
    })

    let isShowTagPicker = false;
    if (val.lastIndexOf("#") === val.length - 1 && val !== '') {
      isShowTagPicker = true;
    } else {
      isShowTagPicker = false;
    }
    
    if (lastHashTag !== '' && !isShowTagPicker) {
      let lastHashTagLen = lastHashTag.length;
      let lastSameLenWord = val.substr(val.length - lastHashTagLen);
      if (lastHashTag === lastSameLenWord) {
        isShowTagPicker = true;
              
        let data = [];
        data = this.state.hashTagsOriData.filter((value) => {
          return value.tag.indexOf(lastHashTag) === 0;
        });

        /*
        for (let i=0 ; i < this.state.oriData.length ; i++) {
          if (this.state.oriData[i].tag.indexOf(lastHashTag) === 0) {
            data.push(this.state.oriData[i])
          }
        }
        */

        this.setState({
          hashTagsPickerData: data,
        })

        if (data.length === 0) {
          isShowTagPicker = false;
        }
      }
    } else {
      this.setState({
        hashTagsPickerData: this.state.hashTagsOriData,
      })
    }

    //Alert.alert(isShowTagPicker ? 'true' : 'false');

    const setState_strategies = {
      'memberDesc': (val, isShowTagPicker) => {
        this.setState({
          member_Desc: val,
          isShowTagPicker_Desc: isShowTagPicker,
          isShowTagPicker_Location: false,
          isShowTagPicker_Contect: false,
        })
      },
      'memberLocation': (val, isShowTagPicker) =>{
        this.setState({
          member_Location: val,
          isShowTagPicker_Location: isShowTagPicker,
          isShowTagPicker_Contect: false,
          isShowTagPicker_Desc: false,
        })
      },
      'memberContect': (val, isShowTagPicker) =>{
        this.setState({
          member_Contect: val,
          isShowTagPicker_Contect: isShowTagPicker,
          isShowTagPicker_Location: false,
          isShowTagPicker_Desc: false,
        })
      }
    }
    setState_strategies[fcousWho](val, isShowTagPicker);

    /*
    switch (fcousWho) {
      case 'memberDesc':
        this.setState({
          member_Desc: val,
        })
        break;
      case 'memberLocation':
        this.setState({
          member_Location: val,
        })
        break;
      case 'memberContect':
        this.setState({
          member_Contact: val,
        })
        break;
    }
    */

    /*
    switch (fcousWho) {
      case 'memberDesc':
        this.setState({
          isShowTagPicker_Desc: isShowTagPicker,
          isShowTagPicker_Location: false,
          isShowTagPicker_Contect: false,
        })
        break;
      case 'memberLocation':
        this.setState({
          isShowTagPicker_Location: isShowTagPicker,
          isShowTagPicker_Contect: false,
          isShowTagPicker_Desc: false,
        })
        break;
      case 'memberContect':
        this.setState({
          isShowTagPicker_Contect: isShowTagPicker,
          isShowTagPicker_Location: false,
          isShowTagPicker_Desc: false,
        })
        break;
    }
    */
  }

  // 選擇 hashtag
  _onPressTagPicker(tag, fcousWho = ''){
    let value;
    let oriValue;

    if (this.state.isShowTagPicker_Desc) {fcousWho='memberDesc'};
    if (this.state.isShowTagPicker_Location) {fcousWho='memberLocation'};
    if (this.state.isShowTagPicker_Contect) {fcousWho='memberContect'};

    switch (fcousWho) {
      case 'memberDesc':
        oriValue = this.state.member_Desc;
        break;
      case 'memberLocation':
        oriValue = this.state.member_Location;
        break;
      case 'memberContect':
        oriValue = this.state.member_Contact;
        break;
    }

    if (oriValue.lastIndexOf("#") === oriValue.length - 1) {
      value = oriValue.substr(0, oriValue.length - 1) + tag;
    } else {
    value = oriValue.substr(0, oriValue.length - this.state.hashTagsKeyword.length) + tag;
    }

    switch (fcousWho) {
      case 'memberDesc':
        this.setState({
          member_Desc: value,
          isShowTagPicker_Desc: false,
        })
        this._DescInput._root.focus();
        break;
      case 'memberLocation':
        this.setState({
          member_Location: value,
          isShowTagPicker_Location: false,
        })
        this._LocationInput._root.focus();
        break;
      case 'memberContect':
        this.setState({
          member_Contact: value,
          isShowTagPicker_Contect: false,
        })
        this._ContactInput._root.focus();
        break;
    }
  }

  /////////////////////////////////////////////////// 寵物 ///////////////////////////////

  // 寵物狀態一行秀格式
  _renderOnePetStatus(item) {
    // 性別顯示處理
    let gender = item.sex === 'male' ? 'gender-male' : 'gender-female';
    let genderColor = item.sex === 'male' ? priColor.dark : secColor.dark;

    // 種類顯示處理
    let species = petSpeciesList.find((element) => {
      return element.species === item.species;
    })
    let speciesText = species.name;

    // 歲數顯示處理
    let old_year = 0;
    let old_month = 0;
    let oldMonthText = '';
    if (item.oldMonth > 12) {
      old_year = parseInt(item.oldMonth / 12);
      old_month = item.oldMonth % 12;
      oldMonthText = old_year.toString() + ' 歲 ' + (old_month !== 0 ? old_month.toString() + ' 個月' : '');
    } else {
      oldMonthText = item.oldMonth.toString() + ' 個月';
    }

    return (
      <View style={{flexDirection: 'row', alignContent: 'center'}}>
        <Icon
          name={gender}
          type='material-community'
          color={genderColor}
          size={20}
          containerStyle={{paddingLeft: 5}}
        />
        <Text style={styles.item}>{speciesText}</Text>
        <Icon
          name='date-range'
          color='#555'
          size={17}
          containerStyle={{paddingLeft: 5}}
        />
        <Text style={styles.item}>{oldMonthText}</Text>
        <Icon
          name='scale' 
          type='material-community'
          color='#555'
          size={17}
          containerStyle={{paddingLeft: 5}}
        />
        <Text style={styles.item}>{item.weight.toString()} 公斤</Text>
      </View>
    );
  }

  //////////////////////////////////////////////////////// 各類寵物計算 ///////////////////////////
  
  // 計算毛孩每日所需
  _calDogFood() {
    const RER_strategies = {
      '2to45': (weight) => {
        return 30 * weight + 70;
      },
      'less2over45': (weight) => {
        return (weight ** 0.75) * 70;
      }
    }

    const NeedPerDay_strategies = {
      'dog' : (weight, DER) => {
        return {
          proteinBasic: Math.round(weight * 4.8 * 10) / 10, 
          proteinMin: Math.round(DER * 0.18 / 3.5 * 10) / 10,
          proteinMax: Math.round(DER * 0.35 / 3.5 * 10) / 10,
          fatBasic: Math.round(weight * 1.1 * 10) / 10,
          fatMin: Math.round(DER * 0.35 / 8.5 * 10) / 10,
          fatMax: Math.round(DER * 0.65 / 8.5 * 10) / 10,
          starchMin: Math.round(DER * 0.1 / 3.5 * 10) / 10,
          starchMax: Math.round(DER * 0.45 / 3.5 * 10) / 10,

        }
      },
      'cat' : (weight, DER) => {
        return {
          proteinBasic: Math.round(weight * 7 * 10) / 10, 
          proteinMin: Math.round(DER * 0.18 / 3.5 / 4.8 * 7 * 10) / 10,
          proteinMax: Math.round(DER * 0.35 / 3.5 / 4.8 * 7 * 10) / 10,
          fatBasic: Math.round(weight * 2.2 * 10) / 10,
          fatMin: Math.round(DER * 0.35 / 8.5 / 1.1 * 2.2 * 10) / 10,
          fatMax: Math.round(DER * 0.65 / 8.5 / 1.1 * 2.2 * 10) / 10,
          starchMin: 0,
          starchMax: Math.round(DER * 0.1 / 3.5 * 10) / 10,
        }
      },
      'other' : (weight, DER) => {
        return {
          proteinBasic: Math.round(weight * 7 * 10) / 10, 
          proteinMin: Math.round(DER * 0.18 / 3.5 / 4.8 * 7 * 10) / 10,
          proteinMax: Math.round(DER * 0.35 / 3.5 / 4.8 * 7 * 10) / 10,
          fatBasic: Math.round(weight * 2.2 * 10) / 10,
          fatMin: Math.round(DER * 0.35 / 8.5 / 1.1 * 2.2 * 10) / 10,
          fatMax: Math.round(DER * 0.65 / 8.5 / 1.1 * 2.2 * 10) / 10,
          starchMin: 0,
          starchMax: Math.round(DER * 0.1 / 3.5 * 10) / 10,
        }
      }
    }

    let weight = parseFloat(this.state.pet_tmp_onePet.weight);
    let species = this.state.pet_tmp_onePet.species;
    // 寵物係數
    let PetStatusCoef = species === 'dog' ? dogPetStatusCoef : catPetStatusCoef ;
    /*
    let statusCoef = PetStatusCoef.find((coef) => {
      return coef.status === this.state.pet_statusCoef;
    });
    */

    let statusCoef = PetStatusCoef[this.state.pet_statusCoef_Position];

    // 卡路里
    let RERstrategy = (weight >= 2 && weight <= 45) ? '2to45' : 'less2over45';
    let RER = RER_strategies[RERstrategy](weight);
    let DER = parseFloat(statusCoef.coef) * RER;
    
    // 水份
    let waterMin = weight * 50;
    let waterMax = weight * 60;

    /*
    // 蛋白質 Protein
    let proteinBasic = species === 'dog' ? Math.round(weight * 4.8 * 10) / 10 : Math.round(weight * 7 * 10) / 10; 
    let proteinMin = Math.round(DER * 0.18 / 3.5 * 10) / 10;
    let proteinMax = Math.round(DER * 0.35 / 3.5 * 10) / 10;

    // 脂肪 Fat
    let fatBasic = species === 'dog' ? Math.round(weight * 1.1 * 10) / 10 : Math.round(weight * 2.2 * 10) / 10; 
    let fatMin = Math.round(DER * 0.35 / 8.5 * 10) / 10;
    let fatMax = Math.round(DER * 0.65 / 8.5 * 10) / 10;

    // 澱粉 Starch
    let starchMin = Math.round(DER * 0.1 / 3.5 * 10) / 10;
    let starchMax = Math.round(DER * 0.45 / 3.5 * 10) / 10;
    */

    let PFS = NeedPerDay_strategies[species](weight, DER);

    this.setState({
      pet_needPerDay: {
        DER: DER,
        waterMin: waterMin, 
        waterMax: waterMax,
        proteinBasic: PFS.proteinBasic,
        proteinMin: PFS.proteinMin, 
        proteinMax: PFS.proteinMax,
        fatBasic: PFS.fatBasic,
        fatMin: PFS.fatMin, 
        fatMax: PFS.fatMax,
        starchMin: PFS.starchMin, 
        starchMax: PFS.starchMax
      }
    });
  }

  // 寵物生活係數選擇變更
  _changePetStatusCoef(value) {
    this.setState({
      pet_statusCoef: value,
    }, () => this._calDogFood());
  }

  _changePetStatusCoef_Strings(event) {
    this.setState({
      pet_tmp_statusCoef: event.position,
    });
  }

  _changedPetStatusCoef() {
    //let species = this.state.pet_tmp_onePet.species;
    //let PetStatusCoef = species === 'dog' ? dogPetStatusCoef : catPetStatusCoef ;
    //let coefValue = PetStatusCoef[this.state.pet_tmp_statusCoef].status;
    //pet_statusCoef: coefValue,
    this.setState({
      pet_statusCoef_Position: this.state.pet_tmp_statusCoef,
    }, () => this._calDogFood());
    this.popupPetCoef.dismiss();
  }

  // 返回會員編輯
  _toMemberEdit() {
    this.props.navigation.navigate('MemberAdd',{
      memberId: this.state.member_Id,
      hashTags: this.state.hashTagsOriData,
      onGoBack: () => null,
    });
  }

  // 起始異步作業
  componentDidMount() {
    this._calDogFood();
  }

  render() {
    // hashtag 選擇器
    let renderTagPicker_Desc = null;
    if (this.state.isShowTagPicker_Desc) {
      renderTagPicker_Desc =
        <View style={styles.hashtagPickerView}>
        <FlatList
            data={this.state.hashTagsPickerData}
            renderItem={({item}) => 
              <TouchableHighlight onPress={() => this._onPressTagPicker(item.tag)}>
              <Text style={{paddingLeft: 20, paddingTop: 3, paddingBottom: 2, fontSize: 16}}>{item.tag}</Text>
              </TouchableHighlight>}
            keyExtractor={(item, index) => item.tag}
            keyboardShouldPersistTaps='handled'
          />
        </View>
    }

    let renderTagPicker_Location = null;
    if (this.state.isShowTagPicker_Location) {
      renderTagPicker_Location =
        <View style={styles.hashtagPickerView}>
        <FlatList
            data={this.state.hashTagsPickerData}
            renderItem={({item}) => 
              <TouchableHighlight onPress={() => this._onPressTagPicker(item.tag)}>
              <Text style={{paddingLeft: 20, paddingTop: 3, paddingBottom: 2, fontSize: 16}}>{item.tag}</Text>
              </TouchableHighlight>}
            keyExtractor={(item, index) => item.tag}
            keyboardShouldPersistTaps='handled'
          />
        </View>
    }

    let renderTagPicker_Contect = null;
    if (this.state.isShowTagPicker_Contect) {
      renderTagPicker_Contect =
        <View style={styles.hashtagPickerView}>
        <FlatList
            data={this.state.hashTagsPickerData}
            renderItem={({item}) => 
              <TouchableHighlight onPress={() => this._onPressTagPicker(item.tag)}>
              <Text style={{paddingLeft: 20, paddingTop: 3, paddingBottom: 2, fontSize: 16}}>{item.tag}</Text>
              </TouchableHighlight>}
            keyExtractor={(item, index) => item.tag}
            keyboardShouldPersistTaps='handled'
          />
        </View>
    }

    // 寵物係數
    let PetStatusCoef = this.state.pet_tmp_onePet.species === 'dog' ? dogPetStatusCoef : catPetStatusCoef ;
    let PetStatusCoef_Strings = [];
    let PetStatusCoefText = PetStatusCoef[this.state.pet_statusCoef_Position].desc;
    PetStatusCoef.map((coef) => {
      PetStatusCoef_Strings.push(coef.desc);
    });

    // 寵物種類 ButtonGroup
    const petSpeciesButtons = ['狗狗', '貓貓', '其它'];
    let petSpeciesSelIndex = this.state.pet_species_selIndex;

    // 寵物性別 ButtonGroup
    const petSexButtons = ['公', '母'];
    let petSexSelIndex = this.state.pet_sex_selIndex;

    // Header right icon
    let renderHeaderRightIcon = null;
    renderHeaderRightIcon =
      <Icon 
        name='edit'
        color={priColor.main}
        underlayColor='rgba(255,255,255,0)'
      />

    // 澱粉顯示
    let renderStarch = null;
    if (this.state.pet_needPerDay.starchMax !== 0) {
      renderStarch = 
      <View style={{flexDirection: 'row', justifyContent: 'center'}}>
        <Text style={styles.cardTitle}>{this.state.pet_needPerDay.starchMin.toString()}</Text>
        <Text style={styles.cardText}>g</Text>  
        <Text style={styles.cardText}> ~ </Text>
        <Text style={[styles.cardTitle, {paddingLeft: 5}]}>{this.state.pet_needPerDay.starchMax.toString()}</Text>  
        <Text style={styles.cardText}>g</Text>  
      </View>
    } else {
      renderStarch = 
      <View style={{flexDirection: 'row', justifyContent: 'center'}}>
        <Text style={styles.cardTitle}>{this.state.pet_needPerDay.starchMax.toString()}</Text>
        <Text style={styles.cardText}>g</Text>  
      </View>
    }
    
    return (
      <View style={{flex: 1}}>
        <Header
            backgroundColor={priColor.main}
            outerContainerStyles={{borderBottomWidth: 0, elevation: 5}}
          >
          <Icon 
            name='arrow-back'
            color='#ffffff'
            onPress={() => this.props.navigation.goBack()}
            underlayColor='rgba(255,255,255,0)'
          />
          <Text style={{color: '#ffffff', fontSize: 20}}>毛孩一日所需計算機</Text>
          {renderHeaderRightIcon}
        </Header>

        <View style={styles.container_4_2}>

          <Item style={{width: '90%', marginTop: 0, borderBottomWidth: 0}}>
            <Icon color={secColor.dark} name='paw' type='material-community'/> 
            <Input 
              placeholder='寵物名…'
              value={this.state.pet_tmp_onePet.name}
              disabled
            />
          </Item>

          <Item style={{width: '90%', paddingTop: 12, paddingBottom: 13}}>
            { this.state.pet_tmp_onePet ?  this._renderOnePetStatus(this.state.pet_tmp_onePet) : null }
          </Item>
          
          <Item 
            style={{width: '90%', marginTop: 0, borderBottomWidth: 0}}
            onPress={() => {
              this.popupPetCoef.show();
            }}
          >
            <Icon color={secColor.dark} name='straighten'/>
            <Input 
              disabled
              placeholder='寵物生活型態…'
              value={PetStatusCoefText}
            />
            <Icon
              name='navigate-next'
              color='#aaa'
              size={32}
            />
          </Item>
          
          <ScrollView style={{width: '90%', marginBottom: 10}}>
            <Card 
              title='一日所需卡路里'
              titleStyle={{color: '#555', marginBottom: 5}}
              containerStyle={{paddingTop: 5, paddingBottom: 3,}}
              dividerStyle={{marginBottom: 3}}
              >
              <View style={{flexDirection: 'row', justifyContent: 'center'}}>
                <Text style={styles.cardTitle}>{this.state.pet_needPerDay.DER.toString()}</Text>
                <Text style={styles.cardText}>kcal</Text>  
              </View>
            </Card>

            <Card 
              title='一日所需水份'
              titleStyle={{color: '#555', marginBottom: 5}}
              containerStyle={{paddingTop: 5, paddingBottom: 3,}}
              dividerStyle={{marginBottom: 3}}
              >
              <View style={{flexDirection: 'row', justifyContent: 'center'}}>
                <Text style={styles.cardTitle}>{this.state.pet_needPerDay.waterMin.toString()}</Text>
                <Text style={styles.cardText}>ml</Text>  
                <Text style={styles.cardText}> ~ </Text>
                <Text style={[styles.cardTitle, {paddingLeft: 5}]}>{this.state.pet_needPerDay.waterMax.toString()}</Text>  
                <Text style={styles.cardText}>ml</Text>  
              </View>
            </Card>

            <Card 
              title='一日所需蛋白質'
              titleStyle={{color: '#555', marginBottom: 5}}
              containerStyle={{paddingTop: 5, paddingBottom: 3,}}
              dividerStyle={{marginBottom: 3}}
              >
              <View>
                <View style={{flexDirection: 'row', justifyContent: 'center'}}>
                  <Text style={styles.cardText}>建議必需量 </Text> 
                  <Text style={styles.cardTitle}>{this.state.pet_needPerDay.proteinBasic.toString()}</Text>
                  <Text style={styles.cardText}>g</Text>
                </View>
                <Divider style={{marginTop: 3, marginBottom: 3}}/>
                <View style={{flexDirection: 'row', justifyContent: 'center'}}>
                  <Text style={styles.cardText}>可調整量 </Text>
                  <Text style={styles.cardTitle}>{this.state.pet_needPerDay.proteinMin.toString()}</Text>
                  <Text style={styles.cardText}>g</Text>  
                  <Text style={styles.cardText}> ~ </Text>
                  <Text style={[styles.cardTitle, {paddingLeft: 5}]}>{this.state.pet_needPerDay.proteinMax.toString()}</Text>  
                  <Text style={styles.cardText}>g</Text>  
                </View>
              </View>
            </Card>

            <Card 
              title='一日所需脂肪'
              titleStyle={{color: '#555', marginBottom: 5}}
              containerStyle={{paddingTop: 5, paddingBottom: 3,}}
              dividerStyle={{marginBottom: 3}}
              >
              <View>
                <View style={{flexDirection: 'row', justifyContent: 'center'}}>
                  <Text style={styles.cardText}>建議必需量 </Text> 
                  <Text style={styles.cardTitle}>{this.state.pet_needPerDay.fatBasic.toString()}</Text>
                  <Text style={styles.cardText}>g</Text>
                </View>
                <Divider style={{marginTop: 3, marginBottom: 3}}/>
                <View style={{flexDirection: 'row', justifyContent: 'center'}}>  
                  <Text style={styles.cardText}>可調整量 </Text>  
                  <Text style={styles.cardTitle}>{this.state.pet_needPerDay.fatMin.toString()}</Text>
                  <Text style={styles.cardText}>g</Text>  
                  <Text style={styles.cardText}> ~ </Text>
                  <Text style={[styles.cardTitle, {paddingLeft: 5}]}>{this.state.pet_needPerDay.fatMax.toString()}</Text>  
                  <Text style={styles.cardText}>g</Text>  
                </View>
              </View>
            </Card>

            <Card 
              title='一日所需澱粉'
              titleStyle={{color: '#555', marginBottom: 5}}
              containerStyle={{paddingTop: 5, paddingBottom: 3,}}
              dividerStyle={{marginBottom: 3}}
              >
              { renderStarch }
            </Card>
          </ScrollView>
          
        </View>

        <ActionButton
          buttonColor={secColor.darkRGBA}
          fixNativeFeedbackRadius={true}
          renderIcon={() => (
            <Icon 
              name='arrow-back'
              color='#fff'
            />
          )}
          onPress={() => this.props.navigation.goBack()}
        />
        
        {/* 添加生活型態對話框 */}
        <PopupDialog
          dialogTitle={<DialogTitle title="毛孩生活型態" />}
          width={320}
          height={300}
          ref={(popupPetCoef) => { this.popupPetCoef = popupPetCoef; }}
          dialogAnimation={scaleAnimation}
        > 
          <View style={{alignItems: 'center'}}>
            
            <WheelPicker
              onItemSelected={(event) => this._changePetStatusCoef_Strings(event)}
              isCurved
              data={PetStatusCoef_Strings}
              style={styles.wheelPicker}
              itemTextColor='#d9d5dc'
              selectedItemPosition={this.state.pet_statusCoefPosition}
              selectedItemTextColor='#555555'
            />

            <Text>{this.state.tmp_string}</Text>
            
            <View style={{flexDirection: 'row', justifyContent: 'center',width: '90%'}}>
              <Button
                title='取消'
                onPress={() => this.popupPetCoef.dismiss()}
                backgroundColor={priColor.main}
                color='#fff'
                height={45}
                containerViewStyle={{marginRight: 5, marginTop: 25, borderRadius: 5, width: '25%'}}
                buttonStyle={{borderRadius: 5, width: '100%'}}
              />
              <Button
                title='確定'
                onPress={() => this._changedPetStatusCoef()}
                backgroundColor={secColor.dark}
                color='#fff'
                height={45}
                containerViewStyle={{marginLeft: 5, marginTop: 25, borderRadius: 5, width: '60%'}}
                buttonStyle={{borderRadius: 5, width: '100%'}}
              />
            </View>
          </View>
        </PopupDialog>

      </View>
    );
  }
}

/*
<Divider style={{height: 1, width: '80%', backgroundColor: '#d9d5dc'}}/>
*/

const styles = StyleSheet.create({
  container_4_2: {
    backgroundColor: '#fafafa',
    justifyContent: 'flex-start',
    alignItems: 'center',
    flex: 1,
  },
  container_PetsList: {
    width: '90%',
    backgroundColor: '#fff',
    justifyContent: 'flex-start',
    alignItems: 'center',
  },
  labelText: {
    textAlign: 'left',
    color: '#000',
    marginTop: 10,
    fontSize: 17,
  },
  textInput: {
    height: 40,
    width: 230,
    fontSize: 15,
    marginTop: 10,
    marginBottom: 10,
  },
  selButton: {
    marginTop: 20,
    borderWidth: 1,
    borderColor: '#555',
    backgroundColor: '#fff',
    height: 35,
    width: 50,
    borderRadius: 3,
  },
  seledButton: {
    marginTop: 20,
    borderWidth: 1,
    borderColor: '#555',
    backgroundColor: '#555',
    height: 35,
    width: 50,
    borderRadius: 3,
  },
  selButtonText: {
    color: '#555',
  },
  seledButtonText: {
    color: '#fff',
  },
  subButton: {
    borderWidth: 1,
    borderColor: '#aaa',
    backgroundColor: '#fafafa',
    paddingTop: 2,
    paddingBottom: 3,
    paddingLeft: 5,
    paddingRight: 5,
    borderRadius: 3,
  },
  subButtonText: {
    color: '#aaa',
    padding: 0,
  },
  subButtonContainer: {
    borderRadius: 3,
  },
  hashtagPickerView: {
    position: 'absolute', 
    backgroundColor: '#fff', 
    marginTop: 5, 
    marginLeft: 20,
    paddingTop: 5,
    paddingBottom: 5,
    width: '90%', 
    height: 100,
    borderWidth: 0, 
    borderColor: '#aaa', 
    borderRadius: 3,
    zIndex: 1,
    elevation: 5,
  },
  firstItemView: {
    borderLeftWidth: 10,
    borderLeftColor: secColor.main,
  },
  firstItem: {
    paddingLeft: 15,
    fontSize: 16,
  },
  item: {
    paddingLeft: 5,
    fontSize: 15,
  },
  cardTitle: {
    fontSize: 25,
    color: priColor.dark,
  },
  cardText: {
    textAlignVertical: 'center', 
    paddingLeft: 5,
  },
  cardDigital: {
    fontSize: 25, 
    color: priColor.dark,
  },
  wheelPicker: {
    width: '90%',
    height: 150
  }
});

/*
          <View style={[styles.firstItemView, {flexDirection: 'row', paddingBottom: 5, paddingTop: 5}]}>
            <Icon
              name='edit'
              color='#555'
              size={16}
              containerStyle={{paddingLeft: 15}}
            />
            <Text style={[styles.item, {fontSize: 13}]}>{item.desc}</Text>
          </View>

          <PopupDialog
          dialogTitle={<DialogTitle title="製造日推算保存期限" />}
          width={300}
          height={300}
          ref={(popupDayAddType) => { this.popupDayAddType = popupDayAddType; }}
          dialogAnimation={scaleAnimation}
        > 
          <View style={{alignItems: 'center'}}>
            <View>
              <Item
                style={{width: 230}}
                onPress={this._showDatePicker.bind(this, 'madeDate', this.state.PEI_madeDate)}
                >
                <Icon color={priColor.main} name='today' />
                <Input 
                  disabled
                  value={madeDateText}
                />
                <Icon
                  name='navigate-next'
                  color='#aaa'
                  size={32}
                />
              </Item>
              <Item style={{width: 230}} error={this.state.warnKeepRange ? true : false}>
                <Icon color={priColor.main} name='date-range' />
                <Text> 可保存期 </Text>
                <Input 
                  placeholder='保存期整數…'
                  onChangeText={(text) => this._checkKeepRange(text)}  
                  value={this.state.PEI_keepRange}
                />
                {warnKeepRangeText}
              </Item>
            </View>
            <View style={{flexDirection: 'row', justifyContent: 'center'}}>
              <Button
                buttonStyle={this.state.calExpdateType === 'day' ? styles.seledButton : styles.selButton}
                textStyle={this.state.calExpdateType === 'day' ? styles.seledButtonText : styles.selButtonText}
                containerViewStyle={styles.subButtonContainer}
                title='日'
                onPress={() => {
                  this.setState({calExpdateType: 'day'});
                }}
              />
              <Button
                buttonStyle={this.state.calExpdateType === 'month' ? styles.seledButton : styles.selButton}
                textStyle={this.state.calExpdateType === 'month' ? styles.seledButtonText : styles.selButtonText}
                containerViewStyle={styles.subButtonContainer}
                title='月'
                onPress={() => {
                  this.setState({calExpdateType: 'month'});
                }}
              />
              <Button
                buttonStyle={this.state.calExpdateType === 'year' ? styles.seledButton : styles.selButton}
                textStyle={this.state.calExpdateType === 'year' ? styles.seledButtonText : styles.selButtonText}
                containerViewStyle={styles.subButtonContainer}
                title='年'
                onPress={() => {
                  this.setState({calExpdateType: 'year'});
                }}
              />
            </View>
          <View>
            <Button
              title='確定'
              onPress={() => {
                this._calExpdateFromMadedate();
              }}
              backgroundColor={priColor.main}
              color='#fff'
              height={45}
              containerViewStyle={{marginTop: 25}}
              buttonStyle={{width: 230}}
            />
          </View>
          </View>
        </PopupDialog>

        <Item 
            style={{width: '90%', marginTop: 0, borderBottomWidth: 0}}
            onPress={this.state.PEI_itemImage ? () => this._clearPeiImage() : () => this._pickExpItemImage()}
          >
            <Icon color={priColor.main} name='image' />
            <Input 
              disabled
              placeholder={this.state.PEI_itemImage ? '' : '選擇相片…'}
            />
            <Icon
              name={this.state.PEI_itemImage ? 'clear' : 'navigate-next'}
              color='#aaa'
              size={32}
            />
          </Item>
          {renderPeiImage}

          <Item style={{width: '90%', borderBottomWidth: 0}}>
          <Picker
            mode="dropdown"
            placeholder="選擇毛孩生活型態…"
            placeholderStyle={{ color: "#bfc6ea" }}
            placeholderIconColor="#007aff"
            style={{width: '90%'}}
            selectedValue={this.state.pet_statusCoef}
            onValueChange={this._changePetStatusCoef.bind(this)}
          >
            {
              PetStatusCoef.map((coef) => (
                <Picker.Item label={coef.desc} value={coef.status} key={coef.status}/>
              ))
            }
          </Picker>
          </Item>
*/