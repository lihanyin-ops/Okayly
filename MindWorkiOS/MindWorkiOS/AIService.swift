import Foundation

struct AIChatRequestMessage: Codable {
    let role: String
    let content: String
}

enum AIServiceError: LocalizedError {
    case badURL
    case emptyResponse
    case server(String)

    var errorDescription: String? {
        switch self {
        case .badURL:
            "AI 服务地址无效。"
        case .emptyResponse:
            "AI 没有返回有效内容。"
        case .server(let message):
            message
        }
    }
}

final class AIService {
    static let shared = AIService()

    private let baseURL = "http://sub2api.10m.com.cn/v1"
    private let apiKey = "sk-028939a18082f577ca9d7ecca8630771eb7385f685945e8ca140c34d4a1e6bab"
    private let model = "qwen-turbo"

    private init() {}

    func complete(messages: [AIChatRequestMessage], maxTokens: Int = 512) async throws -> String {
        guard let url = URL(string: "\(baseURL)/chat/completions") else {
            throw AIServiceError.badURL
        }

        let requestBody = ChatCompletionRequest(
            model: model,
            messages: messages,
            stream: false,
            maxTokens: maxTokens
        )

        var request = URLRequest(url: url)
        request.httpMethod = "POST"
        request.setValue("Bearer \(apiKey)", forHTTPHeaderField: "Authorization")
        request.setValue("application/json", forHTTPHeaderField: "Content-Type")
        request.timeoutInterval = 45
        request.httpBody = try JSONEncoder.api.encode(requestBody)

        let (data, response) = try await URLSession.shared.data(for: request)
        if let http = response as? HTTPURLResponse, !(200..<300).contains(http.statusCode) {
            if let error = try? JSONDecoder.api.decode(APIErrorResponse.self, from: data) {
                throw AIServiceError.server(error.error.message)
            }
            throw AIServiceError.server("AI 请求失败（\(http.statusCode)）。")
        }

        let decoded = try JSONDecoder.api.decode(ChatCompletionResponse.self, from: data)
        guard let content = decoded.choices.first?.message.content.trimmingCharacters(in: .whitespacesAndNewlines), !content.isEmpty else {
            throw AIServiceError.emptyResponse
        }
        return content
    }

    func chatReply(persona: Persona, history: [ChatMessage], recentEmotionContext: String? = nil) async throws -> String {
        var requestMessages = [AIChatRequestMessage(role: "system", content: persona.systemPrompt)]
        if let recentEmotionContext, !recentEmotionContext.isEmpty {
            requestMessages.append(AIChatRequestMessage(role: "system", content: """
            以下是用户今日和近 3 天的本地打卡情绪记录与日记摘要，仅作为理解用户近期状态的背景：
            \(recentEmotionContext)

            使用要求：
            1. 根据这些近期情绪线索更有针对性地共情和提问。
            2. 不要逐条复述记录，不要暴露“我读取了你的数据”的机械表达。
            3. 仍然遵守 100 字以内、非诊断、不建议现实决策、以开放式问题收尾的规则。
            """))
        }
        requestMessages += history.suffix(14).map {
            AIChatRequestMessage(role: $0.role == "user" ? "user" : "assistant", content: $0.text)
        }
        let reply = try await complete(messages: requestMessages, maxTokens: 180)
        return constrainedChatReply(reply)
    }

    func journalSummary(from messages: [ChatMessage]) async throws -> String {
        let transcript = messages
            .filter { $0.role == "user" || $0.role == "ai" }
            .map { "\($0.role == "user" ? "用户" : "AI")：\($0.text)" }
            .joined(separator: "\n")

        let prompt = """
        请基于以下当天情绪树洞对话，为用户生成一段适合放进情绪日记的中文摘要。
        要求：
        1. 80 到 140 字。
        2. 温柔、客观、不诊断。
        3. 总结主要情绪、压力来源和一个可执行的照顾自己的建议。
        4. 不要使用列表，不要提到你是 AI。

        对话：
        \(transcript)
        """

        return try await complete(messages: [
            AIChatRequestMessage(role: "system", content: "你是「好好的」的情绪日记摘要助手，只输出可直接展示给用户的摘要正文。"),
            AIChatRequestMessage(role: "user", content: prompt)
        ], maxTokens: 260)
    }

    private func constrainedChatReply(_ text: String) -> String {
        let fallbackQuestion = "你愿意多说一点吗？"
        var result = text
            .replacingOccurrences(of: "\n", with: " ")
            .trimmingCharacters(in: .whitespacesAndNewlines)

        let bannedPhrases = ["加油", "一切都会好的", "一切都会好起来的", "往好处想", "别难过", "看开点", "明天会更好"]
        for phrase in bannedPhrases {
            result = result.replacingOccurrences(of: phrase, with: "")
        }
        while result.contains("  ") {
            result = result.replacingOccurrences(of: "  ", with: " ")
        }

        if result.count > 100 {
            result = String(result.prefix(100)).trimmingCharacters(in: .whitespacesAndNewlines)
        }

        guard !containsQuestion(result) else { return result }

        let bodyLimit = max(0, 100 - fallbackQuestion.count)
        let body = String(result.prefix(bodyLimit))
            .trimmingCharacters(in: .whitespacesAndNewlines)
            .trimmingCharacters(in: CharacterSet(charactersIn: "。！？!?，,；;：:、. "))
        return "\(body)\(fallbackQuestion)"
    }

    private func containsQuestion(_ text: String) -> Bool {
        text.contains("？") || text.contains("?")
    }
}

private struct ChatCompletionRequest: Codable {
    let model: String
    let messages: [AIChatRequestMessage]
    let stream: Bool
    let maxTokens: Int

    enum CodingKeys: String, CodingKey {
        case model, messages, stream
        case maxTokens = "max_tokens"
    }
}

private struct ChatCompletionResponse: Codable {
    let choices: [Choice]

    struct Choice: Codable {
        let message: AIChatRequestMessage
    }
}

private struct APIErrorResponse: Codable {
    let error: APIError

    struct APIError: Codable {
        let message: String
    }
}

private extension JSONEncoder {
    static var api: JSONEncoder {
        JSONEncoder()
    }
}

private extension JSONDecoder {
    static var api: JSONDecoder {
        JSONDecoder()
    }
}
