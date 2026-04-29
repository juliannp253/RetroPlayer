import { useEffect, useRef } from 'react'; 
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const Callback = () => {
  const navigate = useNavigate();
  const processed = useRef(false); 

  useEffect(() => {
    if (processed.current) return;

    const urlParams = new URLSearchParams(window.location.search);
    const code = urlParams.get('code');

    if (code) {
      processed.current = true; 
      
      axios.get(`http://127.0.0.1:5000/api/auth/callback?code=${code}`)
        .then(response => {
          if (response.data && response.data.access_token) {
            localStorage.setItem('spotify_token', response.data.access_token);
            if (response.data.refresh_token) {
              localStorage.setItem('spotify_refresh_token', response.data.refresh_token);
            }
            navigate('/');
          }
        })
        .catch(err => {
          if (!localStorage.getItem('spotify_token')) {
            console.error("Error al obtener token", err);
          }
          navigate('/');
        });
    }
  }, [navigate]);

  return <div className="retro-text">ESTABLISHING CONNECTION...</div>;
};

export default Callback;