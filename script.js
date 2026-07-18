/* ================= GUEST NAME FROM ?to= =================
   GUEST_KEY (lowercased) is reused later to detect a returning guest's
   previous RSVP submission, independent of whatever they type as their
   display name. */
const GUEST_KEY = (new URLSearchParams(location.search).get('to') || '').trim().toLowerCase();
(function(){
  const params = new URLSearchParams(location.search);
  const name = params.get('to');
  if(name){
    document.querySelectorAll('.guest-name').forEach(el=>{ el.textContent = decodeURIComponent(name); });
    document.title = "Will You Be My Bridesmaid? — for " + decodeURIComponent(name);
  }
})();

/* ================= GSAP CORE SETUP ================= */
gsap.registerPlugin(ScrollTrigger);
const REDUCE_MOTION = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const scroller = document.getElementById('scroller');
ScrollTrigger.defaults({ scroller: scroller });
gsap.defaults({ ease: 'power3.out' });

/* ---- text split helpers (chars / words), <br> and nested dynamic spans safe ---- */
function splitChars(el){
  if(!el || el.dataset.split) return [];
  el.dataset.split = '1';
  el.setAttribute('aria-label', el.textContent.trim());
  const frag = document.createDocumentFragment();
  const spans = [];
  el.childNodes.forEach(node=>{
    if(node.nodeType === 3){
      const words = node.textContent.split(' ');
      words.forEach((word, wi)=>{
        if(word.length){
          const group = document.createElement('span');
          group.className = 'split-word-group';
          [...word].forEach(ch=>{
            const span = document.createElement('span');
            span.className = 'split-ch';
            span.textContent = ch;
            span.setAttribute('aria-hidden','true');
            group.appendChild(span);
            spans.push(span);
          });
          frag.appendChild(group);
        }
        if(wi < words.length - 1) frag.appendChild(document.createTextNode(' '));
      });
    } else if(node.nodeName === 'BR'){
      frag.appendChild(document.createElement('br'));
    }
  });
  el.innerHTML = '';
  el.appendChild(frag);
  el.classList.add('is-split');
  return spans;
}
function splitWords(el){
  if(!el || el.dataset.split || el.querySelector('.guest-name')) return [];
  el.dataset.split = '1';
  el.setAttribute('aria-label', el.textContent.trim());
  const words = el.textContent.trim().split(/\s+/);
  el.innerHTML = '';
  const spans = [];
  words.forEach((w,i)=>{
    const span = document.createElement('span');
    span.className = 'split-wd';
    span.textContent = w;
    span.setAttribute('aria-hidden','true');
    el.appendChild(span);
    spans.push(span);
    if(i < words.length-1) el.appendChild(document.createTextNode(' '));
  });
  el.classList.add('is-split');
  return spans;
}

/* ================= OPENING SEQUENCE (Welcome) ================= */
function playOpening(){
  const welcome = document.getElementById('welcome');
  if(!welcome) return;
  const bg = welcome.querySelector('.bg');
  const heading = welcome.querySelector('h1');
  const sub = welcome.querySelector('.sub');
  const eyebrow = welcome.querySelector('.eyebrow');
  const btn = welcome.querySelector('.btn');

  if(REDUCE_MOTION){
    welcome.querySelectorAll('.reveal-line').forEach(el=>el.classList.add('in'));
    return;
  }

  const chars = splitChars(heading);
  const words = splitWords(sub);
  gsap.set(chars, {opacity:0, y:40, filter:'blur(10px)'});
  gsap.set(words, {opacity:0, y:20, filter:'blur(6px)'});
  if(bg) gsap.set(bg, {scale:1.3});

  const tl = gsap.timeline({defaults:{ease:'power3.out'}});
  if(bg) tl.to(bg, {scale:1.12, duration:9, ease:'power2.inOut'}, 0);
  tl.add(()=>{ if(eyebrow) eyebrow.classList.add('in'); }, .05);
  tl.to(chars, {opacity:1, y:0, filter:'blur(0px)', duration:.6, stagger:.018}, .2);
  tl.to(words, {opacity:1, y:0, filter:'blur(0px)', duration:.45, stagger:.045, ease:'power3.out'}, .45);
  tl.add(()=>{ if(btn) btn.classList.add('in'); }, '+=.05');
}

/* ================= LOADING =================
   400ms buffer (not the old 2000ms) just lets the intro's own CSS timeline
   (logo draw, letter fade) land cleanly — most of that has usually already
   played out during the real load time itself, so this stays short. */
window.addEventListener('load', ()=>{
  setTimeout(()=>{
    const loadingEl = document.getElementById('loading');
    loadingEl.classList.add('ready');
    let dismissed = false;
    const dismiss = ()=>{
      if(dismissed) return;
      dismissed = true;
      loadingEl.classList.remove('ready');
      loadingEl.classList.add('hide');
      tryAutoplay();
      playOpening();
      setTimeout(()=> ScrollTrigger.refresh(), 300);
    };
    loadingEl.addEventListener('click', dismiss, {once:true});
    setTimeout(dismiss, 5000); // safety net in case the tap never happens
  }, 400);
});

