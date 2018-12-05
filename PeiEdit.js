/**
 * Sample React Native App
 * https://github.com/facebook/react-native
 *
 * @format
 * @flow
 */

import React, {Component} from 'react';
import {Platform, StyleSheet, Text, View, Image, TextInput,
  Alert, DatePickerAndroid, FlatList, TouchableHighlight} from 'react-native';
import PouchDB from 'pouchdb-react-native';
import moment from 'moment';
import {Button, Icon, Header, Divider} from 'react-native-elements';
import ActionButton from 'react-native-action-button';
import {Item, Input} from 'native-base';
import PopupDialog, {ScaleAnimation, DialogTitle} from 'react-native-popup-dialog';
import PushNotification from 'react-native-push-notification';
import ImagePicker from 'react-native-image-crop-picker';
import RNFS from 'react-native-fs';
import hashtagRegex from 'hashtag-regex';

// 資料庫 (PouchDB
const productExpDateDB = new PouchDB('productExpDate');

// 色彩
const priColor = {
  main: '#915c8b',
  mainRGBA: 'rgba(145,92,139,1)',
  light: '#c28abb',
  lightRGBA: 'rgba(162,103,155,1)',
  dark: '#62315e',
  darkRGBA: 'rgba(98,49,94,1)',
}
const secColor = {
  main: '#665f79',
  mainRGBA: 'rgba(102, 95, 121, 1)',
  light: '#948ca8',
  dark: '#3b354d',
  darkRGBA: 'rgba(59,53,77,1)',
}
const dividerColor = '#d9d5dc';

// 對話視窗動畫模式
const scaleAnimation = new ScaleAnimation();

