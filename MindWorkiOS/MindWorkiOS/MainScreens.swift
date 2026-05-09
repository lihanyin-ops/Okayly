import SwiftUI

struct HomeScreen: View {
    @EnvironmentObject private var store: AppStore
    let forceEmpty: Bool

    private var todayMood: Mood? {
        guard !forceEmpty, let idx = store.todayMoodIdx else { return nil }
        return MindWorkData.moods[idx]
    }

    var body: some View {
        ZStack(alignment: .bottom) {
            background.ignoresSafeArea()
            GrainOverlay(opacity: 0.4).ignoresSafeArea()
            VStack(spacing: 0) {
                AppStatusBar()
                ScrollView(showsIndicators: false) {
                    VStack(spacing: 16) {
                        titleRow
                        if !forceEmpty, store.consecutiveLowDays >= 3, let idx = store.todayMoodIdx, idx <= 1 {
                            crisisBanner
                        }
                        moodCard
                        weekMoodCard
                        if !store.meds.isEmpty {
                            medsReminderCard
                        }
                    }
                    .padding(.horizontal, 20)
                    .padding(.top, 8)
                    .padding(.bottom, 104)
                }
            }
        }
    }

    private var background: some View {
        if let todayMood {
            LinearGradient(colors: [todayMood.colors.first ?? .mwBackground, .mwBackground], startPoint: .topLeading, endPoint: .bottomTrailing)
        } else {
            LinearGradient.morandi
        }
    }

    private var titleRow: some View {
        HStack {
            VStack(alignment: .leading, spacing: 4) {
                Text(Date().formatted(.dateTime.month(.wide).day().weekday(.wide)))
                    .font(.serif(25, weight: .semibold))
                    .foregroundStyle(Color.mwText)
            }
            Spacer()
            Button { store.navigate(.aiChat) } label: {
                SoftIcon(system: "bubble.left.and.bubble.right.fill", size: 17, color: Color.mwIcon)
                    .frame(width: 38, height: 38)
                    .background(.white.opacity(0.48), in: Circle())
                    .overlay(Circle().stroke(.white.opacity(0.55), lineWidth: 1))
            }
            .buttonStyle(.plain)
        }
    }

    private var crisisBanner: some View {
        Button { store.navigate(.crisis) } label: {
            HStack(spacing: 12) {
                SoftIcon(system: "hands.sparkles.fill", size: 20, color: .white.opacity(0.92), frame: 26)
                VStack(alignment: .leading, spacing: 3) {
                    Text("你今天很不容易")
                        .font(.sans(12, weight: .semibold))
                    Text("点击查看支持资源和求助热线")
                        .font(.sans(10))
                        .opacity(0.78)
                }
                Spacer()
                Image(systemName: "chevron.right").font(.system(size: 12, weight: .semibold))
            }
            .foregroundStyle(.white)
            .padding(14)
            .background(LinearGradient(colors: [.hex("84A8BE"), .hex("5F9AA0")], startPoint: .leading, endPoint: .trailing), in: RoundedRectangle(cornerRadius: 20))
        }
        .buttonStyle(.plain)
    }