/* lazy-loaded images can change document height after ScrollTrigger's
   initial measurement; refresh once things settle so trigger positions
   (e.g. the ambient background) stay accurate */
window.addEventListener('load', ()=>{
  setTimeout(()=> ScrollTrigger.refresh(), 2500);
});

/* ================= SCROLL PROGRESS ================= */
const progress = document.getElementById('progress');
scroller.addEventListener('scroll', ()=>{
  const max = scroller.scrollHeight - scroller.clientHeight;
  progress.style.width = (scroller.scrollTop/max*100) + '%';
});

/* ================= SCROLL REVEAL (per-section GSAP timeline) ================= */
function initSectionReveal(section){
  if(section.id === 'welcome') return; // handled by opening sequence

  section.querySelectorAll('p:not(.reveal-line)').forEach(p=> p.classList.add('reveal-line'));

  const heading = section.querySelector('h1,h2');
  const subtitleEls = section.querySelectorAll('.eyebrow,.l1,.sub,.date');
  let headingSpans = [];
  let subtitleSpans = [];

  if(!REDUCE_MOTION && heading){
    headingSpans = splitChars(heading);
    gsap.set(headingSpans, {opacity:0, y:40, filter:'blur(10px)'});
  }
  if(!REDUCE_MOTION){
    subtitleEls.forEach(el=>{
      const spans = splitWords(el);
      if(spans.length) subtitleSpans.push(...spans);
    });
    if(subtitleSpans.length) gsap.set(subtitleSpans, {opacity:0, y:16, filter:'blur(6px)'});
  }

  function playReveal(){
    const lines = section.querySelectorAll('.reveal-line:not(.in)');
    lines.forEach((el,i)=> setTimeout(()=>el.classList.add('in'), i*110));
    if(headingSpans.length){
      gsap.to(headingSpans, {opacity:1,y:0,filter:'blur(0px)',duration:.55,stagger:.016,ease:'power3.out',delay:.03,overwrite:true});
    }
    if(subtitleSpans.length){
      gsap.to(subtitleSpans, {opacity:1,y:0,filter:'blur(0px)',duration:.42,stagger:.03,ease:'power3.out',delay:.1,overwrite:true});
    }
  }
  function resetReveal(){
    section.querySelectorAll('.reveal-line.in').forEach(el=> el.classList.remove('in'));
    if(headingSpans.length) gsap.set(headingSpans, {opacity:0,y:40,filter:'blur(10px)'});
    if(subtitleSpans.length) gsap.set(subtitleSpans, {opacity:0,y:16,filter:'blur(6px)'});
  }

  ScrollTrigger.create({
    trigger: section,
    start: 'top 72%',
    end: 'bottom 20%',
    onEnter: playReveal,
    onEnterBack: playReveal,
    onLeave: resetReveal,
    onLeaveBack: resetReveal
  });
}

if(REDUCE_MOTION){
  document.querySelectorAll('.reveal-line').forEach(el=> el.classList.add('in'));
} else {
  document.querySelectorAll('.slide').forEach(initSectionReveal);

  /* subtle scroll-linked parallax drift on the Wedding Details photo —
     kept to a single, safe target that has no other GSAP/CSS transform
     of its own, so it can't fight the reveal-line or d-hero styling */
  gsap.fromTo('.arch-frame', {y:-20}, {
    y:20, ease:'none',
    scrollTrigger:{ trigger:'#detail', scroller:scroller, start:'top bottom', end:'bottom top', scrub:true }
  });

  /* Our Journey: photo tiles scatter apart, then fly back into their
     grid position when the section is scrolled into view (and reset
     to scattered again on leave, so it replays every visit) */
  const journeyCards = gsap.utils.toArray('.journey-grid .j-card');
  if(journeyCards.length){
    const scatter = journeyCards.map(()=>({
      x: gsap.utils.random(-160,160),
      y: gsap.utils.random(-140,140),
      rotation: gsap.utils.random(-28,28)
    }));
    function scatterJourney(){
      journeyCards.forEach((card,i)=>{
        gsap.set(card, {x:scatter[i].x, y:scatter[i].y, rotation:scatter[i].rotation, opacity:0, overwrite:true});
      });
    }
    function assembleJourney(){
      journeyCards.forEach((card,i)=>{
        gsap.to(card, {x:0, y:0, rotation:0, opacity:1, duration:1, ease:'power3.out', delay:i*.06, overwrite:true});
      });
    }
    scatterJourney();
    ScrollTrigger.create({
      trigger:'#journey', scroller:scroller, start:'top 70%', end:'bottom 20%',
      onEnter:assembleJourney, onEnterBack:assembleJourney,
      onLeave:scatterJourney, onLeaveBack:scatterJourney
    });
  }
}

