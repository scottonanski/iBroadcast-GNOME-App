#!/usr/bin/env gjs

imports.gi.versions.Gtk = '4.0';
const { Gtk, Gio, GLib } = imports.gi;
const Soup = imports.gi.Soup;

const API_URL = "https://api.ibroadcast.com/s/login_token";
const APP_ID = "1153"; // New App ID for iBroadcast for GNOME iBroadcast App for GNOME

function main() {
    let app = new Gtk.Application({
        application_id: 'com.example.ibroadcastapp',
        flags: Gio.ApplicationFlags.FLAGS_NONE
    });

    app.connect('activate', (app) => {
        let window = new Gtk.ApplicationWindow({
            application: app,
            title: 'iBroadcast Player',
            default_width: 600,
            default_height: 400
        });

        let label = new Gtk.Label({ label: 'Connecting to iBroadcast...' });
        window.set_child(label);
        window.present();

        loginToIBroadcast((authToken) => {
            if (!authToken) {
                print('Authentication failed.');
                label.set_label('Login failed.');
                return;
            }

            fetchTracks(authToken, (tracks) => {
                if (tracks) {
                    print(`Success! Found ${Object.keys(tracks).length} tracks`);
                    label.set_label(`Found ${Object.keys(tracks).length} tracks`);
                } else {
                    print('Failed to fetch tracks');
                    label.set_label('Connection failed');
                }
            });
        });
    });

    app.run(ARGV);
}

function loginToIBroadcast(callback) {
    const payload = `mode=login_token&app_id=1153&login_token=MG7B82`; // Use existing login_token: MG7B82

    print('Sending login request with payload:', payload);

    let session = new Soup.Session();
    let message = Soup.Message.new('POST', 'https://api.ibroadcast.com/s/login_token'); // Revert to dev endpoint with 200 history
    message.request_headers.append('Content-Type', 'application/x-www-form-urlencoded');
    message.request_headers.append('x-ibroadcast-app', 'gnome-app');
    message.request_headers.append('Cookie', `user_id=2206120; token=8558d0df-7889-11eb-ad2e-1418774e50a6`); // Add session cookies (update token if refreshed)
    message.set_request_body_from_bytes(
        'application/x-www-form-urlencoded',
        new GLib.Bytes(payload)
    );

    function onLoginResponse(session, result) {function loginToIBroadcast(callback) {
        const payload = `mode=login_token&app_id=1153&login_token=MG7B82`; // Use existing login_token: MG7B82
    
        print('Sending login request with payload:', payload);
    
        let session = new Soup.Session();
        let message = Soup.Message.new('POST', 'https://api.ibroadcast.com/s/login_token'); // Revert to dev endpoint with 200 history
        message.request_headers.append('Content-Type', 'application/x-www-form-urlencoded');
        message.request_headers.append('x-ibroadcast-app', 'gnome-app');
        message.request_headers.append('Cookie', `user_id=2206120; token=8558d0df-7889-11eb-ad2e-1418774e50a6`); // Add session cookies (update token if refreshed)
        message.set_request_body_from_bytes(
            'application/x-www-form-urlencoded',
            new GLib.Bytes(payload)
        );
    
        function onLoginResponse(session, result) {
            let bytes = session.send_and_read_finish(result);
            let responseText = bytes ? new TextDecoder().decode(bytes.get_data()) : null;
    
            let status = message.get_status();
            print('Login status:', status);
            print('Login response:', responseText);
    
            if (status === 200 && responseText && responseText.startsWith('{')) {
                let data = JSON.parse(responseText);
                if (data.authenticated && (data.token || data.result)) {
                    const authToken = data.token || "dummy_token";
                    const userId = data.user?.id; // Store user.id for future requests
                    const streamingServer = data.settings?.streaming_server;
                    const artworkServer = data.settings?.artwork_server;
                    print('Authenticated with token:', authToken, 'User ID:', userId, 'Servers:', streamingServer, artworkServer);
                    callback(authToken); // Pass the token for future requests
                } else {
                    print('Login failed: Invalid login_token or request');
                    callback(null);
                }
            } else {
                print('Login failed: Non-200 response');
                callback(null);
            }
        }
    
        session.send_and_read_async(message, 0, null, onLoginResponse); // Ensure correct method name
    }
        let bytes = session.send_and_read_finish(result);
        let responseText = bytes ? new TextDecoder().decode(bytes.get_data()) : null;

        let status = message.get_status();
        print('Login status:', status);
        print('Login response:', responseText);

        if (status === 200 && responseText && responseText.startsWith('{')) {
            let data = JSON.parse(responseText);
            if (data.authenticated && (data.token || data.result)) {
                const authToken = data.token || "dummy_token";
                const userId = data.user?.id; // Store user.id for future requests
                const streamingServer = data.settings?.streaming_server;
                const artworkServer = data.settings?.artwork_server;
                print('Authenticated with token:', authToken, 'User ID:', userId, 'Servers:', streamingServer, artworkServer);
                callback(authToken); // Pass the token for future requests
            } else {
                print('Login failed: Invalid login_token or request');
                callback(null);
            }
        } else {
            print('Login failed: Non-200 response');
            callback(null);
        }
    }

    session.send_and_read_async(message, 0, null, onLoginResponse); // Ensure correct method name
}
function fetchTracks(authToken, callback) {
    const payload = JSON.stringify({
        "mode": "library",
        "client": "gnome-app",
        "version": "0.1",
        "user_id": "2206120" // Use the user.id from login response, or keep this temporarily until login works
    });

    let session = new Soup.Session();
    let message = Soup.Message.new('POST', 'https://api.ibroadcast.com/json'); // Match login endpoint
    message.request_headers.append('Content-Type', 'application/json');
    message.request_headers.append('x-ibroadcast-app', 'gnome-app');
    message.request_headers.append("Authorization", `Bearer ${authToken}`);
    message.set_request_body_from_bytes(
        'application/json',
        new GLib.Bytes(payload)
    );

    function onLibraryResponse(session, result) {
        let bytes = session.send_and_read_finish(result);
        let responseText = bytes ? new TextDecoder().decode(bytes.get_data()) : null;

        let status = message.get_status();
        print('Library status:', status);
        print('Library response:', responseText);

        if (status === 200 && responseText && responseText.startsWith('{')) {
            let data = JSON.parse(responseText);
            if (data.library && data.library.tracks) {
                callback(data.library.tracks);
            } else {
                print('Error: No tracks found in response');
                callback(null);
            }
        } else {
            print('Library fetch failed: Non-200 response');
            callback(null);
        }
    }

    session.send_and_read_async(message, 0, null, onLibraryResponse); // Ensure correct method name
}

main();
