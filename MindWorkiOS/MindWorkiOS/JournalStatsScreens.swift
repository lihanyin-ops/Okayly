import SwiftUI

struct JournalScreen: View {
    @EnvironmentObject private var store: AppStore
    @State private var selectedDayIdx = 0
    @State private var selectedDate = Date()

    var body: some View {
        ZStack(alignment: .bottom) {
            Color.mwBackground.ignoresSafeArea()
            GrainOverlay(opacity: 0.3).ignoresSafeArea()
            VStack(spacing: 0) {
                AppStatusBar()
                HeaderBar("情绪日记", trailing: AnyView(headerActions)) { store.navigate(.home) }
                if store.journalData.isEmpty {
                    emptyState
                } else {
                    content
                }
            }
        }
        .task(id: store.hasChatted) {
            await store.generateTodaySummaryIfNeeded()
        }
        .onChange(of: selectedDate) {
            jumpToDate(selectedDate)
        }
        .onChange(of: store.journalData.count) {
            selectedDayIdx = min(selectedDayIdx, max(store.journalData.count - 1, 0))
        }
    }

    private var headerActions: some View {
        HStack(spacing: 8) {
            ZStack {
                Image(systemName: "calendar")
                    .font(.system(size: 13, weight: .semibold))
                    .foregroundStyle(Color.mwIcon)
                    .frame(width: 38, height: 34)
                    .background(Color.mwIconSurface.opacity(0.85), in: Capsule())
                DatePicker("", selection: $selectedDate, in: ...Date(), displayedComponents: .date)
                    .datePickerStyle(.compact)
                    .labelsHidden()
                    .tint(Color.mwPrimary)
                    .frame(width: 38, height: 34)
                    .contentShape(Capsule())
                    .opacity(0.001)
            }
            addButton
        }
    }

    private var addButton: some View {
        Button {
            store.navigate(.journalAdd)
        } label: {
            Label("补录", systemImage: "plus")
                .font(.sans(12, weight: .medium))
                .foregroundStyle(Color.mwIcon)
                .padding(.horizontal, 12)
                .padding(.vertical, 7)
                .background(Color.mwIconSurface.opacity(0.85), in: Capsule())
        }
        .buttonStyle(.plain)
    }

    private var emptyState: some View {
        VStack(spacing: 22) {
            Spacer()
            SoftIcon(system: "book.closed.fill", size: 56, color: Color.mwIcon)
            VStack(spacing: 8) {
                Text("还没有日记记录")
                    .font(.serif(17))
                    .foregroundStyle(Color.mwText)
                Text("完成每日打卡后，你的情绪记录会自动出现在这里。")
                    .font(.sans(14))
                    .multilineTextAlignment(.center)
                    .foregroundStyle(Color.mwMuted)
                    .lineSpacing(4)
            }
            Button("去打卡记录心情") { store.navigate(.checkin) }
                .font(.sans(14, weight: .semibold))
                .foregroundStyle(.white)
                .padding(.horizontal, 24)
                .padding(.vertical, 12)
                .background(Color.mwPrimary, in: RoundedRectangle(cornerRadius: 18))
            Spacer()
            Spacer().frame(height: 70)
        }
        .padding(.horizontal, 32)
    }

    private var content: some View {
        VStack(spacing: 0) {
            ScrollView(.horizontal, showsIndicators: false) {
                HStack(spacing: 8) {
                    ForEach(store.journalData.indices, id: \.self) { index in
                        let day = store.journalData[index]
                        let locked = !store.isPaid && index >= 7
                        Button {
                            selectedDayIdx = index
                        } label: {
                            VStack(spacing: 4) {
                                Text(localizedWeekday(for: day)).font(.sans(10, weight: .medium))
                                Text(dayNumber(for: day))
                                    .font(.system(size: 19, weight: .bold, design: .rounded))
                                if locked {
                                    Image(systemName: "lock.fill").font(.system(size: 10, weight: .semibold))
                                } else {
                                    Circle().fill(MindWorkData.moods[day.avgMoodIdx].colors.first ?? Color.mwPrimary).frame(width: 16, height: 16)
                                }
                            }
                            .foregroundStyle(selectedDayIdx == index ? .white : Color.mwText)
                            .frame(width: 60, height: 76)
                            .background(selectedDayIdx == index ? Color.mwPrimary : .white.opacity(0.78), in: RoundedRectangle(cornerRadius: 18))
                            .overlay(RoundedRectangle(cornerRadius: 18).stroke(selectedDayIdx == index ? .clear : Color.hex("D8E4DD"), lineWidth: 1))
                            .opacity(locked ? 0.55 : 1)
                        }
                        .buttonStyle(.plain)
                    }
                }
                .padding(.horizontal, 20)
                .padding(.bottom, 10)
            }

            ScrollView(showsIndicators: false) {
                if selectedDayIdx < store.journalData.count {
                    let day = store.journalData[selectedDayIdx]
                    let avgMood = MindWorkData.moods[day.avgMoodIdx]
                    VStack(alignment: .leading, spacing: 16) {
                        if !store.isPaid && selectedDayIdx >= 7 {
                            lockedHistory
                        }
                        HStack(spacing: 12) {
                            VStack(spacing: 4) {
                                Text(localizedWeekday(for: day)).font(.sans(11, weight: .medium))
                                Text(dayNumber(for: day))
                                    .font(.system(size: 23, weight: .bold, design: .rounded))
                            }
                            .foregroundStyle(avgMood.textColor)
                            .frame(width: 58, height: 58)
                            .background {
                                MoodGradient(mood: avgMood)
                                    .clipShape(RoundedRectangle(cornerRadius: 18, style: .continuous))
                            }
                            VStack(alignment: .leading, spacing: 4) {
                                Text("\(localizedDate(for: day)) · \(L10n.t("共")) \(day.count) \(L10n.t("条记录"))")
                                    .font(.sans(14, weight: .semibold))
                                    .foregroundStyle(Color.mwText)
                                HStack(spacing: 5) {
                                    Text("\(L10n.t("今日平均情绪"))：\(L10n.t(avgMood.label))")
                                    Image(systemName: avgMood.icon)
                                        .font(.system(size: 10, weight: .semibold))
                                }
                                .font(.sans(12))
                                .foregroundStyle(Color.mwMuted)
                            }
                        }
                        summaryCard(day: day)
                        timeline(day: day)
                    }
                    .padding(.horizontal, 20)
                    .padding(.bottom, 104)
                }
            }
        }
    }

