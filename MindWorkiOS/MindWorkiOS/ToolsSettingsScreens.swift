import SwiftUI

struct CrisisScreen: View {
    @EnvironmentObject private var store: AppStore
    @State private var level: Level = .moderate
    @State private var expanded: String?

    enum Level: String, CaseIterable {
        case mild, moderate, severe
        var label: String {
            switch self {
            case .mild: "轻度低落"
            case .moderate: "持续低落"
            case .severe: "需要帮助"
            }
        }
    }

    private var isLight: Bool { level == .mild }
    private var title: String {
        switch level {
        case .mild: "你最近有些低落"
        case .moderate: "你已经撑了很久了"
        case .severe: "我们很担心你"
        }
    }
    private var subtitle: String {
        switch level {
        case .mild: "已连续 \(max(store.consecutiveLowDays, 3)) 天情绪偏低，这很正常，但我们想多关心你一下。"
        case .moderate: "连续 \(max(store.consecutiveLowDays, 3)) 天情绪低落，这段时间一定很不容易。你不需要独自承受这些。"
        case .severe: "你已经连续 \(max(store.consecutiveLowDays, 5)) 天处于很低落的状态。现在，最重要的事是让你知道：有人在乎你，有人可以帮助你。"
        }
    }

    var body: some View {
        ZStack {
            crisisBackground.ignoresSafeArea()
            GrainOverlay(opacity: 0.4).ignoresSafeArea()
            VStack(spacing: 0) {
                AppStatusBar(light: !isLight)
                ScrollView(showsIndicators: false) {
                    VStack(spacing: 16) {
                        HStack {
                            CircleIconButton(system: "chevron.left") { store.navigate(.home) }
                            Spacer()
                            HStack(spacing: 6) {
                                Circle().fill(isLight ? Color.mwDanger : .yellow.opacity(0.9)).frame(width: 8, height: 8)
                                Text("关怀模式").font(.sans(12, weight: .medium))
                            }
                            .foregroundStyle(isLight ? Color.mwDanger : .yellow.opacity(0.9))
                        }
                        VStack(spacing: 12) {
                            SoftIcon(system: level == .severe ? "hands.sparkles.fill" : level == .moderate ? "water.waves" : "cloud.rain.fill", size: 48, color: isLight ? Color.mwIcon : .white.opacity(0.92))
                            Text(L10n.t(title))
                                .font(.serif(22))
                                .foregroundStyle(isLight ? Color.mwText : .white)
                            Text(L10n.t(subtitle))
                                .font(.sans(14))
                                .foregroundStyle(isLight ? Color.mwPrimaryDark : .white.opacity(0.82))
                                .multilineTextAlignment(.center)
                                .lineSpacing(5)
                        }
                        Picker("", selection: $level) {
                            ForEach(Level.allCases, id: \.self) { Text(L10n.t($0.label)).tag($0) }
                        }
                        .pickerStyle(.segmented)
                        .tint(isLight ? Color.mwPrimary : .white)

                        if level == .mild || level == .moderate {
                            selfHelp
                        }
                        if level == .severe {
                            hotlineCard
                        }
                        emergencyCard
                        Text("你愿意记录下这些感受，本身就是一种勇气。\n我们会一直在这里。")
                            .font(.sans(12))
                            .foregroundStyle(isLight ? Color.mwMuted : .white.opacity(0.62))
                            .multilineTextAlignment(.center)
                            .lineSpacing(4)
                        Button("返回首页") { store.navigate(.home) }
                            .font(.sans(12))
                            .foregroundStyle(isLight ? Color.mwMuted : .white.opacity(0.58))
                    }
                    .padding(.horizontal, 20)
                    .padding(.bottom, 30)
                }
            }
        }
        .onAppear {
            if store.consecutiveLowDays >= 5 { level = .severe }
            else if store.consecutiveLowDays >= 3 { level = .moderate }
            else { level = .mild }
        }
    }

    private var crisisBackground: LinearGradient {
        switch level {
        case .mild: LinearGradient(colors: [.hex("D0E7E4"), .hex("BADBD0")], startPoint: .topLeading, endPoint: .bottomTrailing)
        case .moderate: LinearGradient(colors: [.hex("91B9C8"), .hex("71A9A0")], startPoint: .topLeading, endPoint: .bottomTrailing)
        case .severe: LinearGradient(colors: [.hex("7B91BE"), .hex("5D789D")], startPoint: .topLeading, endPoint: .bottomTrailing)
        }
    }

    private var selfHelp: some View {
        SectionCard {
            VStack(alignment: .leading, spacing: 6) {
                HStack(spacing: 6) {
                    SoftIcon(system: "leaf.fill", size: 12, color: Color.mwIcon)
                    Text("现在可以试试").font(.sans(12, weight: .semibold)).foregroundStyle(Color.mwPrimaryDark)
                }
                ForEach([("figure.walk", "走出去", "哪怕只是在楼道里走 5 分钟，换个环境有时能打破情绪的循环。"), ("phone.fill", "联系一个人", "不需要解释很多，就说「我最近不太好，想聊聊」。"), ("pencil.and.outline", "写下来", "把脑子里最沉重的那句话写在纸上。"), ("cup.and.saucer.fill", "照顾身体", "喝一杯热水，吃点东西。")], id: \.1) { item in
                    Button {
                        expanded = expanded == item.1 ? nil : item.1
                    } label: {
                        VStack(alignment: .leading, spacing: 4) {
                            HStack {
                                SoftIcon(system: item.0, size: 14, color: Color.mwIcon, frame: 20)
                                Text(L10n.t(item.1)).font(.sans(14, weight: .medium))
                                Spacer()
                                Image(systemName: "chevron.down").rotationEffect(.degrees(expanded == item.1 ? 180 : 0))
                            }
                            .foregroundStyle(Color.mwText)
                            if expanded == item.1 {
                                Text(L10n.t(item.2)).font(.sans(12)).foregroundStyle(Color.mwMuted).lineSpacing(3).padding(.leading, 28)
                            }
                        }
                        .padding(.vertical, 8)
                    }
                    .buttonStyle(.plain)
                }
            }
        }
    }

    private var hotlineCard: some View {
        SectionCard {
            VStack(alignment: .leading, spacing: 10) {
                HStack(spacing: 6) {
                    SoftIcon(system: "phone.fill", size: 12, color: Color.mwIcon)
                    Text("专业支持热线").font(.sans(12, weight: .semibold)).foregroundStyle(Color.mwPrimaryDark)
                }
                ForEach([("北京心理危机研究与干预中心", "010-82951332"), ("全国心理援助热线", "400-161-9995"), ("生命热线", "400-821-1215"), ("希望24热线", "400-161-9995")], id: \.0) { row in
                    HStack {
                        VStack(alignment: .leading, spacing: 2) {
                            Text(L10n.t(row.0)).font(.sans(12, weight: .medium)).foregroundStyle(Color.mwText).lineLimit(1)
                            Text(L10n.t("24小时")).font(.sans(10)).foregroundStyle(Color.mwMuted)
                        }
                        Spacer()
                        Link(row.1, destination: URL(string: "tel:\(row.1)")!)
                            .font(.sans(12, weight: .semibold))
                            .foregroundStyle(Color.mwPrimaryDark)
                            .padding(.horizontal, 10)
                            .padding(.vertical, 6)
                            .background(Color.mwPrimary.opacity(0.12), in: RoundedRectangle(cornerRadius: 12))
                    }
                }
            }
        }
    }

