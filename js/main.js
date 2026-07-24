document.addEventListener('DOMContentLoaded', () => {
  // Global Audio Context initialized on user gesture
  let audioCtx = null;

  // Dynamically inject music wave indicators into all cards
  const cardElements = document.querySelectorAll('.service-card, .portfolio-card, .testimonial-card');
  cardElements.forEach(card => {
    const waveIndicator = document.createElement('div');
    waveIndicator.className = 'card-wave-indicator';
    waveIndicator.innerHTML = '<span></span><span></span><span></span><span></span><span></span>';
    card.appendChild(waveIndicator);
  });

  // ==========================================
  // 1. SYSTEM BOOT SEQUENCE & INTRO ENGINE
  // ==========================================
  const powerBtn = document.getElementById('power-btn');
  const bootOverlay = document.getElementById('boot-overlay');
  const terminalText = document.getElementById('terminal-text');

  // Cool typing effect on boot overlay
  const terminalLines = [
    "LOADING SYSTEM CORE v2.8...",
    "DETECTING AUDIO INTERFACES... SUCCESS",
    "CONNECTING TO CHHATTISGARH folk database...",
    "SYSTEM DETECTED. AUTO-BOOTING IN 3 SEC..."
  ];
  let lineIdx = 0;
  function typeTerminal() {
    if (lineIdx < terminalLines.length) {
      const p = document.createElement('p');
      p.textContent = terminalLines[lineIdx];
      terminalText.appendChild(p);
      lineIdx++;
      setTimeout(typeTerminal, 600);
    }
  }
  typeTerminal();

  const triggerBoot = () => {
    if (powerBtn.classList.contains('active')) return;
    powerBtn.classList.add('active');

    // Create global Audio Context
    try {
      audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      playBootRiser();
    } catch (e) {
      console.warn("Audio Context boot warning:", e);
    }

    // Transition overlay away
    setTimeout(() => {
      bootOverlay.classList.add('booted');
      // Trigger stat counters
      startCounter();
      // Start background particle loop
      initParticles();
    }, 1500);
  };

  powerBtn.addEventListener('click', triggerBoot);

  // Auto-boot the console system after 3.5 seconds
  setTimeout(triggerBoot, 3500);

  function playBootRiser() {
    if (!audioCtx) return;
    const now = audioCtx.currentTime;
    
    // Synth sweeping oscillator
    const osc = audioCtx.createOscillator();
    const gainNode = audioCtx.createGain();
    const filter = audioCtx.createBiquadFilter();

    osc.type = 'sawtooth';
    // Frequency sweeps from deep 70Hz to bright 650Hz
    osc.frequency.setValueAtTime(70, now);
    osc.frequency.exponentialRampToValueAtTime(650, now + 1.3);

    // Warm highpass filter sweep
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(300, now);
    filter.frequency.exponentialRampToValueAtTime(1500, now + 1.3);

    // Gain envelope (fades in and out quickly at the end)
    gainNode.gain.setValueAtTime(0, now);
    gainNode.gain.linearRampToValueAtTime(0.12, now + 0.9);
    gainNode.gain.exponentialRampToValueAtTime(0.001, now + 1.4);

    osc.connect(filter);
    filter.connect(gainNode);
    gainNode.connect(audioCtx.destination);

    osc.start(now);
    osc.stop(now + 1.5);
  }

  // ==========================================
  // 2. CANVAS BEAT-REACTIVE PARTICLE SYSTEM
  // ==========================================
  const canvas = document.getElementById('bg-particle-canvas');
  let ctx = null;
  let particlesArray = [];
  let beatMultiplier = 1.0;

  function initParticles() {
    if (!canvas) return;
    ctx = canvas.getContext('2d');
    resizeCanvas();
    
    // Generate particles
    particlesArray = [];
    const numParticles = Math.min(100, Math.floor((window.innerWidth * window.innerHeight) / 12000));
    for (let i = 0; i < numParticles; i++) {
      particlesArray.push(new Particle());
    }

    animateParticlesLoop();
  }

  function resizeCanvas() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
  }
  window.addEventListener('resize', () => {
    if (canvas) resizeCanvas();
  });

  class Particle {
    constructor() {
      this.x = Math.random() * canvas.width;
      this.y = Math.random() * canvas.height;
      this.baseSize = Math.random() * 3 + 1;
      this.size = this.baseSize;
      this.speedX = Math.random() * 0.4 - 0.2;
      this.speedY = Math.random() * -0.4 - 0.1; // move upwards slightly
      this.alpha = Math.random() * 0.5 + 0.2;
    }

    update() {
      this.x += this.speedX * beatMultiplier;
      this.y += this.speedY * beatMultiplier;
      
      // Reactive expansion to music tempo
      this.size = this.baseSize * beatMultiplier;

      // Wrap boundaries
      if (this.y < 0) {
        this.y = canvas.height;
        this.x = Math.random() * canvas.width;
      }
      if (this.x < 0 || this.x > canvas.width) {
        this.speedX *= -1;
      }
    }

    draw() {
      ctx.save();
      ctx.globalAlpha = this.alpha;
      const grad = ctx.createRadialGradient(this.x, this.y, 0, this.x, this.y, this.size * 2);
      grad.addColorStop(0, '#FFC80A');
      grad.addColorStop(0.3, 'rgba(255, 200, 10, 0.4)');
      grad.addColorStop(1, 'rgba(255, 200, 10, 0)');
      
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(this.x, this.y, this.size * 2.5, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }
  }

  function animateParticlesLoop() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Smooth beatMultiplier decay back to 1.0
    if (beatMultiplier > 1.0) {
      beatMultiplier -= 0.04;
    } else {
      beatMultiplier = 1.0;
    }

    particlesArray.forEach(p => {
      p.update();
      p.draw();
    });

    requestAnimationFrame(animateParticlesLoop);
  }

  // ==========================================
  // 3. PLAYABLE GOLDEN PIANO SYNTH
  // ==========================================
  // Notes corresponding to the keys: C4, D4, E4, F4, G4, A4, B4, C5
  const keyFrequencies = {
    'c4': 261.63,
    'd4': 293.66,
    'e4': 329.63,
    'f4': 349.23,
    'g4': 392.00,
    'a4': 440.00,
    'b4': 493.88,
    'c5': 523.25,
    // Black keys
    'cs4': 277.18,
    'ds4': 311.13,
    'fs4': 369.99,
    'gs4': 415.30,
    'as4': 466.16
  };

  const pianoKeysElements = document.querySelectorAll('.piano-key');
  
  pianoKeysElements.forEach(key => {
    // Listen for mouse click and touch events
    const triggerNotePlay = () => {
      const noteParam = key.getAttribute('data-note');
      const freq = keyFrequencies[noteParam];
      
      // Visual feedback
      key.classList.add('active');
      setTimeout(() => key.classList.remove('active'), 250);

      // Play Sound
      playSynthNote(freq);

      // Trigger background particles surge
      beatMultiplier = 2.2;
    };

    key.addEventListener('mousedown', triggerNotePlay);
    key.addEventListener('touchstart', (e) => {
      e.preventDefault();
      triggerNotePlay();
    });
  });

  function playSynthNote(freq) {
    if (!audioCtx) return;
    if (audioCtx.state === 'suspended') audioCtx.resume();

    const now = audioCtx.currentTime;
    const osc = audioCtx.createOscillator();
    const gainNode = audioCtx.createGain();
    const filter = audioCtx.createBiquadFilter();

    osc.type = 'triangle'; // Warm woodwind tone
    osc.frequency.setValueAtTime(freq, now);

    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(1000, now);
    filter.Q.setValueAtTime(1, now);

    // Dynamic envelope (attack, sustain, release)
    gainNode.gain.setValueAtTime(0, now);
    gainNode.gain.linearRampToValueAtTime(0.2, now + 0.05);
    gainNode.gain.exponentialRampToValueAtTime(0.001, now + 0.8);

    osc.connect(filter);
    filter.connect(gainNode);
    gainNode.connect(audioCtx.destination);

    osc.start(now);
    osc.stop(now + 0.9);
  }

  // ==========================================
  // 4. RADIAL AUDIO VISUALIZER & MEDIA PLAYER
  // ==========================================
  let isPlaying = false;
  let playerInterval = null;
  let trackProgressVal = 0;
  let customMelodyInterval = null;
  let radialCanvas = document.getElementById('radial-visualizer-canvas');
  let radialCtx = null;
  
  // Set up radial visualizer canvas size
  if (radialCanvas) {
    radialCtx = radialCanvas.getContext('2d');
    radialCanvas.width = 290;
    radialCanvas.height = 290;
  }

  // Mock melody sequences for player tracks
  // Play beautiful synthetic pentatonic scales synced to tempo
  const trackMelodies = {
    'cfolk': [293.66, 369.99, 440.00, 587.33, 440.00], // D pentatonic Major (Folk)
    'cpop': [329.63, 392.00, 440.00, 523.25, 440.00],  // E Pop pentatonic
    'clove': [349.23, 440.00, 523.25, 587.33, 523.25], // F Love melody
    'cdev': [261.63, 329.63, 392.00, 523.25, 392.00]   // C Major Bhajan
  };

  let activeTrackId = 'cfolk';
  let melodyStep = 0;

  function startMelodyPlayback() {
    const melody = trackMelodies[activeTrackId];
    
    customMelodyInterval = setInterval(() => {
      if (!isPlaying) return;
      const freq = melody[melodyStep % melody.length];
      melodyStep++;
      
      playSynthNote(freq);
      
      // Beat pulse particles and visualizer
      beatMultiplier = 2.0;
      
      // Shake radial visualizer
      drawRadialVisuals(true);
    }, 450); // Bpm tempo
  }

  function stopMelodyPlayback() {
    clearInterval(customMelodyInterval);
    drawRadialVisuals(false);
  }

  function drawRadialVisuals(pulsing) {
    if (!radialCtx) return;
    const cx = radialCanvas.width / 2;
    const cy = radialCanvas.height / 2;
    const numBars = 60;
    const baseRadius = 103;

    radialCtx.clearRect(0, 0, radialCanvas.width, radialCanvas.height);
    
    // Draw visualizer rings
    for (let i = 0; i < numBars; i++) {
      const angle = (i / numBars) * Math.PI * 2;
      let barLength = pulsing ? Math.random() * 32 + 5 : Math.random() * 5 + 2;

      // Draw glowing lines outward
      const startX = cx + Math.cos(angle) * baseRadius;
      const startY = cy + Math.sin(angle) * baseRadius;
      const endX = cx + Math.cos(angle) * (baseRadius + barLength);
      const endY = cy + Math.sin(angle) * (baseRadius + barLength);

      radialCtx.save();
      radialCtx.strokeStyle = `hsla(47, 100%, 50%, ${pulsing ? '0.7' : '0.25'})`;
      radialCtx.lineWidth = 2.5;
      radialCtx.shadowBlur = pulsing ? 12 : 0;
      radialCtx.shadowColor = '#FFC80A';
      
      radialCtx.beginPath();
      radialCtx.moveTo(startX, startY);
      radialCtx.lineTo(endX, endY);
      radialCtx.stroke();
      radialCtx.restore();
    }
  }

  // Draw initial silent visualizer circle
  drawRadialVisuals(false);

  // Player controls
  const mainPlayBtn = document.getElementById('main-play-btn');
  const mainPlayIcon = document.getElementById('main-play-icon');
  const playerDisc = document.getElementById('player-disc');
  const trackItems = document.querySelectorAll('.track-item');
  const playerTitle = document.getElementById('player-title');
  const playerSubtitle = document.getElementById('player-subtitle');
  const progressSlider = document.getElementById('player-progress');
  const currentTimeLabel = document.getElementById('current-time');
  const forwardBtn = document.getElementById('player-forward');
  const backwardBtn = document.getElementById('player-backward');

  function togglePlayState() {
    if (isPlaying) {
      isPlaying = false;
      playerDisc.classList.remove('playing');
      mainPlayIcon.innerHTML = `<svg width="28" height="28" viewBox="0 0 24 24"><path d="M8 5v14l11-7z" fill="currentColor"/></svg>`;
      stopMelodyPlayback();
      clearInterval(playerInterval);
    } else {
      isPlaying = true;
      playerDisc.classList.add('playing');
      mainPlayIcon.innerHTML = `<svg width="28" height="28" viewBox="0 0 24 24"><path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z" fill="currentColor"/></svg>`;
      startMelodyPlayback();
      
      playerInterval = setInterval(() => {
        trackProgressVal = (trackProgressVal + 1) % 100;
        progressSlider.value = trackProgressVal;
        
        let seconds = Math.floor((trackProgressVal / 100) * 180);
        let mins = Math.floor(seconds / 60);
        let secs = seconds % 60;
        currentTimeLabel.textContent = `${mins}:${secs < 10 ? '0' : ''}${secs}`;
        
        // Stagger visualizer drawings
        if (isPlaying) {
          drawRadialVisuals(true);
        }

        if (trackProgressVal === 0) {
          nextTrack();
        }
      }, 1000);
    }
  }

  mainPlayBtn.addEventListener('click', () => {
    if (audioCtx && audioCtx.state === 'suspended') audioCtx.resume();
    togglePlayState();
  });

  trackItems.forEach(item => {
    item.addEventListener('click', () => {
      trackItems.forEach(i => i.classList.remove('active'));
      item.classList.add('active');

      playerTitle.textContent = item.getAttribute('data-title');
      playerSubtitle.textContent = item.getAttribute('data-subtitle');
      activeTrackId = item.getAttribute('data-track-key');

      // Reset state
      trackProgressVal = 0;
      progressSlider.value = 0;
      currentTimeLabel.textContent = "0:00";

      if (isPlaying) {
        stopMelodyPlayback();
        startMelodyPlayback();
      } else {
        togglePlayState();
      }
    });
  });

  function nextTrack() {
    let activeIdx = 0;
    trackItems.forEach((item, idx) => {
      if (item.classList.contains('active')) activeIdx = idx;
    });
    const nextIdx = (activeIdx + 1) % trackItems.length;
    trackItems[nextIdx].click();
  }

  if (forwardBtn) forwardBtn.addEventListener('click', nextTrack);
  if (backwardBtn) {
    backwardBtn.addEventListener('click', () => {
      let activeIdx = 0;
      trackItems.forEach((item, idx) => {
        if (item.classList.contains('active')) activeIdx = idx;
      });
      const prevIdx = (activeIdx - 1 + trackItems.length) % trackItems.length;
      trackItems[prevIdx].click();
    });
  }

  // ==========================================
  // 5. 3D HOVER CARD TILT EFFECTS
  // ==========================================
  // Tilts cards dynamically relative to mouse pointer coordinates
  const tiltWrappers = document.querySelectorAll('.service-card-wrapper, .portfolio-card-wrapper');

  tiltWrappers.forEach(wrap => {
    const card = wrap.querySelector('.service-card, .portfolio-card');
    
    wrap.addEventListener('mousemove', (e) => {
      const rect = wrap.getBoundingClientRect();
      const x = e.clientX - rect.left; // x coordinate inside element
      const y = e.clientY - rect.top;  // y coordinate inside element
      
      const centerX = rect.width / 2;
      const centerY = rect.height / 2;
      
      // Calculate rotation angles (max 15 degrees)
      const rotateX = ((centerY - y) / centerY) * 15;
      const rotateY = ((x - centerX) / centerX) * 15;
      
      card.style.transform = `rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale(1.03)`;
    });

    wrap.addEventListener('mouseleave', () => {
      card.style.transform = 'rotateX(0deg) rotateY(0deg) scale(1)';
    });
  });

  // ==========================================
  // 6. YOUTUBE IFRAME MODAL POPUP
  // ==========================================
  const portfolioCards = document.querySelectorAll('.portfolio-card');
  const videoModal = document.getElementById('video-modal');
  const modalIframe = document.getElementById('modal-iframe');
  const modalCloseBtn = document.getElementById('modal-close');

  portfolioCards.forEach(card => {
    card.addEventListener('click', () => {
      const vidId = card.getAttribute('data-video-id');
      if (vidId) {
        modalIframe.src = `https://www.youtube.com/embed/${vidId}?autoplay=1&rel=0`;
        videoModal.classList.add('active');
      }
    });
  });

  const hideModal = () => {
    videoModal.classList.remove('active');
    modalIframe.src = '';
  };

  if (modalCloseBtn) modalCloseBtn.addEventListener('click', hideModal);
  if (videoModal) {
    videoModal.addEventListener('click', (e) => {
      if (e.target === videoModal) hideModal();
    });
  }

  // ==========================================
  // 7. INTERACTIVE HARDWARE RACK SLIDERS
  // ==========================================
  const knobs = document.querySelectorAll('.knob-outer');
  const wavePath = document.getElementById('hardware-wave-path');
  
  let hwParams = { gain: 50, freq: 40, comp: 20 };

  knobs.forEach(knob => {
    let currentAngle = 0;
    const type = knob.getAttribute('data-param');

    knob.addEventListener('click', () => {
      currentAngle = (currentAngle + 45) % 360;
      knob.style.transform = `rotate(${currentAngle}deg)`;
      hwParams[type] = Math.floor((currentAngle / 360) * 100);
      drawOscilloscopeWave();
    });
  });

  function drawOscilloscopeWave() {
    if (!wavePath) return;
    const amp = (hwParams.gain / 100) * 28 + 4;
    const frequency = (hwParams.freq / 100) * 0.22 + 0.04;
    const compFactor = (hwParams.comp / 100) * 5;

    let points = [];
    for (let x = 0; x <= 300; x += 2) {
      let y = 40 + Math.sin(x * frequency) * amp;
      
      // Compression peak squashing
      const ceiling = 40 + (35 - compFactor);
      const floor = 40 - (35 - compFactor);
      if (y > ceiling) y = ceiling;
      if (y < floor) y = floor;

      points.push(`${x},${y}`);
    }
    wavePath.setAttribute('d', `M ${points.join(' L ')}`);
  }
  drawOscilloscopeWave(); // initial call

  // ==========================================
  // 8. ESTIMATOR & WHATSAPP GENERATOR
  // ==========================================
  const serviceRates = {
    recording: 1000,
    production: 8000,
    mixing: 3500,
    songwriting: 3000,
    shoot: 15000,
    editing: 4000
  };

  const checkCards = document.querySelectorAll('.calc-checkbox-card');
  const sliderHours = document.getElementById('slider-recording');
  const sliderHoursLabel = document.getElementById('recording-hours-val');
  const calcTotalDisplay = document.getElementById('calc-total-price');
  const calcBreakdown = document.getElementById('calc-breakdown-list');
  const whatsappCalcBtn = document.getElementById('whatsapp-calc-btn');

  function calculateQuote() {
    let total = 0;
    let selected = [];
    let itemsHtml = '';

    checkCards.forEach(card => {
      const chk = card.querySelector('input[type="checkbox"]');
      const service = chk.getAttribute('data-service');
      
      if (chk.checked) {
        card.classList.add('selected');
        const rate = serviceRates[service];
        total += rate;
        
        let title = card.querySelector('.calc-label-title').textContent;
        selected.push({ name: title, rate: rate });
      } else {
        card.classList.remove('selected');
      }
    });

    // Check recording hours slider if checkbox is selected
    const recCheckbox = document.getElementById('chk-recording');
    if (recCheckbox && recCheckbox.checked && sliderHours) {
      const hours = parseInt(sliderHours.value);
      sliderHoursLabel.textContent = `${hours} Hours`;
      
      const extraHoursCost = (hours - 1) * serviceRates.recording;
      total += extraHoursCost;

      selected = selected.map(s => {
        if (s.name.includes("Vocal Recording") || s.name === "Vocal Recording") {
          return { name: `Vocal Recording (${hours} Hours)`, rate: serviceRates.recording * hours };
        }
        return s;
      });
    }

    selected.forEach(s => {
      itemsHtml += `<li><span>${s.name}</span><span>₹${s.rate.toLocaleString()}</span></li>`;
    });

    if (calcTotalDisplay) {
      calcTotalDisplay.textContent = `₹${total.toLocaleString()}`;
    }

    if (calcBreakdown) {
      calcBreakdown.innerHTML = itemsHtml || `<li><span style="color: var(--color-text-muted)">No services selected</span><span>₹0</span></li>`;
    }

    // Set up dynamic WhatsApp query text
    if (whatsappCalcBtn) {
      let queryText = `नमस्ते CG Music Production!\n\nमैंने आपकी नई कंसोल वेबसाइट पर अपना एस्टिमेट बनाया है:\n`;
      selected.forEach(s => {
        queryText += `• ${s.name}: ₹${s.rate.toLocaleString()}\n`;
      });
      queryText += `\n*कुल राशि (Estimated Quote): ₹${total.toLocaleString()}*\n\nकृपया मुझे बुकिंग और स्टूडियो स्लॉट अवेलेबिलिटी की पुष्टि करें! धन्यवाद।`;
      
      whatsappCalcBtn.href = `https://wa.me/918435437432?text=${encodeURIComponent(queryText)}`;
    }
  }

  checkCards.forEach(card => {
    card.addEventListener('click', (e) => {
      const checkbox = card.querySelector('input[type="checkbox"]');
      if (e.target !== checkbox) {
        checkbox.checked = !checkbox.checked;
      }
      calculateQuote();
    });
  });

  if (sliderHours) {
    sliderHours.addEventListener('input', calculateQuote);
  }
  calculateQuote(); // Initial call

  // ==========================================
  // 9. HEADER NAVIGATION SCROLL EFFECTS
  // ==========================================
  const header = document.querySelector('header');
  const hamburger = document.querySelector('.hamburger');
  const navLinks = document.querySelector('.nav-links');
  const navLinksAnchors = document.querySelectorAll('.nav-links a');

  window.addEventListener('scroll', () => {
    if (window.scrollY > 30) {
      header.classList.add('scrolled');
    } else {
      header.classList.remove('scrolled');
    }
    updateNavSpy();
  });

  hamburger.addEventListener('click', () => {
    hamburger.classList.toggle('active');
    navLinks.classList.toggle('active');
  });

  navLinksAnchors.forEach(a => {
    a.addEventListener('click', () => {
      hamburger.classList.remove('active');
      navLinks.classList.remove('active');
    });
  });

  function updateNavSpy() {
    let current = '';
    const sections = document.querySelectorAll('section');
    const scrollPos = window.scrollY + 130;

    sections.forEach(sec => {
      if (scrollPos >= sec.offsetTop && scrollPos < sec.offsetTop + sec.offsetHeight) {
        current = sec.getAttribute('id');
      }
    });

    navLinksAnchors.forEach(a => {
      a.classList.remove('active');
      if (a.getAttribute('href') === `#${current}`) {
        a.classList.add('active');
      }
    });
  }

  // ==========================================
  // 10. STATS COUNTER TRIGGER
  // ==========================================
  const statsElements = document.querySelectorAll('.stat-number');
  const statsSection = document.querySelector('.stats-grid');
  let statsTriggered = false;

  function startCounter() {
    if (statsTriggered) return;
    statsTriggered = true;

    statsElements.forEach(stat => {
      const targetVal = parseInt(stat.getAttribute('data-target'));
      const suffixStr = stat.getAttribute('data-suffix') || '';
      let curVal = 0;
      const stepVal = Math.ceil(targetVal / 35);
      
      const timer = setInterval(() => {
        curVal += stepVal;
        if (curVal >= targetVal) {
          stat.textContent = targetVal + suffixStr;
          clearInterval(timer);
        } else {
          stat.textContent = curVal + suffixStr;
        }
      }, 35);
    });
  }

  // Form submit success loading animations
  const contactForm = document.getElementById('studio-contact-form');
  if (contactForm) {
    contactForm.addEventListener('submit', (e) => {
      e.preventDefault();
      
      const btn = contactForm.querySelector('button[type="submit"]');
      const origText = btn.innerHTML;
      
      btn.innerHTML = `<span>भेजा जा रहा है... (Booking...)</span>`;
      btn.disabled = true;
      
      setTimeout(() => {
        btn.style.backgroundColor = '#10B981';
        btn.style.color = '#FFF';
        btn.innerHTML = `<span>✓ स्लॉट ब्लॉक हो गया! (Slot Reserved!)</span>`;
        
        contactForm.reset();
        calculateQuote();
        
        setTimeout(() => {
          btn.style.backgroundColor = '';
          btn.style.color = '';
          btn.innerHTML = origText;
          btn.disabled = false;
        }, 3000);
      }, 1500);
    });
  }
});