    @ViewBuilder
    private var moodCard: some View {
        if let todayMood {
            Button { store.navigate(.checkin) } label: {
                ZStack(alignment: .topLeading) {
                    MoodGradient(mood: todayMood)
                    GrainOverlay(opacity: 0.25)
                    VStack(alignment: .leading, spacing: 18) {
                        HStack {
                            Text("今天的心情")
                                .font(.sans(12, weight: .medium))
                                .foregroundStyle(.white.opacity(0.78))
                            Spacer()
                            Text("+ 再记一次")
                                .font(.sans(12, weight: .medium))
                                .padding(.horizontal, 12)
                                .padding(.vertical, 7)
                                .background(.white.opacity(0.22), in: Capsule())
                                .overlay(Capsule().stroke(.white.opacity(0.3), lineWidth: 1))
                        }
                        HStack(spacing: 18) {
                            Image(systemName: todayMood.icon)
                                .font(.system(size: 52, weight: .semibold))
                                .symbolRenderingMode(.hierarchical)
                                .foregroundStyle(.white.opacity(0.95))
                            VStack(alignment: .leading, spacing: 7) {
                                Text(L10n.t(todayMood.label)).font(.serif(32, weight: .bold))
                                Text(L10n.t(todayMood.desc)).font(.sans(14))
                                Text("今天已打卡 · 点击再记一次").font(.sans(12, weight: .medium)).opacity(0.68)
                            }
                            .foregroundStyle(.white.opacity(0.95))
                        }
                    }
                    .padding(20)
                }
                .frame(minHeight: 180)
                .clipShape(RoundedRectangle(cornerRadius: 28, style: .continuous))
            }
            .buttonStyle(.plain)
        } else {
            Button { store.navigate(.checkin) } label: {
                VStack(spacing: 12) {
                    SoftIcon(system: "leaf.fill", size: 44, color: Color.mwIcon)
                    VStack(spacing: 4) {
                        Text("今天，你感觉怎么样？")
                            .font(.serif(17))
                            .foregroundStyle(Color.mwText)
                        Text("点击开始今天的打卡")
                            .font(.sans(12))
                            .foregroundStyle(Color.mwMuted)
                    }
                    Text("记录心情")
                        .font(.sans(14, weight: .semibold))
                        .foregroundStyle(.white)
                        .padding(.horizontal, 26)
                        .padding(.vertical, 10)
                        .background(Color.mwPrimary, in: RoundedRectangle(cornerRadius: 16))
                }
                .frame(maxWidth: .infinity)
                .padding(.vertical, 24)
                .background(LinearGradient(colors: [.hex("DFEEE8"), .hex("CFE3D8")], startPoint: .topLeading, endPoint: .bottomTrailing), in: RoundedRectangle(cornerRadius: 28))
                .overlay(RoundedRectangle(cornerRadius: 28).stroke(Color.mwPrimary.opacity(0.28), style: StrokeStyle(lineWidth: 2, dash: [6, 5])))
            }
            .buttonStyle(.plain)
        }
    }

    private var weekMoodCard: some View {
        SectionCard {
            VStack(spacing: 12) {
                HStack {
                    Text("本周情绪").font(.sans(13, weight: .semibold)).foregroundStyle(Color.mwText)
                    Spacer()
                    Button("查看统计 →") { store.navigate(.stats) }
                        .font(.sans(10))
                        .foregroundStyle(Color.mwPrimary)
                }
                HStack(spacing: 8) {
                    let days = ["一", "二", "三", "四", "五", "六", "日"]
                    let weekday = Calendar.current.component(.weekday, from: Date())
                    let todayIndex = weekday == 1 ? 6 : weekday - 2
                    ForEach(0..<7, id: \.self) { index in
                        VStack(spacing: 6) {
                            RoundedRectangle(cornerRadius: 8, style: .continuous)
                                .fill(weekFill(index: index, todayIndex: todayIndex))
                                .overlay {
                                    if index > todayIndex || (forceEmpty && index == todayIndex) {
                                        RoundedRectangle(cornerRadius: 8).stroke(Color.hex("C8D7D0"), style: StrokeStyle(lineWidth: 1.4, dash: [4, 3]))
                                    }
                                }
                                .aspectRatio(1, contentMode: .fit)
                            Text(index == todayIndex ? L10n.t("今天") : "\(L10n.t("周"))\(L10n.t(days[index]))")
                                .font(.sans(9, weight: index == todayIndex ? .semibold : .regular))
                                .foregroundStyle(index == todayIndex ? Color.mwPrimary : Color.mwMuted)
                        }
                    }
                }
            }
        }
    }

    private func weekFill(index: Int, todayIndex: Int) -> Color {
        if forceEmpty { return Color.hex("F0F6F2").opacity(0.7) }
        if let moodIdx = store.weekMoods[index] {
            return MindWorkData.moods[moodIdx].colors.first ?? .mwSoft
        }
        return Color.hex("F0F6F2").opacity(index > todayIndex ? 0.55 : 0.8)
    }

    private var medsReminderCard: some View {
        Button { store.navigate(.meds) } label: {
            HStack(spacing: 12) {
                SoftIconBadge(system: "pills.fill", size: 20)
                VStack(alignment: .leading, spacing: 4) {
                    Text("今日用药提醒").font(.sans(14, weight: .semibold)).foregroundStyle(Color.mwText)
                    let med = store.meds.first
                    Text("\(med?.name ?? "舍曲林") · 下次 \(med?.times.first ?? "21:00")")
                        .font(.sans(12))
                        .foregroundStyle(Color.mwMuted)
                }
                Spacer()
                HStack(spacing: 5) {
                    Circle().fill(Color.mwPrimary).frame(width: 8, height: 8)
                    Text("待服").font(.sans(12)).foregroundStyle(Color.mwPrimary)
                    Image(systemName: "chevron.right").font(.system(size: 11))
                }
            }
            .padding(16)
            .glassCard(radius: 20)
        }
        .buttonStyle(.plain)
    }
}