    private var emergencyCard: some View {
        VStack(alignment: .leading, spacing: 10) {
            Label("如果你现在很不安全", systemImage: "cross.case.fill").font(.sans(12, weight: .semibold))
            Text("请立即拨打 120 或前往最近的医院急诊，告诉他们你的感受。你的生命很重要。")
                .font(.sans(12)).lineSpacing(3)
            Link(destination: URL(string: "tel:120")!) {
                Label("拨打 120 急救", systemImage: "phone.fill")
                    .font(.sans(14, weight: .semibold))
                    .foregroundStyle(.white)
                    .frame(maxWidth: .infinity)
                    .padding(.vertical, 12)
                    .background(Color.mwDanger, in: RoundedRectangle(cornerRadius: 16))
            }
        }
        .foregroundStyle(isLight ? Color.hex("6F5632") : .yellow.opacity(0.95))
        .padding(16)
        .background((isLight ? Color.hex("EFE8C9") : Color.yellow.opacity(0.13)), in: RoundedRectangle(cornerRadius: 20))
    }
}

struct MedsScreen: View {
    @EnvironmentObject private var store: AppStore
    @State private var showAdd = false
    @State private var name = ""
    @State private var dose = ""
    @State private var time = "08:00"
    @State private var note = ""
    @State private var stock = "30"
    @State private var doseAmount = "1"
    @State private var unit = "粒"
    @State private var done: Set<String> = []
    private let units = ["粒", "毫升", "包"]

    var body: some View {
        ZStack {
            Color.mwBackground.ignoresSafeArea()
            GrainOverlay(opacity: 0.3).ignoresSafeArea()
            VStack(spacing: 0) {
                AppStatusBar()
                HeaderBar("用药提醒", trailing: AnyView(Button { showAdd.toggle() } label: { Image(systemName: "plus").foregroundStyle(.white).frame(width: 36, height: 36).background(Color.mwPrimary, in: Circle()) }.buttonStyle(.plain))) {
                    store.navigate(.home)
                }
                ScrollView {
                    VStack(alignment: .leading, spacing: 16) {
                        if showAdd { addMedCard }
                        scheduleCard
                        Text("药物列表").font(.sans(12, weight: .semibold)).foregroundStyle(Color.mwPrimaryDark)
                        ForEach(store.meds.indices, id: \.self) { index in
                            medRow(index)
                        }
                        Label("用药数据仅存储在本地，不会上传", systemImage: "lock.fill")
                            .font(.sans(12))
                            .foregroundStyle(Color.mwMuted)
                            .frame(maxWidth: .infinity)
                            .padding(12)
                            .background(Color.hex("E7F1EC"), in: RoundedRectangle(cornerRadius: 14))
                    }
                    .padding(.horizontal, 20)
                    .padding(.bottom, 30)
                }
            }
        }
    }

    private var addMedCard: some View {
        SectionCard {
            VStack(alignment: .leading, spacing: 10) {
                Text("添加新药物").font(.sans(14, weight: .semibold)).foregroundStyle(Color.mwText)
                TextField("药物名称（如：舍曲林）", text: $name).textFieldStyle(.roundedBorder)
                HStack {
                    TextField("剂量（如：50mg）", text: $dose).textFieldStyle(.roundedBorder)
                    TextField("时间", text: $time).textFieldStyle(.roundedBorder)
                }
                TextField("备注（可选，如：饭后服用）", text: $note).textFieldStyle(.roundedBorder)
                Picker("单位", selection: $unit) {
                    ForEach(units, id: \.self) { Text(L10n.t($0)).tag($0) }
                }
                .pickerStyle(.segmented)
                HStack {
                    TextField("库存数", text: $stock).keyboardType(.decimalPad).textFieldStyle(.roundedBorder)
                    TextField("每次服药数", text: $doseAmount).keyboardType(.decimalPad).textFieldStyle(.roundedBorder)
                }
                HStack {
                    Button("添加") {
                        store.addMed(name: name, dose: dose, time: time, note: note, stock: Double(stock) ?? 0, unit: unit, doseAmount: Double(doseAmount) ?? 0)
                        name = ""; dose = ""; time = "08:00"; note = ""; stock = "30"; doseAmount = "1"; unit = "粒"; showAdd = false
                    }
                    .font(.sans(14, weight: .medium)).foregroundStyle(.white).frame(maxWidth: .infinity).padding(.vertical, 10).background(Color.mwPrimary, in: RoundedRectangle(cornerRadius: 14))
                    Button("取消") { showAdd = false }
                        .font(.sans(14)).foregroundStyle(Color.mwText).frame(maxWidth: .infinity).padding(.vertical, 10).background(Color.hex("E1ECE6"), in: RoundedRectangle(cornerRadius: 14))
                }
            }
        }
    }

    private var scheduleCard: some View {
        SectionCard {
            VStack(alignment: .leading, spacing: 10) {
                HStack(spacing: 6) {
                    SoftIcon(system: "calendar", size: 12, color: Color.mwIcon)
                    Text("今日服药计划").font(.sans(12, weight: .semibold)).foregroundStyle(Color.mwPrimaryDark)
                }
                if store.meds.isEmpty {
                    Text("暂无今日服药计划\n点击右上角 + 添加药物")
                        .font(.sans(12))
                        .foregroundStyle(Color.mwMuted)
                        .frame(maxWidth: .infinity)
                        .multilineTextAlignment(.center)
                        .padding(.vertical, 8)
                } else {
                    ForEach(store.meds.flatMap { med in med.times.map { (med, $0) } }, id: \.0.id) { item in
                        let key = "\(item.0.id)-\(item.1)"
                        HStack(spacing: 10) {
                            Button {
                                let completing = !done.contains(key)
                                if completing { done.insert(key) } else { done.remove(key) }
                                store.setMedCompleted(id: item.0.id, completed: completing)
                            } label: {
                                Image(systemName: done.contains(key) ? "checkmark.circle.fill" : "circle")
                            }
                            .buttonStyle(.plain)
                            Text(item.1).font(.sans(12, weight: .medium)).foregroundStyle(Color.mwPrimaryDark)
                            Text("\(item.0.name) \(item.0.dose)").font(.sans(14)).strikethrough(done.contains(key)).foregroundStyle(done.contains(key) ? Color.mwMuted : Color.mwText)
                            Spacer()
                        }
                    }
                }
            }
        }
    }

