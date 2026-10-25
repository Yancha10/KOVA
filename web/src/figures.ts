/* eslint-disable @typescript-eslint/no-explicit-any */
// Demostraciones animadas de movimientos: figura esquemática con cinemática simple.
// Cada movimiento es una lista de poses (fotogramas clave) que se interpolan en bucle.
// Ángulos en grados con el eje Y hacia abajo: -90 es arriba, 90 es abajo, 0 es a la derecha.
// Raíz de cada pose: "hand" (mano fija, p. ej. colgado de la barra), "foot" (pie en el suelo) o "hip".
/* ========= MOVIMIENTOS (demos animadas) ========= */
const FY = 215;
const LEN = {t:40, ua:22, fa:20, th:31, sh:31, head:13};
const Hh = (x: number,y: number,o?: any) => Object.assign({r:"hand", p:[x,y], fa:-90, ua:-90, t:-90, th:92, sh:95}, o);
const Sf = (x: number,o?: any) => Object.assign({r:"foot", p:[x,FY], sh:90, th:90, t:-90, ua:95, fa:95}, o);
const Ph = (x: number,y: number,o?: any) => Object.assign({r:"hip", p:[x,y]}, o);
const ARCH = (y: number,o?: any) => Hh(110,y,Object.assign({fa:-95, ua:-100, t:-105, th:115, sh:125}, o));
const HOLLOW = (y: number,o?: any) => Hh(110,y,Object.assign({fa:-85, ua:-78, t:-72, th:65, sh:60}, o));
const PLANK = (x: number,o?: any) => Hh(x,FY,Object.assign({fa:90, ua:90, t:-25, th:155, sh:158}, o));
const HS = (x: number,o?: any) => Hh(x,FY,Object.assign({fa:90, ua:90, t:90, th:-90, sh:-90}, o));
const RACK = (o: any) => Sf(110,Object.assign({ua:20, fa:-150}, o));
const BALL = (o: any) => Sf(105,Object.assign({ua:45, fa:-70}, o));

