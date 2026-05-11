import SwiftUI

struct OnboardScreen1: View {
    let onNext: () -> Void

    var body: some View {
        ZStack {
            LinearGradient.morandi.ignoresSafeArea()
            GrainOverlay(opacity: 0.5).ignoresSafeArea()
            VStack(spacing: 0) {
                AppStatusBar()
                Spacer()
                VStack(spacing: 0) {
                    Image("OnboardingIcon")
                        .resizable()
                        .scaledToFill()
                        .frame(width: 82, height: 82)
                        .clipShape(RoundedRectangle(cornerRadius: 28, style: .continuous))
                        .background(.white.opacity(0.44), in: RoundedRectangle(cornerRadius: 28, style: .continuous))
                        .overlay(RoundedRectangle(cornerRadius: 28).stroke(.white.opacity(0.55), lineWidth: 1))
                    VStack(spacing: 16) {
                        Text("有些感受，\n说不清楚，\n但它就在那里。")
                            .font(.serif(30, weight: .light))
                            .multilineTextAlignment(.center)
                            .lineSpacing(6)
                            .foregroundStyle(Color.mwText)
                        Text("这里是你的情绪空间，\n随时都可以来。")
                            .font(.sans(14, weight: .light))
                            .multilineTextAlignment(.center)
                            .lineSpacing(5)
                            .foregroundStyle(Color.hex("546D5F"))
                    }
                    .padding(.top, 34)
                }
                .padding(.horizontal, 32)
                .offset(y: 12)
                Spacer()
                VStack(spacing: 14) {
                    Button("开始", action: onNext)
                        .primaryButtonStyle()
                    Text("好好的 · 你的情绪陪伴助手")
                        .font(.sans(12))
                        .foregroundStyle(Color.mwMuted)
                }
                .padding(.horizontal, 32)
                Spacer()
                    .frame(height: 52)
            }
        }
    }
}

struct OnboardScreen2: View {
    @State private var selected: Int?
    let onNext: () -> Void

    private let goals = [
        ("chart.xyaxis.line", "了解自己的情绪规律"),
        ("bubble.left.and.bubble.right.fill", "有个地方可以说说心里话"),
        ("brain.head.profile", "学会应对负面想法"),
        ("pills.fill", "管理用药和就诊记录"),
        ("magnifyingglass", "先看看，还没想好")
    ]

    var body: some View {
        ZStack {
            LinearGradient.warm.ignoresSafeArea()
            GrainOverlay(opacity: 0.4).ignoresSafeArea()
            VStack(spacing: 0) {
                AppStatusBar()
                VStack(alignment: .leading, spacing: 0) {
                    ProgressDots(current: 1, total: 5)
                        .padding(.bottom, 30)
                    Text("告诉我们")
                        .font(.sans(12, weight: .medium))
                        .foregroundStyle(Color.mwPrimary)
                    Text("你来这里，\n最想要的是……")
                        .font(.serif(26))
                        .foregroundStyle(Color.mwText)
                        .lineSpacing(4)
                        .padding(.top, 4)
                    VStack(spacing: 12) {
                        ForEach(goals.indices, id: \.self) { index in
                            Button {
                                selected = index
                            } label: {
                                HStack(spacing: 12) {
                                    SoftIcon(system: goals[index].0, size: 18, color: selected == index ? Color.mwIcon : Color.mwMuted, frame: 24)
                                    Text(L10n.t(goals[index].1))
                                        .font(.sans(14, weight: .medium))
                                    Spacer()
                                    if selected == index {
                                        Image(systemName: "checkmark")
                                            .font(.system(size: 10, weight: .bold))
                                            .foregroundStyle(.white)
                                            .frame(width: 22, height: 22)
                                            .background(Color.mwPrimary, in: Circle())
                                    }
                                }
                                .foregroundStyle(selected == index ? Color.mwPrimaryDark : Color.mwText)
                                .padding(15)
                                .background(selected == index ? Color.mwPrimary.opacity(0.12) : .white.opacity(0.68), in: RoundedRectangle(cornerRadius: 20, style: .continuous))
                                .overlay(RoundedRectangle(cornerRadius: 20).stroke(selected == index ? Color.mwPrimary.opacity(0.55) : Color.hex("D8E4DD"), lineWidth: 1.5))
                            }
                            .buttonStyle(.plain)
                        }
                    }
                    .padding(.top, 26)
                    Spacer()
                    Button("继续", action: onNext)
                        .primaryButtonStyle(disabled: selected == nil)
                        .disabled(selected == nil)
                }
                .padding(.horizontal, 24)
                .padding(.top, 20)
                .padding(.bottom, 28)
            }
        }
    }
}

struct OnboardScreen3: View {
    let onNext: () -> Void

