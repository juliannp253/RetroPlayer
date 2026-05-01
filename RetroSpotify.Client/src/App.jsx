import React, { useEffect, useState, useRef } from 'react';
import axios from 'axios';
import './App.css';
import { useSpotifyPlayer } from './hooks/useSpotifyPlayer';

axios.interceptors.response.use(
  (response) => response, 
  async (error) => {
    const originalRequest = error.config;

    if (error.response && error.response.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true; 

      const refreshToken = localStorage.getItem('spotify_refresh_token');

      if (refreshToken) {
        try {
          console.warn("Token caducado. Intentando refresh silencioso...");
          
          const res = await axios.get(`${import.meta.env.VITE_API_URL}/api/auth/refresh?refreshToken=${refreshToken}`);
          
          const { access_token } = res.data; 

          localStorage.setItem('spotify_token', access_token);

          originalRequest.headers['Authorization'] = `Bearer ${access_token}`;
          return axios(originalRequest);
          
        } catch (refreshError) {
          console.error("Falló el refresh token. Forzando login manual.");
          localStorage.removeItem('spotify_token');
          localStorage.removeItem('spotify_refresh_token');
          window.location.href = `${import.meta.env.VITE_API_URL}/api/auth/login`;
        }
      } else {
        localStorage.removeItem('spotify_token');
        window.location.href = `${import.meta.env.VITE_API_URL}/api/auth/login`;
      }
    }
    
    return Promise.reject(error);
  }
);

const PixelPrev = () => (
  <svg width="18" height="18" viewBox="0 0 16 16" fill="currentColor">
    <rect x="2" y="4" width="2" height="8" />
    <rect x="4" y="7" width="2" height="2" />
    <rect x="6" y="6" width="2" height="4" />
    <rect x="8" y="5" width="2" height="6" />
    <rect x="10" y="4" width="2" height="8" />
  </svg>
);

const PixelNext = () => (
  <svg width="18" height="18" viewBox="0 0 16 16" fill="currentColor">
    <rect x="4" y="4" width="2" height="8" />
    <rect x="6" y="5" width="2" height="6" />
    <rect x="8" y="6" width="2" height="4" />
    <rect x="10" y="7" width="2" height="2" />
    <rect x="12" y="4" width="2" height="8" />
  </svg>
);

const PixelShuffle = () => (
  <svg width="18" height="18" viewBox="0 0 16 16" fill="currentColor">
    <rect x="2" y="4" width="3" height="2" />
    <rect x="5" y="6" width="2" height="2" />
    <rect x="7" y="8" width="2" height="2" />
    <rect x="9" y="10" width="5" height="2" />
    <rect x="11" y="8" width="2" height="2" />
    <rect x="11" y="12" width="2" height="2" />
    
    <rect x="2" y="10" width="3" height="2" />
    <rect x="5" y="8" width="2" height="2" />
    <rect x="7" y="6" width="2" height="2" />
    <rect x="9" y="4" width="5" height="2" />
    <rect x="11" y="2" width="2" height="2" />
    <rect x="11" y="6" width="2" height="2" />
  </svg>
);

const PixelRepeat = () => (
  <svg width="18" height="18" viewBox="0 0 16 16" fill="currentColor">
    <rect x="3" y="3" width="8" height="2" />
    <rect x="11" y="5" width="2" height="6" />
    <rect x="9" y="1" width="2" height="2" />
    <rect x="9" y="5" width="2" height="2" />
    <rect x="5" y="11" width="8" height="2" />
    <rect x="3" y="5" width="2" height="6" />
    <rect x="5" y="9" width="2" height="2" />
    <rect x="5" y="13" width="2" height="2" />
  </svg>
);

