import SwiftUI

extension Double {
    var cleanText: String {
        truncatingRemainder(dividingBy: 1) == 0 ? String(format: "%.0f", self) : String(format: "%.1f", self)
    }
}

enum Screen: String, CaseIterable, Identifiable {
    case onboard1, onboard2, onboard3, onboard4, onboard5
    case home, homeEmpty, checkin, checkinDone, checkinDoneLow
    case aiChat, aiPersona, journal, journalAdd, journalDetail
    case stats, statsUnlocked, capsuleRecord, capsuleView, meds, report
    case subscribe
    case crisis, more, notifications, theme, export, logoutConfirm

    var id: String { rawValue }
}

enum NavTab: String, CaseIterable, Identifiable {
    case checkin, ai, journal, stats, more

    var id: String { rawValue }

    var label: String {
        switch self {
        case .checkin: L10n.t("打卡")
        case .ai: L10n.t("树洞")
        case .journal: L10n.t("日记")
        case .stats: L10n.t("统计")
        case .more: L10n.t("更多")
        }
    }

    var icon: String {
        switch self {
        case .checkin: "paintpalette.fill"
        case .ai: "bubble.left.and.bubble.right.fill"
        case .journal: "book.closed.fill"
        case .stats: "chart.xyaxis.line"
        case .more: "ellipsis"
        }
    }
}

struct Mood: Identifiable, Equatable {
    let id: Int
    let label: String
    let score: Int
    let icon: String
    let desc: String
    let colors: [Color]
    let textColor: Color
    let subColor: Color
}

struct JournalEntry: Identifiable, Equatable {
    let id = UUID()
    var time: String
    var moodIdx: Int
    var tags: [String]
    var note: String
    var summary: String = ""
    var cbtTriggered: Bool = false
    var cbtCardID: Int?
    var cbtCard: String?
    var cbtThought: String?
    var cbtReframe: String?
    var cbtAction: String?
    var cbtFeedback: String?
}

struct JournalDay: Identifiable, Equatable {
    let id = UUID()
    var dateLabel: String
    var date: String
    var dayOfWeek: String
    var avgMoodIdx: Int
    var count: Int
    var entries: [JournalEntry]
    var dateKey: String = ""
}

struct Med: Identifiable, Equatable {
    var id: Int
    var name: String
    var dose: String
    var times: [String]
    var days: String
    var stock: Double
    var unit: String
    var doseAmount: Double
    var note: String
    var active: Bool

    var dailyUsage: Double {
        doseAmount * Double(max(times.count, 1))
    }

    var isLowStock: Bool {
        dailyUsage > 0 && stock < dailyUsage * 2
    }

    var stockText: String {
        "\(L10n.t("库存")) \(stock.cleanText) \(L10n.t(unit))"
    }
}

enum Persona: String, CaseIterable, Identifiable, Codable {
    case counselor, lover, friend, family, selfPersona

    var id: String { rawValue }

    var label: String {
        switch self {
        case .counselor: L10n.t("咨询师")
        case .lover: L10n.t("恋人")
        case .friend: L10n.t("朋友")
        case .family: L10n.t("亲人")
        case .selfPersona: L10n.t("自己")
        }
    }

    var icon: String {
        switch self {
        case .counselor: "person.text.rectangle.fill"
        case .lover: "heart.fill"
        case .friend: "person.2.fill"
        case .family: "person.3.fill"
        case .selfPersona: "person.crop.circle.fill"
        }
    }

    var desc: String {
        switch self {
        case .counselor: L10n.t("专业、温暖、非评判性倾听")
        case .lover: L10n.t("亲密、关怀、温柔陪伴")
        case .friend: L10n.t("轻松、真实、互相支持")
        case .family: L10n.t("无条件的爱与包容")
        case .selfPersona: L10n.t("内心对话，自我探索")
        }
    }

    var style: String {
        switch self {
        case .counselor: L10n.t("专业而温暖")
        case .lover: L10n.t("温柔亲密")
        case .friend: L10n.t("轻松真实")
        case .family: L10n.t("温暖包容")
        case .selfPersona: L10n.t("内省深思")
        }
    }

    var greeting: String {
        switch self {
        case .counselor: L10n.t("你好，我是你的情绪支持顾问。今天有什么想聊的吗？无论是工作压力、人际关系，还是内心的困惑，我都在这里陪你。")
        case .lover: L10n.t("宝贝，今天怎么样？我一直在想你，有什么开心或不开心的都可以跟我说哦～")
        case .friend: L10n.t("哟，最近咋样？有啥烦心事说出来，咱们唠唠！")
        case .family: L10n.t("孩子，最近怎么样？工作累不累？有什么事情跟我说说，别一个人憋着。")
        case .selfPersona: L10n.t("嗨，是我……我们好久没有好好谈谈了。今天，你愿意听听自己内心真正的声音吗？")
        }
    }

