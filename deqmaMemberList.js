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
import {Icon, Header, SearchBar, List, ListItem, Avatar} from 'react-native-elements';
import {createDrawerNavigator} from 'react-navigation';
import ActionButton from 'react-native-action-button';
import 'moment/min/locales';
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

//type Props = {};
export default class listPei extends Component {
  constructor(props) {
    super(props);
    UIManager.setLayoutAnimationEnabledExperimental && UIManager.setLayoutAnimationEnabledExperimental(true);
    this.state = {
      isActionButtonVisible: true,
      isMemberDataLoading: false,
      isProductExpLoading: false,
      dataSource: [],
      searchKeyword: '',
      hashTagsOriData: [
        {tag: '#男', count: 0},
        {tag: '#女', count: 0},
        {tag: '#台北市', count: 0},
        {tag: '#新北市', count: 0}
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

  // 取出會員列表 (PouchDB
  _getMembers() {
    this.setState({
      isMemberDataLoading: true,
    });

    let map = function(doc, emit) {
      emit(doc._id);
    };

    memberDB.query(map,{include_docs : true})
    .then(result => {
      // 處理資料並統計 hashtag
      let rows = [];
      const tagRegex = hashtagRegex();

      for (let i=0 ; i < result.rows.length ; i++) {
        //rows.push(result.rows[i]);

        // hashtag 整理
        let match;
        // 整理備註欄 hashtag
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

        // 整理居住地欄 hashtag
        while (match = tagRegex.exec(result.rows[i].doc.location)) {
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
        dataSource: result.rows,
        isMemberDataLoading: false,
      });
    })
    .catch(error => console.warn('Error during query Item', error));
  }

  // 會員列表中的寵物顯示格式
  _renderPets(pets) {
    const petSpeciesIcons = [
      {species: 'dog', iconName: 'paw'},
      {species: 'cat', iconName: 'paw'},
      {species: 'other', iconName: 'paw'}
    ];

    if (pets.length === 0) {
      return null;
    }

    return pets.map((pet) => {
      let renderPet;
      let petSpecies = petSpeciesIcons.find((elemSpecies) => {
        return pet.species === elemSpecies.species;
      })

      renderPet =
      <View style={{flexDirection: 'row'}}>
        <Icon
          color='#555'
          name={petSpecies.iconName}
          type='material-community'
          size={16}
          containerStyle={{paddingLeft: 10}}
        />
        <Text style={styles.item}>{pet.name}</Text>
      </View>

      return renderPet;
    })
  }

  // 會員列表格式
  _renderMemberRow({item}) {
    let isShow = false;
    // 關鍵字過濾
    if (this.state.searchKeyword === ''
    || item.doc.name.indexOf(this.state.searchKeyword) > -1
    || item.doc.desc.indexOf(this.state.searchKeyword) > -1
    || item.doc.location.indexOf(this.state.searchKeyword) > -1
    || item.doc.contact.indexOf(this.state.searchKeyword) > -1) {
        isShow = true
    };

    if (isShow) {
      let petNames = item.doc.pets.map((element) => {
        return element.name;
      });

      let petsNameText = petNames.join(', ');

      return (
        <ListItem
          roundAvatar
          title={item.doc.name}
          subtitle={
            <View style={{flexDirection: 'row'}}>
              <Icon
                color='#555'
                name='paw'
                type='material-community'
                size={16}
                containerStyle={{paddingLeft: 10}}
              />
              <Text style={styles.item}>{petsNameText}</Text>
              <Icon
                name='assignment'
                color='#555'
                size={16}
                containerStyle={{paddingLeft: 5}}
              />
              <Text style={styles.item}>{item.doc.desc}</Text>
            </View>
          }
          avatar={
            <Avatar 
              rounded
              title={item.doc.name[0]}
            />
          }
          onPress={this._toEditMember.bind(this, item.doc._id)}
          containerStyle={{borderBottomColor: '#e1e8ee'}}
        />
      )
    } else {
      return null;
    }
  }

  // 跳至修改會員頁面
  _toEditMember(memberId) {
    this.props.navigation.navigate('MemberAdd',{
      memberId: memberId,
      hashTags: this.state.hashTagsOriData,
      onGoBack: () => this._getMembers(),
    });
  }

  // 顯示會員列表
  _showMembersList() {
    if(this.state.dataSource.length === 0){
      return (
        <View style={{alignSelf: 'stretch', flex: 1}}></View>
      );
    }

    if(this.state.isMemberDataLoading){
      return (
        <ActivityIndicator style={{alignSelf: 'stretch', flex: 1}} />
      );
    } else {
      return (
        <List
          containerStyle={{alignSelf: 'stretch', flex: 1, marginTop: 0, borderTopWidth: 0}}
        >
          <FlatList
            data={this.state.dataSource}
            renderItem={this._renderMemberRow.bind(this)}
            keyExtractor={(item, index) => index.toString()}
            refreshControl={
              <RefreshControl 
                refreshing={this.state.isMemberDataLoading}
                onRefresh={() => this._getMembers()}
              />
            }
            onScroll={this._EPI_listOnScroll}
          />
        </List>
      );
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
    this._getMembers();
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
          <Text style={{color: '#fff', fontSize: 20}}>茶Q麻 × 會員管理</Text>
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
              searchKeyword: text,
            });
          }}
          onClearText={() => {return true;}}
          placeholder='請輸入會員關鍵字…'
          ref={search => this.search = search}
        />
        
        {/* 會員列表 */}
        <View style={styles.container_4_2}>
        { this._showMembersList() }
        </View>
        
        {this.state.isActionButtonVisible ? 
        <ActionButton 
          buttonColor={secColor.darkRGBA}
          fixNativeFeedbackRadius={true}
          >
          <ActionButton.Item
            size={36}
            buttonColor={secColor.dark}
            title='查尋全部'
            onPress={() => {this.search.clearText();}}
          >
            <Text style={{color: '#fff'}}>all</Text>
          </ActionButton.Item>
          
          <ActionButton.Item
            buttonColor={priColor.main}
            title='新增會員'
            onPress={() => this.props.navigation.navigate('MemberAdd',{
              memberId: '',
              hashTags: this.state.hashTagsOriData,
              onGoBack: () => this._getMembers(),
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

/*
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
*/