    var body: some View {
        ZStack {
            LinearGradient.warm.ignoresSafeArea()
            GrainOverlay(opacity: 0.4).ignoresSafeArea()
            VStack(spacing: 0) {
                AppStatusBar()
                VStack(alignment: .leading, spacing: 0) {
                    ProgressDots(current: 2, total: 5)
                        .padding(.bottom, 34)
                    SoftIcon(system: "lock.shield.fill", size: 26, color: Color.mwIcon)
                        .frame(width: 58, height: 58)
                        .background(Color.mwPrimary.opacity(0.12), in: RoundedRectangle(cornerRadius: 20))
                        .overlay(RoundedRectangle(cornerRadius: 20).stroke(Color.mwPrimary.opacity(0.28), lineWidth: 1))
                    Text("关于你的数据，\n我们想说清楚")
                        .font(.serif(26))
                        .foregroundStyle(Color.mwText)
                        .lineSpacing(5)
                        .padding(.top, 24)
                        .padding(.bottom, 24)
                    VStack(spacing: 12) {
                        privacyRow("iphone", "你的所有记录仅存储在你的设备上")
                        privacyRow("eye.slash.fill", "我们不会读取你的内容，也不会出售数据")
                        privacyRow("lock.shield.fill", "AI 对话在加密通道中进行，不用于训练模型")
                        privacyRow("trash.fill", "你可以随时一键删除所有数据")
                    }
                    Spacer()
                    Button("我明白了，继续", action: onNext)
                        .primaryButtonStyle()
                }
                .padding(.horizontal, 24)
                .padding(.top, 20)
                .padding(.bottom, 28)
            }
        }
    }

    private func privacyRow(_ icon: String, _ text: String) -> some View {
        HStack(alignment: .top, spacing: 12) {
            SoftIcon(system: icon, size: 17, color: Color.mwIcon, frame: 22)
            Text(L10n.t(text))
                .font(.sans(14))
                .foregroundStyle(Color.mwText)
                .lineSpacing(3)
            Spacer()
        }
        .padding(16)
        .glassCard(radius: 20)
    }
}

struct OnboardScreen4: View {
    @State private var selectedMood: Int?
    @State private var done = false
    let onNext: (Int) -> Void

    var body: some View {
        ZStack(alignment: .top) {
            if done, let selectedMood {
                let mood = MindWorkData.moods[selectedMood]
                MoodCompletionView(mood: mood, title: L10n.t("记录下来了"), subtitle: L10n.t("每一次打卡，都是对自己的一点关注。")) {
                    onNext(selectedMood)
                }
            } else {
                FullScreenMoodPicker(title: "现在，你感觉怎么样？", subtitle: "左右滑动 · 选择你的心情", titleTopPadding: 92) { index in
                    selectedMood = index
                    DispatchQueue.main.asyncAfter(deadline: .now() + 0.35) {
                        done = true
                    }
                }
                ProgressDots(current: 3, total: 5, light: true)
                    .padding(.horizontal, 24)
                    .padding(.top, 52)
            }
        }
    }
}

struct OnboardScreen5: View {
    @State private var selected: String?
    @State private var customHour = 8
    @State private var customMinute = 0
    @State private var confirmed = false
    let onNext: () -> Void

    private var timeLabel: String {
        if selected == "morning" { return "早上 9:00" }
        if selected == "evening" { return "晚上 9:00" }
        return "\(String(format: "%02d", customHour)):\(String(format: "%02d", customMinute))"
    }

    var body: some View {
        ZStack {
            LinearGradient.warm.ignoresSafeArea()
            GrainOverlay(opacity: 0.42).ignoresSafeArea()
            if confirmed {
                VStack(spacing: 14) {
                    SoftIcon(system: "bell.badge.fill", size: 54, color: Color.mwIcon)
                    Text(L10n.t("提醒已设置")).font(.serif(22)).foregroundStyle(Color.mwText)
                    Text("\(L10n.t("每天")) \(timeLabel) \(L10n.t("提醒你打卡"))").font(.sans(14)).foregroundStyle(Color.mwPrimaryDark)
                }
                .onAppear {
                    DispatchQueue.main.asyncAfter(deadline: .now() + 1.1, execute: onNext)
                }
            } else {
                VStack(spacing: 0) {
                    AppStatusBar()
                    VStack(alignment: .leading, spacing: 0) {
                        ProgressDots(current: 4, total: 5)
                            .padding(.bottom, 30)
                        Text("要不要让我\n每天提醒你一下？")
                            .font(.serif(26))
                            .foregroundStyle(Color.mwText)
                            .lineSpacing(5)
                        Text("养成记录习惯，更容易发现情绪规律")
                            .font(.sans(14))
                            .foregroundStyle(Color.mwMuted)
                            .padding(.top, 8)
                            .padding(.bottom, 24)
                        VStack(spacing: 12) {
                            reminderButton(id: "morning", icon: "sunrise.fill", label: "早上 9:00", sub: "开始新的一天前，记录一下")
                            reminderButton(id: "evening", icon: "moon.stars.fill", label: "晚上 9:00", sub: "睡前回顾，沉淀今天的感受")
                            reminderButton(id: "custom", icon: "gearshape.fill", label: selected == "custom" ? timeLabel : L10n.t("自定义时间"), sub: "选择最适合你的时刻")
                        }
                        if selected == "custom" {
                            customPicker
                                .padding(.top, 12)
                        }
                        Spacer()
                        VStack(spacing: 10) {
                            Button(selected == nil ? L10n.t("设置提醒") : "\(L10n.t("设置提醒")) · \(timeLabel)") {
                                confirmed = true
                            }
                            .primaryButtonStyle(disabled: selected == nil)
                            .disabled(selected == nil)
                            Button("暂时跳过", action: onNext)
                                .font(.sans(14))
                                .foregroundStyle(Color.mwMuted)
                                .frame(maxWidth: .infinity)
                                .padding(.vertical, 8)
                        }
                    }
                    .padding(.horizontal, 24)
                    .padding(.top, 20)
                    .padding(.bottom, 28)
                }
            }
        }
    }

