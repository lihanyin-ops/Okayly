import SwiftUI

@MainActor
final class AppStore: ObservableObject {
    private let chatHistoriesStorageKey = "MindWork.chatHistories.v1"

    @Published var screen: Screen = .onboard1
    @Published var isPaid = false
    @Published var todayMoodIdx: Int?
    @Published var weekMoods: [Int?] = Array(repeating: nil, count: 7)
    @Published var consecutiveLowDays = 0
    @Published var detailEntry: JournalEntry?
    @Published var meds: [Med] = []
    @Published var journalData: [JournalDay] = []
    @Published var hasChatted = false
    @Published var aiPersona: Persona?
    @Published var chatHistories: [Persona: [ChatMessage]] = [:] {
        didSet {
            saveChatHistories()
        }
    }
    @Published var lastTriggeredCBTCard: CBTCard?
    @Published var latestCheckinInsight = "这次记录已经保存。随着打卡次数增加，我会帮你看到更清楚的情绪规律。"
    @Published var isGeneratingSummary = false
    @Published var aiSummaryError: String?
    private var lastTriggeredCBTEntryID: UUID?

    init() {
        loadChatHistories()
    }

    func navigate(_ target: Screen) {
        withAnimation(.spring(response: 0.32, dampingFraction: 0.9)) {
            screen = target
        }
    }

    func navToMain(_ tab: NavTab) {
        let target: Screen
        switch tab {
        case .checkin: target = .home
        case .ai: target = .aiChat
        case .journal: target = .journal
        case .stats: target = .stats
        case .more: target = .more
        }
        var transaction = Transaction()
        transaction.disablesAnimations = true
        withTransaction(transaction) {
            screen = target
        }
    }

    var activeMainTab: NavTab? {
        switch screen {
        case .home, .homeEmpty, .checkin:
            .checkin
        case .aiChat, .aiPersona:
            .ai
        case .journal:
            .journal
        case .stats:
            .stats
        case .more:
            .more
        default:
            nil
        }
    }

    func completeCheckin(moodIdx: Int, tags: [String] = [], note: String = "", fromOnboarding: Bool = false) {
        todayMoodIdx = moodIdx
        let todayIdx = Calendar.current.component(.weekday, from: Date()) == 1 ? 6 : Calendar.current.component(.weekday, from: Date()) - 2
        weekMoods[todayIdx] = moodIdx
        addJournalEntry(moodIdx: moodIdx, tags: tags, note: note, cbtTriggered: moodIdx <= 2)
        latestCheckinInsight = makeCheckinInsight(moodIdx: moodIdx, tags: tags)

        if fromOnboarding {
            navigate(.onboard5)
            return
        }

        if moodIdx <= 1 {
            consecutiveLowDays += 1
            navigate(consecutiveLowDays >= 3 ? .crisis : .checkinDoneLow)
        } else if moodIdx == 2 {
            navigate(.checkinDoneLow)
        } else {
            consecutiveLowDays = 0
            navigate(.checkinDone)
        }
    }

    func addJournalEntry(moodIdx: Int, tags: [String], note: String, date: Date = Date(), cbtTriggered: Bool = false) {
        let calendar = Calendar.current
        let entryDate = calendar.startOfDay(for: date)
        let now = Date()
        let time = now.formatted(.dateTime.hour(.twoDigits(amPM: .omitted)).minute(.twoDigits))
        let dateKey = journalDateKey(for: entryDate)
        let month = calendar.component(.month, from: entryDate)
        let day = calendar.component(.day, from: entryDate)
        let weekdays = ["周日", "周一", "周二", "周三", "周四", "周五", "周六"]
        let weekday = weekdays[calendar.component(.weekday, from: entryDate) - 1]
        let dateLabel = journalDateLabel(for: entryDate)
        let cbtCard = cbtTriggered ? MindWorkData.cbtCard(for: tags, moodIdx: moodIdx) : nil
        let newEntry = JournalEntry(
            time: time,
            moodIdx: moodIdx,
            tags: tags,
            note: note,
            cbtTriggered: cbtTriggered,
            cbtCardID: cbtCard?.id,
            cbtCard: cbtCard?.type,
            cbtThought: cbtCard?.thought,
            cbtReframe: cbtCard?.reframe,
            cbtAction: cbtCard?.action
        )

        lastTriggeredCBTCard = cbtCard
        lastTriggeredCBTEntryID = cbtTriggered ? newEntry.id : nil

        if let index = journalData.firstIndex(where: { $0.dateKey == dateKey }) {
            journalData[index].entries.insert(newEntry, at: 0)
            recalculateJournalDay(at: index)
        } else {
            journalData.append(JournalDay(dateLabel: dateLabel, date: "\(month)月\(day)日", dayOfWeek: weekday, avgMoodIdx: moodIdx, count: 1, entries: [newEntry], dateKey: dateKey))
        }
        sortJournalData()
        updateMoodCaches(moodIdx: moodIdx, for: entryDate)
    }

