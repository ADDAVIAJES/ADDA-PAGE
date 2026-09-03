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


/* ============================================================================
   SISTEMA DE MODAL DE DESTINOS  —  "Where This Happens"
   ============================================================================

   COMO FUNCIONA
   -------------
   Un unico modal en index.html (id="destModal") que se rellena con datos
   distintos segun el destino en el que se hizo clic.

   Cada elemento de la lista lleva  data-destination="clave"  y esa clave
   busca su entrada dentro del objeto DESTINATIONS de abajo.

   PARA EDITAR UN DESTINO
   ----------------------
   Todo esta en este objeto. No hay que tocar el HTML ni el CSS.
   - cambiar una foto        -> edita el array  images
   - agregar una 4a foto     -> agrega otra URL al array  images
   - cambiar un texto        -> edita  description  o  experience
   - cambiar una temperatura -> edita  facts.temperature
   - agregar una actividad   -> agrega una linea al array  activities

   Los arrays admiten cualquier cantidad de elementos: la galeria coloca la
   primera imagen como principal y el resto en columna. Si  images  esta
   vacio, la galeria simplemente no se dibuja.

   SOBRE LOS DATOS
   ---------------
   Las cifras son aproximadas a proposito. Altitud y temperatura varian
   segun el punto exacto y la epoca del anio, por eso el texto usa
   "approximately" y rangos en lugar de valores exactos.
   Las fuentes estan listadas al final de este bloque.

   SOBRE LAS FOTOGRAFIAS
   ---------------------
   Las URLs apuntan a servidores externos (getyourguide, tripadvisor).
   Esto es una PRUEBA TECNICA. No se ha verificado ninguna licencia de uso.
   Antes de publicar hay que resolver los derechos de cada imagen.
   ========================================================================= */