    private func medRow(_ index: Int) -> some View {
        let med = store.meds[index]
        return SectionCard {
            VStack(alignment: .leading, spacing: 9) {
                HStack {
                    VStack(alignment: .leading, spacing: 3) {
                        Text(med.name).font(.sans(15, weight: .semibold)).foregroundStyle(Color.mwText)
                        Text("\(med.dose) · \(med.days)").font(.sans(12)).foregroundStyle(Color.mwMuted)
                    }
                    Spacer()
                    Button(med.active ? L10n.t("提醒中") : L10n.t("已暂停")) {
                        store.meds[index].active.toggle()
                    }
                    .font(.sans(12, weight: .medium))
                    .foregroundStyle(med.active ? Color.mwPrimaryDark : Color.mwMuted)
                    .padding(.horizontal, 10)
                    .padding(.vertical, 5)
                    .background((med.active ? Color.mwPrimary.opacity(0.12) : Color.hex("E1E8E4")), in: Capsule())
                }
                HStack {
                    ForEach(med.times, id: \.self) {
                        Label($0, systemImage: "bell.fill")
                            .font(.sans(11))
                            .padding(.horizontal, 8)
                            .padding(.vertical, 5)
                            .background(Color.hex("E1ECE6"), in: Capsule())
                    }
                    Spacer()
                    Text(med.stockText)
                        .font(.sans(12, weight: med.isLowStock ? .bold : .regular))
                        .foregroundStyle(med.isLowStock ? Color.mwDanger : Color.mwMuted)
                }
                if !med.note.isEmpty {
                    Label(med.note, systemImage: "note.text")
                        .font(.sans(12))
                        .foregroundStyle(Color.mwMuted)
                }
            }
            .opacity(med.active ? 1 : 0.58)
        }
    }
}

struct ReportScreen: View {
    @EnvironmentObject private var store: AppStore
    @State private var generating = false
    @State private var generated = false
    @State private var reportURL: URL?
    @State private var reportError: String?

    var body: some View {
        ZStack {
            Color.mwBackground.ignoresSafeArea()
            GrainOverlay(opacity: 0.3).ignoresSafeArea()
            VStack(spacing: 0) {
                AppStatusBar()
                HeaderBar("就诊报告") { store.navigate(.statsUnlocked) }
                ScrollView {
                    VStack(spacing: 16) {
                        if generated { generatedReport } else { reportIntro }
                    }
                    .padding(.horizontal, 20)
                    .padding(.bottom, 30)
                }
            }
            .blur(radius: store.isPaid ? 0 : 5)
            .allowsHitTesting(store.isPaid)

            if !store.isPaid {
                FrostedPaywall(title: "解锁就诊报告", desc: "生成包含情绪趋势、压力场景和用药记录的本地 PDF 报告。", features: ["近 30 天情绪趋势", "主要压力场景统计", "用药记录与依从率", "本地 PDF 导出"]) {
                    store.navigate(.subscribe)
                }
            }
        }
    }

    private var reportIntro: some View {
        VStack(spacing: 16) {
            SectionCard {
                VStack(alignment: .leading, spacing: 10) {
                    HStack(spacing: 6) {
                        SoftIcon(system: "doc.text.fill", size: 12, color: Color.mwIcon)
                        Text("报告将包含").font(.sans(12, weight: .semibold)).foregroundStyle(Color.mwPrimaryDark)
                    }
                    ForEach(["近 30 天情绪趋势折线图", "情绪低谷时间分布", "主要压力场景标签统计", "用药记录与依从率", "睡眠与情绪相关性（如有记录）", "AI 树洞对话摘要"], id: \.self) { item in
                        Label(item, systemImage: "checkmark")
                            .font(.sans(12))
                            .foregroundStyle(Color.mwText)
                    }
                }
            }
            Label("建议就诊前 1-2 天生成，确保数据最新", systemImage: "lightbulb.fill")
                .font(.sans(12))
                .foregroundStyle(Color.hex("6F5632"))
                .padding(13)
                .frame(maxWidth: .infinity, alignment: .leading)
                .background(Color.hex("EFE8C9").opacity(0.55), in: RoundedRectangle(cornerRadius: 14))
            Button {
                generating = true
                DispatchQueue.main.asyncAfter(deadline: .now() + 1.2) {
                    generating = false
                    generated = true
                }
            } label: {
                HStack {
                    if generating { ProgressView().tint(.white) }
                    Text(generating ? "生成中……" : "生成就诊报告")
                }
                .primaryButtonStyle(disabled: generating)
            }
            .disabled(generating)
        }
    }

    private var generatedReport: some View {
        VStack(spacing: 14) {
            SectionCard {
                VStack(alignment: .leading, spacing: 14) {
                    HStack {
                        VStack(alignment: .leading) {
                            Text("情绪健康就诊报告").font(.sans(15, weight: .semibold)).foregroundStyle(Color.mwText)
                            Text("2026年4月6日 — 5月6日").font(.sans(12)).foregroundStyle(Color.mwMuted)
                        }
                        Spacer()
                        Text("PDF 预览").font(.sans(11)).foregroundStyle(Color.mwPrimaryDark).padding(7).background(Color.mwPrimary.opacity(0.12), in: RoundedRectangle(cornerRadius: 9))
                    }
                    VStack(alignment: .leading, spacing: 6) {
                        Text("情绪趋势（近 30 天）").font(.sans(12, weight: .semibold)).foregroundStyle(Color.mwPrimaryDark)
                        HStack(alignment: .bottom, spacing: 2) {
                            ForEach(Array(MindWorkData.pixelScores.enumerated()), id: \.offset) { _, score in
                                RoundedRectangle(cornerRadius: 2).fill(MindWorkData.moods[score - 1].colors.first ?? Color.mwPrimary).frame(height: CGFloat(score) * 7)
                            }
                        }
                        .frame(height: 54, alignment: .bottom)
                    }
                    LazyVGrid(columns: [GridItem(.flexible()), GridItem(.flexible())], spacing: 8) {
                        ForEach([("平均情绪分", "4.2 / 7"), ("打卡天数", "26 / 30 天"), ("最常见压力源", "截止日 · 汇报"), ("用药依从率", "89%")], id: \.0) { item in
                            VStack(alignment: .leading, spacing: 3) {
                                Text(item.0).font(.sans(9)).foregroundStyle(Color.mwMuted)
                                Text(item.1).font(.sans(13, weight: .semibold)).foregroundStyle(Color.mwText)
                            }
                            .frame(maxWidth: .infinity, alignment: .leading)
                            .padding(10)
                            .background(Color.hex("E8F1EC"), in: RoundedRectangle(cornerRadius: 12))
                        }
                    }
                }
            }
            HStack(spacing: 12) {
                Button("下载 PDF") {
                    do {
                        let urls = try LocalExportManager.export(journalData: store.journalData, meds: store.meds, includeCSV: false, includePDF: true, includeJSON: false)
                        reportURL = urls.first
                        reportError = nil
                    } catch {
                        reportError = error.localizedDescription
                    }
                }
                .font(.sans(14, weight: .medium)).foregroundStyle(.white).frame(maxWidth: .infinity).padding(.vertical, 13).background(Color.mwPrimary, in: RoundedRectangle(cornerRadius: 18))
                Button("分享给医生") {}.font(.sans(14, weight: .medium)).foregroundStyle(Color.mwText).frame(maxWidth: .infinity).padding(.vertical, 13).background(Color.hex("E1ECE6"), in: RoundedRectangle(cornerRadius: 18))
            }
            if let reportURL {
                ShareLink(item: reportURL) {
                    Text("分享 \(reportURL.lastPathComponent)")
                        .font(.sans(12, weight: .medium))
                        .foregroundStyle(Color.mwPrimaryDark)
                }
            }
            if let reportError {
                Text("PDF 生成失败：\(reportError)")
                    .font(.sans(12))
                    .foregroundStyle(Color.mwDanger)
            }
        }
    }
}

