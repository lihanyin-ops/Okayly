import Foundation
import StoreKit

enum SubscriptionPlan: String, CaseIterable, Identifiable {
    case free
    case monthly
    case yearly

    var id: String { rawValue }

    var productID: String? {
        switch self {
        case .free: nil
        case .monthly: "com.okayly.mindwork.pro.monthly"
        case .yearly: "com.okayly.mindwork.pro.yearly"
        }
    }

    var title: String {
        switch self {
        case .free: L10n.t("免费版")
        case .monthly: L10n.t("月付")
        case .yearly: L10n.t("年付")
        }
    }

    var rank: Int {
        switch self {
        case .free: 0
        case .monthly: 1
        case .yearly: 2
        }
    }
}

@MainActor
final class SubscriptionManager: ObservableObject {
    @Published private(set) var productsByPlan: [SubscriptionPlan: Product] = [:]
    @Published private(set) var currentPlan: SubscriptionPlan = .free
    @Published private(set) var isLoadingProducts = false
    @Published private(set) var isProcessingPurchase = false
    @Published private(set) var isRestoringPurchases = false
    @Published var lastErrorMessage: String?
    @Published var lastStatusMessage: String?

    private var updatesTask: Task<Void, Never>?

    var isPro: Bool { currentPlan != .free }

    func start() async {
        if updatesTask == nil {
            updatesTask = Task { await listenForTransactions() }
        }
        await loadProducts()
        await refreshEntitlements()
    }

    func loadProducts() async {
        isLoadingProducts = true
        defer { isLoadingProducts = false }

        do {
            let ids = SubscriptionPlan.allCases.compactMap(\.productID)
            let products = try await Product.products(for: ids)
            var next: [SubscriptionPlan: Product] = [:]
            for product in products {
                if let plan = plan(for: product.id) {
                    next[plan] = product
                }
            }
            productsByPlan = next
            lastErrorMessage = next.isEmpty ? "未能加载 App Store 订阅产品，请确认 App Store Connect 或 StoreKit 配置。" : nil
        } catch {
            lastErrorMessage = "订阅产品加载失败：\(error.localizedDescription)"
        }
    }

    func purchase(_ selectedPlan: SubscriptionPlan) async {
        guard let product = productsByPlan[selectedPlan] else {
            lastErrorMessage = "当前订阅产品不可用。"
            return
        }

        isProcessingPurchase = true
        defer { isProcessingPurchase = false }

        do {
            let result = try await product.purchase()
            switch result {
            case .success(let verification):
                let transaction = try checkVerified(verification)
                currentPlan = plan(for: transaction.productID) ?? .free
                lastStatusMessage = "购买成功，完整版已解锁。"
                AnalyticsTracker.shared.reportPayment(money: product.displayPrice)
                await transaction.finish()
                await refreshEntitlements()
            case .pending:
                lastStatusMessage = "购买正在等待确认，完成后会自动解锁。"
            case .userCancelled:
                lastStatusMessage = "已取消购买。"
            @unknown default:
                lastStatusMessage = "购买状态未知，请稍后重试。"
            }
        } catch {
            lastErrorMessage = "购买失败：\(error.localizedDescription)"
        }
    }

    func restorePurchases() async {
        isRestoringPurchases = true
        defer { isRestoringPurchases = false }

        do {
            try await StoreKit.AppStore.sync()
            await refreshEntitlements()
            lastStatusMessage = currentPlan == .free ? "没有找到有效订阅。" : "购买已恢复。"
        } catch {
            lastErrorMessage = "恢复购买失败：\(error.localizedDescription)"
        }
    }

    func refreshEntitlements() async {
        var active: [(SubscriptionPlan, Transaction)] = []

        for await result in Transaction.currentEntitlements {
            guard let transaction = try? checkVerified(result),
                  let plan = plan(for: transaction.productID),
                  isActive(transaction) else {
                continue
            }
            active.append((plan, transaction))
        }

        currentPlan = resolvePlan(from: active)
    }

    private func listenForTransactions() async {
        for await result in Transaction.updates {
            do {
                let transaction = try checkVerified(result)
                if isActive(transaction), let plan = plan(for: transaction.productID) {
                    currentPlan = plan
                }
                await transaction.finish()
                await refreshEntitlements()
            } catch {
                lastErrorMessage = "交易验证失败：\(error.localizedDescription)"
            }
        }
    }

    private func resolvePlan(from active: [(SubscriptionPlan, Transaction)]) -> SubscriptionPlan {
        guard !active.isEmpty else { return .free }
        return active.sorted { lhs, rhs in
            let lhsDate = lhs.1.expirationDate ?? .distantFuture
            let rhsDate = rhs.1.expirationDate ?? .distantFuture
            if lhsDate == rhsDate { return lhs.0.rank > rhs.0.rank }
            return lhsDate > rhsDate
        }.first?.0 ?? .free
    }

    private func isActive(_ transaction: Transaction) -> Bool {
        if transaction.revocationDate != nil { return false }
        if transaction.isUpgraded { return false }
        if let expirationDate = transaction.expirationDate, expirationDate <= Date() { return false }
        return true
    }

    private func plan(for productID: String) -> SubscriptionPlan? {
        SubscriptionPlan.allCases.first { $0.productID == productID }
    }

    private func checkVerified<T>(_ result: VerificationResult<T>) throws -> T {
        switch result {
        case .unverified:
            throw StoreKitError.failedVerification
        case .verified(let value):
            return value
        }
    }
}

enum StoreKitError: LocalizedError {
    case failedVerification

    var errorDescription: String? {
        switch self {
        case .failedVerification:
            "交易未通过 App Store 验证。"
        }
    }
}
