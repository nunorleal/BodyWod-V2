# BodyWOD

Aplicação em **HTML, CSS e JavaScript**, em português de Portugal, orientada a smartphones na vertical. Não requer pacotes externos, conta, servidor de dados nem subscrição.

## Abrir

- **Ficheiro único:** abrir `BodyWOD.html` num navegador moderno. Inclui interface, biblioteca e motores; funciona sem ligação à Internet. Os dados ficam associados a esse ficheiro/navegador. A instalação como PWA requer HTTP seguro.
- **Versão modular / instalável:** com Node.js 20 ou superior, executar `npm start` nesta pasta e abrir `http://localhost:4173`. Depois da primeira abertura, o service worker guarda os recursos para utilização offline. Num smartphone, a instalação e o wake lock exigem normalmente **HTTPS**; localhost refere-se ao próprio dispositivo. Não basta abrir no telefone o localhost do computador.
- No iPhone/iPad: Safari → Partilhar → Adicionar ao ecrã principal, quando servido por HTTPS. A disponibilização por HTTPS não está configurada neste projeto.

Neste ambiente, Node está em `/Users/nunoleal/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin/node`. Pode ser usado em vez de `node` para executar `scripts/serve.mjs`, `scripts/bundle.mjs` e `--test tests/*.test.js`.

## Arquitetura

| Módulo | Responsabilidade |
| --- | --- |
| `src/exercises.js` | 162 exercícios reais/variantes e 24 movimentos de aquecimento/retorno à calma, metadados e estrutura visual |
| `src/training.js` | Papéis de ativação/treino, exigência do avançado e sequência WOD de referência |
| `src/generator.js` | Seleção por categoria, padrões, nível, impacto, favoritos e recência; construção e edição da linha temporal |
| `src/timer.js` | Relógio central monotónico, pausa/retoma, navegação, resultados e recuperação |
| `src/movement.js` | Posições ilustradas por família de movimento, preparação/execução e identificação explícita das variantes |
| `src/anatomy.js` | Atlas SVG original reutilizável, vistas anterior/posterior e cores por grupos musculares |
| `src/audio.js` | Web Audio para bips e Speech Synthesis com seleção exclusiva de vozes pt-PT |
| `src/storage.js` | Persistência local versionada com erros de leitura/escrita visíveis |
| `src/app.js` | Navegação, formulários, edição, execução, resultados, exportação/importação |
| `styles.css` | Tema escuro, tamanhos móveis, áreas seguras e acessibilidade |
| `sw.js` | Cache local para a versão servida por HTTP/HTTPS |
| `scripts/bundle.mjs` | Cria o HTML autónomo a partir dos mesmos módulos |

A opção web substitui Expo e SQLite nesta implementação. O armazenamento usa `localStorage`, com cópias completas dos planos em cada execução. Não há sincronização entre dispositivos. As alterações futuras podem trocar este adaptador por IndexedDB ou uma camada nativa sem mudar o gerador/relógio.

## Funcionalidades implementadas por fase

1. **Estrutura e interface:** cinco áreas principais, definições, interface vertical, tema escuro e controlos grandes.
2. **Biblioteca:** seis categorias principais (20/30/20/20/34/30), aquecimento (16), retorno à calma (8), instruções, erros, alternativas, favoritos e exclusões.
3. **Gerador:** 10–180 minutos; níveis, modalidades, baixo impacto, favoritos, inclusões explícitas e recência das últimas cinco sessões. Full Body alterna categorias; o primeiro estímulo de pernas dá preferência a agachamentos. Aquecimento inclui progressão, mobilidade inferior/superior, coluna e ativação, respeitando disponibilidades.
4. **Editor:** visualização integral por blocos; substituição por categoria, músculos em comum e dificuldade próxima; séries, repetições, execução, descanso, bloqueio, reordenação e regeneração de bloco. Os ajustes redistribuem os tempos desbloqueados ou apresentam um erro, preservando a duração anterior. A escolha de alternativas não equivale a uma prescrição individual.
5. **Execução:** intervalos e descansos automáticos, série e tempo total restantes, pausa/retoma, avanço/recuo, substituição durante a sessão, registo manual de repetições. Wake lock quando disponível e autorizado pelo navegador.
6. **Áudio:** bips sintetizados localmente, voz instalada pt-PT, volumes, contagem completa/parcial/instruções, avisos antecipados. A cadência é prevista; não mede movimentos.
7. **Persistência:** planos, favoritos, exclusões, definições, sessão em curso, histórico independente com resultados, notas, classificação e alterações; repetição exata, variante, proposta de progressão; backup JSON e importação que preserva registos existentes.
8. **Validação:** testes automáticos de motores/dados/persistência e verificação manual no navegador. A validação anatómica e a validação em dispositivos físicos continuam pendentes.

## Regras de tempo

- Cada etapa possui `start`, `end` e `duration`. A soma é validada contra a duração pedida. O exemplo de 60 minutos com aquecimento e retorno de 5 minutos produz **5 + 15 + 20 + 15 + 5 = 60 minutos**.
- Todas as transições e recuperações são etapas cronometradas. Diferenças residuais de segundos aparecem como recuperação no final do bloco.
- Os ticks de desenho apenas atualizam o ecrã. O tempo resulta de `performance.now()` e não de contagens de intervalos.
- A pausa interrompe o relógio e cancela a fala/áudio; a retoma conserva o tempo anterior. Avançar/recuar altera o ponto da linha temporal e fica registado. O tempo ativo é separado do ponto programado e não inclui os segundos saltados.
- Em segundo plano, o navegador pode suspender desenho e áudio; ao regressar, o relógio calcula a etapa correta enquanto o documento continuar vivo. Não há garantia de áudio em segundo plano ou de contabilização de suspensão profunda do sistema. Depois de encerrar/recarregar a aplicação, a sessão é recuperada **em pausa**, pelo último checkpoint (aproximadamente a cada 2 segundos), sem contabilizar o tempo com a aplicação fechada. A interface explica esta política.
- **EMOM:** cada ocorrência ocupa um minuto; execução de até 55s, descanso no restante minuto. A confirmação antecipada converte o restante período de execução em descanso. O histórico conserva o plano programado, os resultados e a alteração para descanso; a repetição usa o plano programado. Se o bloco principal não tiver minutos inteiros, os segundos finais são recuperação explícita.
- **AMRAP:** janela contínua de duração fixa. O utilizador confirma movimentos e voltas; não existem voltas ou repetições fisicamente detetadas. O preenchimento do resultado pausa o relógio e retoma após confirmação.
- Uma sessão terminada antes do fim é identificada como tal. Não é contabilizada como treino concluído nas estatísticas.

## Limitações e trabalho pendente