struct CapsuleRecordScreen: View {
    @EnvironmentObject private var store: AppStore
    @State private var step = 0
    @State private var trigger = ""
    @State private var message = ""
    private let triggers = [
        ("cloud.rain.fill", "连续 3 天情绪低落时"),
        ("cloud.bolt.rain.fill", "连续 7 天情绪低落时"),
        ("calendar", "1 个月后"),
        ("calendar.badge.clock", "3 个月后"),
        ("leaf.fill", "1 年后")
    ]

    var body: some View {
        ZStack {
            LinearGradient(colors: [.hex("E5D899"), .hex("CDBB6B")], startPoint: .topLeading, endPoint: .bottomTrailing).ignoresSafeArea()
            GrainOverlay(opacity: 0.45).ignoresSafeArea()
            VStack(spacing: 0) {
                AppStatusBar()
                HeaderBar("给未来的自己") { store.navigate(.more) }
                Spacer()
                VStack(spacing: 18) {
                    SoftIcon(system: step == 4 ? "envelope.open.fill" : "envelope.fill", size: 72, color: Color.hex("3D3828"))
                    Text(step == 4 ? "信件已封存" : "给未来的自己写封信")
                        .font(.serif(24))
                        .foregroundStyle(Color.hex("3D3828"))
                    if step == 0 {
                        Text("在你状态最好的时候，录制一封信。它会在你最需要的时候，悄悄出现。").font(.sans(14)).foregroundStyle(Color.hex("5E553A")).multilineTextAlignment(.center).lineSpacing(4)
                        Button("开始写信") { step = 1 }.primaryButtonStyle()
                    } else if step == 1 {
                        VStack(spacing: 9) {
                            ForEach(triggers, id: \.1) { item in
                                Button {
                                    trigger = item.1
                                    step = 2
                                } label: {
                                    Label(item.1, systemImage: item.0)
                                        .font(.sans(14, weight: .medium))
                                        .foregroundStyle(Color.hex("3D3828"))
                                        .frame(maxWidth: .infinity)
                                        .padding(14)
                                        .background(.white.opacity(0.35), in: RoundedRectangle(cornerRadius: 17))
                                }
                            }
                        }
                    } else if step == 2 {
                        TextEditor(text: $message).scrollContentBackground(.hidden).frame(height: 170).padding(12).background(.white.opacity(0.38), in: RoundedRectangle(cornerRadius: 18)).overlay(alignment: .topLeading) { if message.isEmpty { Text("亲爱的未来的我……").font(.sans(14)).foregroundStyle(Color.hex("746949")).padding(18) } }
                        Button("封存这封信") { step = 3 }.primaryButtonStyle(disabled: message.isEmpty).disabled(message.isEmpty)
                    } else if step == 3 {
                        Text("触发条件：\(trigger)\n\n\(message)").font(.sans(14)).foregroundStyle(Color.hex("3D3828")).lineSpacing(5).frame(maxWidth: .infinity, alignment: .leading).padding(18).background(.white.opacity(0.38), in: RoundedRectangle(cornerRadius: 18))
                        Button("确认封存") { step = 4 }.primaryButtonStyle()
                    } else {
                        Text("它会在你需要的时候，悄悄出现。\n未来的你，会感谢现在的你。").font(.sans(14)).foregroundStyle(Color.hex("5E553A")).multilineTextAlignment(.center).lineSpacing(4)
                        Button("回到首页") { store.navigate(.home) }.primaryButtonStyle()
                    }
                }
                .padding(.horizontal, 24)
                Spacer()
            }
            .blur(radius: store.isPaid ? 0 : 5)
            .allowsHitTesting(store.isPaid)

            if !store.isPaid {
                capsulePaywallReminder
            }
        }
    }

    private var capsulePaywallReminder: some View {
        ZStack {
            LinearGradient(colors: [.hex("E9DC9B"), .hex("D0BE69"), .hex("BBA858")], startPoint: .topLeading, endPoint: .bottomTrailing)
                .ignoresSafeArea()
            GrainOverlay(opacity: 0.5)
                .ignoresSafeArea()

            VStack(spacing: 0) {
                AppStatusBar()
                HStack {
                Spacer()
                Button {
                    store.navigate(.more)
                } label: {
                    Image(systemName: "xmark")
                        .font(.system(size: 13, weight: .semibold))
                        .foregroundStyle(Color.hex("4D432F"))
                        .frame(width: 38, height: 38)
                        .background(.white.opacity(0.28), in: Circle())
                }
                .buttonStyle(.plain)
            }
            .padding(.horizontal, 24)
            .padding(.top, 4)

                Spacer()

                VStack(spacing: 20) {
                    SoftIcon(system: "envelope.fill", size: 80, color: Color.hex("3D3828"))
                    VStack(spacing: 10) {
                        Text("给未来的自己")
                            .font(.serif(24, weight: .semibold))
                            .foregroundStyle(Color.hex("3D3828"))
                        Text("在你状态最好的时候，录制一封信。\n它会在你最需要的时候，悄悄出现。")
                            .font(.sans(14))
                            .foregroundStyle(Color.hex("5E553A"))
                            .multilineTextAlignment(.center)
                            .lineSpacing(4)
                    }

                    VStack(alignment: .leading, spacing: 11) {
                        Text("付费版专属功能")
                            .font(.sans(12, weight: .semibold))
                            .foregroundStyle(Color.hex("4D432F"))
                        ForEach(["录制语音或文字胶囊信件", "连续高分时自动引导录制", "低谷期以「发光盲盒」形式推送"], id: \.self) { item in
                            HStack(spacing: 8) {
                                Image(systemName: "checkmark")
                                    .font(.system(size: 8, weight: .bold))
                                    .foregroundStyle(Color.hex("6E633B"))
                                    .frame(width: 18, height: 18)
                                    .background(Color.hex("A7944E").opacity(0.24), in: Circle())
                                Text(L10n.t(item))
                                    .font(.sans(12))
                                    .foregroundStyle(Color.hex("443D2B"))
                            }
                        }
                    }
                    .padding(18)
                    .frame(maxWidth: .infinity, alignment: .leading)
                    .background(Color.hex("FFF7D7").opacity(0.58), in: RoundedRectangle(cornerRadius: 20, style: .continuous))
                    .overlay(RoundedRectangle(cornerRadius: 20).stroke(Color.hex("F5E8B5").opacity(0.75), lineWidth: 1))
                }
                .padding(.horizontal, 26)

                Spacer()

                VStack(spacing: 8) {
                    Button {
                        store.navigate(.subscribe)
                    } label: {
                        Text("开始 14 天免费试用")
                            .primaryButtonStyle()
                    }
                    .buttonStyle(.plain)

                    Button("先看看别的") {
                        store.navigate(.more)
                    }
                    .font(.sans(14, weight: .medium))
                    .foregroundStyle(Color.hex("5E553A"))
                    .frame(maxWidth: .infinity)
                    .padding(.vertical, 10)
                }
                .padding(.horizontal, 26)
                .padding(.bottom, 28)
            }
        }
        .zIndex(20)
    }
}

