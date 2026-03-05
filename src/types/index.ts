// 职场混蛋类型定义
export interface AssholeType {
  type_cn: string;
  type_en: string;
  score: number;
  rating_cn: string;
  rating_en: string;
  description_cn: string;
  description_en: string;
}

// 总结评价配置
export interface SummaryRating {
  score_range: string;
  level_cn: string;
  level_en: string;
  rating_cn: string;
  rating_en: string;
  comment_cn: string;
  comment_en: string;
}

// 总结评价配置列表
export const SUMMARY_RATINGS: SummaryRating[] = [
  {
    score_range: "0-20",
    level_cn: "净土守护者",
    level_en: "The Sanctuary Keeper",
    rating_cn: "人类之光",
    rating_en: "Beacon of Humanity",
    comment_cn: "你简直是一块职场净土，散发着人性的微弱光辉。在这个全员恶人的时代，你居然能保持基本体面，建议申请非物质文化遗产保护。",
    comment_en: "You're practically a sanctuary in this toxic wasteland, emitting faint glimmers of humanity. In this era of universal villainy, your basic decency deserves UNESCO heritage protection."
  },
  {
    score_range: "21-40",
    level_cn: "瑕疵凡人",
    level_en: "The Flawed Mortal",
    rating_cn: "咖啡里的苍蝇",
    rating_en: "Fly in the Coffee",
    comment_cn: "你偶尔会让人翻白眼，但还在人类可接受范围内。就像咖啡里的苍蝇——恶心但还能挑出来，不至于倒掉整杯。建议买本《情商》补补课。",
    comment_en: "You occasionally trigger eye-rolls but remain within human tolerance. Like a fly in coffee—disgusting but salvageable, not worth dumping the whole cup. Invest in an EQ textbook."
  },
  {
    score_range: "41-60",
    level_cn: "人形麻烦精",
    level_en: "The Human Hassle",
    rating_cn: "演技破坏者",
    rating_en: "Performance Destroyer",
    comment_cn: "你已经从'有点烦'进化成'看见就累'。同事见到你，脸上的职业假笑都得切换成防御模式。建议随身携带避雷针，因为你走到哪劈到哪。",
    comment_en: "You've evolved from 'slightly annoying' to 'visually exhausting'. When colleagues see you, their professional fake smiles switch to defense mode. Carry a lightning rod—you strike everywhere you go."
  },
  {
    score_range: "61-80",
    level_cn: "移动灾难区",
    level_en: "The Walking Disaster",
    rating_cn: "HR重点监控对象",
    rating_en: "HR's Most Wanted",
    comment_cn: "你走到哪里，职场文明就倒退到哪里。建议公司给你单独配个办公室——在地下停车场，或者外太空。团建时大家宁愿跟北极熊合影也不想跟你一组。",
    comment_en: "Wherever you go, workplace civilization regresses. The company should assign you a private office—in the basement, or outer space. During team building, colleagues would rather pose with polar bears than be grouped with you."
  },
  {
    score_range: "81-100",
    level_cn: "终极大魔王",
    level_en: "The Final Boss",
    rating_cn: "灭霸响指级",
    rating_en: "Thanos Snap Level",
    comment_cn: "恭喜你集齐了十大恶人卡！你存在的意义就是衬托他人的美好，是HR的噩梦、同事的心理阴影、办公室的放射性污染源。建议申请吉尼斯'最快清空办公室'世界纪录，或者考虑转行做独居职业。",
    comment_en: "Congrats on collecting all ten villain cards! Your existence serves only to highlight others' beauty—you're HR's nightmare, colleagues' PTSD, and the office's radioactive contamination source. Apply for Guinness 'Fastest Office Evacuation' or consider hermit professions."
  }
];

// 根据分数获取评价
export function getSummaryRating(score: number): SummaryRating {
  if (score <= 20) return SUMMARY_RATINGS[0];
  if (score <= 40) return SUMMARY_RATINGS[1];
  if (score <= 60) return SUMMARY_RATINGS[2];
  if (score <= 80) return SUMMARY_RATINGS[3];
  return SUMMARY_RATINGS[4];
}

// 计算投票总分
export function calculateVoteScore(voteDetails: VoteDetails): number {
  let totalScore = 0;
  for (const type of ASSHOLE_TYPES) {
    if (voteDetails[type.type_cn]) {
      totalScore += type.score;
    }
  }
  return totalScore;
}

// 投票详情
export interface VoteDetails {
  [key: string]: boolean; // type_cn -> true/false
}

// 公司
export interface Company {
  company_id: number;
  company_name: string;
}

// 投票记录
export interface Vote {
  vote_id: number;
  name_mask: string;
  company_id: number;
  vote_details: VoteDetails;
  shits: number;
  score: number; // 投票总分
  created_at: string;
}

// 汇总记录
export interface Summary {
  summary_id: number;
  company_id: number;
  name_mask: string;
  vote_id_count: number;
  shits_count: number;
  max_score: number; // 该公司下该人的最高分
}

// 排名项
export interface RankingItem extends Summary {
  company_name: string;
  rank: number;
  title?: string; // 翔王/翔圣/翔尊
}

