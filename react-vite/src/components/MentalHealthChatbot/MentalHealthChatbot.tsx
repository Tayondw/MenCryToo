import React, { useState, useRef, useEffect } from "react";
import {
	Send,
	Bot,
	User,
	Minimize2,
	Maximize2,
	X,
	MessageCircle,
} from "lucide-react";

// Mental health resources and crisis information
const CRISIS_RESOURCES = {
	"988": "Suicide & Crisis Lifeline (US): Call or text 988",
	emergency:
		"If this is a life-threatening emergency, please call 911 or go to your nearest emergency room immediately.",
	crisis_text: "Crisis Text Line: Text HOME to 741741",
	samhsa: "SAMHSA National Helpline: 1-800-662-4357",
};

const MENTAL_HEALTH_TOPICS = [
	"anger management",
	"anxiety",
	"depression",
	"substance abuse",
	"stress management",
	"trauma",
	"relationships",
	"grief",
	"coming out",
	"suicidal thoughts",
];

// Crisis keywords that trigger immediate resources
const CRISIS_KEYWORDS = [
	"suicide",
	"kill myself",
	"end it all",
	"don't want to live",
	"harm myself",
	"hurt myself",
	"better off dead",
	"no point living",
];

const MentalHealthChatbot = () => {
	const [isOpen, setIsOpen] = useState(false);
	const [isMinimized, setIsMinimized] = useState(false);
	const [messages, setMessages] = useState([
		{
			id: 1,
			text: "Hello! I'm here to support you with mental health guidance and resources. I can help with topics like anxiety, depression, stress, relationships, and more. How are you feeling today?",
			sender: "bot",
			timestamp: new Date(),
		},
	]);
	const [inputMessage, setInputMessage] = useState("");
	const [isTyping, setIsTyping] = useState(false);
	const [conversationHistory, setConversationHistory] = useState([]);
	const messagesEndRef = useRef(null);

	const scrollToBottom = () => {
		messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
	};

	useEffect(() => {
		scrollToBottom();
	}, [messages]);

	// Check for crisis keywords
	const containsCrisisKeywords = (text) => {
		return CRISIS_KEYWORDS.some((keyword) =>
			text.toLowerCase().includes(keyword.toLowerCase()),
		);
	};

	// Generate crisis response
	const generateCrisisResponse = () => {
		return {
			id: Date.now(),
			text: `🚨 I'm concerned about what you've shared. Your safety is the most important thing right now.

**Immediate Help:**
• **Emergency: Call 911**
• **Crisis Lifeline: Call or text 988**
• **Crisis Text Line: Text HOME to 741741**

You don't have to go through this alone. These trained professionals are available 24/7 and want to help. Please reach out to them right now.

Would you like me to help you find local mental health resources or talk about coping strategies while you're waiting to connect with professional help?`,
			sender: "bot",
			timestamp: new Date(),
			isCrisis: true,
		};
	};

	// Call Claude API for mental health support
	const generateAIResponse = async (userMessage, history) => {
		try {
			const conversationContext = history
				.slice(-10)
				.map(
					(msg) =>
						`${msg.sender === "user" ? "Human" : "Assistant"}: ${msg.text}`,
				)
				.join("\n");

			const prompt = `You are a supportive mental health AI assistant for "Men Cry Too," a platform specifically designed to help men with emotional expression and mental health challenges. 

Key principles:
- Be empathetic, non-judgmental, and supportive
- Acknowledge that men can struggle with expressing emotions due to societal expectations
- Provide practical coping strategies and resources
- Encourage professional help when appropriate
- Never provide medical diagnoses or replace professional therapy
- Be mindful of male-specific mental health challenges
- Validate emotions and experiences

Available support topics: ${MENTAL_HEALTH_TOPICS.join(", ")}

Previous conversation:
${conversationContext}

Current message: "${userMessage}"

Provide a supportive, helpful response (max 300 words). Include specific coping strategies when relevant. If the person mentions severe distress, gently suggest professional resources while still providing immediate support.`;

			const response = await fetch("https://api.anthropic.com/v1/messages", {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
				},
				body: JSON.stringify({
					model: "claude-sonnet-4-20250514",
					max_tokens: 400,
					messages: [{ role: "user", content: prompt }],
				}),
			});

			const data = await response.json();
			return data.content[0].text;
		} catch (error) {
			console.error("Error calling AI:", error);
			return "I'm here to listen and support you. Sometimes I might have trouble responding, but you're not alone. Would you like me to share some helpful resources or coping strategies?";
		}
	};

	const handleSendMessage = async () => {
		if (!inputMessage.trim()) return;

		const userMessage = {
			id: Date.now(),
			text: inputMessage,
			sender: "user",
			timestamp: new Date(),
		};

		const newHistory = [...conversationHistory, userMessage];
		setMessages((prev) => [...prev, userMessage]);
		setConversationHistory(newHistory);
		setInputMessage("");
		setIsTyping(true);

		// Check for crisis keywords first
		if (containsCrisisKeywords(inputMessage)) {
			setTimeout(() => {
				const crisisResponse = generateCrisisResponse();
				setMessages((prev) => [...prev, crisisResponse]);
				setConversationHistory((prev) => [...prev, crisisResponse]);
				setIsTyping(false);
			}, 1000);
			return;
		}

		// Generate AI response
		try {
			const aiResponseText = await generateAIResponse(inputMessage, newHistory);

			setTimeout(() => {
				const aiResponse = {
					id: Date.now() + 1,
					text: aiResponseText,
					sender: "bot",
					timestamp: new Date(),
				};

				setMessages((prev) => [...prev, aiResponse]);
				setConversationHistory((prev) => [...prev, aiResponse]);
				setIsTyping(false);
			}, 1500);
		} catch {
			setTimeout(() => {
				const errorResponse = {
					id: Date.now() + 1,
					text: "I'm here to support you. Let me share some helpful coping strategies and resources while we work through this together.",
					sender: "bot",
					timestamp: new Date(),
				};

				setMessages((prev) => [...prev, errorResponse]);
				setConversationHistory((prev) => [...prev, errorResponse]);
				setIsTyping(false);
			}, 1000);
		}
	};

	const handleKeyPress = (e) => {
		if (e.key === "Enter" && !e.shiftKey) {
			e.preventDefault();
			handleSendMessage();
		}
	};

	const clearChat = () => {
		setMessages([
			{
				id: 1,
				text: "Hello! I'm here to support you with mental health guidance and resources. How are you feeling today?",
				sender: "bot",
				timestamp: new Date(),
			},
		]);
		setConversationHistory([]);
	};

	const suggestedPrompts = [
		"I'm feeling overwhelmed with stress",
		"How do I deal with anger?",
		"I'm struggling with depression",
		"Help with anxiety",
		"Relationship problems",
		"Coping with grief",
	];

	const formatTimestamp = (timestamp) => {
		return timestamp.toLocaleTimeString([], {
			hour: "2-digit",
			minute: "2-digit",
		});
	};

	// Floating chat button
	if (!isOpen) {
		return (
			<div className="fixed bottom-6 right-6 z-50">
				<button
					onClick={() => setIsOpen(true)}
					className="bg-blue-600 hover:bg-blue-700 text-white rounded-full p-4 shadow-lg transition-all duration-300 hover:scale-110"
				>
					<MessageCircle size={24} />
				</button>
				<div className="absolute -top-12 right-0 bg-gray-800 text-white text-sm px-3 py-1 rounded whitespace-nowrap opacity-0 hover:opacity-100 transition-opacity">
					Mental Health Support
				</div>
			</div>
		);
	}

	return (
		<div
			className={`fixed bottom-6 right-6 z-50 transition-all duration-300 ${
				isMinimized ? "w-80 h-12" : "w-96 h-[32rem]"
			}`}
		>
			<div className="bg-white rounded-lg shadow-2xl border border-gray-200 h-full flex flex-col">
				{/* Header */}
				<div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white p-4 rounded-t-lg flex items-center justify-between">
					<div className="flex items-center space-x-2">
						<Bot size={20} />
						<span className="font-medium">Mental Health Support</span>
					</div>
					<div className="flex items-center space-x-2">
						<button
							onClick={() => setIsMinimized(!isMinimized)}
							className="hover:bg-blue-500 p-1 rounded"
						>
							{isMinimized ? <Maximize2 size={16} /> : <Minimize2 size={16} />}
						</button>
						<button
							onClick={() => setIsOpen(false)}
							className="hover:bg-blue-500 p-1 rounded"
						>
							<X size={16} />
						</button>
					</div>
				</div>

				{!isMinimized && (
					<>
						{/* Messages */}
						<div className="flex-1 overflow-y-auto p-4 space-y-4">
							{messages.map((message) => (
								<div
									key={message.id}
									className={`flex ${
										message.sender === "user" ? "justify-end" : "justify-start"
									}`}
								>
									<div
										className={`max-w-[80%] rounded-lg p-3 ${
											message.sender === "user"
												? "bg-blue-600 text-white"
												: message.isCrisis
												? "bg-red-50 border border-red-200 text-red-900"
												: "bg-gray-100 text-gray-900"
										}`}
									>
										<div className="flex items-start space-x-2">
											{message.sender === "bot" && (
												<Bot
													size={16}
													className={`mt-1 ${
														message.isCrisis ? "text-red-600" : "text-blue-600"
													}`}
												/>
											)}
											{message.sender === "user" && (
												<User size={16} className="mt-1 text-white" />
											)}
											<div className="flex-1">
												<p className="text-sm whitespace-pre-wrap">
													{message.text}
												</p>
												<p
													className={`text-xs mt-1 ${
														message.sender === "user"
															? "text-blue-200"
															: "text-gray-500"
													}`}
												>
													{formatTimestamp(message.timestamp)}
												</p>
											</div>
										</div>
									</div>
								</div>
							))}

							{isTyping && (
								<div className="flex justify-start">
									<div className="bg-gray-100 rounded-lg p-3 max-w-[80%]">
										<div className="flex items-center space-x-2">
											<Bot size={16} className="text-blue-600" />
											<div className="flex space-x-1">
												<div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
												<div
													className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
													style={{ animationDelay: "0.1s" }}
												></div>
												<div
													className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
													style={{ animationDelay: "0.2s" }}
												></div>
											</div>
										</div>
									</div>
								</div>
							)}
							<div ref={messagesEndRef} />
						</div>

						{/* Suggested prompts (show when no messages from user) */}
						{messages.length === 1 && (
							<div className="px-4 pb-2">
								<p className="text-xs text-gray-500 mb-2">Try asking about:</p>
								<div className="flex flex-wrap gap-2">
									{suggestedPrompts.slice(0, 3).map((prompt, index) => (
										<button
											key={index}
											onClick={() => setInputMessage(prompt)}
											className="text-xs bg-blue-50 text-blue-700 px-2 py-1 rounded hover:bg-blue-100 transition-colors"
										>
											{prompt}
										</button>
									))}
								</div>
							</div>
						)}

						{/* Input */}
						<div className="border-t border-gray-200 p-4">
							<div className="flex space-x-2">
								<textarea
									value={inputMessage}
									onChange={(e) => setInputMessage(e.target.value)}
									onKeyPress={handleKeyPress}
									placeholder="Type your message..."
									className="flex-1 resize-none border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
									rows="2"
								/>
								<button
									onClick={handleSendMessage}
									disabled={!inputMessage.trim() || isTyping}
									className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 text-white rounded-lg px-3 py-2 transition-colors"
								>
									<Send size={16} />
								</button>
							</div>
							<div className="flex justify-between items-center mt-2">
								<button
									onClick={clearChat}
									className="text-xs text-gray-500 hover:text-gray-700"
								>
									Clear chat
								</button>
								<p className="text-xs text-gray-400">
									This is an AI assistant. For emergencies, call 988 or 911.
								</p>
							</div>
						</div>
					</>
				)}
			</div>
		</div>
	);
};

export default MentalHealthChatbot;