struct CapsuleViewScreen: View {
    @EnvironmentObject private var store: AppStore
    @State private var opened = false
    var body: some View {
        ZStack {
            LinearGradient(colors: [.hex("E5D899"), .hex("CDBB6B")], startPoint: .topLeading, endPoint: .bottomTrailing).ignoresSafeArea()
            GrainOverlay(opacity: 0.45).ignoresSafeArea()
            VStack(spacing: 20) {
                SoftIcon(system: "envelope.fill", size: 84, color: Color.hex("3D3828"))
                if opened {
                    Text("42 天前 · 2026年3月25日").font(.sans(12)).foregroundStyle(Color.hex("5E553A"))
                    Text("亲爱的未来的我，\n\n今天我状态很好，刚完成了一个重要的项目。我想告诉你：无论你现在感觉怎么样，你已经走过了很多困难的时刻。\n\n如果你现在很累，请记得，你值得好好休息。\n\n爱你的，42 天前的自己")
                        .font(.serif(15, weight: .regular)).lineSpacing(5).foregroundStyle(Color.hex("3D3828")).padding(20).background(.white.opacity(0.48), in: RoundedRectangle(cornerRadius: 20))
                    Button("收好了，谢谢过去的自己") { store.navigate(.home) }.primaryButtonStyle()
                } else {
                    Text("有一封信在等你").font(.serif(24)).foregroundStyle(Color.hex("3D3828"))
                    Text("来自 42 天前的你").font(.sans(14)).foregroundStyle(Color.hex("5E553A"))
                    Button { opened = true } label: {
                        Label("打开信件", systemImage: "envelope.open.fill")
                    }
                    .primaryButtonStyle()
                }
            }
            .padding(.horizontal, 26)
        }
    }
}

struct SubscribeScreen: View {
    @EnvironmentObject private var store: AppStore
    @EnvironmentObject private var subscriptions: SubscriptionManager
    @State private var plan: SubscriptionPlan = .yearly

    var body: some View {
        if subscriptions.isPro {
            ZStack {
                LinearGradient(colors: [.hex("9CC5AE"), .hex("7CAB91")], startPoint: .topLeading, endPoint: .bottomTrailing).ignoresSafeArea()
                GrainOverlay(opacity: 0.45).ignoresSafeArea()
                VStack(spacing: 18) {
                    Image("OnboardingIcon")
                        .resizable()
                        .scaledToFill()
                        .frame(width: 86, height: 86)
                        .clipShape(RoundedRectangle(cornerRadius: 28, style: .continuous))
                        .overlay(RoundedRectangle(cornerRadius: 28).stroke(.white.opacity(0.55), lineWidth: 1))
                        .shadow(color: .black.opacity(0.08), radius: 14, y: 8)
                    Text("欢迎加入完整版").font(.serif(24)).foregroundStyle(.white)
                    Text("\(subscriptions.currentPlan.title)已生效\n所有功能现已解锁").font(.sans(14)).multilineTextAlignment(.center).foregroundStyle(.white.opacity(0.85))
                    Button("开始探索完整版 →") {
                        store.isPaid = true
                        store.navigate(.statsUnlocked)
                    }
                    .font(.sans(16, weight: .semibold)).foregroundStyle(.white).padding(.horizontal, 32).padding(.vertical, 15).background(.white.opacity(0.24), in: RoundedRectangle(cornerRadius: 18)).overlay(RoundedRectangle(cornerRadius: 18).stroke(.white.opacity(0.5), lineWidth: 1.5))
                }
            }
        } else {
            ZStack {
                LinearGradient.warm.ignoresSafeArea()
                GrainOverlay(opacity: 0.4).ignoresSafeArea()
                VStack(spacing: 0) {
                    AppStatusBar()
                    HStack { Spacer(); CircleIconButton(system: "xmark") { store.navigate(.home) } }.padding(.horizontal, 20)
                    ScrollView {
                        VStack(spacing: 18) {
                            Image("OnboardingIcon")
                                .resizable()
                                .scaledToFill()
                                .frame(width: 56, height: 56)
                                .clipShape(RoundedRectangle(cornerRadius: 18, style: .continuous))
                                .overlay(RoundedRectangle(cornerRadius: 18).stroke(.white.opacity(0.65), lineWidth: 1))
                                .shadow(color: Color.mwPrimary.opacity(0.12), radius: 10, y: 5)
                            Text("好好的完整版").font(.serif(25)).foregroundStyle(Color.mwText)
                            Text("14 天免费试用，随时可取消").font(.sans(14)).foregroundStyle(Color.mwMuted)
                            SectionCard {
                                VStack(spacing: 11) {
                                    ForEach([("bubble.left.and.bubble.right.fill", "AI 树洞无限对话"), ("chart.xyaxis.line", "深度情绪分析 + 压力源排名"), ("envelope.fill", "胶囊信件录制与接收"), ("doc.text.fill", "就诊 PDF 报告生成"), ("brain.head.profile", "CBT 卡片全库（120 条）"), ("book.closed.fill", "情绪日记永久存储"), ("paintpalette.fill", "自定义主题与图标")], id: \.1) { item in
                                        HStack {
                                            SoftIcon(system: item.0, size: 14, color: Color.mwIcon, frame: 18)
                                            Text(L10n.t(item.1)).font(.sans(14)).foregroundStyle(Color.mwText)
                                            Spacer()
                                            Image(systemName: "checkmark.circle.fill").foregroundStyle(Color.mwPrimary)
                                        }
                                    }
                                }
                            }
                            HStack(spacing: 12) {
                                planCard(plan: .yearly, fallbackPrice: "¥298", fallbackSub: "¥24.8/月", badge: "约省50%")
                                planCard(plan: .monthly, fallbackPrice: "¥42", fallbackSub: "¥42/月", badge: nil)
                            }
                            if subscriptions.isLoadingProducts {
                                ProgressView("正在连接 App Store…")
                                    .font(.sans(12))
                                    .foregroundStyle(Color.mwMuted)
                            }
                            if let message = subscriptions.lastStatusMessage {
                                Text(message)
                                    .font(.sans(12))
                                    .foregroundStyle(Color.mwPrimaryDark)
                                    .frame(maxWidth: .infinity, alignment: .leading)
                                    .padding(12)
                                    .background(Color.hex("E7F1EC"), in: RoundedRectangle(cornerRadius: 14))
                            }
                            if let error = subscriptions.lastErrorMessage {
                                Text(error)
                                    .font(.sans(12))
                                    .foregroundStyle(Color.mwDanger)
                                    .frame(maxWidth: .infinity, alignment: .leading)
                                    .padding(12)
                                    .background(Color.hex("F1D8CF").opacity(0.55), in: RoundedRectangle(cornerRadius: 14))
                            }
                            Button {
                                Task {
                                    await subscriptions.purchase(plan)
                                    store.isPaid = subscriptions.isPro
                                }
                            } label: {
                                HStack {
                                    if subscriptions.isProcessingPurchase {
                                        ProgressView().tint(.white)
                                    }
                                    Text(subscriptions.isProcessingPurchase ? "正在处理购买…" : "开始 14 天免费试用")
                                }
                                .primaryButtonStyle(disabled: subscriptions.isProcessingPurchase || subscriptions.productsByPlan[plan] == nil)
                            }
                            .disabled(subscriptions.isProcessingPurchase || subscriptions.productsByPlan[plan] == nil)
                            Button {
                                Task {
                                    await subscriptions.restorePurchases()
                                    store.isPaid = subscriptions.isPro
                                }
                            } label: {
                                HStack {
                                    if subscriptions.isRestoringPurchases {
                                        ProgressView()
                                    }
                                    Text(subscriptions.isRestoringPurchases ? "正在恢复购买…" : "恢复购买")
                                }
                                .font(.sans(14, weight: .medium))
                                .foregroundStyle(Color.mwPrimaryDark)
                                .frame(maxWidth: .infinity)
                                .padding(.vertical, 11)
                                .background(Color.mwPrimary.opacity(0.12), in: RoundedRectangle(cornerRadius: 16))
                            }
                            .disabled(subscriptions.isRestoringPurchases)
                            Text("使用 Apple App Store 支付 · 试用期结束后自动续费 · 可在 Apple ID 订阅中取消").font(.sans(12)).foregroundStyle(Color.mwMuted).multilineTextAlignment(.center)
                        }
                        .padding(.horizontal, 24)
                        .padding(.bottom, 30)
                    }
                }
            }
        }
    }

