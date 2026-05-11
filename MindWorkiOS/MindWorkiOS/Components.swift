import SwiftUI

struct GrainOverlay: View {
    var opacity: Double = 0.35

    var body: some View {
        Canvas { context, size in
            for i in 0..<180 {
                let x = CGFloat((i * 47) % 391) / 391 * size.width
                let y = CGFloat((i * 83) % 844) / 844 * size.height
                let rect = CGRect(x: x, y: y, width: 0.9, height: 0.9)
                context.fill(Path(ellipseIn: rect), with: .color(.black.opacity(opacity * 0.18)))
            }
        }
        .blendMode(.overlay)
        .allowsHitTesting(false)
    }
}

struct AppStatusBar: View {
    var light = false

    var body: some View {
        EmptyView()
    }
}

struct BottomNav: View {
    let active: NavTab
    let onNav: (NavTab) -> Void

    var body: some View {
        HStack {
            ForEach(NavTab.allCases) { item in
                Button {
                    onNav(item)
                } label: {
                    VStack(spacing: 3) {
                        Image(systemName: item.icon)
                            .font(.system(size: item == .more ? 22 : 18, weight: .semibold))
                            .frame(height: 24)
                        Text(item.label)
                            .font(.sans(10, weight: active == item ? .semibold : .regular))
                        Circle()
                            .fill(active == item ? Color.mwPrimary : .clear)
                            .frame(width: 4, height: 4)
                    }
                    .foregroundStyle(active == item ? Color.mwIcon : Color.mwMuted)
                    .frame(maxWidth: .infinity)
                    .contentShape(Rectangle())
                }
                .buttonStyle(.plain)
            }
        }
        .padding(.horizontal, 8)
        .padding(.top, 8)
        .padding(.bottom, 12)
        .frame(height: 80)
        .background(.ultraThinMaterial)
        .overlay(alignment: .top) {
            Rectangle().fill(Color.hex("DDE9E2").opacity(0.7)).frame(height: 1)
        }
    }
}

struct HeaderBar: View {
    let title: String
    var subtitle: String?
    var trailing: AnyView?
    let onBack: () -> Void

    init(_ title: String, subtitle: String? = nil, trailing: AnyView? = nil, onBack: @escaping () -> Void) {
        self.title = title
        self.subtitle = subtitle
        self.trailing = trailing
        self.onBack = onBack
    }

    var body: some View {
        HStack(spacing: 12) {
            CircleIconButton(system: "chevron.left", action: onBack)
            VStack(alignment: .leading, spacing: 2) {
                Text(L10n.t(title))
                    .font(.sans(16, weight: .semibold))
                    .foregroundStyle(Color.mwText)
                if let subtitle {
                    Text(L10n.t(subtitle))
                        .font(.sans(11))
                        .foregroundStyle(Color.mwMuted)
                }
            }
            Spacer()
            trailing
        }
        .padding(.horizontal, 20)
        .padding(.vertical, 10)
    }
}

struct CircleIconButton: View {
    var system: String
    var action: () -> Void

    var body: some View {
        Button(action: action) {
            Image(systemName: system)
                .font(.system(size: 14, weight: .semibold))
                .foregroundStyle(Color.mwIcon)
                .frame(width: 36, height: 36)
                .background(Color.mwIconSurface.opacity(0.85), in: Circle())
        }
        .buttonStyle(.plain)
    }
}

struct SoftIcon: View {
    let system: String
    var size: CGFloat = 18
    var color: Color = .mwIcon
    var frame: CGFloat? = nil

    var body: some View {
        Image(systemName: system)
            .font(.system(size: size, weight: .semibold))
            .symbolRenderingMode(.hierarchical)
            .foregroundStyle(color)
            .frame(width: frame, height: frame)
    }
}

struct SoftIconBadge: View {
    let system: String
    var size: CGFloat = 18
    var side: CGFloat = 42
    var foreground: Color = .mwIcon
    var background: Color = Color.mwIconSurface
    var cornerRadius: CGFloat = 14