//type Props = {};
export default class editPEI extends Component {
  constructor(props) {
    super(props);
    this.state = {
      isProductExpLoading: false,
      dataSource: [],
      PEI_itemName: '',
      PEI_createDate: new Date(),
      PEI_expDate: new Date(),
      PEI_desc: '',
      PEI_itemImage: null,
      PEI_imageUri:'',
      PEI_id: this.props.navigation.getParam('itemId'),
      calExpdateType: 'month',
      PEI_madeDate: new Date(),
      PEI_keepRange: '1',
      warnKeepRange: false,
      PEI_notifiId : moment(this.props.navigation.getParam('itemId')).format('X'),
      isChangeItemImage: false,
      hashTagsKeyword: '',
      hashTagsOriData: this.props.navigation.getParam('hashTags'),
      hashTagsPickerData: [],
      isShowTagPicker: false,
    };
    this.notifi_configure(this.notifi_onNotif);
    this.notifi_LastId = 0;
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
  
  // 刪除舊的期限通知
  _cancelOldNotifi() {
    PushNotification.cancelLocalNotifications({
      id: this.state.PEI_notifiId,
    })
  }

  // 日期挑選對話框
  _showDatePicker = async(whoCall, setDate = new Date()) => {
    try {
      const {action, year, month, day} = await DatePickerAndroid.open({
        date: setDate
      });
      if (action !== DatePickerAndroid.dismissedAction) {
        if (whoCall === 'expDate') {
          this.setState({
            PEI_expDate: new Date(year, month, day)
          });
        }
        if (whoCall === 'madeDate') {
          this.setState({
            PEI_madeDate: new Date(year, month, day)
          });
        }
      }
    } catch ({code, message}) {
      console.warn('Cannot open date picker', message);
    }
  }

  // 依 _id 取得冰存物資料
  _getPEI() {
    productExpDateDB.get(this.state.PEI_id)
    .then(result => {
      this.setState({
        PEI_itemName: result.itemName,
        PEI_createDate: new Date(result.createDate),
        PEI_expDate: new Date(result.expDate),
        PEI_desc: result.desc,
      });

      if (result.imageUri !== undefined && result.imageUri !== '') {
        let fileUri = 'file://' + RNFS.DocumentDirectoryPath + '/' + result.imageUri;

        this.setState({
          PEI_imageUri: result.imageUri,
          PEI_itemImage: {uri: fileUri},
        })
      }
    })
    .catch(error => console.warn('Error during get Item', error));
  }

  // 儲存冰存物資料 (PouchDB
  _updatePEI() {
    if (this.state.PEI_itemName !=='') {
      productExpDateDB.get(this.state.PEI_id)
      .then(doc => {
        //Alert.alert(this.state.PEI_id + ', ' + doc._rev)
        let id_X = moment(this.state.PEI_id).format('X');
        let imageFileName = this.state.PEI_imageUri;
        
        // 冰存物圖片處理
        if (this.state.isChangeItemImage) {
          if (this.state.PEI_itemImage) {
            let oriFilePath = this.state.PEI_itemImage.uri;
            let ext = oriFilePath.substr(oriFilePath.lastIndexOf('.') + 1);
            imageFileName = 'imgEPI_' + id_X + '.' + ext;
                      
            // 有圖儲存
            RNFS.copyFile(oriFilePath, RNFS.DocumentDirectoryPath + '/' + imageFileName)
            .then((success) => {
              //Alert.alert('儲存成功！')
            })
            .catch((err) => {
              console.warn(err);
            });
          } else {
            // 無圖刪除舊圖
            imageFileName = '';
            if (this.state.PEI_imageUri !== '') {
              RNFS.unlink(RNFS.DocumentDirectoryPath + '/' + this.state.PEI_imageUri)
                .then((success) => {
                  //Alert.alert('儲存成功！')
                })
                .catch((err) => {
                  console.warn(err);
                });
            }
          }
        }

        let iceBoxItem = {
          _id: this.state.PEI_id,
          _rev: doc._rev,
          itemName: this.state.PEI_itemName,
          createDate: this.state.PEI_createDate,
          expDate: this.state.PEI_expDate,
          desc: this.state.PEI_desc,
          imageUri: imageFileName,
        };

        return productExpDateDB.put(iceBoxItem);
      })
      .then(result => {
        // 取消前次通知，重設到期通知
        this._cancelOldNotifi();
        let notifiDate = new Date(moment(this.state.PEI_expDate).add(6, 'hours'));
        //let notifiDate = new Date(moment().add(30, 'seconds')); //測試用

        PushNotification.localNotificationSchedule({
          id: this.state.PEI_notifiId,
          date: notifiDate,
          title: '冰存物到期通知', 
          message: '「' + this.state.PEI_itemName + '」今日已屆保存期限，儘速處理掉吧！',
        });
        // 刷新列表並返回
        this.props.navigation.state.params.onGoBack();
        this.props.navigation.goBack();
      })
      .catch(error => console.warn('Error during update Item', error));
    }
  }

  // 刪除冰存物資料 (PouchDB
  _removePEI() {
    productExpDateDB.get(this.state.PEI_id)
    .then(doc => {
      return productExpDateDB.remove(doc);
    })
    .then(result => {
      // 移除該物到期通知
      this._cancelOldNotifi();
      
      // 移除該物圖片
      if (this.state.PEI_imageUri !== '') {
        RNFS.unlink(RNFS.DocumentDirectoryPath + '/' + this.state.PEI_imageUri)
          .then((success) => {
            //Alert.alert('儲存成功！')
          })
          .catch((err) => {
            console.warn(err);
          });
      }

      // 刷新列表並返回
      this.props.navigation.state.params.onGoBack();
      this.props.navigation.goBack();
    })
    .catch(error => console.warn('Error during update Item', error));
  }

  // 刪除冰存物資料_確認對話框
  _removePeiConfirm() {
    Alert.alert(
      '冰存物刪除',
      '確認刪除此冰存物？',
      [{
        text: '取消',
        onPress: () => {}
      },{
        text: '確定',
        onPress: () => {this._removePEI()}
      }]
    )
  }

  // 以製造日期推算保存期限
  _calExpdateFromMadedate() {
    if (/^\d+$/.test(this.state.PEI_keepRange)) {
      let keepRange = parseInt(this.state.PEI_keepRange);
      let madeDate = this.state.PEI_madeDate;
      let expDate = moment(madeDate).add(keepRange, this.state.calExpdateType);
      this.setState({
        PEI_expDate: new Date(expDate),
        warnKeepRange: false
      });
      this.popupDayAddType.dismiss();
    } else {
      this.setState({
        warnKeepRange: true,
      });
    }
  }

  // 檢查保存期是否為整數
  _checkKeepRange(keepRange){
    if (/^\d+$/.test(keepRange)) {
      this.setState({
        PEI_keepRange: keepRange,
        warnKeepRange: false
      });
    } else {
      this.setState({
        PEI_keepRange: keepRange,
        warnKeepRange: true,
      });
    }
  }

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
        isChangeItemImage: true,
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
        isChangeItemImage: true,
      });
    }).catch(e =>{});
  }

   // 清除已選圖片
   _clearPeiImage() {
    this.setState({
      PEI_itemImage: null,
    });
  }

  _doHashtagMatch(val) {
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
      PEI_desc: val,
      hashTagsKeyword: lastHashTag
    })

    let isShowTagPicker = false;
    if (val.lastIndexOf("#") === val.length - 1 && val !== '') {
      isShowTagPicker = true;
      this.setState({
        isShowTagPicker: true,
      })
    } else {
      this.setState({
        isShowTagPicker: false,
      })
    }
    
    if (lastHashTag !== '' && !isShowTagPicker) {
      let lastHashTagLen = lastHashTag.length;
      let lastSameLenWord = val.substr(val.length - lastHashTagLen);
      if (lastHashTag === lastSameLenWord) {
        this.setState({
          isShowTagPicker: true,
        })
        
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
          this.setState({
            isShowTagPicker: false,
          })
        }
      }
    } else {
      this.setState({
        hashTagsPickerData: this.state.hashTagsOriData,
      })
    }
  }

  // 選擇 hashtag
  _onPressTagPicker(tag){
    let value;
    let desc = this.state.PEI_desc;
    if (desc.lastIndexOf("#") === desc.length - 1) {
      value = desc.substr(0, desc.length - 1) + tag;
    } else {
    value = desc.substr(0, desc.length - this.state.hashTagsKeyword.length) + tag;
    }

    this.setState({
      PEI_desc: value,
      isShowTagPicker: false,
    })
    this._PeiDescInput._root.focus();
  }

  // 起始異步作業
  componentDidMount() {
    this._getPEI();
  }

  render() {
    // 保存期限顯示字串
    let expDateText = moment(this.state.PEI_expDate).format('YYYY年M月D日');
     // 製造日期顯示字串
     let madeDateText = moment(this.state.PEI_madeDate).format('YYYY年M月D日');
     let warnKeepRangeText = <Text></Text>
     if (this.state.warnKeepRange) {
       warnKeepRangeText = <Icon name='cancel' color='darkred' />
     }
    
    // 若有圖片則出現刪除 icon，若無則出現選擇相片 icon
    let renderPeiImage = null;
    if (this.state.PEI_itemImage) {
      renderPeiImage =
      <View style={{width:'90%', paddingLeft: 20, borderRadius: 5,}}>
        <Image 
          source={this.state.PEI_itemImage}
          style={{width: 180, height: 170, resizeMode: 'cover', marginLeft: 5, borderRadius: 5,}}
        />
      </View>
    } else {
      renderPeiImage =
      <View style={{flexDirection: 'row', width:'90%', paddingLeft: 15}}>
        <Button
          icon={{name: 'photo-camera', size: 32 }}
          buttonStyle={{width: 80, height: 80, backgroundColor: dividerColor, paddingLeft: 20}}
          containerViewStyle={{marginRight: 0}}
          onPress={() => this._pickExpItemPhoto()}
        />
        <Button
          icon={{name: 'image', size: 32 }}
          buttonStyle={{width: 80, height: 80, backgroundColor: dividerColor, paddingLeft: 20}}
          onPress={() => this._pickExpItemImage()}
        />
      </View>
    }

    // hashtag 選擇器
    let renderTagPicker = null;
    if (this.state.isShowTagPicker) {
      renderTagPicker =
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
          <Text style={{color: '#ffffff', fontSize: 20}}>編輯冰存品</Text>
          <Icon 
            name='delete'
            color='#ffffff'
            onPress={() => this._removePeiConfirm()}
            underlayColor='rgba(255,255,255,0)'
            size={32}
          />
        </Header>

        <View style={styles.container_4_2}>
          <Item style={{width: '90%', marginTop: 20}}>
            <Icon color={priColor.main} name='ac-unit' />
            <Input 
              placeholder='請輸入冰存品名稱…'
              onChangeText={(text) => this.setState({PEI_itemName: text})}  
              value={this.state.PEI_itemName}
            />
          </Item>

          <Item 
            style={{width: '90%', marginTop: 20}}
            onPress={this._showDatePicker.bind(this, 'expDate', this.state.PEI_expDate)}
          >
            <Icon color={priColor.main} name='today' />
            <Input 
              disabled
              value={expDateText}
            />
            <Button 
              title='製造日？'
              buttonStyle={styles.subButton}
              textStyle={styles.subButtonText}
              containerViewStyle={styles.subButtonContainer}
              onPress={() => this.popupDayAddType.show()}
            />
          </Item>

          <Item style={{width:'90%', marginTop: 20}}>
            <Icon color={priColor.main} name='assignment' />
            <Input 
              placeholder='請輸入備註或創建 #hashtag …'
              onChangeText={(text) => this._doHashtagMatch(text)}
              multiline={true}
              ref={ref => this._PeiDescInput = ref}
              value={this.state.PEI_desc}
            />
            <Button 
              title=' # '
              buttonStyle={styles.subButton}
              textStyle={styles.subButtonText}
              containerViewStyle={styles.subButtonContainer}
              onPress={() => {
                let val = this.state.PEI_desc + '#';
                this.setState({
                  PEI_desc: val,
                });
                this._doHashtagMatch(val);
                this._PeiDescInput._root.focus();
              }}
            />
          </Item>

          <View style={{width: '90%'}}>
          {renderTagPicker}
          </View>

          <Item 
            style={{width: '90%', marginTop: 20, borderBottomWidth: 0}}
            onPress={this.state.PEI_itemImage ? () => this._clearPeiImage() : () => this._pickExpItemImage()}
          >
            <Icon color={priColor.main} name='image' />
            <Input 
              disabled
              placeholder={this.state.PEI_itemImage ? '' : '選擇圖片…'}
            />
            <Icon
              name={this.state.PEI_itemImage ? 'clear' : 'navigate-next'}
              color='#aaa'
              size={32}
            />
          </Item>
          {renderPeiImage}

        </View>
         
        <ActionButton
          buttonColor={priColor.mainRGBA}
          fixNativeFeedbackRadius={true}
          renderIcon={() => (
            <Icon 
              name='done'
              color='#fff'
            />
          )}
          onPress={() => this._updatePEI()}
        />

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
      </View>
    );
  }
}