    private func jumpToDate(_ date: Date) {
        let key = dateKey(for: date)
        if let index = store.journalData.firstIndex(where: { $0.dateKey == key }) {
            withAnimation(.spring(response: 0.3, dampingFraction: 0.9)) {
                selectedDayIdx = index
            }
        }
    }

    private func dateKey(for date: Date) -> String {
        let formatter = DateFormatter()
        formatter.calendar = Calendar(identifier: .gregorian)
        formatter.locale = Locale(identifier: "en_US_POSIX")
        formatter.dateFormat = "yyyy-MM-dd"
        return formatter.string(from: Calendar.current.startOfDay(for: date))
    }

    private func date(from day: JournalDay) -> Date? {
        guard !day.dateKey.isEmpty else { return nil }
        let formatter = DateFormatter()
        formatter.calendar = Calendar(identifier: .gregorian)
        formatter.locale = Locale(identifier: "en_US_POSIX")
        formatter.dateFormat = "yyyy-MM-dd"
        return formatter.date(from: day.dateKey)
    }

    private func dayNumber(for day: JournalDay) -> String {
        if let date = date(from: day) {
            return date.formatted(.dateTime.day())
        }
        return day.date.components(separatedBy: "月").last?.replacingOccurrences(of: "日", with: "") ?? ""
    }

    private func localizedDate(for day: JournalDay) -> String {
        guard let date = date(from: day) else { return L10n.t(day.date) }
        return date.formatted(.dateTime.month(.abbreviated).day())
    }

    private func localizedWeekday(for day: JournalDay) -> String {
        guard let date = date(from: day) else { return L10n.t(day.dayOfWeek) }
        return date.formatted(.dateTime.weekday(.short))
    }

    private var lockedHistory: some View {
        FrostedPaywall(title: "7 天前的记录", desc: "免费版仅保留最近 7 天的情绪日记。升级完整版，永久保存你的每一个情绪瞬间。", features: ["无限日记存储，永不丢失", "深度情绪趋势分析", "AI 树洞无限对话"]) {
            store.navigate(.subscribe)
        }
        .frame(height: 430)
    }

    @ViewBuilder
    private func summaryCard(day: JournalDay) -> some View {
        if let existing = day.entries.first(where: { !$0.summary.isEmpty })?.summary {
            SectionCard {
                VStack(alignment: .leading, spacing: 8) {
                    HStack(spacing: 6) {
                        SoftIcon(system: "leaf.fill", size: 12, color: Color.mwIcon)
                        Text("今日 AI 摘要").font(.sans(12, weight: .semibold)).foregroundStyle(Color.mwPrimaryDark)
                    }
                    Text(existing).font(.sans(12)).foregroundStyle(Color.mwText).lineSpacing(4)
                }
            }
        } else if selectedDayIdx == 0, store.hasChatted {
            SectionCard {
                HStack(spacing: 12) {
                    SoftIconBadge(system: "leaf.fill", size: 20)
                    VStack(alignment: .leading, spacing: 3) {
                        Text("今日 AI 摘要").font(.sans(12, weight: .semibold)).foregroundStyle(Color.mwPrimaryDark)
                        if store.isGeneratingSummary {
                            Text("正在根据今天的树洞对话生成摘要……").font(.sans(12)).foregroundStyle(Color.mwMuted)
                        } else if let error = store.aiSummaryError {
                            Text("摘要生成失败：\(error)").font(.sans(12)).foregroundStyle(Color.mwDanger)
                        } else {
                            Text("摘要会根据今天的树洞对话自动生成").font(.sans(12)).foregroundStyle(Color.mwMuted)
                        }
                    }
                    Spacer()
                }
            }
        } else if selectedDayIdx == 0 {
            Button { store.navigate(.aiChat) } label: {
                HStack(spacing: 12) {
                    SoftIcon(system: "bubble.left.and.bubble.right.fill", size: 20, color: Color.mwIcon)
                        .frame(width: 42, height: 42)
                        .background(LinearGradient.morandi, in: RoundedRectangle(cornerRadius: 14))
                    VStack(alignment: .leading, spacing: 4) {
                        Text("今天还没有聊聊心情").font(.sans(14, weight: .semibold)).foregroundStyle(Color.mwText)
                        Text("去树洞倾诉一下，AI 陪你聊聊 →").font(.sans(12)).foregroundStyle(Color.mwMuted)
                    }
                    Spacer()
                    Image(systemName: "chevron.right").font(.system(size: 12))
                }
                .padding(16)
                .glassCard(radius: 20)
            }
            .buttonStyle(.plain)
        }
    }