struct CheckinScreen: View {
    @EnvironmentObject private var store: AppStore
    @State private var step: Step = .mood
    @State private var selectedMood = 3
    @State private var selectedTags: [String] = []
    @State private var note = ""

    enum Step { case mood, detail }

    var body: some View {
        if step == .mood {
            ZStack(alignment: .topLeading) {
                FullScreenMoodPicker(title: "现在，你感觉怎么样？", subtitle: "左右滑动 · 选择你的心情", bottomContentPadding: 112) { index in
                    selectedMood = index
                    withAnimation(.spring(response: 0.34, dampingFraction: 0.86)) {
                        step = .detail
                    }
                }
                Button { store.navigate(.home) } label: {
                    Image(systemName: "chevron.left")
                        .foregroundStyle(.white)
                        .frame(width: 38, height: 38)
                        .background(.white.opacity(0.24), in: Circle())
                }
                .padding(.top, 52)
                .padding(.leading, 20)
            }
        } else {
            detailView
        }
    }

    private var detailView: some View {
        let mood = MindWorkData.moods[selectedMood]
        return ZStack {
            Color.mwBackground.ignoresSafeArea()
            GrainOverlay(opacity: 0.3).ignoresSafeArea()
            VStack(spacing: 0) {
                AppStatusBar()
                HeaderBar("\(L10n.t("心情"))：\(L10n.t(mood.label))", subtitle: "\(L10n.t("今天已打卡")) 1 \(L10n.t("次")) · \(L10n.t("点击返回修改"))") {
                    step = .mood
                }
                ScrollView(showsIndicators: false) {
                    VStack(alignment: .leading, spacing: 20) {
                        HStack(spacing: 12) {
                            Image(systemName: mood.icon)
                                .font(.system(size: 31, weight: .semibold))
                                .symbolRenderingMode(.hierarchical)
                                .foregroundStyle(mood.textColor)
                            VStack(alignment: .leading, spacing: 3) {
                                Text("\(L10n.t(mood.label)) · \(L10n.t(mood.desc))").font(.sans(14, weight: .semibold)).foregroundStyle(mood.textColor)
                                Text("\(L10n.t("评分")) \(mood.score)/7").font(.sans(12)).foregroundStyle(mood.subColor)
                            }
                            Spacer()
                        }
                        .padding(14)
                        .background {
                            MoodGradient(mood: mood)
                                .clipShape(RoundedRectangle(cornerRadius: 20, style: .continuous))
                        }

                        VStack(alignment: .leading, spacing: 12) {
                            Text("发生了什么？（可多选）").font(.sans(14, weight: .semibold)).foregroundStyle(Color.mwText)
                            FlowLayout(spacing: 8, rowSpacing: 8) {
                                ForEach(MindWorkData.sceneTags, id: \.self) { tag in
                                    Button {
                                        if selectedTags.contains(tag) {
                                            selectedTags.removeAll { $0 == tag }
                                        } else {
                                            selectedTags.append(tag)
                                        }
                                    } label: {
                                        TagPill(tag: tag, selected: selectedTags.contains(tag))
                                    }
                                    .buttonStyle(.plain)
                                }
                            }
                        }

                        VStack(alignment: .leading, spacing: 8) {
                            Text("想说点什么？（可选）").font(.sans(14, weight: .semibold)).foregroundStyle(Color.mwText)
                            TextEditor(text: $note)
                                .font(.sans(14))
                                .foregroundStyle(Color.mwText)
                                .scrollContentBackground(.hidden)
                                .frame(minHeight: 112)
                                .padding(10)
                                .glassCard(radius: 18)
                                .overlay(alignment: .topLeading) {
                                    if note.isEmpty {
                                        Text("今天的感受、发生的事……")
                                            .font(.sans(14))
                                            .foregroundStyle(Color.mwMuted.opacity(0.7))
                                            .padding(.horizontal, 15)
                                            .padding(.vertical, 18)
                                            .allowsHitTesting(false)
                                    }
                                }
                        }

                        Button("完成打卡") {
                            store.completeCheckin(moodIdx: selectedMood, tags: selectedTags, note: note)
                        }
                        .primaryButtonStyle()
                        Text("今天可以随时再打卡，记录不同时刻的心情")
                            .font(.sans(12))
                            .foregroundStyle(Color.mwMuted)
                            .frame(maxWidth: .infinity)
                    }
                    .padding(.horizontal, 20)
                    .padding(.bottom, 30)
                }
            }
        }
    }
}

