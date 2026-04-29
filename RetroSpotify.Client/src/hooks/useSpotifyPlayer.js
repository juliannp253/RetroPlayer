import { useState, useEffect } from 'react';

export const useSpotifyPlayer = (token) => {
  const [player, setPlayer] = useState(null);
  const [deviceId, setDeviceId] = useState(null);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    if (!token) return;

    const script = document.createElement("script");
    script.src = "https://sdk.scdn.co/spotify-player.js";
    script.async = true;
    document.body.appendChild(script);

    window.onSpotifyWebPlaybackSDKReady = () => {
      const spotifyPlayer = new window.Spotify.Player({
        name: 'RetroSpotify Web Player',
        getOAuthToken: cb => { cb(token); },
        volume: 0.5
      });

      setPlayer(spotifyPlayer);

      spotifyPlayer.addListener('ready', ({ device_id }) => {
        console.log('📻 SDK Listo en Dispositivo:', device_id);
        setDeviceId(device_id);
        setIsReady(true);
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