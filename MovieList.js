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

//type Props = {};
export default class MovieList extends Component {
  constructor(props) {
    super(props);
    this.state = {
      isMovieLoading: false,
    };
  }

   // 取得網路電影資料
   _getMovieData() {
    this.setState({
      isMovieLoading: true,
    });
    return fetch('https://facebook.github.io/react-native/movies.json')
    .then((response) => response.json())
    .then((responseJson) => {
      this.setState({
        isMovieLoading: false,
        dataSource: responseJson.movies,
      });
    })
    .catch((error) => {
      console.error(error);
    });
  }

  // 顯示電影資料
  _showMovieData() {
    if(this.state.isMovieLoading){
      return(
        <ActivityIndicator style={{alignSelf: 'stretch', flex: 1}} />
      );
    } else {
      return(
        <FlatList
          data={this.state.dataSource}
          renderItem={({item}) => <Text style={styles.item}>{item.title}, {item.releaseYear}</Text>}
          keyExtractor={(item, index) => index.toString()}
          style={{alignSelf: 'stretch'}}
          refreshControl={
            <RefreshControl 
              refreshing={this.state.isMovieLoading}
              onRefresh={() => this._getMovieData()}
            />
          }
        />
      );
    }
  }

  // 起始異步作業
  componentDidMount() {
    this._getMovieData();
  }

  render() {
    return (
      <View style={{flex: 1}}>
        <View style={styles.container}>
          <Text style={styles.welcome}>我愛小茉茉</Text>
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
            this._showMovieData()
          }  
        </View>
        
        <View style={styles.container_3}>
          <Button 
            raised
            icon={{name: 'replay'}}
            title='更新'
            backgroundColor='#915c8b'
            onPress={() => this._getMovieData()}
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
