/**
 * Sample React Native App
 * https://github.com/facebook/react-native
 *
 * @format
 * @flow
 */

import React, {Component} from 'react';
import {Platform, StyleSheet, Text, View, Image, TextInput, Alert, FlatList, SectionList,
  ActivityIndicator, RefreshControl, DatePickerAndroid, TouchableNativeFeedback, UIManager,
  LayoutAnimation} from 'react-native';
import PouchDB from 'pouchdb-react-native';
import moment, { relativeTimeRounding } from 'moment';
import {Icon, Header, SearchBar} from 'react-native-elements';
import ActionButton from 'react-native-action-button';
import 'moment/min/locales';
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

//type Props = {};
export default class listPei extends Component {
  constructor(props) {
    super(props);
    UIManager.setLayoutAnimationEnabledExperimental && UIManager.setLayoutAnimationEnabledExperimental(true);
    this.state = {
      isActionButtonVisible: true,
      isProductExpLoading: false,
      dataSource: [],
      PEI_itemName: '',
      PEI_expDate: new Date(),
      PEI_desc: '',
      PEI_defExpDay: 3,
      PEI_searchKeyword: '',
      PEI_searchAleardyExp: false,
      PEI_searchAfterSafe: false,
      hashTagsOriData: [
        {tag: '#冷凍', count: 0},
        {tag: '#冷藏', count: 0},
        {tag: '#蔬果室', count: 0},
        {tag: '#冰箱門', count: 0}
      ],
    };
    moment.locale('zh-tw');
  }

  _EPI_listViewOffset = 0;
  // 偵側冰存物列表此時之滑動方向，並使 ActionButton 顯示或隱藏
  _EPI_listOnScroll = (event) => {
    // Simple fade-in / fade-out animation
    const CustomLayoutLinear = {
      duration: 100,
      create: { type: LayoutAnimation.Types.linear, property: LayoutAnimation.Properties.opacity },
      update: { type: LayoutAnimation.Types.linear, property: LayoutAnimation.Properties.opacity },
      delete: { type: LayoutAnimation.Types.linear, property: LayoutAnimation.Properties.opacity }
    }
    // Check if the user is scrolling up or down by confronting the new scroll position with your own one
    const currentOffset = event.nativeEvent.contentOffset.y
    const direction = (currentOffset > 0 && currentOffset > this._EPI_listViewOffset)
      ? 'down'
      : 'up'
    // If the user is scrolling down (and the action-button is still visible) hide it
    const isActionButtonVisible = direction === 'up'
    if (isActionButtonVisible !== this.state.isActionButtonVisible) {
      LayoutAnimation.configureNext(CustomLayoutLinear)
      this.setState({ isActionButtonVisible })
    }
    // Update your scroll position
    this._EPI_listViewOffset = currentOffset
  }

  // 查詢物品保存資料 (PouchDB
  _getProductExpInfo(searchKeyword = '') {
    this.setState({
      isProductExpLoading: true,
    });

    let map = function(doc, emit) {
          // 關鍵字過濾
          /*
          if (searchKeyword === ''
          || doc.itemName.indexOf(searchKeyword) > -1
          || doc.desc.indexOf(searchKeyword) > -1) {
            //isShow = true
            emit(doc._id);  
          };
          */
          emit(doc._id);
        };

    productExpDateDB.query(map, {include_docs : true})
    .then(result => {
      /*
      let rows = result.rows;
      if (rows.length > 1) {
        rows.sort(function(a, b){
          let dateA = new Date(a.doc.createDate);
          let dateB = new Date(b.doc.createDate);
          if (moment(dateA).isBefore(dateB)) {
            return 1;
          }
          if (moment(dateA).isAfter(dateB)) {
            return -1;
          }
          return 0;
        })
      }
      */

      // 倒置冰存資料並統計 hashtag
      let rows = [];
      const tagRegex = hashtagRegex();

      for (i=result.rows.length-1 ; i >= 0 ; i--) {
        rows.push(result.rows[i]);

        // hashtag 整理
        
        let match;
        while (match = tagRegex.exec(result.rows[i].doc.desc)) {
          const hashTag = match[0];
          let tagIndex = this.state.hashTagsOriData.findIndex((element) => {
            return element.tag === hashTag;
          });
          
          if (tagIndex > -1) {
            this.state.hashTagsOriData[tagIndex].count += 1;
          } else {
            this.state.hashTagsOriData.push({
              tag: hashTag,
              count: 1,
            })
          }
        }
      }

      // hashtag 依 count 排序
      this.state.hashTagsOriData.sort((tagA, tagB) => {
        return tagB.count - tagA.count;
      })

      this.setState({
        dataSource: rows,
        isProductExpLoading: false,
      });
    })
    .catch(error => console.warn('Error during query Item', error));
  }