/* ================= AMBIENT BACKGROUND (Wedding Details onward) ================= */
(function(){
  const bgParallax = document.getElementById('bg-parallax');
  const bgStart = document.getElementById('detail');
  const bgEnd = document.getElementById('thankyou');
  if(!bgParallax || !bgStart || !bgEnd) return;
  ScrollTrigger.create({
    trigger: bgStart,
    endTrigger: bgEnd,
    start: 'top 85%',
    end: 'bottom bottom',
    onToggle: (self)=> bgParallax.classList.toggle('visible', self.isActive)
  });
})();

/* ================= FRIENDSHIP GALLERY (built from images/friends/manifest.json) =================
   Reads the list of bridesmaid folders/photos from a manifest generated by
   build-friends-manifest.js (run automatically on every Netlify build — see
   netlify.toml), so adding or removing photos in images/friends/<NAME>/ shows
   up on redeploy without ever touching this file or index.html. */
(function(){
  const container = document.getElementById('friend-cols');
  if(!container) return;
  fetch('images/friends/manifest.json?t=' + Date.now())
    .then(r => r.json())
    .then(groups => {
      const toParam = (new URLSearchParams(location.search).get('to') || '').trim().toLowerCase();
      if(toParam){
        const match = groups.find(g => g.name.toLowerCase() === toParam);
        if(match) groups = [match];
      }

      // always render at least MIN_COLUMNS columns — a filtered/personalized
      // view (often just one matching folder) repeats that folder's photos
      // across extra columns rather than showing a single lonely column.
      // Each repeated column starts at a different rotation offset into the
      // photo list so columns don't all show the same photo up top.
      const MIN_COLUMNS = 4;
      const totalColumns = Math.max(groups.length, MIN_COLUMNS);
      const groupIdxMap = new Map();
      let nextIdx = 0;
      groups.forEach(g => { groupIdxMap.set(g.name, nextIdx); nextIdx += g.photos.length; });

      for(let ci = 0; ci < totalColumns; ci++){
        const group = groups[ci % groups.length];
        const repIndex = Math.floor(ci / groups.length);
        const repsOfThisGroup = Math.ceil(totalColumns / groups.length);
        const uniqueCount = group.photos.length;
        const offset = uniqueCount > 0 ? Math.floor((uniqueCount / repsOfThisGroup) * repIndex) : 0;
        const startIdx = groupIdxMap.get(group.name);

        const col = document.createElement('div');
        col.className = 'friend-col';

        const imageCol = document.createElement('div');
        imageCol.className = 'image-column';

        const track = document.createElement('div');
        track.className = 'track ' + (ci % 2 === 0 ? 'up' : 'down');

        const encodedFolder = encodeURIComponent(group.name);
        // folders with few photos get their list cycled/repeated so the
        // column still looks full when auto-scrolling, instead of looping
        // through a handful of images too quickly
        const MIN_PHOTOS_PER_COLUMN = 18;
        const BASE_DURATION = 32; // seconds, at MIN_PHOTOS_PER_COLUMN — matches ISMA's speed
        const displayCount = Math.max(uniqueCount, MIN_PHOTOS_PER_COLUMN);
        // longer tracks (more photos) get a proportionally longer duration
        // so every column scrolls at the same px/sec speed, not just the
        // same loop-cycle time
        track.style.animationDuration = (BASE_DURATION * displayCount / MIN_PHOTOS_PER_COLUMN) + 's';
        for(let rep = 0; rep < 2; rep++){
          for(let pos = 0; pos < displayCount; pos++){
            const originalIndex = (pos + offset) % uniqueCount;
            const file = group.photos[originalIndex];
            const img = document.createElement('img');
            img.src = 'images/friends/' + encodedFolder + '/' + encodeURIComponent(file);
            img.alt = '';
            img.loading = 'lazy';
            img.dataset.idx = String(startIdx + originalIndex);
            img.addEventListener('load', ()=> img.classList.add('loaded'));
            track.appendChild(img);
          }
        }

        imageCol.appendChild(track);
        col.appendChild(imageCol);
        container.appendChild(col);
      }

      if(window.rebindFriendsLightbox) window.rebindFriendsLightbox();
      ScrollTrigger.refresh();
    })
    .catch(err => console.error('Failed to load friends manifest', err));
})();

/* Safety net: reveal animations replay on every scroll in/out, so this
   can't be a one-shot "force everything visible" timer (that would
   pre-empt sections the user hasn't scrolled to yet). Instead, keep
   checking for content that is CURRENTLY on screen but somehow never
   got its reveal triggered (e.g. an edge-case viewport), and nudge
   only that into view. */
setInterval(()=>{
  document.querySelectorAll('.reveal-line:not(.in)').forEach(el=>{
    const rect = el.getBoundingClientRect();
    if(rect.bottom > 0 && rect.top < window.innerHeight) el.classList.add('in');
  });
}, 2000);

/* ================= NAV BUTTONS ================= */
/* scroller.scrollTo (not element.scrollIntoView) — more reliable across
   Android WebViews when the scrolling element isn't the window itself */