    private func reminderButton(id: String, icon: String, label: String, sub: String) -> some View {
        Button {
            selected = id
        } label: {
            HStack(spacing: 12) {
                SoftIcon(system: icon, size: 22, color: Color.mwIcon, frame: 30)
                VStack(alignment: .leading, spacing: 3) {
                    Text(L10n.t(label)).font(.sans(14, weight: .semibold)).foregroundStyle(Color.mwText)
                    Text(L10n.t(sub)).font(.sans(12)).foregroundStyle(Color.mwMuted)
                }
                Spacer()
                if selected == id {
                    Image(systemName: "checkmark").font(.system(size: 10, weight: .bold)).foregroundStyle(.white).frame(width: 22, height: 22).background(Color.mwPrimary, in: Circle())
                }
            }
            .padding(16)
            .background(selected == id ? Color.mwPrimary.opacity(0.12) : .white.opacity(0.68), in: RoundedRectangle(cornerRadius: 20, style: .continuous))
            .overlay(RoundedRectangle(cornerRadius: 20).stroke(selected == id ? Color.mwPrimary.opacity(0.55) : Color.hex("D8E4DD"), lineWidth: 1.5))
        }
        .buttonStyle(.plain)
    }

    private var customPicker: some View {
        HStack(spacing: 14) {
            stepperColumn(value: $customHour, max: 23, step: 1)
            Text(":").font(.system(size: 26, weight: .bold)).foregroundStyle(Color.mwText)
            stepperColumn(value: $customMinute, max: 59, step: 5)
        }
        .frame(maxWidth: .infinity)
        .padding(16)
        .glassCard(radius: 20)
    }

    private func stepperColumn(value: Binding<Int>, max: Int, step: Int) -> some View {
        VStack(spacing: 8) {
            Button { value.wrappedValue = (value.wrappedValue + step) % (max + 1) } label: { Image(systemName: "chevron.up").frame(width: 32, height: 32).background(Color.hex("DFEBE4"), in: Circle()) }
            Text(String(format: "%02d", value.wrappedValue))
                .font(.system(size: 20, weight: .bold, design: .rounded))
                .foregroundStyle(Color.mwText)
                .frame(width: 56, height: 44)
                .background(Color.mwPrimary.opacity(0.12), in: RoundedRectangle(cornerRadius: 14))
            Button { value.wrappedValue = (value.wrappedValue - step + max + 1) % (max + 1) } label: { Image(systemName: "chevron.down").frame(width: 32, height: 32).background(Color.hex("DFEBE4"), in: Circle()) }
        }
        .foregroundStyle(Color.mwText)
    }
}

struct MoodCompletionView: View {
    let mood: Mood
    let title: String
    let subtitle: String
    let action: () -> Void

    var body: some View {
        ZStack {
            MoodGradient(mood: mood).ignoresSafeArea()
            GrainOverlay(opacity: 0.45).ignoresSafeArea()
            VStack(spacing: 20) {
                Image(systemName: mood.icon)
                    .font(.system(size: 66, weight: .semibold))
                    .symbolRenderingMode(.hierarchical)
                    .foregroundStyle(mood.textColor)
                Text(title)
                    .font(.serif(25))
                    .foregroundStyle(mood.textColor)
                Text(subtitle)
                    .font(.sans(14))
                    .foregroundStyle(mood.subColor)
                    .multilineTextAlignment(.center)
                    .lineSpacing(4)
                Button(action: action) {
                    Text("继续")
                        .font(.sans(16, weight: .semibold))
                        .foregroundStyle(mood.textColor)
                        .padding(.horizontal, 42)
                        .padding(.vertical, 15)
                        .background(.white.opacity(0.25), in: RoundedRectangle(cornerRadius: 18))
                        .overlay(RoundedRectangle(cornerRadius: 18).stroke(.white.opacity(0.5), lineWidth: 1.5))
                }
                .padding(.top, 8)
            }
            .padding(.horizontal, 32)
        }
    }
}