**Mapas musculares esquemáticos disponíveis.** A biblioteca, o plano e o treino mostram o mesmo atlas SVG original, com frente e costas: vermelho para grupos principais, laranja para secundários e cinzento para restantes regiões. Aquecimento/alongamentos identificam regiões mobilizadas. Os mapas são incorporados no HTML e funcionam offline. Os grupos profundos, como os flexores da anca, são projeções esquemáticas, sem pretensão de mostrar camadas anatómicas superficiais. O caso de respiração geral permanece neutro. Estes mapas não demonstram a posição inicial/final ou a execução do movimento. **A validação profissional e as demonstrações realistas continuam pendentes.** Os recursos de demonstração mantêm `status: "pending-validation"`, caminhos nulos e revisor nulo; `muscleMap` e `mapStatus` identificam separadamente o esquema disponível. Para integrar recursos: adicionar os ficheiros locais, os caminhos `start`/`end`/`animation`, identificar o revisor e mudar o estado para `validated` apenas após revisão. Incluir os novos ficheiros no cache offline. A interface já aceita uma imagem ou animação validada; ainda falta implementar uma sequência sincronizada de posições inicial/final com a cadência.

A biblioteca e os critérios musculares têm informação editorial inicial; a revisão profissional da técnica, dificuldades e adequação de cada variante está pendente. O gerador aplica regras gerais e não faz avaliação clínica, de lesões ou de recuperação individual. A revisão de cobertura biomecânica e da carga de sessões longas deve preceder utilização como produto de treino validado. Sem equipamento, extensão lombar/estabilização não substitui exercícios de puxar para dorsais e bíceps.

**A voz depende do dispositivo.** A aplicação só seleciona `pt-PT`; nunca troca silenciosamente para pt-BR. Sem voz pt-PT, informa e mantém bips e interface. Uma voz de rede pode precisar de Internet; para offline é necessária uma voz local. Não inclui modelos de voz próprios, nem instala vozes automaticamente. As instruções de instalação são genéricas porque variam por sistema.

Áudio e interface consultam a mesma linha temporal. A latência e a duração da síntese de voz pertencem ao sistema e não têm precisão ao milissegundo. Não há controlo nativo da mistura/ducking com Spotify, Apple Music ou outras aplicações; essa capacidade fica dependente do navegador/SO. Uma chamada, bloqueio do ecrã ou poupança de energia pode interromper o som. A navegação é mantida simples durante o treino.

`localStorage` tem limites de quota e pode ser removido pelo utilizador/navegador. Falhas de escrita são apresentadas, não tratadas como gravação bem-sucedida. Exportar backups regularmente. Não há SQLite, ficheiro APK/IPA, testes em hardware iOS/Android nem publicação HTTPS nesta entrega. Os critérios de aceitação de anatomia validada e voz garantida em cada dispositivo **não estão concluídos**.

## Verificação e desenvolvimento

```sh
npm test
npm run build
npm start
```

Os **53 testes** verificam perfis do avançado e a sequência WOD, restrições de impacto/exclusões, objetivos por tempo, bips e contagem sincronizados, transições e pausa/retoma, mapas e poses, persistência e recuperação. A duração exata e a continuidade da linha temporal são verificadas em **168 combinações** de duração/modalidade/nível; o perfil avançado é verificado adicionalmente em **240 combinações** de modalidade, impacto e semente. Há regressões para aquecimento sem caminhada, edição, regeneração, seleção exclusiva de voz pt-PT e casos de erro de armazenamento.

No navegador foram verificados configuração de 60 minutos, substituição com duração preservada, execução, pausa/retoma, término antecipado e gravação do resumo. O registo «Verificação técnica · interface» identifica explicitamente o teste e não um treino físico. O HTML autónomo foi testado por HTTP local, e foram verificadas larguras de 320, 390 e 430 px, sem deslocamento horizontal. A ferramenta de navegador bloqueia URLs file://; a abertura por duplo clique não foi verificada por essa ferramenta. Não foi executada uma sessão física de 60 minutos nem uma validação clínica.

Após alterar os módulos, executar `npm run build` para atualizar `BodyWOD.html`. Aumentar a versão do cache em `sw.js` ao distribuir uma nova versão da PWA. Nenhuma dependência é descarregada em runtime; não há fontes remotas, telemetria ou imagens da Internet.

### Referências para localização das regiões musculares