    func recordCBTFeedback(_ feedback: String) {
        guard let entryID = lastTriggeredCBTEntryID else { return }
        for dayIndex in journalData.indices {
            guard let entryIndex = journalData[dayIndex].entries.firstIndex(where: { $0.id == entryID }) else { continue }
            journalData[dayIndex].entries[entryIndex].cbtFeedback = feedback
            if detailEntry?.id == entryID {
                detailEntry?.cbtFeedback = feedback
            }
            return
        }
    }

    func addMed(name: String, dose: String, time: String, note: String, stock: Double, unit: String, doseAmount: Double) {
        guard !name.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty else { return }
        meds.append(Med(id: Int(Date().timeIntervalSince1970), name: name, dose: dose, times: [time], days: "每天", stock: max(stock, 0), unit: unit, doseAmount: max(doseAmount, 0), note: note, active: true))
    }

    func setMedCompleted(id: Int, completed: Bool) {
        guard let index = meds.firstIndex(where: { $0.id == id }) else { return }
        let amount = meds[index].doseAmount
        if completed {
            meds[index].stock = max(0, meds[index].stock - amount)
        } else {
            meds[index].stock += amount
        }
    }

    func deleteDetailEntry() {
        guard let detailEntry else { return }
        for index in journalData.indices {
            journalData[index].entries.removeAll { $0.id == detailEntry.id }
            recalculateJournalDay(at: index)
        }
        journalData.removeAll { $0.entries.isEmpty }
        self.detailEntry = nil
        navigate(.journal)
    }

    private func journalDateKey(for date: Date) -> String {
        let formatter = DateFormatter()
        formatter.calendar = Calendar(identifier: .gregorian)
        formatter.locale = Locale(identifier: "en_US_POSIX")
        formatter.dateFormat = "yyyy-MM-dd"
        return formatter.string(from: date)
    }

    private func journalDateLabel(for date: Date) -> String {
        let calendar = Calendar.current
        if calendar.isDateInToday(date) { return "今天" }
        if calendar.isDateInYesterday(date) { return "昨天" }
        return journalDateKey(for: date)
    }

    private func journalDate(from day: JournalDay, today: Date) -> Date? {
        let formatter = DateFormatter()
        formatter.calendar = Calendar(identifier: .gregorian)
        formatter.locale = Locale(identifier: "en_US_POSIX")
        formatter.dateFormat = "yyyy-MM-dd"
        if !day.dateKey.isEmpty, let date = formatter.date(from: day.dateKey) {
            return date
        }
        if day.dateLabel == "今天" {
            return today
        }
        if day.dateLabel == "昨天" {
            return Calendar.current.date(byAdding: .day, value: -1, to: today)
        }
        return nil
    }

    private func moodLabel(for index: Int) -> String {
        guard MindWorkData.moods.indices.contains(index) else { return "未知" }
        let mood = MindWorkData.moods[index]
        return "\(mood.label)（\(mood.score)/7）"
    }

    private func compactContextText(_ text: String, fallback: String?) -> String? {
        let trimmed = text.trimmingCharacters(in: .whitespacesAndNewlines)
        guard !trimmed.isEmpty else { return fallback }
        return String(trimmed.prefix(80))
    }

    private func recalculateJournalDay(at index: Int) {
        guard journalData.indices.contains(index), !journalData[index].entries.isEmpty else { return }
        let entries = journalData[index].entries
        journalData[index].count = entries.count
        let average = Double(entries.map(\.moodIdx).reduce(0, +)) / Double(entries.count)
        journalData[index].avgMoodIdx = min(6, max(0, Int(average.rounded())))
    }

    private func sortJournalData() {
        journalData.sort { lhs, rhs in
            if lhs.dateKey.isEmpty || rhs.dateKey.isEmpty {
                return lhs.dateLabel == "今天"
            }
            return lhs.dateKey > rhs.dateKey
        }
    }