struct CheckinDoneScreen: View {
    @EnvironmentObject private var store: AppStore

    var body: some View {
        ZStack {
            LinearGradient.morandi.ignoresSafeArea()
            GrainOverlay(opacity: 0.45).ignoresSafeArea()
            VStack(spacing: 20) {
                Image(systemName: "checkmark")
                    .font(.system(size: 42, weight: .bold))
                    .foregroundStyle(.white)
                    .frame(width: 96, height: 96)
                    .background(MindWorkData.moods[3].colors.first ?? Color.mwPrimary, in: Circle())
                    .shadow(color: Color.mwPrimary.opacity(0.4), radius: 25)
                Text("打卡成功")
                    .font(.serif(22))
                    .foregroundStyle(Color.mwText)
                Text("\(L10n.t("今天已打卡")) \(store.journalData.first?.count ?? 1) \(L10n.t("次"))\n\(L10n.t("每一次记录，都是对自己的关注"))")
                    .font(.sans(14))
                    .multilineTextAlignment(.center)
                    .foregroundStyle(Color.mwPrimaryDark)
                    .lineSpacing(5)
                SectionCard {
                    VStack(alignment: .leading, spacing: 6) {
                        HStack(spacing: 6) {
                            SoftIcon(system: "lightbulb.fill", size: 12, color: Color.mwPrimary)
                            Text("今日洞察").font(.sans(12, weight: .medium)).foregroundStyle(Color.mwPrimary)
                        }
                        Text(store.latestCheckinInsight)
                            .font(.sans(14))
                            .foregroundStyle(Color.mwText)
                            .lineSpacing(4)
                    }
                }
                Button("返回首页") { store.navigate(.home) }
                    .primaryButtonStyle()
            }
            .padding(.horizontal, 34)
        }
    }
}

struct CheckinDoneLowScreen: View {
    @EnvironmentObject private var store: AppStore
    @State private var showCBT = false
    @State private var card = MindWorkData.cbtCard

    var body: some View {
        if showCBT {
            ZStack {
                LinearGradient.warm.ignoresSafeArea()
                GrainOverlay(opacity: 0.35).ignoresSafeArea()
                VStack(spacing: 0) {
                    AppStatusBar()
                    HeaderBar(card.type, subtitle: "认知行为干预") {
                        showCBT = false
                    }
                    ScrollView {
                        VStack(spacing: 14) {
                            interventionCard("你可能在想", icon: "bubble.left.fill", text: "“\(card.thought)”", tint: .white.opacity(0.78))
                            interventionCard("换个角度看", icon: "leaf.fill", text: card.reframe, tint: Color.hex("DCEDE5"))
                            interventionCard("试试这个", icon: "pencil", text: card.action, tint: Color.hex("F0EBCF").opacity(0.65))
                            Text("这张卡片对你有帮助吗？")
                                .font(.sans(12))
                                .foregroundStyle(Color.mwMuted)
                                .padding(.top, 8)
                            HStack(spacing: 12) {
                                Button {
                                    store.recordCBTFeedback("没什么感觉")
                                    store.navigate(.home)
                                } label: {
                                    Label("没什么感觉", systemImage: "circle")
                                }
                                    .font(.sans(14, weight: .medium))
                                    .foregroundStyle(Color.mwText)
                                    .frame(maxWidth: .infinity)
                                    .padding(.vertical, 13)
                                    .background(Color.hex("E1ECE6"), in: RoundedRectangle(cornerRadius: 18))
                                Button {
                                    store.recordCBTFeedback("有些帮助")
                                    store.navigate(.home)
                                } label: {
                                    Label("有些帮助", systemImage: "leaf.fill")
                                }
                                    .font(.sans(14, weight: .medium))
                                    .foregroundStyle(.white)
                                    .frame(maxWidth: .infinity)
                                    .padding(.vertical, 13)
                                    .background(Color.mwPrimary, in: RoundedRectangle(cornerRadius: 18))
                            }
                        }
                        .padding(.horizontal, 22)
                        .padding(.bottom, 30)
                    }
                }
            }
        } else {
            ZStack {
                LinearGradient(colors: [.hex("8FB9C2"), .hex("75A3B0")], startPoint: .topLeading, endPoint: .bottomTrailing).ignoresSafeArea()
                GrainOverlay(opacity: 0.45).ignoresSafeArea()
                VStack(spacing: 20) {
                    Image(systemName: "cloud.rain.fill")
                        .font(.system(size: 42, weight: .semibold))
                        .symbolRenderingMode(.hierarchical)
                        .foregroundStyle(.white.opacity(0.94))
                        .frame(width: 86, height: 86)
                        .background(.white.opacity(0.25), in: Circle())
                        .overlay(Circle().stroke(.white.opacity(0.4), lineWidth: 2))
                    Text("今天有些难熬")
                        .font(.serif(22))
                        .foregroundStyle(.white)
                    Text("谢谢你愿意记录下来。\n有一个小练习，也许能帮到你。")
                        .font(.sans(14))
                        .multilineTextAlignment(.center)
                        .lineSpacing(5)
                        .foregroundStyle(.white.opacity(0.82))
                    Button("试试认知干预练习 →") {
                        showCBT = true
                    }
                    .font(.sans(16, weight: .semibold))
                    .foregroundStyle(.white)
                    .frame(maxWidth: .infinity)
                    .padding(.vertical, 15)
                    .background(.white.opacity(0.24), in: RoundedRectangle(cornerRadius: 18))
                    .overlay(RoundedRectangle(cornerRadius: 18).stroke(.white.opacity(0.5), lineWidth: 1.5))
                    Button("现在不需要，回首页") { store.navigate(.home) }
                        .font(.sans(14))
                        .foregroundStyle(.white.opacity(0.72))
                }
                .padding(.horizontal, 32)
            }
            .onAppear {
                card = store.lastTriggeredCBTCard ?? MindWorkData.randomCBTCard()
            }
        }
    }