Os desenhos SVG são originais e esquemáticos. A referência descritiva de localização é OpenStax, *Anatomy & Physiology*, capítulo 11: [parede abdominal e tórax](https://openstax.org/books/anatomy-and-physiology/pages/11-4-axial-muscles-of-the-abdominal-wall-and-thorax) e [cintura escapular e membros superiores](https://openstax.org/books/anatomy-and-physiology/pages/11-5-muscles-of-the-pectoral-girdle-and-upper-limbs). A consulta destas referências não constitui validação profissional do atlas ou da prescrição de exercícios.

### Ilustrações de execução

A interface dá prioridade a um boneco na posição do exercício. As flexões clássicas mostram uma prancha com as mãos no chão e, no segundo botão, a descida com os cotovelos fletidos. Flexões de joelhos e de parede têm apoios distintos. Agachamentos, lunges, ponte de glúteos, bird dog e outros movimentos têm referências próprias. O mapa muscular continua disponível em «Ver músculos trabalhados».

O módulo cobre **136 entradas da biblioteca** com desenhos SVG originais, incluindo referências de posição base partilhadas entre variantes. Uma referência partilhada é identificada explicitamente e deve ser complementada pelas instruções da variante. Não se afirma que uma imagem da flexão clássica demonstra uma flexão arqueiro, uma rotação ou um salto. As **42 entradas sem referência adequada** mantêm o mapa muscular e indicam que a ilustração específica está em preparação; não recebem uma pose aleatória. Os botões mudam entre imagens estáticas e não são uma animação ou uma contagem de repetições.

As poses são esquemáticas, não clinicamente validadas. Os testes de coordenadas verificam apenas coerência estrutural e apoios fundamentais; não substituem revisão profissional. Referências de técnica consultadas: [Mayo Clinic — flexão modificada](https://www.mayoclinic.org/healthy-lifestyle/fitness/multimedia/modified-pushup/vid-20084674) e [ACE — biblioteca de exercícios](https://www.acefitness.org/resources/everyone/exercise-library/). Os desenhos não reproduzem imagens destas fontes.

### Correção da orientação sonora

O relógio passa a devolver os indicadores de mudança de etapa e de segundo ao consumidor, além do callback. O treinador também reconhece a etapa pelo seu identificador para não perder anúncios após avanço/recuo manual. A ativação inicial da fala é feita a partir do toque de início/teste e os bips só são emitidos após ativação do contexto de áudio. O pedido de manter o ecrã ligado não bloqueia o arranque do relógio.

Cada exercício temporizado é anunciado pelo nome, número da série e repetições previstas. A contagem completa é a predefinição; por exemplo, 15 repetições produzem quinze chamadas, de «um» a «quinze». Há 6 segundos iniciais reservados dentro do tempo de execução para o anúncio, e a última chamada ocorre 2 segundos antes do fim. O contador no ecrã usa a mesma função de cadência. Os números não cancelam a fala inicial e os avisos de cinco segundos não interrompem a contagem. Em planos antigos com muitas repetições num intervalo curto, a cadência pode ser mais rápida; os novos planos/edições continuam a validar os limites de tempo. A contagem é orientação prevista, nunca deteção de movimentos reais.

O som dos bips foi reforçado, mantendo o controlo de volume. O botão «Testar som: bips e voz» mostra o estado do contexto e a voz instalada. A confirmação «Última fala iniciada» provém do evento nativo de início da voz, não apenas da tentativa de reprodução. Testar o som durante um treino pausa a sessão para não misturar o exemplo com as instruções. O volume/mute do sistema, a saída de áudio e a audição física não são verificáveis pela aplicação.

Verificação no navegador: voz Joana pt-PT local disponível, contexto de áudio ativo e evento de início da fala de teste recebido. A sessão já existente foi recuperada e mantida em pausa, sem avançar etapas nem acrescentar resultados físicos.

### Aquecimento sem caminhada

O aquecimento não contém marchas, caminhadas ou deslocações. A ativação inicial usa «Saltos militares de aquecimento» (jumping jacks), começando com ritmo suave. Com baixo impacto ativo, usa «Saltos militares adaptados (sem salto)», abrindo um pé de cada vez no mesmo lugar. As transferências em Cossack mantêm os pés fixos; o anterior inchworm foi substituído por prancha dinâmica com elevação da bacia e apoios fixos. Exclusões e dificuldade continuam a ser respeitadas.

Ao abrir um treino guardado antigo, as referências de aquecimento com caminhada são substituídas, mantendo séries, intervalos e duração total. Esta preferência nova sobrepõe-se à repetição do aquecimento antigo. Na recuperação de uma sessão em curso, só se atualizam etapas de aquecimento ainda por cumprir; as etapas já passadas e o histórico de execuções mantêm-se.

### Objetivo de repetições e bips de cadência

As flexões e restantes exercícios configurados por repetições passam a ter um objetivo calculado com base no intervalo, nível e dificuldade da variante, em vez de um teto fixo de 10/12/14. Por exemplo, no nível iniciante, 45 segundos propõem 15 flexões. É uma proposta de ritmo editável, não uma previsão da capacidade física individual. Isometrias e movimentos por tempo mantêm o temporizador.

Durante um exercício por repetições, o objetivo e a contagem aparecem em destaque (`0 / 15`, `1 / 15`, …), com o tempo restante em tamanho menor. Cada incremento tem um bip de cadência. Os bips adicionais dos últimos cinco segundos são omitidos nestas etapas para não serem confundidos com repetições. O bip de início/transição continua a ser um sinal separado, antes da cadência.

A contagem partilha o relógio com o ecrã, pausa e retoma com a sessão. Objetivos automáticos são recalculados após alterações de tempo; um valor de repetições explicitamente editado fica identificado como manual. Ao abrir planos antigos, recalculam-se os objetivos sem marcação manual; numa sessão em curso, apenas se atualizam séries ainda não iniciadas. Não há alteração da duração dos intervalos, descansos ou sessão. AMRAP continua ao ritmo individual, com confirmação manual, sem inventar uma cadência imposta à janela inteira.

### Perfil avançado inspirado no circuito de referência

O nível avançado deixa de significar apenas «permitir todas as dificuldades». O motor distingue complexidade técnica de exigência da sessão: agachamentos clássicos podem continuar no WOD com maior volume, enquanto elevações em Y/T/W/I, mobilidade escapular e movimentos leves de braços são classificados como ativação e retirados dos blocos principais avançados. As elevações em Y podem aparecer no aquecimento. Substituições, regeneração e inclusão manual respeitam o mesmo filtro. A biblioteca continua a disponibilizar os movimentos de ativação para outros níveis/contextos.

Full Body, Circuito funcional e Treino misto avançados incluem um bloco de referência com **burpees, lunges, flexões, agachamentos e sit-ups**. As séries principais são mais longas, preservando o tempo total. Num exemplo de 60 minutos com 5 minutos de aquecimento e 5 de retorno à calma, o bloco A tem duas voltas de cinco exercícios, 75s de execução e 15s de descanso por exercício, somando 15 minutos. Os objetivos são 17 burpees, 34 lunges, 27 flexões, 34 agachamentos e 20 sit-ups por volta. Não se copiam 20/40/30/40/20 para intervalos em que essa cadência não cabe; intervalos mais longos permitem aproximar esses números. Em AMRAP, as quantidades de referência são objetivos por volta, confirmados ao ritmo do utilizador, sem imposição de uma duração individual por exercício.

Os restantes blocos mantêm alternância muscular, variantes exigentes e trabalho da cadeia posterior/ombros. Sem equipamento, esse bloco posterior continua limitado a estabilização, extensão e dobradiças; não é apresentado como equivalente de puxadas com carga. «Baixo impacto» mantém alternativas sem saltos, incluindo burpees sem salto, sem regressar a elevações leves dos braços como trabalho principal. Esta programação é uma regra geral do produto e continua sujeita à revisão profissional já descrita.

### Mountain climbers e abdominais com apoio

A biblioteca inclui mountain climbers normais, lentos e cruzados, também pesquisáveis por «Escaladores em prancha». Já existiam crunches, bicycle crunches, tesouras deitado, tuck-ups e Russian twists com os pés apoiados. Foram acrescentadas quatro variantes distintas: tesouras verticais com apoio nos antebraços, encolhimentos de joelhos sentado com apoio das mãos, Russian twists com pés elevados sem carga e elevações de joelhos com apoio nos antebraços. Cada uma tem instruções, convenção de contagem, alternativas, mapa muscular e posições SVG próprias. Bicycle crunches também recebeu ilustração específica.

A identificação das fotografias é descritiva e, no caso inferior direito, apenas provável: uma fotografia não confirma a sequência de execução ou se «3×30» significa segundos ou repetições. Não foram importadas promessas de transformação corporal, cargas ou quantidades do anúncio. A variante Russian twist mantém-se sem carga, de acordo com a regra de treino sem equipamento. Referências descritivas consultadas: [biblioteca de exercícios da Universidade de Keele](https://www.keele.ac.uk/study/campuslife/sportatkeele/activekeele/exerciselibrary/) e [Russian twist — NASM](https://www.nasm.org/resource-center/exercise-library/russian-twist). Continua pendente a revisão técnica profissional das ilustrações e da programação.

### Correção de gravação em Safari / iPhone (v1.7.1)

O armazenamento mantém a chave `bodywod.v1`, com um formato interno compacto que partilha subárvores JSON iguais (exercícios, etapas e planos). A leitura aceita os dados antigos; a primeira gravação bem-sucedida converte-os sem eliminar registos. Na leitura, cada referência é reconstruída independentemente para preservar as cópias históricas. Os backups exportados continuam em JSON completo, versão 1, compatíveis com a importação existente. Depois de migrar, usar esta versão ou posterior: versões antigas não compreendem o formato interno compacto.

Num cenário de teste com um treino avançado de 60 minutos repetido em dez registos, plano guardado e sessão, a estimativa UTF-16 passou de 3108 KB para 87 KB (97% de redução). Esta medida não determina a quota efetiva de um dispositivo nem confirma a causa do erro observado no iPhone. O Safari pode recusar operações por quota ou permissões; a aplicação distingue essas exceções e apresenta o nome do erro nas definições.

Se uma escrita falhar, o estado mais recente permanece em memória, disponível na exportação, sem declarar a gravação concluída. O último conteúdo persistido não é apagado. Um aviso permanente oferece exportação e nova tentativa; as tentativas automáticas após falha têm intervalo de 30 segundos. Fechar/recarregar pode perder alterações apenas em memória. Se a leitura inicial falhar, a aplicação impede escritas para não substituir dados antigos que não conseguiu ler.

Validação: 61 testes, incluindo quota simulada, permissões bloqueadas, getter de localStorage que lança exceção, migração, preservação das versões históricas, repetição/exportação/recuperação, e gravação compacta numa quota que rejeita os dados antigos. Interface verificada no navegador local com viewport 390 × 844; não foi efetuado teste num iPhone físico. O ficheiro autónomo `BodyWOD.html` foi reconstruído. A cópia publicada em GitHub Pages precisa de receber esse ficheiro atualizado.

### Avançado com maior densidade (v1.8.0)

Mantêm-se os três níveis e as regras dos níveis iniciante e intermédio. O avançado aumenta as metas de repetições e usa 10 segundos de recuperação entre exercícios. No EMOM avançado são 55 segundos de execução e 5 de recuperação; o AMRAP mantém execução livre e contagens confirmadas pelo utilizador.

Nas flexões dinâmicas do avançado, a cadência é 1 repetição a cada 1,5 segundos, com uma pausa de 10 segundos após cada grupo de 15. O gerador reserva janelas de 120 segundos quando o bloco tem espaço; em blocos mais curtos adapta a janela sem ultrapassar a duração pedida. As janelas incluem 6 segundos de preparação, os bips de execução e as pausas: uma janela de 120 segundos permite 56 repetições, com o último bip aos 118,5 segundos. O contador fica parado nas pausas, o cronómetro mostra a recuperação e a voz anuncia a pausa e o regresso. Flexões lentas, excêntricas e com pausa mantêm cadência própria; isometrias não recebem contagem dinâmica.

Exemplo Full Body avançado, 60 minutos com 5 de retorno à calma: bloco A de 15 minutos, duas voltas de 21 burpees / 70s, 42 lunges / 70s, 56 flexões / 120s, 42 agachamentos / 70s e 32 sit-ups / 70s, com 10s entre exercícios. As pausas internas das flexões estão incluídas nos 120s. A contagem é um ritmo proposto, não repetições detetadas nem uma avaliação individual. O ecrã recomenda manter amplitude e técnica e abrandar ou pausar quando necessário.

Os planos novos recebem as janelas maiores. Ao recuperar uma sessão antiga, apenas as metas de etapas futuras podem ser atualizadas: etapas já iniciadas e tempos guardados não são reprogramados. Para obter a distribuição nova de dois minutos, gerar um novo treino avançado. Backups e histórico mantêm os protocolos no plano; a recuperação dentro de uma pausa permanece em pausa.

### Versão visível da aplicação

O rodapé de todos os ecrãs mostra `Versão 1.01` em pequeno. A fonte única é `src/version.js`, independente da versão do formato de dados. Em cada nova alteração entregue, executar `npm run release` uma vez: incrementa 1.01 → 1.02 → 1.03 e reconstrói o HTML. Para repetir a compilação da mesma alteração, usar `npm run build`, que não incrementa. O build sincroniza a versão da cache offline e inclui a versão no HTML autónomo.

### Avançado em todos os exercícios — versão 1.02

Esta revisão substitui a prioridade especial das flexões por uma distribuição comum a todos os movimentos principais. O gerador usa menos voltas e janelas maiores (até 120s), mantendo o tempo total escolhido. Num Full Body de 60 minutos, as janelas dos blocos principais ficam aproximadamente entre 110 e 120s, incluindo o cardio por tempo e as isometrias. Em sessões curtas, as janelas adaptam-se ao tempo disponível; não são acrescentados minutos ao treino.

Todos os exercícios principais por repetições têm agora perfil explícito de cadência e pausa por grupos: normalmente 1,5s por repetição, 2s em movimentos mais complexos e da cadeia posterior, 3s em burpees/inchworm, e 3,5s nas variantes explicitamente lentas, excêntricas ou com pausa. Os grupos têm 15 repetições (10 nos burpees/inchworm), seguidos de 10s de recuperação interna. O mesmo perfil controla metas, bips, voz e contador, com os valores reais apresentados na pré-visualização e durante a execução. As flexões deixam de receber uma reserva exclusiva de 120s em detrimento dos outros exercícios.

Isometrias e cardio por tempo permanecem sem contagem inventada de repetições: recebem janelas maiores e recuperação entre exercícios de 10s. EMOM conserva 55s/5s e os perfis de repetições dentro do minuto. AMRAP mantém ritmo livre: dois grupos de repetições por movimento e referências de 60s para execução por tempo, sem contagem automática de voltas. Aquecimento, retorno à calma, iniciante e intermédio conservam as regras anteriores.

Validação: 72 testes, incluindo todos os perfis avançados elegíveis, bips e pausas em cada perfil, cobertura das seis categorias musculares, isometrias/cardio, tempos exatos, modalidades, edição e recuperação. O novo gerador exige criar um novo treino; sessões já iniciadas não são redistribuídas.

### Pronúncia — versão 1.03

A camada de voz envia `Fléxões` ao sintetizador para pedir o é aberto solicitado pelo utilizador. A transformação abrange nomes, avisos de próximos exercícios e o teste de som. A escrita dos exercícios, dados guardados e textos apresentados continua `Flexões`; apenas o texto da fala recebe a adaptação. A realização sonora depende da voz pt-PT instalada e pode ser ouvida através de «Testar som: bips e voz». Validado o texto enviado à API de voz e a preservação dos textos de apresentação.

### Abertura direta no Safari do Mac — versão 1.04

O `index.html` anterior era a entrada modular de desenvolvimento. Ao abri-lo diretamente como ficheiro local, o Safari não carregava os módulos JavaScript e a página ficava vazia. A compilação gera agora **dois ficheiros autónomos idênticos**, `index.html` e `BodyWOD.html`, ambos com CSS e JavaScript incorporados. Qualquer um pode ser aberto como ficheiro ou servido por HTTP/HTTPS, sem alterar as permissões do navegador. O modelo modular foi movido para `src/shell.html`, usado apenas como entrada da compilação. Editar o modelo e os módulos, depois executar o build; não editar os dois HTML gerados manualmente.

O formato de armazenamento e os registos guardados não foram alterados. Abrir por ficheiro e abrir por HTTP/HTTPS pode usar espaços de armazenamento diferentes do navegador; a aplicação não transfere automaticamente dados entre esses contextos.

### Aba Contador — versão 1.05

O FitTempo fornecido pelo utilizador foi integrado na aba «Contador», com os modos Automático e Séries por toque, ritmo/BPM/cadência, voz pt-PT, bips, cronómetro e histórico próprios. A cópia original está preservada em `src/counter/source.html`; o ficheiro da outra aplicação não foi alterado. A compilação prepara a cópia integrada com estilos e ícones locais, sem Tailwind/Lucide/fontes carregados da internet, e incorpora-a nos dois HTML autónomos. Não é necessário copiar a pasta da outra app para usar ou publicar o BodyWOD.

O contador mantém-se carregado ao navegar entre abas. Ao sair da aba ou colocar a página em segundo plano, os temporizadores e o som ficam em pausa; ao regressar, a contagem e os valores permanecem, sem retoma automática. Recarregar ou fechar a página reinicia a sessão corrente do contador, como na app original. O histórico concluído conserva a chave `fittempo_history`, separado de `bodywod.v1`, e consulta-se pelo ícone de histórico dentro do contador. O backup BodyWOD existente cobre os dados do treino funcional; o histórico do contador permanece separado. Dados de outro endereço/navegador não são transferidos automaticamente. Se a gravação do contador for bloqueada, os resultados permanecem em memória e o contador apresenta um aviso.

Os estilos e a lógica do FitTempo ficam num documento incorporado para não interferirem com o treino funcional. `scripts/counter-assets.mjs` prepara os recursos locais; `src/counter.js` gere a aba e a pausa na navegação. O modelo `src/shell.html` conserva o painel enquanto a navegação principal muda de ecrã.

Validação da integração: 79 testes passaram; no navegador foram verificados o arranque automático, a pausa ao mudar de aba, a preservação das séries por toque e o ecrã com 390 × 844. O histórico já existente do treino funcional permaneceu disponível.

### Escolha inicial — versão 1.06

Cada abertura apresenta um ecrã inicial com dois botões grandes: **Crossfit**, que abre a área existente de treino funcional, e **FitTempo**, que abre diretamente o contador. A escolha não é memorizada, para voltar a perguntar em cada abertura. O ecrã de escolha não mostra a navegação de exercícios/histórico. A área FitTempo também não apresenta esses menus do treino funcional; o botão «Escolher app» no cabeçalho permite regressar à escolha, pausando o contador sem apagar a contagem. A área Crossfit conserva os seus cinco separadores e o mesmo botão para escolher outra app. Dados e sessões guardadas mantêm-se.

### Título — versão 1.07

O título apresenta BODYWOD como uma palavra única em todos os cabeçalhos. BODY mantém a cor clara e WOD a cor verde.

### Paletas por aplicação — versão 1.08

A área Crossfit usa fundos, painéis, controlos e destaques em verdes. A área FitTempo usa azuis, tanto no cabeçalho e definições do BodyWOD como no contador incorporado: anéis, números, botões, seletores, fases, séries por toque e histórico. A compilação aplica a paleta azul à cópia integrada do contador, incluindo as cores usadas em alterações de estado, sem modificar a app original. Avisos/ações destrutivas e as cores informativas dos mapas musculares conservam o seu significado. O ecrã inicial conserva o botão Crossfit verde e FitTempo azul.

### Assinatura — versão 1.09

Os cabeçalhos apresentam «Nuno Leal» em pequeno por baixo de BODYWOD, no ecrã inicial e nas duas áreas da app.

### Botão de início — versão 1.10

O acesso à escolha Crossfit/FitTempo passa a ser um botão com ícone de casa no topo direito, junto às definições. Substitui o botão de texto «← Escolher app». O logótipo e a assinatura mantêm-se à esquerda.

### FitTempo sem barra duplicada — versão 1.11

A barra interna com o logótipo FitTempo e os botões de voz/som/histórico deixa de aparecer. O botão de configurações no cabeçalho BodyWOD passa a abrir as definições reais do FitTempo quando se está nessa área: Voz guia, Som do metrónomo e Histórico do FitTempo. As opções refletem e alteram diretamente o contador incorporado, sem interferir com as preferências do Crossfit. O cabeçalho original permanece oculto no documento incorporado para preservar os controlos internos e as respetivas funções; a app original não é modificada.

Validação da versão 1.11: 80 testes passaram; verificados no navegador a ausência da barra, a alteração real e leitura posterior de voz/som pelas definições do topo e a abertura/fecho do histórico do contador.

### Enchimento das séries automáticas — versão 1.12

No FitTempo, em «Séries por toque → Automático», o quadrado começa a encher de azul após medir a duração da primeira série. O enchimento usa o mesmo relógio e o mesmo instante da próxima série que a contagem: chega ao fim do ciclo e recomeça na série seguinte. Mostra também a percentagem e um indicador de progresso acessível. Ao pausar ou mudar de área, fica parado no mesmo ponto; ao retomar continua, e ao repor/recalibrar é limpo. A contagem manual por toque não apresenta enchimento de tempo, pois não tem uma duração conhecida.

Validação da versão 1.12: 83 testes passaram, incluindo ciclo de 3 segundos, pausa, reinício e reposição do enchimento. No navegador, verificada a medição de uma série, o avanço automático para a seguinte e a pausa do enchimento a 84%.

### Meta de séries e perímetro — versão 1.13

Em «FitTempo → Séries por toque», é possível escolher «Livre» ou indicar o número de séries. A opção aplica-se tanto à contagem manual como à automática. Com meta, uma linha percorre o perímetro do quadrado à medida que as séries ficam concluídas, acompanhada pela indicação «concluídas / meta». O interior continua a mostrar apenas o tempo da série automática, após calibração. Ao atingir a meta, o cronómetro e a contagem param; os indicadores ficam completos. «Desfazer» permite retomar e «Repor» limpa a sessão conservando a meta escolhida. A meta pode ser alterada durante uma pausa sem perder o enchimento atual. O modo livre não tem perímetro nem limite de séries.

O código da contagem integrada passa a estar em `src/counter/manual.js`; o original fornecido permanece intacto. Validação: 90 testes passaram, incluindo limite em callbacks atrasados, instante final exato, pausa, desfazer, retoma, reposição e edição da meta. Verificada também a apresentação no navegador em largura de telemóvel.

### Contagem ampliada — versão 1.14

O número dentro do quadrado das séries por toque passa a ocupar quase toda a área disponível. O tamanho adapta-se à largura, altura e quantidade de algarismos; «Séries» e a percentagem ficam discretos junto à base. O ícone «+» deixa de ocupar espaço e a contagem mantém o contraste durante a pausa. Os enchimentos de tempo e perímetro continuam visíveis. Compilação validada e 90 testes passaram.

### Perímetro contínuo e duração prevista — versão 1.15

Em séries por toque automáticas com meta e duração calibrada, o perímetro soma as séries concluídas à fração decorrida da série atual. Avança continuamente com o mesmo relógio do enchimento interior, sem saltar na passagem de série; pausa e conclusão mantêm ambos sincronizados. Na contagem manual, o perímetro continua a representar as séries efetivamente registadas.

Um painel «Duração prevista» mostra o número de séries multiplicado pela duração calibrada, incluindo a primeira série. Apresenta também o tempo restante, que exclui as pausas. Antes da calibração, indica que é necessário medir a primeira série; em modo livre não apresenta uma previsão total. Exemplo validado: 100 séries de 4 segundos = 06:40. A previsão atualiza-se ao alterar a meta e é limpa ao repor/recalibrar.

Validação: 93 testes passaram, incluindo continuidade entre séries, previsão e tempo restante, pausa, alteração de meta e reposição. Confirmado no navegador o painel de duração e o perímetro numa fração da série.

### Metas no Automático — versão 1.16

O separador principal «Automático» permite definir a meta por repetições ou por séries, mantendo o campo de repetições por série. Na opção séries, 100 séries de 10 repetições configuram 1000 repetições e exatamente 100 séries no motor existente. Alterar as repetições por série conserva o número de séries escolhido. As predefinições regressam à sua meta original por repetições; os campos ficam bloqueados durante o treino.

Em «Séries por toque → Automático», as metas deixam de ficar bloqueadas ao iniciar a medição da primeira série. Podem ser escolhidas e alteradas durante a preparação sem parar a medição. Depois da calibração, podem ser alteradas ao pausar, conservando o progresso.

Validação: 96 testes passaram; confirmados no navegador o acesso às metas durante a preparação automática e a configuração de 100 séries no separador principal.

### Celebração de conclusão — versão 1.17

Ao concluir uma meta no FitTempo (treino automático ou séries por toque), abre-se um popup com taça dourada, confettis e a mensagem «Parabéns!». Mostra o resultado e um botão «Continuar». A conclusão reproduz uma curta melodia e a voz «Parabéns! Treino concluído.», respeitando as opções de som e voz. A última contagem não substitui a mensagem de parabéns. A celebração não se repete ao renderizar ou pausar uma meta já concluída. Desfazer e completar novamente permite celebrar de novo.

O popup usa um diálogo modal nativo com foco no botão de fecho; pode fechar-se também com Escape. Os confettis respeitam a preferência de movimento reduzido. O fecho e a saída da área cancelam os sons pendentes. O histórico do modo automático mantém o comportamento anterior.

Validação: 99 testes passaram, incluindo abertura única, voz de parabéns, melodia, fecho, limpeza dos efeitos, conclusão nos dois modos e preservação do histórico. Popup e botão «Continuar» verificados no navegador.

### Início explícito da medição — versão 1.18

Escolher «Séries por toque → Automático» prepara o modo e deixa o cronómetro parado. A medição da primeira série começa apenas no botão «Iniciar». Antes disso, o quadrado não regista séries e as metas continuam disponíveis. Ao iniciar, a mensagem pede para tocar no quadrado quando a primeira série terminar; a duração medida passa a controlar as séries seguintes. Mudar de modo ou repor também deixa a medição parada.

Validação: 100 testes passaram, incluindo tempo decorrido antes de Iniciar sem alterar o cronómetro, meta configurável sem arranque, calibração após início explícito e ausência de reinício ao mudar de modo. Fluxo confirmado no navegador.

### Controlos das séries automáticas — versão 1.19

O botão «Desfazer última série» deixa de aparecer e de atuar no modo Automático das séries por toque. A linha de ações mostra apenas Iniciar/Pausar/Retomar e Repor. O botão Desfazer continua disponível no modo Manual para corrigir toques. Validados os testes das séries e dos dois ficheiros HTML (15 testes) e a ausência do botão no navegador.

### Cópia completa em JSON — versão 1.20

As definições do Crossfit e do FitTempo incluem «Cópia de segurança · toda a app», com os botões **Exportar JSON** e **Importar JSON**. O ficheiro `bodywod-completo-AAAA-MM-DD.json` reúne:

- Crossfit: histórico (de onde é calculado o número de treinos efetuados), favoritos, exclusões, planos guardados, notas e avaliações, definições de áudio, último plano, configuração do gerador, sessão em pausa e resumo por guardar.
- FitTempo: histórico disponível, definições de som/voz, configuração de repetições, séries, ritmo, preparação, pausas e cadência, contagem e duração medida das séries por toque e progresso do treino automático. Os temporizadores e o bloqueio do ecrã não são serializados; a recuperação fica em pausa.

O formato inclui `format: bodywod.backup`, `backupVersion: 2`, versão da app e data de exportação. A importação continua a aceitar os antigos ficheiros JSON do Crossfit. O ficheiro é validado antes de alterar dados; os registos são reunidos por identificador (ou pelo conteúdo nos registos antigos do FitTempo), sem duplicar importações repetidas. As definições do ficheiro são recuperadas. Planos/registos e sessão já presentes no dispositivo são preservados; uma sessão do ficheiro é recuperada quando não existe outra. O limite de leitura é 100 MB. Não há envio para um servidor.

O FitTempo passa a sincronizar os seus dados com a gravação principal da app. As séries por toque com meta concluída também passam a criar um registo no histórico. Repetir a conclusão após desfazer atualiza o mesmo registo. O limite antigo de 20 registos foi removido para os treinos futuros; registos anteriormente descartados não podem ser reconstruídos. Falhas de gravação mantêm os dados em memória e disponíveis para exportação. A importação escapa os textos mostrados no histórico do FitTempo.

Validação: testes de exportação/importação completa, compatibilidade com JSON antigo, importação repetida, preservação da sessão existente, ficheiros inválidos, memória em caso de quota, sincronização autenticada entre a app e o contador e recuperação sem arranque de temporizadores. Exportação completa gerada e controlos verificados no navegador.

### Definições FitTempo simplificadas — versão 1.21

Retirado o botão «Histórico do FitTempo» e o título «Os teus registos» das definições. Os registos continuam guardados e incluídos na exportação/importação JSON. Validados 7 testes de integração e dos ficheiros HTML, e confirmada a ausência do botão no navegador.

### Botões de dados — versão 1.22

Os botões de cópia de segurança passam a chamar-se «Exportar dados» e «Importar dados», ambos com ícones de transferência correspondentes. A alteração aplica-se às definições das duas áreas, através do componente partilhado. Compilação concluída e apresentação confirmada no navegador.

### Aviso antes da contagem — versão 1.23

O aviso de início/retoma termina antes de arrancarem os números. No Crossfit, a apresentação do exercício e o «Começa» após as micropausas suspendem o relógio das repetições até ao fim da voz. O tempo dessa fala não consome a janela das repetições e não se acumulam números na fila para serem reproduzidos rapidamente. Pausar durante o aviso mantém o treino pausado.

No Automático do FitTempo, a primeira repetição de cada série espera pelo fim de «Começa». A recuperação do trabalho em pausa segue a mesma sequência. A preparação pendente é cancelada ao pausar, repor ou sair do FitTempo. Com voz desligada ou sem voz pt-PT disponível, a contagem prossegue sem esperar por uma fala inexistente. Há recuperação em caso de erro da síntese de voz.

Validação: 111 testes passaram, incluindo suspensão do relógio durante a fala, cadência correta nas primeiras repetições após a retoma, cancelamento durante o aviso e ausência de voz portuguesa. Verificado no navegador o arranque e a passagem entre séries; o treino usado na verificação foi reposto sem criar um registo concluído.

### Contagens ajustadas ao movimento — versão 1.24

As propostas de repetições usam agora a duração de execução de cada movimento. Flexões e agachamentos clássicos têm uma cadência mínima de 4 s no iniciante, 3,5 s no intermédio e 3 s no avançado. Variantes com pausa, excêntrica ou descida lenta recebem mais tempo; movimentos compostos e técnicos também têm cadências próprias. O número proposto baixa para caber no intervalo com preparação, pausas e tempo para completar a última repetição.

Exemplo: flexões avançadas em 120 s passam a 31 repetições, com 3 s por movimento e duas pausas de 10 s. A contagem deixa de encurtar a cadência definida para encaixar repetições a mais. As edições que excedem a capacidade do intervalo são rejeitadas. Ao abrir planos antigos ou recuperar sessões, as etapas futuras são ajustadas (incluindo metas manuais excessivas); etapas já iniciadas e registos históricos mantêm o progresso. A cadência aparece na pré-visualização dos exercícios com repetições.

No FitTempo, a predefinição «100 Flexões» passa a 20 BPM (3 s/repetição). «Agachamento Tempo» mantém o movimento de 5 s. As configurações personalizadas guardadas continuam disponíveis.

Validação: 116 testes passaram. Verificados todos os exercícios por repetições nos três níveis e em intervalos de 15 a 120 s, incluindo tempo para concluir o último movimento, bips, micropausas, edição e migração de planos. Confirmada no navegador a pré-visualização com cadências e objetivos recalculados.

### Acesso direto aos treinos guardados e favoritos — versão 1.25

«Meus treinos» e «Biblioteca» passam a apresentar um botão «Exportar / importar dados». Abre o painel «Os teus dados», com os botões existentes de exportação e importação, sem ser necessário procurar nas definições. O painel mostra explicitamente a quantidade de treinos guardados e de exercícios favoritos e identifica-os na descrição do conteúdo da cópia. O formato JSON completo e a junção sem duplicados mantêm-se.

Validação: 7 testes de cópia de segurança e dos ficheiros HTML passaram, incluindo treino guardado marcado como favorito, notas e identificador real de exercício favorito. Confirmados no navegador os acessos em Meus treinos e na Biblioteca.

### Dados comuns no menu principal — versão 1.26

A exportação e importação passam a ser acessíveis exclusivamente por dois botões com ícones no topo direito do ecrã de escolha Crossfit/FitTempo. Ambos operam sobre a cópia completa das duas áreas. Os nomes acessíveis e as dicas identificam as ações sem texto visível nos botões. Foram retirados os acessos repetidos das definições, Biblioteca e Meus treinos. O seletor de ficheiro é agora global, para funcionar diretamente no menu principal. Os avisos de falha de gravação encaminham para esse ecrã.

Validação: 7 testes de cópia de segurança e dos ficheiros HTML passaram; confirmada no navegador a presença dos dois ícones no menu principal.

### Velocidade por exercício — versão 1.27

As flexões clássicas passam a usar 2 segundos por repetição nos três níveis. Durante os exercícios Crossfit com contagem automática, os botões **+** e **−** permitem acelerar ou abrandar em passos de 0,25 s, mostrando os segundos por repetição. A preferência fica guardada por exercício (entre 0,5 e 10 s) e é aplicada aos treinos seguintes, sem alterar o ritmo dos outros exercícios.

Mudar a velocidade mantém as repetições já contadas, a fração do movimento em curso e as micropausas. A duração da etapa atual, das etapas futuras do mesmo exercício e o tempo total restante são recalculados. Depois de um ajuste pessoal, a duração efetiva do plano pode diferir dos minutos inicialmente pedidos. Sessões em pausa e histórico conservam a sequência ajustada; as preferências são incluídas na exportação/importação de dados.

No FitTempo, a predefinição «100 Flexões» passa a 30 BPM (2 s/repetição). As configurações personalizadas guardadas continuam disponíveis.

Validação: 124 testes passaram, incluindo alterações durante movimentos e micropausas, preservação da contagem, recuperação e cópia de segurança. Confirmado no navegador o ajuste de 2,5 para 2 s por flexão: manteve 3 de 27 repetições e recalculou o tempo restante de 51:48 para 51:33. Após recarregar e recuperar a sessão, o ritmo e o progresso mantiveram-se, em pausa. Pré-visualização: `assets/previews/personal-pace-1.27.png`.

### Duração personalizada em destaque — versão 1.28

A criação de treinos apresenta um painel «Duração personalizada», com campo de minutos e indicação do intervalo de 10 a 180 minutos inteiros. Mantêm-se os atalhos de 20, 30, 45 e 60 minutos. Escrever outro tempo retira imediatamente a seleção dos atalhos; mudar o nível ou a modalidade conserva o valor indicado. O tempo inclui aquecimento e retorno à calma, respeitando o mínimo de 3 minutos para o bloco principal.

Validação: 18 testes de geração, relógio, persistência e ficheiros HTML passaram. Confirmado no navegador um treino personalizado de 37 minutos, com duração de 37:00 e recuperação do valor ao voltar à configuração. Pré-visualização: `assets/previews/custom-duration-1.28.png`.

### Arranque e continuidade da voz — versão 1.29

As falas mantêm uma referência ativa até terminarem, para não dependerem da vida de uma variável local no motor de voz. Números atrasados deixam de se acumular na fila. Se o navegador omitir o evento de fim, a app deteta que o motor está livre; se nem iniciar a fala, liberta o relógio após uma espera curta, em vez de o deixar parado até 15 segundos. Pausar cancela as falas e os controlos de recuperação pendentes.

O anúncio do exercício termina com «Começa». A execução parte de zero depois desse aviso e a primeira repetição ocorre após uma cadência, sem os seis segundos adicionais de preparação. Os intervalos entre repetições e as micropausas são preservados, assim como a duração programada. Etapas já iniciadas numa sessão recuperada mantêm o progresso. A retoma manual também espera pelo fim de «Começa». O FitTempo recebe a mesma retenção da fala e recuperação quando faltam eventos de voz.

Validação: 128 testes passaram, incluindo a recuperação da voz no FitTempo. Cobertos eventos de início/fim ausentes, callbacks tardios, dez contagens consecutivas, cancelamento ao pausar e arranque em zero. No navegador, verificados relógio a avançar e voz até «quatro» num treino de teste num endereço local separado, preservando a sessão original do utilizador.

### Sequências personalizadas no FitTempo — versão 1.30

O FitTempo tem agora os modos «Contador» e «Sequências». O editor usa o catálogo do Crossfit, com pesquisa e listas por Aquecimento, Peito, Bíceps, Tríceps, Ombros, Pernas e glúteos, Costas, Abdominais, Cardio e corpo inteiro e Retorno à calma. Cada linha permite definir repetições ou segundos, séries e descanso, além de subir, descer ou retirar o movimento. As séries de cada exercício são executadas consecutivamente antes do exercício seguinte.

«Simular e medir ritmo» permite indicar quantas repetições serão feitas, esperar pela voz de início e tocar em «Terminei» ao concluir. O tempo cronometrado é dividido pelas repetições e guardado por exercício, com duas casas decimais; também pode ser introduzido diretamente (por exemplo, 1,33 s). Este ritmo é reutilizado em futuras sequências. A medição é manual, sem deteção dos movimentos pela câmara.

A duração prevista é recalculada de imediato: soma a execução de todas as séries e os descansos após cada série, incluindo a troca de exercício, sem descanso depois da última série da sequência. As falas de apresentação e as pausas manuais ficam fora da previsão. Exemplo: 2 × 15 flexões a 1,33 s, com descansos de 10 s, mais 10 burpees a 5 s, totalizam 109,9 s (01:50 no ecrã).

A execução anuncia exercício, série, repetições, início e descanso em voz portuguesa, conta as repetições com voz e bip e apresenta contadores grandes, série atual, duração prevista, tempo restante e progresso. Nas etapas por tempo, mostra os segundos e dá avisos nos cinco segundos finais. A demonstração fica disponível em «Ver como fazer». O relógio espera pelo fim da apresentação. A disponibilidade da voz depende de uma voz pt-PT no dispositivo; a app mostra um aviso quando não existe. Pausar, mudar de área ou ocultar a página suspende a sequência. A recuperação fica em pausa e conserva o progresso. Há pedido de ecrã ativo durante execução e simulação, nos dispositivos compatíveis.

O rascunho, as sequências nomeadas, os ritmos, o histórico de sequências concluídas e a sessão em pausa ficam na gravação principal. Os ícones comuns de exportar/importar dados incluem também estes campos; a importação valida os dados e junta planos e histórico sem duplicar. O contador anterior e os treinos Crossfit mantêm os seus dados.

Validação: 138 testes passaram, incluindo cobertura de todo o catálogo, totais com cadências decimais, séries, descansos, fases por tempo, medição, última repetição, falhas de voz, recuperação e cópia de segurança. No navegador, confirmados pesquisa/filtro de Bíceps, edição de 1,33 s, total 01:50, gravação de sequência nomeada e persistência após recarregar, simulação cronometrada, conclusão de duas séries, passagem para burpees e recuperação com 4 de 15 repetições em pausa. Os testes de execução foram feitos num endereço local separado. Imagens: `assets/previews/sequence-builder-1.30.png` e `assets/previews/sequence-active-1.30.png`.

### Segundos com vírgula ou ponto — versão 1.31

Os campos de tempo das sequências aceitam décimas e centésimas com vírgula ou ponto: `1,33` e `1.33` representam o mesmo valor. Os segundos são guardados como número, sem arredondar para um inteiro, e os totais continuam a usar a cadência decimal. O campo por tempo («Segundos por série») também aceita centésimas.

Na simulação, foi acrescentado um painel explícito «Tempo por repetição (segundos)», com «Guardar tempo e voltar». Permite definir diretamente o ritmo sem cronometrar. «Número de repetições a simular» continua a ser uma quantidade inteira e tem uma explicação para o distinguir do tempo. A edição não normaliza o campo enquanto se escreve, permitindo introduzir a vírgula ou ponto sem perder o separador; valores inválidos não substituem o ritmo guardado nem permitem iniciar um plano com entradas inválidas.

Validação: 139 testes passaram. Verificados no navegador `1,33` no editor e `1.33` na simulação, gravação normalizada em `1,33`, quantidade mantida em 3 repetições e total 01:50 preservado no exemplo. Trabalho efetuado na pasta GitHub Desktop/BodyWod V2; o servidor local passa a servir essa pasta. Imagem: `assets/previews/decimal-seconds-1.31.png`.

### Valores gerais e confirmação de velocidades — versão 1.32

O editor de sequências começa com «Valores gerais»: séries e repetições a usar nos novos exercícios (por defeito, 3 séries de 10). Cada exercício mantém a edição individual. Alterar os valores gerais não substitui as escolhas já feitas; o botão «Aplicar também aos exercícios já inseridos» permite fazê-lo explicitamente. Nos movimentos por tempo, só muda o número de séries. Os valores gerais ficam guardados com a sequência e podem ser recuperados em planos antigos através de valores compatíveis.

«Testar velocidade» executa um ensaio de 3 repetições à cadência guardada, com voz, bips e contadores. O teste não cria histórico nem substitui uma sessão de treino guardada. «Testar velocidades antes de treinar» percorre os exercícios por repetições, sem duplicar movimentos repetidos na sequência. Após cada ensaio, é possível confirmar e avançar, repetir, ajustar ou saltar para o seguinte. «Medir / ajustar ritmo» mantém as opções de cronometrar a execução e de escrever os segundos diretamente.

O check «Velocidade confirmada» guarda a confirmação por exercício e pela cadência exata. O cartão fica verde quando essa velocidade está confirmada; os restantes mantêm-se azuis. Alterar a cadência retira a confirmação e volta a azul, incluindo alterações feitas por medição ou introdução direta. Alterar apenas séries ou repetições mantém a confirmação. A confirmação acompanha os exercícios em novas sequências e integra a exportação/importação de dados. A importação continua a aceitar os backups anteriores.

Validação: 143 testes passaram, incluindo herança dos valores gerais, exceções por exercício, aplicação conjunta preservando tempos/descansos, invalidação da confirmação ao alterar o ritmo, ensaio independente da carga de treino e cópia de segurança. No navegador: novos agachamentos herdaram 4 séries de 20 repetições; a aplicação geral de 3 × 12 permitiu depois ajustar apenas os agachamentos para 18; ensaios de flexões e burpees concluíram com possibilidade de confirmar/saltar. Confirmação, cartão verde e valores gerais persistiram após recarregar. A mudança de 1,33 para 1,5 s desmarcou o check e atualizou o contador de confirmações. O histórico manteve 2 treinos e a sessão anterior em pausa foi preservada durante os ensaios. Verificações realizadas num endereço local separado. Imagens: `assets/previews/general-defaults-1.32.png` e `assets/previews/verified-pace-1.32.png`.

### Lista compacta e tempos por fase — versão 1.33

Os exercícios inseridos aparecem fechados, numa única linha com nome, séries × repetições (ou segundos), duração e indicação de velocidade confirmada. Tocar na linha abre os ajustes, os controlos de ordem e remoção, o teste de velocidade e o check de confirmação. Os cartões verdes mantêm essa cor quando fechados. Uma linha aberta mantém-se aberta durante a edição e ao recalcular, sem perder o foco do campo. Exercícios novos entram fechados.

O editor apresenta separadores com subtotais para Aquecimento, Treino específico e Arrefecimento / retorno à calma. Os movimentos são classificados pelo catálogo e organizados nessa ordem, preservando a ordem relativa dentro de cada fase. Os controlos de subir/descer atuam dentro da mesma fase. A organização altera apenas o rascunho e os planos abertos para edição; sessões já guardadas em pausa e histórico mantêm as suas linhas temporais.

Os tempos por exercício e por fase incluem séries e descansos. O descanso de transição pertence ao exercício que o precede; não há descanso após a última série do último movimento. Os subtotais somam o total da sequência e atualizam-se ao alterar repetições, séries, tempos ou cadência. Quando há frações de segundo, os tempos do editor mostram as centésimas, evitando diferenças introduzidas pelo arredondamento de cada subtotal. Fases ainda sem exercícios aparecem a 00:00. Se existir um campo inválido numa linha fechada, a linha abre automaticamente para corrigir antes de iniciar ou guardar.

Validação: 146 testes passaram. Cobertos ordenação estável por fase, preservação da sessão original, cálculo de séries/descansos/transições, fases vazias e atualização com cadências decimais. No navegador, exercícios novos ficaram fechados e entraram nas fases corretas mesmo quando aquecimento e retorno foram adicionados depois do treino principal. Alterar o aquecimento atualizou os subtotais para 02:15 + 05:56,88 + 02:30 = 10:41,88. Confirmados edição ao abrir, fecho, cartão verde compacto e abertura automática de campo inválido ao tentar iniciar. A verificação com três fases foi feita num endereço local separado. Imagem: `assets/previews/compact-phases-1.33.png`.