  // 查詢過期品資料 (PouchDB
  _getPEI_aleardyExp() {
    this.setState({
      isProductExpLoading: true,
    });

    let today = new Date();
    let map = function(doc, emit) {
          let expDate = Date.parse(doc.expDate);
          if (moment(expDate).isBefore(today,'day')) {
            emit(doc._id);
          }
        };

    productExpDateDB.query(map,{include_docs : true})
    .then(result => {
      this.setState({
        dataSource: result.rows,
        isProductExpLoading: false,
      });
    })
    .catch(error => console.warn('Error during query Item', error));
  }

  // 顯示保存物列表
  _showProductExpList() {
    if(this.state.dataSource.length ===0){
      return (
        <View style={{alignSelf: 'stretch', flex: 1}}></View>
      );
    }

    if(this.state.isProductExpLoading){
      return (
        <ActivityIndicator style={{alignSelf: 'stretch', flex: 1}} />
      );
    } else {
      return (
        <FlatList
          data={this.state.dataSource}
          renderItem={this._renderProductExpList.bind(this)}
          keyExtractor={(item, index) => index.toString()}
          style={{alignSelf: 'stretch'}}
          refreshControl={
            <RefreshControl 
              refreshing={this.state.isProductExpLoading}
              onRefresh={() => this._getProductExpInfo()}
            />
          }
          onScroll={this._EPI_listOnScroll}
        />
      );
    }
  }

  // 跳至修改保存物頁面
  _toEditPei(itemId) {
    this.props.navigation.navigate('EditPei',{
      itemId: itemId,
      hashTags: this.state.hashTagsOriData,
      onGoBack: () => this._getProductExpInfo(),
    });
  }

