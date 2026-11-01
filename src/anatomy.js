/* Original SVG regional muscle atlas. Schematic, not a clinical or movement demonstration.
 * Anatomical location reference: OpenStax Anatomy & Physiology, chapter 11.
 * Deep groups are projected regions, not claims of superficial visibility.
 */
export const muscleRegions={
 'Peitoral':['pectorals'],'Tríceps':['triceps'],'Deltoide anterior':['deltoidFront'],'Deltoide posterior':['deltoidBack'],
 'Deltoides':['deltoidFront','deltoidBack'],'Ombros':['deltoidFront','deltoidBack'],
 'Estabilizadores do ombro':['deltoidBack','scapular'],'Estabilizadores escapulares':['scapular'],
 'Abdominais':['abs'],'Oblíquos':['obliques'],'Core':['abs','obliques'],
 'Extensores da coluna':['erectors'],'Estabilizadores da coluna':['erectors','abs'],
 'Glúteos':['glutes'],'Quadríceps':['quads'],'Isquiotibiais':['hamstrings'],
 'Gémeos':['calves'],'Sóleo':['soleus'],'Flexores da anca':['hipFlexors'],
 'Bíceps':['biceps'],'Antebraços':['forearms'],
 'Corpo inteiro':['pectorals','deltoidFront','triceps','abs','obliques','glutes','quads','hamstrings','calves'],
 'Mobilidade geral':[]
};
const regionNames={pectorals:'Peitoral',triceps:'Tríceps',deltoidFront:'Deltoide anterior',deltoidBack:'Deltoide posterior',scapular:'Região escapular',abs:'Abdominais',obliques:'Oblíquos',erectors:'Extensores da coluna',glutes:'Glúteos',quads:'Quadríceps',hamstrings:'Isquiotibiais',calves:'Gémeos',soleus:'Sóleo',hipFlexors:'Flexores da anca (projeção)',biceps:'Bíceps',forearms:'Antebraços'};
const htmlSafe=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
export function muscleActivation(exercise){
 const primary=new Set((exercise?.primary||[]).flatMap(m=>muscleRegions[m]||[]));
 const secondary=new Set((exercise?.secondary||[]).flatMap(m=>muscleRegions[m]||[]).filter(m=>!primary.has(m)));
 return {primary,secondary};
}
const palette={primary:'#f26872',secondary:'#f3a465',inactive:'#43515e'};
// A single consistent figure is shared across every exercise. Paths describe left-side regions.
const silhouette='M72 52 Q69 63 57 66 Q39 66 33 79 Q28 88 27 106 L20 145 L11 185 Q8 196 12 208 L17 216 Q20 218 22 214 L22 203 Q22 221 26 217 L30 198 L33 179 L42 146 L46 114 Q48 134 46 151 Q44 169 49 188 L48 214 Q43 236 48 266 L51 287 Q44 308 47 329 L48 354 L44 371 Q39 380 42 383 Q48 387 57 383 L64 376 L65 354 L67 328 L70 296 L73 268 L77 230 L80 217 L83 230 L87 268 L90 296 L93 328 L95 354 L96 376 L103 383 Q112 387 118 383 Q121 380 116 371 L112 354 L113 329 Q116 308 109 287 L112 266 Q117 236 112 214 L111 188 Q116 169 114 151 Q112 134 114 114 L118 146 L127 179 L130 198 L134 217 Q138 221 138 203 L138 214 Q140 218 143 216 L148 208 Q152 196 149 185 L140 145 L133 106 Q132 88 127 79 Q121 66 103 66 Q91 63 88 52Z';
const front=[
 ['deltoidFront','M44 73 Q32 78 32 96 L31 107 Q38 108 43 98 L49 81Z'],
 ['pectorals','M76 77 Q62 71 50 77 L44 96 Q56 110 76 101Z'],
 ['biceps','M34 107 Q28 119 27 135 Q30 141 35 137 Q43 123 42 109Z'],
 ['forearms','M26 144 Q21 161 17 184 L23 195 Q30 177 35 148Z'],
 ['abs','M68 110 L77 108 L77 122 L67 122Z M67 125 L77 125 L77 138 L67 138Z M67 141 L77 141 L77 153 L68 154Z M68 157 L77 156 L77 177 L71 173Z'],
 ['obliques','M48 108 L63 112 L63 146 L68 172 L54 157 Q48 144 49 130Z'],
 ['hipFlexors','M54 174 L69 181 L76 199 L72 211 L61 194Z',true],
 ['quads','M54 211 Q46 229 51 258 L54 278 Q62 282 66 270 L73 221 L69 207Z'],
];
const back=[
 ['scapular','M78 65 L58 71 L47 79 L61 96 L69 116 L78 122Z'],
 ['deltoidBack','M44 74 Q33 78 32 98 L33 108 L45 99 L51 84Z'],
 ['triceps','M33 109 Q28 121 28 136 L34 142 Q43 129 42 108Z'],
 ['forearms','M27 147 L18 184 L23 196 Q31 179 35 150Z'],
 ['erectors','M69 122 L77 127 L77 181 L68 177 Q65 151 69 122Z'],
 ['glutes','M52 185 Q62 181 77 187 L78 207 Q68 224 51 213 Q46 202 52 185Z'],
 ['hamstrings','M52 223 Q46 240 52 267 L55 285 L65 282 L71 236 L74 219 Q61 226 52 223Z'],
 ['calves','M54 294 Q45 305 50 328 Q54 340 59 337 Q67 325 66 296 L61 289Z'],
 ['soleus','M49 331 L49 350 L54 360 L59 351 L64 328 L59 340 L54 342Z'],
];
function figure(view,activation,offset){
 const region=(id,d,deep=false)=>{const state=activation.primary.has(id)?'primary':activation.secondary.has(id)?'secondary':'inactive';return `<path data-muscle="${id}" data-activation="${state}" d="${d}" fill="${palette[state]}" stroke="#1b2630" stroke-width="1.2" ${deep?'stroke-dasharray="2 1.5"':''}><title>${regionNames[id]}${state==='primary'?' · principal':state==='secondary'?' · secundário':''}</title></path>`};
 const parts=view==='front'?front:back;
 const shapes=parts.map(([id,d,deep])=>region(id,d,deep)).join('');
 const neutral=view==='front'?'<path d="M51 286 Q47 311 51 334 L55 347 L60 327 L64 290Z" fill="#384651" stroke="#24313c"/>':'<path d="M49 107 L63 117 L63 149 L67 176 L52 165Z" fill="#384651" stroke="#24313c"/>';
 const fibers=view==='front'?'<path d="M49 81 72 83 M47 86 72 89 M48 92 72 96 M55 218 57 267 M62 218 62 266 M57 119 61 130 M55 129 61 139 M54 139 62 150"/>':'<path d="m58 77 17 12 m-17-6 18 13 m-13 1 12 8 M55 196q10 8 18 0 M54 202q10 8 19 0 M55 230 58 275 M63 230 62 275 M54 300 57 330"/>';
 return `<g transform="translate(${offset} 12)"><ellipse cx="80" cy="386" rx="44" ry="4" fill="#070e14"/><path d="${silhouette}" fill="#293641" stroke="#63717c" stroke-width="1.1"/><ellipse cx="80" cy="30" rx="17" ry="22" fill="#35434e" stroke="#65747f" stroke-width="1.1"/><path d="M73 51v8M87 51v8" stroke="#697982" fill="none"/>${neutral}<g>${shapes}</g><g transform="translate(160 0) scale(-1 1)">${neutral}${shapes}</g><g fill="none" stroke="#f2f6f8" stroke-opacity=".14" stroke-width=".7">${fibers}<g transform="translate(160 0) scale(-1 1)">${fibers}</g></g><path d="M80 72v108 M75 187l5 9 5-9 M53 282h11 M96 282h11" stroke="#8996a0" stroke-opacity=".35" fill="none"/><text x="80" y="413" text-anchor="middle" fill="#95a9b7" font-family="system-ui,sans-serif" font-size="9" letter-spacing="2">${view==='front'?'FRENTE':'COSTAS'}</text></g>`;
}
export function muscleMap(exercise,{compact=false}={}){
 const activation=muscleActivation(exercise),p=[...activation.primary].map(id=>regionNames[id]).join(', '),s=[...activation.secondary].map(id=>regionNames[id]).join(', ');
 const label=`Mapa muscular esquemático${exercise?.name?' de '+exercise.name:''}. ${p?'Vermelho: '+p+'. ':''}${s?'Laranja: '+s+'. ':''}${!p&&!s?'Mobilidade geral, sem destaque muscular específico. ':''}Cinzentos: restantes regiões representadas.`;
 return `<svg xmlns="http://www.w3.org/2000/svg" class="muscle-map${compact?' compact':''}" viewBox="0 0 344 434" role="img" aria-label="${htmlSafe(label)}">${figure('front',activation,5)}${figure('back',activation,179)}</svg>`;
}