/*
<Divider style={{height: 1, width: '80%', backgroundColor: '#d9d5dc'}}/>
*/

const styles = StyleSheet.create({
  container: {
    height: 50,
    justifyContent: 'center',
    backgroundColor: priColor.main,
    alignItems: 'center',
  },
  container_3: {
    height: 40,
    flexDirection: 'row',
    backgroundColor: priColor.light,
    justifyContent: 'center',
    alignItems: 'center',
  },
  container_4_2: {
    flex: 6,
    backgroundColor: '#fafafa',
    justifyContent: 'flex-start',
    alignItems: 'center',
  },
  welcome: {
    fontSize: 20,
    textAlign: 'center',
    margin: 10,
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
});

/*
          <View style={{flexDirection: 'row', width:'80%', marginTop: 30}}>
            <View style={{justifyContent: 'flex-start'}}>
              <Icon color={priColor.main} name='today' containerStyle={{marginTop: 10}}/>
            </View>
            <View style={{flexDirection: 'row', justifyContent: 'center', marginLeft: 5}}>
              <Text style={styles.labelText}>保存期限</Text>
              <Text style={[styles.labelText, {marginLeft: 15}]}>{expDateText}</Text>
            </View>
            <View style={{flex: 1, justifyContent: 'center', alignItems:'flex-end' , marginLeft: 20}}>
              <Icon
                reverse
                raised
                name='today'
                color={priColor.main}
                size={18}
                onPress={this._showDatePicker.bind(this, 'expDate', this.state.PEI_expDate)}
                underlayColor='rgba(255,255,255,0)'
              />
              <Icon
                reverse
                raised
                name='date-range'
                color={priColor.main}
                size={18}
                onPress={() => {
                  this.popupDayAddType.show();
                }}
                underlayColor='rgba(255,255,255,0)'
              />
            </View>
          </View>
*/