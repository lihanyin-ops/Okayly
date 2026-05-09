import SwiftUI

extension Color {
    static func hex(_ hex: String, opacity: Double = 1) -> Color {
        var value = hex.trimmingCharacters(in: CharacterSet.alphanumerics.inverted)
        if value.count == 3 {
            value = value.map { "\($0)\($0)" }.joined()
        }
        var int: UInt64 = 0
        Scanner(string: value).scanHexInt64(&int)
        let r = Double((int >> 16) & 0xFF) / 255
        let g = Double((int >> 8) & 0xFF) / 255
        let b = Double(int & 0xFF) / 255
        return Color(.sRGB, red: r, green: g, blue: b, opacity: opacity)
    }

    static let mwPrimary = Color.hex("587B67")
    static let mwPrimaryDark = Color.hex("3D6653")
    static let mwIcon = Color.hex("6FAE82")
    static let mwIconSurface = Color.hex("E7F2EC")
    static let mwBackground = Color.hex("F0F7F3")
    static let mwCard = Color.white.opacity(0.82)
    static let mwMuted = Color.hex("799082")
    static let mwText = Color.hex("2D3A32")
    static let mwSoft = Color.hex("E4EFE9")
    static let mwDanger = Color.hex("B35A43")
}

extension Font {
    static func serif(_ size: CGFloat, weight: Font.Weight = .semibold) -> Font {
        .custom("Noto Serif SC", size: size).weight(weight)
    }

    static func sans(_ size: CGFloat, weight: Font.Weight = .regular) -> Font {
        .custom("Noto Sans SC", size: size).weight(weight)
    }
}

extension LinearGradient {
    static let morandi = LinearGradient(colors: [.hex("E5F0EA"), .hex("D4E5D9"), .hex("C6D6CC")], startPoint: .topLeading, endPoint: .bottomTrailing)
    static let warm = LinearGradient(colors: [.hex("F2F7F4"), .hex("E4EFE8")], startPoint: .topLeading, endPoint: .bottomTrailing)
}

extension View {
    func glassCard(radius: CGFloat = 22) -> some View {
        self
            .background(.white.opacity(0.72), in: RoundedRectangle(cornerRadius: radius, style: .continuous))
            .overlay(RoundedRectangle(cornerRadius: radius, style: .continuous).stroke(.white.opacity(0.45), lineWidth: 1))
    }

    func primaryButtonStyle(disabled: Bool = false) -> some View {
        self
            .font(.sans(16, weight: .semibold))
            .foregroundStyle(.white)
            .frame(maxWidth: .infinity)
            .padding(.vertical, 15)
            .background(disabled ? Color.hex("CBD8D0") : Color.mwPrimary, in: RoundedRectangle(cornerRadius: 18, style: .continuous))
    }
}