export const FIGURES: Record<string, any> = {
 pullup:{n:"Pull-up estricta", g:"Barra", props:[["bar",40]], frames:[Hh(110,40,{h:350}), Hh(110,40,{ua:60, t:-95, th:95, sh:100, d:800, h:250})],
  cues:["Agarre algo más ancho que los hombros y brazos estirados del todo.","Empieza bajando las escápulas y tira de los codos hacia las costillas.","Barbilla por encima de la barra y baja controlando."],
  errs:["Medias repeticiones: no estirar abajo.","Balancear las piernas para subir."], esc:"Banda elástica o negativas lentas de 3-5 s desde arriba.", q:"strict pull up technique"},
 kipswing:{n:"Kip swing", g:"Barra", props:[["bar",40]], frames:[ARCH(40,{h:150}), HOLLOW(40,{d:650,h:150})],
  cues:["Alterna hollow (pies delante, costillas cerradas) y arch (pecho por delante de la barra).","El balanceo sale de los hombros empujando la barra, no de doblar rodillas.","Brazos estirados y ritmo constante."],
  errs:["Doblar las rodillas para coger impulso.","Balanceo enorme y sin control."], esc:"Practica hollow y arch tumbado en el suelo.", q:"kip swing crossfit"},
 kipping:{n:"Kipping pull-up", g:"Barra", props:[["bar",40]], frames:[ARCH(40,{h:100}), HOLLOW(40,{d:550}), Hh(110,40,{ua:60, t:-100, th:75, sh:85, d:400, h:120}), HOLLOW(40,{d:450}), ARCH(40,{d:500})],
  cues:["Arch → hollow y, en el hollow, lleva la cadera hacia la barra.","Barbilla sobre la barra y empuja la barra para volver al arch.","Enlaza las reps sin pausas, siempre al mismo ritmo."],
  errs:["Tirar solo de brazos sin usar la cadera.","Soltar la tensión arriba y caer a peso."], esc:"Pull-ups con banda o con salto desde cajón.", q:"kipping pull up technique"},
 c2b:{n:"Chest to bar", g:"Barra", props:[["bar",40]], frames:[ARCH(40,{h:100}), HOLLOW(40,{d:550}), Hh(110,40,{ua:80, t:-118, th:70, sh:80, d:420, h:140}), HOLLOW(40,{d:450}), ARCH(40,{d:500})],
  cues:["Mismo kip que el pull-up, pero con la cadera más alta.","Tira los codos atrás y abajo hasta tocar la barra con el pecho.","Mira al frente o un poco arriba."],
  errs:["Tocar con la barbilla o el cuello.","Quedarse corto de cadera en el hollow."], esc:"Pull-ups altos con banda o kipping pull-up normal.", q:"chest to bar pull up technique"},
 kneeraise:{n:"Hanging knee raise", g:"Barra", props:[["bar",40]], frames:[Hh(110,40,{h:200}), Hh(110,40,{ua:-85, t:-95, th:-5, sh:85, d:550, h:200})],
  cues:["Cuelga con brazos estirados y escápulas activas.","Sube las rodillas al menos a la altura de la cadera.","Baja controlando, sin columpiarte."],
  errs:["Coger impulso balanceando.","Soltar el abdomen abajo."], esc:"Hazlo tumbado o en paralelas.", q:"hanging knee raise"},
 k2e:{n:"Knees to elbows", g:"Barra", props:[["bar",40]], frames:[ARCH(40,{h:100}), HOLLOW(40,{d:500}), Hh(110,40,{fa:-85, ua:-72, t:-40, th:-35, sh:70, d:450, h:120}), HOLLOW(40,{d:450}), ARCH(40,{d:450})],
  cues:["Usa el kip swing: en el hollow, sube las rodillas.","Las rodillas tocan los codos o casi.","Empuja la barra hacia abajo para elevar la cadera."],
  errs:["Doblar los brazos.","Perder el ritmo del swing."], esc:"Hanging knee raises.", q:"knees to elbows crossfit"},
 t2b:{n:"Toes to bar", g:"Barra", props:[["bar",40]], frames:[ARCH(40,{h:100}), HOLLOW(40,{d:500}), Hh(110,40,{fa:-85, ua:-70, t:-35, th:-70, sh:-80, d:450, h:120}), HOLLOW(40,{d:450}), ARCH(40,{d:450})],
  cues:["Arch → hollow empujando la barra hacia abajo con los brazos estirados.","Cadera arriba y pies a tocar la barra entre las manos.","Vuelve al arch con control para enlazar."],
  errs:["Piernas dobladas y pies que no tocan.","Balanceo excesivo que rompe la serie."], esc:"Knees to elbows o hanging knee raises.", q:"toes to bar technique"},
 bmu:{n:"Bar muscle-up", g:"Barra", props:[["bar",80]], frames:[ARCH(80,{h:100}), HOLLOW(80,{d:500}), Hh(110,80,{fa:-50, ua:35, t:-150, th:120, sh:110, d:400}), Hh(110,80,{fa:40, ua:170, t:-55, th:110, sh:100, d:350, h:120}), Hh(110,80,{fa:90, ua:90, t:-80, th:100, sh:95, d:500, h:350}), Hh(110,80,{d:650, h:200})],
  cues:["Kip potente: el hollow lleva la cadera hacia la barra.","Tira hacia la cadera, no al pecho, y gira las muñecas por encima.","Inclínate sobre la barra y termina con un fondo."],
  errs:["Tirar al pecho como en un pull-up.","Quedarse lejos de la barra en la transición."], esc:"Jumping BMU en barra baja o banda fina.", q:"bar muscle up progression"},
 hang:{n:"Dead hang", g:"Barra", props:[["bar",40]], frames:[Hh(110,40,{h:400}), Hh(110,40,{th:96, sh:100, t:-92, d:900, h:400})],
  cues:["Agarre completo y brazos estirados.","Hombros activos, no colgado de las articulaciones.","Respira tranquilo."], errs:["Hombros hundidos hasta las orejas."], esc:"Apoya los pies en un cajón para quitar peso.", q:"dead hang"},
 scap:{n:"Scap pull-up", g:"Barra", props:[["bar",40]], frames:[Hh(110,40,{h:250}), Hh(110,40,{fa:-84, ua:-78, t:-97, th:98, sh:100, d:450, h:250})],
  cues:["Desde colgado, baja las escápulas sin doblar codos.","Sube un poco solo con la espalda.","Pausa arriba y baja lento."], errs:["Doblar los brazos."], esc:"Con los pies apoyados.", q:"scapular pull ups"},
 hs_wall:{n:"Handstand en pared", g:"Manos", props:[["floor"],["wall",121]], frames:[HS(110,{h:600}), HS(110,{ua:91, t:91, th:-89, sh:-91, d:900, h:600})],
  cues:["Manos a un palmo de la pared y dedos abiertos.","Empuja el suelo: hombros a las orejas y brazos bloqueados.","Costillas cerradas, glúteos y piernas apretados."],
  errs:["Espalda arqueada en forma de plátano.","Hombros hundidos."], esc:"Pike hold en cajón o wall walk a media altura.", q:"chest to wall handstand hold"},
 hsfree:{n:"Handstand libre", g:"Manos", props:[["floor"]], frames:[HS(110,{t:88, th:-93, sh:-95, h:200}), HS(110,{t:92, th:-87, sh:-86, d:800, h:200})],
  cues:["Busca la línea: muñecas, hombros, cadera y tobillos.","Corrige con los dedos de las manos, no con los brazos.","Aprende a salir rodando o girando antes de entrenarlo."],
  errs:["Mirar al frente y arquear.","Caer sin saber salir."], esc:"Hold en pared despegando los pies.", q:"freestanding handstand drills"},
 kickup:{n:"Kick-up", g:"Manos", props:[["floor"]], frames:[Sf(60,{ua:-90, fa:-90, h:200}), Sf(60,{ua:-80, fa:-80, t:-80, th2:45, sh2:100, d:350}), Hh(110,FY,{fa:90, ua:90, t:40, th:-150, sh:-150, th2:110, sh2:100, d:500}), HS(110,{th2:-90, sh2:-90, d:450, h:500}), Hh(110,FY,{fa:90, ua:90, t:40, th:-150, sh:-150, th2:110, sh2:100, d:400}), Sf(60,{ua:-80, fa:-80, t:-80, th2:45, sh2:100, d:500})],
  cues:["Brazos arriba y paso largo con la pierna fuerte.","Manos al suelo a la vez y patada con la pierna de atrás.","Junta las piernas arriba con suavidad."],
  errs:["Patada demasiado fuerte.","Doblar los brazos al llegar."], esc:"Kick-ups suaves contra la pared.", q:"handstand kick up"},
 wallwalk:{n:"Wall walk", g:"Manos", props:[["floor"],["wall",178]], frames:[Hh(70,FY,{fa:90, ua:90, t:200, th:20, sh:20, h:300}), Hh(105,FY,{fa:90, ua:90, t:150, th:-15, sh:-75, d:700, h:150}), Hh(165,FY,{fa:90, ua:90, t:100, th:-85, sh:-88, d:800, h:500}), Hh(105,FY,{fa:90, ua:90, t:150, th:-15, sh:-75, d:700}), Hh(70,FY,{fa:90, ua:90, t:200, th:20, sh:20, d:800})],
  cues:["Empieza en plancha con los pies en la pared.","Sube los pies a la vez que acercas las manos.","Termina con la nariz cerca de la pared y baja igual."],
  errs:["Saltar pasos y caer.","Arquear la lumbar."], esc:"Sube solo hasta media altura.", q:"wall walk crossfit"},
 hswalk:{n:"Handstand walk", g:"Manos", props:[["floor"]], loopCut:true, frames:[0,1,2,3,4,5,6].map((i: number) => Ph(40+22*i,135,{t:90, th:-95, sh:-102, ua:i%2?60:95, fa:i%2?20:95, ua2:i%2?95:60, fa2:i%2?95:20, d:i?330:0, h:i===6?250:0})),
  cues:["Adelanta los hombros respecto a las manos para iniciar el paso.","Pasos cortos y rápidos con el cuerpo en línea.","Mira al suelo entre las manos."],
  errs:["Pasos largos que te desequilibran.","Doblar la cadera y caer."], esc:"Pasos con la pared cerca o shoulder taps en pared.", q:"handstand walk progression"},
 shouldertaps:{n:"Shoulder taps", g:"Manos", props:[["floor"]], frames:[PLANK(130,{h:200}), PLANK(130,{ua2:120, fa2:-68, d:350, h:150}), PLANK(130,{d:350, h:150})],
  cues:["Plancha alta con el cuerpo recto.","Toca el hombro contrario sin girar la cadera.","Pies algo separados para estabilizar."], errs:["Balancear la cadera al tocar."], esc:"Rodillas en el suelo.", q:"shoulder taps plank"},
 pike:{n:"Pike push-up", g:"Manos", props:[["floor"]], frames:[Hh(120,FY,{fa:90, ua:90, t:40, th:95, sh:95, h:150}), Hh(120,FY,{fa:80, ua:150, t:55, th:116, sh:116, d:650, h:80}), Hh(120,FY,{fa:90, ua:90, t:40, th:95, sh:95, d:550})],
  cues:["Cadera alta y manos a la anchura de los hombros.","Baja la cabeza por delante de las manos formando un triángulo.","Empuja hasta bloquear los brazos."], errs:["Codos abiertos hacia fuera.","Cadera que baja."], esc:"Menos recorrido o push-ups normales.", q:"pike push up"},
 pushup:{n:"Push-up", g:"Manos", props:[["floor"]], frames:[PLANK(130,{h:150}), Hh(130,FY,{fa:70, ua:195, t:-8, th:172, sh:175, d:600, h:80}), PLANK(130,{d:500})],
  cues:["Cuerpo recto de cabeza a talones.","Codos a unos 45° del cuerpo.","Pecho al suelo y bloquea arriba."], errs:["Cadera hundida.","Medio recorrido."], esc:"Manos en un cajón o rodillas en el suelo.", q:"push up technique"},
 dips:{n:"Fondos", g:"Manos", props:[["floor"],["pbar",120]], frames:[Hh(110,120,{fa:90, ua:90, t:-92, th:100, sh:150, h:150}), Hh(110,120,{fa:60, ua:172, t:-72, th:105, sh:150, d:650, h:80}), Hh(110,120,{fa:90, ua:90, t:-92, th:100, sh:150, d:500})],
  cues:["Empieza con los brazos bloqueados y hombros abajo.","Baja hasta que el hombro quede por debajo del codo.","Empuja hasta bloquear."], errs:["Bajar poco.","Hombros que suben a las orejas."], esc:"Fondos en cajón o con banda.", q:"strict dips"},
 plank:{n:"Plancha", g:"Manos", props:[["floor"]], frames:[Hh(130,213,{fa:0, ua:90, t:-12, th:172, sh:175, h:700}), Hh(130,213,{fa:0, ua:90, t:-13, th:171, sh:174, d:900, h:700})],
  cues:["Codos bajo los hombros.","Glúteos y abdomen apretados, cuerpo recto.","Respira sin soltar la tensión."], errs:["Cadera alta o caída."], esc:"Rodillas apoyadas.", q:"plank technique"},
 hollow:{n:"Hollow hold / rocks", g:"Manos", props:[["floor"]], frames:[Ph(120,205,{t:195, ua:195, fa:192, th:-12, sh:-8, h:200}), Ph(120,207,{t:203, ua:203, fa:200, th:-4, sh:0, d:500, h:100}), Ph(120,205,{t:195, ua:195, fa:192, th:-12, sh:-8, d:500})],
  cues:["Lumbar pegada al suelo.","Brazos y piernas estirados y bajos.","Si haces rocks, el cuerpo se mueve como una sola pieza."], errs:["Despegar la lumbar."], esc:"Dobla las rodillas o sube los brazos.", q:"hollow body hold"},
 squat:{n:"Air squat", g:"Motor", props:[["floor"]], frames:[Sf(110,{h:200}), Sf(110,{sh:115, th:10, t:-55, ua:-5, fa:-8, d:650, h:100}), Sf(110,{d:550})],
  cues:["Pies a la anchura de hombros, puntas algo abiertas.","Cadera atrás y abajo, rodillas en línea con los pies.","Baja del paralelo y sube del todo."], errs:["Rodillas hacia dentro.","Talones que se levantan."], esc:"Siéntate en un cajón.", q:"air squat technique"},
 thruster:{n:"Thruster", g:"Motor", obj:"bar", props:[["floor"]], frames:[RACK({h:150}), RACK({sh:115, th:10, t:-68, ua:25, d:650, h:60}), RACK({d:380}), Sf(110,{ua:-88, fa:-88, d:300, h:250}), RACK({d:450})],
  cues:["Barra en front rack con los codos altos.","Sentadilla completa y sube con fuerza.","Usa el impulso para empujar la barra arriba y bloquea."], errs:["Codos que caen abajo.","Empujar antes de terminar de subir."], esc:"Menos peso o mancuernas.", q:"thruster crossfit technique"},
 wallball:{n:"Wall ball", g:"Motor", obj:"ball", props:[["floor"],["wall",184],["target",176,38]], frames:[BALL({sh:115, th:10, t:-62, h:80}), BALL({d:450}), Sf(105,{ua:-65, fa:-60, d:220}), Sf(105,{ua:-65, fa:-60, o:[168,40], d:450, h:60}), BALL({d:500}), BALL({sh:115, th:10, t:-62, d:450})],
  cues:["Balón en el pecho con los codos debajo.","Sentadilla completa y sube explosivo.","Lanza al objetivo y recibe bajando a la siguiente."], errs:["No llegar al paralelo.","Lanzar solo con los brazos."], esc:"Balón más ligero u objetivo más bajo.", q:"wall ball shot technique"},
 kbswing:{n:"KB swing", g:"Motor", obj:"kb", props:[["floor"]], frames:[Sf(110,{sh:100, th:55, t:-25, ua:105, fa:110, h:80}), Sf(110,{t:-92, ua:-5, fa:-5, d:350}), Sf(110,{ua:-90, fa:-90, d:250, h:100}), Sf(110,{t:-92, ua:-5, fa:-5, d:250}), Sf(110,{sh:100, th:55, t:-25, ua:105, fa:110, d:400})],
  cues:["Bisagra de cadera con la espalda neutra.","Golpe de cadera: la KB flota y los brazos solo guían.","En el swing americano termina con la KB sobre la cabeza."], errs:["Hacer sentadilla en vez de bisagra.","Subirla tirando de brazos."], esc:"Swing ruso a la altura de los ojos o menos peso.", q:"american kettlebell swing"},
 dbsnatch:{n:"DB snatch", g:"Motor", obj:"db", props:[["floor"]], frames:[Sf(100,{sh:100, th:30, t:-10, ua:92, fa:92, ua2:100, fa2:95, h:120}), Sf(100,{p:[100,211], t:-95, ua:-20, fa:-110, ua2:100, fa2:95, d:330}), Sf(100,{sh:100, th:75, t:-88, ua:-90, fa:-90, ua2:100, fa2:95, d:220, h:100}), Sf(100,{ua:-90, fa:-90, ua2:100, fa2:95, d:350, h:250}), Sf(100,{sh:100, th:30, t:-10, ua:92, fa:92, ua2:100, fa2:95, d:700})],
  cues:["Mancuerna entre los pies, bisagra y espalda recta.","Extiende la cadera y tira del codo alto pegado al cuerpo.","Recibe arriba con el brazo bloqueado."], errs:["Subirla solo con el brazo.","Mancuerna lejos del cuerpo."], esc:"Menos peso o hang snatch.", q:"dumbbell snatch technique"},
 hpc:{n:"Hang power clean", g:"Motor", obj:"bar", props:[["floor"]], frames:[Sf(105,{sh:95, th:75, t:-70, ua:97, fa:95, h:150}), Sf(105,{p:[105,211], sh:88, th:92, t:-100, ua:100, fa:95, d:300}), Sf(105,{sh:105, th:60, t:-85, ua:20, fa:-150, d:220, h:150}), Sf(105,{ua:20, fa:-150, d:400, h:200}), Sf(105,{sh:95, th:75, t:-70, ua:97, fa:95, d:600})],
  cues:["Barra a mitad de muslo y hombros por delante.","Salto vertical con extensión completa.","Recibe en front rack con media sentadilla y codos rápidos."], errs:["Tirar con los brazos.","Recibir con los codos bajos."], esc:"Menos peso.", q:"hang power clean technique"},
 burpee:{n:"Burpee", g:"Motor", props:[["floor"]], frames:[Sf(90,{h:100}), Sf(90,{sh:120, th:-15, t:-30, ua:80, fa:85, d:450}), PLANK(118,{d:300, h:60}), Hh(118,FY,{fa:70, ua:195, t:-4, th:178, sh:180, d:350, h:60}), PLANK(118,{d:350}), Sf(90,{sh:120, th:-15, t:-30, ua:80, fa:85, d:300}), Sf(90,{p:[90,188], th:88, sh:92, ua:-80, fa:-80, d:280, h:60}), Sf(90,{d:300, h:150})],
  cues:["Manos al suelo y pies atrás.","Pecho y muslos tocan el suelo.","Pies a las manos, salta y palmada arriba."], errs:["El pecho no toca.","No extender la cadera al saltar."], esc:"Sin salto o bajando paso a paso.", q:"burpee technique"},
 boxjump:{n:"Box jump", g:"Motor", props:[["floor"],["box",130,192,170]], loopCut:true, frames:[Sf(80,{ua:100, fa:100, h:150}), Sf(80,{sh:110, th:40, t:-50, ua:125, fa:130, d:400, h:50}), Sf(80,{p:[118,150], sh:100, th:-10, t:-75, ua:-20, fa:-30, d:300}), Sf(80,{p:[158,170], sh:110, th:30, t:-60, ua:-5, fa:-5, d:280, h:60}), Sf(80,{p:[158,170], d:450, h:500})],
  cues:["Brazos atrás y carga la cadera.","Salta y aterriza con los dos pies, suave.","Extiende la cadera arriba y baja a pasos."], errs:["Aterrizar con las rodillas hacia dentro.","Bajar saltando de espaldas."], esc:"Cajón más bajo o step-ups.", q:"box jump technique"},
 stepup:{n:"Box step-up", g:"Motor", props:[["floor"],["box",118,190,175]], loopCut:true, frames:[Sf(95,{h:250}), Sf(95,{p:[128,175], sh:84, th:-15, th2:90, sh2:90, d:450, h:100}), Sf(95,{p:[128,175], th2:100, sh2:120, d:550, h:400})],
  cues:["Pie entero sobre el cajón.","Sube empujando con la pierna de arriba.","Extiende la cadera arriba."], errs:["Impulsarte con la pierna de abajo."], esc:"Cajón más bajo.", q:"box step up"},
 situp:{n:"Sit-up", g:"Motor", props:[["floor"]], frames:[Ph(115,203,{t:180, ua:180, fa:180, th:-50, sh:55, h:100}), Ph(115,203,{t:-55, ua:30, fa:40, th:-50, sh:55, d:500, h:100}), Ph(115,203,{t:180, ua:180, fa:180, th:-50, sh:55, d:600})],
  cues:["Plantas de los pies juntas y abmat en la lumbar.","Brazos atrás hasta tocar el suelo.","Sube y toca los pies."], errs:["Tirar del cuello."], esc:"Menos recorrido.", q:"abmat sit up"},
 row:{n:"Remo / bici", g:"Motor", obj:"handle", props:[["rower"]], frames:[Sf(138,{p:[138,200], sh:55, th:-40, t:-60, ua:8, fa:8, h:80}), Sf(138,{p:[138,200], sh:25, th:-10, t:-80, ua:5, fa:5, d:300}), Sf(138,{p:[138,200], sh:5, th:2, t:-112, ua:125, fa:-15, d:300, h:100}), Sf(138,{p:[138,200], sh:5, th:2, t:-75, ua:8, fa:8, d:400}), Sf(138,{p:[138,200], sh:55, th:-40, t:-60, ua:8, fa:8, d:500})],
  cues:["Al tirar: piernas, tronco y brazos, en ese orden.","Al volver, al revés: brazos, tronco y piernas.","Rápido al tirar y lento al volver."], errs:["Doblar brazos antes de empujar con piernas.","Encogerse en la vuelta."], esc:"Bici o carrera con el mismo tiempo.", q:"rowing technique concept2"},
 rope:{n:"Comba / double unders", g:"Motor", rope:true, props:[["floor"]], frames:[Sf(110,{p:[110,205], ua:100, fa:25, d:180}), Sf(110,{ua:100, fa:25, d:180})],
  cues:["Saltos pequeños con el cuerpo recto.","Gira la cuerda con las muñecas, no con los brazos.","Para el DU, salto algo más alto y muñecas más rápidas."], errs:["Doblar las rodillas hacia atrás al saltar."], esc:"Singles: 3 por cada DU.", q:"double unders tutorial"},
 run:{n:"Carrera", g:"Motor", props:[["floor"]], frames:[Ph(110,152,{t:-82, th:60, sh:115, th2:120, sh2:175, ua:125, fa:75, ua2:55, fa2:-35, d:280}), Ph(110,147,{t:-82, th:120, sh:175, th2:60, sh2:115, ua:55, fa:-35, ua2:125, fa2:75, d:280})],
  cues:["Pasos cortos y rápidos.","Brazos relajados a 90°.","Respira con ritmo y mira al frente."], errs:["Zancadas largas aterrizando de talón."], esc:"Remo o bici.", q:"running form tips"}
};
/* ===== motor de la figura ===== */
const rad = (d: number) => d * Math.PI / 180;
const V = (a: number,l: number): number[] => [Math.cos(rad(a))*l, Math.sin(rad(a))*l];
const add = (a: number[],b: number[]) => [a[0]+b[0], a[1]+b[1]];
const sub = (a: number[],b: number[]) => [a[0]-b[0], a[1]-b[1]];
export function solve(P: any){
  const ua2 = P.ua2 ?? P.ua, fa2 = P.fa2 ?? P.fa, th2 = P.th2 ?? P.th, sh2 = P.sh2 ?? P.sh;
  let hip, sho;
  if (P.r === "hand"){ const e = sub(P.p, V(P.fa, LEN.fa)); sho = sub(e, V(P.ua, LEN.ua)); hip = sub(sho, V(P.t, LEN.t)); }
  else if (P.r === "foot"){ const k = sub(P.p, V(P.sh, LEN.sh)); hip = sub(k, V(P.th, LEN.th)); sho = add(hip, V(P.t, LEN.t)); }
  else { hip = P.p.slice(); sho = add(hip, V(P.t, LEN.t)); }
  const elb = add(sho, V(P.ua, LEN.ua)), hand = add(elb, V(P.fa, LEN.fa));
  const elb2 = add(sho, V(ua2, LEN.ua)), hand2 = add(elb2, V(fa2, LEN.fa));
  const knee = add(hip, V(P.th, LEN.th)), foot = add(knee, V(P.sh, LEN.sh));
  const knee2 = add(hip, V(th2, LEN.th)), foot2 = add(knee2, V(sh2, LEN.sh));
  const head = add(sho, V(P.hd ?? P.t, LEN.head));
  return {hip, sho, elb, hand, elb2, hand2, knee, foot, knee2, foot2, head, obj: P.o ? P.o.slice() : hand.slice()};
}
const easeIO = (k: number) => k < .5 ? 2*k*k : 1 - Math.pow(-2*k+2, 2)/2;
function lerpJ(a: any,b: any,k: number){ const o: any = {}; for (const key in a){ o[key] = [a[key][0] + (b[key][0]-a[key][0])*k, a[key][1] + (b[key][1]-a[key][1])*k]; } return o; }
function timeline(mv: any){
  if (mv._tl) return mv._tl;
  const fr = mv.frames.map((f: any) => ({J:solve(f), d:f.d ?? 450, h:f.h || 0}));
  const seg: any[] = []; let total = 0;
  fr.forEach((f: any,i: number) => {
    const prev = i === 0 ? fr[fr.length-1] : fr[i-1];
    const d = i === 0 ? (mv.loopCut ? 0 : 450) : f.d;
    if (d > 0){ seg.push({a:prev.J, b:f.J, s:total, d}); total += d; }
    if (f.h > 0){ seg.push({a:f.J, b:f.J, s:total, d:f.h}); total += f.h; }
  });
  if (!seg.length) seg.push({a:fr[0].J, b:fr[0].J, s:0, d:1000});
  mv._tl = {seg, total: total || 1000}; return mv._tl;
}
export function poseAt(mv: any, ms: number){
  const tl = timeline(mv); const t = ((ms % tl.total) + tl.total) % tl.total;
  for (const s of tl.seg){ if (t < s.s + s.d) return lerpJ(s.a, s.b, easeIO(Math.max(0, Math.min(1, (t - s.s) / s.d)))); }
  const last = tl.seg[tl.seg.length-1]; return lerpJ(last.a, last.b, 1);
}
const f1 = (n: number) => n.toFixed(1);
const ln = (a: number[],b: number[],c: string) => `<line x1="${f1(a[0])}" y1="${f1(a[1])}" x2="${f1(b[0])}" y2="${f1(b[1])}" class="${c}"/>`;
function propsSVG(mv: any){
  let s = "";
  (mv.props || []).forEach((p: any[]) => {
    const [k,a,b,c] = p;
    if (k === "floor") s += `<line x1="0" y1="${FY+3}" x2="220" y2="${FY+3}" class="floor"/>`;
    if (k === "bar") s += `<line x1="22" y1="${a}" x2="198" y2="${a}" class="prop"/><line x1="22" y1="${a}" x2="22" y2="230" class="prop" opacity=".5"/><line x1="198" y1="${a}" x2="198" y2="230" class="prop" opacity=".5"/>`;
    if (k === "wall") s += `<rect x="${a}" y="0" width="40" height="${FY+3}" class="propf" opacity=".9"/>`;
    if (k === "box") s += `<rect x="${a}" y="${c}" width="${b-a}" height="${FY+3-c}" rx="4" class="propf"/><line x1="${a+8}" y1="${c+12}" x2="${b-8}" y2="${c+12}" class="floor"/>`;
    if (k === "pbar") s += `<line x1="80" y1="${a}" x2="150" y2="${a}" class="prop"/><line x1="90" y1="${a}" x2="90" y2="${FY}" class="prop" opacity=".5"/><line x1="140" y1="${a}" x2="140" y2="${FY}" class="prop" opacity=".5"/>`;
    if (k === "target") s += `<circle cx="${a}" cy="${b}" r="11" fill="none" stroke="var(--pink)" stroke-width="3"/><circle cx="${a}" cy="${b}" r="4" fill="var(--pink)"/>`;
    if (k === "rower") s += `<line x1="40" y1="${FY-6}" x2="190" y2="${FY-6}" class="prop"/><circle cx="188" cy="186" r="18" class="propf"/><circle cx="188" cy="186" r="5" fill="var(--violet)"/><rect x="138" y="196" width="10" height="14" rx="2" class="propf"/><line x1="60" y1="${FY-6}" x2="60" y2="${FY+3}" class="prop"/><line x1="180" y1="${FY-6}" x2="180" y2="${FY+3}" class="prop"/>`;
  });
  return s;
}
function objSVG(type: string, J: any){
  const h = J.obj;
  if (type === "kb") return `<path d="M${f1(h[0]-6)} ${f1(h[1]+3)} q6 -12 12 0" fill="none" stroke="var(--ink)" stroke-width="3"/><circle cx="${f1(h[0])}" cy="${f1(h[1]+11)}" r="9" class="obj"/>`;
  if (type === "db") return `<rect x="${f1(h[0]-11)}" y="${f1(h[1]-4)}" width="22" height="8" rx="3" class="obj"/>`;
  if (type === "bar") return `<circle cx="${f1(h[0])}" cy="${f1(h[1])}" r="13" class="obj"/><circle cx="${f1(h[0])}" cy="${f1(h[1])}" r="3" fill="var(--ink)"/>`;
  if (type === "ball") return `<circle cx="${f1(h[0]+7)}" cy="${f1(h[1]-2)}" r="10" class="obj2"/><path d="M${f1(h[0]-1)} ${f1(h[1]-6)} q8 4 16 0" fill="none" stroke="var(--ink)" stroke-width="1.5"/>`;
  if (type === "handle") return `<line x1="${f1(h[0])}" y1="${f1(h[1])}" x2="188" y2="186" stroke="var(--muted)" stroke-width="1.5"/><rect x="${f1(h[0]-2)}" y="${f1(h[1]-6)}" width="5" height="12" rx="2" fill="var(--ink)"/>`;
  return "";
}
function ropeSVG(J: any, time: number){
  const ph = (time % 360) / 360 * Math.PI * 4;
  const cx = J.hand[0] + 4, cy = (FY + J.head[1]) / 2 + 2, ry = (FY - J.head[1]) / 2 + 14;
  const rp = [cx + 24*Math.cos(ph), cy + ry*Math.sin(ph)];
  const h = J.hand, mid = [(h[0]+rp[0])/2, (h[1]+rp[1])/2];
  const dx = rp[0]-h[0], dy = rp[1]-h[1], L = Math.hypot(dx,dy) || 1, px = -dy/L*16, py = dx/L*16;
  return `<path d="M${f1(h[0])} ${f1(h[1])} Q${f1(mid[0]+px)} ${f1(mid[1]+py)} ${f1(rp[0])} ${f1(rp[1])} Q${f1(mid[0]-px)} ${f1(mid[1]-py)} ${f1(h[0])} ${f1(h[1])}" class="rope"/>`;
}
export function figInner(mv: any, J: any, time: number){
  let s = propsSVG(mv);
  s += `<ellipse cx="${f1(J.hip[0])}" cy="${FY+5}" rx="28" ry="4" class="fshadow"/>`;
  s += ln(J.hip,J.knee2,"lb") + ln(J.knee2,J.foot2,"lb") + ln(J.sho,J.elb2,"lb") + ln(J.elb2,J.hand2,"lb");
  if (mv.rope) s += ropeSVG(J, time || 0);
  s += ln(J.hip,J.sho,"lt") + `<circle cx="${f1(J.head[0])}" cy="${f1(J.head[1])}" r="9" class="hd"/>`;
  s += ln(J.hip,J.knee,"lf") + ln(J.knee,J.foot,"lf");
  if (mv.obj) s += objSVG(mv.obj, J);
  s += ln(J.sho,J.elb,"lf") + ln(J.elb,J.hand,"lf");
  return s;
}
export function figStatic(id: string, tight?: boolean){
  const mv = FIGURES[id]; const J: any = solve(mv.frames[mv.thumb ?? Math.min(1, mv.frames.length-1)]);
  let vb = "0 0 220 230";
  if (tight){ const pts: number[][] = ["hip","sho","elb","hand","elb2","hand2","knee","foot","knee2","foot2","head"].map((k) => J[k]); const xs = pts.map((p) => p[0]), ys = pts.map((p) => p[1]); const x0 = Math.min(...xs), x1 = Math.max(...xs), y0 = Math.min(...ys), y1 = Math.max(...ys); const sz = Math.max(x1-x0, y1-y0) + 34; vb = `${f1((x0+x1)/2 - sz/2)} ${f1((y0+y1)/2 - sz/2)} ${f1(sz)} ${f1(sz)}`; }
  return `<svg viewBox="${vb}" aria-hidden="true">${figInner(mv, J, 90)}</svg>`;
}

/** Movimientos de la escuela de KOVA (app/lib/movements.ts) que tienen demostración animada. */
export const FIGURE_FOR: Record<string, string> = {
  "pull-up": "pullup", kipping: "kipping", c2b: "c2b", ttb: "t2b", bmu: "bmu", hsw: "hswalk", "wall-walk": "wallwalk",
  squat: "squat", "front-squat": "squat", clean: "hpc", snatch: "dbsnatch", thruster: "thruster", swing: "kbswing",
  "wall-ball": "wallball", burpee: "burpee", "box-jump": "boxjump", "double-under": "rope", row: "row",
};