function scrollToSection(id){
  const el = document.getElementById(id);
  if(el) scroller.scrollTo({top: el.offsetTop, behavior:'smooth'});
}
document.getElementById('open-invite').addEventListener('click', ()=>{
  scrollToSection('reveal');
});
document.getElementById('to-form').addEventListener('click', ()=>{
  scrollToSection('form-section');
});

/* ================= COUNTDOWN ================= */
const target = new Date('2026-08-25T08:00:00+07:00').getTime();
function tickCountdown(){
  const now = Date.now();
  let diff = target - now;
  if(diff < 0) diff = 0;
  const d = Math.floor(diff/(1000*60*60*24));
  const h = Math.floor(diff/(1000*60*60)%24);
  const m = Math.floor(diff/(1000*60)%60);
  const s = Math.floor(diff/1000%60);
  document.getElementById('cd-days').textContent = String(d).padStart(2,'0');
  document.getElementById('cd-hours').textContent = String(h).padStart(2,'0');
  document.getElementById('cd-min').textContent = String(m).padStart(2,'0');
  document.getElementById('cd-sec').textContent = String(s).padStart(2,'0');
}
tickCountdown();
setInterval(tickCountdown, 1000);

/* ================= LIGHTBOX (shared) ================= */
(function(){
  const lb = document.getElementById('lightbox');
  const lbImg = document.getElementById('lb-img');
  const frameWrap = document.getElementById('lb-frame-wrap');
  const lbFrame = document.getElementById('lb-frame');
  let imgs = [];
  let idx = 0;
  let currentKind = null;

  /* friend photos get an overlaid camera-frame (portrait or landscape PNG)
     picked from the loaded image's own aspect ratio; journey photos never
     get a frame. Window position inside each PNG was measured by ray-casting
     from its transparent center out to the opaque border (see the % insets
     on .lb-frame-wrap in style.css). */
  function applyFrame(){
    if(currentKind !== 'friend'){
      frameWrap.classList.remove('framed','landscape','portrait');
      return;
    }
    if(!lbImg.naturalWidth) return; // onload below will call this again once it's ready
    const isPortrait = lbImg.naturalHeight > lbImg.naturalWidth;
    frameWrap.classList.toggle('landscape', !isPortrait);
    frameWrap.classList.toggle('portrait', isPortrait);
    lbFrame.src = isPortrait ? 'images/frame_potrait.png' : 'images/frame_landscape.png';
    frameWrap.classList.add('framed');
  }
  lbImg.addEventListener('load', applyFrame);

  function show(i){
    idx = (i + imgs.length) % imgs.length;
    lbImg.src = imgs[idx].src;
    applyFrame();
  }
  function open(list, i, kind){
    imgs = list;
    currentKind = kind || null;
    show(i);
    lb.classList.add('show');
  }
  function close(){ lb.classList.remove('show'); }

  function bindGallery(imgList, clickTargetOf){
    imgList.forEach((img, i)=>{
      clickTargetOf(img).addEventListener('click', ()=> open(imgList, i));
    });
  }

  bindGallery(Array.from(document.querySelectorAll('.journey-grid .j-card img')), (img)=> img.closest('.j-card'));

  function bindFriendsGallery(){
    const scrollImgs = Array.from(document.querySelectorAll('.scroll-gallery img'));
    const uniqueByIdx = [];
    scrollImgs.forEach(img=>{
      const i = parseInt(img.dataset.idx, 10);
      if(!uniqueByIdx[i]) uniqueByIdx[i] = img;
    });
    scrollImgs.forEach(img=>{
      const i = parseInt(img.dataset.idx, 10);
      img.addEventListener('click', ()=> open(uniqueByIdx, i, 'friend'));
    });
  }
  bindFriendsGallery();
  window.rebindFriendsLightbox = bindFriendsGallery;

  document.getElementById('lb-close').addEventListener('click', close);
  document.getElementById('lb-next').addEventListener('click', ()=> show(idx + 1));
  document.getElementById('lb-prev').addEventListener('click', ()=> show(idx - 1));
  lb.addEventListener('click', (e)=>{ if(e.target === lb) close(); });
  document.addEventListener('keydown', (e)=>{
    if(!lb.classList.contains('show')) return;
    if(e.key === 'Escape') close();
    else if(e.key === 'ArrowRight') show(idx + 1);
    else if(e.key === 'ArrowLeft') show(idx - 1);
  });

  let touchStartX = null;
  lb.addEventListener('touchstart', (e)=>{ touchStartX = e.touches[0].clientX; }, {passive:true});
  lb.addEventListener('touchend', (e)=>{
    if(touchStartX === null) return;
    const dx = e.changedTouches[0].clientX - touchStartX;
    if(dx > 40) show(idx - 1);
    else if(dx < -40) show(idx + 1);
    touchStartX = null;
  });
})();

/* ================= MUSIC TOGGLE ================= */
const bgm = document.getElementById('bgm');
const musicBtn = document.getElementById('music-toggle');
const musicIcon = document.getElementById('music-icon');
let playing = false;
let autoplayAttempted = false;

