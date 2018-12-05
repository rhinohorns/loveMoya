/**
 * Sample React Native App
 * https://github.com/facebook/react-native
 *
 * @format
 * @flow
 */

import React, {Component} from 'react';
import {Platform, StyleSheet, Text, Image}from 'react-native';
//import PouchDB from 'pouchdb-react-native';
import moment, { relativeTimeRounding } from 'moment';
import {Icon} from 'react-native-elements';
import {createDrawerNavigator, DrawerNavigator, StackNavigator} from 'react-navigation';
import ListPei from './PeiList'
import AddPei from './PeiAdd';
import EditPei from './PeiEdit';
import MemberList from './deqmaMemberList';
import MemberAdd from './deqmaMemberAdd';
import PetCalculator from './dqmPetCalculator';

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

// Greeting
class Greeting extends Component {
    render() {
        return (
            <Text style={styles.instructions}>Hello {this.props.name} !</Text>
        );
    }
}

// 圖片閃爍
class Blink extends Component {
  // 建構
  constructor(props) {
    super(props);
    this.state = {showImgO: true};

    setInterval(() => {
        this.setState(
          previousState => {
            return {showImgO: !previousState.showImgO};
          }
        );
      }, 500
    );
  }

  // 渲染
  render() {
    let display = this.state.showImgO ? require('./img/deqma_0.png') : require('./img/deqma_1.png');
    let curTime = new Date().toLocaleString();
    return (
      <Image source={display} style={styles.QQimg} />
    );
  }
}

// 表列冰存品頁面
class ListPeiScreen extends Component {
  static navigationOptions = {
    title: '冰存品提醒器',
    drawerLabel: '冰存品提醒器',
    drawerIcon: ({ tintColor }) => (
      <Icon
        name='home'
        color={tintColor}
      />
    ),
  };
  render() {
    return (
      <ListPei navigation={this.props.navigation}/>
    );
  }
}

// 新增冰存品頁面
class AddPeiScreen extends Component {
  static navigationOptions = {
    title: '新增冰存品',
    drawerLabel: () => null,
  };
  render() {
    return (
      <AddPei navigation={this.props.navigation}/>
    );
  }
}

// 修改冰存品頁面
class EditPeiScreen extends Component {
  static navigationOptions = {
    title: '修改冰存品',
    drawerLabel: () => null,
  };
  render() {
    return (
      <EditPei navigation={this.props.navigation}/>
    );
  }
}

// 會員列表頁面
class MemberListScreen extends Component {
  static navigationOptions = {
    title: '茶Q麻會員系統',
    drawerLabel: '茶Q麻會員系統',
    drawerIcon: ({ tintColor }) => (
      <Icon
        name='paw'
        type='material-community'
        color={tintColor}
      />
    ),
  };
  render() {
    return (
      <MemberList navigation={this.props.navigation}/>
    );
  }
}

// 會員新增頁面
class MemberAddScreen extends Component {
  static navigationOptions = {
    title: '新增會員',
    drawerLabel: () => null,
  };
  render() {
    return (
      <MemberAdd navigation={this.props.navigation}/>
    );
  }
}

// 毛孩一日所需頁面
class PetCalculatorScreen extends Component {
  static navigationOptions = {
    title: '毛孩一日所需',
    drawerLabel: () => null,
  };
  render() {
    return (
      <PetCalculator navigation={this.props.navigation}/>
    );
  }
}

// 冰存物提醒器
export const PeiStack = StackNavigator({
  PeiList: {screen: ListPei},
  AddPei: {screen: AddPei},
  EditPei: {screen: EditPei},
}, {
  initialRouteName: 'PeiList',
  headerMode: 'none',
});

// 茶Q麻會員管理系統
export const MemberStack = StackNavigator ({
  MemberList: {screen: MemberList,},
  MemberAdd: {screen: MemberAdd},
  PetCalculator: {screen: PetCalculator},
}, {
  initialRouteName: 'MemberList',
  headerMode: 'none',
});

// 設定各分頁
const RootSack = createDrawerNavigator({
  PeiStack: {
    screen: PeiStack,
    navigationOptions: {
      title: '冰存品提醒器',
      drawerLabel: '冰存品提醒器',
      drawerIcon: ({ tintColor }) => (
        <Icon
          name='home'
          color={tintColor}
        />
      ),
    },
  },
  MemberStack: {
    screen: MemberStack,
    navigationOptions: {
      title: '茶Q麻會員系統',
      drawerLabel: '茶Q麻會員系統',
      drawerIcon: ({ tintColor }) => (
        <Icon
          name='paw'
          type='material-community'
          color={tintColor}
        />
      ),
    },
  },
}, {
  initialRouteName: 'PeiStack',
  contentOptions: {
    activeTintColor: priColor.main,
  }
});

export default class App extends Component {
  render() {
    return <RootSack />;
  }
}

/*
  MemberList: MemberListScreen,
  MemberAdd: MemberAddScreen,
  PetCalculator: PetCalculatorScreen,
*/

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

        <TouchableHighlight onPress={() => this._getMovieData()} underlayColor='white'>
          <View style={styles.button}>
            <Text style={styles.buttonText}>重整電影</Text>
          </View>
        </TouchableHighlight>

        <TouchableNativeFeedback 
          onPress={() => this._getBusData()}
          background={Platform.OS === 'android' ? TouchableNativeFeedback.Ripple('#ffffff') : ''}
        >
          <View style={styles.button}>
            <Image
              source={require('./img/icon_renew.png')}
              style={{width: 24, height: 24, margin: 5,}}
            />
            <Text style={styles.buttonTextWithIcon}>票價更新</Text>
          </View>
        </TouchableNativeFeedback>

        const instructions = Platform.select({
          ios: 'Press Cmd+R to reload,\n' + 'Cmd+D or shake for dev menu',
          android:
            'Double tap R on your keyboard to reload,\n' +
            'Shake or press menu button for dev menu',
        });

        <ActionButton
          buttonColor={priColor.darkRGBA}
          fixNativeFeedbackRadius={true}
          renderIcon={() => (
            <Icon 
              name='note-add'
              color='#fff'
            />
          )}
          onPress={() => this.props.navigation.navigate('AddPei',{
            onGoBack: () => this._getProductExpInfo(),
          })}
        />
*/

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
// 捷運票價查詢頁面
class MrtPriceScreen extends Component {
  static navigationOptions = {
    title: '捷運票價查詢器',
    drawerLabel: '捷運票價查詢器',
    drawerIcon: ({ tintColor }) => (
      <Icon
        name='directions-subway'
        color={tintColor}
      />
    ),
  };
  render() {
    return (
      <MrtPrice navigation={this.props.navigation}/>
    );
  }
}

// 電影列表頁面
class MovieListScreen extends Component {
  static navigationOptions = {
    title: '電影列表',
    drawerLabel: '電影列表',
    drawerIcon: ({ tintColor }) => (
      <Icon
        name='movie'
        color={tintColor}
      />
    ),
  };
  render() {
    return (
      <MovieList navigation={this.props.navigation}/>
    );
  }
}
*/