    private func updateMoodCaches(moodIdx: Int, for date: Date) {
        let calendar = Calendar.current
        if calendar.isDateInToday(date) {
            todayMoodIdx = moodIdx
        }

        let currentWeek = calendar.component(.weekOfYear, from: Date())
        let entryWeek = calendar.component(.weekOfYear, from: date)
        let currentYear = calendar.component(.yearForWeekOfYear, from: Date())
        let entryYear = calendar.component(.yearForWeekOfYear, from: date)
        guard currentWeek == entryWeek, currentYear == entryYear else { return }
        let weekday = calendar.component(.weekday, from: date)
        let weekIndex = weekday == 1 ? 6 : weekday - 2
        weekMoods[weekIndex] = moodIdx
    }

    private func makeCheckinInsight(moodIdx: Int, tags: [String]) -> String {
        let entries = journalData.flatMap(\.entries)
        let currentScore = Double(moodIdx + 1)
        let selectedTags = tags
            .map(MindWorkData.cleanTag)
            .map { $0.trimmingCharacters(in: .whitespacesAndNewlines) }
            .filter { !$0.isEmpty }

        if let tagInsight = tagBasedInsight(selectedTags: selectedTags, entries: entries) {
            return tagInsight
        }

        if let todayInsight = todayTrendInsight(currentScore: currentScore) {
            return todayInsight
        }

        if entries.count >= 3 {
            let recent = Array(entries.prefix(3))
            let recentAverage = averageScore(recent)
            if recentAverage <= 3 {
                return "最近几次记录的情绪都偏低，说明这段时间确实有不少消耗。继续记录触发场景，会更容易看清压力来源。"
            }
            if recentAverage >= 5.5 {
                return "最近几次记录整体偏稳定向上。可以留意哪些场景或节奏在支持你，之后它们会成为有用的参照。"
            }
        }

        switch moodIdx {
        case 0...2:
            return "这次记录显示你有些消耗。先把感受留下来，等样本多一点，我会帮你看见更具体的触发因素。"
        case 3...4:
            return "这次情绪比较平稳。持续记录后，我会帮你比较哪些场景让状态更稳，哪些场景更容易消耗你。"
        default:
            return "这次记录会加入你的情绪趋势。状态较好的时刻同样重要，它能帮助你找到支持自己的线索。"
        }
    }

    private func tagBasedInsight(selectedTags: [String], entries: [JournalEntry]) -> String? {
        guard !selectedTags.isEmpty, !entries.isEmpty else { return nil }
        let overallAverage = averageScore(entries)

        for tag in selectedTags {
            let matched = entries.filter { entry in
                entry.tags.map(MindWorkData.cleanTag).contains(tag)
            }

            if matched.count >= 2 {
                let tagAverage = averageScore(matched)
                let difference = tagAverage - overallAverage
                let amount = String(format: "%.1f", abs(difference))

                if difference <= -0.6 {
                    return "你在「\(tag)」相关记录中的平均情绪比整体低 \(amount) 分，它可能是一个值得继续观察的压力线索。"
                }

                if difference >= 0.6 {
                    return "你在「\(tag)」相关记录中的平均情绪比整体高 \(amount) 分，它可能是一个支持你状态的线索。"
                }

                return "「\(tag)」已经出现 \(matched.count) 次，目前它和整体情绪差异不明显。再观察几次，规律会更清楚。"
            }

            return "已记录「\(tag)」。再多积累几次后，我会帮你看它和情绪变化之间的关系。"
        }

        return nil
    }

    private func todayTrendInsight(currentScore: Double) -> String? {
        let todayKey = journalDateKey(for: Calendar.current.startOfDay(for: Date()))
        guard
            let today = journalData.first(where: { $0.dateKey == todayKey || $0.dateLabel == "今天" }),
            today.entries.count >= 2
        else {
            return nil
        }

        let previous = Array(today.entries.dropFirst())
        guard !previous.isEmpty else { return nil }
        let previousAverage = averageScore(previous)
        let difference = currentScore - previousAverage
        guard abs(difference) >= 0.8 else {
            return "今天已经记录了 \(today.entries.count) 次，整体状态波动不大。把不同时刻留下来，会帮助你看见一天里的情绪节奏。"
        }

        let amount = String(format: "%.1f", abs(difference))
        if difference > 0 {
            return "这次情绪比今天前面的记录高 \(amount) 分，状态有一点回升。可以留意刚才发生了什么支持了你。"
        }
        return "这次情绪比今天前面的记录低 \(amount) 分，可能刚经历了新的消耗。记录下触发场景会很有帮助。"
    }