function setPlaying(state){
  playing = state;
  musicIcon.classList.toggle('spin', state);
  musicIcon.src = state ? 'icons/disk_play.png' : 'icons/disk_pause.png';
}

function tryAutoplay(){
  if(autoplayAttempted || playing) return;
  autoplayAttempted = true;
  bgm.play().then(()=> setPlaying(true)).catch(()=>{ autoplayAttempted = false; });
}

window.addEventListener('load', tryAutoplay);
document.addEventListener('click', tryAutoplay, {once:true});
document.addEventListener('touchstart', tryAutoplay, {once:true, passive:true});

musicBtn.addEventListener('click', ()=>{
  if(playing){ bgm.pause(); setPlaying(false); }
  else{ bgm.play().then(()=> setPlaying(true)).catch(()=>{}); }
});

/* ================= THE QUESTION ================= */
/* guard against mobile browsers' scroll-anchoring jumping to a
   neighboring section when this section's height changes suddenly */
function holdScrollPosition(sectionId){
  const section = document.getElementById(sectionId);
  const before = section.getBoundingClientRect().top;
  requestAnimationFrame(()=>{
    requestAnimationFrame(()=>{
      const drift = section.getBoundingClientRect().top - before;
      if(Math.abs(drift) > 1) scroller.scrollTop += drift;
    });
  });
}

/* ================= LOCK SCROLL ON "WILL YOU BE MY BRIDESMAID?" UNTIL ANSWERED =================
   Once the user's scroll lands on #question, forward scrolling (wheel/touch/
   keyboard) is blocked until they tap Yes or Not Sure Yet. Scrolling back up
   to revisit earlier sections stays free. */
(function(){
  const questionSection = document.getElementById('question');
  if(!questionSection) return;
  let onQuestion = false;
  let answered = false;
  let lastNudge = 0;

  ScrollTrigger.create({
    trigger: questionSection, scroller: scroller,
    start: 'top center', end: 'bottom center',
    onEnter: ()=> onQuestion = true,
    onEnterBack: ()=> onQuestion = true,
    onLeave: ()=> onQuestion = false,
    onLeaveBack: ()=> onQuestion = false
  });

  function nudge(){
    const now = Date.now();
    if(now - lastNudge < 700) return;
    lastNudge = now;
    gsap.fromTo('.q-actions', {x:-8}, {x:0, duration:.5, ease:'elastic.out(1,0.3)'});
  }

  scroller.addEventListener('wheel', (e)=>{
    if(onQuestion && !answered && e.deltaY > 0){ e.preventDefault(); nudge(); }
  }, {passive:false});

  let touchStartY = null;
  scroller.addEventListener('touchstart', (e)=>{ touchStartY = e.touches[0].clientY; }, {passive:true});
  scroller.addEventListener('touchmove', (e)=>{
    if(!onQuestion || answered || touchStartY === null) return;
    if(touchStartY - e.touches[0].clientY > 0){ e.preventDefault(); nudge(); }
  }, {passive:false});

  window.addEventListener('keydown', (e)=>{
    if(!onQuestion || answered) return;
    if(e.key === 'ArrowDown' || e.key === 'PageDown' || e.key === ' '){ e.preventDefault(); nudge(); }
  });

  window.markQuestionAnswered = ()=>{ answered = true; };
})();

document.getElementById('btn-yes').addEventListener('click', ()=>{
  confettiBurst();
  document.getElementById('letter-wrap').classList.add('show');
  document.getElementById('btn-yes').style.display='none';
  document.getElementById('btn-maybe').style.display='none';
  holdScrollPosition('question');
  window.markQuestionAnswered();
});
document.getElementById('btn-maybe').addEventListener('click', ()=>{
  document.getElementById('envelope-yes').style.display='none';
  document.getElementById('envelope-maybe').style.display='block';
  document.getElementById('letter-wrap').classList.add('show');
  document.getElementById('btn-yes').style.display='none';
  document.getElementById('btn-maybe').style.display='none';
  window.markQuestionAnswered();
  holdScrollPosition('question');
});
function confettiBurst(){
  if(typeof confetti !== 'function') return;
  const colors = ['#B4874F','#DCA9A0','#FBF5EC','#6E3A29'];
  confetti({ particleCount:120, spread:80, origin:{y:0.6}, colors });
  setTimeout(()=> confetti({ particleCount:60, spread:100, origin:{y:0.4}, colors }), 300);
}

/* ================= FORM ================= */
document.querySelectorAll('input[name=ukuran]').forEach(r=>{
  r.addEventListener('change', ()=>{
    const box = document.getElementById('custom-size-fields');
    if(r.value === 'Custom' && r.checked) box.classList.add('show');
    else if(r.checked) box.classList.remove('show');
  });
});

const attendingOnly = document.getElementById('attending-only-fields');
const attendingOnlyRadios = attendingOnly.querySelectorAll('input[required]');
document.querySelectorAll('input[name=konfirmasi]').forEach(r=>{
  r.addEventListener('change', ()=>{
    if(!r.checked) return;
    const isAttending = r.value === 'Attending';
    attendingOnly.style.display = isAttending ? '' : 'none';
    attendingOnlyRadios.forEach(field=> field.required = isAttending);
    if(!isAttending){
      document.querySelectorAll('input[name=ukuran]:checked, input[name=hijab]:checked').forEach(f=> f.checked = false);
      document.getElementById('custom-size-fields').classList.remove('show');
    }
  });
});