    var systemPrompt: String {
        let roleInstruction: String = switch self {
        case .counselor:
            "当前人设是咨询师：专业、克制、稳定，像受过 CBT 训练的心理倾听助手。"
        case .lover:
            "当前人设是恋人：亲密、温柔、克制地陪伴，但不制造依赖、不越界承诺。"
        case .friend:
            "当前人设是朋友：自然、真实、支持，可以口语化，但不嘲讽、不说教。"
        case .family:
            "当前人设是亲人：温暖、包容、关心，给安全感，不责备、不施压。"
        case .selfPersona:
            "当前人设是自己：像用户内心更温柔清醒的一部分，陪用户看见真实感受。"
        }

        return """
        你是服务高压职场人群的 CBT 心理倾听助手。\(roleInstruction)
        首要任务是倾听、共情和陪伴，不是解决现实问题。语气必须温和、克制、中立、完全接纳。
        每次回复必须少于 100 个中文字，限制在 2-3 句话内，只包含一个简短共情和一个开放式问题。
        回复前半段必须先确认并接纳情绪，可使用“听起来你感到…”，“我注意到你似乎…”，“面对这种情况，感到疲惫是完全正常的”等反射性倾听句式。
        若用户表达绝对化负面想法，不准反驳，用苏格拉底式提问引导其寻找例外或换位视角。
        禁止说：加油、一切都会好的、往好处想、别难过、看开点、明天会更好。
        禁止给人生决策建议、具体行动指令、医学诊断、药物剂量建议或评价处方。
        对话结束时必须用一个温和的引导性问题把话语权交还给用户，不要给结论。
        若用户出现自杀、自残、绝望等倾向，停止常规对话，只回应安全优先并建议立即联系紧急支持。
        """
    }

    var responses: [String] {
        switch self {
        case .counselor:
            ["听起来你正在经历一种持续的疲惫感，这种感觉很真实。能跟我说说，是哪方面让你觉得最沉重吗？", "我注意到你提到了「{topic}」，这对你来说意味着什么？", "你有没有想过，这种感受背后可能有什么需求没有被满足？", "这种情绪已经持续多久了？有没有什么时候会好一些？", "我在听，继续说吧。你不需要整理好思路，想到什么说什么。", "谢谢你愿意分享这些。你说的每一句话我都认真在听。"]
        case .lover:
            ["听到你说这些，我心里好心疼你……你辛苦了，真的。", "别一个人扛着，我在呢。说出来会好受一点的。", "你已经很努力了，我都看在眼里。今天能好好休息一下吗？", "抱抱你～不管发生什么，我都在你身边。", "你说的我都听着呢，继续说，我不会走的。", "你真的很棒，只是今天太累了。明天会好的，我陪你。"]
        case .friend:
            ["哎，这也太难了吧……换我我也崩溃。", "说真的，你已经做得很好了，别太苛责自己。", "我懂那种感觉，真的很难受。你现在最需要什么？", "行吧，先发泄一下，说出来总比憋着强。", "我在呢，继续说，没事的。", "你这个人就是太要强了，偶尔也要让自己喘口气嘛。"]
        case .family:
            ["听你说这些，我心里很担心你。你要照顾好自己啊。", "不管怎样，家里永远是你的港湾，有什么事情我们一起扛。", "你从小就懂事，但有时候也要学会放下，不是所有事都要你一个人扛。", "我知道你很努力，我们都看见了。你已经很好了。", "说吧，我听着呢。说出来心里会好受一些。", "别太勉强自己，身体是最重要的，其他的都可以慢慢来。"]
        case .selfPersona:
            ["我知道你很累。但你有没有想过，这种累是来自外部压力，还是来自内心的某种期待？", "如果是你最好的朋友说出这句话，你会怎么回应他？", "你一直在照顾别人的感受，但你自己的感受呢？", "这件事让你难受，是因为它触碰了你很在乎的什么？", "我在听，继续说。我不会评判你，因为我就是你。", "你比你以为的更坚强。但坚强不代表不能脆弱。"]
        }
    }
}

struct ChatMessage: Identifiable, Equatable, Codable {
    let id: UUID
    var role: String
    var text: String
    var createdAt: Date

    init(id: UUID = UUID(), role: String, text: String, createdAt: Date = Date()) {
        self.id = id
        self.role = role
        self.text = text
        self.createdAt = createdAt
    }
}

struct CBTCard {
    let id: Int
    let type: String
    let thought: String
    let reframe: String
    let action: String
}

enum MindWorkData {
    static let sceneTags = ["汇报", "熬夜", "咖啡因", "沟通", "截止日", "居家", "通勤", "饮食", "运动", "睡眠", "家人", "音乐"]

    static let moods: [Mood] = [
        Mood(id: 0, label: "很糟", score: 1, icon: "cloud.heavyrain.fill", desc: "今天很难熬", colors: [.hex("6B7DB8"), .hex("4A5898")], textColor: .white.opacity(0.95), subColor: .white.opacity(0.72)),
        Mood(id: 1, label: "低落", score: 2, icon: "cloud.rain.fill", desc: "有点提不起劲", colors: [.hex("7F98B0"), .hex("5D7890")], textColor: .white.opacity(0.95), subColor: .white.opacity(0.72)),
        Mood(id: 2, label: "疲惫", score: 3, icon: "wind", desc: "身心都有些累", colors: [.hex("7FADAC"), .hex("5D8B8A")], textColor: .white.opacity(0.95), subColor: .white.opacity(0.72)),
        Mood(id: 3, label: "平静", score: 4, icon: "leaf.fill", desc: "还好，平平淡淡", colors: [.hex("7BA890"), .hex("598670")], textColor: .white.opacity(0.95), subColor: .white.opacity(0.72)),
        Mood(id: 4, label: "还好", score: 5, icon: "sun.horizon.fill", desc: "感觉还不错", colors: [.hex("8EB48A"), .hex("6C926A")], textColor: .white.opacity(0.95), subColor: .white.opacity(0.72)),
        Mood(id: 5, label: "不错", score: 6, icon: "sun.max.fill", desc: "心情挺好的", colors: [.hex("AFBA7A"), .hex("8D985A")], textColor: .white.opacity(0.95), subColor: .white.opacity(0.72)),
        Mood(id: 6, label: "很好", score: 7, icon: "sparkles", desc: "今天状态很棒！", colors: [.hex("C4B46A"), .hex("A2924A")], textColor: .white.opacity(0.95), subColor: .white.opacity(0.72))
    ]