    var body: some View {
        SoftIcon(system: system, size: size, color: foreground)
            .frame(width: side, height: side)
            .background(background, in: RoundedRectangle(cornerRadius: cornerRadius, style: .continuous))
    }
}

struct TagPill: View {
    let tag: String
    var selected = false
    var compact = false
    var light = false

    var body: some View {
        HStack(spacing: compact ? 4 : 6) {
            Image(systemName: MindWorkData.tagIcon(for: tag))
                .font(.system(size: compact ? 8 : 10, weight: .semibold))
            Text(L10n.t(MindWorkData.cleanTag(tag)))
                .font(.sans(compact ? 10 : 12, weight: .medium))
        }
        .foregroundStyle(selected ? .white : (light ? Color.mwIcon : Color.mwText))
        .padding(.horizontal, compact ? 8 : 12)
        .padding(.vertical, compact ? 4 : 8)
        .background(selected ? Color.mwPrimary : (light ? .white.opacity(0.4) : Color.hex("E5EFE9")), in: Capsule())
    }
}

struct ProgressDots: View {
    let current: Int
    let total: Int
    var light = false

    var body: some View {
        HStack(spacing: 6) {
            ForEach(0..<total, id: \.self) { index in
                Capsule()
                    .fill(index <= current ? (light ? .white.opacity(0.85) : Color.mwPrimary) : (light ? .white.opacity(0.3) : Color.hex("D2DFD8")))
                    .frame(height: 4)
            }
        }
    }
}

struct MoodGradient: View {
    let mood: Mood

    var body: some View {
        LinearGradient(colors: mood.colors, startPoint: .topLeading, endPoint: .bottomTrailing)
    }
}

struct MoodChip: View {
    let mood: Mood
    let selected: Bool
    let action: () -> Void

    var body: some View {
        Button(action: action) {
            VStack(spacing: 4) {
                Image(systemName: mood.icon)
                    .font(.system(size: 21, weight: .semibold))
                Text(L10n.t(mood.label))
                    .font(.sans(10, weight: .medium))
            }
            .foregroundStyle(selected ? mood.textColor : Color.mwText)
            .frame(width: 58, height: 58)
            .background {
                RoundedRectangle(cornerRadius: 18, style: .continuous)
                    .fill(Color.hex("E8F1EC").opacity(0.8))
                    .overlay {
                        if selected {
                            MoodGradient(mood: mood)
                                .clipShape(RoundedRectangle(cornerRadius: 18, style: .continuous))
                        }
                    }
            }
            .overlay(RoundedRectangle(cornerRadius: 18).stroke(selected ? .white.opacity(0.5) : Color.hex("D6E3DC"), lineWidth: selected ? 1.5 : 1))
        }
        .buttonStyle(.plain)
    }
}

struct FullScreenMoodPicker: View {
    @State private var current = 3
    let title: String
    let subtitle: String
    var titleTopPadding: CGFloat = 52
    var bottomContentPadding: CGFloat = 28
    let onSelect: (Int) -> Void

    private var mood: Mood { MindWorkData.moods[current] }