function App() {
  const [playlists, setPlaylists] = useState([]);
  const [selectedPlaylist, setSelectedPlaylist] = useState(null);
  const [tracks, setTracks] = useState([]);
  const [loadingTracks, setLoadingTracks] = useState(false);
  const [currentTrack, setCurrentTrack] = useState(null);
  const [isWakingUp, setIsWakingUp] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [progressMs, setProgressMs] = useState(0);
  const [isShuffle, setIsShuffle] = useState(false);
  const [isRepeat, setIsRepeat] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);

  const tracksRef = useRef([]);
  const deviceIdRef = useRef(null);
  const tokenRef = useRef(null);
  const playerRef = useRef(null);  
  
  const token = localStorage.getItem('spotify_token');
  tokenRef.current = token;

  const { player, deviceId, isReady } = useSpotifyPlayer(token, null);

  useEffect(() => {
    deviceIdRef.current = deviceId;
  }, [deviceId]);
  
  useEffect(() => {
    tracksRef.current = tracks;
  }, [tracks]);

  useEffect(() => {
    playerRef.current = player;
  }, [player]);

  // HELPERS
  const getDurationMs = (durationStr) => {
    if (!durationStr) return 0;
    const [mins, secs] = durationStr.split(':').map(Number);
    return (mins * 60 + secs) * 1000;
  };

  const formatProgress = (ms) => {
    const totalSeconds = Math.floor(ms / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  // PLAY TRACK
  const playTrack = async (track, index) => {
    const currentDeviceId = deviceIdRef.current;
    const currentToken = tokenRef.current;
 
    if (!currentDeviceId || !track?.uri) return;
 
    try {
      const list = tracksRef.current;
      const urisFromHere = list.slice(index).map(t => t.uri);
 
      await axios.put(
        `https://api.spotify.com/v1/me/player/play?device_id=${currentDeviceId}`,
        { uris: urisFromHere },
        { headers: { Authorization: `Bearer ${currentToken}` } }
      );
 
      setCurrentTrack(track);
      setCurrentIndex(index);
      setProgressMs(0);
      setIsPlaying(true);
    } catch (err) {
      console.error('Error reproduciendo track:', err);
    }
  };

  // CONECTAR SDK
  useEffect(() => {
    if (!player) return;
 
    const handleStateChanged = (state) => {
      if (!state) return;
 
      const finished =
        state.paused &&
        state.position === 0 &&
        state.track_window.previous_tracks.length > 0;
 
      if (finished) {
        const list = tracksRef.current;
        setCurrentIndex(prev => {
          const nextIndex = prev + 1;
          if (nextIndex < list.length) {
            playTrack(list[nextIndex], nextIndex);
          }
          return nextIndex < list.length ? nextIndex : prev;
        });
        return;
      }
 
      setIsPlaying(!state.paused);
    };
 
    player.removeListener('player_state_changed');
    player.addListener('player_state_changed', handleStateChanged);
 
    return () => {
      player.removeListener('player_state_changed');
    };
  }, [player, currentIndex]);

  useEffect(() => {
    if (!('mediaSession' in navigator)) return;

    navigator.mediaSession.setActionHandler('previoustrack', () => {
      const list = tracksRef.current;
      setCurrentIndex(prev => {
        const prevIndex = Math.max(prev - 1, 0);
        playTrack(list[prevIndex], prevIndex);
        return prevIndex;
      });
    });

    navigator.mediaSession.setActionHandler('nexttrack', () => {
      const list = tracksRef.current;
      setCurrentIndex(prev => {
        const nextIndex = prev + 1;
        if (nextIndex < list.length) {
          playTrack(list[nextIndex], nextIndex);
          return nextIndex;
        }
        return prev;
      });
    });

    navigator.mediaSession.setActionHandler('play', () => {
      playerRef.current?.togglePlay();
    });

    navigator.mediaSession.setActionHandler('pause', () => {
      playerRef.current?.togglePlay();
    });

  }, [player]);

    useEffect(() => {
    if (!currentTrack || !('mediaSession' in navigator)) return;

    navigator.mediaSession.metadata = new MediaMetadata({
      title: currentTrack.name,
      artist: currentTrack.artist,
      artwork: currentTrack.albumArt
        ? [{ src: currentTrack.albumArt, sizes: '640x640', type: 'image/jpeg' }]
        : []
    });
  }, [currentTrack]);

  // BARRA DE PROGRESO
  useEffect(() => {
    let interval = null;
    if (isPlaying) {
      interval = setInterval(() => {
        setProgressMs((prev) => {
          const totalMs = currentTrack ? getDurationMs(currentTrack.duration) : 0;
          if (prev >= totalMs) {
            clearInterval(interval);
            setIsPlaying(false);
            return totalMs;
          }
          return prev + 1000; 
        });
      }, 1000);
    } else {
      clearInterval(interval);
    }
    return () => clearInterval(interval);
  }, [isPlaying, currentTrack]);

  // CARGA INICIAL
  useEffect(() => { 
    if (token) loadPlaylists(); 
  }, [token]);

  const loadPlaylists = async () => {
    setIsWakingUp(true); 
    try {
      const res = await axios.get(`${import.meta.env.VITE_API_URL}/api/music/playlists`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setPlaylists(res.data);
      if (res.data.length > 0) {
        openPlaylist(res.data[0]);
      }
    } catch (err) {
      console.error('Error cargando playlists:', err);
    } finally {
      setIsWakingUp(false); 
    }
  };

  const openPlaylist = async (playlist) => {
    setLoadingTracks(true);
    setSelectedPlaylist(playlist);
    try {
      const res = await axios.get(`${import.meta.env.VITE_API_URL}/api/music/playlists/${playlist.id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setTracks(res.data);
    } catch (err) {
      console.error('Error abriendo playlist:', err);
    } finally {
      setLoadingTracks(false);
    }
  };

  // CONTROLES
  const handleControl = async (action) => {
    if (!isReady || !player) return;
    const list = tracksRef.current;

    switch (action) {
      case 'prev': {
        const prevIndex = Math.max(currentIndex - 1, 0);
        await playTrack(list[prevIndex], prevIndex);
        break;
      }
      case 'toggle':
        await player.togglePlay();
        setIsPlaying(!isPlaying);
        break;
      case 'next': {
        const nextIndex = currentIndex + 1;
        if (nextIndex < list.length) {
          await playTrack(list[nextIndex], nextIndex);
        }
        break;
      }
      default:
        break;
    }
  };

  // ── LOGIN SCREEN ──────────────────────────────────────────────────────────
  if (!token) {
    return (
      <div className="login-screen">
        <h1 style={{ color: 'var(--sp-green)', fontSize: '1.2rem', textAlign: 'center', lineHeight: '1.5' }}>
          RETRO PLAYER SPOTIFY<br/>
          <span style={{ fontSize: '0.5rem', color: '#fff' }}>WEB SYSTEM v1.0</span>
        </h1>
        <button
          onClick={() => window.location.href = `${import.meta.env.VITE_API_URL}/api/auth/login`}
          className="login-btn"
        >
          INICIAR SESION
        </button>
      </div>
    );
  }

  // ── APP LAYOUT ────────────────────────────────────────────────────────────
  return (
    <div className="app-container">
      
      {/* BARRA LATERAL */}
      <div className="panel sidebar">
        <div className="sidebar-header">
          <span>|||</span> Tu biblioteca
        </div>
        <div className="playlist-list">
          {playlists.map((p) => (
            <div 
              key={p.id} 
              className={`playlist-item ${selectedPlaylist?.id === p.id ? 'active' : ''}`}
              onClick={() => openPlaylist(p)}
            >
              {p.name.toUpperCase()}
            </div>
          ))}
        </div>
      </div>

      {/* VISTA PRINCIPAL CONTENIDO */}
      <div className="panel main-view">
        {selectedPlaylist ? (
          <>
            <div className="main-header">
              <div className="playlist-meta">PLAYLIST</div>
              <div className="playlist-title-large">{selectedPlaylist.name.toUpperCase()}</div>
              <div className="playlist-meta">
                {tracks.length} TRACKS DETECTADOS
              </div>
            </div>
            
            <div className="main-content">
              {loadingTracks ? (
                <div style={{ color: 'var(--sp-green)', fontSize: '0.6rem' }}>CARGANDO DATOS...</div>
              ) : (
                <table className="track-table">
                  <thead>
                    <tr>
                      <th style={{ width: '40px' }}>#</th>
                      <th>TÍTULO</th>
                      <th style={{ textAlign: 'right' }}>DUR</th>
                    </tr>
                  </thead>
                  <tbody>
                    {tracks.map((track, index) => {
                      const isActive = currentTrack?.id === track.id;
                      return (
                        <tr 
                          key={`${track.id}-${index}`} 
                          className={`track-row ${isActive ? 'active' : ''}`}
                          onClick={() => playTrack(track, index)}
                        >
                          <td>{isActive ? '▶' : index + 1}</td>
                          <td>
                            <span className="track-title">{track.name.toUpperCase()}</span>
                            <span>{track.artist.toUpperCase()}</span>
                          </td>
                          <td style={{ textAlign: 'right' }}>{track.duration}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              )}
            </div>
          </>
        ) : (
          <div style={{ padding: '24px', fontSize: '0.6rem' }}>SELECCIONA UNA PLAYLIST</div>
        )}
      </div>

      {/* REPRODUCTOR */}
      <div className="bottom-bar">
        
        {/* Info del Track Actual */}
        <div className="now-playing-info">
          <div className="album-art-placeholder" style={{ padding: 0, overflow: 'hidden' }}>
            {currentTrack?.albumArt ? (
              <img 
                src={currentTrack.albumArt} 
                alt="Portada" 
                style={{ 
                  width: '100%', 
                  height: '100%', 
                  objectFit: 'cover',
                  imageRendering: 'pixelated' 
                }} 
              />
            ) : (
              currentTrack ? '♪' : '?'
            )}
          </div>
          <div className="np-text">
            <span className="np-title">
              {currentTrack ? currentTrack.name.toUpperCase() : 'SIN REPRODUCCIÓN'}
            </span>
            <span className="np-artist">
              {currentTrack ? currentTrack.artist.toUpperCase() : '---'}
            </span>
          </div>
        </div>

        {/* Controles Principales */}
        <div className="player-controls">
          <div className="btn-row">
            <button 
              className={`btn-ctrl ${isShuffle ? 'active' : ''}`} 
              onClick={() => setIsShuffle(!isShuffle)} 
              title="SHUFFLE"
            >
              <PixelShuffle />
            </button>
            <button className="btn-ctrl" onClick={() => handleControl('prev')}>
              <PixelPrev />
            </button>
            {/* Botón dinámico Play/Pausa */}
            <button className="btn-play" onClick={() => handleControl('toggle')}>
              {isPlaying ? '⏸' : '▶'}
            </button>
            <button className="btn-ctrl" onClick={() => handleControl('next')}>
              <PixelNext />
            </button>
            <button 
              className={`btn-ctrl ${isRepeat ? 'active' : ''}`} 
              onClick={() => setIsRepeat(!isRepeat)} 
              title="REPEAT"
            >
              <PixelRepeat />
            </button>
          </div>
          
          <div className="progress-container">
            <span>{formatProgress(progressMs)}</span>
            <div className="progress-bar">
              <div 
                className="progress-fill" 
                style={{ 
                  width: currentTrack 
                    ? `${(progressMs / getDurationMs(currentTrack.duration)) * 100}%` 
                    : '0%' 
                }}
              ></div>
            </div>
            <span>{currentTrack ? currentTrack.duration : '0:00'}</span>
          </div>
        </div>

        <div className="volume-controls">
          <span style={{ fontSize: '0.4rem', color: isReady ? 'var(--sp-green)' : '#888', marginRight: '8px' }}>
            {isReady ? 'ONLINE' : 'INIT...'}
          </span>
          <span style={{ fontSize: '0.5rem' }}>🔈</span>
          <input type="range" className="vol-slider" min="0" max="100" defaultValue="80" />
        </div>

      </div>

    </div>
  );
}

export default App;