import Foundation
import SwiftUI
import UIKit
import UserNotifications

enum LocalNotificationManager {
    static func savePreferences(daily: Bool, meds: Bool, summary: Bool, capsule: Bool, medItems: [Med]) async throws {
        let center = UNUserNotificationCenter.current()
        let granted = try await center.requestAuthorization(options: [.alert, .badge, .sound])
        guard granted else { return }

        center.removePendingNotificationRequests(withIdentifiers: [
            "mindwork.daily.checkin",
            "mindwork.summary.midnight",
            "mindwork.capsule.open"
        ])
        center.removePendingNotificationRequests(withIdentifiers: medItems.flatMap { med in med.times.map { "mindwork.med.\(med.id).\($0)" } })

        if daily {
            try await schedule(identifier: "mindwork.daily.checkin", title: L10n.t("好好的"), body: L10n.t("今天，你感觉怎么样？来记录一下。"), hour: 21, minute: 0, repeats: true)
        }
        if summary {
            try await schedule(identifier: "mindwork.summary.midnight", title: "今日 AI 摘要", body: "今天的情绪摘要已经准备好。", hour: 0, minute: 5, repeats: true)
        }
        if capsule {
            try await schedule(identifier: "mindwork.capsule.open", title: "给未来的自己", body: "有一封过去的信在等你。", hour: 9, minute: 30, repeats: false)
        }
        if meds {
            for med in medItems where med.active {
                for time in med.times {
                    let parts = time.split(separator: ":").compactMap { Int($0) }
                    guard parts.count == 2 else { continue }
                    try await schedule(identifier: "mindwork.med.\(med.id).\(time)", title: "用药提醒", body: "\(med.name) \(med.dose) · 每次 \(med.doseAmount.cleanText) \(med.unit)", hour: parts[0], minute: parts[1], repeats: true)
                }
            }
        }
    }

    private static func schedule(identifier: String, title: String, body: String, hour: Int, minute: Int, repeats: Bool) async throws {
        let content = UNMutableNotificationContent()
        content.title = title
        content.body = body
        content.sound = .default

        var components = DateComponents()
        components.hour = hour
        components.minute = minute
        let trigger = UNCalendarNotificationTrigger(dateMatching: components, repeats: repeats)
        let request = UNNotificationRequest(identifier: identifier, content: content, trigger: trigger)
        try await UNUserNotificationCenter.current().add(request)
    }
}

enum LocalExportManager {
    static func export(journalData: [JournalDay], meds: [Med], includeCSV: Bool, includePDF: Bool, includeJSON: Bool) throws -> [URL] {
        let folder = try exportFolder()
        var urls: [URL] = []

        if includeCSV {
            let url = folder.appending(path: "mindwork-mood-records.csv")
            try csv(journalData: journalData).write(to: url, atomically: true, encoding: .utf8)
            urls.append(url)
        }

        if includeJSON {
            let url = folder.appending(path: "mindwork-export.json")
            let payload = exportPayload(journalData: journalData, meds: meds)
            let data = try JSONSerialization.data(withJSONObject: payload, options: [.prettyPrinted, .sortedKeys])
            try data.write(to: url, options: .atomic)
            urls.append(url)
        }

        if includePDF {
            let url = folder.appending(path: "mindwork-clinical-report.pdf")
            try writeReportPDF(to: url, journalData: journalData, meds: meds)
            urls.append(url)
        }

        return urls
    }

