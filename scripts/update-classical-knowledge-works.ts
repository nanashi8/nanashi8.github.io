#!/usr/bin/env tsx

/**
 * classical-knowledge.csv のうち「種別:古典作品」の行を対象に、
 *
 * - 解説に【あらすじ】を追記
 * - 例文1/例文2 を「代表的なシーンの現代語訳」に置換
 *
 * 目的:
 * - 作品カードは“作品理解”を最優先にし、例文をその作品由来に固定する
 * - 自動引用プール割当（fill-classical-japanese-examples.ts）と独立させる
 */

import * as fs from 'fs';
import * as path from 'path';

type CsvRow = Record<string, string>;

type ParsedCsv = {
  headers: string[];
  rows: CsvRow[];
};

type WorkPatch = {
  synopsis: string;
  example1: string;
  example2: string;
};

function parseCsvText(csvText: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let field = '';
  let inQuotes = false;

  for (let i = 0; i < csvText.length; i++) {
    const ch = csvText[i];

    if (inQuotes) {
      if (ch === '"') {
        const next = csvText[i + 1];
        if (next === '"') {
          field += '"';
          i++;
        } else {
          inQuotes = false;
        }
      } else {
        field += ch;
      }
      continue;
    }

    if (ch === '"') {
      inQuotes = true;
      continue;
    }
    if (ch === ',') {
      row.push(field);
      field = '';
      continue;
    }
    if (ch === '\n') {
      row.push(field);
      field = '';
      if (row.some((v) => v.trim() !== '')) rows.push(row);
      row = [];
      continue;
    }
    if (ch === '\r') continue;

    field += ch;
  }

  row.push(field);
  if (row.some((v) => v.trim() !== '')) rows.push(row);
  return rows;
}

function parseCsvToObjects(csvText: string): ParsedCsv {
  const table = parseCsvText(csvText);
  if (table.length < 2) return { headers: [], rows: [] };

  const headers = table[0].map((h) => h.trim());
  const rows: CsvRow[] = [];

  for (const r of table.slice(1)) {
    const row: CsvRow = {};
    headers.forEach((h, idx) => {
      row[h] = (r[idx] ?? '').trim();
    });
    rows.push(row);
  }

  return { headers, rows };
}