    private func averageScore(_ entries: [JournalEntry]) -> Double {
        guard !entries.isEmpty else { return 0 }
        let total = entries.map { Double($0.moodIdx + 1) }.reduce(0, +)
        return total / Double(entries.count)
    }

    func selectPersona(_ persona: Persona) {
        aiPersona = persona
        ensureChatStarted(for: persona)
    }

    func ensureChatStarted() {
        ensureChatStarted(for: aiPersona ?? .counselor)
    }

    func ensureChatStarted(for persona: Persona) {
        guard chatHistories[persona]?.isEmpty ?? true else { return }
        var histories = chatHistories
        histories[persona] = [ChatMessage(role: "ai", text: persona.greeting)]
        chatHistories = histories
    }

    func chatHistory(for persona: Persona) -> [ChatMessage] {
        chatHistories[persona] ?? []
    }

    func appendChatMessage(_ message: ChatMessage, for persona: Persona) {
        ensureChatStarted(for: persona)
        var histories = chatHistories
        histories[persona, default: []].append(message)
        chatHistories = histories
    }

    var todayAIUserMessageCount: Int {
        let calendar = Calendar.current
        return chatHistories.values
            .flatMap { $0 }
            .filter { $0.role == "user" && calendar.isDateInToday($0.createdAt) }
            .count
    }

    var allTodayChatMessages: [ChatMessage] {
        let calendar = Calendar.current
        return chatHistories.values
            .flatMap { $0 }
            .filter { ($0.role == "user" || $0.role == "ai") && calendar.isDateInToday($0.createdAt) }
            .sorted { $0.createdAt < $1.createdAt }
    }

    func containsCrisisSignal(_ text: String) -> Bool {
        let keywords = ["自杀", "自残", "轻生", "不想活", "活不下去", "结束生命", "想死", "去死", "绝望", "没有活着的意义", "伤害自己", "割腕"]
        return keywords.contains { text.localizedCaseInsensitiveContains($0) }
    }

    func recentEmotionContext() -> String? {
        let calendar = Calendar.current
        let today = calendar.startOfDay(for: Date())
        guard let cutoff = calendar.date(byAdding: .day, value: -3, to: today) else { return nil }

        let recentDays = journalData.compactMap { day -> (Date, JournalDay)? in
            guard let date = journalDate(from: day, today: today) else { return nil }
            guard date >= cutoff && date <= today else { return nil }
            return (date, day)
        }
        .sorted { $0.0 > $1.0 }

        guard !recentDays.isEmpty else { return nil }

        let lines = recentDays.flatMap { _, day in
            day.entries.prefix(3).map { entry in
                let mood = moodLabel(for: entry.moodIdx)
                let tags = entry.tags.isEmpty ? "无标签" : entry.tags.joined(separator: "、")
                let note = compactContextText(entry.note, fallback: "未写日记") ?? "未写日记"
                let summary = compactContextText(entry.summary, fallback: nil)
                let summaryText = summary.map { "；AI摘要：\($0)" } ?? ""
                return "\(day.dateLabel) \(entry.time)：心情 \(mood)，标签：\(tags)，日记：\(note)\(summaryText)"
            }
        }

        guard !lines.isEmpty else { return nil }
        return lines.prefix(10).joined(separator: "\n")
    }

    func generateTodaySummaryIfNeeded(force: Bool = false) async {
        guard hasChatted, !isGeneratingSummary else { return }
        let calendar = Calendar.current
        let todayKey = journalDateKey(for: calendar.startOfDay(for: Date()))
        guard let dayIndex = journalData.firstIndex(where: { $0.dateKey == todayKey || $0.dateLabel == "今天" }) else { return }
        guard force || !journalData[dayIndex].entries.contains(where: { !$0.summary.isEmpty }) else { return }

        let todayMessages = allTodayChatMessages
        guard todayMessages.contains(where: { $0.role == "user" }) else { return }

        isGeneratingSummary = true
        aiSummaryError = nil
        do {
            let summary = try await AIService.shared.journalSummary(from: todayMessages)
            guard let entryIndex = journalData[dayIndex].entries.indices.first else { return }
            journalData[dayIndex].entries[entryIndex].summary = summary
        } catch {
            aiSummaryError = error.localizedDescription
        }
        isGeneratingSummary = false
    }

