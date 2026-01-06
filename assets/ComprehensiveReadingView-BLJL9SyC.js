import{j as e}from"./chart-vendor-Eu4deRvW.js";import{r as N}from"./react-vendor-C14am9Lm.js";import{f as C,q as ot,r as it,u as lt,v as dt,w as ct,x as fe,y as xe,A as ht,z as gt,B as pt,C as ut}from"./index-C0XiAais.js";function mt(r){const l=r.split("/").pop()||"",p=l.replace(/\.txt$/,"").split("_");return p.length>=3?p.slice(2).join("_"):l}const ft=[{id:"beginner-morning-routine",level:"beginner",topic:"daily-life",wordCount:50,filePath:"/data/passages-for-phrase-work/beginner_50_Morning-Routine.txt"},{id:"beginner-supermarket-shopping",level:"beginner",topic:"daily-life",wordCount:1910,filePath:"/data/passages-for-phrase-work/beginner_1910_Shopping-at-the-Supermarket.txt"},{id:"beginner-cafe-day",level:"beginner",topic:"food-culture",wordCount:1380,filePath:"/data/passages-for-phrase-work/beginner_1380_A-Day-at-the-Cafe.txt"},{id:"beginner-conversation-daily",level:"beginner",topic:"communication",wordCount:3018,filePath:"/data/passages-for-phrase-work/beginner_3018_Daily-Conversations.txt"},{id:"beginner-weather-seasons",level:"beginner",topic:"nature",wordCount:2111,filePath:"/data/passages-for-phrase-work/beginner_2111_Weather-and-Seasons.txt"},{id:"beginner-wildlife-park-guide",level:"beginner",topic:"animals",wordCount:2097,filePath:"/data/passages-for-phrase-work/beginner_2097_Wildlife-Park-Guide.txt"},{id:"intermediate-exchange-student-australia",level:"intermediate",topic:"culture-exchange",wordCount:3199,filePath:"/data/passages-for-phrase-work/intermediate_3199_Exchange-Student-in-Australia.txt"},{id:"intermediate-homestay-america",level:"intermediate",topic:"culture-exchange",wordCount:3148,filePath:"/data/passages-for-phrase-work/intermediate_3148_Homestay-in-America.txt"},{id:"intermediate-career-day",level:"intermediate",topic:"education-career",wordCount:2895,filePath:"/data/passages-for-phrase-work/intermediate_2895_Career-Day-at-School.txt"},{id:"intermediate-hospital-visit",level:"intermediate",topic:"health",wordCount:2721,filePath:"/data/passages-for-phrase-work/intermediate_2721_A-Visit-to-the-Hospital.txt"},{id:"intermediate-science-museum",level:"intermediate",topic:"science-education",wordCount:3265,filePath:"/data/passages-for-phrase-work/intermediate_3265_Science-Museum-Experience.txt"},{id:"intermediate-community-events",level:"intermediate",topic:"community",wordCount:2216,filePath:"/data/passages-for-phrase-work/intermediate_2216_Community-Events.txt"},{id:"intermediate-school-events-year",level:"intermediate",topic:"school-life",wordCount:2558,filePath:"/data/passages-for-phrase-work/intermediate_2558_A-Year-of-School-Events.txt"},{id:"intermediate-school-news",level:"intermediate",topic:"school-life",wordCount:1937,filePath:"/data/passages-for-phrase-work/intermediate_1937_School-News.txt"},{id:"advanced-environmental-issues",level:"advanced",topic:"environment",wordCount:4263,filePath:"/data/passages-for-phrase-work/advanced_4263_Environmental-Issues-and-Solutions.txt"},{id:"advanced-family-gathering",level:"advanced",topic:"culture-family",wordCount:4493,filePath:"/data/passages-for-phrase-work/advanced_4493_Family-Gathering-Traditions.txt"},{id:"advanced-health-statistics",level:"advanced",topic:"health-data",wordCount:3422,filePath:"/data/passages-for-phrase-work/advanced_3422_Health-Statistics-Analysis.txt"},{id:"advanced-historical-figures",level:"advanced",topic:"history",wordCount:3115,filePath:"/data/passages-for-phrase-work/advanced_3115_Historical-Figures-Study.txt"},{id:"advanced-international-exchange",level:"advanced",topic:"culture-global",wordCount:3813,filePath:"/data/passages-for-phrase-work/advanced_3813_Cultural-Exchange-Insights.txt"},{id:"advanced-school-festival",level:"advanced",topic:"school-events",wordCount:4419,filePath:"/data/passages-for-phrase-work/advanced_4419_School-Festival-Planning.txt"},{id:"advanced-summer-vacation-stories",level:"advanced",topic:"personal-growth",wordCount:3255,filePath:"/data/passages-for-phrase-work/advanced_3255_Summer-Vacation-Stories.txt"},{id:"advanced-technology-future",level:"advanced",topic:"technology-innovation",wordCount:3161,filePath:"/data/passages-for-phrase-work/advanced_3161_Technology-and-Future.txt"}],_e=ft.map(r=>({...r,title:mt(r.filePath),level:r.level}));function Ge(){return _e}async function Je(r){try{const l=_e.find(k=>k.id===r);if(!l)return C.error(`Passage not found: ${r}`),"";const p=`/data/passages-original/${l.filePath.split("/").pop()||""}`,w=await fetch(p);return w.ok?await w.text():(C.log(`Original file not found: ${p}`),"")}catch(l){return C.error(`Error loading original passage ${r}:`,l),""}}async function xt(r){const l=_e.find(c=>c.id===r);if(!l)return C.error(`Passage not found: ${r}`),null;try{const c=await fetch(l.filePath);if(!c.ok)throw new Error(`Failed to fetch: ${c.statusText}`);const p=await c.text(),w=wt(p);return{...l,content:p,sections:w}}catch(c){return C.error(`Error loading passage ${r}:`,c),null}}function wt(r){const l=r.split(`
`),c=[];let p=null;for(const w of l){const u=w.trim();u&&(!w.startsWith("    ")&&u.length>0&&u.length<80?(p&&c.push(p),p={title:u,paragraphs:[]}):w.startsWith("    ")&&p&&p.paragraphs.push(u))}return p&&c.push(p),c}function oe(r){const l=r.toLowerCase().trim();if(l.endsWith("ing")&&l.length>4){const c=l.slice(0,-3);return c.endsWith("n")||c.endsWith("m")||c.endsWith("t")?c.slice(0,-1):c+"e"}if(l.endsWith("ed")&&l.length>3){const c=l.slice(0,-2);return c.endsWith("i")?c.slice(0,-1)+"y":c}return l.endsWith("es")&&l.length>3?l.slice(0,-2):l.endsWith("s")&&l.length>2&&!l.endsWith("ss")?l.slice(0,-1):l}async function Ke(r){try{let l=`/data/passages/passages-translations/${r}-ja.txt`;console.log(`[全訳] Attempting to load: ${l} for passageId: ${r}`);let c=await fetch(l);if(c.ok||(l=`/data/passages-translations/${r}-ja.txt`,console.log(`[全訳] Trying old path: ${l}`),c=await fetch(l)),!c.ok)return console.log(`[全訳] File not found (${c.status}): ${l}`),"";const p=await c.text();return console.log(`[全訳] Successfully loaded ${p.length} characters from ${l}`),p}catch(l){return console.error(`[全訳] Error loading full translation for ${r}:`,l),""}}async function bt(r){try{const l=Ge().find(j=>j.id===r);if(!l)return[];const p=`/data/passages-for-phrase-work-ja/${(l.filePath.split("/").pop()||"").replace(/\.txt$/,"-ja.txt")}`,w=await fetch(p);if(!w.ok)return C.log(`No Japanese phrase file found: ${p}`),[];const k=(await w.text()).split(`
`).map(j=>j.trim()).filter(j=>j.length>0);return C.log(`Loaded ${k.length} Japanese phrases from ${p}`),k}catch(l){return C.error(`Error loading Japanese phrases for ${r}:`,l),[]}}async function vt(r,l){const c=await xt(r);if(!c)return null;const[p,w,u]=await Promise.all([bt(r),Ke(r),Je(r)]);let k=0;const j=[];return c.sections.forEach(T=>{T.paragraphs.forEach(F=>{if(F.match(/^([^:]+):\s*"([^"]+)"$/)){const Z=F.trim(),K=Z.split(/\s+/),ne=K.map(q=>{let S=q,B="";if(S.startsWith('"')&&(B='"',S=S.substring(1)),/^(Ms|Mr|Mrs|Dr|Prof|St|Ave|Inc|Ltd|etc)\.$|^[A-Z]\.$|^vs\.$|^e\.g\.$|^i\.e\.$/.test(S)){const $=oe(S.replace(/\.$/,"")),U=l.get($),D=(U==null?void 0:U.meaning)||"",V=[];return B&&V.push({word:B,meaning:"",isUnknown:!1}),V.push({word:S,meaning:D==="-"?"":D,isUnknown:!1}),V}const z=S.match(/([.,!?;:—"])$/);if(z){const $=S.replace(/[.,!?;:—"]$/,""),U=z[1];if(!$){const Y=[];return B&&Y.push({word:B,meaning:"",isUnknown:!1}),Y.push({word:U,meaning:"",isUnknown:!1}),Y}const D=oe($),V=l.get(D),se=(V==null?void 0:V.meaning)||"",le=[];return B&&le.push({word:B,meaning:"",isUnknown:!1}),le.push({word:$,meaning:se==="-"?"":se,isUnknown:!1}),le.push({word:U,meaning:"",isUnknown:!1}),le}else{const $=oe(S),U=l.get($),D=(U==null?void 0:U.meaning)||"",V=[];return B&&V.push({word:B,meaning:"",isUnknown:!1}),V.push({word:S,meaning:D==="-"?"":D,isUnknown:!1}),V}}).flat(),Q=p[k]||"";k++,j.push({english:Z,japanese:Q,phraseMeaning:Q,words:K,segments:ne})}else{const Z=F.trim(),K=Z.split(/\s+/),ne=K.map(q=>{if(/^(Ms|Mr|Mrs|Dr|Prof|St|Ave|Inc|Ltd|etc)\.$|^[A-Z]\.$|^vs\.$|^e\.g\.$|^i\.e\.$/.test(q)){const W=oe(q.replace(/\.$/,"")),z=l.get(W),$=(z==null?void 0:z.meaning)||"";return{word:q,meaning:$==="-"?"":$,isUnknown:!1}}const B=q.match(/([.,!?;:—])$/);if(B){const W=q.replace(/[.,!?;:—]$/,""),z=B[1];if(!W)return{word:z,meaning:"",isUnknown:!1};const $=oe(W),U=l.get($),D=(U==null?void 0:U.meaning)||"";return[{word:W,meaning:D==="-"?"":D,isUnknown:!1},{word:z,meaning:"",isUnknown:!1}]}else{const W=oe(q),z=l.get(W),$=(z==null?void 0:z.meaning)||"";return{word:q,meaning:$==="-"?"":$,isUnknown:!1}}}).flat(),Q=p[k]||"";k++,j.push({english:Z,japanese:Q,phraseMeaning:Q,words:K,segments:ne})}})}),{id:c.id,title:c.title,level:c.level,actualWordCount:c.wordCount,phrases:j,translation:w,originalText:u}}async function yt(r){var l;try{const c=await fetch(`/data/passages-phrase-learning/${r}.json`);if(!c.ok)return C.log(`No phrase learning JSON found for ${r}, will use .txt conversion`),null;const p=await c.json();C.log(`Loaded phrase learning JSON for ${r}, phrases: ${((l=p.phrases)==null?void 0:l.length)||0}`);const[w,u]=await Promise.all([Ke(r),Je(r)]);return{...p,phrases:p.phrases||[],translation:w,originalText:u}}catch{return C.log(`Skipping phrase learning JSON for ${r} (file may be old or moved), will use .txt conversion`),null}}async function kt(r){var p;const l=Ge(),c=[];C.log(`Loading ${l.length} passages...`);for(const w of l){let u=await yt(w.id);u||(u=await vt(w.id,r)),u?(C.log(`✓ Loaded passage: ${w.id} (${((p=u.phrases)==null?void 0:p.length)||0} phrases)`),c.push(u)):C.error(`✗ Failed to load passage: ${w.id}`)}return C.log(`Total passages loaded: ${c.length}`),c}const Ce=new Map;async function jt(r){try{const l=await fetch(r);return l.ok?await l.json():null}catch(l){return C.warn(`[readingTechniquesLoader] Failed to load ${r}:`,l),null}}function qe(r,l){return Ce.has(r)||Ce.set(r,jt(l)),Ce.get(r)}function Re(r){const l=r.match(/(\d+)$/);if(!l)return null;const c=Number(l[1]);return Number.isFinite(c)?c:null}function He(r){return r.slice().sort((l,c)=>(Re(l.id)??Number.POSITIVE_INFINITY)-(Re(c.id)??Number.POSITIVE_INFINITY))}function Nt(){return qe("paragraph_reading_patterns","/data/reading-techniques/paragraph_reading_patterns.json").then(r=>r?{...r,patterns:He(r.patterns)}:null)}function St(){return qe("sentence_reading_patterns","/data/reading-techniques/sentence_reading_patterns.json").then(r=>r?{...r,patterns:He(r.patterns)}:null)}const Fe=new Set(["be","am","is","are","was","were","been","being","have","has","had","having","do","does","did","done","doing","can","could","will","would","shall","should","may","might","must","go","goes","went","gone","going","get","gets","got","gotten","getting","make","makes","made","making","take","takes","took","taken","taking","see","sees","saw","seen","seeing","come","comes","came","coming","want","wants","wanted","wanting","use","uses","used","using","find","finds","found","finding","give","gives","gave","given","giving","tell","tells","told","telling","work","works","worked","working","call","calls","called","calling","try","tries","tried","trying","ask","asks","asked","asking","need","needs","needed","needing","feel","feels","felt","feeling","become","becomes","became","becoming","leave","leaves","left","leaving","put","puts","putting","mean","means","meant","meaning","keep","keeps","kept","keeping","let","lets","letting","begin","begins","began","begun","beginning","seem","seems","seemed","seeming","help","helps","helped","helping","talk","talks","talked","talking","turn","turns","turned","turning","start","starts","started","starting","show","shows","showed","shown","showing","hear","hears","heard","hearing","play","plays","played","playing","run","runs","ran","running","move","moves","moved","moving","like","likes","liked","liking","live","lives","lived","living","believe","believes","believed","believing","bring","brings","brought","bringing","happen","happens","happened","happening","write","writes","wrote","written","writing","sit","sits","sat","sitting","stand","stands","stood","standing","lose","loses","lost","losing","pay","pays","paid","paying","meet","meets","met","meeting","include","includes","included","including","continue","continues","continued","continuing","set","sets","setting","learn","learns","learned","learning","change","changes","changed","changing","lead","leads","led","leading","understand","understands","understood","understanding","watch","watches","watched","watching","follow","follows","followed","following","stop","stops","stopped","stopping","create","creates","created","creating","speak","speaks","spoke","spoken","speaking","read","reads","reading","spend","spends","spent","spending","grow","grows","grew","grown","growing","open","opens","opened","opening","walk","walks","walked","walking","win","wins","won","winning","teach","teaches","taught","teaching","offer","offers","offered","offering","remember","remembers","remembered","remembering","consider","considers","considered","considering","appear","appears","appeared","appearing","buy","buys","bought","buying","serve","serves","served","serving","die","dies","died","dying","send","sends","sent","sending","build","builds","built","building","stay","stays","stayed","staying","fall","falls","fell","fallen","falling","cut","cuts","cutting","reach","reaches","reached","reaching","kill","kills","killed","killing","raise","raises","raised","raising","pass","passes","passed","passing","sell","sells","sold","selling","decide","decides","decided","deciding","return","returns","returned","returning","explain","explains","explained","explaining","hope","hopes","hoped","hoping","develop","develops","developed","developing","carry","carries","carried","carrying","break","breaks","broke","broken","breaking","receive","receives","received","receiving","agree","agrees","agreed","agreeing","support","supports","supported","supporting","hit","hits","hitting","produce","produces","produced","producing","eat","eats","ate","eaten","eating","cover","covers","covered","covering","catch","catches","caught","catching","draw","draws","drew","drawn","drawing","wake","wakes","woke","woken","waking","brush","brushes","brushed","brushing","wash","washes","washed","washing","prepare","prepares","prepared","preparing","check","checks","checked","checking"]),$e=new Set(["in","on","at","to","for","with","from","by","about","as","into","like","through","after","over","between","out","against","during","without","before","under","around","among","of","up"]),Ct=new Set(["and","but","or","so","yet","for","nor","because","although","if","when","while","since","unless","that","which","who","whom","whose","where"]),Pt=new Set(["the","a","an","this","that","these","those","my","your","his","her","its","our","their","some","any","no","every","each","either","neither","much","many","more","most","few","little","several"]),Ue=new Set(["i","you","he","she","it","we","they","me","him","her","us","them","myself","yourself","himself","herself","itself","ourselves","themselves"]),$t=new Set(["good","new","first","last","long","great","little","own","other","old","right","big","high","different","small","large","next","early","young","important","few","public","bad","same","able","ready","usual"]),_t=new Set(["not","so","up","out","just","now","how","then","more","also","here","well","only","very","even","back","there","down","still","in","as","too","when","never","really","usually","finally","first","after","before"]);function Ye(r){return{S:"#3b82f6",V:"#ef4444",O:"#10b981",C:"#f59e0b",M:"#8b5cf6",Prep:"#6366f1",Conj:"#ec4899",Det:"#14b8a6",Adj:"#f97316",Adv:"#a855f7",Unknown:"#6b7280"}[r]}function Ze(r){return{S:"主語",V:"動詞",O:"目的語",C:"補語",M:"修飾語",Prep:"前置詞",Conj:"接続詞",Det:"冠詞・限定詞",Adj:"形容詞",Adv:"副詞",Unknown:"不明"}[r]}function At(r,l,c){var w,u;const p=r.toLowerCase();if(/^[.,!?;:]$/.test(r))return"Unknown";if(Fe.has(p))return"V";if($e.has(p))return"Prep";if(Ct.has(p))return"Conj";if(Pt.has(p))return"Det";if((p==="first"||p==="then"||p==="finally")&&l===0){let k=l+1;for(;k<c.length&&/^[.,!?;:]$/.test(c[k]);)k++;const j=(w=c[k])==null?void 0:w.toLowerCase();if(j&&Ue.has(j))return"Adv"}return $t.has(p)?"Adj":_t.has(p)?"Adv":Ue.has(p)?l===0||l>0&&Fe.has((u=c[l+1])==null?void 0:u.toLowerCase())?"S":"O":"Unknown"}function Qe(r){return{".":"文の終わり",",":"区切り・列挙","!":"感嘆・強調","?":"疑問",";":"関連する文の区切り",":":"説明・例示の導入","-":"補足説明・言い換え","—":"強い区切り・挿入","–":"範囲・関係",'"':"引用","'":"引用・所有格","(":"補足情報の開始",")":"補足情報の終了"}[r]||"句読点"}function Tt(r){const l=r.match(/\b[\w']+\b|[.,!?;:\-—–"'()]/g)||[];let c=0;return l.map(p=>{const w=r.indexOf(p,c);return w>=0?(c=w+p.length,{token:p,start:w}):{token:p,start:null}})}function we(r){const l=r.match(/\b[\w']+\b|[.,!?;:\-—–"'()]/g)||[],c=new Set(["morning","afternoon","evening","night","day","week","month","year","weekend","weekends"]),p=[];let w=!1,u=!1,k=!1,j=null;const G=new Set(["be","am","is","are","was","were","been","being"]);for(let T=0;T<l.length;T++){const F=l[T];if(/^[.,!?;:\-—–"'()]$/.test(F)){p.push({word:F,tag:"Unknown",color:"#6b7280",description:Qe(F)});continue}let E=At(F,T,l);E==="Unknown"&&(T===0&&/^[A-Z]/.test(F)&&!u?(E="S",u=!0):T>0&&l[T-1].toLowerCase()==="every"&&c.has(F.toLowerCase())?E="M":w&&u&&!k&&!(T>0&&$e.has(l[T-1].toLowerCase()))?(E=j&&G.has(j)?"C":"O",k=!0):w&&u&&k&&T>0&&(l[T-1].toLowerCase()==="and"||l[T-1].toLowerCase()==="or")?E=j&&G.has(j)?"C":"O":(T>0&&$e.has(l[T-1].toLowerCase()),E="M")),E==="V"&&(w=!0,j=F.toLowerCase(),k=!1),E==="S"&&(u=!0),(E==="O"||E==="C")&&(k=!0),p.push({word:F,tag:E,color:Ye(E),description:Ze(E)})}return p}function be(r,l){const c=ot(l),p=Tt(r),w=[];for(const{token:u,start:k}of p){if(/^[.,!?;:\-—–"'()]$/.test(u)){w.push({word:u,tag:"Unknown",color:"#6b7280",description:Qe(u)});continue}const G=(typeof k=="number"?c.get(k):void 0)??"M";w.push({word:u,tag:G,color:Ye(G),description:Ze(G)})}return w}const Et=[{words:["wake","up"],meaning:"起きる",type:"phrasal-verb"},{words:["get","up"],meaning:"起床する",type:"phrasal-verb"},{words:["brush","my","teeth"],meaning:"歯を磨く",type:"phrasal-verb"},{words:["wash","my","face"],meaning:"顔を洗う",type:"phrasal-verb"},{words:["have","breakfast"],meaning:"朝食を食べる",type:"phrasal-verb"},{words:["go","to","school"],meaning:"学校に行く",type:"phrasal-verb"},{words:["come","back"],meaning:"帰ってくる",type:"phrasal-verb"},{words:["come","home"],meaning:"帰宅する",type:"phrasal-verb"},{words:["do","homework"],meaning:"宿題をする",type:"phrasal-verb"},{words:["go","to","bed"],meaning:"寝る",type:"phrasal-verb"},{words:["at","seven"],meaning:"7時に",type:"time-expression"},{words:["in","the","morning"],meaning:"朝に",type:"time-expression"},{words:["in","the","afternoon"],meaning:"午後に",type:"time-expression"},{words:["in","the","evening"],meaning:"夕方に",type:"time-expression"},{words:["at","night"],meaning:"夜に",type:"time-expression"},{words:["every","morning"],meaning:"毎朝",type:"determiner-noun"},{words:["every","day"],meaning:"毎日",type:"determiner-noun"},{words:["every","night"],meaning:"毎晩",type:"determiner-noun"},{words:["every","week"],meaning:"毎週",type:"determiner-noun"}];function ve(r){const l=[],c=r.map(p=>p.toLowerCase());for(const p of Et){const w=p.words.map(u=>u.toLowerCase());for(let u=0;u<=c.length-w.length;u++){let k=!0;for(let j=0;j<w.length;j++)if(c[u+j]!==w[j]){k=!1;break}k&&l.push({...p,words:r.slice(u,u+w.length)})}}return l}const Lt=[{name:"too ~ to ...",meaning:"〜すぎて...できない",pattern:/\btoo\s+\w+\s+to\s+\w+/i,explanation:"「too + 形容詞/副詞 + to + 動詞」の形で、「〜すぎて...できない」という意味"},{name:"so ~ that ...",meaning:"とても〜なので...",pattern:/\bso\s+\w+\s+that\b/i,explanation:"「so + 形容詞/副詞 + that ~」の形で、「とても〜なので...」という意味"},{name:"so that ...",meaning:"〜するために",pattern:/\bso\s+that\b/i,explanation:"「so that ~」の形で、「〜するために」という目的を表す"},{name:"It is ~ for ... to",meaning:"...が〜するのは",pattern:/\bit\s+is\s+\w+\s+for\s+\w+\s+to\b/i,explanation:"「It is + 形容詞 + for + 人 + to + 動詞」の形で、「(人)が〜するのは...だ」という意味"},{name:"It is ~ to ...",meaning:"〜することは...だ",pattern:/\bit\s+is\s+\w+\s+to\s+\w+/i,explanation:"「It is + 形容詞 + to + 動詞」の形で、「〜することは...だ」という意味"},{name:"It is ~ that ...",meaning:"...なのは〜だ (強調)",pattern:/\bit\s+is\s+\w+\s+that\b/i,explanation:"強調構文。「It is ~ that ...」の形で、特定の部分を強調する"},{name:"not only ~ but also ...",meaning:"〜だけでなく...も",pattern:/\bnot\s+only\s+.+\s+but\s+also\b/i,explanation:"「not only A but also B」の形で、「AだけでなくBも」という意味"},{name:"either ~ or ...",meaning:"〜か...かどちらか",pattern:/\beither\s+.+\s+or\b/i,explanation:"「either A or B」の形で、「AかBかどちらか」という選択を表す"},{name:"neither ~ nor ...",meaning:"〜も...もない",pattern:/\bneither\s+.+\s+nor\b/i,explanation:"「neither A nor B」の形で、「AもBもない」という否定を表す"},{name:"both ~ and ...",meaning:"〜も...も両方",pattern:/\bboth\s+.+\s+and\b/i,explanation:"「both A and B」の形で、「AもBも両方」という意味"},{name:"as ~ as ...",meaning:"...と同じくらい〜",pattern:/\bas\s+\w+\s+as\b/i,explanation:"「as + 形容詞/副詞 + as ...」の形で、「...と同じくらい〜」という同等比較"},{name:"not as ~ as ...",meaning:"...ほど〜ない",pattern:/\bnot\s+as\s+\w+\s+as\b/i,explanation:"「not as + 形容詞/副詞 + as ...」の形で、「...ほど〜ない」という意味"},{name:"one of the ~est",meaning:"最も〜なものの1つ",pattern:/\bone\s+of\s+the\s+\w+est\b/i,explanation:"「one of the + 最上級 + 複数名詞」の形で、「最も〜なものの1つ」という意味"},{name:"make/let/have + 人 + 動詞",meaning:"人に〜させる",pattern:/\b(make|let|have|help)\s+\w+\s+\w+/i,explanation:"使役動詞の構文。「make/let/have + 人 + 動詞の原形」で「人に〜させる」"},{name:"be used to ~ing",meaning:"〜することに慣れている",pattern:/\b(am|is|are|was|were)\s+used\s+to\s+\w+ing\b/i,explanation:"「be used to + 動名詞」の形で、「〜することに慣れている」という意味"},{name:"used to + 動詞",meaning:"昔は〜したものだ",pattern:/\bused\s+to\s+\w+/i,explanation:"「used to + 動詞の原形」の形で、「昔は〜したものだ」という過去の習慣を表す"}];function Mt(r){const l=[];for(const c of Lt)c.pattern.test(r)&&l.push(c);return l}function ze(r){return{beginner:"初級",intermediate:"中級",advanced:"上級",Advanced:"上級",初級:"初級",中級:"中級",上級:"上級"}[r]||r}function Pe(r){return r.toLowerCase().replace(/[\s.,?!]+/g," ").trim()}function he(r){return/^[.,!?;:\-—–"'()]$/.test(r)}function ie(r){switch(r){case"S":return{text:"text-red-600",underline:"border-red-500"};case"V":return{text:"text-blue-600",underline:"border-blue-500"};case"O":return{text:"text-yellow-600",underline:"border-yellow-500"};case"C":return{text:"text-green-600",underline:"border-green-500"};case"M":default:return{text:"text-gray-400",underline:"border-gray-300"}}}function Ve(r){return r?r.includes("主語")?"S":r.includes("動詞")?"V":r.includes("目的語")?"O":r.includes("補語")?"C":"M":"M"}function Be(r){return r==="S"||r==="V"||r==="O"||r==="C"||r==="M"?r:"M"}const De={"first i brush my teeth and wash my face":[{text:"First",label:"副詞",underline:"word"},{text:"I",label:"主語",underline:"word"},{text:"brush my teeth",label:"動詞句",underline:"phrase"},{text:"and",label:"接続詞",underline:"word"},{text:"wash my face",label:"動詞句",underline:"phrase"}]},Wt={"i wake up at seven every morning":"私は毎朝7時に起きます。","first i brush my teeth and wash my face":"まず、歯を磨いて顔を洗います。","i check homework and put books inside":"私は宿題を確認して、本をかばんの中に入れます。"};function It(r,l){const c=new Map,p=new Set,w=new Set;return l.forEach(u=>{var j,G;const k=u.words.length;if(!(k<=1))for(let T=0;T<=r.length-k;T++){if(w.has(T))continue;let F=!0;for(let E=0;E<k;E++)if(((j=r[T+E])==null?void 0:j.toLowerCase())!==((G=u.words[E])==null?void 0:G.toLowerCase())){F=!1;break}if(F){c.set(T,u);for(let E=0;E<k;E++)p.add(T+E);w.add(T);break}}}),{phrasalMap:c,phrasalWordIndices:p}}function Bt({onSaveUnknownWords:r,customQuestionSets:l=[],onAddWordToCustomSet:c,onRemoveWordFromCustomSet:p,onOpenCustomSetManagement:w}){var Ie;const[u,k]=N.useState([]),[j,G]=N.useState(null),[T,F]=N.useState([]),[E,Z]=N.useState([]),[K,ne]=N.useState("all"),[Q,q]=N.useState(null),[S,B]=N.useState(new Map),[W,z]=N.useState(new Map),[$,U]=N.useState(null),[D,V]=N.useState(!1),[se,le]=N.useState(!0),[Y,ye]=N.useState("reading"),[Ot,Xe]=N.useState(0),[de,ke]=N.useState(!1),[ge,ce]=N.useState(!1),[ae,pe]=N.useState(null),[I,re]=N.useState(null),[X,Ae]=N.useState(null),[Rt,Ft]=N.useState(!1),[et,ue]=N.useState(!0),[Te,tt]=N.useState([]),[je,nt]=N.useState([]);N.useEffect(()=>{Promise.all([St(),Nt()]).then(([s,a])=>{s!=null&&s.patterns&&tt(s.patterns),a!=null&&a.patterns&&nt(a.patterns)})},[]),N.useEffect(()=>{let s=!1;if(!j){Ae(null);return}return it(j).then(a=>{s||Ae(a)}),()=>{s=!0}},[j]),N.useEffect(()=>{if(u.length>0){const s="reading-unknown-words-state";try{const a=u.map(t=>({id:t.id,unknownWords:t.phrases.flatMap((n,o)=>n.segments.map((g,x)=>g.isUnknown?`${o}-${x}`:null).filter(Boolean))}));localStorage.setItem(s,JSON.stringify(a))}catch(a){C.warn("分からない単語の状態保存に失敗:",a)}}},[u]),N.useEffect(()=>{C.log("[長文] 辞書の読み込みを開始..."),fetch("/data/vocabulary/high-school-entrance-words.csv").then(s=>{if(!s.ok)throw new Error(`CSV読み込み失敗: ${s.status}`);return s.text()}).then(s=>{const a=s.split(`
`),t=new Map;a.slice(1).forEach(n=>{if(!n.trim())return;const o=n.split(",").map(g=>g.trim());if(o.length>=7){const g=o[0].toLowerCase().trim();t.set(g,{word:o[0],reading:o[1],meaning:o[2],etymology:o[3],relatedWords:o[4],relatedFields:o[5],difficulty:o[6]})}}),C.log(`[長文] メイン辞書: ${t.size}単語を読み込みました`),B(t)}).catch(s=>{}),fetch("/data/dictionaries/reading-passages-dictionary.json").then(s=>{if(!s.ok)throw new Error(`JSON読み込み失敗: ${s.status}`);return s.json()}).then(s=>{const a=new Map;Object.entries(s).forEach(([t,n])=>{a.set(t.toLowerCase(),n)}),z(a),C.log(`[長文] 長文読解辞書: ${a.size}単語を読み込みました`)}).catch(s=>{C.error("[長文] Error loading reading dictionary:",s)})},[]);const Ee=N.useCallback(s=>{const a=s.toLowerCase().replace(/[.,!?;:"']/g,"").trim();if(S.has(a)||W.has(a))return a;if(a.endsWith("es")){const t=a.slice(0,-2);if(S.has(t)||W.has(t))return t}if(a.endsWith("s")){const t=a.slice(0,-1);if(S.has(t)||W.has(t))return t}if(a.endsWith("ed")){const t=a.slice(0,-2);if(S.has(t)||W.has(t))return t;if(S.has(t+"e")||W.has(t+"e"))return t+"e";if(t.length>2&&t[t.length-1]===t[t.length-2]){const n=t.slice(0,-1);if(S.has(n)||W.has(n))return n}}if(a.endsWith("ing")){const t=a.slice(0,-3);if(S.has(t)||W.has(t))return t;if(S.has(t+"e")||W.has(t+"e"))return t+"e";if(t.length>2&&t[t.length-1]===t[t.length-2]){const n=t.slice(0,-1);if(S.has(n)||W.has(n))return n}}if(a.endsWith("ly")){const t=a.slice(0,-2);if(S.has(t)||W.has(t))return t}if(a.endsWith("er")){const t=a.slice(0,-2);if(S.has(t)||W.has(t))return t}if(a.endsWith("est")){const t=a.slice(0,-3);if(S.has(t)||W.has(t))return t}return a},[S,W]),Le=N.useCallback((s,a)=>{if(a&&typeof a=="string"&&a.trim()&&a!=="-")return a;if(a&&typeof a=="object"&&"meaning"in a&&typeof a.meaning=="string")return a.meaning;const t=s.toLowerCase();if(t==="who")return"(関係代名詞)その人は";if(t==="whom")return"(関係代名詞)その人を";if(t==="which")return"(関係代名詞)その物等は・を";if(t==="that")return"(関係代名詞)その人・物等は・を";const n=Ee(s),o=S.get(n),g=W.get(n);return(o==null?void 0:o.meaning)||(g==null?void 0:g.meaning)||""},[Ee,S,W]);N.useEffect(()=>{const s=setInterval(()=>{de&&!lt()&&!dt()&&(ke(!1),ce(!1))},500);return()=>clearInterval(s)},[de]),N.useEffect(()=>{if(S.size===0){C.log("[長文] 辞書の読み込みを待機中...");return}C.log(`[長文] パッセージデータの読み込みを開始... (辞書: ${S.size}単語)`);try{localStorage.removeItem("reading-passages-data")}catch{}const s="reading-unknown-words-state";let a=[];try{const t=localStorage.getItem(s);t&&(a=JSON.parse(t))}catch(t){C.warn("[長文] 保存済み進捗の読み込みに失敗:",t)}ue(!0),kt(S).then(t=>{var n,o;if(t&&t.length>0){C.log(`[長文] ${t.length}件のパッセージを読み込みました`);const g=t.map(_=>{const i=a.find(m=>m.id===_.id);return i!=null&&i.unknownWords&&i.unknownWords.length>0?{..._,phrases:_.phrases.map((m,P)=>({...m,segments:m.segments.map((L,d)=>{var f;return{...L,isUnknown:((f=i.unknownWords)==null?void 0:f.includes(`${P}-${d}`))??!1}})}))}:_}),x={初級:1,beginner:1,中級:2,intermediate:2,上級:3,advanced:3,Advanced:3},h=g.sort((_,i)=>{const m=x[_.level||""]||999,P=x[i.level||""]||999;if(m!==P)return m-P;const L=_.actualWordCount||0,d=i.actualWordCount||0;return L-d});k(h),C.log(`[長文] パッセージを設定完了: ${h.length}件`),h.length>0&&(G(h[0].id),F(new Array(((n=h[0].phrases)==null?void 0:n.length)||0).fill(!1)),Z(new Array(((o=h[0].phrases)==null?void 0:o.length)||0).fill(!1)),C.log(`[長文] 初期パッセージを選択: ${h[0].id}`)),ue(!1)}else C.error("[長文] loadAllPassagesAsReadingFormatが空の配列を返しました"),q("パッセージデータの読み込みに失敗しました（データが空です）"),ue(!1)}).catch(t=>{C.error("[長文] Error loading passages:",t),q("パッセージの読み込みに失敗しました: "+t.message),ue(!1)})},[S]);const v=N.useMemo(()=>u.find(s=>s.id===j),[u,j]),Ne=N.useMemo(()=>{const s=K==="all"?u:u.filter(t=>t.level===K),a={初級:1,beginner:1,中級:2,intermediate:2,上級:3,advanced:3,Advanced:3};return s.sort((t,n)=>{const o=a[t.level||""]||999,g=a[n.level||""]||999;if(o!==g)return o-g;const x=t.actualWordCount||0,h=n.actualWordCount||0;return x-h})},[u,K]),Me=N.useCallback(s=>{var t,n;G(s);const a=u.find(o=>o.id===s);a&&(F(new Array(((t=a.phrases)==null?void 0:t.length)||0).fill(!1)),Z(new Array(((n=a.phrases)==null?void 0:n.length)||0).fill(!1)),Xe(0))},[u]);N.useCallback((s,a)=>{if(a.preventDefault(),a.stopPropagation(),!v||!ct())return;const n=v.phrases[s].segments.filter(g=>g.word&&g.word.trim()!=="").map(g=>g.word).join(" ");fe(n,{rate:.85});const o=a.currentTarget;o.classList.add("speaking"),setTimeout(()=>{o.classList.remove("speaking")},600)},[v]);const st=()=>{if(!v)return;const s=[];if(v.phrases.forEach(a=>{a.segments.forEach(t=>{t.isUnknown&&t.word.trim()!==""&&(s.some(n=>n.word.toLowerCase()===t.word.toLowerCase())||s.push({word:t.word,meaning:t.meaning,reading:t.reading||"",etymology:t.etymology||"",relatedWords:t.relatedWords||"",relatedFields:t.relatedFields||"",difficulty:t.difficulty||"intermediate"}))})}),s.length===0){alert(`分からない単語が選択されていません。
単語をタップしてマークしてください。`);return}r&&r(s),k(a=>a.map(t=>t.id===v.id?{...t,phrases:t.phrases.map(n=>({...n,segments:n.segments.map(o=>({...o,isUnknown:!1}))}))}:t)),alert(`${s.length}個の単語を「${v.title}」から保存しました！`)},at=()=>{v&&(k(s=>s.map(a=>a.id===v.id?{...a,phrases:a.phrases.map(t=>({...t,segments:t.segments.map(n=>({...n,isUnknown:!1}))}))}:a)),F(new Array(v.phrases.length).fill(!1)),Z(new Array(v.phrases.length).fill(!1)))};if(Q)return e.jsx("div",{className:"error-message",children:Q});if(et)return e.jsx("div",{className:"empty-container",children:"読み込み中..."});if(u.length===0)return e.jsx("div",{className:"empty-container",children:"パッセージが見つかりません"});if(Ne.length===0)return e.jsxs("div",{className:"comprehensive-reading-view",children:[e.jsx("div",{className:"reading-header",children:e.jsxs("div",{className:"filter-controls",children:[e.jsx("label",{htmlFor:"difficulty-filter",children:"難易度: "}),e.jsxs("select",{id:"difficulty-filter",value:K,onChange:s=>ne(s.target.value),title:"難易度を選択",children:[e.jsx("option",{value:"all",children:"全て"}),e.jsx("option",{value:"初級",children:"初級"}),e.jsx("option",{value:"中級",children:"中級"}),e.jsx("option",{value:"上級",children:"上級"})]})]})}),e.jsx("div",{className:"empty-container",children:"選択した難易度のパッセージが見つかりません。別の難易度を選択してください。"})]});const We=((Ie=v==null?void 0:v.phrases)==null?void 0:Ie.reduce((s,a)=>s+a.segments.filter(t=>t.isUnknown).length,0))||0;return e.jsxs("div",{className:"comprehensive-reading-view",children:[!se&&D&&e.jsxs("div",{className:"study-settings-panel",children:[e.jsxs("div",{className:"settings-header",children:[e.jsx("h3",{children:"📊 学習設定"}),e.jsx("button",{onClick:()=>V(!1),className:"px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors duration-200 text-sm shadow-sm:bg-gray-600",children:"✕ 閉じる"})]}),e.jsxs("div",{className:"filter-group",children:[e.jsx("label",{htmlFor:"difficulty-filter",children:"⭐ 難易度:"}),e.jsxs("select",{id:"difficulty-filter",value:K,onChange:s=>ne(s.target.value),className:"select-input",children:[e.jsx("option",{value:"all",children:"全て"}),e.jsx("option",{value:"初級",children:"初級"}),e.jsx("option",{value:"中級",children:"中級"}),e.jsx("option",{value:"上級",children:"上級"})]})]}),e.jsxs("div",{className:"filter-group",children:[e.jsx("label",{htmlFor:"passage-select",children:"📖 パッセージ:"}),e.jsx("select",{id:"passage-select",value:j||"",onChange:s=>Me(s.target.value),className:"select-input",children:Ne.map(s=>e.jsxs("option",{value:s.id,children:[ze(s.level||"beginner"),"_",s.actualWordCount,"語_",s.title]},s.id))})]})]}),se&&e.jsxs("div",{className:"reading-sub-tabs grid grid-cols-6 gap-1 sm:gap-2",children:[e.jsx("button",{className:`px-2 sm:px-4 py-1.5 sm:py-2 text-xs sm:text-base font-medium transition-all duration-200 rounded-t-lg border-b-2 ${Y==="reading"?"bg-primary text-white border-primary":"bg-gray-200 text-gray-700 border-transparent hover:bg-gray-300"}`,onClick:()=>ye("reading"),children:"📖 読解"}),e.jsx("button",{className:`px-2 sm:px-4 py-1.5 sm:py-2 text-xs sm:text-base font-medium transition-all duration-200 rounded-t-lg border-b-2 ${Y==="fullText"?"bg-primary text-white border-primary":"bg-gray-200 text-gray-700 border-transparent hover:bg-gray-300"}`,onClick:()=>ye("fullText"),children:"📄 全文"}),e.jsx("button",{className:`px-2 sm:px-4 py-1.5 sm:py-2 text-xs sm:text-base font-medium transition-all duration-200 rounded-t-lg border-b-2 ${Y==="fullTranslation"?"bg-primary text-white border-primary":"bg-gray-200 text-gray-700 border-transparent hover:bg-gray-300"}`,onClick:()=>ye("fullTranslation"),children:"📝 全訳"}),e.jsxs("button",{onClick:st,className:"px-2 sm:px-4 py-1.5 sm:py-2 text-xs sm:text-base font-medium bg-success text-white rounded-t-lg border-b-2 border-success transition-all duration-200 hover:bg-success-hover disabled:opacity-50 disabled:cursor-not-allowed:bg-success-hover",disabled:We===0,title:"未知語を保存",children:["💾 保存 (",We,")"]}),e.jsx("button",{onClick:at,className:"px-4 py-2 text-sm font-medium bg-warning text-warning-dark border-2 border-warning rounded-lg transition-all duration-200 hover:bg-warning-hover hover:shadow-md:bg-warning-hover",title:"リセット",children:"🔄 リセット"}),e.jsx("button",{className:"px-4 py-2 text-sm font-medium bg-gray-200 text-gray-700 border-2 border-transparent rounded-lg transition-all duration-200 hover:bg-gray-300:bg-gray-600",onClick:()=>V(!D),title:"学習設定を開く",children:"⚙️ 学習設定"})]}),se&&D&&e.jsxs("div",{className:"study-settings-panel",children:[e.jsxs("div",{className:"settings-header",children:[e.jsx("h3",{children:"📊 学習設定"}),e.jsx("button",{onClick:()=>V(!1),className:"px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors duration-200 text-sm shadow-sm:bg-gray-600",children:"✕ 閉じる"})]}),e.jsxs("div",{className:"filter-group",children:[e.jsx("label",{htmlFor:"difficulty-filter-reading",children:"⭐ 難易度:"}),e.jsxs("select",{id:"difficulty-filter-reading",value:K,onChange:s=>ne(s.target.value),className:"select-input",children:[e.jsx("option",{value:"all",children:"全て"}),e.jsx("option",{value:"初級",children:"初級"}),e.jsx("option",{value:"中級",children:"中級"}),e.jsx("option",{value:"上級",children:"上級"})]})]}),e.jsxs("div",{className:"filter-group",children:[e.jsx("label",{htmlFor:"passage-select-reading",children:"📖 パッセージ:"}),e.jsx("select",{id:"passage-select-reading",value:j||"",onChange:s=>Me(s.target.value),className:"select-input",children:Ne.map(s=>e.jsxs("option",{value:s.id,children:[ze(s.level||"beginner"),"_",s.actualWordCount,"語_",s.title]},s.id))})]})]}),$&&e.jsxs(e.Fragment,{children:[e.jsx("div",{className:"word-popup-overlay",onClick:()=>U(null)}),e.jsxs("div",{className:"word-popup","data-popup-x":$.x,"data-popup-y":$.y,children:[e.jsx("button",{className:"popup-close",onClick:()=>U(null),title:"閉じる",children:"✕"}),e.jsx("div",{className:"popup-word",children:$.word}),$.reading&&e.jsx("div",{className:"popup-reading",children:$.reading}),e.jsx("div",{className:"popup-meaning",children:$.meaning}),$.etymology&&e.jsxs("div",{className:"popup-etymology",children:[e.jsx("strong",{children:"語源:"})," ",$.etymology]}),$.relatedWords&&e.jsxs("div",{className:"popup-related",children:[e.jsx("strong",{children:"関連語:"})," ",$.relatedWords]})]})]}),se&&v&&v.phrases&&v.phrases.length>0&&e.jsxs("div",{className:"passage-content",children:[e.jsx("h3",{className:"passage-title",children:v.title}),Y==="reading"&&e.jsxs(e.Fragment,{children:[e.jsxs("div",{className:"reading-full-text-area",children:[e.jsx("h4",{className:"text-lg font-semibold mb-3",children:"📖 全文"}),e.jsx("div",{className:"full-text-content",children:(()=>{if(v.originalText){const a=v.originalText.split(/([.!?])\s+/).filter(n=>n.trim()),t=[];for(let n=0;n<a.length;n+=2){const o=a[n],g=a[n+1]||"";t.push((o+g).trim())}return e.jsx("div",{className:"sentences-container",children:t.map((n,o)=>e.jsxs("span",{className:`sentence-clickable ${ae===o?"selected-reading":""}`,onClick:()=>{pe(o);const g=X?xe(X,n):null,x=g?be(n,g.tokens):we(n);re({text:n,grammarAnalysis:x,showMeanings:!1})},children:[n," "]},o))})}if(v.title.toLowerCase().includes("conversation")){const a=[];return v.phrases.forEach(t=>{let n=t.segments.map(o=>o.word).join(" ").trim();!n||n==="-"||(n=n.replace(/\s+([.,!?;:"])/g,"$1"),a.push(n))}),e.jsx("div",{className:"sentences-container",children:a.map((t,n)=>e.jsxs("span",{className:`sentence-clickable ${ae===n?"selected-reading":""}`,onClick:()=>{pe(n);const o=X?xe(X,t):null,g=o?be(t,o.tokens):we(t);re({text:t,grammarAnalysis:g,showMeanings:!1})},children:[t," "]},n))})}else{let a="",t=!0;v.phrases.forEach(g=>{g.segments.forEach(x=>{let h=x.word.trim();h&&h!=="-"&&(/^[.,!?;:]$/.test(h)?(a+=h,t=/^[.!?]$/.test(h)):(h==='"'||h==="'"||(t&&h.length>0&&(h=h.charAt(0).toUpperCase()+h.slice(1),t=!1),a.length>0&&!a.endsWith(" ")&&!a.endsWith('"')&&!a.endsWith("'")&&(a+=" ")),a+=h))})}),a=a.replace(/\s+"/g,'"').replace(/\s+'/g,"'");const n=a.split(/([.!?])\s+/).filter(g=>g.trim()),o=[];for(let g=0;g<n.length;g+=2){const x=n[g],h=n[g+1]||"";o.push((x+h).trim())}return e.jsx("div",{className:"sentences-container",children:o.map((g,x)=>e.jsxs("span",{className:`sentence-clickable ${ae===x?"selected-reading":""}`,onClick:()=>{pe(x);const h=X?xe(X,g):null,_=h?be(g,h.tokens):we(g);re({text:g,grammarAnalysis:_,showMeanings:!1})},children:[g," "]},x))})}})()})]}),ae!==null&&I&&e.jsxs("div",{className:"selected-sentence-analysis mt-4 p-4 bg-blue-50 rounded-lg border border-blue-200",children:[e.jsxs("div",{className:"flex justify-between items-center mb-2",children:[e.jsx("h4",{className:"m-0 text-base font-semibold text-blue-700",children:"📜 文の読解"}),e.jsxs("div",{className:"flex gap-1",children:[e.jsx("button",{className:"px-2 py-1 text-xs bg-blue-600 text-white rounded hover:bg-blue-700",onClick:()=>fe(I.text),title:"発音",children:"🔊"}),!1,e.jsx("button",{className:"px-2 py-1 text-xs bg-gray-600 text-white rounded hover:bg-gray-700",onClick:()=>re({...I,showMeanings:!I.showMeanings}),children:I.showMeanings?"意味を隠す":"意味を表示"})]})]}),e.jsxs("div",{className:"grammar-structure mb-2",children:[e.jsx("h5",{className:"text-xs font-semibold mb-1 text-gray-700",children:"🔤 文法構造"}),e.jsx("div",{className:"flex flex-wrap gap-1.5 text-sm",children:(()=>{const s=Pe(I.text),a=De[s];if(a)return a.map((i,m)=>e.jsx("div",{className:"inline-flex flex-col items-center",children:(()=>{const P=Ve(i.label),L=ie(P);return e.jsxs(e.Fragment,{children:[e.jsx("span",{className:`font-medium text-base text-gray-900 border-b-2 ${L.underline}`,children:i.text}),e.jsx("span",{className:`text-xs font-semibold mt-0.5 ${L.text}`,title:i.label,children:P})]})})()},m));const t=I.grammarAnalysis,n=t.some(i=>i.word==="."),o=t.filter(i=>!he(i.word)),g=o.map(i=>Be(i.tag));for(let i=1;i+1<o.length;i++){if(o[i].tag!=="Conj")continue;const m=g[i-1],P=g[i+1];m===P&&(g[i]=m)}const x=o.findIndex(i=>i.tag==="S");if(x>0)for(let i=x-1;i>=0;i--){const m=o[i].tag;if(m==="Det"||m==="Adj")g[i]="S";else break}const h=o.findIndex(i=>i.tag==="V");if(h>=0){const i=o.findIndex((m,P)=>P>h&&(m.tag==="O"||m.tag==="C"));if(i>h+1){const m=o[i].tag==="C"?"C":"O";for(let P=i-1;P>h;P--){const L=o[P].tag;if(L==="Det"||L==="Adj")g[P]=m;else break}}}const _=[];for(let i=0;i<o.length;i++){const m=g[i],P=i,L=[o[i].word];for(;i+1<o.length&&g[i+1]===m;)L.push(o[i+1].word),i++;const d=ie(m),f=L.join(" ");_.push(e.jsxs("div",{className:"inline-flex flex-col items-center",title:m==="S"?"主語":m==="V"?"動詞":m==="O"?"目的語":m==="C"?"補語":"修飾語",children:[e.jsx("span",{className:`font-medium text-base text-gray-900 border-b-2 ${d.underline}`,children:f}),e.jsx("span",{className:`text-xs font-semibold mt-0.5 ${d.text}`,children:m})]},`${P}-${i}-${m}`))}if(n){const i=ie("M");_.push(e.jsxs("div",{className:"inline-flex flex-col items-center",title:"ピリオド",children:[e.jsx("span",{className:`font-medium text-base text-gray-900 border-b-2 ${i.underline}`,children:"."}),e.jsx("span",{className:`text-xs font-semibold mt-0.5 ${i.text}`,children:" "})]},"__period__"))}return _})()})]}),I.showMeanings&&(()=>{var L;const s=I.grammarAnalysis.filter(d=>!/^[.,!?;:\-—–"'()]$/.test(d.word)),a={one:"1",two:"2",three:"3",four:"4",five:"5",six:"6",seven:"7",eight:"8",nine:"9",ten:"10",eleven:"11",twelve:"12"},t=d=>{const f=d.join(" ").toLowerCase(),M=ve(d).find(y=>y.words.length===d.length&&y.words.every((O,H)=>{var ee;return O.toLowerCase()===((ee=d[H])==null?void 0:ee.toLowerCase())}));if(M!=null&&M.meaning)return M.meaning;if(f==="i")return"私は";if(f==="wake up")return"起きる";if(f==="first")return"最初に";if(f==="then")return"それから";if(f==="finally")return"最後に";if(d.length===2&&d[0].toLowerCase()==="at"){const y=d[1].toLowerCase(),O=a[y]||(y.match(/^\d+$/)?y:"");if(O)return`${O}時に`}return d.length===2&&d[0].toLowerCase()==="every"&&d[1].toLowerCase()==="morning"?"毎朝":d.map(y=>Le(y,void 0)).filter(y=>y&&y!=="-").join(" ")},n=s.map(d=>d.word),o=ve(n),g=new Map,x=new Set;o.forEach(d=>{let f=0;for(;f<n.length;){const A=n.slice(f).findIndex((M,y)=>d.words.every((O,H)=>{var ee;return((ee=n[f+y+H])==null?void 0:ee.toLowerCase())===O.toLowerCase()}));if(A!==-1){const M=f+A;g.set(M,d),d.words.forEach((y,O)=>x.add(M+O));break}f++}});const h=[];for(let d=0;d<s.length;d++){if(x.has(d)&&!g.has(d))continue;const f=g.get(d);if(f){h.push({words:f.words,meaning:((L=S.get(f.words.join(" ").toLowerCase()))==null?void 0:L.meaning)||t(f.words)}),d+=f.words.length-1;continue}const A=s[d].tag,M=s[d].word.toLowerCase();if(A==="Prep"&&d+1<s.length){const y=d+2<s.length&&s[d+1].tag==="Det"&&!he(s[d+2].word)?[s[d].word,s[d+1].word,s[d+2].word]:[s[d].word,s[d+1].word];h.push({words:y,meaning:t(y)}),d+=y.length-1;continue}if(A==="Det"&&M==="every"&&d+1<s.length){const y=[s[d].word,s[d+1].word];h.push({words:y,meaning:t(y)}),d+=1;continue}h.push({words:[s[d].word],meaning:t([s[d].word])})}const _=I.text?Pe(I.text):"",m={...Wt}[_]||(h.every(d=>d.meaning&&d.meaning!=="-")?h.map(d=>d.meaning).join(" "):"");return e.jsxs("div",{className:"mt-2",children:[e.jsx("h5",{className:"text-xs font-semibold mb-1 text-gray-700",children:"📝 直訳と日本語訳"}),e.jsxs("div",{className:"flex items-start gap-2",children:[e.jsx("span",{"data-testid":"literal-translation-badge",className:"inline-flex items-center rounded bg-gray-200 text-gray-800 px-2 py-0.5 text-[10px] font-semibold whitespace-nowrap",children:"直訳"}),e.jsx("div",{className:"flex flex-wrap gap-2 text-sm text-gray-800",children:h.map((d,f)=>e.jsxs("div",{className:"inline-flex flex-col items-center",children:[e.jsx("span",{className:"font-medium border-b-2 border-gray-600",children:d.words.join(" ")}),d.meaning&&d.meaning!=="-"&&e.jsx("span",{className:"text-xs text-gray-700 mt-0.5",children:d.meaning})]},f))})]}),e.jsxs("div",{className:"mt-2 flex items-start gap-2",children:[e.jsx("span",{"data-testid":"japanese-translation-badge",className:"inline-flex items-center rounded bg-gray-200 text-gray-800 px-2 py-0.5 text-[10px] font-semibold whitespace-nowrap",children:"日本語訳"}),e.jsx("div",{className:"text-sm text-gray-800",children:m})]}),e.jsx("div",{className:"mt-2 text-xs text-gray-600",children:"訳の品質: 直訳は語順対応を優先して意味の骨格を掴めるようにし、日本語訳は英語のニュアンス（自然な流れ・含意）をできるだけ正確に保った自然な日本語を優先しています。"})]})})(),I.showMeanings&&(()=>{const s=I.grammarAnalysis.filter(i=>!he(i.word)),a=s.map(i=>i.word),t=ve(a),{phrasalMap:n,phrasalWordIndices:o}=It(a,t),g={one:"1",two:"2",three:"3",four:"4",five:"5",six:"6",seven:"7",eight:"8",nine:"9",ten:"10",eleven:"11",twelve:"12"},x=i=>{const m=i.join(" ").toLowerCase(),L=ve(i).find(d=>d.words.length===i.length&&d.words.every((f,A)=>{var M;return f.toLowerCase()===((M=i[A])==null?void 0:M.toLowerCase())}));if(L!=null&&L.meaning)return L.meaning;if(m==="i")return"私は";if(m==="wake up")return"起きる";if(m==="first")return"最初に";if(m==="then")return"それから";if(m==="finally")return"最後に";if(i.length===2&&i[0].toLowerCase()==="at"){const d=i[1].toLowerCase(),f=g[d]||(d.match(/^\d+$/)?d:"");if(f)return`${f}時に`}return i.length===2&&i[0].toLowerCase()==="every"&&i[1].toLowerCase()==="morning"?"毎朝":i.map(d=>Le(d,void 0)).filter(d=>d&&d!=="-").join(" ")},h=[];for(let i=0;i<s.length;i++){const m=s[i];if(o.has(i)&&!n.has(i))continue;const P=n.get(i);if(P){const d=P.meaning||x(P.words);h.push({english:P.words.join(" "),meaning:d,isPhrase:!0}),i+=P.words.length-1;continue}if(m.tag==="Prep"&&i+1<s.length){const d=i+2<s.length&&s[i+1].tag==="Det"&&!he(s[i+2].word)?[m.word,s[i+1].word,s[i+2].word]:[m.word,s[i+1].word];h.push({english:d.join(" "),meaning:x(d),isPhrase:!0}),i+=d.length-1;continue}if(m.tag==="Det"&&m.word.toLowerCase()==="every"&&i+1<s.length){const d=[m.word,s[i+1].word];h.push({english:d.join(" "),meaning:x(d),isPhrase:!0}),i+=1;continue}const L=x([m.word]);h.push({english:m.word,meaning:L,isPhrase:!1})}const _=h.map((i,m)=>e.jsxs("span",{className:"inline-flex items-baseline gap-2 whitespace-nowrap",children:[c&&p&&w?e.jsx(ht,{word:{word:i.english,meaning:i.meaning,source:"reading",sourceDetail:v==null?void 0:v.title},sets:l,onAddWord:c,onRemoveWord:p,onOpenManagement:w,size:"small",variant:"icon"}):e.jsx("span",{className:"inline-flex items-center justify-center w-7 h-7 bg-blue-500 text-white rounded-md text-base leading-none","aria-hidden":"true",title:"カスタムセット機能が未接続です",children:"+"}),e.jsx("span",{className:"font-medium text-gray-900",children:i.english}),e.jsx("span",{className:"text-gray-800",children:i.meaning})]},m));return e.jsxs("div",{className:"mt-2",children:[e.jsx("h5",{className:"text-xs font-semibold mb-1 text-gray-700",children:"📚 単語と熟語"}),e.jsx("div",{className:"flex flex-wrap gap-x-3 gap-y-1 text-sm",children:_})]})})(),(()=>{const s=Mt(I.text);return s.length===0?null:e.jsxs("div",{className:"mt-2",children:[e.jsx("h5",{className:"text-xs font-semibold mb-1 text-gray-700",children:"📐 重要構文"}),e.jsx("div",{className:"space-y-1",children:s.map((a,t)=>e.jsxs("div",{className:"bg-green-50 p-2 rounded border border-green-200",children:[e.jsxs("div",{className:"flex items-center justify-between text-sm",children:[e.jsx("span",{className:"font-semibold text-green-700",children:a.name}),e.jsx("span",{className:"text-xs text-gray-600",children:a.meaning})]}),e.jsxs("div",{className:"text-xs text-gray-600 mt-1",children:["💡 ",a.explanation]})]},t))})]})})(),(()=>{if(Te.length===0)return null;const s=I.text.toLowerCase(),a={"but|however|although|though|yet|nevertheless":["S1","S4","S5","S18","S81"],"because|since|as|so that":["S8","S19","S83"],"if|unless|provided|as long as":["S10","S96","S99"],"which|who|whom|that.*?who|that.*?which":["S11","S12","S13"],"not only.*?but also|both.*?and":["S16","S95"],"compare|than|more.*?than|less.*?than":["S17","S73","S74","S90"],"it is|it was.*?that":["S71"],"never|rarely|seldom|hardly":["S72"],"to be|in order to|so that":["S76","S83"],"may|might|could|would|should":["S82","S89","S91","S99"],"while|whereas|on the other hand":["S18","S84"],"for example|such as|like":["S91"],"overall|in short|in sum":["S80"],"far from|by no means":["S95","S98"]},t=[];for(const[n,o]of Object.entries(a)){if(new RegExp(n,"i").test(s))for(const g of o){const x=Te.find(h=>h.id===g);if(x&&!t.some(h=>h.id===x.id)&&(t.push(x),t.length>=2))break}if(t.length>=2)break}return t.length===0?null:e.jsxs("div",{className:"mt-2",children:[e.jsx("h5",{className:"text-xs font-semibold mb-1 text-gray-700",children:"💡 読解のヒント"}),e.jsx("div",{className:"space-y-2",children:t.map(n=>e.jsxs("div",{className:"bg-yellow-50 p-2 rounded border border-yellow-200",children:[e.jsx("div",{className:"text-sm font-semibold text-yellow-800 mb-1",children:n.title}),e.jsx("div",{className:"text-xs text-gray-700 mb-1",children:n.gist}),n.steps.length>0&&e.jsxs("div",{className:"text-xs text-gray-600",children:[e.jsx("div",{className:"font-semibold mb-0.5",children:"手順:"}),e.jsx("ul",{className:"list-disc list-inside space-y-0.5",children:n.steps.map((o,g)=>e.jsx("li",{children:o},g))})]})]},n.id))})]})})(),(()=>{if(je.length===0)return null;const s=I.text.toLowerCase(),a=ae===0,t={"^(first|to begin|firstly|initially)":["P1","P2"],"(however|but|yet|nevertheless|on the other hand)":["P3","P10","P11","P71"],"(for example|for instance|such as)":["P4","P70"],"(therefore|thus|consequently|as a result|in conclusion)":["P5","P50","P51"],"(moreover|furthermore|in addition|additionally)":["P6","P75"],"(in contrast|while|whereas)":["P7","P8"],"(because|since|due to|owing to)":["P9"],"(although|though|even though|despite)":["P10"],"(first.*second.*third|firstly.*secondly)":["P15"],"(overall|in short|in sum|to sum up)":["P16","P17","P79"],"(the main point|the key|most important)":["P18","P73"],"(this suggests|this means|this indicates)":["P19","P84"],"(some argue|critics say|opponents claim)":["P71"],"(one way|another approach|a solution)":["P20"]},n=[];if(a&&!n.length){const o=je.find(g=>g.id==="P1");o&&n.push(o)}if(!n.length){for(const[o,g]of Object.entries(t))if(new RegExp(o,"i").test(s)){for(const x of g){const h=je.find(_=>_.id===x);if(h&&!n.some(_=>_.id===h.id)){n.push(h);break}}if(n.length>=1)break}}return n.length===0?null:e.jsxs("div",{className:"mt-2",children:[e.jsx("h5",{className:"text-xs font-semibold mb-1 text-gray-700",children:"📚 段落構造のヒント"}),e.jsx("div",{className:"space-y-2",children:n.map(o=>e.jsxs("div",{className:"bg-blue-50 p-2 rounded border border-blue-200",children:[e.jsx("div",{className:"text-sm font-semibold text-blue-800 mb-1",children:o.title}),e.jsx("div",{className:"text-xs text-gray-700 mb-1",children:o.gist}),o.steps.length>0&&e.jsxs("div",{className:"text-xs text-gray-600",children:[e.jsx("div",{className:"font-semibold mb-0.5",children:"手順:"}),e.jsx("ul",{className:"list-disc list-inside space-y-0.5",children:o.steps.map((g,x)=>e.jsx("li",{children:g},x))})]})]},o.id))})]})})(),!1]})]}),Y==="fullText"&&e.jsxs("div",{className:"full-text-display",children:[e.jsx("h3",{children:"📄 全文"}),e.jsxs("div",{className:"full-text-controls",children:[e.jsx("button",{className:"px-6 py-3 text-base font-medium bg-primary text-white border-2 border-primary rounded-lg transition-all duration-200 hover:bg-primary-hover hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed:bg-primary-hover",onClick:()=>{const s=v.phrases.map(a=>a.segments.map(n=>n.word).join(" ").replace(/^[A-Z][a-z]*(?:\s+\d+)?:\s*/,"").replace(/"/g,"")).join(" ").replace(/\s+([.,!?;:])/g,"$1");fe(s),ke(!0),ce(!1)},disabled:de&&!ge,title:"全文を発音",children:"🔊 発音"}),e.jsx("button",{className:"px-6 py-3 text-base font-medium bg-warning text-warning-dark border-2 border-warning rounded-lg transition-all duration-200 hover:bg-warning-hover hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed:bg-warning-hover",onClick:()=>{ge?(gt(),ce(!1)):(pt(),ce(!0))},disabled:!de,title:ge?"発音を再開":"発音を一時停止",children:ge?"▶️ 再開":"⏸️ 一時停止"}),e.jsx("button",{className:"px-6 py-3 text-base font-medium bg-error text-white border-2 border-error rounded-lg transition-all duration-200 hover:bg-error-hover hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed:bg-error-hover",onClick:()=>{ut(),ke(!1),ce(!1)},disabled:!de,title:"発音を停止",children:"⏹️ 停止"})]}),e.jsx("div",{className:"full-text-content",children:(()=>{if(v.originalText)return e.jsx("div",{className:"paragraph-en",children:v.originalText});if(v.title.toLowerCase().includes("conversation")){const a=[];return v.phrases.forEach(t=>{let n=t.segments.map(o=>o.word).join(" ").trim();!n||n==="-"||(n=n.replace(/\s+([.,!?;:"])/g,"$1"),a.push(n))}),e.jsx("div",{children:a.map((t,n)=>e.jsx("p",{className:"paragraph-en conversation-line",children:t},n))})}else{const t=v.phrases[0].segments.map(f=>f.word).join(" ").trim(),n=t.length<100&&!/[.!?]$/.test(t);let o="",g=!0;v.phrases.forEach((f,A)=>{A===0&&n||f.segments.forEach(M=>{let y=M.word.trim();y&&y!=="-"&&(/^[.,!?;:]$/.test(y)?(o+=y,g=/^[.!?]$/.test(y)):(y==='"'||y==="'"||(g&&y.length>0&&(y=y.charAt(0).toUpperCase()+y.slice(1),g=!1),o.length>0&&!o.endsWith(" ")&&!o.endsWith('"')&&!o.endsWith("'")&&(o+=" ")),o+=y))})}),o=o.replace(/\s+"/g,'"').replace(/\s+'/g,"'");const x=o.split(/([.!?])\s+/).filter(f=>f.trim()),h=[];for(let f=0;f<x.length;f+=2){const A=x[f],M=x[f+1]||"";h.push((A+M).trim())}const _=[];let i=[],m=0;const P=60;h.forEach((f,A)=>{const M=f.split(/\s+/).length;i.push(f),m+=M,(m>=P||A===h.length-1)&&(_.push(i.join(" ")),i=[],m=0)}),i.length>0&&_.push(i.join(" "));const L=h,d=f=>{pe(f);const A=L[f],M=X?xe(X,A):null,y=M?be(A,M.tokens):we(A);re({text:A,grammarAnalysis:y,showMeanings:!1})};return e.jsxs("div",{children:[e.jsx("div",{className:"sentences-container",children:L.map((f,A)=>e.jsxs("span",{className:`sentence-clickable ${ae===A?"selected":""}`,onClick:()=>d(A),children:[f," "]},A))}),ae!==null&&I&&e.jsxs("div",{className:"selected-sentence-analysis",children:[e.jsxs("div",{className:"flex justify-between items-center mb-4",children:[e.jsx("h4",{className:"m-0",children:"📖 選択した文の読解"}),e.jsxs("div",{className:"flex gap-2",children:[e.jsx("button",{className:"px-3 py-1 text-sm bg-primary text-white rounded hover:bg-primary-hover",onClick:()=>fe(I.text),title:"この文を発音",children:"🔊 発音"}),e.jsx("button",{className:"px-3 py-1 text-sm bg-info text-white rounded hover:bg-info-hover",onClick:()=>re({...I,showMeanings:!I.showMeanings}),children:I.showMeanings?"意味を隠す":"意味を表示"})]})]}),e.jsx("div",{className:"selected-sentence-text text-gray-900",children:I.text}),e.jsxs("div",{className:"grammar-structure mt-4",children:[e.jsx("h5",{className:"text-sm font-semibold mb-2",children:"🔤 文法構造:"}),e.jsx("div",{className:"flex flex-wrap gap-2",children:(()=>{const f=Pe(I.text),A=De[f];if(A)return A.map((b,R)=>e.jsx("div",{className:"inline-flex flex-col items-center",children:(()=>{const J=Ve(b.label),te=ie(J);return e.jsxs(e.Fragment,{children:[e.jsx("span",{className:`font-medium text-base text-gray-900 border-b-2 ${te.underline}`,children:b.text}),e.jsx("span",{className:`text-xs font-semibold mt-0.5 ${te.text}`,title:b.label,children:J})]})})()},R));const M=I.grammarAnalysis,y=M.some(b=>b.word==="."),O=M.filter(b=>!he(b.word)),H=O.map(b=>Be(b.tag));for(let b=1;b+1<O.length;b++){if(O[b].tag!=="Conj")continue;const R=H[b-1],J=H[b+1];R===J&&(H[b]=R)}const ee=O.findIndex(b=>b.tag==="S");if(ee>0)for(let b=ee-1;b>=0;b--){const R=O[b].tag;if(R==="Det"||R==="Adj")H[b]="S";else break}const me=O.findIndex(b=>b.tag==="V");if(me>=0){const b=O.findIndex((R,J)=>J>me&&(R.tag==="O"||R.tag==="C"));if(b>me+1){const R=O[b].tag==="C"?"C":"O";for(let J=b-1;J>me;J--){const te=O[J].tag;if(te==="Det"||te==="Adj")H[J]=R;else break}}}const Se=[];for(let b=0;b<O.length;b++){const R=H[b],J=b,te=[O[b].word];for(;b+1<O.length&&H[b+1]===R;)te.push(O[b+1].word),b++;const Oe=ie(R),rt=te.join(" ");Se.push(e.jsxs("div",{className:"inline-flex flex-col items-center",title:R==="S"?"主語":R==="V"?"動詞":R==="O"?"目的語":R==="C"?"補語":"修飾語",children:[e.jsx("span",{className:`font-medium text-base text-gray-900 border-b-2 ${Oe.underline}`,children:rt}),e.jsx("span",{className:`text-xs font-semibold mt-0.5 ${Oe.text}`,children:R})]},`${J}-${b}-${R}`))}if(y){const b=ie("M");Se.push(e.jsxs("div",{className:"inline-flex flex-col items-center",title:"ピリオド",children:[e.jsx("span",{className:`font-medium text-base text-gray-900 border-b-2 ${b.underline}`,children:"."}),e.jsx("span",{className:`text-xs font-semibold mt-0.5 ${b.text}`,children:" "})]},"__period__"))}return Se})()})]})]})]})}})()})]}),Y==="fullTranslation"&&e.jsx("div",{className:"full-translation-display",children:e.jsx("div",{className:"full-translation-content",children:(()=>{var a;if(console.log("[全訳タブ] currentPassage.id:",v.id),console.log("[全訳タブ] currentPassage.translation exists:",!!v.translation),console.log("[全訳タブ] currentPassage.translation length:",((a=v.translation)==null?void 0:a.length)||0),v.translation){const t=v.translation.split(/\n+/).map(n=>n.trim()).filter(n=>n.length>0);return e.jsx("div",{className:"full-translation-text",children:t.map((n,o)=>e.jsx("p",{className:"paragraph-ja",children:n},o))})}if(v.title.toLowerCase().includes("conversation")){const t=[];return v.phrases.forEach(n=>{let o=n.phraseMeaning||"";o=o.replace(/\[要修正\]/g,"").trim(),!(!o||o==="-")&&t.push(o)}),t.map((n,o)=>e.jsx("p",{className:"paragraph-ja conversation-line",children:n},o))}else{const t=[];let n="";v.phrases.forEach(x=>{let h=x.phraseMeaning||"";if(h){if(h=h.replace(/\[要修正\]/g,"").trim(),!h)return;const _=x.segments.map(m=>m.word).join(" ").trim(),i=/[.!?]$/.test(_);/[。！？]$/.test(h)?(n+=h,i&&(t.push(n.trim()),n="")):i?(n+=h+"。",t.push(n.trim()),n=""):n+=h+"、"}}),n.trim()&&t.push(n.trim()+"。");const o=[],g=4;for(let x=0;x<t.length;x+=g){const h=t.slice(x,x+g);o.push(h.join(""))}return o.map((x,h)=>e.jsx("p",{className:"paragraph-ja",children:x},h))}})()})})]}),e.jsx("style",{children:`
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
      `})]})}export{Bt as default};
//# sourceMappingURL=ComprehensiveReadingView-BLJL9SyC.js.map
