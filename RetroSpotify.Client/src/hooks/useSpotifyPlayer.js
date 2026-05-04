import { useState, useEffect, useRef } from 'react';
import axios from 'axios'; 

export const useSpotifyPlayer = (token, onPlayerStateChanged) => {
  const [player, setPlayer] = useState(null);
  const [deviceId, setDeviceId] = useState(null);
  const [isReady, setIsReady] = useState(false);
  const onStateChangedRef = useRef(onPlayerStateChanged);

  useEffect(() => {
    onStateChangedRef.current = onPlayerStateChanged;
  }, [onPlayerStateChanged]);

  useEffect(() => {
    if (!token) return;

    const script = document.createElement("script");
    script.src = "https://sdk.scdn.co/spotify-player.js";
    script.async = true;
    document.body.appendChild(script);

    window.onSpotifyWebPlaybackSDKReady = () => {
      const spotifyPlayer = new window.Spotify.Player({
        name: 'RetroSpotify Web Player',
        
        getOAuthToken: async (cb) => {
          let currentToken = localStorage.getItem('spotify_token');

          try {
            await axios.get('https://api.spotify.com/v1/me', {
              headers: { Authorization: `Bearer ${currentToken}` }
            });

            const validToken = localStorage.getItem('spotify_token');
            cb(validToken);

          } catch (error) {
            console.error("Error al validar el token para el Player SDK:", error);
            cb(currentToken);
          }
        },
        
        volume: 0.5
      });

      setPlayer(spotifyPlayer);

      spotifyPlayer.addListener('ready', ({ device_id }) => {
        console.log('SDK Listo en Dispositivo:', device_id);
        setDeviceId(device_id);
        setIsReady(true);
      });

      spotifyPlayer.addListener('player_state_changed', (state) => {
        if (onStateChangedRef.current) {
          onStateChangedRef.current(state);
        }
      });

      spotifyPlayer.addListener('initialization_error', ({ message }) => console.error(message));
      spotifyPlayer.addListener('authentication_error', ({ message }) => console.error(message));

      spotifyPlayer.connect();
    };

    return () => {
      if (player) {
        player.disconnect();
      }
    };
  }, [token]); 

  return { player, deviceId, isReady };
};