var DESTINATIONS = {

  /* ---------------------------------------------------------------- 01 --- */
  "cocora": {
    title: "Valle del Cocora",
    location: "Eje Cafetero · Quindío",
    images: [
      "https://cdn.getyourguide.com/image/format=auto%2Cfit=crop%2Cgravity=auto%2Cquality=60%2Cheight=540%2Cdpr=2/tour_img/f5845d47481683b3887c5aa594523a1930e53cc1cb97f923ca1702be27248bc5.jpg",
      "https://cdn.getyourguide.com/image/format=auto%2Cfit=crop%2Cgravity=auto%2Cquality=60%2Cheight=540%2Cdpr=2/tour_img/65a9aa29c4ea81428bcf6c9b9e96c2e79ed24802751623bc693c40ecee154b9b.jpeg",
      "https://cdn.getyourguide.com/image/format=auto%2Cfit=crop%2Cgravity=auto%2Cquality=60%2Cheight=540%2Cdpr=2/tour_img/baa928a819f5cd79e9cecfd7e5d5f4c331d6744219b7091c93da1784788510bd.jpeg"
    ],
    description: "A high Andean valley northeast of Salento, in the buffer zone of Los Nevados National Natural Park. What makes it singular is the Quindío wax palm, Colombia's national tree, which grows to remarkable heights and rises alone above open pasture and cloud forest — a silhouette that exists nowhere else. Mist gathers and lifts through the morning, so the valley rarely looks the same twice in one day. The palm is a protected species and its stands here are fewer than they once were, which is part of why the walk is guided rather than free-roaming.",
    experience: "We walk the lower valley at a pace set by the group, not by a schedule — the ground is uneven in places but the route stays gentle, with time to stop, look up, and let the mist move. Lunch is trout at Donde Laurita, a family restaurant inside the valley that locals have used for decades. Not a viewpoint stop. A table, a long meal, and conversation.",
    facts: {
      location: "Northeast of Salento, Quindío",
      department: "Quindío",
      altitude: "Approximately 1,800–2,400 m; palm stands reach close to 2,700 m",
      temperature: "Generally 12–18 °C, cooler in mist and at altitude",
      climate: "Andean cloud forest — humid, changeable, frequent afternoon fog",
      drySeason: "December–February and July–August",
      rainySeason: "April–May and October–November"
    },
    highlights: [
      "Quindío wax palms, the world's tallest palm species",
      "Cloud forest and the upper Quindío river basin",
      "Buffer zone of Los Nevados National Natural Park",
      "Hummingbirds and high-altitude Andean birdlife",
      "Trout lunch at Donde Laurita, inside the valley"
    ],
    activities: [
      "Guided walk through the lower valley at an unhurried pace",
      "Wax palm observation and conservation talk",
      "Birdwatching stops with time to actually wait and look",
      "Long lunch at a family-run restaurant",
      "Willys jeep transfer from Salento — a local tradition in itself"
    ]
  },

  /* ---------------------------------------------------------------- 02 --- */
  "finca-ocaso": {
    title: "Finca El Ocaso",
    location: "Salento · Quindío",
    /* TODO: Add 3 Finca El Ocaso images.
       Adda has not provided these URLs yet. Do NOT invent them and do NOT
       reuse photographs from another destination. When the three URLs are
       ready, paste them here as strings, one per line, and the gallery will
       appear automatically. No other change is required. */
    images: [],
    description: "A working coffee farm near Salento with roughly a century of continuous cultivation behind it. It sits within the Coffee Cultural Landscape of Colombia, inscribed by UNESCO in 2011 — a designation that recognises not scenery but a way of farming and living that shaped this whole region. The interest here is the full cycle rather than a tasting at the end of it: how the fruit ripens unevenly and must be picked by hand over weeks, how it is depulped, fermented, dried and sorted, and how each of those steps changes what eventually reaches a cup.",
    experience: "The farm is walked with someone whose family has grown coffee for generations, which changes the register of the visit — you are being shown a livelihood, not a demonstration. Expect to pick, to handle wet parchment, to taste the difference between grades side by side. Slopes are moderate and the route can be shortened. It ends the way it should: sitting down with a cup made from what you just watched being processed.",
    facts: {
      location: "Near Salento, Quindío",
      department: "Quindío",
      altitude: "Approximately 1,700–1,900 m",
      temperature: "Generally around 18–20 °C",
      climate: "Temperate Andean, humid year-round",
      drySeason: "December–February and July–August",
      rainySeason: "April–May and October–November"
    },
    highlights: [
      "A working farm with roughly a century of cultivation",
      "Within the UNESCO Coffee Cultural Landscape of Colombia",
      "The full process, from picking through to the cup",
      "Growers explaining their own work in their own words",
      "Views across the coffee slopes of the Quindío valley"
    ],
    activities: [
      "Hand-picking with a basket, at whatever pace suits",
      "Following depulping, fermentation and drying step by step",
      "Roasting and preparation",
      "Comparative tasting of different grades",
      "Conversation with the growing family"
    ]
  },

  /* ---------------------------------------------------------------- 03 --- */
  "salento": {
    title: "Salento",
   location: "Quindío · Coffee Cultural Landscape",
    images: [
      "https://cdn.getyourguide.com/image/format=auto%2Cfit=crop%2Cgravity=auto%2Cquality=60%2Cheight=540%2Cdpr=2/tour_img/57e88ab48d2c26b67907bea8a163b99d1790c9367069b390bc9c41e2ee9beabc.jpg",
      "https://cdn.getyourguide.com/image/format=auto%2Cfit=crop%2Cgravity=auto%2Cquality=60%2Cheight=540%2Cdpr=2/tour_img/96bc9e2012e5d280ba96c7785a18c9968bb9ab892abd0ca7b88367e5eac45f19.png",
      "https://cdn.getyourguide.com/image/format=auto%2Cfit=crop%2Cgravity=auto%2Cquality=60%2Cheight=540%2Cdpr=2/tour_img/8e4775f85f90641b565e07073d1942f028aa65bf2bb4489388d7b6d08301bda9.jpg"
    ],
    description: "Founded in 1842, Salento is the oldest municipality in Quindío and one of the best-preserved expressions of Antioquian settlement architecture — bahareque construction, deep balconies, and facades painted in colours chosen house by house rather than by any committee. It forms part of the Coffee Cultural Landscape of Colombia, a UNESCO World Heritage site since 2011. The town is small enough to cross on foot in twenty minutes, which is precisely its advantage: there is no itinerary to keep up with, and the interesting things happen in doorways and workshops rather than at monuments.",
    experience: "We walk slowly, which in Salento is the only sensible speed. Time in artisan workshops where people are actually working. Time on Calle Real without being marched down it. Lunch where residents eat rather than where the buses stop, and an afternoon with enough slack in it to sit in the main square and simply watch the town go about its day.",
    facts: {
      location: "Northeast Quindío, Central Cordillera",
      department: "Quindío",
      altitude: "Approximately 1,895 m in the town itself",
      temperature: "Generally around 16–19 °C, with warm afternoons",
      climate: "Temperate Andean, humid, cool evenings",
      drySeason: "December–February and July–August",
      rainySeason: "April–May and October–November"
    },
      highlights: [
        "Traditional bahareque architecture and painted facades",
        "Part of the UNESCO Coffee Cultural Landscape of Colombia",
        "Visit to traditional coffee farms such as Finca El Ocaso",
        "Connection with local coffee-growing families and rural traditions",
        "Calle Real and its artisan workshops",
        "Regional cooking, particularly river trout",
        "Willys jeeps, still working vehicles rather than props"
    ],
    activities: [
      "Unhurried walk through the historic centre",
      "Visits to craft workshops with the makers present",
      "Regional lunch where locals eat",
      "Viewpoints over the Cocora and Boquía valleys",
      "Free time in the main square, deliberately unscheduled",
      "Experience the coffee process at Finca El Ocaso",
      "Meet local producers and learn about coffee traditions"
    ]
  },

  /* ---------------------------------------------------------------- 04 --- */
  "jardin-botanico": {
    title: "Jardín Botánico del Quindío",
    location: "Calarcá · Quindío",
    images: [
      "https://dynamic-media-cdn.tripadvisor.com/media/photo-o/09/61/db/4f/jardin-botanico-del-quindio.jpg?w=2000&h=-1&s=1",
      "https://dynamic-media-cdn.tripadvisor.com/media/photo-o/30/2a/c6/e6/caption.jpg?w=1100&h=-1&s=1",
      "https://dynamic-media-cdn.tripadvisor.com/media/photo-o/2c/1e/57/a2/caption.jpg?w=1400&h=-1&s=1"
    ],
    description: "Founded in 1979 and open to the public since 2000, this is a conservation and environmental education centre rather than an ornamental park. It occupies roughly fifteen hectares of preserved sub-Andean forest just outside Calarcá, and holds what is regarded as Colombia's most significant living palm collection, alongside heliconias, ferns, orchids and bromeliads. Its butterfly house — a large structure built in the shape of a butterfly — is among the best known in the country. Bird activity through the reserve is substantial, with well over a hundred species recorded on the grounds.",
    experience: "This is the gentlest day in the Coffee Region and often the most quietly absorbing. Paths are well built and shaded, and a naturalist guide explains relationships rather than reciting names — which plant depends on which insect, why a particular bird only feeds at a particular height. There is a canopy tower and a suspension bridge for those who want them, and a perfectly good route for those who do not.",
    facts: {
      location: "Just outside Calarcá, on the road toward Valle del Cauca",
      department: "Quindío",
      altitude: "Approximately 1,490–1,500 m",
      temperature: "Generally around 20 °C, cooler beneath the forest canopy",
      climate: "Sub-Andean forest, humid and shaded",
      drySeason: "December–February and July–August",
      rainySeason: "April–May and October–November"
    },
    highlights: [
      "Colombia's most important living palm collection",
      "A large butterfly house with dozens of native species",
      "Roughly fifteen hectares of preserved sub-Andean forest",
      "Observation tower and suspension bridge over the canopy",
      "Well over a hundred bird species recorded on site"
    ],
    activities: [
      "Guided ecological trail with a naturalist",
      "Butterfly house and insect exhibits",
      "Birdwatching, including hummingbird activity",
      "Botanical collections: ferns, heliconias, orchids, carnivorous plants",
      "Geology and ethnobotany exhibition rooms"
    ]
  },

  /* ---------------------------------------------------------------- 05 --- */
  "cartagena": {
    title: "Cartagena de Indias",
    location: "Bolívar · Caribbean Coast",
    images: [
      "https://cdn.getyourguide.com/image/format=auto%2Cfit=crop%2Cgravity=auto%2Cquality=60%2Cheight=540%2Cdpr=2/tour_img/c69c485b93f69d518c2688f16eb6f4855c2934e79bcfa7ea23a7d6c9c1986ca9.jpg",
      "https://dynamic-media-cdn.tripadvisor.com/media/photo-o/0a/8d/4a/60/castillo-de-san-felipe.jpg?w=1600&h=-1&s=1",
      "images/caribbean/cartagena-bonavida-sunset.jpg",
      "https://dynamic-media-cdn.tripadvisor.com/media/photo-o/13/e9/02/40/foto-tomada-desde-un.jpg?w=1400&h=-1&s=1"
    ],
    description: "Founded in 1533, Cartagena was for centuries the fortified Caribbean port through which Spain moved silver — and, for far longer than is comfortable to state plainly, enslaved Africans. Its port, fortresses and monuments were inscribed on the UNESCO World Heritage list in 1984. The walled city is the postcard, but Getsemaní, just outside the walls, is where the more honest conversation happens: a historically working-class, Afro-Caribbean neighbourhood now negotiating what heritage tourism does to the people who actually live in it.",
    experience: "Mornings, before the heat and the cruise groups. We walk the walls and the Castillo de San Felipe with the history told properly, including the parts that are not decorative. Then Getsemaní — with residents, artists and community leaders, not past them. Afternoons stay open for shade, coffee, and the long lunch that the Caribbean climate frankly insists on.",
    facts: {
      location: "Caribbean coast, northern Colombia",
      department: "Bolívar",
      altitude: "At sea level",
      temperature: "Generally 27–29 °C year-round, humid",
      climate: "Tropical savanna — hot, with strong sea breezes",
      drySeason: "December–April, driest around January–March",
      rainySeason: "May–November, heaviest around October"
    },
    highlights: [
      "UNESCO World Heritage since 1984",
      "The walled city and the Castillo de San Felipe de Barajas",
      "Getsemaní, and the living culture inside it",
      "Afro-Caribbean history told without decoration",
      "Caribbean cooking and street food traditions"
    ],
    activities: [
      "Morning walk through the walled city and the ramparts",
      "Getsemaní with community guides and local artists",
      "Conversation on heritage tourism and who it serves",
      "Caribbean gastronomy, sitting down and taking time",
      "Sunset sailing experience aboard Bona Vida Catamaran",
      "Sunset from the walls"
    ]
  },

  /* ---------------------------------------------------------------- 06 --- */
  "magdalena": {
    title: "Río Magdalena and the Sombrero Vueltiao",
    location: "Barranquilla · Atlántico",
    images: [
      "https://cdn.getyourguide.com/image/format=auto%2Cfit=crop%2Cgravity=auto%2Cquality=60%2Cheight=540%2Cdpr=2/tour_img/61cd3144676b56122589ef1c89f8beabe9dd7f446f7bd4b3dbb68e6979125dd9.jpg",
      "https://cdn.getyourguide.com/image/format=auto%2Cfit=crop%2Cgravity=auto%2Cquality=60%2Cheight=540%2Cdpr=2/tour_img/62cfef658227116d5ddbe955a94f7d94d53dff6350df6cfca1ac1d7b0c62069a.jpg",
      "https://cdn.getyourguide.com/image/format=auto%2Cfit=crop%2Cgravity=auto%2Cquality=60%2Cheight=540%2Cdpr=2/tour_img/dd10c0641533b5ebaef54c32ecd66558e52a745352d5db758d0542831d20dfbf.jpg"
    ],
    description: "The Magdalena is Colombia's principal river and, for most of the country's history, its main road — the artery along which people, goods, music and language moved between the Andes and the Caribbean. It reaches the sea near Barranquilla, and at dusk the width of it becomes genuinely difficult to take in. Paired with this is the sombrero vueltiao: a hat woven from caña flecha by Zenú artisans, recognised as a national cultural symbol, in which the quality of the weave and the meaning of its patterns are inseparable from the identity they encode.",
    experience: "Late afternoon on the river, when the heat softens and the light does what it does. Earlier in the day, time with artisans who weave — watching the caña flecha fibre split, dyed and worked, and understanding why a hat can take weeks and why the count of its bands matters. You will be shown patterns and told what they mean by the people who know.",
    facts: {
      location: "Mouth of the Magdalena River, near Barranquilla",
      department: "Atlántico",
      altitude: "Near sea level",
      temperature: "Generally 27–29 °C, with maxima above 31 °C",
      climate: "Tropical savanna — hot and humid, coastal breeze",
      drySeason: "December–April",
      rainySeason: "May–November, heaviest around September–October"
    },
    highlights: [
      "Colombia's principal river, at the point it meets the Caribbean",
      "Sunset over the Magdalena estuary",
      "Caña flecha weaving and the sombrero vueltiao",
      "Zenú craft traditions and their symbolism",
      "The river's role in Colombian music and literature"
    ],
    activities: [
      "Sunset on the Río Magdalena",
      "Visit to artisans working caña flecha",
      "Demonstration of weaving and pattern meaning",
      "Conversation about the river as a cultural route",
      "Regional Caribbean cooking"
    ]
  },

  /* ---------------------------------------------------------------- 07 --- */
  "comuna13": {
    title: "Comuna 13 — San Javier",
    location: "Medellín · Antioquia",
    images: [
      "https://cdn.getyourguide.com/image/format=auto%2Cfit=crop%2Cgravity=auto%2Cquality=60%2Cheight=540%2Cdpr=2/tour_img/8c2035d5594e4634e9dd836aeec712d58c8808dcf5efd7f9ea9e83415dc4b5f7.png",
      "https://cdn.getyourguide.com/image/format=auto%2Cfit=crop%2Cgravity=auto%2Cquality=60%2Cheight=540%2Cdpr=2/tour_img/3cb80ccca28e2662bc57c79599cedc1a0274fa6db3fad0f3983dbfd6fba20ddb.png",
      "https://cdn.getyourguide.com/image/format=auto%2Cfit=crop%2Cgravity=auto%2Cquality=60%2Cheight=540%2Cdpr=2/tour_img/df0c6dc847c385ec16bfa9f7d6ac2b7aba40f31c4a1ee87c93d937604fcbf2ed.jpeg"
    ],
    description: "Comuna 13 is a hillside district in western Medellín of around 160,000 people. Through the 1990s and early 2000s it carried the consequences of armed conflict, displacement and contested state operations, and those events remain within living memory for the people who live here. What followed was not a rebranding but a long, uneven process led substantially from inside the neighbourhood: public transport reaching the hillside, cultural and social investment, and a generation using murals, hip hop and organised memory work to insist on telling its own version of events.",
    experience: "We go with a guide who is from here, which is the only arrangement that makes sense. The murals are read rather than photographed — most of them are statements about specific events and specific people. There is time for conversation with residents, and time to sit down. The intention is not to observe a transformation from outside, but to hear what it cost and who carried it. Slopes are steep; escalators and lifts cover much of the climb.",
    facts: {
      location: "Western Medellín, Aburrá Valley",
      department: "Antioquia",
      altitude: "City average approximately 1,495 m; the district sits higher on the slope",
      temperature: "Generally 17–28 °C, averaging around 22–24 °C",
      climate: "Temperate Andean — the 'eternal spring' of the Aburrá Valley",
      drySeason: "December–February and July–August",
      rainySeason: "April–May and September–November"
    },
    highlights: [
      "Community-led urban regeneration on a steep hillside",
      "Murals as memory work, not decoration",
      "Outdoor escalators and public transport as social policy",
      "Hip hop, dance and youth cultural organisations",
      "Views across the Aburrá Valley"
    ],
    activities: [
      "Walk guided by a resident of the neighbourhood",
      "Reading the murals and what each one records",
      "Conversation with community organisations",
      "Live music or dance where it is happening genuinely",
      "Local food, sitting down with time"
    ]
  },

  /* ---------------------------------------------------------------- 08 --- */
  "santa-elena": {
    title: "Santa Elena",
    location: "Antioquia · Near Medellín",
    images: [
      "https://dynamic-media-cdn.tripadvisor.com/media/photo-o/09/75/5f/94/photo0jpg.jpg?w=1000&h=-1&s=1",
      "https://dynamic-media-cdn.tripadvisor.com/media/photo-o/0a/13/e4/19/hotel-y-parque-ecologico.jpg?w=2000&h=-1&s=1",
      "https://dynamic-media-cdn.tripadvisor.com/media/photo-o/0e/c4/9a/63/santa-elena-slow.jpg?w=1400&h=-1&s=1"
    ],
    description: "A rural district of Medellín on the eastern plateau, roughly seventeen kilometres from the city but a full climate away from it — cooler, wetter, quieter. Its farming families have grown and carried flowers since the early twentieth century, and the silleta they carry, a wooden frame borne on the back, gives the tradition its name. The Desfile de Silleteros that closes Medellín's Feria de las Flores each August comes from here, and is recognised as part of Colombia's intangible cultural heritage. The families still farm; the parade is the visible end of ordinary year-round work.",
    experience: "We visit a working silletera farm and spend time with a family rather than at an exhibit. You will see flowers grown, cut and arranged, and if the timing allows, a silleta assembled — which is heavier and more structural than anyone expects. The air is cool and thin enough to notice. Afterwards, campesino cooking, a fire, and the kind of long conversation that only happens when nobody is watching the clock.",
    facts: {
      location: "Eastern rural district of Medellín, about 17 km from the centre",
      department: "Antioquia",
      altitude: "Approximately 2,500 m on average, ranging from about 1,850 to 2,700 m",
      temperature: "Generally around 14–16 °C, cold after dark",
      climate: "Humid tropical mountain — high rainfall, cool year-round",
      drySeason: "December–February and July–August",
      rainySeason: "April–May and September–November"
    },
    highlights: [
      "Silletera flower-farming families and their tradition",
      "Recognised as Colombian intangible cultural heritage",
      "High Andean landscape above the Aburrá Valley",
      "Close to the Arví forest reserve",
      "Cool mountain air and genuine rural quiet"
    ],
    activities: [
      "Visit to a working silletera farm",
      "Watching a silleta assembled, and learning what it weighs",
      "Conversation with the farming family",
      "Gentle walks through flower plots and montane forest",
      "Campesino cooking at the farm"
    ]
  },

  /* ---------------------------------------------------------------- 09 --- */
  "barranquilla": {
    title: "Barranquilla — Community Activity",
    location: "Atlántico · Caribbean Coast",
    images: [
      "https://cdn.getyourguide.com/image/format=auto%2Cfit=crop%2Cgravity=auto%2Cquality=60%2Cheight=540%2Cdpr=2/tour_img/0a0bc71b919e268947d9c3ec9a192c065922f557977f337727f5c5aaa48dfaa0.jpg",
      "https://cdn.getyourguide.com/image/format=auto%2Cfit=crop%2Cgravity=auto%2Cquality=60%2Cheight=540%2Cdpr=2/tour_img/aed83480e168376be92e6d0808d436d5a168c0b692d58d629dae0921fec03768.jpg",
      "https://cdn.getyourguide.com/image/format=auto%2Cfit=crop%2Cgravity=auto%2Cquality=60%2Cheight=540%2Cdpr=2/tour_img/e87dd11c7335983a3df32b8b8a0e3a30cda11b8ec1c524c3aa03b3c3f9fd6a78.jpg"
    ],
    description: "Barranquilla grew as a river port at the mouth of the Magdalena, and the mixture that arrived through it — Indigenous, African, European, and a substantial Arab community among others — is audible in how the city sounds and eats. Cumbia and porro were shaped in this region, and the Carnaval de Barranquilla is the largest expression of it. Outside carnival season the city is less visited and, for that reason, more itself: a working Caribbean port where the culture is something people practise rather than perform.",
    experience: "This is participation rather than observation, which is the whole point. Depending on the organisation hosting us, that means cooking, learning a rhythm, or working alongside artisans — with the group taking part rather than standing at the edge with a camera. Sessions are seated where they can be and paced for comfort in the heat. What people tend to remember is not the activity but the hours of conversation around it.",
    facts: {
      location: "Caribbean coast, at the mouth of the Magdalena",
      department: "Atlántico",
      altitude: "Near sea level",
      temperature: "Generally 27–29 °C, maxima 31–33 °C",
      climate: "Tropical savanna — hot and humid, with coastal breeze",
      drySeason: "December–April",
      rainySeason: "May–November, heaviest around September–October"
    },
    highlights: [
      "One of Colombia's most culturally mixed cities",
      "Cumbia, porro and Caribbean musical tradition",
      "Carnaval de Barranquilla, in February or early March",
      "Caribbean cooking with African and Arab influence",
      "Direct work with local community organisations"
    ],
    activities: [
      "Participatory activity with a local organisation",
      "Caribbean cooking, hands-on",
      "Music and percussion sessions",
      "Craft workshops with local makers",
      "Long conversation over a shared meal"
    ]
  }
};