function escapeCsvCell(value: string): string {
  const v = value ?? '';
  const needsQuote = /[\n\r\",]/.test(v);
  if (!needsQuote) return v;
  return `"${v.replace(/"/g, '""')}"`;
}

function formatCsv(headers: string[], rows: CsvRow[]): string {
  const lines: string[] = [];
  lines.push(headers.map(escapeCsvCell).join(','));
  for (const r of rows) {
    lines.push(headers.map((h) => escapeCsvCell(r[h] ?? '')).join(','));
  }
  return lines.join('\n') + '\n';
}

function splitPipeList(raw: string): string[] {
  return raw
    .split('|')
    .map((s) => s.trim())
    .filter(Boolean);
}

function isWorkRow(row: CsvRow): boolean {
  const tags = splitPipeList(row['関連事項'] || '');
  return tags.includes('種別:古典作品');
}

function ensureSourceSuffix(text: string, source: string): string {
  const t = (text || '').trim();
  if (!t) return '';
  if (t.includes(`【${source}】`)) return t;
  // 既に別の【...】が付いている場合はそのまま残す（重複させない）
  if (/【[^】]+】/.test(t)) return t;
  return `${t}【${source}】`;
}

function ensureModernTag(text: string): string {
  const t = (text || '').trim();
  if (!t) return '';
  // 既に付いている場合はそのまま
  if (t.includes('（現代語訳）')) return t;
  // 出典表記より前に付けたいので、末尾に付ける（後段で【作品】が付く）
  return `${t}（現代語訳）`;
}

const WORK_PATCHES: Record<string, WorkPatch> = {
  竹取物語: {
    synopsis:
      '竹取の翁が光る竹の中からかぐや姫を見つけ、やがて姫は多くの求婚者や帝の求愛を退け、最後は月へ帰っていく物語。',
    example1: '竹取の翁が竹の中で光る小さな姫を見つけ、家に連れ帰って育て始める。',
    example2:
      '月から迎えが来る夜、かぐや姫は育ての親に別れを告げ、天人の衣を着せられて涙も心も遠のいていく。帝の軍勢も引き留められず、姫は月へ昇ってしまう。',
  },
  伊勢物語: {
    synopsis:
      '在原業平を思わせる「昔男」を中心に、恋や旅の逸話と和歌を組み合わせた短い話の連なり。',
    example1: '主人公は恋に悩みながら各地を旅し、折々の出来事を和歌に託して語る。',
    example2:
      '東国への旅の途中、隅田川のほとりで都を思って涙がこぼれ、旅の寂しさが胸に迫る。変わらぬ月や春の景色に、変わってしまった自分の身を重ねて嘆く。',
  },
  土佐日記: {
    synopsis:
      '紀貫之が「女」のふりをして、土佐から都へ戻る旅の日々を仮名で記した日記文学。旅の別れや喪失の悲しみが描かれる。',
    example1: '作者一行が任地の土佐を出発し、船で都へ帰る道中の出来事を日々書き留める。',
    example2:
      '旅の途中、亡くした子のことがふと胸に迫り、楽しむはずの景色も悲しみに染まる。どうしようもない思いを、歌と言葉でこぼしながら船路を進む。',
  },
  枕草子: {
    synopsis:
      '清少納言が宮廷での見聞や感想を、鋭い観察と機知ある文章で綴った随筆。四季や人物、出来事が多彩に描かれる。',
    example1: '四季それぞれの美しさを、春の夜明けや秋の夕暮れなど具体的な情景で語る。',
    example2:
      '雪の積もった香炉峰をめぐるやり取りで、機転の利いた返答が場を一気に沸かせる。宮中の知的な遊びと、才気が勝負になる緊張感が伝わる。',
  },
  源氏物語: {
    synopsis:
      '光源氏の恋愛と栄華、そしてその後の世代までを描く長編物語。人の心の揺れと「もののあわれ」が物語全体を貫く。',
    example1: '身分の定まらない母を持つ光源氏が宮中で成長し、さまざまな恋に身を投じていく。',
    example2:
      '栄華の頂点にあるように見えても、別れや嫉妬が積み重なり、心は静かに疲れていく。最愛の人を失う場面では、取り返しのつかない喪失が物語の空気を変えてしまう。',
  },
  更級日記: {
    synopsis:
      '菅原孝標女が少女期から晩年までを回想し、物語への憧れと現実の人生の移ろいを綴った日記文学。',
    example1: '幼い頃から物語を強く望み、ついにそれを手にして夢中になる心の高まりが語られる。',
    example2:
      '憧れていた物語の世界に心を預けたのに、現実の人生は思うように進まず、ふと我に返って虚しさを覚える。年月を経て、かつての熱と今の静けさの落差を受け止める場面が胸に残る。',
  },
  大鏡: {
    synopsis:
      '摂関政治の時代を、老人たちの語り（対話）という形で回想し、藤原氏と道長の栄華を中心に描く歴史物語。',
    example1: '二人の老人が昔話として語り始め、宮廷の政争や人々の評判が生き生きと伝えられる。',
    example2:
      '語りが進むにつれ、道長の権勢が極まり、誰も逆らえない空気が都を覆っていく。やがて栄華の影にある緊張や不安もにじみ、時代の大きなうねりが感じられる。',
  },
  今昔物語集: {
    synopsis:
      '仏教説話や世俗説話など多種多様な短編を集めた大規模な説話集。「今は昔」の語り口で物語が展開する。',
    example1: '「今は昔」と語り出し、因果応報や人の欲深さなど、教訓を含む出来事を短く語る。',
    example2:
      '人の欲や怠け心が招いた結末がはっきり示され、読後に強い戒めが残る。笑い話でも最後には「そうなってはいけない」と思わせる落ちが付く。',
  },
  平家物語: {
    synopsis:
      '平氏の栄華と滅亡、源平合戦の激動を語る軍記物語。冒頭から無常観が示され、盛者必衰の理が描かれる。',
    example1: '平氏が権勢を誇るが、やがて戦乱が広がり、一門が滅びへ向かっていく。',
    example2:
      '都で栄華を誇った平家が、戦の連敗で次第に追い詰められていく。最期を迎える場面では、勝敗以上に無常と別れの痛みが強く胸に迫る。',
  },
  徒然草: {
    synopsis:
      '兼好法師が、世の中の出来事や人の心を観察し、教訓や無常観を交えて書き留めた随筆。短い段が積み重なる。',
    example1: '退屈な時間に硯へ向かい、思いつくままに物事を書きつけていく動機が述べられる。',
    example2:
      '人の失敗や世間の評判を見て、なるほどと思う教訓が最後に突きつけられる。笑って読んでいたはずが、結局は自分の生き方を省みる気持ちになる。',
  },
  方丈記: {
    synopsis: '鴨長明が災厄の記憶と自らの隠遁生活を語り、世の無常を深く考察する随筆。',
    example1: '都で起きた大火や飢饉などの災厄を振り返り、人の世の不安定さを語る。',
    example2:
      '災厄で都が崩れていく様子を見たのち、作者は小さな庵に身を置く。静けさの中でも執着が消えないことに気づき、無常を突き詰めて語る場面が核心となる。',
  },
  奥の細道: {
    synopsis: '松尾芭蕉が弟子と共に東北・北陸を旅し、名所の感慨を俳句と散文で記した俳諧紀行。',
    example1: '旅立ちにあたり、時の流れも人も旅人であると感じ、人生を旅に重ねて語る。',
    example2:
      '名所を前にして言葉が尽きるほどの感慨に包まれ、旅の疲れも忘れる。ふと一句を置いた瞬間、風景と歴史が一つに結ばれたように感じられる。',
  },
  古今和歌集: {
    synopsis:
      '最初の勅撰和歌集として、四季や恋などの歌を体系的に集めた。仮名序・真名序を持ち、和歌の美意識を示す。',
    example1: '桜への思いのように、自然の美が人の心を大きく揺らすことを歌で表す。',
    example2:
      '仮名序で、和歌は人の心から生まれ世を動かすものだと語られ、歌の価値が高らかに宣言される。続く歌々では、恋や別れの痛みが凝縮され、短い言葉で感情の頂点が示される。',
  },
  堤中納言物語: {
    synopsis:
      '平安末期の短編物語集で、機知やユーモアのある話が多い。「虫めづる姫君」など個性的な人物が登場する。',
    example1: '世間の常識にとらわれない姫君が登場し、周囲を驚かせるような振る舞いを見せる。',
    example2:
      '姫君が周囲の笑いものになっても平然と自分の好きを貫き、場の空気が一変する。世間の常識が揺さぶられる瞬間がこの話の山場になる。',
  },
  落窪物語: {
    synopsis:
      '継母と姉にいじめられる姫が、助けを得て幸せをつかむ「シンデレラ型」の物語。庶民的で写実的な描写が特徴。',
    example1: '姫は理不尽ないじめに耐えながらも、味方となる人々に支えられて希望をつなぐ。',
    example2:
      '姫は長い屈辱を耐え抜いた末に、助けの手によって屋敷から救い出される。立場が逆転し、加害者側が慌てふためく展開が痛快な山場となる。',
  },
  うつほ物語: {
    synopsis:
      '琴の秘曲の伝承を軸に、複数世代にわたる恋愛や出世を描く長編物語。音楽が物語を動かす重要な要素となる。',
    example1: '秘められた琴の技と物語が受け継がれ、運命のように人々の人生に関わっていく。',
    example2:
      '秘曲が披露される場面で、音が人の心と運命を大きく動かし、周囲の評価が一気に変わる。音楽が栄達や恋の行方を決めていくところが物語の盛り上がりになる。',
  },
  太平記: {
    synopsis:
      '後醍醐天皇の倒幕から南北朝の争乱までを描く軍記物語。武将たちの活躍と政治の変転が大きな流れとして語られる。',
    example1: '倒幕を目指す動きが広がり、戦乱の中で武将たちが名を上げていく。',
    example2:
      '戦が重なるにつれ、忠義や大義を掲げた武将たちが命を賭ける場面が続く。勝敗が決したあとに残るのは栄光ではなく喪失で、乱世のむごさが際立つ。',
  },
  保元物語: {
    synopsis:
      '保元の乱を題材に、皇族・貴族・武士の対立と、武士が台頭していく時代の転換点を描く軍記物語。',
    example1: '皇位をめぐる争いが火種となり、武士たちがそれぞれの陣営で戦うことになる。',
    example2:
      '決戦では、親子や兄弟が敵味方に分かれて矢を放つという悲劇が頂点に達する。勝った側も後味の悪さを抱え、武士の時代の始まりが突きつけられる。',
  },
  平治物語: {
    synopsis:
      '平治の乱を題材に、源氏と平氏の対立が激化し、平清盛の台頭につながる過程を描く軍記物語。',
    example1: '都で政変が起こり、源氏と平氏が衝突して戦いが広がる。',
    example2:
      '都が炎と混乱に包まれ、追う者と追われる者の運命が一気に決まってしまう。敗れた側が落ち延びる場面が、のちの源平の大争乱へとつながる山場になる。',
  },
  宇治拾遺物語: {
    synopsis: '鎌倉初期の説話集で、教訓話だけでなく笑い話も多い。短い話で人間の機微が描かれる。',
    example1: '思わぬ勘違いや失敗が起こり、読者がくすっと笑えるような逸話が語られる。',
    example2:
      '勘違いが積み重なって最後に大恥をかき、まわりが一斉に笑う落ちが決まる。笑いのあとに、人の愚かさや戒めが自然と残る。',
  },
  古今著聞集: {
    synopsis:
      '鎌倉時代に編まれた説話集で、和歌・音楽・芸能など文化的題材が豊富。貴族社会の逸話が多い。',
    example1: '和歌や音楽にまつわる逸話が語られ、当時の文化の価値観が伝わる。',
    example2:
      '名人の一言や機転で、その場の評価がひっくり返る場面が印象的に語られる。芸能や和歌が人生の勝負所になるところがこの集の面白さだ。',
  },
  沙石集: {
    synopsis:
      '仏教的教訓を含む説話を集めた作品で、僧侶や民衆の暮らしも描かれる。信仰と現実の間の人間像が表れる。',
    example1: '僧が語る因果応報の話などを通して、心の持ち方や行いの大切さが示される。',
    example2:
      '欲や慢心が招いた結末が示され、読み手ははっとして姿勢を正す。最後に仏教の教えへ収束していく語りが、教訓としての山場になる。',
  },
  蜻蛉日記: {
    synopsis:
      '藤原道綱母が、夫との結婚生活の苦悩や心の揺れを率直に綴った日記文学。内面描写が特徴。',
    example1: '夫の訪れを待ちながら不安と苛立ちが募り、心が落ち着かない日々が語られる。',
    example2:
      '夫を待ち続ける日々が限界に達し、作者は心の折れそうな瞬間を言葉にする。迷いながらも自分の生き方を選び直そうとする決意が、この日記の山場になる。',
  },
  和泉式部日記: {
    synopsis: '和泉式部と敦道親王の恋を中心に、和歌を交えながら情熱的な心情を描く日記風の物語。',
    example1: '身分差のある恋に惹かれ合い、逢瀬を重ねるたびに喜びと不安が増していく。',
    example2:
      '恋の噂や身分の壁に揺さぶられながらも、二人は和歌で思いを投げ合う。会えない夜の切なさが頂点に達し、言葉だけが熱を持って残る。',
  },
  紫式部日記: {
    synopsis:
      '紫式部が宮廷での生活や人々の振る舞いを観察し、出来事や評判を記した日記。作者の人物評が鋭い。',
    example1: '宮中の行事や日常が描かれ、華やかさの裏にある気遣いや緊張感も伝わる。',
    example2:
      '華やかな宮廷の裏で、噂や嫉妬が渦巻き、作者は一歩引いて冷静に観察する。人の長所も短所も見抜いて書き留める筆致が、読者に強い印象を与える。',
  },
  讃岐典侍日記: {
    synopsis: '讃岐典侍が宮中での立場から、帝への思慕や心の動きを和歌とともに綴った短い日記文学。',
    example1: '帝への思いが募り、会えない時間の寂しさを和歌や言葉で表す。',
    example2:
      '帝との距離が埋まらないまま時が過ぎ、思慕が耐えがたいほど強くなる。会えない現実を受け入れつつ、歌にだけ心を託す場面が切ない山場になる。',
  },
  増鏡: {
    synopsis:
      '後鳥羽院から後醍醐天皇の頃までの政治と宮廷社会を、貴族の視点で語る歴史物語。四鏡の最後にあたる。',
    example1: '院政や政争の移り変わりが、宮廷に近い目線で淡々と語られる。',
    example2:
      '政局が転がるように変わり、昨日の常識が今日には崩れてしまう。語りが積み重なって時代の転換点が見えてくるところが、この歴史物語の山場になる。',
  },
  発心集: {
    synopsis: '出家や入道など「発心」にまつわる説話を集め、世俗の執着から離れる心の転換を描く。',
    example1: '世の無常を感じた人が出家を決意し、これまでの暮らしを捨てるきっかけが語られる。',
    example2:
      '世俗の成功や愛着を捨てる決断の瞬間が描かれ、読者も心を揺さぶられる。出家後の苦しさや迷いを越えて心が変わるところが、説話の結末として示される。',
  },
  十訓抄: {
    synopsis:
      '十の教訓を軸に、和漢の故事や逸話を集めた説話集。権力者から庶民まで、行動の戒めが示される。',
    example1: '権力や欲に振り回された失敗談が語られ、慎みの大切さが示される。',
    example2:
      '軽い気持ちの過ちが大きな破滅につながり、最後に厳しい結末で締まる。逆に、慎み深い振る舞いが報われる話では、結果がはっきり出て教訓が胸に刺さる。',
  },
  栄花物語: {
    synopsis:
      '藤原氏、とくに道長の時代を中心に、宮廷の栄華や行事を物語風に描く歴史物語。華やかな宮廷生活の記録でもある。',
    example1: '摂関家の勢いが増し、宮廷行事や婚姻を通じて権力が固まっていく。',
    example2:
      '道長の権勢が頂点に達し、宮廷行事がきらびやかに続く一方で、その繁栄が永遠ではない気配も漂う。華やかさと無常が同時に見えるところが読みどころになる。',
  },
};

function main(): void {
  const filePath = path.join(
    process.cwd(),
    'public/data/classical-japanese/classical-knowledge.csv'
  );
  const before = fs.readFileSync(filePath, 'utf-8');
  const parsed = parseCsvToObjects(before);

  for (const col of ['語句', '解説', '関連事項', '例文1', '例文2']) {
    if (!parsed.headers.includes(col)) {
      throw new Error(`missing column: ${col}`);
    }
  }

  let changed = false;
  const missingWorks: string[] = [];

  for (const row of parsed.rows) {
    if (!isWorkRow(row)) continue;

    const work = row['語句'] || '';
    const patch = WORK_PATCHES[work];
    if (!patch) {
      missingWorks.push(work || '(empty)');
      continue;
    }

    const desc = row['解説'] || '';
    if (!desc.includes('【あらすじ】')) {
      row['解説'] = `${desc.trim()}【あらすじ】${patch.synopsis}`;
      changed = true;
    }

    const e1 = ensureSourceSuffix(ensureModernTag(patch.example1), work);
    const e2 = ensureSourceSuffix(ensureModernTag(patch.example2), work);

    if (row['例文1'] !== e1) {
      row['例文1'] = e1;
      changed = true;
    }
    if (row['例文2'] !== e2) {
      row['例文2'] = e2;
      changed = true;
    }
  }

  if (missingWorks.length) {
    const uniq = Array.from(new Set(missingWorks)).sort();
    throw new Error(`古典作品の【あらすじ】/例文マップが不足しています: ${uniq.join(', ')}`);
  }

  if (!changed) {
    console.log('no-op');
    return;
  }

  const after = formatCsv(parsed.headers, parsed.rows);
  fs.writeFileSync(filePath, after, 'utf-8');
  console.log('ok: updated classical-knowledge.csv');
}

try {
  main();
} catch (e) {
  console.error(`\n❌ エラー: ${String((e as any)?.message || e)}`);
  process.exit(1);
}