/* Supabase table backing the Wishes Wall — see supabase-setup.sql for the
   table + policies to create. Until real values are pasted here,
   submissions still save to localStorage/WhatsApp as before, they just
   won't appear in the shared Wishes Wall for other guests. */
const SUPABASE_URL = 'https://gxkbldbrsheuzqmxreyw.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imd4a2JsZGJyc2hldXpxbXhyZXl3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODQzNDUwNzcsImV4cCI6MjA5OTkyMTA3N30.UKPQY19XpLR3ClnnLdY1xwCZ3h9tXY_1j8WOWQFdEcI';
const SUPABASE_READY = SUPABASE_URL.startsWith('http') && SUPABASE_ANON_KEY.length > 20;
const SUPABASE_HEADERS = {
  'Content-Type': 'application/json',
  'apikey': SUPABASE_ANON_KEY,
  'Authorization': 'Bearer ' + SUPABASE_ANON_KEY
};

/* ================= RETURNING GUEST: PREFILL + EDIT INSTEAD OF DUPLICATE =================
   If this link has a ?to= and that guest already has a row (matched by
   guest_key, not the free-text name field), load their previous answers
   into the form and remember the row id so submit updates it instead of
   inserting a new one. */
let existingRsvpId = null;
if(GUEST_KEY && SUPABASE_READY){
  fetch(SUPABASE_URL + '/rest/v1/rsvp?guest_key=eq.' + encodeURIComponent(GUEST_KEY) + '&select=*&limit=1', {
    headers: SUPABASE_HEADERS
  })
    .then(r => r.json())
    .then(rows => {
      const row = rows[0];
      if(!row) return;
      existingRsvpId = row.id;

      document.getElementById('f-nama').value = row.nama || '';
      document.getElementById('f-catatan').value = row.catatan || '';
      document.getElementById('f-ucapan').value = row.ucapan || '';
      document.getElementById('f-dada').value = row.dada || '';
      document.getElementById('f-pinggang').value = row.pinggang || '';
      document.getElementById('f-pinggul').value = row.pinggul || '';
      document.getElementById('f-tinggi').value = row.tinggi || '';

      const konfirmasiRadio = document.querySelector('input[name=konfirmasi][value="' + row.konfirmasi + '"]');
      if(konfirmasiRadio){ konfirmasiRadio.checked = true; konfirmasiRadio.dispatchEvent(new Event('change')); }
      if(row.ukuran){
        const ukuranRadio = document.querySelector('input[name=ukuran][value="' + row.ukuran + '"]');
        if(ukuranRadio){ ukuranRadio.checked = true; ukuranRadio.dispatchEvent(new Event('change')); }
      }
      if(row.hijab){
        const hijabRadio = document.querySelector('input[name=hijab][value="' + row.hijab + '"]');
        if(hijabRadio) hijabRadio.checked = true;
      }

      const submitBtn = document.querySelector('#rsvp-form button[type=submit]');
      if(submitBtn) submitBtn.textContent = 'Update Confirmation';
      const hint = document.querySelector('#rsvp-form .f-hint');
      if(hint) hint.textContent = "You've already responded — feel free to update it below.";
    })
    .catch(()=>{});
}

document.getElementById('rsvp-form').addEventListener('submit', (e)=>{
  e.preventDefault();
  const data = {
    id: Date.now(),
    nama: document.getElementById('f-nama').value,
    konfirmasi: (document.querySelector('input[name=konfirmasi]:checked')||{}).value || '',
    ukuran: (document.querySelector('input[name=ukuran]:checked')||{}).value || '',
    dada: document.getElementById('f-dada').value,
    pinggang: document.getElementById('f-pinggang').value,
    pinggul: document.getElementById('f-pinggul').value,
    tinggi: document.getElementById('f-tinggi').value,
    hijab: (document.querySelector('input[name=hijab]:checked')||{}).value || '',
    catatan: document.getElementById('f-catatan').value,
    ucapan: document.getElementById('f-ucapan').value,
    waktu: new Date().toLocaleString('en-US')
  };
  const list = JSON.parse(localStorage.getItem('bridesmaid_rsvp') || '[]');
  list.push(data);
  localStorage.setItem('bridesmaid_rsvp', JSON.stringify(list));

  if(SUPABASE_READY){
    const body = JSON.stringify({
      nama: data.nama, konfirmasi: data.konfirmasi, ukuran: data.ukuran,
      dada: data.dada, pinggang: data.pinggang, pinggul: data.pinggul, tinggi: data.tinggi,
      hijab: data.hijab, catatan: data.catatan, ucapan: data.ucapan, guest_key: GUEST_KEY
    });
    if(existingRsvpId){
      fetch(SUPABASE_URL + '/rest/v1/rsvp?id=eq.' + existingRsvpId, {
        method: 'PATCH',
        headers: { ...SUPABASE_HEADERS, 'Prefer': 'return=minimal' },
        body
      }).catch(()=>{});
    } else {
      // return=representation so we learn the new row's real id — needed to
      // update (not duplicate-insert) if this same guest submits again
      // later in this same page session, before any reload
      fetch(SUPABASE_URL + '/rest/v1/rsvp', {
        method: 'POST',
        headers: { ...SUPABASE_HEADERS, 'Prefer': 'return=representation' },
        body
      })
        .then(r => r.json())
        .then(rows => {
          if(!rows[0]) return;
          existingRsvpId = rows[0].id;
          const list = document.getElementById('wishes-list');
          const placeholderCard = list && list.querySelector('.wish-card[data-rsvp-id="' + data.id + '"]');
          if(placeholderCard) placeholderCard.dataset.rsvpId = existingRsvpId;
        })
        .catch(()=>{});
    }
  }

  upsertWishCard(existingRsvpId, data);

  confettiBurst();
  showToast(existingRsvpId ? 'Your confirmation has been updated 🤎' : 'Thank you! Your confirmation has been saved 🤎');
  setTimeout(()=>{
    scrollToSection('wishes');
  }, 700);
});