    private func planCard(plan item: SubscriptionPlan, fallbackPrice: String, fallbackSub: String, badge: String?) -> some View {
        let product = subscriptions.productsByPlan[item]
        let isSelected = plan == item
        return Button {
            plan = item
        } label: {
            ZStack(alignment: .topTrailing) {
                VStack(alignment: .leading, spacing: 4) {
                    Text(item.title).font(.sans(12, weight: .medium)).foregroundStyle(Color.mwMuted)
                    Text(product?.displayPrice ?? fallbackPrice).font(.system(size: 22, weight: .bold, design: .rounded)).foregroundStyle(Color.mwText)
                    Text(product?.description ?? L10n.t(fallbackSub))
                        .font(.sans(12))
                        .foregroundStyle(Color.mwMuted)
                        .lineLimit(2)
                        .minimumScaleFactor(0.9)
                }
                .frame(maxWidth: .infinity, maxHeight: .infinity, alignment: .leading)
                .padding(16)
                if let badge {
                    Text(L10n.t(badge))
                        .font(.sans(10, weight: .bold))
                        .foregroundStyle(.white)
                        .lineLimit(1)
                        .minimumScaleFactor(0.75)
                        .padding(.horizontal, 8)
                        .padding(.vertical, 3)
                        .background(Color.mwPrimary, in: Capsule())
                        .padding(.top, 10)
                        .padding(.trailing, 10)
                }
            }
            .frame(maxWidth: .infinity, alignment: .leading)
            .frame(height: 112)
            .background(isSelected ? Color.mwPrimary.opacity(0.12) : .white.opacity(0.78), in: RoundedRectangle(cornerRadius: 20))
            .overlay(RoundedRectangle(cornerRadius: 20).stroke(isSelected ? Color.mwPrimary.opacity(0.55) : Color.hex("D8E4DD"), lineWidth: 1.5))
        }
        .buttonStyle(.plain)
        .disabled(product == nil)
        .opacity(product == nil && !subscriptions.isLoadingProducts ? 0.55 : 1)
    }
}

struct MoreScreen: View {
    @EnvironmentObject private var store: AppStore

    private var totalCheckins: Int { store.journalData.flatMap(\.entries).count }
    private var averageMood: String {
        let scores = store.journalData.flatMap(\.entries).map { Double($0.moodIdx + 1) }
        guard !scores.isEmpty else { return "--" }
        return String(format: "%.1f", scores.reduce(0, +) / Double(scores.count))
    }
    private var longestStreak: String {
        let recordedThisWeek = store.weekMoods.filter { $0 != nil }.count
        return recordedThisWeek == 0 ? "--" : "\(recordedThisWeek)天"
    }

    private var groups: [(String, [MoreMenuItem])] {
        [
            ("健康管理", [
                MoreMenuItem(icon: "pills.fill", label: "用药提醒", desc: "管理每日服药计划", screen: .meds),
                MoreMenuItem(icon: "doc.text.fill", label: "就诊数据", desc: "导出情绪记录 · PDF / CSV / JSON", screen: .export),
                MoreMenuItem(icon: "envelope.fill", label: "给未来的自己", desc: store.isPaid ? "录制胶囊信件 · 已解锁" : "录制情感胶囊，在未来某天开启", screen: .capsuleRecord, locked: !store.isPaid)
            ]),
            ("设置", [
                MoreMenuItem(icon: "bell.fill", label: "通知偏好", desc: "打卡提醒、危机预警", screen: .notifications)
            ]),
            ("账号", [
                MoreMenuItem(icon: "sparkles", label: store.isPaid ? "管理订阅" : "升级到完整版", desc: store.isPaid ? "已订阅 · 管理或取消" : "解锁 AI 树洞无限对话、深度分析、胶囊信件", screen: .subscribe, highlight: !store.isPaid),
                MoreMenuItem(icon: "rectangle.portrait.and.arrow.right", label: "退出 / 注销账号", desc: "清除本地数据并退出", screen: .logoutConfirm, danger: true)
            ]),
            ("关于", [
                MoreMenuItem(icon: "info.circle.fill", label: "版本信息", desc: "好好的 v1.0.0", screen: nil)
            ])
        ]
    }