    private func timeline(day: JournalDay) -> some View {
        VStack(alignment: .leading, spacing: 0) {
            ForEach(day.entries) { entry in
                Button {
                    store.detailEntry = entry
                    store.navigate(.journalDetail)
                } label: {
                    HStack(alignment: .top, spacing: 12) {
                        VStack {
                            Circle().fill(MindWorkData.moods[entry.moodIdx].colors.first ?? Color.mwPrimary).frame(width: 12, height: 12).overlay(Circle().stroke(.white, lineWidth: 2))
                            Rectangle().fill(Color.hex("D2DFD8")).frame(width: 2)
                        }
                        VStack(alignment: .leading, spacing: 8) {
                            HStack {
                                Text(entry.time).font(.sans(12, weight: .medium)).foregroundStyle(Color.mwMuted)
                                Spacer()
                                HStack(spacing: 5) {
                                    Image(systemName: MindWorkData.moods[entry.moodIdx].icon)
                                        .font(.system(size: 10, weight: .semibold))
                                    Text(L10n.t(MindWorkData.moods[entry.moodIdx].label))
                                        .font(.sans(12, weight: .medium))
                                }
                                .foregroundStyle(Color.mwPrimaryDark)
                            }
                            if !entry.tags.isEmpty {
                                FlowLayout(spacing: 5, rowSpacing: 5) {
                                    ForEach(entry.tags, id: \.self) { tag in
                                        TagPill(tag: tag, compact: true)
                                    }
                                }
                            }
                            if !entry.note.isEmpty {
                                Text(entry.note).font(.sans(14)).foregroundStyle(Color.mwText).lineSpacing(4)
                            }
                        }
                        .padding(14)
                        .glassCard(radius: 18)
                    }
                }
                .buttonStyle(.plain)
                .padding(.bottom, 10)
            }
            Text("↑ 点击上方日期查看其他天 · 向下滑动查看更多")
                .font(.sans(12))
                .foregroundStyle(Color.mwMuted)
                .frame(maxWidth: .infinity)
                .padding(.top, 4)
        }
    }
}

struct JournalAddScreen: View {
    @EnvironmentObject private var store: AppStore
    @State private var selectedDate = Date()
    @State private var selectedMood = 3
    @State private var selectedTags: [String] = []
    @State private var note = ""
    @State private var saved = false

    var body: some View {
        if saved {
            let mood = MindWorkData.moods[selectedMood]
            MoodCompletionView(mood: mood, title: "补录成功", subtitle: "") {
                store.navigate(.journal)
            }
        } else {
            ZStack {
                Color.mwBackground.ignoresSafeArea()
                GrainOverlay(opacity: 0.3).ignoresSafeArea()
                VStack(spacing: 0) {
                    AppStatusBar()
                    HeaderBar("补录历史记录") { store.navigate(.journal) }
                    ScrollView {
                        VStack(alignment: .leading, spacing: 18) {
                            Text("选择日期").font(.sans(12, weight: .medium)).foregroundStyle(Color.mwPrimaryDark)
                            DatePicker("", selection: $selectedDate, in: ...Date(), displayedComponents: .date)
                                .datePickerStyle(.compact)
                                .labelsHidden()
                                .padding(14)
                                .glassCard(radius: 18)

                            Text("那天的心情").font(.sans(12, weight: .medium)).foregroundStyle(Color.mwPrimaryDark)
                            ScrollView(.horizontal, showsIndicators: false) {
                                HStack(spacing: 8) {
                                    ForEach(MindWorkData.moods) { mood in
                                        MoodChip(mood: mood, selected: selectedMood == mood.id) { selectedMood = mood.id }
                                    }
                                }
                            }

                            Text("发生了什么？").font(.sans(12, weight: .medium)).foregroundStyle(Color.mwPrimaryDark)
                            FlowLayout(spacing: 8, rowSpacing: 8) {
                                ForEach(MindWorkData.sceneTags, id: \.self) { tag in
                                    Button {
                                        if selectedTags.contains(tag) { selectedTags.removeAll { $0 == tag } } else { selectedTags.append(tag) }
                                    } label: {
                                        TagPill(tag: tag, selected: selectedTags.contains(tag))
                                    }
                                    .buttonStyle(.plain)
                                }
                            }

                            Text("想说点什么？").font(.sans(12, weight: .medium)).foregroundStyle(Color.mwPrimaryDark)
                            TextEditor(text: $note)
                                .font(.sans(14))
                                .scrollContentBackground(.hidden)
                                .frame(minHeight: 108)
                                .padding(10)
                                .glassCard(radius: 18)
                            Button("保存补录") {
                                store.addJournalEntry(moodIdx: selectedMood, tags: selectedTags, note: note, date: selectedDate)
                                saved = true
                            }
                            .primaryButtonStyle()
                        }
                        .padding(.horizontal, 20)
                        .padding(.bottom, 30)
                    }
                }
            }
        }
    }
}