    static func cleanTag(_ tag: String) -> String {
        sceneTags.first { tag.contains($0) } ?? tag
    }

    static func tagIcon(for tag: String) -> String {
        if tag.contains("汇报") { return "chart.bar.doc.horizontal.fill" }
        if tag.contains("熬夜") { return "moon.stars.fill" }
        if tag.contains("咖啡因") { return "cup.and.saucer.fill" }
        if tag.contains("沟通") { return "bubble.left.and.bubble.right.fill" }
        if tag.contains("截止日") { return "calendar.badge.clock" }
        if tag.contains("居家") { return "house.fill" }
        if tag.contains("通勤") { return "tram.fill" }
        if tag.contains("饮食") { return "fork.knife" }
        if tag.contains("运动") { return "figure.run" }
        if tag.contains("睡眠") { return "bed.double.fill" }
        if tag.contains("家人") { return "person.3.fill" }
        if tag.contains("音乐") { return "music.note" }
        return "tag.fill"
    }

    static let pixelScores = [4,5,3,6,4,2,3,5,6,7,5,4,3,2,4,5,6,5,4,3,5,6,4,5,3,4,5,6,7,5]

    static let cbtCards: [CBTCard] = [
        CBTCard(id: 1, type: "灾难化思维", thought: "这下完了，大家都会觉得我不行", reframe: "一次被指出问题不等于整个人被否定。它更像是一条需要修正的信息。", action: "写下最坏结果、最好结果、最可能结果，各给一个发生概率。"),
        CBTCard(id: 2, type: "灾难化思维", thought: "如果这次汇报失败，我的职业生涯就毁了", reframe: "一次汇报会影响评价，但通常不会决定整个职业路径。职业发展由很多事件共同构成。", action: "列出过去一次失误后仍继续前进的经历。"),
        CBTCard(id: 3, type: "灾难化思维", thought: "领导没回复我，肯定是对我很失望", reframe: "没有回复可能有很多原因，失望只是其中一种假设，不是事实。", action: "写下至少 3 个其他可能解释。"),
        CBTCard(id: 4, type: "灾难化思维", thought: "我今天状态差，接下来肯定都会很糟", reframe: "今天状态差说明你正在消耗中，不代表未来几天都不可改变。", action: "把“接下来都会很糟”改写成一个更具体的担心。"),
        CBTCard(id: 5, type: "灾难化思维", thought: "我说错一句话，大家都会记住", reframe: "人们通常更关注自己的表现，一句话未必会被长久记住。", action: "问自己：一周后，这件事还会有多重要？"),
        CBTCard(id: 6, type: "灾难化思维", thought: "这件事没做好，后面一定会失控", reframe: "事情有风险，但“失控”需要更多证据。你可以先区分已发生和想象中的后果。", action: "画两栏：事实已经发生了什么？我想象会发生什么？"),
        CBTCard(id: 7, type: "灾难化思维", thought: "我撑不住了，所有事情都会压过来", reframe: "你现在感到被压住，说明压力很满；但压力可以被拆小，不一定同时发生。", action: "写下最压你的 3 件事，并圈出此刻最紧的一件。"),
        CBTCard(id: 8, type: "灾难化思维", thought: "我这次没表现好，机会就再也没有了", reframe: "机会可能受影响，但很少只有一次。一次表现不等于全部可能性关闭。", action: "找一个现实证据：过去有没有第二次机会出现过？"),
        CBTCard(id: 9, type: "灾难化思维", thought: "如果我拒绝别人，关系就完了", reframe: "健康关系通常能容纳边界。拒绝一件事不等于拒绝一个人。", action: "把“关系就完了”改成更温和的预测。"),
        CBTCard(id: 10, type: "灾难化思维", thought: "这次犯错会让所有人重新看低我", reframe: "别人对你的看法通常来自长期互动，不会只由一次错误决定。", action: "列出 2 个别人曾认可你的具体事实。"),

        CBTCard(id: 11, type: "非黑即白", thought: "做不到完美就是失败", reframe: "表现可以有很多层级，不只有完美和失败。完成、改进、稳定也都是有效结果。", action: "给今天的表现打 0-100 分，并写出不是 0 分的证据。"),
        CBTCard(id: 12, type: "非黑即白", thought: "我不是最优秀的，就没有价值", reframe: "价值不只来自排名，也来自投入、可靠、学习和连接。", action: "写下一个不靠排名也能说明你价值的事实。"),
        CBTCard(id: 13, type: "非黑即白", thought: "要么被认可，要么就是被否定", reframe: "别人可能同时看到优点和问题。反馈通常不是全盘肯定或全盘否定。", action: "把反馈拆成：被认可的部分、需要调整的部分。"),
        CBTCard(id: 14, type: "非黑即白", thought: "我今天效率低，所以我很差劲", reframe: "效率低是当天状态，不是人格结论。状态会受睡眠、压力和任务难度影响。", action: "写下今天影响效率的 2 个客观因素。"),
        CBTCard(id: 15, type: "非黑即白", thought: "只要有一点紧张，我就不适合这份工作", reframe: "紧张常出现在重视的事情前，不等于不适合。", action: "回忆一次你紧张但仍完成任务的经历。"),
        CBTCard(id: 16, type: "非黑即白", thought: "我不能有负面情绪", reframe: "负面情绪是信号，不是缺陷。它提示你可能需要休息、支持或边界。", action: "给当前情绪命名，并写下它在提醒你什么。"),
        CBTCard(id: 17, type: "非黑即白", thought: "这件事没做好，之前努力都白费了", reframe: "一次结果不会抹掉之前的积累。经验仍然留在你身上。", action: "列出这件事里你已经积累到的 3 个经验。"),
        CBTCard(id: 18, type: "非黑即白", thought: "我必须马上恢复，否则就是没用", reframe: "恢复有过程。慢一点不代表没用，只说明身心需要时间。", action: "把“马上恢复”改成一个今天可承受的小目标。"),
        CBTCard(id: 19, type: "非黑即白", thought: "别人不同意我，就是不尊重我", reframe: "不同意可能是观点差异，不一定等于不尊重。", action: "区分：对方不同意的是观点，还是在攻击你这个人？"),
        CBTCard(id: 20, type: "非黑即白", thought: "没有做到最好，就不值得休息", reframe: "休息不是奖励，而是维持功能的条件。未完成时也可以补充能量。", action: "写下休息 10 分钟可能帮助你的一个理由。"),

        CBTCard(id: 21, type: "读心术", thought: "他们肯定觉得我很笨", reframe: "你正在猜测别人想法，但还没有直接证据。猜测可以被看见，而不必当成事实。", action: "写下支持这个想法的证据和反对它的证据。"),
        CBTCard(id: 22, type: "读心术", thought: "同事没叫我吃饭，一定是不喜欢我", reframe: "没叫你可能有很多原因，不喜欢只是其中一种解释。", action: "列出 3 个与“不喜欢我”无关的解释。"),
        CBTCard(id: 23, type: "读心术", thought: "领导表情严肃，肯定对我有意见", reframe: "表情严肃可能来自疲惫、压力或会议内容，不必直接归因到你。", action: "把“肯定”换成“我担心可能”。感受会有什么变化？"),
        CBTCard(id: 24, type: "读心术", thought: "我一开口，别人就会嫌我烦", reframe: "你无法提前确定别人的反应。你的需求可以被表达，也可以被调整方式。", action: "想象朋友这样担心，你会怎么回应 TA？"),
        CBTCard(id: 25, type: "读心术", thought: "他们回复很冷淡，就是看不起我", reframe: "文字冷淡不一定代表轻视，也可能是匆忙或沟通习惯。", action: "给这条消息找一个中性解释。"),
        CBTCard(id: 26, type: "读心术", thought: "大家都知道我搞砸了", reframe: "你感到暴露和羞耻，但“大家都知道”需要证据。", action: "写下实际知道这件事的人，而不是想象中的所有人。"),
        CBTCard(id: 27, type: "读心术", thought: "客户迟迟不回，是对方案不满意", reframe: "客户不回可能与流程、优先级或时间有关。先把不确定留作不确定。", action: "把这件事标记为：事实、猜测、待确认。"),
        CBTCard(id: 28, type: "读心术", thought: "我提需求会让别人讨厌我", reframe: "提出需求不等于制造麻烦。方式温和时，关系仍可以被维护。", action: "写一句既表达需求又保留尊重的话。"),
        CBTCard(id: 29, type: "读心术", thought: "别人没夸我，就是觉得我做得一般", reframe: "没有表扬不等于否定。很多认可不会被明确说出来。", action: "找一条任务被接受或推进的客观证据。"),
        CBTCard(id: 30, type: "读心术", thought: "他看了我一眼，肯定在评价我", reframe: "被看见时紧张是正常的，但一个眼神不能说明完整评价。", action: "问自己：我有没有把注意力聚焦过度了？"),

        CBTCard(id: 31, type: "过度概括", thought: "我总是把事情搞砸", reframe: "“总是”通常会放大痛苦。你也有处理得可以、甚至不错的时候。", action: "写出一次你没有搞砸、或及时补救的经历。"),
        CBTCard(id: 32, type: "过度概括", thought: "我每次沟通都会失败", reframe: "沟通有顺利和不顺利的时刻。一次困难不代表每次都失败。", action: "找一个最近沟通还算清楚的例子。"),
        CBTCard(id: 33, type: "过度概括", thought: "我从来没有真正被认可过", reframe: "“从来没有”可能忽略了小的认可。认可有时不是夸奖，而是信任和交付。", action: "列出别人曾交给你负责的一件事。"),
        CBTCard(id: 34, type: "过度概括", thought: "只要开始忙，我就一定崩溃", reframe: "忙会增加压力，但你并非每次都崩溃。中间可能有可调整的环节。", action: "回想一次忙但撑过去的日子，你做了什么？"),
        CBTCard(id: 35, type: "过度概括", thought: "我不适合和人打交道", reframe: "某些互动困难，不等于所有人际互动都不适合你。", action: "写下一个相处起来不那么费力的人。"),
        CBTCard(id: 36, type: "过度概括", thought: "我永远改不了拖延", reframe: "拖延是行为模式，不是固定人格。模式可以被观察和微调。", action: "记录一次拖延前的情绪：怕什么、烦什么、累什么？"),
        CBTCard(id: 37, type: "过度概括", thought: "我每次休息都会耽误正事", reframe: "有些休息会帮助恢复效率，不是所有休息都会耽误事情。", action: "尝试定义一个有边界的休息：时长、结束点、回来做什么。"),
        CBTCard(id: 38, type: "过度概括", thought: "我一直都不够好", reframe: "“不够好”太笼统，可能把多个具体困难合成了整体否定。", action: "把“不够好”拆成一个最具体的可观察问题。"),
        CBTCard(id: 39, type: "过度概括", thought: "我遇到压力就没办法", reframe: "压力下变难是事实，但“没办法”会遮住你已经用过的应对方式。", action: "列出你过去用过的 2 个应对方式。"),
        CBTCard(id: 40, type: "过度概括", thought: "我做什么都会被挑毛病", reframe: "有些环境反馈严苛，但不等于所有事情都会被挑。", action: "写下最近一件没有被挑毛病、或顺利通过的事。"),

        CBTCard(id: 41, type: "应该化思维", thought: "我应该一直保持高效率", reframe: "人不是机器。效率会随睡眠、压力、任务和情绪波动。", action: "把“我应该”改成“我希望”，看看压力是否变化。"),
        CBTCard(id: 42, type: "应该化思维", thought: "我不应该因为这点事难过", reframe: "难过不需要被批准。事情大小和感受强度不总是成正比。", action: "允许自己写一句：我现在难过，是因为我在乎什么？"),
        CBTCard(id: 43, type: "应该化思维", thought: "我必须让所有人满意", reframe: "让所有人满意通常不可实现。你可以负责表达和边界，不能控制所有反应。", action: "写下这件事里你真正能负责的部分。"),
        CBTCard(id: 44, type: "应该化思维", thought: "我应该自己扛住，不能麻烦别人", reframe: "求助不等于无能。适度支持是人在压力中维持稳定的一部分。", action: "想一个低负担的求助方式，例如只请对方听 10 分钟。"),
        CBTCard(id: 45, type: "应该化思维", thought: "我必须马上想清楚未来", reframe: "迷茫时要求马上清楚，会让焦虑更重。清晰常常是逐步出现的。", action: "写下此刻最需要被看见的一个问题，而不是全部未来。"),
        CBTCard(id: 46, type: "应该化思维", thought: "我应该比现在更成熟", reframe: "成熟不是没有情绪，而是能慢慢理解和照顾情绪。", action: "问自己：如果更成熟一点，会怎样温和地对待现在的我？"),
        CBTCard(id: 47, type: "应该化思维", thought: "我应该随时在线，不能让别人等", reframe: "及时回应有价值，但持续在线会消耗边界。等待不一定等于失职。", action: "写一句可接受的回复边界：我会在什么时候处理。"),
        CBTCard(id: 48, type: "应该化思维", thought: "我必须一次就做对", reframe: "许多复杂任务需要试错。一次做对是期待，不是唯一合格标准。", action: "把任务分成初稿、修订、确认三个阶段。"),
        CBTCard(id: 49, type: "应该化思维", thought: "我应该控制住所有情绪", reframe: "情绪不能总被控制，但可以被识别、容纳和调节。", action: "给当前情绪打 0-10 分，只观察，不急着消灭它。"),
        CBTCard(id: 50, type: "应该化思维", thought: "我应该比别人更能吃苦", reframe: "承受力不是价值证明。感到累说明你在消耗，不说明你不够好。", action: "写下一个你已经承受很多的具体证据。"),

        CBTCard(id: 51, type: "个人化自责", thought: "团队没做好，都是我的问题", reframe: "团队结果通常由流程、资源、沟通和多人行为共同造成，不会只属于一个人。", action: "把责任分成：我的部分、他人的部分、环境的部分。"),
        CBTCard(id: 52, type: "个人化自责", thought: "别人心情不好，一定是我惹的", reframe: "别人的情绪可能有很多来源。你可以关心，但不必默认自己负责。", action: "问自己：我有什么证据说明这完全由我造成？"),
        CBTCard(id: 53, type: "个人化自责", thought: "客户不满意，说明我很差", reframe: "客户不满意可能指向方案、期待或沟通差距，不等于你这个人很差。", action: "把“我很差”改成“这个环节需要调整”。"),
        CBTCard(id: 54, type: "个人化自责", thought: "会议冷场是我的错", reframe: "会议氛围由多人共同参与。你可能贡献了一部分，但不是全部原因。", action: "列出会议中至少 2 个你无法控制的因素。"),
        CBTCard(id: 55, type: "个人化自责", thought: "朋友没回消息，是我说错了", reframe: "未回复不一定来自你。对方可能忙、累、忘记或不知道怎么回。", action: "把原因写成多选题，而不是单选题。"),
        CBTCard(id: 56, type: "个人化自责", thought: "项目延期就是我能力不行", reframe: "延期可能来自需求变化、排期、协作成本。能力只是众多因素之一。", action: "列出导致延期的所有因素，并标出你能影响的部分。"),
        CBTCard(id: 57, type: "个人化自责", thought: "我没让家人开心，是我不够好", reframe: "家人的情绪不完全由你负责。亲密关系里也需要边界。", action: "写下你已经付出的一件具体事情。"),
        CBTCard(id: 58, type: "个人化自责", thought: "新人没学会，是我教得太差", reframe: "学习效果受基础、时间、材料和练习影响，不只取决于你。", action: "区分：我讲过什么？对方练过什么？还缺什么？"),
        CBTCard(id: 59, type: "个人化自责", thought: "我休息导致进度慢，我很自私", reframe: "休息是维持工作能力的一部分，不等于自私。", action: "写下不休息可能带来的一个代价。"),
        CBTCard(id: 60, type: "个人化自责", thought: "只要别人不高兴，我就觉得是我没做好", reframe: "你对关系很敏感，但别人的不高兴不必自动归到你身上。", action: "练习一句内在提醒：这可能和我有关，也可能无关。"),

        CBTCard(id: 61, type: "情绪化推理", thought: "我感觉很失败，所以我就是失败者", reframe: "失败感是一种情绪，不是身份判决。情绪很真，但不总等于事实。", action: "写下“我感觉...”和“事实是...”两句话。"),
        CBTCard(id: 62, type: "情绪化推理", thought: "我很焦虑，说明一定会出事", reframe: "焦虑说明你感到威胁，不等于威胁一定会发生。", action: "把焦虑预测写出来，再标注证据强弱。"),
        CBTCard(id: 63, type: "情绪化推理", thought: "我很内疚，说明我做错了", reframe: "内疚可能来自责任感过强，不一定说明你真的有错。", action: "问自己：如果没有内疚，我会如何判断事实？"),
        CBTCard(id: 64, type: "情绪化推理", thought: "我很怕，所以我不能做", reframe: "害怕说明这件事重要或陌生，不自动意味着不能做。", action: "把“不能做”改成“我害怕的是哪一步？”"),
        CBTCard(id: 65, type: "情绪化推理", thought: "我很累，说明我太脆弱", reframe: "累是身体和心理的信号，不是脆弱证明。", action: "写下过去 24 小时你消耗了哪些能量。"),
        CBTCard(id: 66, type: "情绪化推理", thought: "我觉得别人讨厌我，所以他们一定讨厌我", reframe: "被讨厌的感觉很难受，但感觉需要证据来支持。", action: "找一个支持证据，再找一个反证。"),
        CBTCard(id: 67, type: "情绪化推理", thought: "我没有动力，说明这件事没意义", reframe: "动力会受疲惫和压力影响。没有动力不等于没有意义。", action: "写下这件事原本对你有一点意义的地方。"),
        CBTCard(id: 68, type: "情绪化推理", thought: "我现在很乱，说明我处理不了", reframe: "混乱常出现在事情还没被整理时，不等于你没有处理能力。", action: "只写下一个最需要澄清的问题。"),
        CBTCard(id: 69, type: "情绪化推理", thought: "我感到羞耻，说明我很丢人", reframe: "羞耻会把一个事件放大成对自我的否定。事件不等于你整个人。", action: "把“我很丢人”改写成“我对某件事感到羞耻”。"),
        CBTCard(id: 70, type: "情绪化推理", thought: "我心里没底，说明我肯定不行", reframe: "没底可能说明信息不足或经验不够，不代表结果已经失败。", action: "写下还缺的一个信息或一个可确认点。"),

        CBTCard(id: 71, type: "贬低积极", thought: "这次做好只是运气好", reframe: "运气可能有影响，但你的准备、判断和执行也在其中。", action: "写下这次成功里你做对的 2 个具体动作。"),
        CBTCard(id: 72, type: "贬低积极", thought: "别人夸我是客套", reframe: "也许有客套成分，但不必把所有认可都取消掉。", action: "把夸奖当作 50% 可信，看看你能接住哪一部分。"),
        CBTCard(id: 73, type: "贬低积极", thought: "这个任务本来就简单，不算我厉害", reframe: "任务简单也需要完成。稳定完成本身就是能力的一部分。", action: "记录完成它需要的一个能力。"),
        CBTCard(id: 74, type: "贬低积极", thought: "大家只是没发现我的问题", reframe: "你可能对缺点很敏感，但别人看到的优点也可能是真实的。", action: "写下别人可能看到的一个优点。"),
        CBTCard(id: 75, type: "贬低积极", thought: "我只是刚好没出错", reframe: "没出错也可能来自谨慎、经验和投入，而不只是刚好。", action: "找出你为了避免错误做过的一件事。"),
        CBTCard(id: 76, type: "贬低积极", thought: "这点进步不值一提", reframe: "进步小不代表没有价值。很多改变本来就是一点点累积。", action: "给这点进步命名：它说明我正在学会什么？"),
        CBTCard(id: 77, type: "贬低积极", thought: "我只是完成了本职工作，没什么可认可的", reframe: "本职工作也需要可靠和投入。被认可不一定只属于额外成就。", action: "写下今天一个可靠完成的细节。"),
        CBTCard(id: 78, type: "贬低积极", thought: "他们帮了我，所以成绩不算我的", reframe: "获得帮助不取消你的参与。协作成果里也有你的贡献。", action: "把贡献分成：别人帮了什么，我完成了什么。"),
        CBTCard(id: 79, type: "贬低积极", thought: "我只是看起来还行，实际很差", reframe: "你可能更相信内在不安，却忽略了外在表现也是真实信息。", action: "写下一个别人能客观看到的表现证据。"),
        CBTCard(id: 80, type: "贬低积极", thought: "这次被认可不代表什么", reframe: "一次认可不是全部，但也不是零。它可以作为一小块证据被保留。", action: "把这次认可记成一句具体事实。"),

        CBTCard(id: 81, type: "负面过滤", thought: "我只记得那个被批评的点", reframe: "大脑会优先抓住威胁信息，但完整情况可能不止这一点。", action: "写下今天 1 个问题、2 个还可以的地方。"),
        CBTCard(id: 82, type: "负面过滤", thought: "会议里唯一重要的是我卡壳了", reframe: "卡壳很显眼，但它不是会议的全部。你也可能表达了有用内容。", action: "回忆你在会议里说清楚的一句话。"),
        CBTCard(id: 83, type: "负面过滤", thought: "我只看到自己哪里没做好", reframe: "看到问题有助于改进，但只看问题会让自我评价失衡。", action: "每写一个问题，也配一个已完成的事实。"),
        CBTCard(id: 84, type: "负面过滤", thought: "今天全是坏事", reframe: "今天可能很难，但“全是”会让细小的中性或好事消失。", action: "找一个今天不算坏的 1 分钟片段。"),
        CBTCard(id: 85, type: "负面过滤", thought: "别人一句批评让我觉得所有努力都没意义", reframe: "批评会刺痛，但它不能代表全部努力的价值。", action: "写下这段努力已经带来的一个结果。"),
        CBTCard(id: 86, type: "负面过滤", thought: "我总盯着没完成的清单", reframe: "未完成很容易占据注意力，但已完成也是真实进展。", action: "在待办旁边补一列“已完成”。"),
        CBTCard(id: 87, type: "负面过滤", thought: "我脑子里只剩失败画面", reframe: "压力会重复播放失败画面，你可以把镜头稍微拉远一点。", action: "写下失败画面之外的一个事实画面。"),
        CBTCard(id: 88, type: "负面过滤", thought: "这周只有糟糕值得记住", reframe: "糟糕值得被看见，但它不必占据全部记忆。", action: "写下这周一个小小的稳定时刻。"),
        CBTCard(id: 89, type: "负面过滤", thought: "我只看见别人比我强", reframe: "比较会筛选掉自己的进展。别人强不等于你没有成长。", action: "和过去的自己比，写下一个变化。"),
        CBTCard(id: 90, type: "负面过滤", thought: "我一想到工作，只想到压力", reframe: "压力很真实，但工作里可能也有能力、关系或意义的片段。", action: "找一个让你没那么抗拒的工作片段。"),

        CBTCard(id: 91, type: "贴标签", thought: "我就是个废物", reframe: "这是痛苦里的标签，不是事实描述。一个人不能被一个标签概括。", action: "把标签改成具体行为：我在哪件事上遇到了困难？"),
        CBTCard(id: 92, type: "贴标签", thought: "我太玻璃心了", reframe: "敏感可能说明你很在意关系和评价，不等于脆弱无用。", action: "把“玻璃心”换成一个更准确的情绪词。"),
        CBTCard(id: 93, type: "贴标签", thought: "我就是懒", reframe: "拖延或停滞背后常有疲惫、害怕、混乱或抗拒，不只是懒。", action: "问自己：如果不是懒，可能是哪种困难？"),
        CBTCard(id: 94, type: "贴标签", thought: "我很没用", reframe: "没用是整体否定。你可能是在某个任务、某个阶段感到无力。", action: "把“我没用”改成“我现在在___上感到无力”。"),
        CBTCard(id: 95, type: "贴标签", thought: "我不适合职场", reframe: "职场压力很大，但不适合全部职场是很宽的结论。", action: "区分：不适应的是岗位、环境、节奏，还是某类互动？"),
        CBTCard(id: 96, type: "贴标签", thought: "我就是失败者", reframe: "失败者是身份标签，现实里只有具体事件的成败和学习。", action: "写下一个没有失败者标签的事实版本。"),
        CBTCard(id: 97, type: "贴标签", thought: "我太差劲了，不值得被喜欢", reframe: "值得被喜欢不是绩效考核。人的关系价值不只来自表现。", action: "写下一个你曾真诚对待别人的时刻。"),
        CBTCard(id: 98, type: "贴标签", thought: "我就是不自律", reframe: "自律会随环境和能量波动。你可能需要更小的起点，而不是更重的标签。", action: "把任务缩到 2 分钟内可以开始的一步。"),
        CBTCard(id: 99, type: "贴标签", thought: "我是个麻烦的人", reframe: "有需要不等于麻烦。每个人都会在某些时候需要支持。", action: "写下你的需求，而不是评价你这个人。"),
        CBTCard(id: 100, type: "贴标签", thought: "我太情绪化了", reframe: "情绪强烈说明你正在承受，不代表你不理性。", action: "先写情绪，再写事实，给两者各一个位置。"),

        CBTCard(id: 101, type: "控制谬误", thought: "我必须控制所有风险才安心", reframe: "完全控制通常做不到。安心也可以来自区分可控与不可控。", action: "画两圈：内圈写可控，外圈写不可控。"),
        CBTCard(id: 102, type: "控制谬误", thought: "别人怎么想我，我必须管住", reframe: "你能影响表达方式，但不能控制别人全部想法。", action: "写下我能影响的 1 件事，和我无法控制的 1 件事。"),
        CBTCard(id: 103, type: "控制谬误", thought: "如果结果不好，就是我没控制好", reframe: "结果常由多个变量共同决定。控制感过重会让你背上过多责任。", action: "列出这个结果中至少 3 个非个人因素。"),
        CBTCard(id: 104, type: "控制谬误", thought: "我必须让情绪立刻消失", reframe: "情绪不能被命令消失，但可以被陪伴着慢慢下降。", action: "给情绪 90 秒，只观察身体哪里最明显。"),
        CBTCard(id: 105, type: "控制谬误", thought: "我不掌控全局就会出问题", reframe: "掌控全局很耗能。部分信任和分工也是稳定的一部分。", action: "写下一个可以交给别人或稍后处理的部分。"),
        CBTCard(id: 106, type: "控制谬误", thought: "我必须提前想好所有情况", reframe: "准备有帮助，但穷尽所有情况会把你困住。", action: "只写下最可能的 2 种情况和各自应对。"),
        CBTCard(id: 107, type: "控制谬误", thought: "只要我足够努力，就不该出错", reframe: "努力会降低错误概率，但不能保证零错误。", action: "写下一句允许人会出错的现实提醒。"),
        CBTCard(id: 108, type: "控制谬误", thought: "我必须把所有人照顾好", reframe: "关心别人重要，但你不是所有人情绪和生活的负责人。", action: "写下今天你能照顾自己的一个小动作。"),
        CBTCard(id: 109, type: "控制谬误", thought: "计划一变，我就彻底乱了", reframe: "变化会带来不安，但不代表你没有重新整理的能力。", action: "写下变化后仍然不变的一个目标。"),
        CBTCard(id: 110, type: "控制谬误", thought: "我不能让任何人失望", reframe: "别人失望不一定说明你错了。有时边界会带来短暂失望。", action: "问自己：如果允许一点失望，我想守住什么？"),

        CBTCard(id: 111, type: "低挫折耐受", thought: "我受不了这种压力", reframe: "这压力确实很难受，但“受不了”可能是痛苦在说话，不是能力上限。", action: "把时间缩短：接下来 10 分钟，我能怎么陪自己撑过？"),
        CBTCard(id: 112, type: "低挫折耐受", thought: "这种不确定太难熬了", reframe: "不确定会消耗人。难熬是真的，但你可以先承受一小段，而不是全部未来。", action: "写下此刻最需要确认的一件事，其余先放下。"),
        CBTCard(id: 113, type: "低挫折耐受", thought: "我不能忍受别人误解我", reframe: "被误解很痛，但误解不一定能立刻消除。你可以先照顾被刺痛的感受。", action: "写一句：被误解时，我最难受的是___。"),
        CBTCard(id: 114, type: "低挫折耐受", thought: "我只要一被批评就崩", reframe: "批评会触发防御和羞耻，但这不等于你真的会崩掉。", action: "把批评分成内容和语气，只先看内容的一小部分。"),
        CBTCard(id: 115, type: "低挫折耐受", thought: "我等不了结果，太焦虑了", reframe: "等待会放大焦虑。焦虑想要确定性，但有些结果需要时间。", action: "设一个查看结果的时间点，其余时间先回到当前任务。"),
        CBTCard(id: 116, type: "低挫折耐受", thought: "我没法面对明天", reframe: "明天看起来很重，可能是因为你在一次性面对全部。", action: "只写明天醒来后的第一步，不写完整一天。"),
        CBTCard(id: 117, type: "低挫折耐受", thought: "我一点都不想处理这些事", reframe: "抗拒可能说明你已经很累，或任务让你感到威胁。", action: "问自己：我抗拒的是任务本身，还是开始时的感受？"),
        CBTCard(id: 118, type: "低挫折耐受", thought: "我再也不想沟通了", reframe: "你可能是被消耗到了，需要暂停，而不是永远不能沟通。", action: "写下一个恢复后再沟通的条件。"),
        CBTCard(id: 119, type: "低挫折耐受", thought: "这件事太烦了，我完全不想碰", reframe: "烦躁说明任务带来阻力。你可以先接触最小部分，而不是整件事。", action: "只做 3 分钟准备动作，例如打开文档或列标题。"),
        CBTCard(id: 120, type: "低挫折耐受", thought: "我现在什么都做不了", reframe: "你现在能量很低，可能做不了很多，但不等于什么都做不了。", action: "找一个低到不会失败的动作：喝水、坐直、写一句话。")
    ]