    private func interventionCard(_ title: String, icon: String, text: String, tint: Color) -> some View {
        VStack(alignment: .leading, spacing: 9) {
            HStack(spacing: 6) {
                SoftIcon(system: icon, size: 12, color: Color.mwIcon)
                Text(title).font(.sans(12, weight: .semibold)).foregroundStyle(Color.mwPrimaryDark)
            }
            Text(text).font(.sans(14)).foregroundStyle(Color.mwText).lineSpacing(4)
        }
        .frame(maxWidth: .infinity, alignment: .leading)
        .padding(16)
        .background(tint, in: RoundedRectangle(cornerRadius: 20))
        .overlay(RoundedRectangle(cornerRadius: 20).stroke(.white.opacity(0.45), lineWidth: 1))
    }
}

struct PersonaSelectScreen: View {
    @EnvironmentObject private var store: AppStore

    var body: some View {
        ZStack {
            Color.mwBackground.ignoresSafeArea()
            GrainOverlay(opacity: 0.3).ignoresSafeArea()
            VStack(spacing: 0) {
                AppStatusBar()
                HeaderBar("选择倾诉对象", subtitle: "选择一个人设，开始你的情绪对话") {
                    store.navigate(store.aiPersona == nil ? .home : .aiChat)
                }
                ScrollView {
                    VStack(spacing: 12) {
                        ForEach(Persona.allCases) { persona in
                            Button {
                                store.selectPersona(persona)
                                store.navigate(.aiChat)
                            } label: {
                                personaRow(persona)
                            }
                            .buttonStyle(.plain)
                        }
                        Text("人设仅影响对话风格，不构成专业心理咨询")
                            .font(.sans(12))
                            .foregroundStyle(Color.mwMuted)
                            .padding(.top, 10)
                    }
                    .padding(.horizontal, 20)
                    .padding(.bottom, 30)
                }
            }
        }
    }