struct JournalDetailScreen: View {
    @EnvironmentObject private var store: AppStore
    @State var entry: JournalEntry
    @State private var isEditing = false
    @State private var showDelete = false
    @State private var saved = false

    var body: some View {
        let mood = MindWorkData.moods[entry.moodIdx]
        ZStack {
            LinearGradient(colors: [mood.colors.first ?? .mwBackground, .mwBackground], startPoint: .topLeading, endPoint: .bottomTrailing).ignoresSafeArea()
            GrainOverlay(opacity: 0.4).ignoresSafeArea()
            VStack(spacing: 0) {
                AppStatusBar()
                HStack {
                    CircleIconButton(system: "chevron.left") { store.navigate(.journal) }
                    Spacer()
                    Text(entry.time).font(.sans(14, weight: .semibold)).foregroundStyle(Color.mwText)
                    Spacer()
                    CircleIconButton(system: "trash") { showDelete = true }
                }
                .padding(.horizontal, 20)
                .padding(.vertical, 10)
                ScrollView {
                    VStack(spacing: 16) {
                        VStack(alignment: .leading, spacing: 12) {
                            HStack(spacing: 16) {
                                Image(systemName: mood.icon)
                                    .font(.system(size: 48, weight: .semibold))
                                    .symbolRenderingMode(.hierarchical)
                                    .foregroundStyle(.white.opacity(0.95))
                                    .frame(width: 58, height: 58)
                                VStack(alignment: .leading, spacing: 5) {
                                    Text(L10n.t(mood.label))
                                        .font(.serif(27, weight: .bold))
                                    Text(L10n.t(mood.desc))
                                        .font(.sans(12))
                                        .opacity(0.72)
                                }
                                .foregroundStyle(.white.opacity(0.95))
                                Spacer(minLength: 0)
                            }
                            if !entry.tags.isEmpty {
                                FlowLayout(spacing: 6, rowSpacing: 6) {
                                    ForEach(entry.tags, id: \.self) { tag in
                                        TagPill(tag: tag, compact: true, light: true)
                                    }
                                }
                            }
                        }
                        .padding(20)
                        .frame(maxWidth: .infinity, alignment: .leading)
                        .background {
                            MoodGradient(mood: mood)
                                .clipShape(RoundedRectangle(cornerRadius: 28, style: .continuous))
                        }

                        SectionCard {
                            VStack(alignment: .leading, spacing: 10) {
                                HStack {
                                    HStack(spacing: 6) {
                                        SoftIcon(system: "note.text", size: 12, color: Color.mwIcon)
                                        Text("备注").font(.sans(12, weight: .semibold)).foregroundStyle(Color.mwPrimaryDark)
                                    }
                                    Spacer()
                                    Button(isEditing ? L10n.t("保存") : L10n.t("编辑")) {
                                        if isEditing {
                                            saved = true
                                            DispatchQueue.main.asyncAfter(deadline: .now() + 1.6) { saved = false }
                                        }
                                        isEditing.toggle()
                                    }
                                    .font(.sans(12, weight: .semibold))
                                    .foregroundStyle(isEditing ? .white : Color.mwPrimaryDark)
                                    .padding(.horizontal, 10)
                                    .padding(.vertical, 5)
                                    .background(isEditing ? Color.mwPrimary : Color.hex("E4EFE9"), in: Capsule())
                                }
                                if isEditing {
                                    TextEditor(text: $entry.note)
                                        .scrollContentBackground(.hidden)
                                        .font(.sans(14))
                                        .frame(minHeight: 90)
                                } else {
                                    Text(entry.note.isEmpty ? "暂无备注，点击编辑添加" : entry.note)
                                        .font(.sans(14))
                                        .foregroundStyle(entry.note.isEmpty ? Color.mwMuted : Color.mwText)
                                }
                                if saved {
                                    Label("已保存", systemImage: "checkmark")
                                        .font(.sans(12))
                                        .foregroundStyle(Color.mwPrimary)
                                }
                            }
                        }

                        if entry.cbtTriggered {
                            SectionCard {
                                VStack(alignment: .leading, spacing: 12) {
                                    HStack(spacing: 6) {
                                        SoftIcon(system: "brain.head.profile", size: 12, color: Color.mwIcon)
                                        Text("当时触发的 CBT 干预").font(.sans(12, weight: .semibold)).foregroundStyle(Color.mwPrimaryDark)
                                    }
                                    VStack(alignment: .leading, spacing: 10) {
                                        HStack {
                                            Text(cbtType)
                                                .font(.sans(14, weight: .semibold))
                                                .foregroundStyle(Color.mwText)
                                            Spacer()
                                            if !entry.tags.isEmpty {
                                                Text("关联 \(entry.tags.map(MindWorkData.cleanTag).joined(separator: "、"))")
                                                    .font(.sans(10, weight: .medium))
                                                    .foregroundStyle(Color.mwPrimaryDark)
                                                    .lineLimit(1)
                                            }
                                        }
                                        cbtDetailRow("你可能在想", text: cbtThought)
                                        cbtDetailRow("换个角度看", text: cbtReframe)
                                        cbtDetailRow("试试这个", text: cbtAction)
                                    }
                                    .padding(12)
                                    .frame(maxWidth: .infinity, alignment: .leading)
                                    .background(Color.hex("E7F1EC"), in: RoundedRectangle(cornerRadius: 14))
                                    Text("当时的反馈：\(entry.cbtFeedback ?? "未反馈")").font(.sans(12)).foregroundStyle(Color.mwMuted)
                                }
                            }
                        } else {
                            Text("这次打卡未触发 CBT 干预")
                                .font(.sans(12))
                                .foregroundStyle(Color.mwMuted)
                                .frame(maxWidth: .infinity)
                                .padding(16)
                                .background(Color.white.opacity(0.35), in: RoundedRectangle(cornerRadius: 18))
                                .overlay(RoundedRectangle(cornerRadius: 18).stroke(Color.hex("D8E4DD"), style: StrokeStyle(lineWidth: 1, dash: [5, 4])))
                        }
                    }
                    .padding(.horizontal, 20)
                    .padding(.bottom, 30)
                }
            }

            if showDelete {
                Color.black.opacity(0.38).ignoresSafeArea()
                    .onTapGesture { showDelete = false }
                VStack(spacing: 12) {
                    Spacer()
                    VStack(spacing: 10) {
                        Text("删除这条记录？").font(.serif(18)).foregroundStyle(Color.mwText)
                        Text("删除后无法恢复，包括备注和 CBT 记录").font(.sans(12)).foregroundStyle(Color.mwMuted)
                        Button("确认删除") { store.deleteDetailEntry() }
                            .font(.sans(14, weight: .semibold))
                            .foregroundStyle(.white)
                            .frame(maxWidth: .infinity)
                            .padding(.vertical, 13)
                            .background(Color.mwDanger, in: RoundedRectangle(cornerRadius: 18))
                        Button("取消") { showDelete = false }
                            .font(.sans(14))
                            .foregroundStyle(Color.mwMuted)
                            .padding(.vertical, 8)
                    }
                    .padding(20)
                    .background(Color.mwBackground, in: UnevenRoundedRectangle(topLeadingRadius: 28, topTrailingRadius: 28))
                }
                .ignoresSafeArea(edges: .bottom)
            }
        }
    }