    var body: some View {
        ZStack {
            MoodGradient(mood: mood).ignoresSafeArea()
            GrainOverlay(opacity: 0.42).ignoresSafeArea()
            VStack(spacing: 0) {
                VStack {
                    VStack(spacing: 4) {
                        Text(L10n.t(title))
                            .font(.serif(20))
                            .multilineTextAlignment(.center)
                            .foregroundStyle(mood.textColor)
                        Text(L10n.t(subtitle))
                            .font(.sans(14))
                            .multilineTextAlignment(.center)
                            .foregroundStyle(mood.subColor)
                    }
                    Spacer()
                    VStack(spacing: 22) {
                        Image(systemName: mood.icon)
                            .font(.system(size: 88, weight: .semibold))
                            .symbolRenderingMode(.hierarchical)
                            .foregroundStyle(.white.opacity(0.96))
                            .shadow(color: .black.opacity(0.2), radius: 18, y: 8)
                        VStack(spacing: 8) {
                            Text(L10n.t(mood.label))
                                .font(.serif(38, weight: .bold))
                                .foregroundStyle(mood.textColor)
                            Text(L10n.t(mood.desc))
                                .font(.sans(16))
                                .foregroundStyle(mood.subColor)
                        }
                    }
                    Spacer()
                    VStack(spacing: 18) {
                        HStack(spacing: 9) {
                            ForEach(0..<MindWorkData.moods.count, id: \.self) { index in
                                Button { current = index } label: {
                                    Circle()
                                        .fill(.white.opacity(current == index ? 0.95 : 0.45))
                                        .frame(width: current == index ? 10 : 7, height: current == index ? 10 : 7)
                                }
                            }
                        }
                        Button { onSelect(current) } label: {
                            Text(L10n.t("就是这个感觉"))
                                .font(.sans(16, weight: .semibold))
                                .foregroundStyle(mood.textColor)
                                .frame(maxWidth: .infinity)
                                .padding(.vertical, 15)
                                .background(.white.opacity(0.24), in: RoundedRectangle(cornerRadius: 18, style: .continuous))
                                .overlay(RoundedRectangle(cornerRadius: 18).stroke(.white.opacity(0.5), lineWidth: 1.5))
                        }
                        HStack(spacing: 12) {
                            Button { current = max(0, current - 1) } label: { Image(systemName: "chevron.left").foregroundStyle(.white).frame(width: 28, height: 28).background(.white.opacity(0.2), in: Circle()) }
                            Text("← 滑动切换 →").font(.sans(12))
                            Button { current = min(6, current + 1) } label: { Image(systemName: "chevron.right").foregroundStyle(.white).frame(width: 28, height: 28).background(.white.opacity(0.2), in: Circle()) }
                        }
                        .foregroundStyle(mood.subColor)
                    }
                }
                .padding(.horizontal, 24)
                .padding(.top, titleTopPadding)
                .padding(.bottom, bottomContentPadding)
            }
        }
        .contentShape(Rectangle())
        .gesture(
            DragGesture(minimumDistance: 28).onEnded { value in
                guard abs(value.translation.width) > abs(value.translation.height), abs(value.translation.width) > 40 else { return }
                if value.translation.width < 0 {
                    current = min(MindWorkData.moods.count - 1, current + 1)
                } else {
                    current = max(0, current - 1)
                }
            }
        )
        .animation(.spring(response: 0.38, dampingFraction: 0.82), value: current)
    }
}

struct FrostedPaywall: View {
    let title: String
    let desc: String
    let features: [String]
    let onSubscribe: () -> Void

    var body: some View {
        ZStack(alignment: .bottom) {
            Rectangle()
                .fill(Color.mwBackground.opacity(0.55))
                .background(.ultraThinMaterial)
                .ignoresSafeArea()
            VStack(alignment: .leading, spacing: 14) {
                HStack(spacing: 8) {
                    SoftIcon(system: "sparkles", size: 15, color: Color.mwIcon)
                    Text(L10n.t(title)).font(.serif(17))
                }
                .foregroundStyle(Color.mwText)
                Text(L10n.t(desc))
                    .font(.sans(12))
                    .foregroundStyle(Color.mwMuted)
                    .lineSpacing(3)
                VStack(alignment: .leading, spacing: 8) {
                    ForEach(features, id: \.self) { item in
                        HStack(spacing: 8) {
                            Image(systemName: "checkmark")
                                .font(.system(size: 9, weight: .bold))
                                .frame(width: 18, height: 18)
                                .background(Color.hex("D5E8DB"), in: Circle())
                            Text(L10n.t(item))
                                .font(.sans(12))
                                .foregroundStyle(Color.mwText)
                        }
                    }
                }
                Button(action: onSubscribe) {
                    Text(L10n.t("解锁完整版 · 14天免费试用"))
                        .primaryButtonStyle()
                }
                Text("之后 ¥68/月 或 ¥398/年 · 随时取消")
                    .font(.sans(10))
                    .foregroundStyle(Color.mwMuted)
                    .frame(maxWidth: .infinity)
            }
            .padding(22)
            .background(Color.hex("F7FBF8").opacity(0.94), in: RoundedRectangle(cornerRadius: 28, style: .continuous))
            .overlay(RoundedRectangle(cornerRadius: 28).stroke(Color.hex("CDDDD3"), lineWidth: 1))
            .shadow(color: Color.mwPrimary.opacity(0.18), radius: 34, y: 12)
            .padding(.horizontal, 20)
            .padding(.bottom, 28)
        }
        .zIndex(20)
    }
}

