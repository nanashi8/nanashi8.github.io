import { useMemo, useState } from 'react';

type SubjectKey = 'english' | 'math' | 'science' | 'social' | 'japanese';

type ReferenceSection = {
  title: string;
  bullets: string[];
};

type SubjectReference = {
  label: string;
  emoji: string;
  intro: string;
  sections: ReferenceSection[];
};

const SUBJECTS: Array<{ key: SubjectKey; label: string; emoji: string }> = [
  { key: 'english', label: '英語', emoji: '🇬🇧' },
  { key: 'math', label: '数学', emoji: '📐' },
  { key: 'science', label: '理科', emoji: '🧪' },
  { key: 'social', label: '社会', emoji: '🌏' },
  { key: 'japanese', label: '国語', emoji: '📚' },
];

const REFERENCES: Record<SubjectKey, SubjectReference> = {
  english: {
    label: '英語',
    emoji: '🇬🇧',
    intro: '「まずこれだけ」だけを短く確認して、学習タブに戻れる構成です。',
    sections: [
      {
        title: '品詞と語順（超重要）',
        bullets: [
          '英語の基本語順は S + V + O（主語→動詞→目的語）',
          '形容詞は名詞の前、頻度副詞は動詞の前/助動詞の後に置きやすい',
          '前置詞 + 名詞 で「場所・時間・方向」を作る',
        ],
      },
      {
        title: '時制（中学の土台）',
        bullets: [
          '現在：習慣・事実 / 過去：過去の出来事 / 未来：will・be going to',
          '進行形：be + 動詞ing（その時まさに〜している）',
          '現在完了：have + 過去分詞（経験・完了・継続）',
        ],
      },
      {
        title: 'テストで崩れやすいポイント',
        bullets: ['三単現のs', '代名詞の格（I / my / me など）', '疑問文の語順（Do/Does/Did）'],
      },
    ],
  },
  math: {
    label: '数学',
    emoji: '📐',
    intro: '解法の暗記ではなく「考え方の型」を短くまとめています。',
    sections: [
      {
        title: '式の変形（ミスが減る型）',
        bullets: [
          '移項は「両辺に同じ操作」をした結果と考える（符号ミスが減る）',
          '分数はまず通分、文字式はまず同類項をまとめる',
          '展開→整理→因数分解の順で整える',
        ],
      },
      {
        title: '関数の読み方',
        bullets: [
          '比例：y=ax（原点を通る直線）',
          '一次関数：y=ax+b（切片b）',
          '傾きaは「xが1増えたときyがいくつ増えるか」',
        ],
      },
      {
        title: '図形の基本',
        bullets: ['合同条件（辺・角の組）', '相似比→面積比→体積比', '円周角と中心角（中心角は円周角の2倍）'],
      },
    ],
  },
  science: {
    label: '理科',
    emoji: '🧪',
    intro: '「用語→原理→典型問題」の順で思い出せるように整理しています。',
    sections: [
      {
        title: '物理（力・電気の軸）',
        bullets: [
          '力は向きと大きさ（合力・分力）',
          '仕事 = 力 × 距離（力の向きに進んだ距離）',
          'オームの法則：電圧V = 電流I × 抵抗R',
        ],
      },
      {
        title: '化学（粒子の考え方）',
        bullets: ['物質は粒子（原子・分子）で考える', '化学反応は原子の組み替え', '質量保存をまず確認'],
      },
      {
        title: '生物・地学（頻出の見分け）',
        bullets: ['細胞→組織→器官', '天気：前線と風向き', '地層：新しいほど上（基本）'],
      },
    ],
  },
  social: {
    label: '社会',
    emoji: '🌏',
    intro:
      '地理・歴史・公民の「骨組み（何を先に見るか）」をまとめています。細かい暗記は後回しでOK。',
    sections: [
      {
        title: '地理：見る順番（基本）',
        bullets: [
          '位置→地形→気候→産業→人口→課題 の順で整理する',
          '「自然条件」と「人のくらし（産業・都市）」のつながりを必ず言えるようにする',
          '地図・統計は「読み取り→理由→対策」の3点セットで',
        ],
      },
      {
        title: '地理：世界と日本の見方',
        bullets: [
          '世界：地域ごとに「気候・資源・産業・人口・課題」の型で比較する',
          '日本：地域ごとに「地形・気候→農業/工業/サービス→交通→課題」の型で整理する',
          '国際的な結びつきは「貿易（輸出入）＋相手地域＋理由」をセットで覚える',
        ],
      },
      {
        title: '地理：防災・環境（よく出る）',
        bullets: [
          '自然災害は「地形・気候の特徴→起きやすい災害→備え」で説明する',
          '環境問題は「原因→影響→対策（国・地域・個人）」の順で',
          '人口問題は「少子高齢化/過疎・過密→困ること→対応策」で整理する',
        ],
      },
      {
        title: '歴史：流れの掴み方（基本）',
        bullets: [
          '時代の区切り→政治のしくみ→社会・経済→文化→出来事 の順で押さえる',
          '改革は「誰が・何を・なぜ・どう変えたか」',
          '戦争は「原因→経過→結果（条約/影響）」',
        ],
      },
      {
        title: '歴史：古代〜近世の大枠',
        bullets: [
          '古代：国家の成立と文化（政治の中心がどこか）',
          '中世：武士の台頭と支配のしくみ（将軍・幕府・守護/地頭など）',
          '近世：全国統一→江戸の仕組み→身分と文化（安定と変化）',
        ],
      },
      {
        title: '歴史：近代〜現代の大枠',
        bullets: [
          '近代：開国→近代国家づくり→産業化（政治と経済の変化）',
          '戦争は国際関係の流れで見る（同盟・植民地・資源など）',
          '現代：戦後改革→民主主義→国際社会の中の日本（課題と選択）',
        ],
      },
      {
        title: '公民：政治（頻出）',
        bullets: [
          '三権分立（立法・行政・司法）と「チェック＆バランス」を説明できるようにする',
          '選挙・国会・内閣・裁判所は「役割」と「つながり」で覚える',
          '地方自治は「住民参加」と「財政」の視点で見る',
        ],
      },
      {
        title: '公民：憲法・人権（頻出）',
        bullets: [
          '基本的人権は「自由権・社会権・参政権」の区別をまず固める',
          '公共の福祉は「権利の調整」の考え方として押さえる',
          '平等・表現の自由・労働などは具体例（裁判/ニュース）で覚えると強い',
        ],
      },
      {
        title: '公民：経済・国際（頻出）',
        bullets: [
          '市場は「需要と供給」で価格が決まる（グラフの読み取り）',
          '景気は「好況/不況」「インフレ/デフレ」「金融/財政政策」で整理する',
          '国際社会は「国連」「国際協力」「地球規模課題」をセットで押さえる',
        ],
      },
      {
        title: '参考（章立ての骨組み）',
        bullets: [
          '本ページの章立ては、公式資料の「骨組み」を参考にしつつ、アプリ用に言い換えて整理しています（目次・本文の転載はしていません）。',
          '文科省：中学校学習指導要領解説（社会編） https://www.mext.go.jp/a_menu/shotou/new-cs/1387016.htm',
          '東京書籍：分野別の資料ダウンロード（内容解説パンフレット／各種資料／編修趣意書 などのカテゴリで整理）',
          '  地理：https://ten.tokyo-shoseki.co.jp/text/chu/shakai/chiri/download',
          '  歴史：https://ten.tokyo-shoseki.co.jp/text/chu/shakai/rekishi/download',
          '  公民：https://ten.tokyo-shoseki.co.jp/text/chu/shakai/komin/download',
          '東京書籍：年間指導計画作成資料（教科別） https://ten.tokyo-shoseki.co.jp/text/chu/list/keikaku/',
        ],
      },
    ],
  },
  japanese: {
    label: '国語',
    emoji: '📚',
    intro: '読解は「根拠の位置」を固定して、迷いを減らすための要点です。',
    sections: [
      {
        title: '読解：根拠の探し方',
        bullets: ['設問→本文→選択肢の順', '理由は「しかし/だから/つまり」の周辺に出やすい', '指示語は直前〜直後を確認'],
      },
      {
        title: '文法：最低限',
        bullets: ['品詞（自立語/付属語）', '活用（動詞・形容詞・形容動詞）', '文の成分（主語・述語・修飾語）'],
      },
      {
        title: '漢字・語彙',
        bullets: ['同音異義語/同訓異字', '対義語・類義語', '慣用句は「意味」までセット'],
      },
    ],
  },
};