function showToast(msg){
  const t = document.getElementById('toast');
  t.textContent = msg;
  t.classList.add('show');
  setTimeout(()=> t.classList.remove('show'), 3200);
}

/* ================= WISHES WALL (reads the same Supabase table) =================
   upsertWishCard() is also called right after a form submit (see above) so a
   guest's own wish appears/updates immediately without waiting for a page
   reload — whether it's their first submission or an edit of a previous one. */
function addWishCard(r, prepend, id){
  const list = document.getElementById('wishes-list');
  if(!list) return;
  const empty = document.getElementById('wishes-empty');
  if(empty) empty.remove();

  const isAttending = r.konfirmasi === 'Attending';
  const card = document.createElement('div');
  card.className = 'wish-card';
  if(id != null) card.dataset.rsvpId = id;

  const top = document.createElement('div');
  top.className = 'wish-top';
  const name = document.createElement('div');
  name.className = 'wish-name';
  name.textContent = r.nama || 'Anonymous';
  const badge = document.createElement('div');
  badge.className = 'wish-badge ' + (isAttending ? 'attending' : 'maybe');
  badge.textContent = isAttending ? 'Attending' : 'Not Sure Yet';
  top.appendChild(name);
  top.appendChild(badge);

  const msg = document.createElement('div');
  msg.className = 'wish-msg';
  msg.textContent = r.ucapan;

  card.appendChild(top);
  card.appendChild(msg);
  if(prepend && list.firstChild) list.insertBefore(card, list.firstChild);
  else list.appendChild(card);
  ScrollTrigger.refresh();
}

/* id ties a rendered card back to its Supabase row (or, briefly, to the
   local Date.now() placeholder used before an insert's real id comes back
   — see the submit handler). Editing a row with an existing card updates
   it in place and bumps it to the top; a wish that got cleared out removes
   its card; anything else is treated as a fresh wish. */
function upsertWishCard(id, r){
  const hasMsg = (r.ucapan || '').trim();
  const list = document.getElementById('wishes-list');
  const existing = (id != null && list) ? list.querySelector('.wish-card[data-rsvp-id="' + id + '"]') : null;

  if(existing){
    if(!hasMsg){ existing.remove(); return; }
    const isAttending = r.konfirmasi === 'Attending';
    existing.querySelector('.wish-name').textContent = r.nama || 'Anonymous';
    const badge = existing.querySelector('.wish-badge');
    badge.className = 'wish-badge ' + (isAttending ? 'attending' : 'maybe');
    badge.textContent = isAttending ? 'Attending' : 'Not Sure Yet';
    existing.querySelector('.wish-msg').textContent = r.ucapan;
    if(list.firstChild !== existing) list.insertBefore(existing, list.firstChild);
    return;
  }
  if(hasMsg) addWishCard(r, true, id);
}

(function(){
  if(!document.getElementById('wishes-list') || !SUPABASE_READY) return;

  fetch(SUPABASE_URL + '/rest/v1/rsvp?select=id,nama,konfirmasi,ucapan&order=id.desc', {
    headers: { 'apikey': SUPABASE_ANON_KEY, 'Authorization': 'Bearer ' + SUPABASE_ANON_KEY }
  })
    .then(r => r.json())
    .then(rows => {
      rows.filter(r => (r.ucapan || '').trim()).forEach(r => addWishCard(r, false, r.id));
    })
    .catch(err => console.error('Failed to load wishes', err));
})();

/* ================= FALLING PETALS ================= */
const canvas = document.getElementById('petals');
const ctx = canvas.getContext('2d');
function resizeCanvas(){ canvas.width = innerWidth; canvas.height = innerHeight; }
resizeCanvas();
window.addEventListener('resize', resizeCanvas);