    var body: some View {
        ZStack(alignment: .bottom) {
            Color.mwBackground.ignoresSafeArea()
            GrainOverlay(opacity: 0.3).ignoresSafeArea()
            VStack(spacing: 0) {
                AppStatusBar()
                ScrollView {
                    VStack(alignment: .leading, spacing: 18) {
                        profileCard
                        ForEach(groups, id: \.0) { group in
                            VStack(alignment: .leading, spacing: 8) {
                                Text(L10n.t(group.0)).font(.sans(10, weight: .semibold)).foregroundStyle(Color.mwMuted).textCase(.uppercase)
                                SectionCard {
                                    VStack(spacing: 0) {
                                        ForEach(group.1.indices, id: \.self) { index in
                                            let item = group.1[index]
                                            Button {
                                                if let screen = item.screen { store.navigate(screen) }
                                            } label: {
                                                HStack(spacing: 12) {
                                                    SoftIconBadge(system: item.icon, size: 20, foreground: item.danger ? Color.mwDanger : Color.mwIcon, background: item.highlight ? Color.mwPrimary.opacity(0.16) : Color.hex("E1ECE6"))
                                                    VStack(alignment: .leading, spacing: 3) {
                                                        Text(L10n.t(item.label)).font(.sans(14, weight: .semibold)).foregroundStyle(item.danger ? Color.mwDanger : (item.highlight ? Color.mwPrimaryDark : Color.mwText))
                                                        Text(L10n.t(item.desc)).font(.sans(12)).foregroundStyle(Color.mwMuted)
                                                    }
                                                    Spacer()
                                                    if item.locked { Image(systemName: "lock.fill").font(.system(size: 12, weight: .semibold)).foregroundStyle(Color.mwMuted) }
                                                    if item.screen != nil { Image(systemName: "chevron.right").font(.system(size: 12)).foregroundStyle(Color.mwMuted) }
                                                }
                                                .padding(.vertical, 10)
                                            }
                                            .buttonStyle(.plain)
                                            if index < group.1.count - 1 { Divider().padding(.leading, 54) }
                                        }
                                    }
                                }
                            }
                        }
                    }
                    .padding(.horizontal, 20)
                    .padding(.bottom, 104)
                }
            }
        }
    }

    private var profileCard: some View {
        ZStack {
            LinearGradient(colors: [.hex("DCECE4"), .hex("C7DDCF")], startPoint: .topLeading, endPoint: .bottomTrailing)
            GrainOverlay(opacity: 0.4)
            VStack(alignment: .leading, spacing: 14) {
                HStack(spacing: 14) {
                    SoftIcon(system: "leaf.fill", size: 24, color: Color.mwIcon)
                        .frame(width: 56, height: 56)
                        .background(.white.opacity(0.34), in: RoundedRectangle(cornerRadius: 18))
                    VStack(alignment: .leading, spacing: 3) {
                        HStack(spacing: 7) {
                            Text("打卡记录").font(.serif(17, weight: .semibold)).foregroundStyle(Color.mwText)
                            if store.isPaid {
                                Label("完整版", systemImage: "sparkles")
                                    .font(.sans(10, weight: .bold))
                                    .foregroundStyle(Color.mwPrimaryDark)
                                    .padding(.horizontal, 7)
                                    .padding(.vertical, 3)
                                    .background(Color.mwPrimary.opacity(0.18), in: Capsule())
                            }
                        }
                        Text("\(L10n.t("已记录")) \(totalCheckins) \(L10n.t("次")) · \(L10n.t("本周平均情绪")) \(averageMood)").font(.sans(12)).foregroundStyle(Color.mwPrimaryDark.opacity(0.8))
                    }
                }
                HStack(spacing: 10) {
                    profileStat("打卡次数", "\(totalCheckins)")
                    profileStat("平均情绪", averageMood)
                    profileStat("本周记录", longestStreak)
                }
            }
            .padding(18)
        }
        .clipShape(RoundedRectangle(cornerRadius: 24, style: .continuous))
    }

    private func profileStat(_ label: String, _ value: String) -> some View {
        VStack(spacing: 2) {
            Text(value).font(.sans(17, weight: .bold)).foregroundStyle(Color.mwText)
            Text(L10n.t(label)).font(.sans(9)).foregroundStyle(Color.mwMuted)
        }
        .frame(maxWidth: .infinity)
        .padding(.vertical, 9)
        .background(.white.opacity(0.32), in: RoundedRectangle(cornerRadius: 13))
    }
}

private struct MoreMenuItem {
    let icon: String
    let label: String
    let desc: String
    let screen: Screen?
    var highlight = false
    var danger = false
    var locked = false
}

struct NotificationsScreen: View {
    @EnvironmentObject private var store: AppStore
    @State private var daily = true
    @State private var meds = true
    @State private var summary = true
    @State private var capsule = true
    @State private var saved = false
    @State private var message = "所有提醒都只保存在本机通知中心。"

    var body: some View {
        simpleSettings(title: "通知偏好", onBack: { store.navigate(.more) }) {
            Text(L10n.t(message))
                .font(.sans(12))
                .foregroundStyle(Color.mwMuted)
                .frame(maxWidth: .infinity, alignment: .leading)
                .padding(12)
                .background(Color.hex("E7F1EC"), in: RoundedRectangle(cornerRadius: 14))
            Toggle("每日打卡提醒", isOn: $daily)
            Toggle("用药提醒", isOn: $meds)
            Toggle("午夜 AI 摘要", isOn: $summary)
            Toggle("胶囊信件开封", isOn: $capsule)
            Button(saved ? L10n.t("已保存到本地通知") : L10n.t("保存设置")) {
                Task {
                    do {
                        try await LocalNotificationManager.savePreferences(daily: daily, meds: meds, summary: summary, capsule: capsule, medItems: store.meds)
                        saved = true
                        message = "本地通知已更新。没有任何提醒设置上传到后端。"
                    } catch {
                        message = "通知保存失败：\(error.localizedDescription)"
                    }
                }
            }
            .primaryButtonStyle()
        }
    }
}

struct ThemeScreen: View {
    @EnvironmentObject private var store: AppStore
    @State private var theme = "morandi"
    var body: some View {
        simpleSettings(title: "主题切换", onBack: { store.navigate(.more) }) {
            ForEach([("morandi", "leaf.fill", "莫兰迪绿"), ("warm", "sun.max.fill", "暖沙米色"), ("dark", "moon.stars.fill", "深色夜间")], id: \.0) { item in
                Button {
                    theme = item.0
                } label: {
                    HStack {
                        SoftIcon(system: item.1, size: 14, color: Color.mwIcon, frame: 20)
                        Text(L10n.t(item.2))
                        Spacer()
                        if theme == item.0 { Image(systemName: "checkmark.circle.fill") }
                    }
                        .font(.sans(14, weight: .medium))
                        .foregroundStyle(Color.mwText)
                        .padding(14)
                        .background(theme == item.0 ? Color.mwPrimary.opacity(0.12) : Color.white.opacity(0.6), in: RoundedRectangle(cornerRadius: 16))
                }
                .buttonStyle(.plain)
            }
        }
    }
}

