import React, { useState, useEffect, useRef, useCallback } from 'react';
import { GiFlowerEmblem } from 'react-icons/gi';

const cardImages = [
    { 
      name: 'oil_lamp', 
      image: '/images/cards/oil_lamp.png' 
    },
    { 
      name: 'traditional_drum', 
      image: '/images/cards/traditional_drum.png' 
    },
    { 
      name: 'kokis', 
      image: '/images/cards/kokis.png' 
    },
    { 
      name: 'avurudu_kudu', 
      image: '/images/cards/avurudu_kudu.png' 
    },
    { 
      name: 'moon_rabana', 
      image: '/images/cards/moon_rabana.png' 
    },
    { 
      name: 'jackfruit', 
      image: '/images/cards/jackfruit.png' 
    },
    { 
      name: 'temple', 
      image: '/images/cards/temple.png' 
    },
    { 
      name: 'mangos', 
      image: '/images/cards/mangos.png' 
    },
    { 
      name: 'diya', 
      image: '/images/cards/diya.png' 
    },
    { 
      name: 'swing', 
      image: '/images/cards/swing.png' 
    },
  ];

const Game = () => {
  const [cards, setCards] = useState([]);
  const [turns, setTurns] = useState(0);
  const [score, setScore] = useState(0);
  const [gameOver, setGameOver] = useState(false);
  const [isWin, setIsWin] = useState(false);
  const [audioStarted, setAudioStarted] = useState(false);
  const [disabled, setDisabled] = useState(false);
  const [volume, setVolume] = useState(0.5);
  
  const firstCard = useRef(null);
  const secondCard = useRef(null);
  const bgMusic = useRef(null);
  const alertSound = useRef(null);

  const startAudio = useCallback(() => {
    if (bgMusic.current) {
      bgMusic.current.volume = volume;
      bgMusic.current.play()
        .then(() => setAudioStarted(true))
        .catch(error => {
          console.log('Audio playback failed:', error);
          setAudioStarted(false);
        });
    }
  }, [volume]);

  const handleVolumeChange = (e) => {
    const newVolume = parseFloat(e.target.value);
    setVolume(newVolume);
    if (bgMusic.current) {
      bgMusic.current.volume = newVolume;
    }
  };

  const shuffleCards = () => {
    const shuffledCards = [...cardImages, ...cardImages]
      .sort(() => Math.random() - 0.5)
      .map((card, i) => ({ ...card, id: i, flipped: false, matched: false }));

    setCards(shuffledCards);
    setTurns(0);
    setScore(0);
    setGameOver(false);
    setIsWin(false);
    firstCard.current = null;
    secondCard.current = null;
    
    // Restart background music
    if (bgMusic.current) {
      bgMusic.current.currentTime = 0;
      bgMusic.current.play()
        .then(() => setAudioStarted(true))
        .catch(error => {
          console.log('Audio playback failed:', error);
          setAudioStarted(false);
        });
    }
  };

  const handleCardClick = (card) => {
    if (disabled || card.matched || card.flipped) return;

    if (!firstCard.current) {
      firstCard.current = card;
      setCards(prev => prev.map(c => c.id === card.id ? { ...c, flipped: true } : c));
    } else if (!secondCard.current) {
      secondCard.current = card;
      setCards(prev => prev.map(c => c.id === card.id ? { ...c, flipped: true } : c));
      setDisabled(true);
      
      if (firstCard.current.name === card.name) {
        setScore(prev => prev + 50);
        setTimeout(() => {
          setCards(prev => prev.map(c => 
            c.name === card.name ? { ...c, matched: true } : c
          ));
          firstCard.current = null;
          secondCard.current = null;
          setDisabled(false);
        }, 500);
      } else {
        setScore(prev => Math.max(0, prev - 10));
        const firstCardId = firstCard.current.id;
        const secondCardId = card.id;
        setTimeout(() => {
          setCards(prev => prev.map(c => 
            c.id === firstCardId || c.id === secondCardId ? { ...c, flipped: false } : c
          ));
          firstCard.current = null;
          secondCard.current = null;
          setDisabled(false);
        }, 1000);
      }

      setTurns(prev => prev + 1);
    }
  };

  useEffect(() => {
    shuffleCards();
    const handleFirstClick = () => {
      startAudio();
      document.removeEventListener('click', handleFirstClick);
    };
    document.addEventListener('click', handleFirstClick);
    
    // Store the current ref value
    const currentBgMusic = bgMusic.current;
    
    return () => {
      document.removeEventListener('click', handleFirstClick);
      if (currentBgMusic) {
        currentBgMusic.pause();
        currentBgMusic.currentTime = 0;
      }
    };
  }, [startAudio]);

  useEffect(() => {
    if (cards.length > 0 && cards.every(card => card.matched)) {
      setIsWin(true);
      setGameOver(true);
      if (bgMusic.current) {
        bgMusic.current.pause();
      }
    } else if (turns >= 30) {
      setIsWin(false);
      setGameOver(true);
      if (alertSound.current) {
        alertSound.current.play().catch(error => console.log('Alert sound failed:', error));
      }
      if (bgMusic.current) {
        bgMusic.current.pause();
      }
    }
  }, [turns, cards]);

  return (
    <div className="container text-center">
      <audio ref={bgMusic} loop>
        <source src="/sounds/background_music.mp3" type="audio/mpeg" />
      </audio>
      <audio ref={alertSound}>
        <source src="/sounds/firecracker_alert.mp3" type="audio/mpeg" />
      </audio>

      {!audioStarted ? (
        <div className="alert alert-warning mt-3">
          <button onClick={startAudio} className="btn btn-primary">
            Click to Start Music
          </button>
        </div>
      ) : (
        <div className="volume-control">
          <label htmlFor="volume">Music Volume:</label>
          <input
            type="range"
            id="volume"
            min="0"
            max="1"
            step="0.1"
            value={volume}
            onChange={handleVolumeChange}
          />
        </div>
      )}

      <div className="score-board">
        <h4>Score: {score}</h4>
        <p>Turns Left: {30 - turns}</p>
        <button onClick={shuffleCards} className="btn btn-warning btn-sm">
          Restart Game
        </button>
      </div>

      <div className="game-board">
        {cards?.map(card => (
          <div 
            key={card.id}
            className={`card ${card.flipped ? 'flipped' : ''} ${card.matched ? 'matched' : ''}`}
            onClick={() => handleCardClick(card)}
          >
            <div className="card-inner">
              <div className="card-front">
                <img 
                  src={card.image} 
                  alt={`${card.name.replace(/_/g, ' ')} card`}
                  onError={(e) => {
                    console.error(`Failed to load image: ${card.image}`);
                    e.target.onerror = null;
                    e.target.src = '/images/placeholder.png';
                    e.target.alt = 'Placeholder card';
                  }}
                />
              </div>
              <div className="card-back">
                <GiFlowerEmblem />
              </div>
            </div>
          </div>
        ))}
      </div>

      {gameOver && (
        <div className="game-over">
          <h3>{isWin ? '🎉 Congratulations! You Win! 🎉' : '💥 Game Over! 💥'}</h3>
          <p>Final Score: {score}</p>
          <button 
            onClick={shuffleCards}
            className="btn btn-primary mt-2"
          >
            Play Again
          </button>
        </div>
      )}
      <div className="creator-credit">Created by Sanuda</div>
    </div>
  );
};

export default Game;