const PETAL_COUNT = window.innerWidth < 700 ? 14 : 26;
const petals = Array.from({length:PETAL_COUNT}, ()=> ({
  x: Math.random()*innerWidth,
  y: Math.random()*innerHeight,
  r: 5 + Math.random()*7,
  speed: 0.4 + Math.random()*0.9,
  drift: Math.random()*1 - 0.5,
  rot: Math.random()*360,
  rotSpeed: (Math.random()-0.5)*1.2,
  hue: Math.random() > 0.5 ? '#DCA9A0' : '#F1E2CB'
}));

function drawPetal(p){
  ctx.save();
  ctx.translate(p.x, p.y);
  ctx.rotate(p.rot * Math.PI/180);
  ctx.fillStyle = p.hue;
  ctx.globalAlpha = 0.75;
  ctx.beginPath();
  ctx.ellipse(0,0,p.r,p.r*0.6,0,0,Math.PI*2);
  ctx.fill();
  ctx.restore();
}
function animatePetals(){
  ctx.clearRect(0,0,canvas.width,canvas.height);
  petals.forEach(p=>{
    p.y += p.speed;
    p.x += p.drift;
    p.rot += p.rotSpeed;
    if(p.y > innerHeight + 20){ p.y = -20; p.x = Math.random()*innerWidth; }
    if(p.x > innerWidth + 20) p.x = -20;
    if(p.x < -20) p.x = innerWidth + 20;
    drawPetal(p);
  });
  requestAnimationFrame(animatePetals);
}
animatePetals();

/* ================= CURSOR GLOW + TRAIL ================= */
const glow = document.getElementById('cursor-glow');
let mouseX = -100, mouseY = -100, glowX = -100, glowY = -100;
window.addEventListener('mousemove', (e)=>{
  mouseX = e.clientX; mouseY = e.clientY;
});
function tickGlow(){
  glowX += (mouseX - glowX) * 0.16;
  glowY += (mouseY - glowY) * 0.16;
  glow.style.left = glowX + 'px';
  glow.style.top = glowY + 'px';
  requestAnimationFrame(tickGlow);
}
if(!REDUCE_MOTION) requestAnimationFrame(tickGlow);
document.addEventListener('mouseover', (e)=>{
  const t = e.target;
  if(t.closest && t.closest('.btn,button')) glow.classList.add('on-btn');
  else glow.classList.remove('on-btn');
  if(t.closest && t.closest('img,.arch-frame,.j-card,.d-tile,.d-hero')) glow.classList.add('on-photo');
  else glow.classList.remove('on-photo');
});

/* ================= BUTTON RIPPLE ================= */
document.addEventListener('click', (e)=>{
  const btn = e.target.closest('.btn');
  if(!btn) return;
  const rect = btn.getBoundingClientRect();
  const size = Math.max(rect.width, rect.height) * 1.6;
  const ripple = document.createElement('span');
  ripple.className = 'ripple';
  ripple.style.width = ripple.style.height = size + 'px';
  ripple.style.left = (e.clientX - rect.left - size/2) + 'px';
  ripple.style.top = (e.clientY - rect.top - size/2) + 'px';
  btn.appendChild(ripple);
  ripple.addEventListener('animationend', ()=> ripple.remove());
});

/* ================= PARALLAX ON BG PHOTOS (mouse only — no touch) =================
   Touchscreens fire a synthetic mousemove right after a tap, which used to
   make these backgrounds visibly pan/jump on every tap. Restricted to real
   mouse pointers so tapping never moves the photo at all. */
const HAS_FINE_POINTER = window.matchMedia('(pointer: fine)').matches;
if(HAS_FINE_POINTER){
  ['#welcome .bg'].forEach(sel=>{
    const el = document.querySelector(sel);
    if(!el) return;
    el.parentElement.addEventListener('mousemove', (e)=>{
      const x = (e.clientX / innerWidth - 0.5) * 18;
      const y = (e.clientY / innerHeight - 0.5) * 18;
      el.style.transform = `scale(1.12) translate(${x}px, ${y}px)`;
    });
  });
}

/* ================= REVEAL BACKGROUND ZOOM (bg2) =================
   Ken Burns zoom triggered by scrolling into #reveal, replaying every
   time the section re-enters view. Scroll-only — this background is
   deliberately left out of the mousemove parallax above, so there's no
   click/drag-driven zoom fighting with this animation. */
(function(){
  const bg = document.querySelector('#reveal .bg');
  if(!bg) return;
  ScrollTrigger.create({
    trigger:'#reveal', scroller:scroller, start:'top 70%', end:'bottom 20%',
    onEnter: ()=> gsap.to(bg, {scale:1.12, duration:4, ease:'power2.inOut', overwrite:true}),
    onEnterBack: ()=> gsap.to(bg, {scale:1.12, duration:4, ease:'power2.inOut', overwrite:true}),
    onLeave: ()=> gsap.set(bg, {scale:1}),
    onLeaveBack: ()=> gsap.set(bg, {scale:1})
  });
})();