    private var resolvedCBTCard: CBTCard? {
        MindWorkData.cbtCard(id: entry.cbtCardID) ?? MindWorkData.cbtCard(type: entry.cbtCard)
    }

    private var cbtType: String {
        entry.cbtCard ?? resolvedCBTCard?.type ?? "认知重构"
    }

    private var cbtThought: String {
        entry.cbtThought ?? resolvedCBTCard?.thought ?? "我现在被一个很重的想法压住了"
    }

    private var cbtReframe: String {
        entry.cbtReframe ?? resolvedCBTCard?.reframe ?? "想法很有力量，但它仍然只是想法，不等于完整事实。"
    }

    private var cbtAction: String {
        entry.cbtAction ?? resolvedCBTCard?.action ?? "写下这个想法，再写一个更温和、更具体的版本。"
    }

    private func cbtDetailRow(_ title: String, text: String) -> some View {
        VStack(alignment: .leading, spacing: 4) {
            Text(title)
                .font(.sans(11, weight: .semibold))
                .foregroundStyle(Color.mwPrimaryDark)
            Text(text)
                .font(.sans(12))
                .foregroundStyle(Color.mwText)
                .lineSpacing(3)
        }
    }
}

enum StatsPeriod: String, CaseIterable, Identifiable {
    case week, lastweek, thirty, all
    var id: String { rawValue }
    var label: String {
        switch self {
        case .week: L10n.t("本周")
        case .lastweek: L10n.t("上周")
        case .thirty: L10n.t("30天")
        case .all: L10n.t("全部")
        }
    }
}

struct StatsScreen: View {
    @EnvironmentObject private var store: AppStore
    @State private var period: StatsPeriod = .week
    @State private var selectedSlice: Int?

