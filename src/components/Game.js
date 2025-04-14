import React, { useState, useEffect, useRef, useCallback } from 'react';
import { GiFlowerEmblem } from 'react-icons/gi';
import { FaQuestionCircle, FaTrophy, FaStar } from 'react-icons/fa';

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
  const [showInstructions, setShowInstructions] = useState(false);
  const [playerName, setPlayerName] = useState('');
  const [showLeaderboard, setShowLeaderboard] = useState(false);
  const [leaderboard, setLeaderboard] = useState([]);
  
  const firstCard = useRef(null);
  const secondCard = useRef(null);
  const bgMusic = useRef(null);
  const alertSound = useRef(null);
  const winSound = useRef(null);

  // Load leaderboard from localStorage on component mount
  useEffect(() => {
    const savedLeaderboard = localStorage.getItem('memoryGameLeaderboard');
    if (savedLeaderboard) {
      setLeaderboard(JSON.parse(savedLeaderboard));
    }
  }, []);

  // Save leaderboard to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem('memoryGameLeaderboard', JSON.stringify(leaderboard));
  }, [leaderboard]);

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
      if (winSound.current) {
        winSound.current.play().catch(error => console.log('Win sound failed:', error));
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

  const handleGameOver = () => {
    if (isWin && playerName.trim()) {
      const newEntry = {
        name: playerName,
        score: score,
        date: new Date().toLocaleDateString()
      };
      setLeaderboard(prev => [...prev, newEntry].sort((a, b) => b.score - a.score).slice(0, 10));
    }
  };

  return (
    <div className="container text-center game-container">
      {isWin && (
        <div className="fireworks-container">
          <div className="firework"></div>
          <div className="firework"></div>
          <div className="firework"></div>
          <div className="firework"></div>
          <div className="firework"></div>
        </div>
      )}
      
      <audio ref={bgMusic} loop>
        <source src="/sounds/background_music.mp3" type="audio/mpeg" />
      </audio>
      <audio ref={alertSound}>
        <source src="/sounds/firecracker_alert.mp3" type="audio/mpeg" />
      </audio>
      <audio ref={winSound}>
        <source src="/sounds/winning_sound.mp3" type="audio/mpeg" />
      </audio>

      <div className="game-header">
        <h1 className="game-title">🎮 New Year Memory Game 🎮</h1>
        <div className="score-display">
          <span className="score-label">Score: <span className="score-value">{score}</span></span>
          <span className="turns-label">Turns: <span className="turns-value">{turns}/30</span></span>
        </div>
      </div>

      <button 
        className="btn btn-info position-fixed top-0 end-0 m-3 help-button"
        onClick={() => setShowInstructions(true)}
        style={{ zIndex: 1000 }}
      >
        <FaQuestionCircle /> How to Play
      </button>

      {showInstructions && (
        <div className="instructions-overlay">
          <div className="instructions-content">
            <button 
              className="close-instructions-x"
              onClick={() => setShowInstructions(false)}
            >
              ×
            </button>
            <h3 className="instructions-title">🎮 How to Play 🎮</h3>
            <div className="instructions-text">
              <div className="instruction-item">
                <span className="instruction-icon">🎯</span>
                <p>Click on cards to flip them and find matching pairs</p>
              </div>
              <div className="instruction-item">
                <span className="instruction-icon">⏱️</span>
                <p>You can only flip two cards at a time</p>
              </div>
              <div className="instruction-item">
                <span className="instruction-icon">✨</span>
                <p>If the cards match, they will disappear and add 50 points to your score</p>
              </div>
              <div className="instruction-item">
                <span className="instruction-icon">🔄</span>
                <p>If they don't match, they will flip back and cost you 10 points</p>
              </div>
              <div className="instruction-item">
                <span className="instruction-icon">🎲</span>
                <p>Try to find all pairs within 30 turns</p>
              </div>
              <div className="instruction-item">
                <span className="instruction-icon">🎵</span>
                <p>You can control the background music volume</p>
              </div>
              <div className="instruction-item">
                <span className="instruction-icon">🏆</span>
                <p>Save your score and compete for the top spot on the leaderboard!</p>
              </div>
            </div>
            <button 
              className="btn btn-primary close-instructions-button"
              onClick={() => setShowInstructions(false)}
            >
              Let's Play!
            </button>
          </div>
        </div>
      )}

      {!audioStarted ? (
        <div className="alert alert-warning mt-3 music-alert">
          <button onClick={startAudio} className="btn btn-primary music-button">
            🎵 Click to Start Music 🎵
          </button>
        </div>
      ) : (
        <div className="volume-control">
          <label htmlFor="volume">🎵 Music Volume:</label>
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

      <div className="game-board">
        {cards.map(card => (
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
        <div className="game-over-overlay">
          <div className="game-over-content">
            <button 
              className="close-popup-x"
              onClick={() => {
                setGameOver(false);
                shuffleCards();
              }}
            >
              ×
            </button>
            <h2 className="game-over-title">
              {isWin ? (
                <>
                  <FaTrophy className="trophy-icon" /> Congratulations! You Won! <FaTrophy className="trophy-icon" />
                </>
              ) : (
                'Game Over!'
              )}
            </h2>
            <div className="score-celebration">
              <p>Your score: <span className="final-score">{score}</span></p>
              {isWin && (
                <div className="winning-stars">
                  <FaStar className="star-icon" />
                  <FaStar className="star-icon" />
                  <FaStar className="star-icon" />
                </div>
              )}
            </div>
            {isWin && (
              <div className="mb-3">
                <input
                  type="text"
                  className="form-control player-name-input"
                  placeholder="Enter your name"
                  value={playerName}
                  onChange={(e) => setPlayerName(e.target.value)}
                />
                <button 
                  className="btn btn-primary mt-2 save-score-button"
                  onClick={handleGameOver}
                >
                  <FaTrophy /> Save Score
                </button>
              </div>
            )}
            <div className="game-over-buttons">
              <button 
                className="btn btn-primary me-2 play-again-button"
                onClick={shuffleCards}
              >
                Play Again
              </button>
              <button 
                className="btn btn-info leaderboard-button"
                onClick={() => setShowLeaderboard(true)}
              >
                View Leaderboard
              </button>
            </div>
          </div>
        </div>
      )}

      {showLeaderboard && (
        <div className="leaderboard-overlay">
          <div className="leaderboard-content">
            <button 
              className="close-popup-x"
              onClick={() => setShowLeaderboard(false)}
            >
              ×
            </button>
            <h3 className="leaderboard-title">
              <FaTrophy /> Top 10 Players <FaTrophy />
            </h3>
            <table className="table leaderboard-table">
              <thead>
                <tr>
                  <th>Rank</th>
                  <th>Name</th>
                  <th>Score</th>
                  <th>Date</th>
                </tr>
              </thead>
              <tbody>
                {leaderboard.map((entry, index) => (
                  <tr key={index} className={index < 3 ? 'top-three' : ''}>
                    <td>
                      {index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : index + 1}
                    </td>
                    <td>{entry.name}</td>
                    <td>{entry.score}</td>
                    <td>{entry.date}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <button 
              className="btn btn-primary mt-3 close-leaderboard-button"
              onClick={() => setShowLeaderboard(false)}
            >
              Close
            </button>
          </div>
        </div>
      )}
      <div className="creator-credit">Created by Sanuda</div>
    </div>
  );
};

export default Game;