    private func personaRow(_ persona: Persona) -> some View {
        let selected = store.aiPersona == persona
        return HStack(spacing: 14) {
            SoftIconBadge(system: persona.icon, size: 22, side: 50, foreground: selected ? .white : Color.mwIcon, background: selected ? .white.opacity(0.2) : Color.hex("DCEBE5"), cornerRadius: 18)
            VStack(alignment: .leading, spacing: 4) {
                Text(L10n.t(persona.label)).font(.sans(15, weight: .semibold))
                Text(L10n.t(persona.desc)).font(.sans(12))
                Text("“\(persona.greeting.prefix(34))…”").font(.sans(11)).opacity(0.75).lineLimit(2)
            }
            Spacer()
            if selected { Image(systemName: "checkmark.circle.fill") }
        }
        .foregroundStyle(selected ? .white : Color.mwText)
        .padding(16)
        .background(selected ? Color.mwPrimary : .white.opacity(0.78), in: RoundedRectangle(cornerRadius: 22))
        .overlay(RoundedRectangle(cornerRadius: 22).stroke(selected ? .clear : Color.hex("D8E4DD"), lineWidth: 1))
    }
}

struct AIChatScreen: View {
    @EnvironmentObject private var store: AppStore
    @State private var input = ""
    @State private var isSending = false
    @State private var errorMessage: String?

    private var persona: Persona { store.aiPersona ?? .counselor }
    private var messages: [ChatMessage] { store.chatHistory(for: persona) }
    private var userMessageCount: Int { store.todayAIUserMessageCount }

    var body: some View {
        ZStack(alignment: .bottom) {
            Color.mwBackground.ignoresSafeArea()
            GrainOverlay(opacity: 0.3).ignoresSafeArea()
            VStack(spacing: 0) {
                AppStatusBar()
                chatHeader
                ScrollViewReader { proxy in
                    ScrollView {
                        VStack(spacing: 12) {
                            ForEach(messages) { message in
                                messageBubble(message)
                                    .id(message.id)
                            }
                            if isSending {
                                HStack {
                                    SoftIcon(system: "leaf.fill", size: 12, color: .white)
                                        .frame(width: 28, height: 28)
                                        .background(Color.hex("A7C8B5"), in: Circle())
                                    Text("正在认真读你的话……")
                                        .font(.sans(13))
                                        .foregroundStyle(Color.mwMuted)
                                        .padding(.horizontal, 14)
                                        .padding(.vertical, 11)
                                        .background(.white.opacity(0.82), in: RoundedRectangle(cornerRadius: 18))
                                    Spacer(minLength: 60)
                                }
                            }
                            if let errorMessage {
                                Text(errorMessage)
                                    .font(.sans(12))
                                    .foregroundStyle(Color.mwDanger)
                                    .frame(maxWidth: .infinity, alignment: .leading)
                            }
                        }
                        .padding(.horizontal, 16)
                        .padding(.top, 14)
                        .padding(.bottom, scrollBottomPadding)
                    }
                    .onChange(of: messages.count) {
                        if let last = messages.last {
                            withAnimation { proxy.scrollTo(last.id, anchor: .bottom) }
                        }
                    }
                }
            }
            inputBar
                .padding(.bottom, store.activeMainTab == .ai ? 80 : 0)
            if !store.isPaid && userMessageCount >= 5 {
                FrostedPaywall(title: "解锁 AI 树洞无限对话", desc: "今日免费次数已用完。升级后可无限倾诉，AI 会记住你的情绪历史，给出更贴心的回应。", features: ["无限次 AI 对话", "情绪历史记忆", "每次对话自动生成日记摘要", "专属情绪洞察报告"]) {
                    store.navigate(.subscribe)
                }
            }
        }
        .onAppear {
            store.ensureChatStarted()
        }
    }

    private var chatHeader: some View {
        HStack(spacing: 12) {
            CircleIconButton(system: "chevron.left") { store.navigate(.home) }
            SoftIcon(system: persona.icon, size: 18, color: Color.mwIcon)
                .frame(width: 40, height: 40)
                .background(LinearGradient.morandi, in: Circle())
            VStack(alignment: .leading, spacing: 3) {
                Text("\(L10n.t("情绪树洞")) · \(L10n.t(persona.label))").font(.sans(14, weight: .semibold)).foregroundStyle(Color.mwText)
                Text(store.isPaid ? "\(L10n.t("无限对话")) · \(L10n.t(persona.style))" : "\(L10n.t("今日剩余")) \(max(0, 5 - userMessageCount)) \(L10n.t("次")) · \(L10n.t(persona.style))").font(.sans(11)).foregroundStyle(Color.mwMuted)
            }
            Spacer()
            Button("换人设") { store.navigate(.aiPersona) }
                .font(.sans(12, weight: .medium))
                .foregroundStyle(Color.mwPrimaryDark)
                .padding(.horizontal, 12)
                .padding(.vertical, 7)
                .background(Color.hex("E0EBE5"), in: Capsule())
        }
        .padding(.horizontal, 20)
        .padding(.vertical, 10)
        .background(.ultraThinMaterial)
    }

