import{j as e}from"./chart-vendor-Eu4deRvW.js";import{r as C}from"./react-vendor-C14am9Lm.js";import{l as E,c as lt,i as dt,f as ct,g as ht,h as me,j as xe,A as gt,r as pt,k as ut,m as ft}from"./index-aXzsyY-c.js";function mt(n){const o=n.split("/").pop()||"",c=o.replace(/\.txt$/,"").split("_");return c.length>=3?c.slice(2).join("_"):o}const xt=[{id:"beginner-morning-routine",level:"beginner",topic:"daily-life",wordCount:50,filePath:"/data/passages-for-phrase-work/beginner_50_Morning-Routine.txt"},{id:"beginner-supermarket-shopping",level:"beginner",topic:"daily-life",wordCount:1910,filePath:"/data/passages-for-phrase-work/beginner_1910_Shopping-at-the-Supermarket.txt"},{id:"beginner-cafe-day",level:"beginner",topic:"food-culture",wordCount:1380,filePath:"/data/passages-for-phrase-work/beginner_1380_A-Day-at-the-Cafe.txt"},{id:"beginner-conversation-daily",level:"beginner",topic:"communication",wordCount:3018,filePath:"/data/passages-for-phrase-work/beginner_3018_Daily-Conversations.txt"},{id:"beginner-weather-seasons",level:"beginner",topic:"nature",wordCount:2111,filePath:"/data/passages-for-phrase-work/beginner_2111_Weather-and-Seasons.txt"},{id:"beginner-wildlife-park-guide",level:"beginner",topic:"animals",wordCount:2097,filePath:"/data/passages-for-phrase-work/beginner_2097_Wildlife-Park-Guide.txt"},{id:"intermediate-exchange-student-australia",level:"intermediate",topic:"culture-exchange",wordCount:3199,filePath:"/data/passages-for-phrase-work/intermediate_3199_Exchange-Student-in-Australia.txt"},{id:"intermediate-homestay-america",level:"intermediate",topic:"culture-exchange",wordCount:3148,filePath:"/data/passages-for-phrase-work/intermediate_3148_Homestay-in-America.txt"},{id:"intermediate-career-day",level:"intermediate",topic:"education-career",wordCount:2895,filePath:"/data/passages-for-phrase-work/intermediate_2895_Career-Day-at-School.txt"},{id:"intermediate-hospital-visit",level:"intermediate",topic:"health",wordCount:2721,filePath:"/data/passages-for-phrase-work/intermediate_2721_A-Visit-to-the-Hospital.txt"},{id:"intermediate-science-museum",level:"intermediate",topic:"science-education",wordCount:3265,filePath:"/data/passages-for-phrase-work/intermediate_3265_Science-Museum-Experience.txt"},{id:"intermediate-community-events",level:"intermediate",topic:"community",wordCount:2216,filePath:"/data/passages-for-phrase-work/intermediate_2216_Community-Events.txt"},{id:"intermediate-school-events-year",level:"intermediate",topic:"school-life",wordCount:2558,filePath:"/data/passages-for-phrase-work/intermediate_2558_A-Year-of-School-Events.txt"},{id:"intermediate-school-news",level:"intermediate",topic:"school-life",wordCount:1937,filePath:"/data/passages-for-phrase-work/intermediate_1937_School-News.txt"},{id:"advanced-environmental-issues",level:"advanced",topic:"environment",wordCount:4263,filePath:"/data/passages-for-phrase-work/advanced_4263_Environmental-Issues-and-Solutions.txt"},{id:"advanced-family-gathering",level:"advanced",topic:"culture-family",wordCount:4493,filePath:"/data/passages-for-phrase-work/advanced_4493_Family-Gathering-Traditions.txt"},{id:"advanced-health-statistics",level:"advanced",topic:"health-data",wordCount:3422,filePath:"/data/passages-for-phrase-work/advanced_3422_Health-Statistics-Analysis.txt"},{id:"advanced-historical-figures",level:"advanced",topic:"history",wordCount:3115,filePath:"/data/passages-for-phrase-work/advanced_3115_Historical-Figures-Study.txt"},{id:"advanced-international-exchange",level:"advanced",topic:"culture-global",wordCount:3813,filePath:"/data/passages-for-phrase-work/advanced_3813_Cultural-Exchange-Insights.txt"},{id:"advanced-school-festival",level:"advanced",topic:"school-events",wordCount:4419,filePath:"/data/passages-for-phrase-work/advanced_4419_School-Festival-Planning.txt"},{id:"advanced-summer-vacation-stories",level:"advanced",topic:"personal-growth",wordCount:3255,filePath:"/data/passages-for-phrase-work/advanced_3255_Summer-Vacation-Stories.txt"},{id:"advanced-technology-future",level:"advanced",topic:"technology-innovation",wordCount:3161,filePath:"/data/passages-for-phrase-work/advanced_3161_Technology-and-Future.txt"}],_e=xt.map(n=>({...n,title:mt(n.filePath),level:n.level}));function He(){return _e}async function Ke(n){try{const o=_e.find(v=>v.id===n);if(!o)return E.error(`Passage not found: ${n}`),"";const c=`/data/passages-original/${o.filePath.split("/").pop()||""}`,f=await fetch(c);return f.ok?await f.text():(E.log(`Original file not found: ${c}`),"")}catch(o){return E.error(`Error loading original passage ${n}:`,o),""}}async function wt(n){const o=_e.find(h=>h.id===n);if(!o)return E.error(`Passage not found: ${n}`),null;try{const h=await fetch(o.filePath);if(!h.ok)throw new Error(`Failed to fetch: ${h.statusText}`);const c=await h.text(),f=bt(c);return{...o,content:c,sections:f}}catch(h){return E.error(`Error loading passage ${n}:`,h),null}}function bt(n){const o=n.split(`
`),h=[];let c=null;for(const f of o){const u=f.trim();u&&(!f.startsWith("    ")&&u.length>0&&u.length<80?(c&&h.push(c),c={title:u,paragraphs:[]}):f.startsWith("    ")&&c&&c.paragraphs.push(u))}return c&&h.push(c),h}const Fe={"beginner-morning-routine":"beginner_50_Morning-Routine"};function Ae(n){if(Fe[n])return Fe[n];const o=He().find(c=>c.id===n);return o&&(o.filePath.split("/").pop()||"").replace(/\.txt$/,"")||n}function oe(n){const o=n.toLowerCase().trim();if(o.endsWith("ing")&&o.length>4){const h=o.slice(0,-3);return h.endsWith("n")||h.endsWith("m")||h.endsWith("t")?h.slice(0,-1):h+"e"}if(o.endsWith("ed")&&o.length>3){const h=o.slice(0,-2);return h.endsWith("i")?h.slice(0,-1)+"y":h}return o.endsWith("es")&&o.length>3?o.slice(0,-2):o.endsWith("s")&&o.length>2&&!o.endsWith("ss")?o.slice(0,-1):o}async function Ye(n){try{const o=Ae(n),h=[`/data/passages/4_passages-translations/${o}_full.txt`,`/data/passages/4_passages-translations/${o}.txt`,`/data/passages/passages-translations/${n}-ja.txt`,`/data/passages-translations/${n}-ja.txt`];for(const c of h){const f=await fetch(c);if(!f.ok)continue;return await f.text()}return""}catch(o){return console.error(`[全訳] Error loading full translation for ${n}:`,o),""}}async function vt(n){try{const h=`/data/passages/5_passages-for-phrase-work-ja/${Ae(n)}.txt`,c=await fetch(h);if(!c.ok)return E.log(`No Japanese phrase file found: ${h}`),[];const u=(await c.text()).split(`
`).map(v=>v.trim()).filter(v=>v.length>0);return E.log(`Loaded ${u.length} Japanese phrases from ${h}`),u}catch(o){return E.error(`Error loading Japanese phrases for ${n}:`,o),[]}}async function yt(n,o){const h=await wt(n);if(!h)return null;const[c,f,u]=await Promise.all([vt(n),Ye(n),Ke(n)]);let v=0;const S=[];return h.sections.forEach(P=>{P.paragraphs.forEach(O=>{if(O.match(/^([^:]+):\s*"([^"]+)"$/)){const Z=O.trim(),x=Z.split(/\s+/),$=x.map(I=>{let y=I,D="";if(y.startsWith('"')&&(D='"',y=y.substring(1)),/^(Ms|Mr|Mrs|Dr|Prof|St|Ave|Inc|Ltd|etc)\.$|^[A-Z]\.$|^vs\.$|^e\.g\.$|^i\.e\.$/.test(y)){const M=oe(y.replace(/\.$/,"")),J=o.get(M),Y=(J==null?void 0:J.meaning)||"",K=[];return D&&K.push({word:D,meaning:"",isUnknown:!1}),K.push({word:y,meaning:Y==="-"?"":Y,isUnknown:!1}),K}const G=y.match(/([.,!?;:—"])$/);if(G){const M=y.replace(/[.,!?;:—"]$/,""),J=G[1];if(!M){const X=[];return D&&X.push({word:D,meaning:"",isUnknown:!1}),X.push({word:J,meaning:"",isUnknown:!1}),X}const Y=oe(M),K=o.get(Y),se=(K==null?void 0:K.meaning)||"",le=[];return D&&le.push({word:D,meaning:"",isUnknown:!1}),le.push({word:M,meaning:se==="-"?"":se,isUnknown:!1}),le.push({word:J,meaning:"",isUnknown:!1}),le}else{const M=oe(y),J=o.get(M),Y=(J==null?void 0:J.meaning)||"",K=[];return D&&K.push({word:D,meaning:"",isUnknown:!1}),K.push({word:y,meaning:Y==="-"?"":Y,isUnknown:!1}),K}}).flat(),A=c[v]||"";v++,S.push({english:Z,japanese:A,phraseMeaning:A,words:x,segments:$})}else{const Z=O.trim(),x=Z.split(/\s+/),$=x.map(I=>{if(/^(Ms|Mr|Mrs|Dr|Prof|St|Ave|Inc|Ltd|etc)\.$|^[A-Z]\.$|^vs\.$|^e\.g\.$|^i\.e\.$/.test(I)){const L=oe(I.replace(/\.$/,"")),G=o.get(L),M=(G==null?void 0:G.meaning)||"";return{word:I,meaning:M==="-"?"":M,isUnknown:!1}}const D=I.match(/([.,!?;:—])$/);if(D){const L=I.replace(/[.,!?;:—]$/,""),G=D[1];if(!L)return{word:G,meaning:"",isUnknown:!1};const M=oe(L),J=o.get(M),Y=(J==null?void 0:J.meaning)||"";return[{word:L,meaning:Y==="-"?"":Y,isUnknown:!1},{word:G,meaning:"",isUnknown:!1}]}else{const L=oe(I),G=o.get(L),M=(G==null?void 0:G.meaning)||"";return{word:I,meaning:M==="-"?"":M,isUnknown:!1}}}).flat(),A=c[v]||"";v++,S.push({english:Z,japanese:A,phraseMeaning:A,words:x,segments:$})}})}),{id:h.id,title:h.title,level:h.level,actualWordCount:h.wordCount,phrases:S,translation:f,originalText:u}}async function kt(n){var o;try{const c=[`/data/passages/6_passages-phrase-learning/${Ae(n)}.json`,`/data/passages-phrase-learning/${n}.json`];let f=null;for(const P of c){const O=await fetch(P);if(O.ok){f=O;break}}if(!f)return E.log(`No phrase learning JSON found for ${n}, will use .txt conversion`),null;const u=await f.json();E.log(`Loaded phrase learning JSON for ${n}, phrases: ${((o=u.phrases)==null?void 0:o.length)||0}`);const[v,S]=await Promise.all([Ye(n),Ke(n)]);return{...u,phrases:u.phrases||[],translation:v,originalText:S}}catch{return E.log(`Skipping phrase learning JSON for ${n} (file may be old or moved), will use .txt conversion`),null}}async function jt(n){var c;const o=He(),h=[];E.log(`Loading ${o.length} passages...`);for(const f of o){let u=await kt(f.id);u||(u=await yt(f.id,n)),u?(E.log(`✓ Loaded passage: ${f.id} (${((c=u.phrases)==null?void 0:c.length)||0} phrases)`),h.push(u)):E.error(`✗ Failed to load passage: ${f.id}`)}return E.log(`Total passages loaded: ${h.length}`),h}const Ce=new Map;async function Nt(n){try{const o=await fetch(n);return o.ok?await o.json():null}catch(o){return E.warn(`[readingTechniquesLoader] Failed to load ${n}:`,o),null}}function qe(n,o){return Ce.has(n)||Ce.set(n,Nt(o)),Ce.get(n)}function Ue(n){const o=n.match(/(\d+)$/);if(!o)return null;const h=Number(o[1]);return Number.isFinite(h)?h:null}function Ze(n){return n.slice().sort((o,h)=>(Ue(o.id)??Number.POSITIVE_INFINITY)-(Ue(h.id)??Number.POSITIVE_INFINITY))}function St(){return qe("paragraph_reading_patterns","/data/reading-techniques/paragraph_reading_patterns.json").then(n=>n?{...n,patterns:Ze(n.patterns)}:null)}function Ct(){return qe("sentence_reading_patterns","/data/reading-techniques/sentence_reading_patterns.json").then(n=>n?{...n,patterns:Ze(n.patterns)}:null)}function Pt(n){const o=new Map,h=new Map,c=new Map;for(const x of n){o.set(x.id,x);const $=typeof x.head=="number"?x.head:0,A=h.get($)??[];A.push(x.id),h.set($,A)}const f=x=>(x.deprel??"").toLowerCase(),u=x=>(x.upos??"").toUpperCase(),v=x=>u(x)==="PUNCT"||f(x)==="punct",S=n.find(x=>(x.head??0)===0)??n[0];if(!S)return new Map;const H=(x,$)=>{const A=h.get(x)??[];for(const I of A){const y=o.get(I);if(y&&f(y)===$)return y}},P=(x,$)=>{const A=[],I=[x];for(;I.length;){const y=I.pop();A.push(y);const D=h.get(y)??[];for(const L of D){const G=o.get(L);G&&($&&$.has(f(G))||I.push(L))}}return A},O=H(S.id,"cop"),_=!!O&&["NOUN","PROPN","ADJ"].includes(u(S));for(const x of n){const $=f(x);if($==="nsubj"||$==="nsubj:pass"||$==="csubj")for(const A of P(x.id)){const I=o.get(A);!I||v(I)||c.set(A,"S")}}for(const x of n){const $=f(x);if($==="obj"||$==="iobj")for(const A of P(x.id)){const I=o.get(A);!I||v(I)||c.set(A,"O")}}if(_){const x=new Set(["cop","punct"]);for(const $ of P(S.id,x)){const A=o.get($);!A||v(A)||c.has($)||c.set($,"C")}}if(_&&O)c.set(O.id,"V");else{v(S)||c.set(S.id,"V");for(const x of n)f(x)==="compound:prt"&&c.set(x.id,"V")}if(!_)for(const x of n){if(f(x)!=="xcomp")continue;const A=u(x);if(A==="ADJ"||A==="NOUN"||A==="PROPN")for(const y of P(x.id)){const D=o.get(y);!D||v(D)||c.has(y)||c.set(y,"C")}}for(const x of n)v(x)||c.has(x.id)||c.set(x.id,"M");const Z=new Map;for(const x of n){const $=c.get(x.id);$&&Z.set(x.start,$)}return Z}const ze=new Set(["be","am","is","are","was","were","been","being","have","has","had","having","do","does","did","done","doing","can","could","will","would","shall","should","may","might","must","go","goes","went","gone","going","get","gets","got","gotten","getting","make","makes","made","making","take","takes","took","taken","taking","see","sees","saw","seen","seeing","come","comes","came","coming","want","wants","wanted","wanting","use","uses","used","using","find","finds","found","finding","give","gives","gave","given","giving","tell","tells","told","telling","work","works","worked","working","call","calls","called","calling","try","tries","tried","trying","ask","asks","asked","asking","need","needs","needed","needing","feel","feels","felt","feeling","become","becomes","became","becoming","leave","leaves","left","leaving","put","puts","putting","mean","means","meant","meaning","keep","keeps","kept","keeping","let","lets","letting","begin","begins","began","begun","beginning","seem","seems","seemed","seeming","help","helps","helped","helping","talk","talks","talked","talking","turn","turns","turned","turning","start","starts","started","starting","show","shows","showed","shown","showing","hear","hears","heard","hearing","play","plays","played","playing","run","runs","ran","running","move","moves","moved","moving","like","likes","liked","liking","live","lives","lived","living","believe","believes","believed","believing","bring","brings","brought","bringing","happen","happens","happened","happening","write","writes","wrote","written","writing","sit","sits","sat","sitting","stand","stands","stood","standing","lose","loses","lost","losing","pay","pays","paid","paying","meet","meets","met","meeting","include","includes","included","including","continue","continues","continued","continuing","set","sets","setting","learn","learns","learned","learning","change","changes","changed","changing","lead","leads","led","leading","understand","understands","understood","understanding","watch","watches","watched","watching","follow","follows","followed","following","stop","stops","stopped","stopping","create","creates","created","creating","speak","speaks","spoke","spoken","speaking","read","reads","reading","spend","spends","spent","spending","grow","grows","grew","grown","growing","open","opens","opened","opening","walk","walks","walked","walking","win","wins","won","winning","teach","teaches","taught","teaching","offer","offers","offered","offering","remember","remembers","remembered","remembering","consider","considers","considered","considering","appear","appears","appeared","appearing","buy","buys","bought","buying","serve","serves","served","serving","die","dies","died","dying","send","sends","sent","sending","build","builds","built","building","stay","stays","stayed","staying","fall","falls","fell","fallen","falling","cut","cuts","cutting","reach","reaches","reached","reaching","kill","kills","killed","killing","raise","raises","raised","raising","pass","passes","passed","passing","sell","sells","sold","selling","decide","decides","decided","deciding","return","returns","returned","returning","explain","explains","explained","explaining","hope","hopes","hoped","hoping","develop","develops","developed","developing","carry","carries","carried","carrying","break","breaks","broke","broken","breaking","receive","receives","received","receiving","agree","agrees","agreed","agreeing","support","supports","supported","supporting","hit","hits","hitting","produce","produces","produced","producing","eat","eats","ate","eaten","eating","cover","covers","covered","covering","catch","catches","caught","catching","draw","draws","drew","drawn","drawing","wake","wakes","woke","woken","waking","brush","brushes","brushed","brushing","wash","washes","washed","washing","prepare","prepares","prepared","preparing","check","checks","checked","checking"]),$e=new Set(["in","on","at","to","for","with","from","by","about","as","into","like","through","after","over","between","out","against","during","without","before","under","around","among","of","up"]),$t=new Set(["and","but","or","so","yet","for","nor","because","although","if","when","while","since","unless","that","which","who","whom","whose","where"]),_t=new Set(["the","a","an","this","that","these","those","my","your","his","her","its","our","their","some","any","no","every","each","either","neither","much","many","more","most","few","little","several"]),Be=new Set(["i","you","he","she","it","we","they","me","him","her","us","them","myself","yourself","himself","herself","itself","ourselves","themselves"]),At=new Set(["good","new","first","last","long","great","little","own","other","old","right","big","high","different","small","large","next","early","young","important","few","public","bad","same","able","ready","usual"]),Et=new Set(["not","so","up","out","just","now","how","then","more","also","here","well","only","very","even","back","there","down","still","in","as","too","when","never","really","usually","finally","first","after","before"]);function Qe(n){return{S:"#3b82f6",V:"#ef4444",O:"#10b981",C:"#f59e0b",M:"#8b5cf6",Prep:"#6366f1",Conj:"#ec4899",Det:"#14b8a6",Adj:"#f97316",Adv:"#a855f7",Unknown:"#6b7280"}[n]}function Xe(n){return{S:"主語",V:"動詞",O:"目的語",C:"補語",M:"修飾語",Prep:"前置詞",Conj:"接続詞",Det:"冠詞・限定詞",Adj:"形容詞",Adv:"副詞",Unknown:"不明"}[n]}function Tt(n,o,h){var f,u;const c=n.toLowerCase();if(/^[.,!?;:]$/.test(n))return"Unknown";if(ze.has(c))return"V";if($e.has(c))return"Prep";if($t.has(c))return"Conj";if(_t.has(c))return"Det";if((c==="first"||c==="then"||c==="finally")&&o===0){let v=o+1;for(;v<h.length&&/^[.,!?;:]$/.test(h[v]);)v++;const S=(f=h[v])==null?void 0:f.toLowerCase();if(S&&Be.has(S))return"Adv"}return At.has(c)?"Adj":Et.has(c)?"Adv":Be.has(c)?o===0||o>0&&ze.has((u=h[o+1])==null?void 0:u.toLowerCase())?"S":"O":"Unknown"}function et(n){return{".":"文の終わり",",":"区切り・列挙","!":"感嘆・強調","?":"疑問",";":"関連する文の区切り",":":"説明・例示の導入","-":"補足説明・言い換え","—":"強い区切り・挿入","–":"範囲・関係",'"':"引用","'":"引用・所有格","(":"補足情報の開始",")":"補足情報の終了"}[n]||"句読点"}function Lt(n){const o=n.match(/\b[\w']+\b|[.,!?;:\-—–"'()]/g)||[];let h=0;return o.map(c=>{const f=n.indexOf(c,h);return f>=0?(h=f+c.length,{token:c,start:f}):{token:c,start:null}})}function we(n){const o=n.match(/\b[\w']+\b|[.,!?;:\-—–"'()]/g)||[],h=new Set(["morning","afternoon","evening","night","day","week","month","year","weekend","weekends"]),c=[];let f=!1,u=!1,v=!1,S=null;const H=new Set(["be","am","is","are","was","were","been","being"]);for(let P=0;P<o.length;P++){const O=o[P];if(/^[.,!?;:\-—–"'()]$/.test(O)){c.push({word:O,tag:"Unknown",color:"#6b7280",description:et(O)});continue}let _=Tt(O,P,o);_==="Unknown"&&(P===0&&/^[A-Z]/.test(O)&&!u?(_="S",u=!0):P>0&&o[P-1].toLowerCase()==="every"&&h.has(O.toLowerCase())?_="M":f&&u&&!v&&!(P>0&&$e.has(o[P-1].toLowerCase()))?(_=S&&H.has(S)?"C":"O",v=!0):f&&u&&v&&P>0&&(o[P-1].toLowerCase()==="and"||o[P-1].toLowerCase()==="or")?_=S&&H.has(S)?"C":"O":(P>0&&$e.has(o[P-1].toLowerCase()),_="M")),_==="V"&&(f=!0,S=O.toLowerCase(),v=!1),_==="S"&&(u=!0),(_==="O"||_==="C")&&(v=!0),c.push({word:O,tag:_,color:Qe(_),description:Xe(_)})}return c}function be(n,o){const h=Pt(o),c=Lt(n),f=[];for(const{token:u,start:v}of c){if(/^[.,!?;:\-—–"'()]$/.test(u)){f.push({word:u,tag:"Unknown",color:"#6b7280",description:et(u)});continue}const H=(typeof v=="number"?h.get(v):void 0)??"M";f.push({word:u,tag:H,color:Qe(H),description:Xe(H)})}return f}const Mt=[{words:["wake","up"],meaning:"起きる",type:"phrasal-verb"},{words:["get","up"],meaning:"起床する",type:"phrasal-verb"},{words:["brush","my","teeth"],meaning:"歯を磨く",type:"phrasal-verb"},{words:["wash","my","face"],meaning:"顔を洗う",type:"phrasal-verb"},{words:["have","breakfast"],meaning:"朝食を食べる",type:"phrasal-verb"},{words:["go","to","school"],meaning:"学校に行く",type:"phrasal-verb"},{words:["come","back"],meaning:"帰ってくる",type:"phrasal-verb"},{words:["come","home"],meaning:"帰宅する",type:"phrasal-verb"},{words:["do","homework"],meaning:"宿題をする",type:"phrasal-verb"},{words:["go","to","bed"],meaning:"寝る",type:"phrasal-verb"},{words:["at","seven"],meaning:"7時に",type:"time-expression"},{words:["in","the","morning"],meaning:"朝に",type:"time-expression"},{words:["in","the","afternoon"],meaning:"午後に",type:"time-expression"},{words:["in","the","evening"],meaning:"夕方に",type:"time-expression"},{words:["at","night"],meaning:"夜に",type:"time-expression"},{words:["every","morning"],meaning:"毎朝",type:"determiner-noun"},{words:["every","day"],meaning:"毎日",type:"determiner-noun"},{words:["every","night"],meaning:"毎晩",type:"determiner-noun"},{words:["every","week"],meaning:"毎週",type:"determiner-noun"}];function ve(n){const o=[],h=n.map(c=>c.toLowerCase());for(const c of Mt){const f=c.words.map(u=>u.toLowerCase());for(let u=0;u<=h.length-f.length;u++){let v=!0;for(let S=0;S<f.length;S++)if(h[u+S]!==f[S]){v=!1;break}v&&o.push({...c,words:n.slice(u,u+f.length)})}}return o}const Ot=[{name:"too ~ to ...",meaning:"〜すぎて...できない",pattern:/\btoo\s+\w+\s+to\s+\w+/i,explanation:"「too + 形容詞/副詞 + to + 動詞」の形で、「〜すぎて...できない」という意味"},{name:"so ~ that ...",meaning:"とても〜なので...",pattern:/\bso\s+\w+\s+that\b/i,explanation:"「so + 形容詞/副詞 + that ~」の形で、「とても〜なので...」という意味"},{name:"so that ...",meaning:"〜するために",pattern:/\bso\s+that\b/i,explanation:"「so that ~」の形で、「〜するために」という目的を表す"},{name:"It is ~ for ... to",meaning:"...が〜するのは",pattern:/\bit\s+is\s+\w+\s+for\s+\w+\s+to\b/i,explanation:"「It is + 形容詞 + for + 人 + to + 動詞」の形で、「(人)が〜するのは...だ」という意味"},{name:"It is ~ to ...",meaning:"〜することは...だ",pattern:/\bit\s+is\s+\w+\s+to\s+\w+/i,explanation:"「It is + 形容詞 + to + 動詞」の形で、「〜することは...だ」という意味"},{name:"It is ~ that ...",meaning:"...なのは〜だ (強調)",pattern:/\bit\s+is\s+\w+\s+that\b/i,explanation:"強調構文。「It is ~ that ...」の形で、特定の部分を強調する"},{name:"not only ~ but also ...",meaning:"〜だけでなく...も",pattern:/\bnot\s+only\s+.+\s+but\s+also\b/i,explanation:"「not only A but also B」の形で、「AだけでなくBも」という意味"},{name:"either ~ or ...",meaning:"〜か...かどちらか",pattern:/\beither\s+.+\s+or\b/i,explanation:"「either A or B」の形で、「AかBかどちらか」という選択を表す"},{name:"neither ~ nor ...",meaning:"〜も...もない",pattern:/\bneither\s+.+\s+nor\b/i,explanation:"「neither A nor B」の形で、「AもBもない」という否定を表す"},{name:"both ~ and ...",meaning:"〜も...も両方",pattern:/\bboth\s+.+\s+and\b/i,explanation:"「both A and B」の形で、「AもBも両方」という意味"},{name:"as ~ as ...",meaning:"...と同じくらい〜",pattern:/\bas\s+\w+\s+as\b/i,explanation:"「as + 形容詞/副詞 + as ...」の形で、「...と同じくらい〜」という同等比較"},{name:"not as ~ as ...",meaning:"...ほど〜ない",pattern:/\bnot\s+as\s+\w+\s+as\b/i,explanation:"「not as + 形容詞/副詞 + as ...」の形で、「...ほど〜ない」という意味"},{name:"one of the ~est",meaning:"最も〜なものの1つ",pattern:/\bone\s+of\s+the\s+\w+est\b/i,explanation:"「one of the + 最上級 + 複数名詞」の形で、「最も〜なものの1つ」という意味"},{name:"make/let/have + 人 + 動詞",meaning:"人に〜させる",pattern:/\b(make|let|have|help)\s+\w+\s+\w+/i,explanation:"使役動詞の構文。「make/let/have + 人 + 動詞の原形」で「人に〜させる」"},{name:"be used to ~ing",meaning:"〜することに慣れている",pattern:/\b(am|is|are|was|were)\s+used\s+to\s+\w+ing\b/i,explanation:"「be used to + 動名詞」の形で、「〜することに慣れている」という意味"},{name:"used to + 動詞",meaning:"昔は〜したものだ",pattern:/\bused\s+to\s+\w+/i,explanation:"「used to + 動詞の原形」の形で、「昔は〜したものだ」という過去の習慣を表す"}];function Wt(n){const o=[];for(const h of Ot)h.pattern.test(n)&&o.push(h);return o}function Ve(n){return{beginner:"初級",intermediate:"中級",advanced:"上級",Advanced:"上級",初級:"初級",中級:"中級",上級:"上級"}[n]||n}function Pe(n){return n.toLowerCase().replace(/[\s.,?!]+/g," ").trim()}function he(n){return/^[.,!?;:\-—–"'()]$/.test(n)}function ie(n){switch(n){case"S":return{text:"text-red-600",underline:"border-red-500"};case"V":return{text:"text-blue-600",underline:"border-blue-500"};case"O":return{text:"text-yellow-600",underline:"border-yellow-500"};case"C":return{text:"text-green-600",underline:"border-green-500"};case"M":default:return{text:"text-gray-400",underline:"border-gray-300"}}}function De(n){return n?n.includes("主語")?"S":n.includes("動詞")?"V":n.includes("目的語")?"O":n.includes("補語")?"C":"M":"M"}function Ge(n){return n==="S"||n==="V"||n==="O"||n==="C"||n==="M"?n:"M"}const Je={"first i brush my teeth and wash my face":[{text:"First",label:"副詞",underline:"word"},{text:"I",label:"主語",underline:"word"},{text:"brush my teeth",label:"動詞句",underline:"phrase"},{text:"and",label:"接続詞",underline:"word"},{text:"wash my face",label:"動詞句",underline:"phrase"}]},Rt={"i wake up at seven every morning":"私は毎朝7時に起きます。","first i brush my teeth and wash my face":"まず、歯を磨いて顔を洗います。","i check homework and put books inside":"私は宿題を確認して、本をかばんの中に入れます。"};function It(n,o){const h=new Map,c=new Set,f=new Set;return o.forEach(u=>{var S,H;const v=u.words.length;if(!(v<=1))for(let P=0;P<=n.length-v;P++){if(f.has(P))continue;let O=!0;for(let _=0;_<v;_++)if(((S=n[P+_])==null?void 0:S.toLowerCase())!==((H=u.words[_])==null?void 0:H.toLowerCase())){O=!1;break}if(O){h.set(P,u);for(let _=0;_<v;_++)c.add(P+_);f.add(P);break}}}),{phrasalMap:h,phrasalWordIndices:c}}function Gt({onSaveUnknownWords:n,customQuestionSets:o=[],onAddWordToCustomSet:h,onRemoveWordFromCustomSet:c,onOpenCustomSetManagement:f}){var Re;const[u,v]=C.useState([]),[S,H]=C.useState(null),[P,O]=C.useState([]),[_,Z]=C.useState([]),[x,$]=C.useState("all"),[A,I]=C.useState(null),[y,D]=C.useState(new Map),[L,G]=C.useState(new Map),[M,J]=C.useState(null),[Y,K]=C.useState(!1),[se,le]=C.useState(!0),[X,ye]=C.useState("reading"),[Ft,tt]=C.useState(0),[de,ke]=C.useState(!1),[ge,ce]=C.useState(!1),[re,pe]=C.useState(null),[z,ae]=C.useState(null),[ee,Ee]=C.useState(null),[Ut,zt]=C.useState(!1),[nt,ue]=C.useState(!0),[Te,st]=C.useState([]),[je,rt]=C.useState([]);C.useEffect(()=>{Promise.all([Ct(),St()]).then(([r,a])=>{r!=null&&r.patterns&&st(r.patterns),a!=null&&a.patterns&&rt(a.patterns)})},[]),C.useEffect(()=>{let r=!1;if(!S){Ee(null);return}return lt(S).then(a=>{r||Ee(a)}),()=>{r=!0}},[S]),C.useEffect(()=>{if(u.length>0){const r="reading-unknown-words-state";try{const a=u.map(t=>({id:t.id,unknownWords:t.phrases.flatMap((s,i)=>s.segments.map((p,b)=>p.isUnknown?`${i}-${b}`:null).filter(Boolean))}));localStorage.setItem(r,JSON.stringify(a))}catch(a){E.warn("分からない単語の状態保存に失敗:",a)}}},[u]),C.useEffect(()=>{E.log("[長文] 辞書の読み込みを開始..."),fetch("/data/vocabulary/high-school-entrance-words.csv").then(r=>{if(!r.ok)throw new Error(`CSV読み込み失敗: ${r.status}`);return r.text()}).then(r=>{const a=r.split(`
`),t=new Map;a.slice(1).forEach(s=>{if(!s.trim())return;const i=s.split(",").map(p=>p.trim());if(i.length>=7){const p=i[0].toLowerCase().trim();t.set(p,{word:i[0],reading:i[1],meaning:i[2],etymology:i[3],relatedWords:i[4],relatedFields:i[5],difficulty:i[6]})}}),E.log(`[長文] メイン辞書: ${t.size}単語を読み込みました`),D(t)}).catch(r=>{}),fetch("/data/dictionaries/reading-passages-dictionary.json").then(r=>{if(!r.ok)throw new Error(`JSON読み込み失敗: ${r.status}`);return r.json()}).then(r=>{const a=new Map;Object.entries(r).forEach(([t,s])=>{a.set(t.toLowerCase(),s)}),G(a),E.log(`[長文] 長文読解辞書: ${a.size}単語を読み込みました`)}).catch(r=>{E.error("[長文] Error loading reading dictionary:",r)})},[]);const Le=C.useCallback(r=>{const a=r.toLowerCase().replace(/[.,!?;:"']/g,"").trim();if(y.has(a)||L.has(a))return a;if(a.endsWith("es")){const t=a.slice(0,-2);if(y.has(t)||L.has(t))return t}if(a.endsWith("s")){const t=a.slice(0,-1);if(y.has(t)||L.has(t))return t}if(a.endsWith("ed")){const t=a.slice(0,-2);if(y.has(t)||L.has(t))return t;if(y.has(t+"e")||L.has(t+"e"))return t+"e";if(t.length>2&&t[t.length-1]===t[t.length-2]){const s=t.slice(0,-1);if(y.has(s)||L.has(s))return s}}if(a.endsWith("ing")){const t=a.slice(0,-3);if(y.has(t)||L.has(t))return t;if(y.has(t+"e")||L.has(t+"e"))return t+"e";if(t.length>2&&t[t.length-1]===t[t.length-2]){const s=t.slice(0,-1);if(y.has(s)||L.has(s))return s}}if(a.endsWith("ly")){const t=a.slice(0,-2);if(y.has(t)||L.has(t))return t}if(a.endsWith("er")){const t=a.slice(0,-2);if(y.has(t)||L.has(t))return t}if(a.endsWith("est")){const t=a.slice(0,-3);if(y.has(t)||L.has(t))return t}return a},[y,L]),Me=C.useCallback((r,a)=>{if(a&&typeof a=="string"&&a.trim()&&a!=="-")return a;if(a&&typeof a=="object"&&"meaning"in a&&typeof a.meaning=="string")return a.meaning;const t=r.toLowerCase();if(t==="who")return"(関係代名詞)その人は";if(t==="whom")return"(関係代名詞)その人を";if(t==="which")return"(関係代名詞)その物等は・を";if(t==="that")return"(関係代名詞)その人・物等は・を";const s=Le(r),i=y.get(s),p=L.get(s);return(i==null?void 0:i.meaning)||(p==null?void 0:p.meaning)||""},[Le,y,L]);C.useEffect(()=>{const r=setInterval(()=>{de&&!dt()&&!ct()&&(ke(!1),ce(!1))},500);return()=>clearInterval(r)},[de]),C.useEffect(()=>{if(y.size===0){E.log("[長文] 辞書の読み込みを待機中...");return}E.log(`[長文] パッセージデータの読み込みを開始... (辞書: ${y.size}単語)`);try{localStorage.removeItem("reading-passages-data")}catch{}const r="reading-unknown-words-state";let a=[];try{const t=localStorage.getItem(r);t&&(a=JSON.parse(t))}catch(t){E.warn("[長文] 保存済み進捗の読み込みに失敗:",t)}ue(!0),jt(y).then(t=>{var s,i;if(t&&t.length>0){E.log(`[長文] ${t.length}件のパッセージを読み込みました`);const p=t.map(W=>{const l=a.find(m=>m.id===W.id);return l!=null&&l.unknownWords&&l.unknownWords.length>0?{...W,phrases:W.phrases.map((m,T)=>({...m,segments:m.segments.map((F,d)=>{var w;return{...F,isUnknown:((w=l.unknownWords)==null?void 0:w.includes(`${T}-${d}`))??!1}})}))}:W}),b={初級:1,beginner:1,中級:2,intermediate:2,上級:3,advanced:3,Advanced:3},g=p.sort((W,l)=>{const m=b[W.level||""]||999,T=b[l.level||""]||999;if(m!==T)return m-T;const F=W.actualWordCount||0,d=l.actualWordCount||0;return F-d});v(g),E.log(`[長文] パッセージを設定完了: ${g.length}件`),g.length>0&&(H(g[0].id),O(new Array(((s=g[0].phrases)==null?void 0:s.length)||0).fill(!1)),Z(new Array(((i=g[0].phrases)==null?void 0:i.length)||0).fill(!1)),E.log(`[長文] 初期パッセージを選択: ${g[0].id}`)),ue(!1)}else E.error("[長文] loadAllPassagesAsReadingFormatが空の配列を返しました"),I("パッセージデータの読み込みに失敗しました（データが空です）"),ue(!1)}).catch(t=>{E.error("[長文] Error loading passages:",t),I("パッセージの読み込みに失敗しました: "+t.message),ue(!1)})},[y]);const j=C.useMemo(()=>u.find(r=>r.id===S),[u,S]),Ne=C.useMemo(()=>{const r=x==="all"?u:u.filter(t=>t.level===x),a={初級:1,beginner:1,中級:2,intermediate:2,上級:3,advanced:3,Advanced:3};return r.sort((t,s)=>{const i=a[t.level||""]||999,p=a[s.level||""]||999;if(i!==p)return i-p;const b=t.actualWordCount||0,g=s.actualWordCount||0;return b-g})},[u,x]),Oe=C.useCallback(r=>{var t,s;H(r);const a=u.find(i=>i.id===r);a&&(O(new Array(((t=a.phrases)==null?void 0:t.length)||0).fill(!1)),Z(new Array(((s=a.phrases)==null?void 0:s.length)||0).fill(!1)),tt(0))},[u]);C.useCallback((r,a)=>{if(a.preventDefault(),a.stopPropagation(),!j||!ht())return;const s=j.phrases[r].segments.filter(p=>p.word&&p.word.trim()!=="").map(p=>p.word).join(" ");me(s,{rate:.85});const i=a.currentTarget;i.classList.add("speaking"),setTimeout(()=>{i.classList.remove("speaking")},600)},[j]);const at=()=>{if(!j)return;const r=[];if(j.phrases.forEach(a=>{a.segments.forEach(t=>{t.isUnknown&&t.word.trim()!==""&&(r.some(s=>s.word.toLowerCase()===t.word.toLowerCase())||r.push({word:t.word,meaning:t.meaning,reading:t.reading||"",etymology:t.etymology||"",relatedWords:t.relatedWords||"",relatedFields:t.relatedFields||"",difficulty:t.difficulty||"intermediate"}))})}),r.length===0){alert(`分からない単語が選択されていません。
単語をタップしてマークしてください。`);return}n&&n(r),v(a=>a.map(t=>t.id===j.id?{...t,phrases:t.phrases.map(s=>({...s,segments:s.segments.map(i=>({...i,isUnknown:!1}))}))}:t)),alert(`${r.length}個の単語を「${j.title}」から保存しました！`)},ot=()=>{j&&(v(r=>r.map(a=>a.id===j.id?{...a,phrases:a.phrases.map(t=>({...t,segments:t.segments.map(s=>({...s,isUnknown:!1}))}))}:a)),O(new Array(j.phrases.length).fill(!1)),Z(new Array(j.phrases.length).fill(!1)))};if(A)return e.jsx("div",{className:"error-message",children:A});if(nt)return e.jsx("div",{className:"empty-container",children:"読み込み中..."});if(u.length===0)return e.jsx("div",{className:"empty-container",children:"パッセージが見つかりません"});if(Ne.length===0)return e.jsxs("div",{className:"comprehensive-reading-view",children:[e.jsx("div",{className:"reading-header",children:e.jsxs("div",{className:"filter-controls",children:[e.jsx("label",{htmlFor:"difficulty-filter",children:"難易度: "}),e.jsxs("select",{id:"difficulty-filter",value:x,onChange:r=>$(r.target.value),title:"難易度を選択",children:[e.jsx("option",{value:"all",children:"全て"}),e.jsx("option",{value:"初級",children:"初級"}),e.jsx("option",{value:"中級",children:"中級"}),e.jsx("option",{value:"上級",children:"上級"})]})]})}),e.jsx("div",{className:"empty-container",children:"選択した難易度のパッセージが見つかりません。別の難易度を選択してください。"})]});const We=((Re=j==null?void 0:j.phrases)==null?void 0:Re.reduce((r,a)=>r+a.segments.filter(t=>t.isUnknown).length,0))||0;return e.jsxs("div",{className:"comprehensive-reading-view",children:[!se&&Y&&e.jsxs("div",{className:"study-settings-panel",children:[e.jsxs("div",{className:"settings-header",children:[e.jsx("h3",{children:"📊 学習設定"}),e.jsx("button",{onClick:()=>K(!1),className:"px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors duration-200 text-sm shadow-sm:bg-gray-600",children:"✕ 閉じる"})]}),e.jsxs("div",{className:"filter-group",children:[e.jsx("label",{htmlFor:"difficulty-filter",children:"⭐ 難易度:"}),e.jsxs("select",{id:"difficulty-filter",value:x,onChange:r=>$(r.target.value),className:"select-input",children:[e.jsx("option",{value:"all",children:"全て"}),e.jsx("option",{value:"初級",children:"初級"}),e.jsx("option",{value:"中級",children:"中級"}),e.jsx("option",{value:"上級",children:"上級"})]})]}),e.jsxs("div",{className:"filter-group",children:[e.jsx("label",{htmlFor:"passage-select",children:"📖 パッセージ:"}),e.jsx("select",{id:"passage-select",value:S||"",onChange:r=>Oe(r.target.value),className:"select-input",children:Ne.map(r=>e.jsxs("option",{value:r.id,children:[Ve(r.level||"beginner"),"_",r.actualWordCount,"語_",r.title]},r.id))})]})]}),se&&e.jsxs("div",{className:"reading-sub-tabs grid grid-cols-6 gap-1 sm:gap-2",children:[e.jsx("button",{className:`px-2 sm:px-4 py-1.5 sm:py-2 text-xs sm:text-base font-medium transition-all duration-200 rounded-t-lg border-b-2 ${X==="reading"?"bg-primary text-white border-primary":"bg-gray-200 text-gray-700 border-transparent hover:bg-gray-300"}`,onClick:()=>ye("reading"),children:"📖 読解"}),e.jsx("button",{className:`px-2 sm:px-4 py-1.5 sm:py-2 text-xs sm:text-base font-medium transition-all duration-200 rounded-t-lg border-b-2 ${X==="fullText"?"bg-primary text-white border-primary":"bg-gray-200 text-gray-700 border-transparent hover:bg-gray-300"}`,onClick:()=>ye("fullText"),children:"📄 全文"}),e.jsx("button",{className:`px-2 sm:px-4 py-1.5 sm:py-2 text-xs sm:text-base font-medium transition-all duration-200 rounded-t-lg border-b-2 ${X==="fullTranslation"?"bg-primary text-white border-primary":"bg-gray-200 text-gray-700 border-transparent hover:bg-gray-300"}`,onClick:()=>ye("fullTranslation"),children:"📝 全訳"}),e.jsxs("button",{onClick:at,className:"px-2 sm:px-4 py-1.5 sm:py-2 text-xs sm:text-base font-medium bg-success text-white rounded-t-lg border-b-2 border-success transition-all duration-200 hover:bg-success-hover disabled:opacity-50 disabled:cursor-not-allowed:bg-success-hover",disabled:We===0,title:"未知語を保存",children:["💾 保存 (",We,")"]}),e.jsx("button",{onClick:ot,className:"px-4 py-2 text-sm font-medium bg-warning text-warning-dark border-2 border-warning rounded-lg transition-all duration-200 hover:bg-warning-hover hover:shadow-md:bg-warning-hover",title:"リセット",children:"🔄 リセット"}),e.jsx("button",{className:"px-4 py-2 text-sm font-medium bg-gray-200 text-gray-700 border-2 border-transparent rounded-lg transition-all duration-200 hover:bg-gray-300:bg-gray-600",onClick:()=>K(!Y),title:"学習設定を開く",children:"⚙️ 学習設定"})]}),se&&Y&&e.jsxs("div",{className:"study-settings-panel",children:[e.jsxs("div",{className:"settings-header",children:[e.jsx("h3",{children:"📊 学習設定"}),e.jsx("button",{onClick:()=>K(!1),className:"px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors duration-200 text-sm shadow-sm:bg-gray-600",children:"✕ 閉じる"})]}),e.jsxs("div",{className:"filter-group",children:[e.jsx("label",{htmlFor:"difficulty-filter-reading",children:"⭐ 難易度:"}),e.jsxs("select",{id:"difficulty-filter-reading",value:x,onChange:r=>$(r.target.value),className:"select-input",children:[e.jsx("option",{value:"all",children:"全て"}),e.jsx("option",{value:"初級",children:"初級"}),e.jsx("option",{value:"中級",children:"中級"}),e.jsx("option",{value:"上級",children:"上級"})]})]}),e.jsxs("div",{className:"filter-group",children:[e.jsx("label",{htmlFor:"passage-select-reading",children:"📖 パッセージ:"}),e.jsx("select",{id:"passage-select-reading",value:S||"",onChange:r=>Oe(r.target.value),className:"select-input",children:Ne.map(r=>e.jsxs("option",{value:r.id,children:[Ve(r.level||"beginner"),"_",r.actualWordCount,"語_",r.title]},r.id))})]})]}),M&&e.jsxs(e.Fragment,{children:[e.jsx("div",{className:"word-popup-overlay",onClick:()=>J(null)}),e.jsxs("div",{className:"word-popup","data-popup-x":M.x,"data-popup-y":M.y,children:[e.jsx("button",{className:"popup-close",onClick:()=>J(null),title:"閉じる",children:"✕"}),e.jsx("div",{className:"popup-word",children:M.word}),M.reading&&e.jsx("div",{className:"popup-reading",children:M.reading}),e.jsx("div",{className:"popup-meaning",children:M.meaning}),M.etymology&&e.jsxs("div",{className:"popup-etymology",children:[e.jsx("strong",{children:"語源:"})," ",M.etymology]}),M.relatedWords&&e.jsxs("div",{className:"popup-related",children:[e.jsx("strong",{children:"関連語:"})," ",M.relatedWords]})]})]}),se&&j&&j.phrases&&j.phrases.length>0&&e.jsxs("div",{className:"passage-content",children:[e.jsx("h3",{className:"passage-title",children:j.title}),X==="reading"&&e.jsxs(e.Fragment,{children:[e.jsxs("div",{className:"reading-full-text-area",children:[e.jsx("h4",{className:"text-lg font-semibold mb-3",children:"📖 全文"}),e.jsx("div",{className:"full-text-content",children:(()=>{if(j.originalText){const a=j.originalText.split(/([.!?])\s+/).filter(s=>s.trim()),t=[];for(let s=0;s<a.length;s+=2){const i=a[s],p=a[s+1]||"";t.push((i+p).trim())}return e.jsx("div",{className:"sentences-container",children:t.map((s,i)=>e.jsxs("span",{className:`sentence-clickable ${re===i?"selected-reading":""}`,onClick:()=>{pe(i);const p=ee?xe(ee,s):null,b=p?be(s,p.tokens):we(s);ae({text:s,grammarAnalysis:b,showMeanings:!1})},children:[s," "]},i))})}if(j.title.toLowerCase().includes("conversation")){const a=[];return j.phrases.forEach(t=>{let s=t.segments.map(i=>i.word).join(" ").trim();!s||s==="-"||(s=s.replace(/\s+([.,!?;:"])/g,"$1"),a.push(s))}),e.jsx("div",{className:"sentences-container",children:a.map((t,s)=>e.jsxs("span",{className:`sentence-clickable ${re===s?"selected-reading":""}`,onClick:()=>{pe(s);const i=ee?xe(ee,t):null,p=i?be(t,i.tokens):we(t);ae({text:t,grammarAnalysis:p,showMeanings:!1})},children:[t," "]},s))})}else{let a="",t=!0;j.phrases.forEach(p=>{p.segments.forEach(b=>{let g=b.word.trim();g&&g!=="-"&&(/^[.,!?;:]$/.test(g)?(a+=g,t=/^[.!?]$/.test(g)):(g==='"'||g==="'"||(t&&g.length>0&&(g=g.charAt(0).toUpperCase()+g.slice(1),t=!1),a.length>0&&!a.endsWith(" ")&&!a.endsWith('"')&&!a.endsWith("'")&&(a+=" ")),a+=g))})}),a=a.replace(/\s+"/g,'"').replace(/\s+'/g,"'");const s=a.split(/([.!?])\s+/).filter(p=>p.trim()),i=[];for(let p=0;p<s.length;p+=2){const b=s[p],g=s[p+1]||"";i.push((b+g).trim())}return e.jsx("div",{className:"sentences-container",children:i.map((p,b)=>e.jsxs("span",{className:`sentence-clickable ${re===b?"selected-reading":""}`,onClick:()=>{pe(b);const g=ee?xe(ee,p):null,W=g?be(p,g.tokens):we(p);ae({text:p,grammarAnalysis:W,showMeanings:!1})},children:[p," "]},b))})}})()})]}),re!==null&&z&&e.jsxs("div",{className:"selected-sentence-analysis mt-4 p-4 bg-blue-50 rounded-lg border border-blue-200",children:[e.jsxs("div",{className:"flex justify-between items-center mb-2",children:[e.jsx("h4",{className:"m-0 text-base font-semibold text-blue-700",children:"📜 文の読解"}),e.jsxs("div",{className:"flex gap-1",children:[e.jsx("button",{className:"px-2 py-1 text-xs bg-blue-600 text-white rounded hover:bg-blue-700",onClick:()=>me(z.text),title:"発音",children:"🔊"}),!1,e.jsx("button",{className:"px-2 py-1 text-xs bg-gray-600 text-white rounded hover:bg-gray-700",onClick:()=>ae({...z,showMeanings:!z.showMeanings}),children:z.showMeanings?"意味を隠す":"意味を表示"})]})]}),e.jsxs("div",{className:"grammar-structure mb-2",children:[e.jsx("h5",{className:"text-xs font-semibold mb-1 text-gray-700",children:"🔤 文法構造"}),e.jsx("div",{className:"flex flex-wrap gap-1.5 text-sm",children:(()=>{const r=Pe(z.text),a=Je[r];if(a)return a.map((l,m)=>e.jsx("div",{className:"inline-flex flex-col items-center",children:(()=>{const T=De(l.label),F=ie(T);return e.jsxs(e.Fragment,{children:[e.jsx("span",{className:`font-medium text-base text-gray-900 border-b-2 ${F.underline}`,children:l.text}),e.jsx("span",{className:`text-xs font-semibold mt-0.5 ${F.text}`,title:l.label,children:T})]})})()},m));const t=z.grammarAnalysis,s=t.some(l=>l.word==="."),i=t.filter(l=>!he(l.word)),p=i.map(l=>Ge(l.tag));for(let l=1;l+1<i.length;l++){if(i[l].tag!=="Conj")continue;const m=p[l-1],T=p[l+1];m===T&&(p[l]=m)}const b=i.findIndex(l=>l.tag==="S");if(b>0)for(let l=b-1;l>=0;l--){const m=i[l].tag;if(m==="Det"||m==="Adj")p[l]="S";else break}const g=i.findIndex(l=>l.tag==="V");if(g>=0){const l=i.findIndex((m,T)=>T>g&&(m.tag==="O"||m.tag==="C"));if(l>g+1){const m=i[l].tag==="C"?"C":"O";for(let T=l-1;T>g;T--){const F=i[T].tag;if(F==="Det"||F==="Adj")p[T]=m;else break}}}const W=[];for(let l=0;l<i.length;l++){const m=p[l],T=l,F=[i[l].word];for(;l+1<i.length&&p[l+1]===m;)F.push(i[l+1].word),l++;const d=ie(m),w=F.join(" ");W.push(e.jsxs("div",{className:"inline-flex flex-col items-center",title:m==="S"?"主語":m==="V"?"動詞":m==="O"?"目的語":m==="C"?"補語":"修飾語",children:[e.jsx("span",{className:`font-medium text-base text-gray-900 border-b-2 ${d.underline}`,children:w}),e.jsx("span",{className:`text-xs font-semibold mt-0.5 ${d.text}`,children:m})]},`${T}-${l}-${m}`))}if(s){const l=ie("M");W.push(e.jsxs("div",{className:"inline-flex flex-col items-center",title:"ピリオド",children:[e.jsx("span",{className:`font-medium text-base text-gray-900 border-b-2 ${l.underline}`,children:"."}),e.jsx("span",{className:`text-xs font-semibold mt-0.5 ${l.text}`,children:" "})]},"__period__"))}return W})()})]}),z.showMeanings&&(()=>{var F;const r=z.grammarAnalysis.filter(d=>!/^[.,!?;:\-—–"'()]$/.test(d.word)),a={one:"1",two:"2",three:"3",four:"4",five:"5",six:"6",seven:"7",eight:"8",nine:"9",ten:"10",eleven:"11",twelve:"12"},t=d=>{const w=d.join(" ").toLowerCase(),U=ve(d).find(N=>N.words.length===d.length&&N.words.every((B,Q)=>{var te;return B.toLowerCase()===((te=d[Q])==null?void 0:te.toLowerCase())}));if(U!=null&&U.meaning)return U.meaning;if(w==="i")return"私は";if(w==="wake up")return"起きる";if(w==="first")return"最初に";if(w==="then")return"それから";if(w==="finally")return"最後に";if(d.length===2&&d[0].toLowerCase()==="at"){const N=d[1].toLowerCase(),B=a[N]||(N.match(/^\d+$/)?N:"");if(B)return`${B}時に`}return d.length===2&&d[0].toLowerCase()==="every"&&d[1].toLowerCase()==="morning"?"毎朝":d.map(N=>Me(N,void 0)).filter(N=>N&&N!=="-").join(" ")},s=r.map(d=>d.word),i=ve(s),p=new Map,b=new Set;i.forEach(d=>{let w=0;for(;w<s.length;){const R=s.slice(w).findIndex((U,N)=>d.words.every((B,Q)=>{var te;return((te=s[w+N+Q])==null?void 0:te.toLowerCase())===B.toLowerCase()}));if(R!==-1){const U=w+R;p.set(U,d),d.words.forEach((N,B)=>b.add(U+B));break}w++}});const g=[];for(let d=0;d<r.length;d++){if(b.has(d)&&!p.has(d))continue;const w=p.get(d);if(w){g.push({words:w.words,meaning:((F=y.get(w.words.join(" ").toLowerCase()))==null?void 0:F.meaning)||t(w.words)}),d+=w.words.length-1;continue}const R=r[d].tag,U=r[d].word.toLowerCase();if(R==="Prep"&&d+1<r.length){const N=d+2<r.length&&r[d+1].tag==="Det"&&!he(r[d+2].word)?[r[d].word,r[d+1].word,r[d+2].word]:[r[d].word,r[d+1].word];g.push({words:N,meaning:t(N)}),d+=N.length-1;continue}if(R==="Det"&&U==="every"&&d+1<r.length){const N=[r[d].word,r[d+1].word];g.push({words:N,meaning:t(N)}),d+=1;continue}g.push({words:[r[d].word],meaning:t([r[d].word])})}const W=z.text?Pe(z.text):"",m={...Rt}[W]||(g.every(d=>d.meaning&&d.meaning!=="-")?g.map(d=>d.meaning).join(" "):"");return e.jsxs("div",{className:"mt-2",children:[e.jsx("h5",{className:"text-xs font-semibold mb-1 text-gray-700",children:"📝 直訳と日本語訳"}),e.jsxs("div",{className:"flex items-start gap-2",children:[e.jsx("span",{"data-testid":"literal-translation-badge",className:"inline-flex items-center rounded bg-gray-200 text-gray-800 px-2 py-0.5 text-[10px] font-semibold whitespace-nowrap",children:"直訳"}),e.jsx("div",{className:"flex flex-wrap gap-2 text-sm text-gray-800",children:g.map((d,w)=>e.jsxs("div",{className:"inline-flex flex-col items-center",children:[e.jsx("span",{className:"font-medium border-b-2 border-gray-600",children:d.words.join(" ")}),d.meaning&&d.meaning!=="-"&&e.jsx("span",{className:"text-xs text-gray-700 mt-0.5",children:d.meaning})]},w))})]}),e.jsxs("div",{className:"mt-2 flex items-start gap-2",children:[e.jsx("span",{"data-testid":"japanese-translation-badge",className:"inline-flex items-center rounded bg-gray-200 text-gray-800 px-2 py-0.5 text-[10px] font-semibold whitespace-nowrap",children:"日本語訳"}),e.jsx("div",{className:"text-sm text-gray-800",children:m})]}),e.jsx("div",{className:"mt-2 text-xs text-gray-600",children:"訳の品質: 直訳は語順対応を優先して意味の骨格を掴めるようにし、日本語訳は英語のニュアンス（自然な流れ・含意）をできるだけ正確に保った自然な日本語を優先しています。"})]})})(),z.showMeanings&&(()=>{const r=z.grammarAnalysis.filter(l=>!he(l.word)),a=r.map(l=>l.word),t=ve(a),{phrasalMap:s,phrasalWordIndices:i}=It(a,t),p={one:"1",two:"2",three:"3",four:"4",five:"5",six:"6",seven:"7",eight:"8",nine:"9",ten:"10",eleven:"11",twelve:"12"},b=l=>{const m=l.join(" ").toLowerCase(),F=ve(l).find(d=>d.words.length===l.length&&d.words.every((w,R)=>{var U;return w.toLowerCase()===((U=l[R])==null?void 0:U.toLowerCase())}));if(F!=null&&F.meaning)return F.meaning;if(m==="i")return"私は";if(m==="wake up")return"起きる";if(m==="first")return"最初に";if(m==="then")return"それから";if(m==="finally")return"最後に";if(l.length===2&&l[0].toLowerCase()==="at"){const d=l[1].toLowerCase(),w=p[d]||(d.match(/^\d+$/)?d:"");if(w)return`${w}時に`}return l.length===2&&l[0].toLowerCase()==="every"&&l[1].toLowerCase()==="morning"?"毎朝":l.map(d=>Me(d,void 0)).filter(d=>d&&d!=="-").join(" ")},g=[];for(let l=0;l<r.length;l++){const m=r[l];if(i.has(l)&&!s.has(l))continue;const T=s.get(l);if(T){const d=T.meaning||b(T.words);g.push({english:T.words.join(" "),meaning:d,isPhrase:!0}),l+=T.words.length-1;continue}if(m.tag==="Prep"&&l+1<r.length){const d=l+2<r.length&&r[l+1].tag==="Det"&&!he(r[l+2].word)?[m.word,r[l+1].word,r[l+2].word]:[m.word,r[l+1].word];g.push({english:d.join(" "),meaning:b(d),isPhrase:!0}),l+=d.length-1;continue}if(m.tag==="Det"&&m.word.toLowerCase()==="every"&&l+1<r.length){const d=[m.word,r[l+1].word];g.push({english:d.join(" "),meaning:b(d),isPhrase:!0}),l+=1;continue}const F=b([m.word]);g.push({english:m.word,meaning:F,isPhrase:!1})}const W=g.map((l,m)=>e.jsxs("span",{className:"inline-flex items-baseline gap-2 whitespace-nowrap",children:[h&&c&&f?e.jsx(gt,{word:{word:l.english,meaning:l.meaning,source:"reading",sourceDetail:j==null?void 0:j.title},sets:o,onAddWord:h,onRemoveWord:c,onOpenManagement:f,size:"small",variant:"icon"}):e.jsx("span",{className:"inline-flex items-center justify-center w-7 h-7 bg-blue-500 text-white rounded-md text-base leading-none","aria-hidden":"true",title:"カスタムセット機能が未接続です",children:"+"}),e.jsx("span",{className:"font-medium text-gray-900",children:l.english}),e.jsx("span",{className:"text-gray-800",children:l.meaning})]},m));return e.jsxs("div",{className:"mt-2",children:[e.jsx("h5",{className:"text-xs font-semibold mb-1 text-gray-700",children:"📚 単語と熟語"}),e.jsx("div",{className:"flex flex-wrap gap-x-3 gap-y-1 text-sm",children:W})]})})(),(()=>{const r=Wt(z.text);return r.length===0?null:e.jsxs("div",{className:"mt-2",children:[e.jsx("h5",{className:"text-xs font-semibold mb-1 text-gray-700",children:"📐 重要構文"}),e.jsx("div",{className:"space-y-1",children:r.map((a,t)=>e.jsxs("div",{className:"bg-green-50 p-2 rounded border border-green-200",children:[e.jsxs("div",{className:"flex items-center justify-between text-sm",children:[e.jsx("span",{className:"font-semibold text-green-700",children:a.name}),e.jsx("span",{className:"text-xs text-gray-600",children:a.meaning})]}),e.jsxs("div",{className:"text-xs text-gray-600 mt-1",children:["💡 ",a.explanation]})]},t))})]})})(),(()=>{if(Te.length===0)return null;const r=z.text.toLowerCase(),a={"but|however|although|though|yet|nevertheless":["S1","S4","S5","S18","S81"],"because|since|as|so that":["S8","S19","S83"],"if|unless|provided|as long as":["S10","S96","S99"],"which|who|whom|that.*?who|that.*?which":["S11","S12","S13"],"not only.*?but also|both.*?and":["S16","S95"],"compare|than|more.*?than|less.*?than":["S17","S73","S74","S90"],"it is|it was.*?that":["S71"],"never|rarely|seldom|hardly":["S72"],"to be|in order to|so that":["S76","S83"],"may|might|could|would|should":["S82","S89","S91","S99"],"while|whereas|on the other hand":["S18","S84"],"for example|such as|like":["S91"],"overall|in short|in sum":["S80"],"far from|by no means":["S95","S98"]},t=[];for(const[s,i]of Object.entries(a)){if(new RegExp(s,"i").test(r))for(const p of i){const b=Te.find(g=>g.id===p);if(b&&!t.some(g=>g.id===b.id)&&(t.push(b),t.length>=2))break}if(t.length>=2)break}return t.length===0?null:e.jsxs("div",{className:"mt-2",children:[e.jsx("h5",{className:"text-xs font-semibold mb-1 text-gray-700",children:"💡 読解のヒント"}),e.jsx("div",{className:"space-y-2",children:t.map(s=>e.jsxs("div",{className:"bg-yellow-50 p-2 rounded border border-yellow-200",children:[e.jsx("div",{className:"text-sm font-semibold text-yellow-800 mb-1",children:s.title}),e.jsx("div",{className:"text-xs text-gray-700 mb-1",children:s.gist}),s.steps.length>0&&e.jsxs("div",{className:"text-xs text-gray-600",children:[e.jsx("div",{className:"font-semibold mb-0.5",children:"手順:"}),e.jsx("ul",{className:"list-disc list-inside space-y-0.5",children:s.steps.map((i,p)=>e.jsx("li",{children:i},p))})]})]},s.id))})]})})(),(()=>{if(je.length===0)return null;const r=z.text.toLowerCase(),a=re===0,t={"^(first|to begin|firstly|initially)":["P1","P2"],"(however|but|yet|nevertheless|on the other hand)":["P3","P10","P11","P71"],"(for example|for instance|such as)":["P4","P70"],"(therefore|thus|consequently|as a result|in conclusion)":["P5","P50","P51"],"(moreover|furthermore|in addition|additionally)":["P6","P75"],"(in contrast|while|whereas)":["P7","P8"],"(because|since|due to|owing to)":["P9"],"(although|though|even though|despite)":["P10"],"(first.*second.*third|firstly.*secondly)":["P15"],"(overall|in short|in sum|to sum up)":["P16","P17","P79"],"(the main point|the key|most important)":["P18","P73"],"(this suggests|this means|this indicates)":["P19","P84"],"(some argue|critics say|opponents claim)":["P71"],"(one way|another approach|a solution)":["P20"]},s=[];if(a&&!s.length){const i=je.find(p=>p.id==="P1");i&&s.push(i)}if(!s.length){for(const[i,p]of Object.entries(t))if(new RegExp(i,"i").test(r)){for(const b of p){const g=je.find(W=>W.id===b);if(g&&!s.some(W=>W.id===g.id)){s.push(g);break}}if(s.length>=1)break}}return s.length===0?null:e.jsxs("div",{className:"mt-2",children:[e.jsx("h5",{className:"text-xs font-semibold mb-1 text-gray-700",children:"📚 段落構造のヒント"}),e.jsx("div",{className:"space-y-2",children:s.map(i=>e.jsxs("div",{className:"bg-blue-50 p-2 rounded border border-blue-200",children:[e.jsx("div",{className:"text-sm font-semibold text-blue-800 mb-1",children:i.title}),e.jsx("div",{className:"text-xs text-gray-700 mb-1",children:i.gist}),i.steps.length>0&&e.jsxs("div",{className:"text-xs text-gray-600",children:[e.jsx("div",{className:"font-semibold mb-0.5",children:"手順:"}),e.jsx("ul",{className:"list-disc list-inside space-y-0.5",children:i.steps.map((p,b)=>e.jsx("li",{children:p},b))})]})]},i.id))})]})})(),!1]})]}),X==="fullText"&&e.jsxs("div",{className:"full-text-display",children:[e.jsx("h3",{children:"📄 全文"}),e.jsxs("div",{className:"full-text-controls",children:[e.jsx("button",{className:"px-6 py-3 text-base font-medium bg-primary text-white border-2 border-primary rounded-lg transition-all duration-200 hover:bg-primary-hover hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed:bg-primary-hover",onClick:()=>{const r=j.phrases.map(a=>a.segments.map(s=>s.word).join(" ").replace(/^[A-Z][a-z]*(?:\s+\d+)?:\s*/,"").replace(/"/g,"")).join(" ").replace(/\s+([.,!?;:])/g,"$1");me(r),ke(!0),ce(!1)},disabled:de&&!ge,title:"全文を発音",children:"🔊 発音"}),e.jsx("button",{className:"px-6 py-3 text-base font-medium bg-warning text-warning-dark border-2 border-warning rounded-lg transition-all duration-200 hover:bg-warning-hover hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed:bg-warning-hover",onClick:()=>{ge?(pt(),ce(!1)):(ut(),ce(!0))},disabled:!de,title:ge?"発音を再開":"発音を一時停止",children:ge?"▶️ 再開":"⏸️ 一時停止"}),e.jsx("button",{className:"px-6 py-3 text-base font-medium bg-error text-white border-2 border-error rounded-lg transition-all duration-200 hover:bg-error-hover hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed:bg-error-hover",onClick:()=>{ft(),ke(!1),ce(!1)},disabled:!de,title:"発音を停止",children:"⏹️ 停止"})]}),e.jsx("div",{className:"full-text-content",children:(()=>{if(j.originalText)return e.jsx("div",{className:"paragraph-en",children:j.originalText});if(j.title.toLowerCase().includes("conversation")){const a=[];return j.phrases.forEach(t=>{let s=t.segments.map(i=>i.word).join(" ").trim();!s||s==="-"||(s=s.replace(/\s+([.,!?;:"])/g,"$1"),a.push(s))}),e.jsx("div",{children:a.map((t,s)=>e.jsx("p",{className:"paragraph-en conversation-line",children:t},s))})}else{const t=j.phrases[0].segments.map(w=>w.word).join(" ").trim(),s=t.length<100&&!/[.!?]$/.test(t);let i="",p=!0;j.phrases.forEach((w,R)=>{R===0&&s||w.segments.forEach(U=>{let N=U.word.trim();N&&N!=="-"&&(/^[.,!?;:]$/.test(N)?(i+=N,p=/^[.!?]$/.test(N)):(N==='"'||N==="'"||(p&&N.length>0&&(N=N.charAt(0).toUpperCase()+N.slice(1),p=!1),i.length>0&&!i.endsWith(" ")&&!i.endsWith('"')&&!i.endsWith("'")&&(i+=" ")),i+=N))})}),i=i.replace(/\s+"/g,'"').replace(/\s+'/g,"'");const b=i.split(/([.!?])\s+/).filter(w=>w.trim()),g=[];for(let w=0;w<b.length;w+=2){const R=b[w],U=b[w+1]||"";g.push((R+U).trim())}const W=[];let l=[],m=0;const T=60;g.forEach((w,R)=>{const U=w.split(/\s+/).length;l.push(w),m+=U,(m>=T||R===g.length-1)&&(W.push(l.join(" ")),l=[],m=0)}),l.length>0&&W.push(l.join(" "));const F=g,d=w=>{pe(w);const R=F[w],U=ee?xe(ee,R):null,N=U?be(R,U.tokens):we(R);ae({text:R,grammarAnalysis:N,showMeanings:!1})};return e.jsxs("div",{children:[e.jsx("div",{className:"sentences-container",children:F.map((w,R)=>e.jsxs("span",{className:`sentence-clickable ${re===R?"selected":""}`,onClick:()=>d(R),children:[w," "]},R))}),re!==null&&z&&e.jsxs("div",{className:"selected-sentence-analysis",children:[e.jsxs("div",{className:"flex justify-between items-center mb-4",children:[e.jsx("h4",{className:"m-0",children:"📖 選択した文の読解"}),e.jsxs("div",{className:"flex gap-2",children:[e.jsx("button",{className:"px-3 py-1 text-sm bg-primary text-white rounded hover:bg-primary-hover",onClick:()=>me(z.text),title:"この文を発音",children:"🔊 発音"}),e.jsx("button",{className:"px-3 py-1 text-sm bg-info text-white rounded hover:bg-info-hover",onClick:()=>ae({...z,showMeanings:!z.showMeanings}),children:z.showMeanings?"意味を隠す":"意味を表示"})]})]}),e.jsx("div",{className:"selected-sentence-text text-gray-900",children:z.text}),e.jsxs("div",{className:"grammar-structure mt-4",children:[e.jsx("h5",{className:"text-sm font-semibold mb-2",children:"🔤 文法構造:"}),e.jsx("div",{className:"flex flex-wrap gap-2",children:(()=>{const w=Pe(z.text),R=Je[w];if(R)return R.map((k,V)=>e.jsx("div",{className:"inline-flex flex-col items-center",children:(()=>{const q=De(k.label),ne=ie(q);return e.jsxs(e.Fragment,{children:[e.jsx("span",{className:`font-medium text-base text-gray-900 border-b-2 ${ne.underline}`,children:k.text}),e.jsx("span",{className:`text-xs font-semibold mt-0.5 ${ne.text}`,title:k.label,children:q})]})})()},V));const U=z.grammarAnalysis,N=U.some(k=>k.word==="."),B=U.filter(k=>!he(k.word)),Q=B.map(k=>Ge(k.tag));for(let k=1;k+1<B.length;k++){if(B[k].tag!=="Conj")continue;const V=Q[k-1],q=Q[k+1];V===q&&(Q[k]=V)}const te=B.findIndex(k=>k.tag==="S");if(te>0)for(let k=te-1;k>=0;k--){const V=B[k].tag;if(V==="Det"||V==="Adj")Q[k]="S";else break}const fe=B.findIndex(k=>k.tag==="V");if(fe>=0){const k=B.findIndex((V,q)=>q>fe&&(V.tag==="O"||V.tag==="C"));if(k>fe+1){const V=B[k].tag==="C"?"C":"O";for(let q=k-1;q>fe;q--){const ne=B[q].tag;if(ne==="Det"||ne==="Adj")Q[q]=V;else break}}}const Se=[];for(let k=0;k<B.length;k++){const V=Q[k],q=k,ne=[B[k].word];for(;k+1<B.length&&Q[k+1]===V;)ne.push(B[k+1].word),k++;const Ie=ie(V),it=ne.join(" ");Se.push(e.jsxs("div",{className:"inline-flex flex-col items-center",title:V==="S"?"主語":V==="V"?"動詞":V==="O"?"目的語":V==="C"?"補語":"修飾語",children:[e.jsx("span",{className:`font-medium text-base text-gray-900 border-b-2 ${Ie.underline}`,children:it}),e.jsx("span",{className:`text-xs font-semibold mt-0.5 ${Ie.text}`,children:V})]},`${q}-${k}-${V}`))}if(N){const k=ie("M");Se.push(e.jsxs("div",{className:"inline-flex flex-col items-center",title:"ピリオド",children:[e.jsx("span",{className:`font-medium text-base text-gray-900 border-b-2 ${k.underline}`,children:"."}),e.jsx("span",{className:`text-xs font-semibold mt-0.5 ${k.text}`,children:" "})]},"__period__"))}return Se})()})]})]})]})}})()})]}),X==="fullTranslation"&&e.jsx("div",{className:"full-translation-display",children:e.jsx("div",{className:"full-translation-content",children:(()=>{var a;if(console.log("[全訳タブ] currentPassage.id:",j.id),console.log("[全訳タブ] currentPassage.translation exists:",!!j.translation),console.log("[全訳タブ] currentPassage.translation length:",((a=j.translation)==null?void 0:a.length)||0),j.translation){const t=j.translation.split(/\n+/).map(s=>s.trim()).filter(s=>s.length>0);return e.jsx("div",{className:"full-translation-text",children:t.map((s,i)=>e.jsx("p",{className:"paragraph-ja",children:s},i))})}if(j.title.toLowerCase().includes("conversation")){const t=[];return j.phrases.forEach(s=>{let i=s.phraseMeaning||"";i=i.replace(/\[要修正\]/g,"").trim(),!(!i||i==="-")&&t.push(i)}),t.map((s,i)=>e.jsx("p",{className:"paragraph-ja conversation-line",children:s},i))}else{const t=[];let s="";j.phrases.forEach(b=>{let g=b.phraseMeaning||"";if(g){if(g=g.replace(/\[要修正\]/g,"").trim(),!g)return;const W=b.segments.map(m=>m.word).join(" ").trim(),l=/[.!?]$/.test(W);/[。！？]$/.test(g)?(s+=g,l&&(t.push(s.trim()),s="")):l?(s+=g+"。",t.push(s.trim()),s=""):s+=g+"、"}}),s.trim()&&t.push(s.trim()+"。");const i=[],p=4;for(let b=0;b<t.length;b+=p){const g=t.slice(b,b+p);i.push(g.join(""))}return i.map((b,g)=>e.jsx("p",{className:"paragraph-ja",children:b},g))}})()})})]}),e.jsx("style",{children:`
        .comprehensive-reading-view {
          max-width: 1200px;
          margin: 0 auto;
          padding: 20px;
          width: 100%;
        }

        @media (max-width: 768px) {
          .comprehensive-reading-view {
            max-width: 100%;
            margin: 0;
            padding: 8px;
          }
        }

        .reading-header {
          background: white;
          padding: 20px;
          border-radius: 8px;
          box-shadow: 0 2px 4px rgba(0,0,0,0.1);
          margin-bottom: 20px;
        }

        .dark-mode .reading-header {
          background: var(--gray-800);
        }

        .reading-header h2 {
          margin: 0 0 20px 0;
        }

        .filter-controls, .passage-selector {
          margin-bottom: 15px;
        }

        .filter-controls label, .passage-selector label {
          font-weight: bold;
          margin-right: 10px;
          color: #333;
        }

        .dark-mode .filter-controls label,
        .dark-mode .passage-selector label {
          color: var(--gray-200);
        }

        .filter-controls select, .passage-selector select {
          padding: 8px 12px;
          border: 1px solid #ddd;
          border-radius: 4px;
          font-size: 14px;
          background: white;
          color: #333;
        }

        .dark-mode .filter-controls select,
        .dark-mode .passage-selector select {
          background: var(--gray-700);
          border-color: var(--gray-600);
          color: var(--gray-200);
        }

        .passage-stats {
          display: flex;
          gap: 10px;
          margin: 15px 0;
          flex-wrap: wrap;
        }

        .stat-badge {
          display: inline-block;
          padding: 6px 12px;
          background: #f0f0f0;
          border-radius: 4px;
          font-size: 14px;
          color: #333;
        }

        .dark-mode .stat-badge {
          background: var(--gray-700);
          color: var(--gray-200);
        }

        .stat-badge.unknown-count {
          background: #fff3cd;
          color: #856404;
          font-weight: bold;
        }

        .dark-mode .stat-badge.unknown-count {
          background: var(--yellow-500);
          color: var(--black);
        }

        .action-buttons {
          display: flex;
          gap: 10px;
          margin-top: 15px;
        }

        .action-buttons button {
          padding: 10px 20px;
          border: none;
          border-radius: 4px;
          cursor: pointer;
          font-size: 14px;
          font-weight: bold;
          transition: all 0.3s;
        }

        .btn-primary {
          background: #007bff;
          color: white;
        }

        .btn-primary:hover {
          background: #0056b3;
        }

        .btn-info {
          background: #17a2b8;
          color: white;
        }

        .btn-info:hover {
          background: #138496;
        }

        .btn-success {
          background: #28a745;
          color: white;
        }

        .btn-success:hover {
          background: #218838;
        }

        .btn-success:disabled {
          background: #ccc;
          cursor: not-allowed;
        }

        .btn-secondary {
          background: #6c757d;
          color: white;
        }

        .btn-secondary:hover {
          background: #545b62;
        }

        .passage-content {
          background: white;
          padding: 30px;
          border-radius: 8px;
          box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }

        .dark-mode .passage-content {
          background: var(--gray-800);
          color: var(--gray-100);
        }

        .passage-title {
          text-align: center;
          color: #333;
          margin-bottom: 30px;
          font-size: 24px;
          font-family: 'Times New Roman', Georgia, serif;
        }

        .dark-mode .passage-title {
          color: var(--white);
        }

        .passage-body {
          line-height: 1.5;
          font-family: 'Times New Roman', Georgia, serif;
          color: #333;
        }

        .dark-mode .passage-body {
          color: var(--gray-200);
        }

        .phrase-block {
          margin-bottom: 8px;
          padding: 8px 12px;
          background: #ffffff;
          border-left: 3px solid #007bff;
          border-radius: 2px;
        }

        .dark-mode .phrase-block {
          background: var(--gray-700);
          border-left-color: var(--blue-400);
        }

        .phrase-english {
          font-size: 16px;
          line-height: 1.6;
          margin-bottom: 6px;
          font-family: 'Times New Roman', 'Georgia', serif;
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
          align-items: flex-start;
        }

        .word-card {
          display: inline-flex;
          flex-direction: column;
          align-items: center;
          padding: 2px 5px;
          margin: 1px;
          background: #f8f9fa;
          border: 1px solid #dee2e6;
          border-radius: 4px;
          cursor: pointer;
          transition: all 0.2s;
          min-width: 60px;
        }

        .dark-mode .word-card {
          background: var(--gray-700);
          border-color: var(--gray-600);
        }

        .word-card:hover {
          background: #e7f3ff;
          border-color: #007bff;
        }

        .dark-mode .word-card:hover {
          background: var(--gray-600);
          border-color: var(--blue-400);
        }

        .word-card.unknown {
          background: #ffc107;
          color: #000;
          border-color: #ff9800;
          font-weight: bold;
        }

        .word-card.phrase-card {
          background: #e8f5e9;
          border-color: #4caf50;
        }

        .dark-mode .word-card.phrase-card {
          background: var(--gray-700);
          border-color: var(--green-400);
        }

        .word-card.phrase-card:hover {
          background: #c8e6c9;
        }

        .dark-mode .word-card.phrase-card:hover {
          background: var(--gray-600);
        }

        .word-card.punctuation-card {
          min-width: 20px;
          background: transparent;
          border: none;
          cursor: default;
          padding: 2px 4px;
        }

        .word-card.punctuation-card:hover {
          background: transparent;
          border: none;
        }

        .word-card-word {
          font-size: 16px;
          font-weight: 500;
          color: #333;
          text-align: center;
          font-family: 'Times New Roman', Georgia, serif;
        }

        .dark-mode .word-card-word {
          color: var(--gray-200);
        }

        .phrase-card .word-card-word {
          font-size: 15px;
          color: #2e7d32;
          font-family: 'Times New Roman', Georgia, serif;
        }

        .dark-mode .phrase-card .word-card-word {
          color: var(--green-400);
        }

        .word-card-meaning {
          font-size: 12px;
          color: #666;
          margin-top: 1px;
          text-align: center;
          padding: 1px 3px;
          background: rgba(255, 255, 255, 0.8);
          border-radius: 2px;
          min-height: 14px;
        }

        .dark-mode .word-card-meaning {
          color: var(--gray-300);
          background: rgba(48, 48, 48, 0.8);
        }

        .word-segment {
          display: inline-block;
          padding: 2px 4px;
          margin: 0 2px;
          cursor: pointer;
          border-radius: 3px;
          transition: all 0.2s;
          font-family: 'Times New Roman', Georgia, serif;
        }

        .word-segment:hover {
          background: #e7f3ff;
        }

        .word-segment.unknown {
          background: #ffc107;
          color: #000;
          font-weight: bold;
        }

        .show-translation-btn {
          background: #f8f9fa;
          border: 1px solid #ddd;
          padding: 8px 16px;
          border-radius: 4px;
          cursor: pointer;
          color: #666;
          font-size: 14px;
        }

        .show-translation-btn:hover {
          background: #e9ecef;
        }

        .phrase-translation {
          margin-top: 10px;
          padding: 15px;
          background: white;
          border-radius: 4px;
          border: 1px solid #dee2e6;
        }

        .dark-mode .phrase-translation {
          background: var(--gray-800);
          border-color: var(--gray-600);
        }

        .translation-text {
          font-size: 16px;
          color: #333;
          margin-bottom: 10px;
          font-weight: 500;
        }

        .dark-mode .translation-text {
          color: var(--gray-200);
        }

        .word-meanings {
          display: flex;
          flex-wrap: wrap;
          gap: 10px;
          font-size: 14px;
          color: #666;
        }

        .dark-mode .word-meanings {
          color: var(--gray-300);
        }

        .word-meaning-pair {
          background: #e7f3ff;
          padding: 4px 8px;
          border-radius: 3px;
        }

        .dark-mode .word-meaning-pair {
          background: var(--gray-700);
          color: var(--gray-200);
        }

        .error-message, .empty-container {
          text-align: center;
          padding: 50px;
          font-size: 18px;
          color: #666;
        }

        .dark-mode .error-message,
        .dark-mode .empty-container {
          color: var(--gray-300);
        }

        .error-message {
          color: #dc3545;
        }

        .dark-mode .error-message {
          color: var(--red-400);
        }

        /* 単語ポップアップのスタイル */
        .word-popup-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: transparent;
          z-index: 999;
        }

        .word-popup {
          position: absolute;
          left: var(--popup-x, 0);
          top: var(--popup-y, 0);
          background: white;
          border: 2px solid #007bff;
          border-radius: 8px;
          padding: 16px;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
          z-index: 1000;
          max-width: 400px;
          min-width: 250px;
        }

        .dark-mode .word-popup {
          background: var(--gray-800);
          border-color: var(--blue-400);
          color: var(--gray-200);
        }

        .popup-close {
          position: absolute;
          top: 8px;
          right: 8px;
          background: #f8f9fa;
          border: none;
          border-radius: 4px;
          width: 24px;
          height: 24px;
          cursor: pointer;
          font-size: 16px;
          line-height: 1;
          color: #666;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .popup-close:hover {
          background: #e9ecef;
          color: #000;
        }

        .popup-word {
          font-size: 20px;
          font-weight: bold;
          color: #007bff;
          margin-bottom: 4px;
          padding-right: 30px;
        }

        .popup-reading {
          font-size: 14px;
          color: #666;
          margin-bottom: 8px;
        }

        .popup-meaning {
          font-size: 16px;
          color: #333;
          margin-bottom: 12px;
          padding: 8px;
          background: #f0f8ff;
          border-radius: 4px;
        }

        .popup-etymology {
          font-size: 13px;
          color: #555;
          margin-bottom: 8px;
          padding: 6px;
          background: #f8f9fa;
          border-radius: 4px;
        }

        .popup-related {
          font-size: 13px;
          color: #555;
          padding: 6px;
          background: #f8f9fa;
          border-radius: 4px;
        }

        .popup-etymology strong,
        .popup-related strong {
          color: #007bff;
        }

        .full-text-display, .full-translation-display {
          background: white;
          padding: 20px;
          border-radius: 8px;
          box-shadow: 0 2px 4px rgba(0,0,0,0.1);
          margin-top: 20px;
        }

        .dark-mode .full-text-display,
        .dark-mode .full-translation-display {
          background: var(--gray-800);
          color: var(--gray-100);
        }

        .full-text-display h3, .full-translation-display h3 {
          margin: 0 0 15px 0;
          color: #667eea;
        }

        .dark-mode .full-text-display h3,
        .dark-mode .full-translation-display h3 {
          color: var(--blue-400);
        }

        .full-text-content {
          font-size: 1.1em;
          line-height: 1.8;
          color: #333;
          font-family: 'Times New Roman', 'Georgia', serif;
        }

        .full-text-content .paragraph-en {
          margin-bottom: 1.5em;
          text-indent: 2em;
          text-align: left;
        }

        .full-text-content .paragraph-en:first-child {
          margin-top: 0;
        }

        /* 会話形式の行スタイル */
        .full-text-content .conversation-line {
          text-indent: 0;
          margin-bottom: 1em;
          padding-left: 1em;
          border-left: 3px solid #667eea;
        }

        .full-translation-content {
          font-size: 1.05em;
          line-height: 2;
          color: #333;
        }

        .full-translation-text {
          white-space: pre-wrap;
          line-height: 2;
        }

        .full-translation-content .paragraph-ja {
          margin-bottom: 1.5em;
          text-indent: 1em;
          text-align: left;
        }

        .full-translation-content .paragraph-ja:first-child {
          margin-top: 0;
        }

        /* 会話形式の日本語訳スタイル */
        .full-translation-content .conversation-line {
          text-indent: 0;
          margin-bottom: 1em;
          padding-left: 1em;
          border-left: 3px solid #667eea;
        }

        .translation-line {
          margin-bottom: 10px;
          padding: 8px;
          background: #f8f9fa;
          border-radius: 4px;
        }
      `})]})}export{Gt as default};
//# sourceMappingURL=ComprehensiveReadingView-DNoisdy3.js.map