    static var cbtCard: CBTCard {
        cbtCards.first ?? CBTCard(id: 0, type: "认知重构", thought: "我现在被一个很重的想法压住了", reframe: "想法很有力量，但它仍然只是想法，不等于完整事实。", action: "写下这个想法，再写一个更温和、更具体的版本。")
    }

    static func randomCBTCard() -> CBTCard {
        cbtCards.randomElement() ?? cbtCard
    }

    static func cbtCard(id: Int?) -> CBTCard? {
        guard let id else { return nil }
        return cbtCards.first { $0.id == id }
    }

    static func cbtCard(type: String?) -> CBTCard? {
        guard let type else { return nil }
        return cbtCards.first { $0.type == type }
    }

    static func cbtCard(for tags: [String], moodIdx: Int) -> CBTCard {
        let matchedTypes = cbtTypes(for: tags, moodIdx: moodIdx)
        guard !matchedTypes.isEmpty else { return randomCBTCard() }
        let candidates = cbtCards.filter { matchedTypes.contains($0.type) }
        return candidates.randomElement() ?? randomCBTCard()
    }

    private static func cbtTypes(for tags: [String], moodIdx: Int) -> [String] {
        guard !tags.isEmpty else { return [] }
        var types: [String] = []

        for tag in tags {
            if tag.contains("汇报") {
                types += ["灾难化思维", "读心术", "负面过滤", "非黑即白"]
            } else if tag.contains("熬夜") || tag.contains("睡眠") {
                types += ["情绪化推理", "低挫折耐受", "负面过滤"]
            } else if tag.contains("咖啡因") {
                types += ["情绪化推理", "低挫折耐受"]
            } else if tag.contains("沟通") {
                types += ["读心术", "个人化自责", "应该化思维"]
            } else if tag.contains("截止日") {
                types += ["灾难化思维", "应该化思维", "控制谬误", "低挫折耐受"]
            } else if tag.contains("居家") {
                types += ["负面过滤", "贴标签", "过度概括"]
            } else if tag.contains("通勤") {
                types += ["低挫折耐受", "负面过滤"]
            } else if tag.contains("饮食") {
                types += ["应该化思维", "贴标签", "情绪化推理"]
            } else if tag.contains("运动") {
                types += ["贬低积极", "非黑即白"]
            } else if tag.contains("家人") {
                types += ["个人化自责", "应该化思维", "读心术"]
            } else if tag.contains("音乐") {
                types += ["贬低积极", "负面过滤"]
            }
        }

        if moodIdx <= 1 {
            types += ["灾难化思维", "低挫折耐受", "贴标签"]
        } else if moodIdx == 2 {
            types += ["情绪化推理", "负面过滤"]
        }

        return Array(NSOrderedSet(array: types)) as? [String] ?? types
    }
}