    private var inputBar: some View {
        VStack(spacing: 10) {
            if !store.isPaid && userMessageCount == 4 {
                HStack {
                    Text("今天还剩 1 次对话 ·")
                    Button("解锁无限对话") { store.navigate(.subscribe) }
                        .fontWeight(.semibold)
                }
                .font(.sans(12))
                .foregroundStyle(Color.mwPrimaryDark)
                .padding(.vertical, 8)
                .frame(maxWidth: .infinity)
                .background(Color.hex("DCEBE5"), in: RoundedRectangle(cornerRadius: 14))
            }
            HStack(spacing: 10) {
                TextField("说说你的感受……", text: $input)
                    .font(.sans(14))
                    .padding(.horizontal, 14)
                    .frame(height: 46)
                    .background(Color.hex("E5EFE9"), in: RoundedRectangle(cornerRadius: 17))
                Button(action: sendMessage) {
                    Image(systemName: "paperplane.fill")
                        .foregroundStyle(.white)
                        .frame(width: 46, height: 46)
                        .background(isSending ? Color.hex("A9BCB1") : Color.mwPrimary, in: RoundedRectangle(cornerRadius: 17))
                }
                .disabled(isSending)
            }
            Text("仅供情绪状态参考，不能替代临床诊断")
                .font(.sans(10))
                .foregroundStyle(Color.mwMuted.opacity(0.78))
                .frame(maxWidth: .infinity, alignment: .leading)
        }
        .padding(.horizontal, 16)
        .padding(.top, 12)
        .padding(.bottom, 10)
        .background(.ultraThinMaterial)
    }

    private var scrollBottomPadding: CGFloat {
        let normalReserve: CGFloat = store.activeMainTab == .ai ? 164 : 84
        let warningReserve: CGFloat = !store.isPaid && userMessageCount == 4 ? 50 : 0
        return normalReserve + warningReserve
    }

    private func sendMessage() {
        let trimmed = input.trimmingCharacters(in: .whitespacesAndNewlines)
        guard !trimmed.isEmpty, !isSending, store.isPaid || userMessageCount < 5 else { return }
        let activePersona = persona
        input = ""
        errorMessage = nil
        store.appendChatMessage(ChatMessage(role: "user", text: trimmed), for: activePersona)
        store.hasChatted = true

        if store.containsCrisisSignal(trimmed) {
            store.appendChatMessage(ChatMessage(role: "ai", text: "听起来你现在可能很危险。我们先把安全放在第一位，可以立刻联系身边的人或紧急支持吗？"), for: activePersona)
            DispatchQueue.main.asyncAfter(deadline: .now() + 0.45) {
                store.navigate(.crisis)
            }
            return
        }

        isSending = true

        Task {
            do {
                let reply = try await AIService.shared.chatReply(
                    persona: activePersona,
                    history: store.chatHistory(for: activePersona),
                    recentEmotionContext: store.recentEmotionContext()
                )
                store.appendChatMessage(ChatMessage(role: "ai", text: reply), for: activePersona)
            } catch {
                errorMessage = "AI 回复失败：\(error.localizedDescription)"
            }
            isSending = false
        }
    }

    private func messageBubble(_ message: ChatMessage) -> some View {
        HStack(alignment: .top, spacing: 8) {
            if message.role == "user" { Spacer(minLength: 60) }
            if message.role == "ai" {
                SoftIcon(system: "leaf.fill", size: 12, color: .white)
                    .frame(width: 28, height: 28)
                    .background(Color.hex("A7C8B5"), in: Circle())
            }
            Text(message.text)
                .font(.sans(14))
                .lineSpacing(4)
                .foregroundStyle(message.role == "user" ? .white : Color.mwText)
                .padding(.horizontal, 14)
                .padding(.vertical, 11)
                .background(message.role == "user" ? Color.mwPrimary : .white.opacity(0.82), in: UnevenRoundedRectangle(topLeadingRadius: 18, bottomLeadingRadius: message.role == "user" ? 18 : 4, bottomTrailingRadius: message.role == "user" ? 4 : 18, topTrailingRadius: 18))
            if message.role == "ai" { Spacer(minLength: 60) }
        }
    }
}