    private var bars: [Int?] {
        switch period {
        case .week:
            store.weekMoods.map { $0.map { $0 + 1 } }
        case .lastweek:
            Array(repeating: nil, count: 7)
        case .thirty:
            Array(actualScores.prefix(30)).map(Optional.init)
        case .all:
            actualScores.map(Optional.init)
        }
    }

    private var actualScores: [Int] {
        store.journalData.flatMap(\.entries).map { $0.moodIdx + 1 }
    }

    var body: some View {
        ZStack(alignment: .bottom) {
            Color.mwBackground.ignoresSafeArea()
            GrainOverlay(opacity: 0.3).ignoresSafeArea()
            VStack(spacing: 0) {
                AppStatusBar()
                HeaderBar("情绪统计") { store.navigate(.home) }
                periodTabs
                ScrollView(showsIndicators: false) {
                    VStack(spacing: 16) {
                        chartCard
                        pixelWall
                        if store.isPaid {
                            Button { store.navigate(.statsUnlocked) } label: {
                                paidAnalysisCard(locked: false)
                            }
                            .buttonStyle(.plain)
                        } else {
                            paidAnalysisCard(locked: true)
                        }
                    }
                    .padding(.horizontal, 20)
                    .padding(.bottom, store.isPaid ? 104 : 340)
                }
                .blur(radius: store.isPaid ? 0 : 5)
                .allowsHitTesting(store.isPaid)
            }

            if !store.isPaid {
                VStack {
                    Spacer()
                    PaywallCard(
                        title: "解锁深度情绪分析",
                        desc: "查看你的情绪规律、压力源排名和最佳状态时段，让数据帮你更了解自己。",
                        features: ["情绪-行为关联洞察", "压力源排名分析", "最佳/最差时段报告", "AI 个性化建议", "就诊 PDF 报告生成"]
                    ) {
                        store.navigate(.subscribe)
                    }
                    .padding(.horizontal, 34)
                    .padding(.bottom, 96)
                }
                .transition(.opacity)
                .zIndex(5)
            }
        }
    }

    private var periodTabs: some View {
        HStack(spacing: 8) {
            ForEach(StatsPeriod.allCases) { item in
                Button {
                    period = item
                } label: {
                    Text(item.label)
                        .font(.sans(12, weight: .medium))
                        .foregroundStyle(period == item ? .white : Color.mwPrimaryDark)
                        .frame(maxWidth: .infinity)
                        .padding(.vertical, 9)
                        .background(period == item ? Color.mwPrimary : .white.opacity(0.78), in: RoundedRectangle(cornerRadius: 14))
                        .overlay(RoundedRectangle(cornerRadius: 14).stroke(period == item ? .clear : Color.hex("D8E4DD"), lineWidth: 1))
                }
                .buttonStyle(.plain)
            }
        }
        .padding(.horizontal, 20)
        .padding(.bottom, 10)
    }

    private var chartCard: some View {
        SectionCard {
            VStack(alignment: .leading, spacing: 14) {
                HStack {
                    Text("情绪分布").font(.sans(15, weight: .semibold)).foregroundStyle(Color.mwText)
                    Spacer()
                    Text(period.label).font(.sans(12)).foregroundStyle(Color.mwMuted)
                }
                HStack(alignment: .bottom, spacing: 7) {
                    ForEach(Array(bars.prefix(period == .week || period == .lastweek ? 7 : 30).enumerated()), id: \.offset) { index, score in
                        VStack(spacing: 5) {
                            RoundedRectangle(cornerRadius: 5)
                                .fill(score.map { MindWorkData.moods[$0 - 1].colors.first ?? Color.mwPrimary } ?? Color.hex("DDE7E1"))
                                .frame(height: CGFloat(score ?? 1) * 14)
                                .opacity(score == nil ? 0.38 : (selectedSlice == nil || selectedSlice == (score ?? 1) - 1 ? 1 : 0.25))
                            if period == .week || period == .lastweek {
                                Text(["一","二","三","四","五","六","日"][index]).font(.sans(8)).foregroundStyle(Color.mwMuted)
                            }
                        }
                        .frame(maxWidth: .infinity, alignment: .bottom)
                    }
                }
                .frame(height: 118, alignment: .bottom)
                PieLegend(selectedSlice: $selectedSlice, counts: moodCounts)
            }
        }
    }

    private var moodCounts: [Int] {
        var counts = Array(repeating: 0, count: 7)
        for score in bars.compactMap({ $0 }) where (1...7).contains(score) {
            counts[score - 1] += 1
        }
        return counts
    }

