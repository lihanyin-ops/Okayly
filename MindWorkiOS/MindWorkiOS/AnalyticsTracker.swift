import Foundation
import UIKit

final class AnalyticsTracker: Sendable {
    static let shared = AnalyticsTracker()

    private static let userIdKey = "Okayly_analytics_user_id"
    private static let endpoint = "https://ultraserverpro.10m.com.cn/base-service/api/v1/analyze/report/batch"

    private let userId: String
    private let deviceId: String
    private let session: URLSession

    private init() {
        let defaults = UserDefaults.standard
        if let stored = defaults.string(forKey: Self.userIdKey) {
            userId = stored
        } else {
            let generated = UUID().uuidString.replacingOccurrences(of: "-", with: "")
            defaults.set(generated, forKey: Self.userIdKey)
            userId = generated
        }

        deviceId = UIDevice.current.identifierForVendor?.uuidString ?? UUID().uuidString

        let config = URLSessionConfiguration.default
        config.timeoutIntervalForRequest = 15
        session = URLSession(configuration: config)
    }

    var currentUserID: String {
        userId
    }

    func reportAppLaunch() {
        let event = makeEvent(name: "app_launch")
        send(events: [event])
    }

    func reportPayment(money: String = "8.00") {
        let extraDict: [String: String] = ["payType": "买断制", "payMoney": money]
        let extraString = (try? JSONSerialization.data(withJSONObject: extraDict))
            .flatMap { String(data: $0, encoding: .utf8) }
        let event = makeEvent(name: "pay", extra: extraString)
        send(events: [event])
    }

    private func makeEvent(name: String, extra: String? = nil) -> [String: Any?] {
        let formatter = DateFormatter()
        formatter.dateFormat = "yyyy-MM-dd HH:mm:ss"
        formatter.locale = Locale(identifier: "en_US_POSIX")
        return [
            "event": name,
            "eventTime": formatter.string(from: Date()),
            "extra": extra
        ]
    }

    private func localizedAppName() -> String {
        Bundle.main.localizedInfoDictionary?["CFBundleDisplayName"] as? String
            ?? Bundle.main.infoDictionary?["CFBundleDisplayName"] as? String
            ?? Bundle.main.localizedInfoDictionary?["CFBundleName"] as? String
            ?? Bundle.main.infoDictionary?["CFBundleName"] as? String
            ?? L10n.t("好好的")
    }

    private func send(events: [[String: Any?]]) {
        let device = UIDevice.current
        let version = Bundle.main.infoDictionary?["CFBundleShortVersionString"] as? String ?? "1.0.0"
        let lang = Locale.preferredLanguages.first ?? "zh-CN"

        var modelName = device.model
        var sysinfo = utsname()
        uname(&sysinfo)
        let machine = withUnsafePointer(to: &sysinfo.machine) {
            $0.withMemoryRebound(to: CChar.self, capacity: 1) { String(cString: $0) }
        }
        if !machine.isEmpty { modelName = machine }

        let body: [String: Any] = [
            "userId": userId,
            "deviceId": deviceId,
            "appName": localizedAppName(),
            "appVersion": version,
            "os": "iOS",
            "osVersion": device.systemVersion,
            "language": lang,
            "deviceMode": modelName,
            "channel": "AppStore",
            "network": "WiFi",
            "events": events
        ]

        guard let url = URL(string: Self.endpoint),
              let jsonData = try? JSONSerialization.data(withJSONObject: body) else { return }

        if let jsonString = String(data: jsonData, encoding: .utf8) {
            print("[Analytics] Sending: \(jsonString)")
        }

        var request = URLRequest(url: url)
        request.httpMethod = "POST"
        request.setValue("application/json; charset=UTF-8", forHTTPHeaderField: "Content-Type")
        request.httpBody = jsonData

        session.dataTask(with: request) { data, response, error in
            if let error {
                print("[Analytics] Report failed: \(error.localizedDescription)")
            } else if let http = response as? HTTPURLResponse {
                let body = data.flatMap { String(data: $0, encoding: .utf8) } ?? ""
                print("[Analytics] Report status: \(http.statusCode), response: \(body)")
            }
        }.resume()
    }
}