/* ============================================================================
   FUENTES CONSULTADAS PARA LOS DATOS FACTUALES
   ----------------------------------------------------------------------------
   Gobernacion del Quindio (quindio.gov.co) — geografia de Salento
   Alcaldia de Medellin (medellin.gov.co) — Santa Elena: altitud, clima, area
   Corregimientos de Antioquia (corregimientos.antioquia.gov.co) — Santa Elena
   Jardin Botanico del Quindio (jardinbotanicoquindio.org) — ubicacion, colecciones
   Colombia.travel (Marca Pais) — estaciones climaticas por region
   IDEAM, via prensa nacional — temperatura media de Cartagena
   SciELO / Acta Biologica Colombiana — altitud de los palmares de Cocora
   UNESCO — Paisaje Cultural Cafetero (2011); Cartagena (1984)
   Wikipedia (ES/EN) — datos generales contrastados con las fuentes anteriores
   ----------------------------------------------------------------------------
   NOTA: altitud y temperatura varian segun el punto exacto y la epoca. Las
   fuentes no siempre coinciden (para Salento se encontraron valores entre
   12 y 25 grados). Por eso el texto usa rangos y "approximately" en lugar de
   cifras cerradas.
   ========================================================================= */


/* ============================================================================
   MOTOR DEL MODAL
   ----------------------------------------------------------------------------
   Un solo modal, rellenado con datos distintos. Abre con clic o teclado,
   cierra con la X, con clic en el fondo y con ESC.
   Declarado en ambito global, igual que el resto del archivo.
   ========================================================================= */