// 10种职场混蛋类型
export const ASSHOLE_TYPES: AssholeType[] = [
  {
    type_cn: "甩锅侠 —— 责任推卸专家",
    type_en: "Buck-Passer —— The Accountability Evader",
    score: 13,
    rating_cn: "组织癌症级",
    rating_en: "Organizational Cancer",
    description_cn: "系统性摧毁责任伦理与委托-代理信任，瓦解团队协作的契约基础，导致优秀人才流失与组织免疫机制崩溃",
    description_en: "Systematically destroys accountability ethics and principal-agent trust, dismantles the contractual foundation of teamwork, leading to brain drain and organizational immune system collapse"
  },
  {
    type_cn: "成果窃贼 —— 知识产权掠夺者",
    type_en: "Credit Thief —— The Intellectual Plunderer",
    score: 11,
    rating_cn: "剧毒水母级",
    rating_en: "Venomous Jellyfish",
    description_cn: "破坏知识分配的公平感与正义原则，抑制团队知识共享意愿，引发公地悲剧式创新萎缩",
    description_en: "Undermines distributive justice and fairness in knowledge attribution, suppresses willingness to share knowledge, triggers tragedy-of-the-commons style innovation atrophy"
  },
  {
    type_cn: "马屁精 —— 权力依附型人格",
    type_en: "Sycophant —— The Power Parasite",
    score: 11,
    rating_cn: "信号扭曲级",
    rating_en: "Signal Distortion",
    description_cn: "系统性扭曲组织价值观与信号传递机制，导致劣币驱逐良币，使实干者产生相对剥夺感",
    description_en: "Systematically distorts organizational values and signal transmission mechanisms, drives out good currency with bad, creates relative deprivation among high performers"
  },
  {
    type_cn: "双面阴阳人 —— 人格分裂者",
    type_en: "Two-Faced —— The Duality Master",
    score: 11,
    rating_cn: "信任崩解级",
    rating_en: "Trust Disintegrator",
    description_cn: "摧毁组织沟通效率与心理安全感，制造信息不对称与信任危机，大幅增加交易成本",
    description_en: "Destroys organizational communication efficiency and psychological safety, creates information asymmetry and trust crises, significantly increases transaction costs"
  },
  {
    type_cn: "负能量黑洞 —— 情绪吸血鬼",
    type_en: "Energy Vampire —— The Negativity Black Hole",
    score: 10,
    rating_cn: "情感瘟疫级",
    rating_en: "Emotional Plague",
    description_cn: "持续消耗团队情绪资源与认知带宽，抑制创新尝试，诱发习得性无助的组织氛围",
    description_en: "Continuously drains team emotional resources and cognitive bandwidth, inhibits innovation attempts, induces organizational atmosphere of learned helplessness"
  },
  {
    type_cn: "八卦制造机 —— 职场情报贩子",
    type_en: "Gossip Monger —— The Information Trafficker",
    score: 10,
    rating_cn: "隐私破坏级",
    rating_en: "Privacy Destroyer",
    description_cn: "破坏心理安全边界与隐私保护，制造恐惧氛围与相互猜疑，阻碍真实信息流通",
    description_en: "Destroys psychological safety boundaries and privacy protection, creates atmosphere of fear and mutual suspicion, obstructs flow of authentic information"
  },
  {
    type_cn: "微观控制狂 —— 不信任传播者",
    type_en: "Micromanager —— The Distrust Spreader",
    score: 9,
    rating_cn: "成长抑制级",
    rating_en: "Growth Suppressor",
    description_cn: "抑制员工自主性成长与创造力，降低组织敏捷性，导致管理者陷入微观事务陷阱",
    description_en: "Suppresses employee autonomous growth and creativity, reduces organizational agility, traps managers in micro-transaction quagmires"
  },
  {
    type_cn: "划水摸鱼师 —— 公平感破坏者",
    type_en: "Freeloader —— The Fairness Disruptor",
    score: 9,
    rating_cn: "公平腐蚀级",
    rating_en: "Fairness Corroder",
    description_cn: "破坏绩效分配的公平感知，引发社会惰化效应，增加高绩效者的相对剥夺感与离职倾向",
    description_en: "Undermines perceived fairness in performance distribution, triggers social loafing effects, increases relative deprivation and turnover intention among high performers"
  },
  {
    type_cn: "会议寄生虫 —— 时间杀手",
    type_en: "Meeting Parasite —— The Time Killer",
    score: 8,
    rating_cn: "效能耗散级",
    rating_en: "Efficiency Dissipator",
    description_cn: "造成组织时间贫困与注意力碎片化，通过虚假忙碌掩盖真实效率低下，抑制深度工作",
    description_en: "Creates organizational time poverty and attention fragmentation, masks real inefficiency with performative busyness, suppresses deep work"
  },
  {
    type_cn: "刺猬防御者 —— 玻璃心巨人",
    type_en: "Porcupine —— The Glass Giant",
    score: 8,
    rating_cn: "沟通摩擦级",
    rating_en: "Communication Friction",
    description_cn: "阻碍组织学习反馈循环与复盘文化，抑制问题讨论与批判性思维，增加沟通摩擦成本",
    description_en: "Obstructs organizational learning feedback loops and retrospective culture, suppresses problem discussion and critical thinking, increases communication friction costs"
  }
];
