package com.deqma.moloha;

import android.app.Application;

import com.facebook.react.ReactApplication;
import com.wheelpicker.WheelPickerPackage;
import com.rnfs.RNFSPackage;
import com.reactnative.ivpusic.imagepicker.PickerPackage;
import com.dieam.reactnativepushnotification.ReactNativePushNotificationPackage;
import com.oblador.vectoricons.VectorIconsPackage;
import com.facebook.react.ReactNativeHost;
import com.facebook.react.ReactPackage;
import com.facebook.react.shell.MainReactPackage;
import com.facebook.soloader.SoLoader;
import com.facebook.react.modules.storage.ReactDatabaseSupplier;

import java.util.Arrays;
import java.util.List;

public class MainApplication extends Application implements ReactApplication {

  private final ReactNativeHost mReactNativeHost = new ReactNativeHost(this) {
    @Override
    public boolean getUseDeveloperSupport() {
      return BuildConfig.DEBUG;
    }

    @Override
    protected List<ReactPackage> getPackages() {
      long size = 50L * 1024L * 1024L; // 50 MB
      com.facebook.react.modules.storage.ReactDatabaseSupplier.getInstance(getApplicationContext()).setMaximumSize(size);

      return Arrays.<ReactPackage>asList(
          new MainReactPackage(),
            new WheelPickerPackage(),
            new RNFSPackage(),
            new PickerPackage(),
            new ReactNativePushNotificationPackage(),
            new VectorIconsPackage()
      );
    }

    @Override
    protected String getJSMainModuleName() {
      return "index";
    }
  };

  @Override
  public ReactNativeHost getReactNativeHost() {
    return mReactNativeHost;
  }

  @Override
  public void onCreate() {
    super.onCreate();
    SoLoader.init(this, /* native exopackage */ false);
  }
}
