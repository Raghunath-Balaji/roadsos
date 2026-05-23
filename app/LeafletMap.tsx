import React from 'react';
import { WebView } from 'react-native-webview';
import { View, StyleSheet } from 'react-native';

interface LeafletMapProps {
  latitude: number;
  longitude: number;
  zoom?: number;
}

const LeafletMap: React.FC<LeafletMapProps> = ({ latitude, longitude, zoom = 15 }) => {
  const htmlContent = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
        <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
        <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
        <style>
          body { margin: 0; padding: 0; }
          #map { height: 100vh; width: 100vw; background: #1e293b; }
          .leaflet-container { background: #1e293b ! from; }
        </style>
      </head>
      <body>
        <div id="map"></div>
        <script>
          var map = L.map('map', {
            zoomControl: false,
            attributionControl: false
          }).setView([${latitude}, ${longitude}], ${zoom});

          L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            maxZoom: 19,
          }).addTo(map);

          var customIcon = L.divIcon({
            html: '<div style="background-color: #ef4444; width: 20px; height: 20px; border-radius: 50%; border: 2px solid white; box-shadow: 0 0 10px rgba(0,0,0,0.5);"></div>',
            className: 'custom-div-icon',
            iconSize: [20, 20],
            iconAnchor: [10, 10]
          });

          L.marker([${latitude}, ${longitude}], { icon: customIcon }).addTo(map);
        </script>
      </body>
    </html>
  `;

  return (
      <View style={styles.container}>
        <WebView
            originWhitelist={['*']}
            source={{ html: htmlContent }}
            style={styles.map}
            scrollEnabled={false}
            zoomEnabled={false}
        />
      </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    overflow: 'hidden',
  },
  map: {
    flex: 1,
  },
});

export default LeafletMap;