struct ExportScreen: View {
    @EnvironmentObject private var store: AppStore
    @State private var progress = 0.0
    @State private var exporting = false
    @State private var done = false
    @State private var csv = true
    @State private var pdf = true
    @State private var json = false
    @State private var exportedURLs: [URL] = []
    @State private var exportError: String?

    var body: some View {
        simpleSettings(title: "数据导出", onBack: { store.navigate(.more) }) {
            Text("导出在本机完成，文件保存在 App Documents / 好好的 Export。")
                .font(.sans(12))
                .foregroundStyle(Color.mwMuted)
                .frame(maxWidth: .infinity, alignment: .leading)
                .padding(12)
                .background(Color.hex("E7F1EC"), in: RoundedRectangle(cornerRadius: 14))
            Toggle("CSV 表格", isOn: $csv)
            Toggle("PDF 就诊报告", isOn: $pdf)
            Toggle("JSON 原始数据", isOn: $json)
            if done {
                SectionCard {
                    VStack(spacing: 8) {
                        SoftIcon(system: "checkmark.circle.fill", size: 32, color: Color.mwPrimary)
                        Text("导出完成").font(.sans(15, weight: .semibold))
                        Text("文件已保存到本机 Documents / 好好的 Export")
                            .font(.sans(12))
                            .foregroundStyle(Color.mwMuted)
                        ForEach(exportedURLs, id: \.self) { url in
                            Text(url.lastPathComponent)
                                .font(.sans(11))
                                .foregroundStyle(Color.mwPrimaryDark)
                                .frame(maxWidth: .infinity, alignment: .leading)
                        }
                        if let first = exportedURLs.first {
                            ShareLink(item: first) {
                                Text("分享第一个导出文件")
                                    .font(.sans(13, weight: .medium))
                                    .foregroundStyle(.white)
                                    .frame(maxWidth: .infinity)
                                    .padding(.vertical, 11)
                                    .background(Color.mwPrimary, in: RoundedRectangle(cornerRadius: 15))
                            }
                        }
                    }
                }
            } else if let exportError {
                Text(exportError)
                    .font(.sans(12))
                    .foregroundStyle(Color.mwDanger)
                    .padding(12)
                    .frame(maxWidth: .infinity, alignment: .leading)
                    .background(Color.hex("F1D8CF").opacity(0.5), in: RoundedRectangle(cornerRadius: 14))
            } else if exporting {
                SectionCard {
                    VStack(alignment: .leading, spacing: 8) {
                        HStack { Text("正在生成文件…").font(.sans(14)); Spacer(); Text("\(Int(progress))%").font(.sans(12, weight: .semibold)).foregroundStyle(Color.mwPrimary) }
                        ProgressView(value: progress, total: 100).tint(Color.mwPrimary)
                    }
                }
            } else {
                Button {
                    exporting = true
                    exportError = nil
                    exportedURLs = []
                    progress = 0
                    let journalSnapshot = store.journalData
                    let medsSnapshot = store.meds
                    Timer.scheduledTimer(withTimeInterval: 0.08, repeats: true) { timer in
                        progress += 8
                        if progress >= 100 {
                            timer.invalidate()
                            do {
                                exportedURLs = try LocalExportManager.export(journalData: journalSnapshot, meds: medsSnapshot, includeCSV: csv, includePDF: pdf, includeJSON: json)
                                done = true
                            } catch {
                                exportError = "导出失败：\(error.localizedDescription)"
                            }
                            exporting = false
                        }
                    }
                } label: {
                    Label(L10n.t("开始导出"), systemImage: "square.and.arrow.up.fill")
                }
                .disabled(!csv && !pdf && !json)
                .primaryButtonStyle()
            }
        }
    }
}

struct LogoutConfirmScreen: View {
    @EnvironmentObject private var store: AppStore
    @State private var step = 0
    @State private var text = ""
    private let word = "确认注销"

    var body: some View {
        if step == 2 {
            ZStack {
                Color.mwBackground.ignoresSafeArea()
                GrainOverlay(opacity: 0.3).ignoresSafeArea()
                VStack(spacing: 16) {
                    SoftIcon(system: "leaf.fill", size: 48, color: Color.mwIcon)
                    Text("数据已清除").font(.serif(20)).foregroundStyle(Color.mwText)
                    Text("你的所有本地数据已安全删除。\n如果有一天你想回来，我们还在这里。").font(.sans(14)).multilineTextAlignment(.center).foregroundStyle(Color.mwMuted)
                    Button("回到开始") { store.resetAll() }.primaryButtonStyle()
                }
                .padding(.horizontal, 32)
            }
        } else {
            simpleSettings(title: "退出 / 注销账号", onBack: { store.navigate(.more) }) {
                if step == 0 {
                    VStack(alignment: .leading, spacing: 8) {
                        Label("注销前请确认", systemImage: "exclamationmark.triangle.fill")
                            .font(.sans(15, weight: .semibold))
                            .foregroundStyle(Color.mwDanger)
                        ForEach(["所有情绪打卡记录", "情绪日记和备注", "AI 树洞对话历史", "胶囊信件", "用药提醒设置"], id: \.self) {
                            Label(L10n.t($0), systemImage: "xmark")
                                .font(.sans(12))
                                .foregroundStyle(Color.mwDanger)
                        }
                    }
                    .padding(16)
                    .background(Color.hex("F1D8CF").opacity(0.5), in: RoundedRectangle(cornerRadius: 20))
                    Button("我了解风险，继续注销") { step = 1 }.font(.sans(14, weight: .semibold)).foregroundStyle(.white).frame(maxWidth: .infinity).padding(.vertical, 13).background(Color.mwDanger, in: RoundedRectangle(cornerRadius: 18))
                } else {
                    Text("请在下方输入「\(word)」\n以确认你的操作").font(.sans(14)).multilineTextAlignment(.center).foregroundStyle(Color.mwMuted)
                    TextField("输入「\(word)」", text: $text).font(.sans(14)).multilineTextAlignment(.center).textFieldStyle(.roundedBorder)
                    Button(text == word ? L10n.t("确认注销所有数据") : L10n.t("请先输入确认文字")) {
                        if text == word { step = 2 }
                    }
                    .font(.sans(14, weight: .semibold)).foregroundStyle(text == word ? .white : Color.mwMuted).frame(maxWidth: .infinity).padding(.vertical, 13).background(text == word ? Color.mwDanger : Color.hex("D7E1DC"), in: RoundedRectangle(cornerRadius: 18))
                }
            }
        }
    }
}

private func simpleSettings<Content: View>(title: String, onBack: @escaping () -> Void, @ViewBuilder content: () -> Content) -> some View {
    ZStack {
        Color.mwBackground.ignoresSafeArea()
        GrainOverlay(opacity: 0.3).ignoresSafeArea()
        VStack(spacing: 0) {
            AppStatusBar()
            HeaderBar(title, onBack: onBack)
            ScrollView {
                VStack(spacing: 14) {
                    content()
                }
                .padding(.horizontal, 20)
                .padding(.bottom, 30)
            }
        }
    }
}
