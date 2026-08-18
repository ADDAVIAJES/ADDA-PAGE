/* ==========================================================
   ViajesADDA — script.js
   Extraido tal cual del <script> de index.html.

   NO ENVOLVER ESTE ARCHIVO en DOMContentLoaded, en una IIFE,
   ni cargarlo con type="module".
   toggleNav() y toggleFaq() se invocan desde atributos onclick
   en el HTML y deben permanecer en el ambito GLOBAL.
   El <script src> va al final del <body>, sin defer, igual que
   estaba el bloque inline.
   ========================================================== */

/* Mobile menu */
function toggleNav(){
  var nav=document.querySelector('.nav');
  var btn=document.querySelector('.nav-burger');
  var open=nav.classList.toggle('open');
  btn.setAttribute('aria-expanded',open?'true':'false');
  btn.setAttribute('aria-label',open?'Close menu':'Open menu');
}
/* Close the menu after tapping a link */
document.querySelectorAll('.nav-links a').forEach(function(a){
  a.addEventListener('click',function(){document.querySelector('.nav').classList.remove('open')});
});

function toggleFaq(btn){
  var item=btn.parentElement;
  var open=item.classList.contains('open');
  document.querySelectorAll('.faq-item.open').forEach(function(i){i.classList.remove('open')});
  if(!open)item.classList.add('open');
}
var obs=new IntersectionObserver(function(entries){
  entries.forEach(function(e){if(e.isIntersecting)e.target.classList.add('on')});
},{threshold:.08});
document.querySelectorAll('.rv').forEach(function(el){obs.observe(el)});

/* Safety net: if IntersectionObserver is unavailable or fails,
   reveal everything rather than leaving the page blank. */
if(!('IntersectionObserver' in window)){
  document.querySelectorAll('.rv').forEach(function(el){el.classList.add('on')});
}
setTimeout(function(){
  document.querySelectorAll('.rv').forEach(function(el){
    if(el.getBoundingClientRect().top < window.innerHeight) el.classList.add('on');
  });
},1200);

/* ============================================================
   Contact form — Formspree AJAX submission
   Sends without leaving the page, and reports the REAL reason
   when Formspree rejects a submission instead of hiding it.
   ============================================================ */
var lf=document.getElementById('leadForm');
if(lf){
  var FALLBACK_EMAIL='addacommunity@viajesadda.com';

  /* Formspree tells us why it refused. Translate its status codes
     into something the visitor can act on, and log the raw payload
     to the console for whoever is debugging. */
  function describeFailure(status,payload){
    var detail='';
    if(payload){
      if(Array.isArray(payload.errors)&&payload.errors.length){
        detail=payload.errors.map(function(err){
          return (err.field?err.field+': ':'')+(err.message||err.code||'');
        }).join(' · ');
      } else if(payload.error){
        detail=payload.error;
      }
    }
    console.error('[Formspree] HTTP '+status,payload||'(no JSON body returned)');

    if(status===403||status===401){
      return 'This form is not active yet. Formspree needs the owner to confirm the '
           + 'address before it will accept messages. Meanwhile, please write to '+FALLBACK_EMAIL+'.';
    }
    if(status===404){
      return 'The form endpoint could not be found. Please write to '+FALLBACK_EMAIL+' — '
           + 'we do not want your message to be lost.';
    }
    if(status===422||status===400){
      return detail
        ? 'Please check the form: '+detail
        : 'Some information could not be accepted. Please review the fields and try again.';
    }
    if(status===429){
      return 'Too many submissions in a short time. Please wait a moment, or write to '+FALLBACK_EMAIL+'.';
    }
    return 'Something went wrong on our side'+(detail?' ('+detail+')':'')
         + '. Please write directly to '+FALLBACK_EMAIL+' and we will take it from there.';
  }

  lf.addEventListener('submit',function(e){
    /* Native HTML validation runs before this event, but re-check
       explicitly so a programmatic submit cannot bypass it. */
    if(typeof lf.checkValidity==='function' && !lf.checkValidity()){
      if(typeof lf.reportValidity==='function') lf.reportValidity();
      return;
    }
    e.preventDefault();

    var btn=lf.querySelector('.form-submit');
    var msg=document.getElementById('formMsg');
    var original=btn.textContent;

    btn.disabled=true;
    btn.textContent='Sending…';
    msg.className='form-msg';
    msg.textContent='';

    /* IMPORTANT: do NOT set Content-Type here. With a FormData body the
       browser must generate the multipart boundary itself; setting the
       header manually produces a malformed request that Formspree rejects. */
    fetch(lf.action,{
      method:'POST',
      body:new FormData(lf),
      headers:{'Accept':'application/json'}
    })
    .then(function(r){
      /* Always read the body — the failure reason lives in there. */
      return r.json().catch(function(){return null;}).then(function(payload){
        return {ok:r.ok,status:r.status,payload:payload};
      });
    })
    .then(function(res){
      if(res.ok){
        lf.reset();
        msg.className='form-msg ok';
        msg.textContent='Thank you. Your message reached us — we will reply personally within two business days. No automated sequences.';
        /* Reveal the scheduling option only now, once the enquiry is confirmed. */
        var bk=document.getElementById('bookingCta');
        if(bk) bk.classList.add('show');
      } else {
        msg.className='form-msg err';
        msg.textContent=describeFailure(res.status,res.payload);
      }
    })
    .catch(function(err){
      /* Only genuine network/CORS failures land here. */
      console.error('[Formspree] Network or CORS failure:',err);
      msg.className='form-msg err';
      msg.textContent='We could not reach the server. Please check your connection, or write directly to '+FALLBACK_EMAIL+'.';
    })
    .finally(function(){
      btn.disabled=false;
      btn.textContent=original;
    });
  });
}