    static func writeReportPDF(to url: URL, journalData: [JournalDay], meds: [Med]) throws {
        let pageRect = CGRect(x: 0, y: 0, width: 595, height: 842)
        let renderer = UIGraphicsPDFRenderer(bounds: pageRect)
        try renderer.writePDF(to: url) { context in
            context.beginPage()
            var y: CGFloat = 52
            draw(L10n.t("好好的情绪健康就诊报告"), at: CGPoint(x: 48, y: y), size: 24, weight: .bold)
            y += 38
            draw("生成时间：\(Date().formatted(date: .numeric, time: .shortened))", at: CGPoint(x: 48, y: y), size: 11, color: .secondaryLabel)
            y += 36

            let entries = journalData.flatMap(\.entries)
            let average = entries.isEmpty ? 0 : Double(entries.map { MindWorkData.moods[$0.moodIdx].score }.reduce(0, +)) / Double(entries.count)
            let lowCount = entries.filter { $0.moodIdx <= 1 }.count

            drawSection("核心概览", y: &y)
            draw("平均情绪分：\(String(format: "%.1f", average)) / 7", at: CGPoint(x: 64, y: y), size: 13); y += 22
            draw("打卡记录数：\(entries.count) 条", at: CGPoint(x: 64, y: y), size: 13); y += 22
            draw("低落记录数：\(lowCount) 条", at: CGPoint(x: 64, y: y), size: 13); y += 22
            draw("用药记录数：\(meds.count) 项", at: CGPoint(x: 64, y: y), size: 13); y += 34

            drawSection("近期待诊摘要", y: &y)
            let notes = entries.prefix(8).map { entry in
                "\(entry.time) \(MindWorkData.moods[entry.moodIdx].label) \(entry.tags.joined(separator: " ")) \(entry.note)"
            }
            drawMultiline(notes.isEmpty ? "暂无情绪日记记录。" : notes.joined(separator: "\n"), at: CGPoint(x: 64, y: y), width: 470, size: 12)
            y += CGFloat(max(60, notes.count * 20)) + 24

            drawSection("用药记录", y: &y)
            let medText = meds.isEmpty ? "暂无用药记录。" : meds.map { "\($0.name) \($0.dose) · 每次 \($0.doseAmount.cleanText) \($0.unit) · \($0.stockText) · \($0.times.joined(separator: ", ")) · \($0.active ? "提醒中" : "已暂停")" }.joined(separator: "\n")
            drawMultiline(medText, at: CGPoint(x: 64, y: y), width: 470, size: 12)
        }
    }

    private static func exportFolder() throws -> URL {
        let base = FileManager.default.urls(for: .documentDirectory, in: .userDomainMask)[0]
        let folder = base.appending(path: L10n.t("好好的 Export"))
        try FileManager.default.createDirectory(at: folder, withIntermediateDirectories: true)
        return folder
    }

    private static func csv(journalData: [JournalDay]) -> String {
        var lines = ["date_label,date,weekday,time,mood_score,mood_label,tags,note"]
        for day in journalData {
            for entry in day.entries {
                let mood = MindWorkData.moods[entry.moodIdx]
                lines.append([day.dateLabel, day.date, day.dayOfWeek, entry.time, "\(mood.score)", mood.label, entry.tags.joined(separator: " "), entry.note].map(escapeCSV).joined(separator: ","))
            }
        }
        return lines.joined(separator: "\n")
    }

    private static func exportPayload(journalData: [JournalDay], meds: [Med]) -> [String: Any] {
        [
            "exportedAt": ISO8601DateFormatter().string(from: Date()),
            "journalData": journalData.map { day in
                [
                    "dateLabel": day.dateLabel,
                    "date": day.date,
                    "dayOfWeek": day.dayOfWeek,
                    "avgMoodIdx": day.avgMoodIdx,
                    "count": day.count,
                    "entries": day.entries.map { entry in
                        [
                            "time": entry.time,
                            "moodIdx": entry.moodIdx,
                            "tags": entry.tags,
                            "note": entry.note,
                            "summary": entry.summary,
                            "cbtTriggered": entry.cbtTriggered
                        ] as [String: Any]
                    }
                ] as [String: Any]
            },
            "meds": meds.map { med in
                [
                    "id": med.id,
                    "name": med.name,
                    "dose": med.dose,
                    "times": med.times,
                    "days": med.days,
                    "stock": med.stock,
                    "unit": med.unit,
                    "doseAmount": med.doseAmount,
                    "note": med.note,
                    "active": med.active
                ] as [String: Any]
            }
        ]
    }

    private static func escapeCSV(_ value: String) -> String {
        "\"\(value.replacingOccurrences(of: "\"", with: "\"\""))\""
    }

    private static func drawSection(_ text: String, y: inout CGFloat) {
        draw(text, at: CGPoint(x: 48, y: y), size: 16, weight: .semibold)
        y += 26
    }

    private static func draw(_ text: String, at point: CGPoint, size: CGFloat, weight: UIFont.Weight = .regular, color: UIColor = .label) {
        let attributes: [NSAttributedString.Key: Any] = [
            .font: UIFont.systemFont(ofSize: size, weight: weight),
            .foregroundColor: color
        ]
        text.draw(at: point, withAttributes: attributes)
    }

    private static func drawMultiline(_ text: String, at point: CGPoint, width: CGFloat, size: CGFloat) {
        let attributes: [NSAttributedString.Key: Any] = [
            .font: UIFont.systemFont(ofSize: size),
            .foregroundColor: UIColor.label,
            .paragraphStyle: {
                let style = NSMutableParagraphStyle()
                style.lineSpacing = 5
                return style
            }()
        ]
        text.draw(with: CGRect(x: point.x, y: point.y, width: width, height: 360), options: [.usesLineFragmentOrigin, .usesFontLeading], attributes: attributes, context: nil)
    }
}