    func resetAll() {
        todayMoodIdx = nil
        weekMoods = Array(repeating: nil, count: 7)
        consecutiveLowDays = 0
        detailEntry = nil
        meds = []
        journalData = []
        hasChatted = false
        aiPersona = nil
        chatHistories = [:]
        lastTriggeredCBTCard = nil
        lastTriggeredCBTEntryID = nil
        latestCheckinInsight = "这次记录已经保存。随着打卡次数增加，我会帮你看到更清楚的情绪规律。"
        isGeneratingSummary = false
        aiSummaryError = nil
        navigate(.onboard1)
    }

    private func loadChatHistories() {
        guard
            let data = UserDefaults.standard.data(forKey: chatHistoriesStorageKey),
            let persisted = try? JSONDecoder().decode([PersistedChatHistory].self, from: data)
        else {
            return
        }

        var histories: [Persona: [ChatMessage]] = [:]
        for item in persisted {
            guard let persona = Persona(rawValue: item.personaRawValue), !item.messages.isEmpty else { continue }
            histories[persona] = item.messages
        }
        chatHistories = histories
        hasChatted = histories.values.flatMap { $0 }.contains { $0.role == "user" }
    }

    private func saveChatHistories() {
        let persisted = chatHistories
            .filter { !$0.value.isEmpty }
            .map { PersistedChatHistory(personaRawValue: $0.key.rawValue, messages: $0.value) }

        guard !persisted.isEmpty else {
            UserDefaults.standard.removeObject(forKey: chatHistoriesStorageKey)
            return
        }

        if let data = try? JSONEncoder().encode(persisted) {
            UserDefaults.standard.set(data, forKey: chatHistoriesStorageKey)
        }
    }
}

private struct PersistedChatHistory: Codable {
    let personaRawValue: String
    let messages: [ChatMessage]
}

struct RootView: View {
    @StateObject private var store = AppStore()
    @StateObject private var subscriptionManager = SubscriptionManager()
    @State private var didReportLaunch = false

    var body: some View {
        ZStack(alignment: .bottom) {
            renderScreen

            if let activeTab = store.activeMainTab {
                BottomNav(active: activeTab, onNav: store.navToMain)
                    .zIndex(10)
            }

        }
        .environmentObject(store)
        .environmentObject(subscriptionManager)
        .task {
            if !didReportLaunch {
                didReportLaunch = true
                AnalyticsTracker.shared.reportAppLaunch()
            }
            await subscriptionManager.start()
            store.isPaid = subscriptionManager.isPro
        }
        .onChange(of: subscriptionManager.currentPlan) {
            store.isPaid = subscriptionManager.isPro
        }
    }

    @ViewBuilder
    private var renderScreen: some View {
        switch store.screen {
        case .onboard1:
            OnboardScreen1 { store.navigate(.onboard2) }
        case .onboard2:
            OnboardScreen2 { store.navigate(.onboard3) }
        case .onboard3:
            OnboardScreen3 { store.navigate(.onboard4) }
        case .onboard4:
            OnboardScreen4 { store.completeCheckin(moodIdx: $0, fromOnboarding: true) }
        case .onboard5:
            OnboardScreen5 { store.navigate(.home) }
        case .home:
            HomeScreen(forceEmpty: false)
        case .homeEmpty:
            HomeScreen(forceEmpty: true)
        case .checkin:
            CheckinScreen()
        case .checkinDone:
            CheckinDoneScreen()
        case .checkinDoneLow:
            CheckinDoneLowScreen()
        case .aiPersona:
            PersonaSelectScreen()
        case .aiChat:
            if store.aiPersona == nil {
                PersonaSelectScreen()
            } else {
                AIChatScreen()
            }
        case .journal:
            JournalScreen()
        case .journalAdd:
            JournalAddScreen()
        case .journalDetail:
            if let entry = store.detailEntry {
                JournalDetailScreen(entry: entry)
            } else {
                JournalScreen()
            }
        case .stats:
            StatsScreen()
        case .statsUnlocked:
            StatsUnlockedScreen()
        case .capsuleRecord:
            CapsuleRecordScreen()
        case .capsuleView:
            CapsuleViewScreen()
        case .meds:
            MedsScreen()
        case .report:
            ReportScreen()
        case .subscribe:
            SubscribeScreen()
        case .crisis:
            CrisisScreen()
        case .more:
            MoreScreen()
        case .notifications:
            NotificationsScreen()
        case .theme:
            ThemeScreen()
        case .export:
            ExportScreen()
        case .logoutConfirm:
            LogoutConfirmScreen()
        }
    }
}