    private var pixelWall: some View {
        SectionCard {
            VStack(alignment: .leading, spacing: 12) {
                HStack {
                    Text("情绪像素墙").font(.sans(15, weight: .semibold)).foregroundStyle(Color.mwText)
                    Spacer()
                    Text(period.label).font(.sans(12)).foregroundStyle(Color.mwMuted)
                }
                LazyVGrid(columns: Array(repeating: GridItem(.flexible(), spacing: 5), count: 10), spacing: 5) {
                    ForEach(Array(bars.prefix(period == .week || period == .lastweek ? 7 : 30).enumerated()), id: \.offset) { _, score in
                        RoundedRectangle(cornerRadius: 4)
                            .fill(score.map { MindWorkData.moods[$0 - 1].colors.first ?? Color.mwPrimary } ?? Color.hex("DDE7E1"))
                            .aspectRatio(1, contentMode: .fit)
                            .opacity(score == nil ? 0.35 : (selectedSlice == nil || selectedSlice == (score ?? 1) - 1 ? 1 : 0.22))
                    }
                }
                FlowLayout(spacing: 8, rowSpacing: 6) {
                    ForEach(MindWorkData.moods) { mood in
                        HStack(spacing: 4) {
                            RoundedRectangle(cornerRadius: 2).fill(mood.colors.first ?? Color.mwPrimary).frame(width: 10, height: 10)
                            Text(L10n.t(mood.label)).font(.sans(9)).foregroundStyle(Color.mwMuted)
                        }
                    }
                }
            }
        }
    }

    private func paidAnalysisCard(locked: Bool) -> some View {
        ZStack {
            LinearGradient(colors: [.hex("A7C8B5"), .hex("82AC95")], startPoint: .topLeading, endPoint: .bottomTrailing)
            GrainOverlay(opacity: 0.4)
            VStack(alignment: .leading, spacing: 10) {
                HStack {
                    Text("深度情绪分析").font(.sans(15, weight: .semibold)).foregroundStyle(.white)
                    Spacer()
                    Label(locked ? "付费版" : "已解锁", systemImage: locked ? "lock.fill" : "sparkles")
                        .font(.sans(11, weight: .medium))
                        .padding(.horizontal, 9)
                        .padding(.vertical, 4)
                        .background(.white.opacity(0.28), in: Capsule())
                }
                Text(locked ? "解锁 30 天趋势分析、压力源排名、最佳/最差时段洞察……" : "查看 30 天趋势分析、压力源排名、最佳/最差时段洞察")
                    .font(.sans(12))
                    .foregroundStyle(.white.opacity(0.88))
                HStack(spacing: 6) {
                    ForEach([18, 27, 15, 32, 23], id: \.self) { h in
                        RoundedRectangle(cornerRadius: 6).fill(.white.opacity(locked ? 0.25 : 0.42)).frame(height: CGFloat(h))
                            .blur(radius: locked ? 2.5 : 0)
                    }
                }
                .frame(height: 40, alignment: .bottom)
            }
            .padding(18)
        }
        .clipShape(RoundedRectangle(cornerRadius: 22, style: .continuous))
    }
}

struct PieLegend: View {
    @Binding var selectedSlice: Int?
    var counts: [Int]

    private var total: Int { max(counts.reduce(0, +), 1) }

    var body: some View {
        HStack(spacing: 16) {
            ZStack {
                ForEach(0..<7, id: \.self) { index in
                    Circle()
                        .trim(from: CGFloat(index) / 7, to: CGFloat(index + 1) / 7 - 0.01)
                        .stroke(MindWorkData.moods[index].colors.first ?? Color.mwPrimary, lineWidth: 22)
                        .rotationEffect(.degrees(-90))
                        .opacity(selectedSlice == nil || selectedSlice == index ? 1 : 0.3)
                        .onTapGesture { selectedSlice = selectedSlice == index ? nil : index }
                }
                Circle().fill(Color.mwBackground).frame(width: 52, height: 52)
                Text(selectedSlice == nil ? "点击查看" : "\(Int(Double(counts[selectedSlice ?? 0]) / Double(total) * 100))%")
                    .font(.sans(10, weight: .semibold))
                    .foregroundStyle(Color.mwText)
            }
            .frame(width: 116, height: 116)
            VStack(spacing: 7) {
                ForEach(MindWorkData.moods) { mood in
                    Button {
                        selectedSlice = selectedSlice == mood.id ? nil : mood.id
                    } label: {
                        HStack(spacing: 6) {
                            RoundedRectangle(cornerRadius: 2).fill(mood.colors.first ?? Color.mwPrimary).frame(width: 11, height: 11)
                            Image(systemName: mood.icon).font(.system(size: 9, weight: .semibold))
                            Text(L10n.t(mood.label)).font(.sans(10)).foregroundStyle(Color.mwText)
                            Spacer()
                        }
                        .opacity(selectedSlice == nil || selectedSlice == mood.id ? 1 : 0.45)
                    }
                    .buttonStyle(.plain)
                }
            }
        }
    }
}

struct StatsUnlockedScreen: View {
    @EnvironmentObject private var store: AppStore
    @State private var period: StatsPeriod = .thirty

    private let stress = [
        ("截止日 / 汇报", 12, 38),
        ("熬夜 / 睡眠不足", 8, 25),
        ("人际冲突", 5, 16),
        ("身体不适", 4, 13),
        ("其他", 3, 8)
    ]

    private let times = [
        ("周六下午", 6.2), ("周日上午", 5.8), ("工作日晚上", 4.9), ("工作日上午", 4.1), ("工作日下午", 3.5)
    ]