struct PaywallCard: View {
    let title: String
    let desc: String
    let features: [String]
    let onSubscribe: () -> Void

    var body: some View {
        VStack(alignment: .leading, spacing: 14) {
            HStack(spacing: 8) {
                SoftIcon(system: "sparkles", size: 15, color: Color.mwIcon)
                    Text(L10n.t(title)).font(.serif(17))
            }
            .foregroundStyle(Color.mwText)
            Text(L10n.t(desc))
                .font(.sans(12))
                .foregroundStyle(Color.mwMuted)
                .lineSpacing(3)
            VStack(alignment: .leading, spacing: 8) {
                ForEach(features, id: \.self) { item in
                    HStack(spacing: 8) {
                        Image(systemName: "checkmark")
                            .font(.system(size: 9, weight: .bold))
                            .foregroundStyle(Color.mwPrimaryDark)
                            .frame(width: 18, height: 18)
                            .background(Color.hex("D5E8DB"), in: Circle())
                        Text(L10n.t(item))
                            .font(.sans(12))
                            .foregroundStyle(Color.mwText)
                    }
                }
            }
            Button(action: onSubscribe) {
                Text(L10n.t("解锁完整版 · 14天免费试用"))
                    .primaryButtonStyle()
            }
        }
        .padding(22)
        .background(Color.hex("F7FBF8").opacity(0.96), in: RoundedRectangle(cornerRadius: 28, style: .continuous))
        .overlay(RoundedRectangle(cornerRadius: 28).stroke(Color.hex("CDDDD3"), lineWidth: 1))
        .shadow(color: Color.mwPrimary.opacity(0.2), radius: 34, y: 12)
    }
}

struct SectionCard<Content: View>: View {
    let content: Content

    init(@ViewBuilder content: () -> Content) {
        self.content = content()
    }

    var body: some View {
        content
            .padding(16)
            .glassCard(radius: 20)
    }
}

struct FlowLayout: Layout {
    var spacing: CGFloat = 8
    var rowSpacing: CGFloat = 8

    func sizeThatFits(proposal: ProposedViewSize, subviews: Subviews, cache: inout ()) -> CGSize {
        let maxWidth = proposal.width ?? 320
        var x: CGFloat = 0
        var y: CGFloat = 0
        var rowHeight: CGFloat = 0

        for subview in subviews {
            let size = subview.sizeThatFits(.unspecified)
            if x + size.width > maxWidth, x > 0 {
                x = 0
                y += rowHeight + rowSpacing
                rowHeight = 0
            }
            x += size.width + spacing
            rowHeight = max(rowHeight, size.height)
        }
        return CGSize(width: maxWidth, height: y + rowHeight)
    }

    func placeSubviews(in bounds: CGRect, proposal: ProposedViewSize, subviews: Subviews, cache: inout ()) {
        var x = bounds.minX
        var y = bounds.minY
        var rowHeight: CGFloat = 0
        for subview in subviews {
            let size = subview.sizeThatFits(.unspecified)
            if x + size.width > bounds.maxX, x > bounds.minX {
                x = bounds.minX
                y += rowHeight + rowSpacing
                rowHeight = 0
            }
            subview.place(at: CGPoint(x: x, y: y), proposal: ProposedViewSize(size))
            x += size.width + spacing
            rowHeight = max(rowHeight, size.height)
        }
    }
}
