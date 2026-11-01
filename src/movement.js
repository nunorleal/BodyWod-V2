/* Original pose illustrations. Static references, not motion capture or validated technique.
 * Variants share only an explicitly labelled base position where a dedicated view is absent.
 */
const safePoseText=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
// Coordinates in a 320 × 210 reference frame. Limb points are shoulder/elbow/hand and hip/knee/ankle.
const pose=(head,shoulder,hip,elbow,hand,knee,ankle,extras={})=>({head,shoulder,hip,elbow,hand,knee,ankle,...extras});
export const movementPoses={
 plank:pose([61,81],[89,94],[184,126],[91,138],[93,182],[229,146],[273,164],{toe:[286,184],far:{elbow:[104,135],hand:[109,182],knee:[235,143],ankle:[278,160]},contacts:[[93,184],[109,184],[286,184]],alignment:[[64,84],[274,164]]}),
 pushLow:pose([64,131],[91,141],[185,158],[123,159],[93,182],[230,170],[274,181],{toe:[287,184],far:{elbow:[132,154],hand:[109,182]},contacts:[[93,184],[109,184],[287,184]],alignment:[[66,131],[274,181]]}),
 kneePlank:pose([64,88],[90,100],[173,134],[91,140],[93,182],[222,183],[264,165],{toe:[277,164],contacts:[[93,184],[222,184]],alignment:[[66,88],[222,183]]}),
 kneePushLow:pose([64,139],[92,149],[174,170],[124,163],[93,182],[222,183],[264,165],{toe:[277,164],contacts:[[93,184],[222,184]]}),
 wallHigh:pose([175,46],[159,69],[139,121],[192,77],[231,88],[128,154],[117,182],{toe:[135,184],wall:231,contacts:[[231,88],[117,184]],alignment:[[175,46],[117,182]]}),
 wallLow:pose([205,63],[186,86],[152,131],[206,109],[231,88],[134,158],[117,182],{toe:[135,184],wall:231,contacts:[[231,88],[117,184]]}),
 stand:pose([151,27],[151,58],[151,115],[134,86],[128,119],[141,150],[135,182],{toe:[152,184],far:{elbow:[170,86],hand:[177,119],knee:[168,150],ankle:[173,182],toe:[190,184]}}),
 tuckGround:pose([72,88],[99,106],[153,120],[95,144],[91,182],[188,153],[174,182],{toe:[193,184],contacts:[[91,184],[174,184]]}),
 squat:pose([120,65],[128,94],[112,141],[174,91],[215,91],[174,143],[153,182],{toe:[177,184],far:{knee:[157,143],ankle:[137,182],toe:[160,184],elbow:[172,97],hand:[211,97]},contacts:[[153,184],[137,184]]}),
 sumo:pose([160,50],[160,80],[160,130],[140,105],[148,125],[111,145],[96,183],{toe:[76,184],far:{knee:[209,145],ankle:[224,183],toe:[244,184],elbow:[180,105],hand:[172,125]}}),
 lungeHigh:pose([141,28],[141,60],[143,113],[127,85],[142,105],[182,143],[206,182],{toe:[226,184],far:{knee:[103,150],ankle:[72,182],toe:[60,184],elbow:[163,85],hand:[155,103]}}),
 lungeLow:pose([148,52],[148,85],[147,137],[132,108],[145,125],[201,135],[205,182],{toe:[227,184],far:{knee:[119,177],ankle:[72,182],toe:[59,184]},contacts:[[205,184],[72,184]]}),
 lateralLunge:pose([123,63],[133,91],[132,137],[155,102],[162,117],[102,149],[87,182],{toe:[68,184],far:{knee:[207,159],ankle:[254,182],toe:[273,184]}}),
 bridgeLow:pose([53,171],[79,175],[155,174],[105,181],[135,181],[210,119],[248,182],{toe:[270,184],contacts:[[57,184],[248,184]]}),
 bridge:pose([53,171],[79,168],[151,129],[209,113],[243,181],[209,113],[243,181],{elbow:[105,181],hand:[135,181],toe:[265,184],contacts:[[57,184],[243,184]],alignment:[[79,168],[209,113]]}),
 bridgeOne:pose([53,171],[79,168],[151,129],[105,181],[135,181],[210,115],[244,181],{toe:[266,184],far:{knee:[193,88],ankle:[236,54],toe:[250,54]}}),
 calfRaise:pose([151,19],[151,50],[151,106],[134,79],[128,112],[141,141],[135,172],{toe:[153,184],far:{elbow:[170,79],hand:[177,112],knee:[168,141],ankle:[173,172],toe:[190,184]},contacts:[[153,184],[190,184]]}),
 quadruped:pose([66,81],[94,94],[181,102],[97,137],[99,182],[189,180],[240,181],{toe:[254,181],contacts:[[99,184],[189,184]]}),
 birdDog:pose([66,81],[94,94],[181,102],[97,137],[99,182],[189,180],[240,181],{toe:[254,181],far:{elbow:[55,96],hand:[18,99],knee:[224,103],ankle:[274,105],toe:[289,105]},contacts:[[99,184],[189,184]],alignment:[[18,99],[289,105]]}),
 donkey:pose([66,81],[94,94],[181,102],[97,137],[99,182],[189,180],[240,181],{toe:[254,181],far:{knee:[231,103],ankle:[233,56],toe:[251,54]}}),
 bear:pose([67,82],[95,96],[180,106],[97,138],[99,182],[185,156],[232,179],{toe:[247,183],contacts:[[99,184],[247,184]]}),
 prone:pose([69,162],[96,173],[177,176],[64,177],[25,180],[221,179],[269,181],{toe:[285,182],contacts:[[96,184],[177,184]]}),
 superman:pose([69,138],[96,151],[177,172],[62,143],[25,132],[223,159],[269,145],{toe:[285,141],contacts:[[177,184]]}),
 proneW:pose([69,138],[96,151],[177,172],[70,175],[42,151],[223,172],[269,175],{toe:[285,176]}),
 hinge:pose([90,70],[111,90],[179,125],[136,116],[151,143],[180,151],[174,182],{toe:[197,184],far:{knee:[198,150],ankle:[197,182],toe:[219,184]}}),
 singleHinge:pose([72,80],[95,97],[170,117],[114,131],[126,159],[174,150],[174,182],{toe:[197,184],far:{knee:[218,119],ankle:[267,122],toe:[283,123]}}),
 forearmPlank:pose([61,108],[89,121],[184,146],[91,180],[134,180],[229,161],[273,175],{toe:[286,184],contacts:[[91,184],[134,184],[286,184]],alignment:[[64,108],[274,175]]}),
 sidePlank:pose([83,73],[104,94],[181,135],[104,140],[104,182],[227,158],[272,181],{toe:[290,184],far:{elbow:[102,60],hand:[100,23],knee:[227,151],ankle:[274,174]},contacts:[[104,184],[272,184]]}),
 pike:pose([72,120],[96,113],[171,49],[97,149],[98,182],[222,105],[264,173],{toe:[279,184],contacts:[[98,184],[279,184]]}),
 pikeLow:pose([78,157],[105,145],[171,75],[127,165],[98,182],[222,118],[264,173],{toe:[279,184],contacts:[[98,184],[279,184]]}),
 shoulderTap:pose([61,81],[89,94],[184,126],[91,138],[93,182],[229,146],[273,164],{toe:[286,184],far:{elbow:[118,123],hand:[90,97]},contacts:[[93,184],[286,184]]}),
 armRaise:pose([151,27],[151,58],[151,115],[104,59],[62,59],[141,150],[135,182],{toe:[152,184],far:{elbow:[197,59],hand:[240,59],knee:[168,150],ankle:[173,182],toe:[190,184]}}),
 armsUp:pose([151,30],[151,62],[151,117],[124,29],[111,8],[141,152],[135,182],{toe:[152,184],far:{elbow:[179,29],hand:[192,8],knee:[168,152],ankle:[173,182],toe:[190,184]}}),
 curl:pose([151,27],[151,58],[151,115],[132,96],[168,81],[141,150],[135,182],{toe:[152,184],far:{elbow:[185,105],hand:[168,81],knee:[168,150],ankle:[173,182],toe:[190,184]}}),
 palms:pose([151,27],[151,58],[151,115],[116,85],[151,78],[141,150],[135,182],{toe:[152,184],far:{elbow:[186,85],hand:[151,78],knee:[168,150],ankle:[173,182],toe:[190,184]}}),
 supine:pose([54,166],[81,176],[162,177],[109,180],[139,181],[211,134],[248,181],{toe:[270,183]}),
 crunch:pose([65,128],[90,146],[162,177],[119,144],[145,129],[211,134],[248,181],{toe:[270,183],contacts:[[162,184],[248,184]]}),
 legRaise:pose([54,166],[81,176],[162,177],[109,180],[139,181],[174,119],[184,57],{toe:[202,56],far:{knee:[184,123],ankle:[197,65],toe:[215,64]}}),
 deadBug:pose([54,166],[81,176],[162,177],[89,127],[97,76],[165,117],[218,117],{toe:[232,116],far:{elbow:[47,164],hand:[12,146],knee:[209,173],ankle:[261,177],toe:[279,179]}}),
 hollow:pose([64,139],[91,159],[162,177],[60,136],[29,112],[216,151],[266,126],{toe:[282,122]}),
 kneesTucked:pose([76,119],[100,144],[162,177],[129,138],[161,126],[188,117],[232,140],{toe:[248,146]}),
 supportedFlutterA:pose([69,112],[93,137],[155,177],[83,179],[118,181],[208,161],[259,145],{toe:[275,141],far:{knee:[203,132],ankle:[249,91],toe:[266,85]},contacts:[[83,184],[155,184]]}),
 supportedFlutterB:pose([69,112],[93,137],[155,177],[83,179],[118,181],[203,132],[249,91],{toe:[266,85],far:{knee:[208,161],ankle:[259,145],toe:[275,141]},contacts:[[83,184],[155,184]]}),
 supportedExtended:pose([69,112],[93,137],[155,177],[83,179],[118,181],[208,152],[259,129],{toe:[275,124],contacts:[[83,184],[155,184]]}),
 supportedTuck:pose([69,112],[93,137],[155,177],[83,179],[118,181],[182,115],[229,139],{toe:[245,144],contacts:[[83,184],[155,184]]}),
 handSupportedExtended:pose([83,99],[107,125],[160,177],[94,158],[82,182],[210,153],[260,129],{toe:[276,124],contacts:[[82,184],[160,184]]}),
 handSupportedTuck:pose([83,99],[107,125],[160,177],[94,158],[82,182],[184,115],[231,139],{toe:[247,144],contacts:[[82,184],[160,184]]}),
 twistFeetUpA:pose([99,76],[117,103],[157,174],[146,121],[174,123],[207,148],[250,133],{toe:[267,129],far:{elbow:[133,135],hand:[174,123]},contacts:[[157,184]]}),
 twistFeetUpB:pose([107,76],[125,103],[157,174],[101,125],[85,132],[207,148],[250,133],{toe:[267,129],far:{elbow:[128,137],hand:[85,132]},contacts:[[157,184]]}),
 bicycleA:pose([74,122],[100,146],[162,177],[94,111],[74,111],[185,117],[230,140],{toe:[246,145],far:{knee:[220,163],ankle:[272,146],toe:[288,142]}}),
 bicycleB:pose([78,124],[104,148],[162,177],[102,113],[78,112],[220,163],[272,146],{toe:[288,142],far:{knee:[185,117],ankle:[230,140],toe:[246,145]}}),
 reverseCrunch:pose([54,166],[81,176],[162,164],[109,180],[139,181],[182,116],[231,138],{toe:[247,145]}),
 seatedBent:pose([112,49],[127,78],[158,174],[153,106],[180,126],[211,134],[250,181],{toe:[271,183]}),
 seated:pose([101,58],[116,86],[157,174],[142,116],[169,136],[206,168],[257,178],{toe:[276,181]}),
 seatedTwist:pose([99,76],[117,103],[157,174],[146,121],[165,122],[206,155],[251,179],{toe:[270,183],far:{elbow:[133,135],hand:[165,122]}}),
 mountain:pose([61,81],[89,94],[184,126],[91,138],[93,182],[229,146],[273,164],{toe:[286,184],far:{knee:[131,151],ankle:[180,172],toe:[197,176]}}),
 stepHigh:pose([151,27],[151,58],[151,115],[128,83],[148,101],[141,150],[135,182],{toe:[152,184],far:{elbow:[174,81],hand:[168,55],knee:[211,116],ankle:[210,163],toe:[228,165]}}),
 heelKick:pose([151,27],[151,58],[151,115],[128,83],[148,101],[141,150],[135,182],{toe:[152,184],far:{elbow:[174,81],hand:[168,55],knee:[177,151],ankle:[198,111],toe:[214,111]}}),
 jack:pose([160,35],[160,66],[160,120],[122,38],[102,10],[123,149],[91,182],{toe:[71,184],far:{elbow:[198,38],hand:[218,10],knee:[197,149],ankle:[229,182],toe:[249,184]}}),
 punch:pose([151,27],[151,58],[151,115],[129,88],[153,75],[141,150],[135,182],{toe:[152,184],far:{elbow:[196,66],hand:[239,66],knee:[168,150],ankle:[173,182],toe:[190,184]}}),
 crab:pose([76,91],[98,115],[175,126],[99,149],[101,182],[221,135],[248,182],{toe:[270,184],contacts:[[101,184],[248,184]]}),
 reversePlank:pose([61,106],[89,121],[184,146],[91,150],[93,182],[229,161],[273,175],{toe:[286,181],contacts:[[93,184],[286,184]]}),
 sideLying:pose([51,153],[78,166],[150,172],[78,183],[116,183],[207,177],[266,181],{toe:[283,182]}),
 sideLeg:pose([51,153],[78,166],[150,172],[78,183],[116,183],[207,177],[266,181],{toe:[283,182],far:{knee:[196,129],ankle:[248,88],toe:[264,81]}}),
 child:pose([96,155],[125,157],[216,126],[85,174],[44,183],[200,180],[256,181],{toe:[271,181]}),
 cat:pose([66,105],[94,112],[181,113],[97,147],[99,182],[189,180],[240,181],{toe:[254,181],curve:[135,65]}),
 calfStretch:pose([170,42],[160,71],[144,119],[198,83],[231,88],[129,151],[108,182],{toe:[127,184],wall:231,far:{knee:[195,144],ankle:[209,182],toe:[230,184]}}),
 kneelLunge:pose([148,52],[148,85],[147,137],[132,108],[145,125],[201,135],[205,182],{toe:[227,184],far:{knee:[119,181],ankle:[72,182],toe:[59,184]}}),
 seatedFold:pose([126,110],[146,130],[162,177],[185,147],[220,166],[212,177],[266,181],{toe:[281,168]}),
 crossShoulder:pose([151,27],[151,58],[151,115],[174,79],[205,61],[141,150],[135,182],{toe:[152,184],far:{elbow:[185,97],hand:[169,76],knee:[168,150],ankle:[173,182],toe:[190,184]}}),
};
// Each match describes a supported movement family, with the reference pose explicitly named.
const sequences=[
 {test:/^Tesouras verticais com apoio nos antebraços$/,base:'Tesouras apoiadas',poses:['supportedFlutterA','supportedFlutterB'],labels:['Antebraços apoiados, tronco inclinado e pernas suspensas','Alterna a posição das pernas sem oscilar a bacia'],exact:true},
 {test:/^Encolhimentos de joelhos sentado com apoio das mãos$/,base:'Encolhimento sentado apoiado',poses:['handSupportedExtended','handSupportedTuck'],labels:['Mãos atrás do tronco e pernas suspensas','Aproxima os joelhos e volta a estender'],exact:true},
 {test:/^Russian twists com pés elevados \(sem carga\)$/,base:'Russian twist com pés elevados',poses:['twistFeetUpA','twistFeetUpB'],labels:['Pés elevados, roda o tronco para um lado','Roda para o outro lado com controlo'],exact:true},
 {test:/^Elevações de joelhos com apoio nos antebraços$/,base:'Elevação de joelhos apoiada',poses:['supportedExtended','supportedTuck'],labels:['Antebraços apoiados e pernas suspensas','Flete e aproxima os joelhos do tronco'],exact:true},
 {test:/^Bicycle crunches$/,base:'Bicycle crunch',poses:['bicycleA','bicycleB'],labels:['Aproxima um ombro do joelho oposto','Alterna para o outro lado sem puxar o pescoço'],exact:true},

 {test:/^Flexões na parede$/,base:'Flexão na parede',poses:['wallHigh','wallLow'],labels:['Apoia as mãos na parede','Aproxima o peito da parede'],exact:true},
 {test:/^Flexões de joelhos$/,base:'Flexão de joelhos',poses:['kneePlank','kneePushLow'],labels:['Mãos e joelhos apoiados','Flete os cotovelos e baixa o peito'],exact:true},
 {test:/^Flexões (clássicas|abertas|diamante|com pausa|arqueiro|explosivas|com palmas|excêntricas|com subida lenta|com mãos desencontradas|com pés afastados|com mãos juntas|com libertação das mãos|com toque no ombro|com rotação em T|com um pé elevado|isométricas a meio)$/,base:'Flexão no chão',poses:['plank','pushLow'],labels:['Prancha com as mãos no chão','Baixa o corpo com controlo'],exactName:'Flexões clássicas'},
 {test:/^Pike/,base:'Pike',poses:['pike','pikeLow'],labels:['Bacia elevada, mãos e pés apoiados','Flete os cotovelos com controlo'],exactName:'Pike push-ups'},
 {test:/^Agachamentos sumo$/,base:'Agachamento sumo',poses:['stand','sumo'],labels:['Afasta os pés antes de começar','Baixa a bacia com joelhos alinhados'],exact:true},
 {test:/^(Agachamentos Cossack|Transferências laterais em posição Cossack|Lunges laterais)$/,base:'Passada lateral',poses:['armRaise','lateralLunge'],labels:['Pés afastados','Transfere o peso para um lado']},
 {test:/^Agachamentos(?:$| com| isométricos)|^Agachamento de mobilidade$/,base:'Agachamento',poses:['stand','squat'],labels:['Pés apoiados e tronco estável','Leva a bacia para trás e para baixo'],exactName:'Agachamentos'},
 {test:/^Lunges|^Passada com rotação torácica$/,base:'Lunge',poses:['lungeHigh','lungeLow'],labels:['Pés em posição de passada','Baixa a bacia e flete os joelhos'],exactName:'Lunges estáticos'},
 {test:/^Pontes de glúteos a uma perna$/,base:'Ponte a uma perna',poses:['bridgeLow','bridgeOne'],labels:['Prepara o apoio de um só pé','Eleva a bacia mantendo-a nivelada'],exact:true},
 {test:/^Pontes de glúteos|^Ativação dos glúteos$/,base:'Ponte de glúteos',poses:['bridgeLow','bridge'],labels:['De costas, joelhos fletidos e pés no chão','Eleva a bacia sem arquear a lombar'],exactName:'Pontes de glúteos'},
 {test:/^Elevações de gémeos$/,base:'Elevação de gémeos',poses:['stand','calfRaise'],labels:['Calcanhares apoiados','Sobe nas pontas dos pés'],exact:true},
 {test:/^Abdução da anca de lado$/,base:'Abdução da anca',poses:['sideLying','sideLeg'],labels:['Deita-te de lado','Eleva a perna superior'],exact:true},
 {test:/^Donkey kicks$/,base:'Donkey kick',poses:['quadruped','donkey'],labels:['Mãos e joelhos no chão','Eleva um pé com o joelho fletido'],exact:true},
 {test:/^Bird dog/,base:'Bird dog',poses:['quadruped','birdDog'],labels:['Quatro apoios, bacia estável','Estende braço e perna opostos'],exactName:'Bird dog'},
 {test:/^(Superman|Swimmers|Extensão do tronco deitado)/,base:'Extensão em decúbito ventral',poses:['prone','superman'],labels:['Deita-te de barriga para baixo','Eleva suavemente, sem forçar a lombar'],exactName:'Superman'},
 {test:/^Elevações em W$/,base:'Elevação em W',poses:['prone','proneW'],labels:['De barriga para baixo','Flete os cotovelos em W e eleva'],exact:true},
 {test:/^Bom dia sem carga$/,base:'Dobradiça da anca',poses:['stand','hinge'],labels:['Joelhos ligeiramente fletidos','Recua a bacia e inclina o tronco'],exact:true},
 {test:/^Dobradiça da anca a uma perna$/,base:'Dobradiça a uma perna',poses:['stand','singleHinge'],labels:['Equilibra-te numa perna','Recua a bacia e estende a outra perna'],exact:true},
 {test:/^Prancha invertida$/,base:'Prancha invertida',poses:['seated','reversePlank'],labels:['Mãos apoiadas atrás do tronco','Eleva e sustém a bacia'],exact:true},
 {test:/^Toques nos ombros de joelhos$|^Prancha com subida de joelhos$/,base:'Prancha de joelhos',poses:['kneePlank'],labels:['Mãos e joelhos apoiados; alterna o braço indicado']},
 {test:/^Toques nos ombros$/,base:'Toque no ombro',poses:['plank','shoulderTap'],labels:['Prancha com os pés estáveis','Toca no ombro oposto sem rodar a bacia'],exact:true},
 {test:/^Prancha alta isométrica$/,base:'Prancha alta',poses:['plank'],labels:['Mãos sob os ombros e corpo alinhado'],exact:true},
 {test:/^Prancha frontal$/,base:'Prancha frontal',poses:['forearmPlank'],labels:['Antebraços no chão e corpo alinhado'],exact:true},
 {test:/^Prancha lateral$/,base:'Prancha lateral',poses:['sidePlank'],labels:['Apoia o antebraço e mantém a bacia elevada'],exact:true},
 {test:/^Prancha com|^Flexões escapulares em prancha alta$/,base:'Prancha alta',poses:['plank'],labels:['Posição de base; executa a variante descrita abaixo']},
 {test:/^Círculos dos braços$|^Rotações dos braços$|^Braços em cruz isométricos$/,base:'Braços em cruz',poses:['armRaise'],labels:['Braços abertos à altura dos ombros'],exactName:'Braços em cruz isométricos'},
 {test:/^Pressão das palmas$/,base:'Pressão das palmas',poses:['palms'],labels:['Junta as palmas à frente do peito'],exact:true},
 {test:/^Curl de bíceps com autorresistência$/,base:'Curl com autorresistência',poses:['curl'],labels:['Uma mão oferece resistência à flexão do outro braço'],exact:true},
 {test:/^Crunches(?:$| com braços estendidos)|^Toques nos calcanhares$/,base:'Crunch',poses:['supine','crunch'],labels:['Deitado, joelhos fletidos e pés no chão','Eleva as omoplatas sem puxar o pescoço'],exactName:'Crunches'},
 {test:/^Elevações de pernas$/,base:'Elevação de pernas',poses:['supine','legRaise'],labels:['Prepara a lombar apoiada no chão','Eleva as pernas sem perder o controlo'],exact:true},
 {test:/^Elevações de joelhos deitado$|^Crunch inverso$/,base:'Aproximação dos joelhos',poses:['supine','reverseCrunch'],labels:['Deitado com o tronco apoiado','Aproxima os joelhos com controlo']},
 {test:/^Dead bug/,base:'Dead bug',poses:['supine','deadBug'],labels:['Deitado, prepara braços e pernas elevados','Estende braço e perna opostos'],exactName:'Dead bug'},
 {test:/^Hollow hold$|^Hollow rocks$/,base:'Hollow',poses:['hollow'],labels:['Lombar apoiada e braços e pernas elevados'],exactName:'Hollow hold'},
 {test:/^Russian twists sem carga$/,base:'Rotação sentada',poses:['seated','seatedTwist'],labels:['Senta-te com os pés apoiados','Roda o tronco de forma controlada'],exact:true},
 {test:/^Sit-ups$/,base:'Sit-up',poses:['supine','seatedBent'],labels:['De costas e joelhos fletidos','Eleva o tronco sem impulso'],exact:true},
 {test:/^Bear hold$|^Bear crawl/,base:'Apoio de urso',poses:['quadruped','bear'],labels:['Começa em quatro apoios','Eleva os joelhos poucos centímetros'],exactName:'Bear hold'},
 {test:/^Mountain climbers/,base:'Mountain climber',poses:['plank','mountain'],labels:['Prepara uma prancha alta','Aproxima alternadamente um joelho do peito'],exactName:'Mountain climbers lentos'},
 {test:/^Marcha com joelhos altos$|^High knees$|^Marcha rápida no lugar$|^Corrida no lugar$/,base:'Elevação alternada dos joelhos',poses:['stand','stepHigh'],labels:['Tronco alto e ombros descontraídos','Eleva um joelho e alterna'],exactName:'Marcha com joelhos altos'},
 {test:/^Calcanhares aos glúteos$|^Marcha com flexão do joelho$/,base:'Flexão alternada dos joelhos',poses:['stand','heelKick'],labels:['Mantém o tronco estável','Aproxima o calcanhar do glúteo'],exactName:'Marcha com flexão do joelho'},
 {test:/^Saltos militares adaptados \(sem salto\)$/,base:'Saltos militares sem salto',poses:['stand','jack'],labels:['Pés próximos e braços ao lado do corpo','Abre um pé de cada vez e eleva os braços, sem saltar'],exact:true},
 {test:/^Jumping jacks$|^Step jacks$|^Saltos militares de aquecimento$/,base:'Abertura de braços e pernas',poses:['stand','jack'],labels:['Começa com os pés próximos','Abre os braços e as pernas'],exactNames:['Jumping jacks','Saltos militares de aquecimento'],exactName:'Jumping jacks'},
 {test:/^Soco direto alternado$|^Boxe com deslocamento$/,base:'Soco direto',poses:['stand','punch'],labels:['Prepara a posição de guarda','Estende um braço sem bloquear o cotovelo'],exactName:'Soco direto alternado'},
 {test:/^Crab walk$/,base:'Apoio de caranguejo',poses:['seated','crab'],labels:['Mãos atrás do tronco e pés apoiados','Eleva a bacia antes dos pequenos passos'],exact:true},
 {test:/^Prancha dinâmica com elevação da bacia$/,base:'Elevação da bacia em prancha',poses:['plank','pike'],labels:['Mãos e pés fixos no chão','Eleva a bacia sem deslocar os apoios'],exact:true},
 {test:/^Inchworm com flexão$/,base:'Inchworm com flexão',poses:['hinge','pushLow'],labels:['Caminha com as mãos até à prancha','Faz a flexão e regressa com controlo'],exact:true},
 {test:/^Burpees|^Squat thrusts/,base:'Agachamento e prancha',poses:['tuckGround','plank'],labels:['Baixa e apoia as mãos no chão','Recua os pés para a prancha; regressa conforme a variante']},
 {test:/^Gato e camelo$/,base:'Mobilidade em quatro apoios',poses:['quadruped','cat'],labels:['Começa com a coluna confortável','Arredonda suavemente a coluna'],exact:true},
 {test:/^Alongamento dos gémeos$/,base:'Alongamento dos gémeos',poses:['calfStretch'],labels:['Mantém o calcanhar de trás no chão; alterna de lado'],exact:true},
 {test:/^Alongamento dos flexores da anca$/,base:'Alongamento da anca',poses:['kneelLunge'],labels:['Um joelho no chão; avança suavemente a bacia'],exact:true},
 {test:/^Alongamento posterior sentado$/,base:'Alongamento posterior',poses:['seatedFold'],labels:['Inclina-te pela anca sem forçar a coluna'],exact:true},
 {test:/^Postura da criança$/,base:'Postura da criança',poses:['child'],labels:['Recua a bacia e alonga os braços no chão'],exact:true},
 {test:/^Alongamento do ombro cruzado$/,base:'Alongamento do ombro',poses:['crossShoulder'],labels:['Leva um braço à frente do peito; alterna de lado'],exact:true},
 {test:/^Respiração deitado$/,base:'Respiração deitado',poses:['supine'],labels:['Deita-te confortavelmente e respira devagar'],exact:true},
];
export function movementFor(exercise){
 const entry=sequences.find(s=>s.test.test(exercise?.name||''));if(!entry)return null;
 return {...entry,variant:!entry.exact&&exercise.name!==entry.exactName&&!entry.exactNames?.includes(exercise.name)};
}
const point=p=>p.join(',');
function drawPose(p){
 const limb=(points,width,color,opacity=1)=>`<polyline points="${points.map(point).join(' ')}" fill="none" stroke="${color}" stroke-width="${width}" stroke-linecap="round" stroke-linejoin="round" opacity="${opacity}"/>`;
 const neutral='#8babb9',outline='#1d303c',highlight='#62e5b6';
 const arm=(elbow,hand,opacity)=>limb([p.shoulder,elbow,hand],17,outline,opacity)+limb([p.shoulder,elbow,hand],12,neutral,opacity)+limb([[hand[0]-5,hand[1]+1],[hand[0]+10,hand[1]+1]],6,neutral,opacity);
 const leg=(knee,ankle,toe,opacity)=>limb([p.hip,knee,ankle],21,outline,opacity)+limb([p.hip,knee,ankle],15,neutral,opacity)+limb([ankle,toe||[ankle[0]+14,ankle[1]+2]],8,neutral,opacity);
 const neck=[p.head[0]+(p.shoulder[0]-p.head[0])*.75,p.head[1]+(p.shoulder[1]-p.head[1])*.75];
 const far={elbow:[p.elbow[0]+8,p.elbow[1]-3],hand:[p.hand[0]+9,p.hand[1]-1],knee:[p.knee[0]+7,p.knee[1]-2],ankle:[p.ankle[0]+8,p.ankle[1]-1],...p.far};
 const trunk=p.curve?`<path d="M${point(p.shoulder)} Q${point(p.curve)} ${point(p.hip)}" fill="none" stroke="${neutral}" stroke-width="30" stroke-linecap="round"/>`:limb([p.shoulder,p.hip],32,outline)+limb([p.shoulder,p.hip],27,neutral);
 const floor=`<path d="M18 188H302" stroke="#425663" stroke-width="1.5"/><path d="M25 193H295" stroke="#172934" stroke-width="2"/>${p.wall?`<path d="M${p.wall+6} 18V188" stroke="#526c7b" stroke-width="5"/>`:''}`;
 const contacts=(p.contacts||[]).map(([x,y])=>`<ellipse cx="${x}" cy="${y+3}" rx="13" ry="3" fill="${highlight}" opacity=".35"/>`).join('');
 const align=p.alignment?`<path d="M${point(p.alignment[0])}L${point(p.alignment[1])}" stroke="${highlight}" stroke-width="1.3" stroke-dasharray="4 4" opacity=".7"/>`:'';
 return `${floor}${contacts}${arm(far.elbow,far.hand,.45)}${leg(far.knee,far.ankle,far.toe,.45)}${trunk}${leg(p.knee,p.ankle,p.toe,1)}${arm(p.elbow,p.hand,1)}${limb([neck,p.shoulder],13,neutral)}<circle cx="${p.head[0]}" cy="${p.head[1]}" r="14" fill="${neutral}" stroke="${outline}" stroke-width="3"/><path d="M${p.head[0]-3} ${p.head[1]+4}l5 1" stroke="#415c6d" stroke-width="1.6" stroke-linecap="round"/>${align}<circle cx="${p.shoulder[0]}" cy="${p.shoulder[1]}" r="3" fill="${highlight}"/><circle cx="${p.hip[0]}" cy="${p.hip[1]}" r="3" fill="${highlight}"/>`;
}
export function movementSvg(exercise,{phase=0,compact=false}={}){
 const entry=movementFor(exercise);if(!entry)return '';
 const n=Math.min(Math.max(0,phase),entry.poses.length-1),key=entry.poses[n],p=movementPoses[key];
 return `<svg xmlns="http://www.w3.org/2000/svg" class="movement-illustration${compact?' compact':''}" viewBox="0 0 320 210" role="img" aria-label="${safePoseText(`${exercise.name}. ${entry.variant?'Posição de referência do movimento base. ':''}${entry.labels[n]}. Ilustração esquemática.`.replace('Posição de referência do movimento base. ','Posição de referência do movimento base. '))}" data-pose="${key}" data-reference="${entry.variant?'base':'exercise'}">${drawPose(p)}</svg>`;
}
export function exerciseDemonstration(exercise){
 const entry=movementFor(exercise);if(!entry)return '';
 return `<figure class="exercise-demo" data-exercise="${safePoseText(exercise.id)}"><div class="demo-heading"><span>COMO FAZER</span><span>ILUSTRAÇÃO</span></div><div class="demo-image">${movementSvg(exercise)}</div>${entry.poses.length>1?`<div class="demo-phases" role="group" aria-label="Posições do exercício">${entry.poses.map((_,n)=>`<button data-action="demoPhase" data-id="${safePoseText(exercise.id)}" data-phase="${n}" aria-pressed="${n===0}" class="${n===0?'selected':''}">${n+1} · ${n===0?'Preparar':'Executar'}</button>`).join('')}</div>`:''}<figcaption><strong class="demo-caption" aria-live="polite">${safePoseText(entry.labels[0])}</strong><small>${entry.variant?`Referência: ${safePoseText(entry.base)}. Aplica a variante descrita nas instruções.`:'Desenho esquemático de referência · revisão técnica pendente'}</small></figcaption></figure>`;
}
