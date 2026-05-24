import React from 'react';
import { WebView } from 'react-native-webview';
import { View, StyleSheet, ActivityIndicator } from 'react-native';

interface SOSMapProps {
  latitude: number;
  longitude: number;
  zoom?: number;
}

/**
 * SOSMap Component
 * Renders a Leaflet map with CartoDB Dark Matter tiles.
 * Shows user location with an orange squircle dot.
 */
const SOSMap: React.FC<SOSMapProps> = ({ latitude, longitude, zoom = 15 }) => {
  const htmlContent = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
        <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
        <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
        <style>
          body { margin: 0; padding: 0; background: #000000; }
          #map { height: 100vh; width: 100vw; }
          .leaflet-container { background: #000000 !important; }

          /* Custom Squircle Dot */
          .squircle-dot {
            background-color: #ee6c4d;
            width: 18px;
            height: 18px;
            border-radius: 6px; /* Squircle effect */
            border: 2px solid #ffffff;
            box-shadow: 0 0 15px rgba(238, 108, 77, 0.6);
          }
        </style>
      </head>
      <body>
        <div id="map"></div>
        <script>
          var map = L.map('map', {
            zoomControl: false,
            attributionControl: false,
            dragging: false,
            touchZoom: false,
            doubleClickZoom: false,
            scrollWheelZoom: false,
            boxZoom: false,
            keyboard: false
          }).setView([${latitude}, ${longitude}], ${zoom});

          L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
            maxZoom: 19,
          }).addTo(map);

          var customIcon = L.divIcon({
            html: '<div class="squircle-dot"></div>',
            className: 'custom-div-icon',
            iconSize: [18, 18],
            iconAnchor: [9, 9]
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
            pointerEvents="none" // Ensure map doesn't capture touches intended for parent
        />
      </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
  map: {
    flex: 1,
    backgroundColor: '#000000',
  },
});

export default SOSMap;