var destModal     = document.getElementById('destModal');
var destLastFocus = null;

/* Crea los <li> de una lista a partir de un array de textos */
function fillList(el, items){
  el.innerHTML = '';
  (items || []).forEach(function(text){
    var li = document.createElement('li');
    li.textContent = text;
    el.appendChild(li);
  });
}

/* Dibuja la galeria: la primera imagen es la principal, el resto van al lado.
   Si no hay imagenes, muestra un aviso discreto en lugar de un hueco. */
function fillGallery(el, images, title){
  el.innerHTML = '';
  if(!images || !images.length){
    el.className = 'modal-gallery is-empty';
    el.textContent = 'Photographs for this destination are coming soon.';
    return;
  }
  el.className = 'modal-gallery n-' + Math.min(images.length, 4);
 images.forEach(function(src){

  var img = document.createElement('img');

  img.src = src;
  img.alt = title;
  img.loading = 'lazy';

  img.addEventListener('click', function(){

    var lightbox = document.getElementById('imageLightbox');
    var lightboxImage = document.getElementById('lightboxImage');

    if(lightbox && lightboxImage){

      lightboxImage.src = src;
      lightboxImage.alt = title;

      lightbox.classList.add('open');
      lightbox.setAttribute('aria-hidden','false');

    }

  });

  el.appendChild(img);

});
}

