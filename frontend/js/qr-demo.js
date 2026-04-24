/* ============================================================
   DEGLORA — qr-demo.js
   QR Scanner: camera stream (jsQR), file/image import, demo codes.
   Saves scans to Supabase if user is signed in.
   ============================================================ */

(function () {
  'use strict';

  /* ---- DOM refs ---- */
  const qrModal        = document.getElementById('qrModal');
  const openQrBtn      = document.getElementById('openQrDemo');
  const qrModalClose   = document.getElementById('qrModalClose');
  const qrVideo        = document.getElementById('qrVideo');
  const qrCanvas       = document.getElementById('qrCanvas');
  const startCamBtn    = document.getElementById('startCameraBtn');
  const stopCamBtn     = document.getElementById('stopCameraBtn');
  const qrCameraHint   = document.getElementById('qrCameraHint');
  const qrFileInput    = document.getElementById('qrFileInput');
  const qrDropzone     = document.getElementById('qrDropzone');
  const qrUploadPreview= document.getElementById('qrUploadPreview');
  const qrUploadImg    = document.getElementById('qrUploadImg');
  const qrUploadStatus = document.getElementById('qrUploadStatus');
  const qrScanResult   = document.getElementById('qrScanResult');
  const qrResultGrid   = document.getElementById('qrResultGrid');
  const qrPtsMsg       = document.getElementById('qrPtsMsg');

  /* ---- State ---- */
  let cameraStream = null;
  let scanInterval = null;
  let userPoints   = 380;
  let scannedCodes = new Set();

  /* ---- Bottle DB ---- */
  const bottleData = {
    'DGL-001-ORIG': { blend:'Original Blend',   origin:'Tozeur, Tunisia', harvest:'October 2024', calories:'180 kcal/50g', sugar:'8g natural' },
    'DGL-002-FOCS': { blend:'Focus Formula',    origin:'Tozeur, Tunisia', harvest:'October 2024', calories:'195 kcal/50g', sugar:'9g natural' },
    'DGL-003-ATHL': { blend:'Athlete Formula',  origin:'Tozeur, Tunisia', harvest:'October 2024', calories:'220 kcal/50g', sugar:'7g natural' },
    'DGL-004-VTAL': { blend:'Vitality Formula', origin:'Tozeur, Tunisia', harvest:'October 2024', calories:'210 kcal/50g', sugar:'10g natural' },
  };

  /* ================================================================
     OPEN / CLOSE
  ================================================================ */
  openQrBtn?.addEventListener('click', openQr);
  qrModalClose?.addEventListener('click', closeQr);
  qrModal?.addEventListener('click', e => { if (e.target === qrModal) closeQr(); });

  function openQr() {
    if (qrModal) qrModal.classList.add('open');
    resetResult();
    switchQrTab('camera');
  }
  function closeQr() {
    if (qrModal) qrModal.classList.remove('open');
    stopCamera();
  }

  /* ================================================================
     TAB SWITCHING
  ================================================================ */
  document.querySelectorAll('.qr-tab').forEach(btn => {
    btn.addEventListener('click', () => switchQrTab(btn.dataset.qrtab));
  });

  function switchQrTab(name) {
    document.querySelectorAll('.qr-tab').forEach(t =>
      t.classList.toggle('active', t.dataset.qrtab === name));
    document.querySelectorAll('.qr-tab-content').forEach(c => c.classList.remove('active'));
    const tabId = 'qrTab' + name.charAt(0).toUpperCase() + name.slice(1);
    document.getElementById(tabId)?.classList.add('active');
    if (name !== 'camera') stopCamera();
    resetResult();
  }

  /* ================================================================
     CAMERA
  ================================================================ */
  startCamBtn?.addEventListener('click', startCamera);
  stopCamBtn?.addEventListener('click', stopCamera);

  async function startCamera() {
    if (!navigator.mediaDevices?.getUserMedia) {
      if (qrCameraHint) qrCameraHint.textContent = '⚠ Camera not supported in this browser.';
      return;
    }
    try {
      if (qrCameraHint) qrCameraHint.textContent = 'Requesting camera permission…';
      cameraStream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: { ideal: 'environment' }, width: { ideal: 640 }, height: { ideal: 480 } }
      });
      if (qrVideo) {
        qrVideo.srcObject = cameraStream;
        await qrVideo.play();
      }
      const wrap = document.getElementById('qrVideoWrap');
      if (wrap) wrap.classList.add('active');
      if (startCamBtn) startCamBtn.style.display = 'none';
      if (stopCamBtn)  stopCamBtn.style.display  = 'block';
      if (qrCameraHint) qrCameraHint.textContent = '🔍 Scanning for QR code…';
      scanInterval = setInterval(scanFrame, 300);
    } catch (err) {
      const msgs = {
        NotAllowedError:  '⚠ Camera permission denied — please allow in browser settings.',
        NotFoundError:    '⚠ No camera detected on this device.',
        NotReadableError: '⚠ Camera is in use by another app.',
      };
      if (qrCameraHint) qrCameraHint.textContent = msgs[err.name] || '⚠ Camera error: ' + err.message;
    }
  }

  function stopCamera() {
    clearInterval(scanInterval);
    scanInterval = null;
    if (cameraStream) { cameraStream.getTracks().forEach(t => t.stop()); cameraStream = null; }
    if (qrVideo) { qrVideo.srcObject = null; qrVideo.pause(); }
    const wrap = document.getElementById('qrVideoWrap');
    if (wrap) wrap.classList.remove('active');
    if (startCamBtn) startCamBtn.style.display = 'block';
    if (stopCamBtn)  stopCamBtn.style.display  = 'none';
    if (qrCameraHint) qrCameraHint.textContent = 'Tap below to start your camera';
  }

  function scanFrame() {
    if (!qrVideo || !qrCanvas) return;
    if (typeof jsQR === 'undefined') return;
    if (qrVideo.readyState < qrVideo.HAVE_ENOUGH_DATA) return;
    const ctx = qrCanvas.getContext('2d');
    qrCanvas.width  = qrVideo.videoWidth;
    qrCanvas.height = qrVideo.videoHeight;
    if (!qrCanvas.width) return;
    ctx.drawImage(qrVideo, 0, 0);
    const imgData = ctx.getImageData(0, 0, qrCanvas.width, qrCanvas.height);
    const code = jsQR(imgData.data, imgData.width, imgData.height, { inversionAttempts: 'dontInvert' });
    if (code?.data) {
      stopCamera();
      if (qrCameraHint) qrCameraHint.textContent = '✓ QR detected!';
      processQrCode(code.data.trim());
    }
  }

  /* ================================================================
     FILE / IMAGE IMPORT
  ================================================================ */
  qrFileInput?.addEventListener('change', e => {
    const file = e.target.files?.[0];
    if (file) processImageFile(file);
  });

  qrDropzone?.addEventListener('dragover', e => {
    e.preventDefault();
    if (qrDropzone) qrDropzone.style.borderColor = 'var(--gold)';
  });
  qrDropzone?.addEventListener('dragleave', () => {
    if (qrDropzone) qrDropzone.style.borderColor = 'rgba(201,168,76,0.3)';
  });
  qrDropzone?.addEventListener('drop', e => {
    e.preventDefault();
    if (qrDropzone) qrDropzone.style.borderColor = 'rgba(201,168,76,0.3)';
    const file = e.dataTransfer.files?.[0];
    if (file?.type.startsWith('image/')) processImageFile(file);
    else if (window.showToast) window.showToast('⚠ Please drop an image file.');
  });

  function processImageFile(file) {
    const reader = new FileReader();
    reader.onload = evt => {
      if (qrUploadImg) qrUploadImg.src = evt.target.result;
      if (qrDropzone)  qrDropzone.style.display = 'none';
      if (qrUploadPreview) {
        qrUploadPreview.style.display = 'block';
        gsap?.fromTo(qrUploadPreview, { opacity:0, y:10 }, { opacity:1, y:0, duration:0.3 });
      }
      if (qrUploadStatus) qrUploadStatus.textContent = 'Analysing image…';

      const img = new Image();
      img.onload = () => {
        const c = document.createElement('canvas');
        c.width = img.naturalWidth; c.height = img.naturalHeight;
        c.getContext('2d').drawImage(img, 0, 0);
        const imgData = c.getContext('2d').getImageData(0, 0, c.width, c.height);

        if (typeof jsQR === 'undefined') {
          if (qrUploadStatus) qrUploadStatus.textContent = '⚠ QR library not loaded.';
          return;
        }
        const code = jsQR(imgData.data, imgData.width, imgData.height, { inversionAttempts: 'attemptBoth' });
        if (code?.data) {
          if (qrUploadStatus) qrUploadStatus.textContent = '✓ QR code found!';
          processQrCode(code.data.trim());
        } else {
          if (qrUploadStatus) qrUploadStatus.textContent = '⚠ No QR code found. Try a clearer image.';
          setTimeout(() => {
            if (qrDropzone)      qrDropzone.style.display = 'flex';
            if (qrUploadPreview) qrUploadPreview.style.display = 'none';
            if (qrFileInput)     qrFileInput.value = '';
          }, 2800);
        }
      };
      img.src = evt.target.result;
    };
    reader.readAsDataURL(file);
  }

  /* ================================================================
     DEMO CODES
  ================================================================ */
  document.querySelectorAll('.qr-code-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      processQrCode(btn.dataset.qr);
      gsap?.fromTo(btn, { scale:0.96 }, { scale:1, duration:0.3, ease:'back.out(2)' });
    });
  });

  /* ================================================================
     CORE: PROCESS ANY QR VALUE
  ================================================================ */
  function processQrCode(value) {
    const data    = bottleData[value];
    const isKnown = !!data;
    const isNew   = !scannedCodes.has(value);
    const pts     = isKnown ? (isNew ? 50 : 5) : 0;

    userPoints += pts;
    scannedCodes.add(value);

    const rows = isKnown ? [
      { label:'Blend',    val: data.blend    },
      { label:'Origin',   val: data.origin   },
      { label:'Harvest',  val: data.harvest  },
      { label:'Calories', val: data.calories },
      { label:'Sugar',    val: data.sugar    },
      { label:'Your Points', val: userPoints + ' pts', hi: true },
    ] : [
      { label:'QR Value', val: value.substring(0,24) },
      { label:'Status',   val: 'Not in our system'  },
    ];

    if (qrResultGrid) {
      qrResultGrid.innerHTML = rows.map(r =>
        `<div class="qr-result-item">
          <span>${r.label}</span>
          <strong${r.hi ? ' style="color:var(--gold-light)"' : ''}>${r.val}</strong>
        </div>`
      ).join('');
    }

    if (qrPtsMsg) {
      qrPtsMsg.textContent = isKnown
        ? (isNew ? `+${pts} Degla Points earned! Total: ${userPoints}` : `Re-scan: +${pts} pts. Total: ${userPoints}`)
        : 'Bottle not registered — contact support@deglora.com';
    }

    if (qrScanResult) {
      qrScanResult.classList.add('active');
      gsap?.fromTo(qrScanResult, { opacity:0, y:16 }, { opacity:1, y:0, duration:0.4, ease:'power3.out' });
    }

    // Persist to Supabase if signed in
    if (isKnown && pts > 0) {
      const uid = window.DeglAuth?.user?.id;
      if (uid && window.DegloDB?.isReady()) {
        window.DegloDB.saveQrScan(uid, value, pts);
        window.DegloDB.addPointsToDB(uid, pts);
      }
      if (window.updateNavPoints) window.updateNavPoints(userPoints);
      animateLivePoints(userPoints);
    }
  }

  function animateLivePoints(pts) {
    const counter = document.getElementById('pointsCounter');
    const bar     = document.getElementById('pointsBarFill');
    if (counter && gsap) {
      const obj = { v: parseInt(counter.textContent) || 0 };
      gsap.to(obj, { v: pts, duration:1.2, ease:'power2.out', onUpdate: () => { counter.textContent = Math.round(obj.v); } });
    }
    if (bar && gsap) gsap.to(bar, { width: Math.min((pts/500)*100,100)+'%', duration:1.5, ease:'power2.out' });
  }

  function resetResult() {
    if (qrScanResult)    qrScanResult.classList.remove('active');
    if (qrDropzone)      qrDropzone.style.display = 'flex';
    if (qrUploadPreview) qrUploadPreview.style.display = 'none';
    if (qrFileInput)     qrFileInput.value = '';
    if (qrUploadStatus)  qrUploadStatus.textContent = 'Analysing…';
    if (qrUploadImg)     qrUploadImg.src = '';
    if (qrCameraHint)    qrCameraHint.textContent = 'Tap below to start your camera';
  }

})();