export default function StudyReferenceView() {
  const [active, setActive] = useState<SubjectKey>('english');

  const current = useMemo(() => REFERENCES[active], [active]);

  return (
    <div className="px-4 py-6 space-y-6">
      <div className="bg-card-bg rounded-xl p-6 shadow-md border-2 border-card-border">
        <h3 className="text-xl font-bold text-text-color mb-2 flex items-center gap-2">
          <span>📖</span>
          <span>参考書（基本）</span>
        </h3>
        <p className="text-sm text-text-secondary">{current.intro}</p>

        <div className="mt-4 flex flex-wrap gap-2">
          {SUBJECTS.map((s) => (
            <button
              key={s.key}
              className={`px-3 py-2 rounded-lg border-2 text-sm font-semibold transition-all ${
                active === s.key
                  ? 'bg-primary border-primary text-white'
                  : 'bg-bg-secondary border-border-color text-text-color hover:border-primary'
              }`}
              onClick={() => setActive(s.key)}
            >
              {s.emoji} {s.label}
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-3">
        {current.sections.map((section) => (
          <details
            key={section.title}
            className="bg-card-bg rounded-xl p-4 shadow-sm border-2 border-card-border"
          >
            <summary className="cursor-pointer font-bold text-text-color">
              {current.emoji} {section.title}
            </summary>
            <ul className="mt-3 space-y-2 text-sm text-text-color">
              {section.bullets.map((b) => (
                <li key={b} className="bg-bg-secondary rounded-lg px-3 py-2">
                  {b}
                </li>
              ))}
            </ul>
          </details>
        ))}
      </div>
    </div>
  );
}