/* Rellena la tabla de datos rapidos, omitiendo los campos vacios */
function fillFacts(el, facts){
  el.innerHTML = '';
  var labels = {
    location:    'Location',
    department:  'Department',
    municipality:'Municipality',
    altitude:    'Altitude',
    temperature: 'Average temperature',
    climate:     'Climate',
    drySeason:   'Dry season',
    rainySeason: 'Rainy season'
  };
  Object.keys(labels).forEach(function(key){
    if(!facts || !facts[key]) return;
    var dt = document.createElement('dt');
    dt.textContent = labels[key];
    var dd = document.createElement('dd');
    dd.textContent = facts[key];
    el.appendChild(dt);
    el.appendChild(dd);
  });
}

function openDestination(key, e){
  if(e) e.preventDefault();          /* impide cualquier navegacion */
  var data = DESTINATIONS[key];
  if(!destModal || !data) return;

  destLastFocus = document.activeElement;

  document.getElementById('destTitle').textContent = data.title;
  document.getElementById('destLoc').textContent   = data.location;
  document.getElementById('destDesc').textContent  = data.description;
  document.getElementById('destExp').textContent   = data.experience;

  fillGallery(document.getElementById('destGallery'), data.images, data.title);
  fillFacts(document.getElementById('destFacts'), data.facts);
  fillList(document.getElementById('destHighlights'), data.highlights);
  fillList(document.getElementById('destActivities'), data.activities);

  /* Oculta un bloque entero si ese destino no tiene ese dato */
  document.getElementById('destHighlightsBlock').style.display =
    (data.highlights && data.highlights.length) ? '' : 'none';
  document.getElementById('destActivitiesBlock').style.display =
    (data.activities && data.activities.length) ? '' : 'none';

  destModal.classList.add('open');
  destModal.setAttribute('aria-hidden','false');
  document.body.classList.add('modal-open');
  destModal.querySelector('.modal-box').scrollTop = 0;

  var x = destModal.querySelector('.modal-x');
  if(x) x.focus();
}