  // 保存物列表格式
  _renderProductExpList({item}) {
    let isShow = false;
    let createDate = moment(item.doc.createDate).format('YYYY年M月D日');
    let expDate = Date.parse(item.doc.expDate);
    let expDateText = moment(item.doc.expDate).format('YYYY年M月D日');
    let today = new Date();
    let isExpToday = moment(expDate).isSame(today, 'day');

    let safeExpDate = moment(today).add(this.state.PEI_defExpDay, 'day');
    //let expStatus = '#333';
    let expStatus = moment(item.doc.expDate).endOf('day').fromNow().replace('內', '後');
    let statusItem = <Text>{expStatus}</Text>;
    
    if (/^[1-7]\s天/.test(expStatus)) {
      statusItem = <Text style={{fontWeight: 'bold', color: '#333'}}>{expStatus}</Text>;
    } 

    let firstItemStyle = styles.firstItemView

    if (moment(expDate).isBefore(today,'day')) {
      expStatus = 'darkred';
      //statusItem = <Icon name='event-busy' color='darkred' size={30}/>;
      statusItem = <Image source={require('./img/icon_expired.png')} style={styles.iconImg}/>
      firstItemStyle = styles.firstItemViewError;
    } else {
      if (moment(expDate).isSameOrBefore(safeExpDate,'day')) {
        expStatus = '#ff8f00';
        //statusItem = <Icon name='report' color='#ff8f00' size={33}/>;
        statusItem = <Image source={require('./img/icon_will_expired.png')} style={styles.iconImg}/>
        firstItemStyle = styles.firstItemViewWarning;
      }
    }

    if (moment(expDate).isSame(today,'day')) {
      expStatus = '#ff8f00';
      //statusItem = <Icon name='report' color='#ff8f00' size={33}/>;
      statusItem = <Image source={require('./img/icon_today_expired.png')} style={styles.iconImg}/>
      firstItemStyle = styles.firstItemViewWarning;
    }
    
    // 關鍵字過濾
    if (this.state.PEI_searchKeyword === ''
    || item.doc.itemName.indexOf(this.state.PEI_searchKeyword) > -1
    || item.doc.desc.indexOf(this.state.PEI_searchKeyword) > -1
    || createDate.indexOf(this.state.PEI_searchKeyword) > -1
    || expDateText.indexOf(this.state.PEI_searchKeyword) > -1) {
        isShow = true
    };

    // 過期品過濾
    if (this.state.PEI_searchAleardyExp){ 
      if (expStatus === 'darkred') {
        isShow = isShow && true;
      } else {
        isShow = false
      }
    }

    // 超過安全期品過濾
    if (this.state.PEI_searchAfterSafe){ 
      if (expStatus === 'darkred' || expStatus === '#ff8f00') {
        isShow = isShow && true;
      } else {
        isShow = false
      }
    }

    if (isShow) {
      return (
        <TouchableNativeFeedback 
            onPress={this._toEditPei.bind(this,item.doc._id)}
            background={Platform.OS === 'android' ? TouchableNativeFeedback.Ripple('rgba(200,200,200,0.5)', false) : ''}
        >
        <View style={{flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: '#e1e8ee'}}>
          <View style={{flex: 7}}>
            <View style={[firstItemStyle, {paddingTop: 5}]}>
              <Text style={[styles.firstItem, {color: '#000', fontSize: 17}]}>{item.doc.itemName}</Text>
            </View>
            <View style={[firstItemStyle, {flexDirection: 'row', alignContent: 'center', paddingTop: 5}]}>
              <Icon
                name='today'
                color='#aaa'
                size={16}
                containerStyle={{paddingLeft: 15}}
              />
              <Text style={styles.item}>{createDate}</Text>
              <Icon
                name='arrow-forward'
                color='#555'
                size={16}
                containerStyle={{paddingLeft: 5}}
              />
              <Text style={[styles.item, {color: '#333'}, isExpToday ? {fontWeight: 'bold'} : null]}>{expDateText}</Text>
            </View>
            <View style={[firstItemStyle, {flexDirection: 'row', paddingBottom: 5, paddingTop: 5}]}>
              <Icon
                name='edit'
                color='#aaa'
                size={16}
                containerStyle={{paddingLeft: 15}}
              />
              <Text style={[styles.item, {fontSize: 13}]}>{item.doc.desc}</Text>
            </View>
          </View>
          <View style={{justifyContent: 'center', alignItems: 'center', flex: 2}}>
            {statusItem}
          </View>
        </View>  
        </TouchableNativeFeedback>
      );
    } else {
      return <View></View>;
    }
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

  // 起始異步作業
  componentDidMount() {
    this._getProductExpInfo();
  }

  render() {
    return (
      <View style={{flex: 1}}>
        <Header
          backgroundColor={priColor.main}
          outerContainerStyles={{borderBottomWidth: 0, elevation: 5}}
        >
          <Icon 
            name='menu'
            color='#fff'
            onPress={() => this.props.navigation.toggleDrawer()}
            underlayColor='rgba(255,255,255,0)'
          />
          <Text style={{color: '#fff', fontSize: 20}}>茶Q麻 × 我愛小茉茉</Text>
          <Icon 
            name='home'
            color='#fff'
            underlayColor='rgba(255,255,255,0)'
          />
        </Header>
        <SearchBar
          round
          lightTheme
          onChangeText={(text) => {
            this.setState({
              PEI_searchKeyword: text,
            });
          }}
          onClearText={() => {return true;}}
          placeholder='請輸入冰存物關鍵字…'
          ref={search => this.search = search}
        />
        
        {/* 保存品列表 */}
        <View style={styles.container_4_2}>
        {
          this._showProductExpList()
        }
        </View>
        
        {this.state.isActionButtonVisible ? 
        <ActionButton 
          buttonColor={secColor.mainRGBA}
          fixNativeFeedbackRadius={true}
          >
          <ActionButton.Item
            size={36}
            buttonColor={secColor.main}
            title='查尋全部'
            onPress={() => {this.setState({
              PEI_searchAleardyExp: false,
              PEI_searchAfterSafe: false,
              });
              this.search.clearText();
            }}
          >
            <Text style={{color: '#fff'}}>all</Text>
          </ActionButton.Item>
          <ActionButton.Item
            size={46}
            buttonColor='#ff8f00'
            title='即將過期及過期'
            onPress={() => this.setState({
              PEI_searchAleardyExp: false,
              PEI_searchAfterSafe: true,
            })}
          >
            <Icon 
              name='priority-high'
              color='#fff'
            />
          </ActionButton.Item>
          <ActionButton.Item
            size={46}
            buttonColor='darkred'
            title='查尋過期'
            onPress={() => this.setState({
              PEI_searchAleardyExp: true,
              PEI_searchAfterSafe: false,
            })}
          >
            <Icon 
              name='close'
              color='#fff'
            />
          </ActionButton.Item>
          <ActionButton.Item
            buttonColor={priColor.main}
            title='新增冰存'
            onPress={() => this.props.navigation.navigate('AddPei',{
              hashTags: this.state.hashTagsOriData,
              onGoBack: () => this._getProductExpInfo(),
            })}
          >
            <Icon 
              name='note-add'
              color='#fff'
            />
          </ActionButton.Item>
        </ActionButton>
        :
        null
        }
      </View>
    );
  }
}

const styles = StyleSheet.create({
  container: {
    height: 50,
    justifyContent: 'center',
    backgroundColor: '#d3cfd9',
    alignItems: 'center',
  },
  container_2: {
    flex: 2,
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
  },
  container_3: {
    height: 40,
    flexDirection: 'row',
    backgroundColor: priColor.light,
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
    flex: 6,
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
    fontSize: 16,
  },
  button: {
    flexDirection: 'row',
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
  firstItemView: {
    borderLeftWidth: 10,
    borderLeftColor: priColor.light,
  },
  firstItemViewError: {
    borderLeftWidth: 10,
    borderLeftColor: secColor.main,
  },
  firstItemViewWarning: {
    borderLeftWidth: 10,
    borderLeftColor: priColor.main,
  },
  firstItem: {
    paddingLeft: 15,
    fontSize: 16,
  },
  item: {
    paddingLeft: 5,
    fontSize: 13,
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
  iconImg: {
    width: 48,
    height: 48,
  },
});
