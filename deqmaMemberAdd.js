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
   TouchableHighlight, TouchableNativeFeedback} from 'react-native';
import PouchDB from 'pouchdb-react-native';
import moment from 'moment';
import {Button, Icon, Header, Divider, ButtonGroup, Avatar} from 'react-native-elements';
import ActionButton from 'react-native-action-button';
import {Item, Input, SwipeRow, Picker} from 'native-base';
import PopupDialog, {ScaleAnimation, DialogTitle} from 'react-native-popup-dialog';
import PushNotification from 'react-native-push-notification';
import ImagePicker from 'react-native-image-crop-picker';
import RNFS from 'react-native-fs';
import hashtagRegex from 'hashtag-regex';

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

// 對話視窗動畫模式
const scaleAnimation = new ScaleAnimation();

//type Props = {};
export default class MemberAdd extends Component {
  constructor(props) {
    super(props);
    let memberId = this.props.navigation.getParam('memberId');
    let isEdittingMember = memberId === '' ? false : true ;
    
    this.state = {
      member_cardNo:'',
      member_Name:'',
      member_Contact:'',
      member_Location: '',
      member_Date: new Date(moment().get('year'), moment().get('month'), moment().get('date')), 
      member_Desc: '',
      member_Image: null,
      member_Pets: [],
      pet_tmp_id: '',
      pet_tmp_name: '',
      pet_tmp_species: '',
      pet_tmp_sex: '',
      pet_tmp_weight: '0',
      pet_tmp_oldYear: 0,
      pet_tmp_oldMonth: 0,
      pet_tmp_createDate: new Date(moment().get('year'), moment().get('month'), moment().get('date')), 
      pet_tmp_desc: '',
      pet_tmp_onePet: null,
      pet_species_selIndex: 0,
      pet_sex_selIndex: 0,
      pet_statusCoef: 'normal_noG',
      pet_needPerDay: {
        DER: 0,
        waterMin: 0, waterMax: 0,
        proteinMin: 0, proteinMax: 0,
        fatMin: 0, fatMax: 0,
        starchMin: 0, starchMax: 0
      },
      member_Id: memberId,
      isEdittingMember: isEdittingMember,
      isMemberDateNull: true,
      isShowTagPicker_Desc: false,
      isShowTagPicker_Location: false,
      isShowTagPicker_Contect: false,
      isEdittingPet: false,
      dataSource: [],
      hashTagsKeyword: '',
      hashTagsOriData:  this.props.navigation.getParam('hashTags'),
      hashTagsPickerData: [],
      isShowTagPicker: false,
    };
    this.notifi_configure(this.notifi_onNotif);
    this.notifi_LastId = 0;
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

  ////////////////////////////////////////////////////////// 會員 ///////////////////////////////

  // 會員處理 (新增或更新)
  _processMember() {
    if (this.state.isEdittingMember) {
      this._updateMember();
    } else {
      this._putNewMember();
    }
  }

  // 新增會員
  _putNewMember() {
    if (this.state.member_Name !== '' && !this.state.isMemberDateNull) {
      let id = new Date().toISOString();
      let member = {
        _id: id,
        cardNo: this.state.member_cardNo,
        name: this.state.member_Name,
        contact: this.state.member_Contact,
        location: this.state.member_Location,
        createDate: this.state.member_Date, 
        desc: this.state.member_Desc,
        pets: this.state.member_Pets,
        shoppings: []
      };
      //console.warn(JSON.stringify(member));      
      memberDB.put(member)
      .then(result => {
        // 刷新列表並返回
        this.props.navigation.state.params.onGoBack();
        this.props.navigation.goBack();
      })
      .catch(error => console.warn('Error during update Item', error));
    }
  }

  // 更新會員
  _updateMember() {
    if (this.state.member_Name !== '' && !this.state.isMemberDateNull) {
      memberDB.get(this.state.member_Id)
      .then(doc => {
        let member = {
          _id: this.state.member_Id,
          _rev: doc._rev,
          cardNo: this.state.member_cardNo,
          name: this.state.member_Name,
          contact: this.state.member_Contact,
          location: this.state.member_Location,
          createDate: this.state.member_Date, 
          desc: this.state.member_Desc,
          pets: this.state.member_Pets,
          shoppings: doc.shoppings,
        };

        return memberDB.put(member);
      })
      .then(result => {
        // 刷新列表並返回
        this.props.navigation.state.params.onGoBack();
        this.props.navigation.goBack();
      })
      .catch(error => console.warn('Error during update Item', error));
    }
  }

  // 依 _id 取得會員資料
  _getMember() {
    memberDB.get(this.state.member_Id)
    .then(result => {
      this.setState({
        member_cardNo: result.cardNo,
        member_Name: result.name,
        member_Contact: result.contact,
        member_Location: result.location,
        member_Date: new Date(result.createDate), 
        member_Desc: result.desc,
        member_Image: null,
        member_Pets: result.pets,
        isMemberDateNull: false,
      });
    })
    .catch(error => console.warn('Error during get Item', error));
  }

  // 刪除會員確認對話框
  _removeMemberConfirm() {
    Alert.alert(
      '會員刪除',
      '確認刪除此會員？',
      [{
        text: '取消',
        onPress: () => {}
      },{
        text: '確定',
        onPress: () => {this._removeMember()}
      }]
    )
  }

  // 刪除會員
  _removeMember() {
    memberDB.get(this.state.member_Id)
    .then(doc => {
      return memberDB.remove(doc);
    })
    .then(result => {
      // 刷新列表並返回
      this.props.navigation.state.params.onGoBack();
      this.props.navigation.goBack();
    })
    .catch(error => console.warn('Error during update Item', error));
  }

  ////////////////////////////////////////////////////////// 工具 ///////////////////////////////

  // 冰存物圖片選擇器
  _pickExpItemImage() {
    ImagePicker.openPicker({
      width: 300,
      height: 400,
      compressImageMaxWidth: 300,
    }).then(image => {
      this.setState({
        PEI_itemImage: {
          uri: image.path,
          width: image.width,
          height: image.height,
          mime: image.mime
        },
      });
    }).catch(e =>{});
  }

  // 冰存物相機選擇器
  _pickExpItemPhoto() {
    ImagePicker.openCamera({
      width: 300,
      height: 400,
      compressImageMaxWidth: 300,
    }).then(image => {
      this.setState({
        PEI_itemImage: {
          uri: image.path,
          width: image.width,
          height: image.height,
          mime: image.mime
        },
      });
    }).catch(e =>{});
  }

  // 清除已選圖片
  _clearPeiImage() {
    this.setState({
      PEI_itemImage: null,
    });
  }

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

  // 新增寵物打包
  _addOnePet() {
    if (this.state.pet_tmp_name !== '') {
      let onePet = {
        id: new Date().toISOString(),
        name: this.state.pet_tmp_name, 
        species: petSpeciesList[this.state.pet_species_selIndex].species, 
        sex: petSexList[this.state.pet_sex_selIndex], 
        weight: parseFloat(this.state.pet_tmp_weight),
        oldMonth: this.state.pet_tmp_oldYear * 12 + this.state.pet_tmp_oldMonth, 
        createDate: this.state.pet_tmp_createDate.toISOString(), 
        desc: this.state.pet_tmp_desc,
      }

      if (!this.state.isEdittingPet) {
        //console.warn(JSON.stringify(onePet));
        this.setState({
          member_Pets: [...this.state.member_Pets, onePet],
        });
      } else {
        let petIndex = this.state.member_Pets.findIndex((element) => {
          return element.id === this.state.pet_tmp_id;
        });
        this.state.member_Pets[petIndex].name = onePet.name;
        this.state.member_Pets[petIndex].species = petSpeciesList[this.state.pet_species_selIndex].species; 
        this.state.member_Pets[petIndex].sex = petSexList[this.state.pet_sex_selIndex]; 
        this.state.member_Pets[petIndex].weight = this.state.pet_tmp_weight;
        this.state.member_Pets[petIndex].oldMonth = this.state.pet_tmp_oldYear * 12 + this.state.pet_tmp_oldMonth; 
        this.state.member_Pets[petIndex].desc = this.state.pet_tmp_desc;
        this.setState({
          member_Pets: this.state.member_Pets,
        })
      }

      this.popupAddPet.dismiss();
    }
  }

  // 依 pet_id 設定 state 及回傳是否顯示對話框判定
  _isGetOnePet(id) {
    let onePet = this.state.member_Pets.find((element) => {
      return element.id === id;
    })

    if (onePet) {
      let speciesSelIdx = petSpeciesList.findIndex((element) => {
        return element.species === onePet.species;
      });
      let sexSelIdx = onePet.sex === 'male' ? 0 : 1 ;
      let old_year = parseInt(onePet.oldMonth / 12);
      let old_month = onePet.oldMonth % 12;
      
      this.setState({
        pet_tmp_id: id,
        pet_tmp_name: onePet.name,
        pet_tmp_species: onePet.species,
        pet_tmp_sex: onePet.sex,
        pet_tmp_weight: onePet.weight.toString(),
        pet_tmp_oldYear: old_year,
        pet_tmp_oldMonth: old_month,
        pet_tmp_createDate: new Date(onePet.createDate), 
        pet_tmp_desc: onePet.desc,
        pet_tmp_onePet: onePet,
        pet_sex_selIndex: sexSelIdx,
        pet_species_selIndex: speciesSelIdx,
        isEdittingPet: true,
      });

      return onePet;
    } else {
      return undefined;
    }
  }

  // 顯示修改刪除寵物對話框
  _editOnePet(id) {
    if (this._isGetOnePet(id)) {
      this.popupAddPet.show();
    }
  }

  // 刪除寵物_確認對話框
  _removePetConfirm() {
    Alert.alert(
      '寵物刪除',
      '確認刪除此寵物？',
      [{
        text: '取消',
        onPress: () => {}
      },{
        text: '確定',
        onPress: () => {
          let petIndex = this.state.member_Pets.findIndex((element) => {
            return element.id === this.state.pet_tmp_id;
          });
          //Alert.alert(this.state.pet_tmp_id + ', ' + petIndex.toString());
          this.state.member_Pets.splice(petIndex, 1)
          this.setState({
            member_Pets: this.state.member_Pets,
          });
          this.popupAddPet.dismiss();
        }
      }]
    )
  }

  // 顯示寵物列表
  _showPetsList() {
    //Alert.alert(this.state.member_Pets.length.toString());

    if (this.state.member_Pets.length ===0) {
      return (
        <View style={{alignSelf: 'stretch', flex: 1}}></View>
      );
    }

    return (
      <FlatList
        data={this.state.member_Pets}
        renderItem={this._renderPetsList.bind(this)}
        keyExtractor={(item, index) => index.toString()}
        style={{alignSelf: 'stretch'}}
        keyboardShouldPersistTaps='handled'
      />
    );
  }

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
          size={16}
          containerStyle={{paddingLeft: 15}}
        />
        <Text style={styles.item}>{speciesText}</Text>
        <Icon
          name='date-range'
          color='#555'
          size={16}
          containerStyle={{paddingLeft: 5}}
        />
        <Text style={styles.item}>{oldMonthText}</Text>
        <Icon
          name='scale' 
          type='material-community'
          color='#555'
          size={16}
          containerStyle={{paddingLeft: 5}}
        />
        <Text style={styles.item}>{item.weight.toString()} 公斤</Text>
      </View>
    );
  }

  // 寵物列表格式
  _renderPetsList({item}) {
    let createDateText = moment(item.createDate).format('YYYY年M月D日');
    let statusItem = null;

    // 性別顯示處理
    let gender = item.sex === 'male' ? 'gender-male' : 'gender-female';
    let genderColor = item.sex === 'male' ? priColor.dark : secColor.dark;

    // 種類顯示處理
    let species = petSpeciesList.find((element) => {
      return element.species === item.species;
    })
    let speciesText = species.name;

    // 種類圖片
    let renderPetSpeciesPic = null;
    let petSpeciesPicFile = '';
    switch (item.species) {
      case 'dog':
        petSpeciesPicFile = require('./img/icon_dog_b.jpg');
        break;
      case 'cat':
        petSpeciesPicFile = require('./img/icon_cat_b.jpg');
        break;
    }
    renderPetSpeciesPic =
      <Avatar
        medium
        rounded
        source={petSpeciesPicFile}
        avatarStyle={{backgroundColor: '#fff'}}
      />

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
      <SwipeRow
        style={{paddingTop: 0, paddingRight: 0,paddingBottom: 0}}
        leftOpenValue={75}
        stopLeftSwipe={75}
        disableLeftSwipe={true}
        left={
          <TouchableNativeFeedback 
            background={Platform.OS === 'android' ? TouchableNativeFeedback.Ripple('rgba(200,200,200,0.5)', false) : ''}
            onPress={() => this._toPetCalculator(item.id)}
          >
            <View style={{justifyContent: 'center', height:'100%', backgroundColor: secColor.dark}}>
              <Icon
                name='calculator'
                type='material-community'
                color='#fff'
                size={30}
              />
            </View>
          </TouchableNativeFeedback>
        }
        body={
          <TouchableNativeFeedback 
            background={Platform.OS === 'android' ? TouchableNativeFeedback.Ripple('rgba(200,200,200,0.5)', false) : ''}
            onPress={() => this._editOnePet(item.id)}
          >
          <View style={{
            flexDirection: 'row', 
            borderBottomWidth: 1, 
            borderBottomColor: '#e1e8ee',
            borderRightWidth: 1, 
            borderRightColor: '#e1e8ee',
            }}>
            <View style={{flex: 7}}>
              <View style={[styles.firstItemView, {flexDirection: 'row', paddingTop: 5}]}>
                <Text style={[styles.firstItem, {color: '#000', fontSize: 16}]}>{item.name}</Text>
              </View>
              <View style={[styles.firstItemView, {flexDirection: 'row', alignContent: 'center', paddingTop: 5}]}>
                <Icon
                  name={gender}
                  type='material-community'
                  color={genderColor}
                  size={16}
                  containerStyle={{paddingLeft: 15}}
                />
                <Text style={styles.item}>{speciesText}</Text>
                <Icon
                  name='date-range'
                  color='#555'
                  size={16}
                  containerStyle={{paddingLeft: 5}}
                />
                <Text style={styles.item}>{oldMonthText}</Text>
                <Icon
                  name='scale' 
                  type='material-community'
                  color='#555'
                  size={16}
                  containerStyle={{paddingLeft: 5}}
                />
                <Text style={styles.item}>{item.weight.toString()} 公斤</Text>  
              </View>
              <View style={[styles.firstItemView, {flexDirection: 'row', paddingBottom: 5, paddingTop: 5}]}>
                <Icon
                  name='assignment'
                  color='#555'
                  size={16}
                  containerStyle={{paddingLeft: 15}}
                />
                <Text style={[styles.item, {fontSize: 13}]}>{item.desc}</Text>
              </View>
            </View>
            <View style={{justifyContent: 'center', alignItems: 'center', flex: 2}}>
              {renderPetSpeciesPic}
            </View>
          </View>  
          </TouchableNativeFeedback>
        }
      />
    );
  }

  //////////////////////////////////////////////////////// 各類寵物計算 ///////////////////////////
  
  // 移至毛孩計算機
  _toPetCalculator(petId) {
    let onePet = this._isGetOnePet(petId);
    this.props.navigation.navigate('PetCalculator',{
      memberId: this.state.member_Id,
      onePet: onePet,
      hashTags: this.state.hashTagsOriData,
      onGoBack: () => null,
    });
  }

  // 起始異步作業
  componentDidMount() {
    if (this.state.isEdittingMember) {
      this._getMember();
    }
  }

  render() {
    // 保存期限顯示字串
    //let expDateText = moment(this.state.PEI_expDate).format('YYYY年M月D日');

    // 會員加入日期顯示字串
    let memberDateText = moment(this.state.member_Date).format('YYYY年M月D日');

    // 製造日期顯示字串
    //let madeDateText = moment(this.state.PEI_madeDate).format('YYYY年M月D日');
    //let warnKeepRangeText = <Text></Text>
    //if (this.state.warnKeepRange) {
    //  warnKeepRangeText = <Icon name='cancel' color='darkred' />
    //}

    // 若有圖片則出現刪除 icon，若無則出現選擇相片 icon
    let renderPeiImage = null;
    if (this.state.PEI_itemImage) {
      renderPeiImage =
      <View style={{width:'90%', paddingLeft: 20, borderRadius: 5,}}>
        <Image 
          source={this.state.PEI_itemImage}
          style={{width: 80, height: 80, resizeMode: 'cover', marginLeft: 5, borderRadius: 5,}}
        />
      </View>
    } else {
      renderPeiImage =
      <View style={{flexDirection: 'row', width:'90%', paddingLeft: 15}}>
        <Button
          icon={{name: 'photo-camera', size: 20 }}
          buttonStyle={{width: 60, height: 60, backgroundColor: dividerColor, paddingLeft: 20}}
          containerViewStyle={{marginRight: 0}}
          onPress={() => this._pickExpItemPhoto()}
        />
        <Button
          icon={{name: 'image', size: 20 }}
          buttonStyle={{width: 60, height: 60, backgroundColor: dividerColor, paddingLeft: 20}}
          onPress={() => this._pickExpItemImage()}
        />
      </View>
    }

    let testText = 'file://' + RNFS.DocumentDirectoryPath + '/imgEPI_1537627772.jpg';

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

    // 寵物種類 ButtonGroup
    const petSpeciesButtons = ['狗狗', '貓貓', '其它'];
    let petSpeciesSelIndex = this.state.pet_species_selIndex;

    // 寵物性別 ButtonGroup
    const petSexButtons = ['公', '母'];
    let petSexSelIndex = this.state.pet_sex_selIndex;

    // 寵物編輯刪除按鈕
    let renderPetDeleteButton = null;
    if (this.state.isEdittingPet) {
      renderPetDeleteButton =
        <Button
          icon={{name: 'delete', size: 24}}
          onPress={() => {
            this._removePetConfirm();
          }}
          backgroundColor='darkred'
          color='#fff'
          height={43}
          containerViewStyle={{marginTop: 25, borderRadius: 5, marginRight: 0}}
          buttonStyle={{height: 43, width: 65, paddingLeft: 20, borderRadius: 5}}
        />
    }

    // Header right icon
    let renderHeaderRightIcon = null;
    if (this.state.isEdittingMember) {
      renderHeaderRightIcon =
        <Icon 
          name='delete'
          color='#ffffff'
          onPress={() => this._removeMemberConfirm()}
          underlayColor='rgba(255,255,255,0)'
          size={32}
        />
    } else {
      renderHeaderRightIcon =
        <Icon 
          name='edit'
          color={priColor.main}
          underlayColor='rgba(255,255,255,0)'
        />
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
          <Text style={{color: '#ffffff', fontSize: 20}}>{this.state.isEdittingMember ? '編輯會員' : '新增會員'}</Text>
          {renderHeaderRightIcon}
        </Header>

        <View style={styles.container_4_2}>
          <Item style={styles.ItemStyle}>
            <Icon color={priColor.main} name='credit-card' />
            <Input 
              placeholder='請輸入會員卡號…'
              onChangeText={(text) => this.setState({member_cardNo: text})}
              value={this.state.member_cardNo}  
            />
          </Item>

          <Item style={styles.ItemStyle}>
            <Icon color={priColor.main} name='account-box' />
            <Input 
              placeholder='請輸入會員名稱…'
              onChangeText={(text) => this.setState({member_Name: text})}  
              value={this.state.member_Name}
            />
          </Item>

          <Item style={styles.ItemStyle}>
            <Icon color={priColor.main} name='add-location' />
            <Input 
              placeholder='請輸入居住地或創建 #hashtag ……'
              onChangeText={(text) => this._doHashtagMatch(text, 'memberLocation')}
              ref={ref => this._LocationInput = ref}
              value={this.state.member_Location}
            />
            <Button 
              title=' # '
              buttonStyle={styles.subButton}
              textStyle={styles.subButtonText}
              containerViewStyle={styles.subButtonContainer}
              onPress={() => {
                let val = this.state.member_Location + '#';
                this.setState({
                  member_Location: val,
                });
                this._doHashtagMatch(val, 'memberLocation');
                this._LocationInput._root.focus();
              }}
            />
          </Item>
          <View style={{width: '90%'}}>
          {renderTagPicker_Location}
          </View>

          <Item style={styles.ItemStyle}>
            <Icon color={priColor.main} name='smartphone' />
            <Input 
              placeholder='請輸入連絡方式…'
              onChangeText={(text) => this.setState({member_Contact: text})}  
              value={this.state.member_Contact}
            />
          </Item>
          
          <Item style={styles.ItemStyle}>
            <Icon color={priColor.main} name='assignment' />
            <Input 
              placeholder='請輸入備註或創建 #hashtag …'
              onChangeText={(text) => this._doHashtagMatch(text, 'memberDesc')}
              multiline={true}
              ref={ref => this._DescInput = ref}
              value={this.state.member_Desc}
            />
            <Button 
              title=' # '
              buttonStyle={styles.subButton}
              textStyle={styles.subButtonText}
              containerViewStyle={styles.subButtonContainer}
              onPress={() => {
                let val = this.state.member_Desc + '#';
                this.setState({
                  member_Desc: val,
                });
                this._doHashtagMatch(val, 'memberDesc');
                this._DescInput._root.focus();
              }}
            />
          </Item>

          <Item 
            style={styles.ItemStyle}
            onPress={this._showDatePicker.bind(this, 'memberDate', this.state.member_Date)}
          >
            <Icon color={priColor.main} name='today' />
            <Input 
              disabled
              placeholder={this.state.isMemberDateNull ? '選擇入會日期…' : null}
              value={this.state.isMemberDateNull ? '' : memberDateText}
            />
            <Button 
              title='今天？'
              buttonStyle={styles.subButton}
              textStyle={styles.subButtonText}
              containerViewStyle={styles.subButtonContainer}
              onPress={() => {
                this.setState({
                  isMemberDateNull: false,
                  member_Date: new Date(moment().get('year'), moment().get('month'), moment().get('date')),
                })
              }}
            />
          </Item>
         
          <View style={{width: '90%'}}>
          {renderTagPicker_Desc}
          </View>
         
          <Item 
            style={styles.ItemStyle}
            onPress={() => {
              this.setState({
                isEdittingPet: false,
                pet_tmp_id: '',
                pet_tmp_name: '',
                pet_tmp_species: '',
                pet_tmp_sex: '',
                pet_tmp_weight: '0',
                pet_tmp_oldYear: 0,
                pet_tmp_oldMonth: 0,
                pet_tmp_createDate: new Date(moment().get('year'), moment().get('month'), moment().get('date')), 
                pet_tmp_desc: '',
                pet_sex_selIndex: 0,
                pet_species_selIndex: 0,
              });
              this.popupAddPet.show();
            }}
          >
            <Icon color={secColor.dark} name='paw' type='material-community' />
            <Input 
              disabled
              placeholder='添加寵物…'
            />
            <Icon
              name='navigate-next'
              color='#aaa'
              size={32}
            />
          </Item>
          {/* 寵物列表 */}
          <View style={styles.container_PetsList}>
          { this._showPetsList() }
          </View>
        </View>
 
        <ActionButton
          buttonColor={secColor.darkRGBA}
          fixNativeFeedbackRadius={true}
          renderIcon={() => (
            <Icon 
              name='done'
              color='#fff'
            />
          )}
          onPress={() => this._processMember()}
        />
        
        {/* 添加寵物對話框 */}
        <PopupDialog
          dialogTitle={<DialogTitle title="添加寵物" />}
          width={300}
          height={400}
          ref={(popupAddPet) => { this.popupAddPet = popupAddPet; }}
          dialogAnimation={scaleAnimation}
        > 
          <View style={{alignItems: 'center'}}>
            
            <Item style={{width: '90%'}}>
              <Icon color={secColor.dark} name='paw' type='material-community'/> 
              <Input 
                placeholder='寵物名…'
                onChangeText={(text) => this.setState({pet_tmp_name: text})}  
                value={this.state.pet_tmp_name}
              />
            </Item>

            <View style={{flexDirection: 'row', justifyContent: 'center'}}>
              <Item style={{width: '30%'}}>
                <Input 
                  placeholder='幾歲…'
                  onChangeText={(text) => text !== '' ? this.setState({pet_tmp_oldYear: parseInt(text)}) : this.setState({pet_tmp_oldYear: 0})}  
                  value={this.state.pet_tmp_oldYear.toString()}
                  textAlign='center'
                  keyboardType='number-pad'
                />
                <Text>歲</Text>
              </Item>
              <Item style={{width: '30%'}}>
                <Input 
                  placeholder='幾個月…'
                  onChangeText={(text) => text !== '' ? this.setState({pet_tmp_oldMonth: parseInt(text)}) : this.setState({pet_tmp_oldMonth: 0})}  
                  value={this.state.pet_tmp_oldMonth.toString()}
                  textAlign='center'
                  keyboardType='number-pad'
                />
                <Text>個月</Text>
              </Item>
              <Item style={{width: '30%', paddingLeft: 10}}>
                <Input 
                  placeholder='體重…'
                  onChangeText={(text) => text !== '' ? this.setState({pet_tmp_weight: text}) : this.setState({pet_tmp_weight: '0'})}  
                  value={this.state.pet_tmp_weight}
                  textAlign='center'
                  keyboardType='number-pad'
                />
                <Text>公斤</Text>
              </Item>
            </View>

            <Item style={{width: '90%'}}>
              <Icon color={secColor.dark} name='assignment'/> 
              <Input 
                placeholder='輸入備註…'
                onChangeText={(text) => this.setState({pet_tmp_desc: text})}  
                value={this.state.pet_tmp_desc}
              />
            </Item>

            <ButtonGroup
              onPress={this.petSpeciesUpdateIndex}
              selectedIndex={petSpeciesSelIndex}
              buttons={petSpeciesButtons}
              containerStyle={{height: 30, marginTop: 15, width: '90%'}}
            />

            <ButtonGroup
              onPress={this.petSexUpdateIndex}
              selectedIndex={petSexSelIndex}
              buttons={petSexButtons}
              containerStyle={{height: 30, marginTop: 10, width: '90%'}}
            />
            
            <View style={{flexDirection: 'row', justifyContent: 'center', width: '90%'}}>
              {renderPetDeleteButton}
              <Button
                title='確定'
                onPress={() => {
                  this._addOnePet();
                }}
                backgroundColor={secColor.dark}
                color='#fff'
                height={45}
                containerViewStyle={{marginTop: 25, borderRadius: 5, width: this.state.isEdittingPet ? '70%' : '100%'}}
                buttonStyle={{borderRadius: 5, width: this.state.isEdittingPet ? '100%' : '100%'}}
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
    fontSize: 13,
  },
  ItemStyle: {
    width: '90%',
    marginTop: 0,
    borderBottomWidth: 0,
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
*/