    var body: some View {
        ZStack {
            Color.mwBackground.ignoresSafeArea()
            GrainOverlay(opacity: 0.3).ignoresSafeArea()
            VStack(spacing: 0) {
                AppStatusBar()
                HeaderBar("深度情绪分析", subtitle: store.isPaid ? "完整版 · 已解锁" : "完整版 · 模糊预览", trailing: AnyView(Label(store.isPaid ? "付费版" : "付费版", systemImage: store.isPaid ? "sparkles" : "lock.fill").font(.sans(11)).foregroundStyle(Color.mwPrimaryDark).padding(.horizontal, 9).padding(.vertical, 5).background(Color.mwPrimary.opacity(0.12), in: Capsule()))) {
                    store.navigate(.stats)
                }
                HStack(spacing: 8) {
                    ForEach(StatsPeriod.allCases) { item in
                        Button(item.label) { period = item }
                            .font(.sans(12, weight: .medium))
                            .foregroundStyle(period == item ? .white : Color.mwPrimaryDark)
                            .frame(maxWidth: .infinity)
                            .padding(.vertical, 9)
                            .background(period == item ? Color.mwPrimary : .white.opacity(0.78), in: RoundedRectangle(cornerRadius: 14))
                    }
                }
                .padding(.horizontal, 20)
                .padding(.bottom, 12)

                ScrollView(showsIndicators: false) {
                    VStack(spacing: 16) {
                        SectionCard {
                            VStack(alignment: .leading, spacing: 8) {
                                HStack(spacing: 6) {
                                    SoftIcon(system: "leaf.fill", size: 12, color: Color.mwIcon)
                                    Text("AI 情绪洞察").font(.sans(12, weight: .semibold)).foregroundStyle(Color.mwPrimaryDark)
                                }
                                Text("过去 30 天，你的情绪整体呈轻微上升趋势。压力高峰集中在每周三至周四，与截止日高度相关。周末情绪明显好于工作日，差值约 1.8 分。")
                                    .font(.sans(14))
                                    .foregroundStyle(Color.mwText)
                                    .lineSpacing(4)
                            }
                        }
                        insightBars(title: "压力源排名", rows: stress.map { ($0.0, "\($0.1) 次 · \($0.2)%", Double($0.2) / 100) })
                        insightBars(title: "最佳 / 最差时段", rows: times.map { ($0.0, String(format: "%.1f", $0.1), $0.1 / 7) })
                        SectionCard {
                            VStack(alignment: .leading, spacing: 14) {
                                Text("情绪-行为关联洞察").font(.sans(15, weight: .semibold)).foregroundStyle(Color.mwText)
                                ForEach([("moon.stars.fill", "熬夜后的第二天，情绪评分平均下降 2.3 分"), ("figure.run", "运动当天的情绪比平均高 1.6 分"), ("cup.and.saucer.fill", "咖啡因摄入与焦虑标签共现率 67%"), ("chart.bar.doc.horizontal.fill", "汇报前一天情绪低落概率 78%")], id: \.1) { item in
                                    HStack(alignment: .top, spacing: 8) {
                                        SoftIcon(system: item.0, size: 12, color: Color.mwIcon, frame: 16)
                                        Text(item.1).font(.sans(12)).foregroundStyle(Color.mwText).lineSpacing(3)
                                    }
                                }
                            }
                        }
                        Button { store.navigate(.report) } label: {
                            Label("生成就诊报告", systemImage: "doc.text.fill")
                        }
                            .primaryButtonStyle()
                    }
                    .padding(.horizontal, 20)
                    .padding(.bottom, 30)
                }
            }
            .blur(radius: store.isPaid ? 0 : 5)
            .allowsHitTesting(store.isPaid)

            if !store.isPaid {
                FrostedPaywall(title: "解锁深度情绪分析", desc: "完整查看 30 天趋势、压力源排名、情绪-行为关联洞察，并生成本地就诊 PDF 报告。", features: ["情绪-行为关联洞察", "压力源排名分析", "最佳 / 最差时段", "本地 PDF 报告导出"]) {
                    store.navigate(.subscribe)
                }
            }
        }
    }

    private func insightBars(title: String, rows: [(String, String, Double)]) -> some View {
        SectionCard {
            VStack(alignment: .leading, spacing: 12) {
                Text(title).font(.sans(15, weight: .semibold)).foregroundStyle(Color.mwText)
                ForEach(rows.indices, id: \.self) { index in
                    VStack(spacing: 5) {
                        HStack {
                            Text(rows[index].0).font(.sans(12)).foregroundStyle(Color.mwText)
                            Spacer()
                            Text(rows[index].1).font(.sans(12, weight: .medium)).foregroundStyle(Color.mwPrimaryDark)
                        }
                        GeometryReader { proxy in
                            Capsule()
                                .fill(Color.hex("E2ECE6"))
                                .overlay(alignment: .leading) {
                                    Capsule().fill(MindWorkData.moods[max(0, min(6, 3 - index))].colors.first ?? Color.mwPrimary).frame(width: proxy.size.width * rows[index].2)
                                }
                        }
                        .frame(height: 8)
                    }
                }
            }
        }
    }
}
