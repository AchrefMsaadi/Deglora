/* ============================================================
   DEGLORA — ai-quiz.js
   AI-powered personalisation quiz + Anthropic API integration
   ============================================================ */

(function () {
  const API_URL = 'http://localhost:3001/api/recommend';

  let currentStep = 1;
  const totalSteps = 4;
  const answers = {};

  const progressFill  = document.getElementById('progressFill');
  const progressLabel = document.getElementById('progressLabel');
  const quizProgress  = document.getElementById('quizProgress');
  const aiLoading     = document.getElementById('aiLoading');
  const aiResult      = document.getElementById('aiResult');
  const loadingText   = document.getElementById('loadingText');

  const loadingMessages = [
    'Analysing your profile…',
    'Matching nutritional patterns…',
    'Selecting optimal ingredients…',
    'Crafting your formula…',
    'Almost there…'
  ];

  function setStep(step) {
    // Hide all steps
    document.querySelectorAll('.ai-step').forEach(el => el.classList.remove('active'));
    aiLoading.classList.remove('active');
    aiResult.classList.remove('active');

    if (step <= totalSteps) {
      const el = document.getElementById(`step${step}`);
      if (el) el.classList.add('active');
      updateProgress(step);
      quizProgress.classList.remove('hidden');
    }
  }

  function updateProgress(step) {
    const pct = ((step - 1) / totalSteps) * 100;
    progressFill.style.width = `${pct}%`;
    progressLabel.textContent = `${step - 1} / ${totalSteps}`;
  }

  // Wire quiz options
  document.querySelectorAll('.quiz-opt').forEach(btn => {
    btn.addEventListener('click', () => {
      const step = btn.closest('.ai-step');
      const stepId = step.id; // "step1", "step2", etc.
      const stepNum = parseInt(stepId.replace('step', ''));

      // Mark selected
      step.querySelectorAll('.quiz-opt').forEach(b => b.classList.remove('selected'));
      btn.classList.add('selected');

      // Store answer
      const keys = ['goal', 'lifestyle', 'diet', 'timing'];
      answers[keys[stepNum - 1]] = btn.dataset.val;

      // Animate selection
      gsap.fromTo(btn,
        { scale: 0.97 },
        { scale: 1, duration: 0.25, ease: 'back.out(2)' }
      );

      // Advance after short delay
      setTimeout(() => {
        if (stepNum < totalSteps) {
          currentStep = stepNum + 1;
          setStep(currentStep);
        } else {
          startAI();
        }
      }, 380);
    });
  });

  async function startAI() {
    // Show loading
    document.querySelectorAll('.ai-step').forEach(el => el.classList.remove('active'));
    aiLoading.classList.add('active');
    quizProgress.classList.add('hidden');

    // Cycle loading messages
    let msgIdx = 0;
    const msgInterval = setInterval(() => {
      msgIdx = (msgIdx + 1) % loadingMessages.length;
      loadingText.textContent = loadingMessages[msgIdx];
    }, 1100);

    try {
      const result = await fetchRecommendation(answers);
      clearInterval(msgInterval);
      showResult(result);
    } catch (err) {
      clearInterval(msgInterval);
      // Fallback result if API unavailable
      showResult(getFallbackResult(answers));
    }
  }

  async function fetchRecommendation(data) {
    const response = await fetch(API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
      signal: AbortSignal.timeout(12000)
    });
    if (!response.ok) throw new Error('API error');
    return response.json();
  }

  function getFallbackResult(data) {
    // Smart client-side fallback
    const mixes = {
      fitness: {
        name: 'The Athlete Formula',
        ingredients: ['Granola Base', 'Date Jam', 'Plant Protein', 'Mixed Nuts', 'Dark Chocolate'],
        explanation: 'Designed for your active lifestyle, this blend delivers sustained energy through complex carbohydrates from our Deglet Nour date jam, high-quality plant protein for muscle recovery, and healthy fats from mixed nuts. Dark chocolate provides antioxidants and a natural performance boost.'
      },
      focus: {
        name: 'The Focus Formula',
        ingredients: ['Granola Base', 'Date Jam', 'Super Seeds', 'Dark Chocolate', 'Wild Honey'],
        explanation: 'Formulated to support cognitive performance, this blend combines omega-3 rich super seeds with the slow-release natural sugars of our date jam. Dark chocolate provides flavonoids linked to improved brain circulation, while raw honey offers antimicrobial properties and a gentle energy lift.'
      },
      weightloss: {
        name: 'The Balance Formula',
        ingredients: ['Granola Base', 'Date Jam', 'Super Seeds', 'Coconut Flakes'],
        explanation: 'A lighter, fibre-dense formula that keeps you satiated without excess calories. Our date jam replaces all refined sugars, super seeds add omega-3s and filling fibre, and coconut flakes provide medium-chain triglycerides that your body burns for energy rather than storing as fat.'
      },
      energy: {
        name: 'The Vitality Formula',
        ingredients: ['Granola Base', 'Date Jam', 'Wild Honey', 'Mixed Nuts', 'Coconut Flakes'],
        explanation: 'Engineered for all-day vitality, this blend pairs the natural glucose of Deglet Nour dates with raw wild honey for an immediate yet sustained energy curve. Mixed nuts provide protein and healthy fats for lasting endurance, while coconut flakes fuel your metabolism efficiently.'
      }
    };

    return mixes[data.goal] || mixes.energy;
  }

  function showResult(result) {
    aiLoading.classList.remove('active');
    aiResult.classList.add('active');

    document.getElementById('resultName').textContent = result.name;
    document.getElementById('resultExplanation').textContent = result.explanation;

    // Render mix tags
    const mixEl = document.getElementById('resultMix');
    mixEl.innerHTML = '';
    result.ingredients.forEach((ing, i) => {
      const tag = document.createElement('span');
      tag.className = 'mix-tag';
      tag.textContent = ing;
      tag.style.opacity = '0';
      tag.style.transform = 'translateY(8px)';
      mixEl.appendChild(tag);

      setTimeout(() => {
        gsap.to(tag, { opacity: 1, y: 0, duration: 0.4, ease: 'power2.out' });
      }, i * 80);
    });

    // Animate result panel in
    gsap.fromTo('#aiResult', { opacity: 0, y: 30 }, { opacity: 1, y: 0, duration: 0.6, ease: 'power3.out' });
  }

  // Order AI blend button
  const orderAiBtn = document.getElementById('orderAiBtn');
  if (orderAiBtn) {
    orderAiBtn.addEventListener('click', () => {
      const name = document.getElementById('resultName').textContent;
      if (window.showToast) window.showToast(`"${name}" added to cart! 🛒`);
    });
  }

  // Retake button
  const retakeBtn = document.getElementById('retakeBtn');
  if (retakeBtn) {
    retakeBtn.addEventListener('click', () => {
      Object.keys(answers).forEach(k => delete answers[k]);
      currentStep = 1;
      // Reset selections
      document.querySelectorAll('.quiz-opt').forEach(b => b.classList.remove('selected'));
      aiResult.classList.remove('active');
      setStep(1);
      quizProgress.classList.remove('hidden');
    });
  }

  // Init
  setStep(1);

})();
