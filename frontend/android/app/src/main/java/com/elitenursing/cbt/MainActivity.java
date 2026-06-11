package com.elitenursing.cbt;

import android.os.Bundle;
import com.getcapacitor.BridgeActivity;
import com.getcapacitor.community.pushnotifications.PushNotifications;

public class MainActivity extends BridgeActivity {
    @Override
    public void onCreate(Bundle savedInstanceState) {
        registerPlugin(PushNotifications.class);
        super.onCreate(savedInstanceState);
    }
}