function closeDestination(){
  if(!destModal || !destModal.classList.contains('open')) return;
  destModal.classList.remove('open');
  destModal.setAttribute('aria-hidden','true');
  document.body.classList.remove('modal-open');
  if(destLastFocus && destLastFocus.focus) destLastFocus.focus();
}

/* Un unico enlazado para los 9 destinos */
document.querySelectorAll('[data-destination]').forEach(function(item){
  item.addEventListener('click', function(e){
    openDestination(item.getAttribute('data-destination'), e);
  });
  item.addEventListener('keydown', function(e){
    if(e.key==='Enter' || e.key===' ' || e.key==='Spacebar'){
      openDestination(item.getAttribute('data-destination'), e);
    }
  });
});

if(destModal){
  destModal.querySelectorAll('[data-close]').forEach(function(el){
    el.addEventListener('click', closeDestination);
  });
}

document.addEventListener('keydown', function(e){
  if(e.key==='Escape' || e.key==='Esc') closeDestination();
});
// Cerrar imagen ampliada
var imageLightbox = document.getElementById('imageLightbox');

if(imageLightbox){

  imageLightbox.querySelectorAll('[data-lightbox-close]')
  .forEach(function(el){

    el.addEventListener('click', function(){

      imageLightbox.classList.remove('open');
      imageLightbox.setAttribute('aria-hidden','true');

      var img = document.getElementById('lightboxImage');

      if(img){
        img.src = '';
      }

    });

  });

}